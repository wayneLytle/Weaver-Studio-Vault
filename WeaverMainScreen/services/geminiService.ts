import { chat } from './chatService';
import type { PromptMessage } from '../shared/contracts';

// Proxy-only Gemini service: uses Gateway; no client-side keys/SDKs
export type GeminiChatSession = {
  send: (text: string) => Promise<string>;
};

const baseInstruction = `You are a helpful assistant. Keep responses concise and actionable.`;

export const createChatSession = (userName?: string): GeminiChatSession => {
  const systemInstruction = [
    baseInstruction,
    userName ? `Address the user as ${userName}.` : ''
  ].filter(Boolean).join(' ');

  return {
    async send(text: string) {
      const messages: PromptMessage[] = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: text }
      ];
      const res = await chat({ engine: 'gemini', messages });
      return res.content;
    }
  };
};