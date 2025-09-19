import type { TaskManifest, PersonaProfile } from '../shared/contracts';

export type AiManifest = {
  routing?: { [intent: string]: { engine?: 'openai' | 'gemini'; model?: string } };
};
export type ContributorManifest = Record<string, any>;
export type InteractionManifest = Record<string, any>;
export type LayoutManifest = Record<string, any>;
export type OfflineManifest = Record<string, any>;
export type PersonaManifest = { persona?: PersonaProfile; task?: TaskManifest } & Record<string, any>;

export type LoadedManifests = {
  ai?: AiManifest;
  contributor?: ContributorManifest;
  interaction?: InteractionManifest;
  layout?: LayoutManifest;
  offline?: OfflineManifest;
  persona?: PersonaManifest;
};

let cache: LoadedManifests | null = null;

export async function loadManifests(): Promise<LoadedManifests> {
  if (cache) return cache;
  // Bundle-time import of JSON manifests via Vite
  const mods = import.meta.glob('../New .Json/*.json', { eager: true }) as Record<string, any>;
  const byName = (name: string) => {
    const entry = Object.entries(mods).find(([p]) => p.endsWith(`/New .Json/${name}`));
    return (entry?.[1]?.default ?? entry?.[1]) as any | undefined;
  };
  const ai = byName('ai.manifest.json') as AiManifest | undefined;
  const contributor = byName('contributor.manifest.json') as ContributorManifest | undefined;
  const interaction = byName('interaction.manifest.json') as InteractionManifest | undefined;
  const layout = byName('layout.manifest.json') as LayoutManifest | undefined;
  const offline = byName('offline.manifest.json') as OfflineManifest | undefined;
  const persona = byName('persona.manifest.json') as PersonaManifest | undefined;
  cache = { ai, contributor, interaction, layout, offline, persona };
  return cache;
}

export function getCachedManifests() { return cache; }
