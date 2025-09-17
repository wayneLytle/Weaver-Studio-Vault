import OpenAI from 'openai';
import type { ChatFactoryOptions, ChatSession, Message } from '../index';

// Meta LLaMA 4 via OpenRouter (OpenAI-compatible)
export function makeLlama(opts: ChatFactoryOptions): ChatSession {
  const apiKey = opts.apiKeys?.openrouter ?? (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined);
  if (!apiKey) throw new Error('Missing OpenRouter API key');

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  } as any);
  const model = opts.model ?? 'meta-llama/llama-4';

  return {
    async send(message: Message) {
      const res = await client.chat.completions.create({
        model,
        messages: [
          { role: 'user', content: message.content },
        ],
      });
      const content = res.choices[0]?.message?.content ?? '';
      return { role: 'assistant', content };
    },
  };
}
