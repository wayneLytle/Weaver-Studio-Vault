import { createChatSession, type ChatFactoryOptions, type EngineId, type ChatSession } from './index';

export type FeatureKey = 'default' | 'chat' | 'editor' | 'review' | string;

const featureEngines = new Map<FeatureKey, EngineId>();
featureEngines.set('default', 'google:gemini-2.5-pro');

export function setEngine(feature: FeatureKey, engine: EngineId) {
  featureEngines.set(feature, engine);
}

export function getEngine(feature: FeatureKey): EngineId {
  return featureEngines.get(feature) ?? featureEngines.get('default')!;
}

export function envKeysFromViteEnv(): ChatFactoryOptions['apiKeys'] {
  return {
    openai: (import.meta.env.VITE_OPENAI_API_KEY as string | undefined),
    anthropic: (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined),
    google: (import.meta.env.VITE_GEMINI_API_KEY as string | undefined),
    xai: (import.meta.env.VITE_XAI_API_KEY as string | undefined),
    openrouter: (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined),
    deepseek: (import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined),
  };
}

export async function createFeatureChat(feature: FeatureKey, overrides?: Partial<ChatFactoryOptions>): Promise<ChatSession> {
  const engine = overrides?.engine ?? getEngine(feature);
  return createChatSession({
    engine,
    apiKeys: overrides?.apiKeys ?? envKeysFromViteEnv(),
    model: overrides?.model,
    baseUrls: overrides?.baseUrls,
  });
}
