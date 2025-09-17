import OpenAI from 'openai';
import type { ChatFactoryOptions, ChatSession, Message } from '../index';

// DeepSeek OpenAI-compatible endpoint
export function makeDeepSeek(opts: ChatFactoryOptions): ChatSession {
  const apiKey = opts.apiKeys?.deepseek ?? (import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined);
  if (!apiKey) throw new Error('Missing DeepSeek API key');

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  } as any);
  const model = opts.model ?? 'deepseek-reasoner'; // DeepSeek R1 family

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
