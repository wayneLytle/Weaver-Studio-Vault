export type EngineId =
  | 'openai:gpt-5'
  | 'openai:gpt-5-mini'
  | 'openai:gpt-4.1-mini'
  | 'openai:gpt-4o'
  | 'openai:gpt-4o-mini'
  | 'openai:gpt-4o-realtime-preview'
  | 'anthropic:claude-4'
  | 'google:gemini-2.5-pro'
  | 'xai:grok-3'
  | 'meta:llama-4'
  | 'deepseek:r1';

export type Message = { role: 'user' | 'assistant' | 'system'; content: string };

export interface ChatSession {
  send(message: Message): Promise<Message>;
  sendBatch?(messages: Message[]): Promise<Message>;
  close?(): Promise<void> | void;
}

export interface ChatFactoryOptions {
  engine: EngineId;
  apiKeys?: Partial<{
    openai: string;
    anthropic: string;
    google: string;
    xai: string;
    openrouter: string; // for Meta LLaMA via OpenRouter
    deepseek: string;
  }>;
  // Optional override: model name string per engine
  model?: string;
  // Optional: base URLs for OpenAI-compatible endpoints
  baseUrls?: Partial<{
    xai: string;
    openrouter: string;
    deepseek: string;
  }>;
}

export async function createChatSession(options: ChatFactoryOptions): Promise<ChatSession> {
  const { engine } = options;
  if (engine.startsWith('openai:')) {
    const { makeOpenAI } = await import('./providers/openai.ts');
    return makeOpenAI(options);
  }
  if (engine.startsWith('anthropic:')) {
    const { makeAnthropic } = await import('./providers/anthropic.ts');
    return makeAnthropic(options);
  }
  if (engine.startsWith('google:')) {
    const { makeGoogle } = await import('./providers/google.ts');
    return makeGoogle(options);
  }
  if (engine.startsWith('xai:')) {
    const { makeXAI } = await import('./providers/xai.ts');
    return makeXAI(options);
  }
  if (engine.startsWith('meta:')) {
    const { makeLlama } = await import('./providers/llama.ts');
    return makeLlama(options);
  }
  if (engine.startsWith('deepseek:')) {
    const { makeDeepSeek } = await import('./providers/deepseek.ts');
    return makeDeepSeek(options);
  }
  throw new Error(`Unsupported engine: ${engine}`);
}
