export const OPENAI_ALLOWED_MODELS = [
  'gpt-5',
  'gpt-5-mini',
  'gpt-4.1-mini',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4o-realtime-preview',
] as const;

export type OpenAIModel = typeof OPENAI_ALLOWED_MODELS[number];

export const OPENAI_FALLBACK_MODEL: OpenAIModel = 'gpt-5-mini';

export function normalizeOpenAIModel(requested?: string) {
  const fallback = OPENAI_FALLBACK_MODEL;
  if (!requested) return { model: fallback, requested, isFallback: true };
  const req = requested.trim();
  const allowed = (OPENAI_ALLOWED_MODELS as readonly string[]).includes(req);
  return { model: allowed ? req : fallback, requested: req, isFallback: !allowed };
}
