export type Role = 'system' | 'user' | 'assistant';

export interface ChatCompletionMessage {
  role: Role;
  content: string;
}

import { normalizeOpenAIModel, OPENAI_FALLBACK_MODEL } from './modelRegistry';

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function chatCompletion(
  messages: ChatCompletionMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const { model } = normalizeOpenAIModel(options.model ?? OPENAI_FALLBACK_MODEL);
  const temperature = options.temperature ?? 0.6;
  const maxTokens = options.maxTokens ?? 400;
  const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4101';
  const resp = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engine: 'openai', model, temperature, maxTokens, messages })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Backend error ${resp.status}: ${text || resp.statusText}`);
  }
  const data = await resp.json();
  if (data?.modelUsed) console.log(`[openaiService] modelUsed: ${data.modelUsed}`);
  const content: string | undefined = data?.content ?? data?.result?.data?.json?.content;
  return (content ?? '').trim();
}

export function buildSystemInstruction(userName?: string): string {
  const namePart = userName ? `Address the user as ${userName}.` : '';
  return [
    'You are a precise, efficient assistant embedded in a steampunk-themed UI.',
    'Keep responses concise, actionable, and friendly. Use short paragraphs.',
    'Avoid profanity. Mirror a confident, helpful tone.',
    namePart,
  ].filter(Boolean).join(' ');
}
