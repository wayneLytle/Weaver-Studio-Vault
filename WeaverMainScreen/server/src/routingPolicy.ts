import { normalizeOpenAIModel, normalizeGeminiModel } from './modelRegistry.js';

export function selectEngineAndModel(engine?: 'openai'|'gemini', model?: string) {
  if (engine === 'gemini') {
    const { model: m, isFallback } = normalizeGeminiModel(model);
    return { engine: 'gemini' as const, model: m, isFallback };
  }
  const { model: m, isFallback } = normalizeOpenAIModel(model);
  return { engine: 'openai' as const, model: m, isFallback };
}

export function fallbackFor(engine: 'openai'|'gemini', currentModel: string) {
  if (engine === 'openai') {
    return currentModel === 'gpt-4o-mini' ? 'gpt-4o' : 'gpt-4o-mini';
  }
  return currentModel === 'gemini-2.5-flash' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
}

export const retryPolicy = { maxAttempts: 2, backoffMs: 250 };
