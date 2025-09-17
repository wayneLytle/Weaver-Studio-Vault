import OpenAI from 'openai';
import type { ChatFactoryOptions, ChatSession, Message } from '../index';

// xAI Grok-compatible OpenAI API (OpenAI SDK with baseURL)
export function makeXAI(opts: ChatFactoryOptions): ChatSession {
  const apiKey = opts.apiKeys?.xai ?? (import.meta.env.VITE_XAI_API_KEY as string | undefined);
  if (!apiKey) throw new Error('Missing xAI API key');

  const client = new OpenAI({
    apiKey,
    baseURL: opts.baseUrls?.xai ?? (import.meta.env.VITE_XAI_BASE_URL as string | undefined) ?? 'https://api.x.ai/v1',
  } as any);
  const model = opts.model ?? 'grok-3';

  return {
    async send(message: Message) {
      const res = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are Grok, concise and direct.' },
          { role: 'user', content: message.content },
        ],
      });
      const content = res.choices[0]?.message?.content ?? '';
      return { role: 'assistant', content };
    },
  };
}
