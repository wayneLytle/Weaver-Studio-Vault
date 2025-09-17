import OpenAI from 'openai';
import { OrchestratorInput, OrchestratorResult } from '../../../shared/contracts.js';

export async function runOpenAI(input: OrchestratorInput & { traceId: string }): Promise<OrchestratorResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const isGpt5 = String(input.model).startsWith('gpt-5');
  const params: any = {
    model: input.model,
    messages: input.messages,
  };
  if (!isGpt5) params.temperature = input.temperature ?? 0.6;
  if (isGpt5) params.max_completion_tokens = input.maxTokens ?? 600; else params.max_tokens = input.maxTokens ?? 600;
  const r = await client.chat.completions.create(params);
  const content = r.choices?.[0]?.message?.content?.trim() ?? '';
  return {
    content,
    modelUsed: String(input.model),
    engine: 'openai',
    attempts: 1,
    traceId: input.traceId,
  };
}
