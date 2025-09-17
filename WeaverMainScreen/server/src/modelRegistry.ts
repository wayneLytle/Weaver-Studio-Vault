export const OpenAIModels = [
  'gpt-5',
  'gpt-5-mini',
  'gpt-4o',
  'gpt-4o-mini',
] as const;

export const GeminiModels = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
] as const;

export type OpenAIModel = typeof OpenAIModels[number];
export type GeminiModel = typeof GeminiModels[number];

export function normalizeOpenAIModel(requested?: string): { model: OpenAIModel; isFallback: boolean } {
  const fallback: OpenAIModel = 'gpt-4o-mini';
  if (!requested) return { model: fallback, isFallback: true };
  const req = requested.trim();
  return (OpenAIModels as readonly string[]).includes(req) ? { model: req as OpenAIModel, isFallback: false } : { model: fallback, isFallback: true };
}

export function normalizeGeminiModel(requested?: string): { model: GeminiModel; isFallback: boolean } {
  const fallback: GeminiModel = 'gemini-2.5-flash';
  if (!requested) return { model: fallback, isFallback: true };
  const req = requested.trim();
  return (GeminiModels as readonly string[]).includes(req) ? { model: req as GeminiModel, isFallback: false } : { model: fallback, isFallback: true };
}
