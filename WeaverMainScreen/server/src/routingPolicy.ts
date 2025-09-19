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

// Lightweight intent-based routing using existing providers only
// persona/editorial -> openai, tone/threading -> gemini, default -> openai
export function selectEngineByIntent(intent?: string): 'openai' | 'gemini' {
  const key = (intent || '').toLowerCase().trim();
  if (key === 'persona' || key === 'editorial') return 'openai';
  if (key === 'tone' || key === 'threading') return 'gemini';
  return 'openai';
}
