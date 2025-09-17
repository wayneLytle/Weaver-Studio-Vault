import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatFactoryOptions, ChatSession, Message } from '../index';

export function makeGoogle(opts: ChatFactoryOptions): ChatSession {
  const apiKey = opts.apiKeys?.google ?? (import.meta.env.VITE_GEMINI_API_KEY as string | undefined);
  if (!apiKey) throw new Error('Missing Google (Gemini) API key');

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = opts.model ?? 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({ model: modelName });

  return {
    async send(message: Message) {
      const chat = model.startChat();
      const res = await chat.sendMessage(message.content);
      const text = await res.response.text();
      return { role: 'assistant', content: text };
    },
  };
}
