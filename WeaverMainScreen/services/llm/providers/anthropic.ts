import Anthropic from '@anthropic-ai/sdk';
import type { ChatFactoryOptions, ChatSession, Message } from '../index';

export function makeAnthropic(opts: ChatFactoryOptions): ChatSession {
  const apiKey = opts.apiKeys?.anthropic ?? (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined);
  if (!apiKey) throw new Error('Missing Anthropic API key');

  const client = new Anthropic({ apiKey });
  const model = opts.model ?? 'claude-3-5-sonnet-20240620';

  return {
    async send(message: Message) {
      const res = await client.messages.create({
        model,
        max_tokens: 1024,
        messages: [
          { role: 'user', content: message.content },
        ],
      });
      const content = res.content[0]?.type === 'text' ? res.content[0].text : '';
      return { role: 'assistant', content };
    },
  };
}
