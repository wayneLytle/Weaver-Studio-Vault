import { useCallback, useEffect, useState } from 'react';
import type { AiEngine } from '../types';

const KEY = 'wms-engine-map';

function readMap(): Record<string, AiEngine> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, AiEngine>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {}
}

export function useEngine(containerId: string, fallback: AiEngine = 'openai') {
  const [engine, setEngineState] = useState<AiEngine>(() => readMap()[containerId] ?? fallback);

  // Keep in sync if other tabs change it
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        const map = readMap();
        if (map[containerId] && map[containerId] !== engine) setEngineState(map[containerId]);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [containerId, engine]);

  const setEngine = useCallback((next: AiEngine) => {
    setEngineState(next);
    const map = readMap();
    map[containerId] = next;
    writeMap(map);
  }, [containerId]);

  return [engine, setEngine] as const;
}
