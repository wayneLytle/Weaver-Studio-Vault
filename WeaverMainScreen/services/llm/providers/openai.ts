import type { ChatFactoryOptions, ChatSession, Message } from '../index';
import { normalizeOpenAIModel, OPENAI_FALLBACK_MODEL } from '../../modelRegistry';

export function makeOpenAI(opts: ChatFactoryOptions): ChatSession {
  const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4101';
  const engineSuffix = (opts.engine.split(':')[1] || '').trim();
  const requested = opts.model ?? (engineSuffix.startsWith('gpt') ? engineSuffix : OPENAI_FALLBACK_MODEL);
  const { model } = normalizeOpenAIModel(requested);

  return {
    async send(message: Message) {
      const payload = {
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: message.role, content: message.content },
        ],
      };
      const resp = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine: 'openai', ...payload }),
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Backend error ${resp.status}: ${text || resp.statusText}`);
      }
      const data = await resp.json();
      const content: string = data?.content ?? '';
      return { role: 'assistant', content };
    },
  };
}
