import { OrchestratorInput, OrchestratorResult, PromptMessage } from '../../shared/contracts';
import { buildSystemInstruction } from './persona.js';
import { recordTrace } from './trace.js';
import { selectEngineAndModel, fallbackFor, retryPolicy, selectEngineByIntent } from './routingPolicy.js';
import { runOpenAI } from './adapters/openaiAdapter.js';
import { runGemini } from './adapters/geminiAdapter.js';

function now() { return new Date().toISOString(); }
const preview = (s?: string) => (s || '').replace(/\s+/g, ' ').slice(0, 160);

export async function orchestrate(input: OrchestratorInput): Promise<OrchestratorResult> {
  const traceId = input.traceId || Math.random().toString(36).slice(2);
  // Honor explicit engine; otherwise choose by lightweight intent routing
  const routedEngine = input.engine || selectEngineByIntent(input.persona?.taskManifest?.intent);
  const { engine, model } = selectEngineAndModel(routedEngine, input.model);
  const sysBase = input.systemInstruction || input.messages.find(m => m.role === 'system')?.content;
  const system = buildSystemInstruction(sysBase, input.persona?.userProfile, input.persona?.taskManifest);

  const history: PromptMessage[] = [{ role: 'system', content: system }, ...input.messages.filter(m => m.role !== 'system')];
  recordTrace({ ts: now(), svc: 'orchestrator', event: 'request', traceId, engine, model, personaPreview: preview(system), parts: history.length });

  let attempts = 0;
  let currentModel: string = model;
  let lastErr: any;

  while (attempts < retryPolicy.maxAttempts) {
    attempts++;
    recordTrace({ ts: now(), svc: 'orchestrator', event: 'attempt', traceId, attempt: attempts, engine, model: currentModel });
    try {
      const execInput = { ...input, engine, model: currentModel, messages: history, traceId };
      const res = engine === 'openai' ? await runOpenAI(execInput) : await runGemini(execInput);
      if (!res.content?.trim()) {
        recordTrace({ ts: now(), svc: 'orchestrator', event: 'empty_content', traceId, attempt: attempts, engine, model: currentModel });
        currentModel = fallbackFor(engine, currentModel);
      } else {
        recordTrace({ ts: now(), svc: 'orchestrator', event: 'response', traceId, attempt: attempts, engine, model: res.modelUsed, chars: res.content.length, summary: preview(res.content) });
        return { ...res, attempts, traceId };
      }
    } catch (err: any) {
      lastErr = err;
      recordTrace({ ts: now(), svc: 'orchestrator', event: 'error', traceId, attempt: attempts, engine, model: currentModel, status: err?.status, message: err?.message });
      currentModel = fallbackFor(engine, currentModel);
    }
    await new Promise(r => setTimeout(r, retryPolicy.backoffMs));
  }

  const status = lastErr?.status || 502;
  const error = lastErr?.message || 'Upstream error after retries';
  return { content: '', modelUsed: currentModel, engine, attempts, traceId, status, error };
}
