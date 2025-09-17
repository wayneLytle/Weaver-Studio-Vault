import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type TrackKey = 'room' | 'footsteps' | 'music';

type UseAmbientAudioOptions = {
  enabled: boolean;
  volumes?: Partial<Record<TrackKey, number>>;
  crossfadeMs?: number;
  // Provide custom sources per track; if omitted, defaults are used.
  // You can pass a single path or an ordered list of fallbacks.
  sources?: Partial<Record<TrackKey, string | string[]>>;
};

const DEFAULT_SOURCES: Record<TrackKey, string> = {
  room: '/audio/typewriter-room.mp3',
  footsteps: '/audio/distant-footsteps.mp3',
  music: '/audio/biohazard-theme.mp3',
};

export function useAmbientAudio(options: UseAmbientAudioOptions) {
  const { enabled, crossfadeMs = 800 } = options;
  const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.MODE !== 'production';
  const sourceMap = useMemo<Partial<Record<TrackKey, string | string[]>>>(
    () => (options.sources ? options.sources : DEFAULT_SOURCES),
    [options.sources]
  );
  const activeKeys = useMemo<TrackKey[]>(() => {
    const keys = Object.keys(sourceMap) as TrackKey[];
    // If no custom sources specified, fall back to all defaults
    return keys.length ? keys : (Object.keys(DEFAULT_SOURCES) as TrackKey[]);
  }, [sourceMap]);
  const desiredVolumes = useMemo(() => {
    const base: Partial<Record<TrackKey, number>> = { room: 0.14, footsteps: 0.08, music: 0.06 };
    return { ...base, ...(options.volumes || {}) } as Partial<Record<TrackKey, number>>;
  }, [options.volumes]);

  const audioEls = useRef<Record<TrackKey, HTMLAudioElement | null>>({
    room: null,
    footsteps: null,
    music: null,
  });
  const rafRef = useRef<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const lastEnabledRef = useRef<boolean>(false);
  const overridesRef = useRef<Partial<Record<TrackKey, number>>>({});

  // Create audio elements lazily
  const pickCandidate = (candidates: string[]): string => {
    // Naive selection: prefer by canPlayType when possible
    const test = new Audio();
    const mimeFor = (p: string) => {
      const lower = p.toLowerCase();
      if (lower.endsWith('.mp3')) return 'audio/mpeg';
      if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) return 'audio/mp4';
      if (lower.endsWith('.ogg') || lower.endsWith('.oga')) return 'audio/ogg';
      if (lower.endsWith('.wav')) return 'audio/wav';
      return '';
    };
    for (const c of candidates) {
      const mime = mimeFor(c);
      if (!mime) continue;
      const can = test.canPlayType(mime);
      if (can) {
        if (isDev) console.debug('[ambient] canPlayType', mime, '=>', can, 'selected', c);
        return c;
      }
    }
    return candidates[0] || '';
  };

  const ensureAudio = useCallback(() => {
    activeKeys.forEach((k) => {
      if (!audioEls.current[k]) {
        const a = new Audio();
        const spec = sourceMap[k] ?? DEFAULT_SOURCES[k];
        const candidates = Array.isArray(spec) ? spec : [spec];
        const chosen = pickCandidate(candidates);
        a.src = chosen;
        a.loop = true;
        a.preload = 'auto';
        a.volume = 0;
        a.crossOrigin = 'anonymous';
        if (isDev) console.debug('[ambient] created element for', k, 'src:', chosen);
        a.addEventListener('error', (ev) => {
          if (!isDev) return;
          const err = (a as any).error;
          console.warn('[ambient] audio error on', k, 'code:', err?.code, 'src:', a.src);
        });
        audioEls.current[k] = a;
      }
    });
    setReady(true);
  }, [activeKeys, sourceMap]);

  // Unlock policy: first user interaction enables play()
  useEffect(() => {
    ensureAudio();
    if (unlocked) return;
    const handler = () => {
      setUnlocked(true);
    };
    const events: Array<keyof DocumentEventMap> = [
      'pointerdown',
      'keydown',
      'wheel',
      'touchstart',
    ];
    events.forEach((ev) => document.addEventListener(ev, handler, { once: true } as any));
    return () => {
      events.forEach((ev) => document.removeEventListener(ev, handler as any));
    };
  }, [ensureAudio, unlocked]);

  // Smoothly fade a track to a target volume
  const fadeTo = useCallback(
    (key: TrackKey, target: number, durationMs: number) => {
      const el = audioEls.current[key];
      if (!el) return;
      const start = el.volume;
      const dV = target - start;
      const startTs = performance.now();
      if (isDev) console.debug('[ambient] fadeTo', key, 'from', start.toFixed(3), 'to', target.toFixed(3), 'ms', durationMs);
      const step = (ts: number) => {
        const t = Math.min(1, (ts - startTs) / Math.max(1, durationMs));
        el.volume = Math.min(1, Math.max(0, start + dV * t));
        if (t < 1) rafRef.current = requestAnimationFrame(step);
      };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(step);
    },
    []
  );

  // Start all tracks if needed
  const startIfNeeded = useCallback(async () => {
    for (const k of activeKeys) {
      const el = audioEls.current[k];
      if (!el) continue;
      try {
        // On some browsers, calling play repeatedly is okay; guard with paused
        if (el.paused) {
          if (isDev) console.debug('[ambient] attempting play()', k);
          await el.play();
          if (isDev) console.debug('[ambient] play() started', k);
        }
      } catch (e) {
        // Autoplay blocked; will retry on next interaction
        if (isDev) console.warn('[ambient] play() failed for', k, e);
      }
    }
  }, [activeKeys]);

  // Main effect: reflect enabled state with crossfades
  useEffect(() => {
    if (!ready) return;
    if (enabled && unlocked) {
      startIfNeeded();
      activeKeys.forEach((k) => {
        const base = (desiredVolumes as any)[k] ?? 0;
        const override = overridesRef.current[k];
        const vol = typeof override === 'number' ? override : base;
        fadeTo(k, vol as number, crossfadeMs);
      });
    } else {
      activeKeys.forEach((k) => fadeTo(k, 0, crossfadeMs));
    }
    lastEnabledRef.current = enabled;
  }, [enabled, unlocked, ready, desiredVolumes, crossfadeMs, startIfNeeded, fadeTo, activeKeys]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      (Object.keys(audioEls.current) as TrackKey[]).forEach((k) => {
        const el = audioEls.current[k];
        if (el) {
          try {
            el.pause();
          } catch {}
        }
      });
    };
  }, []);

  // Public API
  const setVolume = useCallback((key: TrackKey, vol: number) => {
    overridesRef.current[key] = Math.min(1, Math.max(0, vol));
    const el = audioEls.current[key];
    if (el) el.volume = overridesRef.current[key]!;
    if (isDev) console.debug('[ambient] setVolume override', key, overridesRef.current[key]);
  }, [isDev]);

  return {
    unlocked,
    ready,
    setVolume,
    isPlaying: enabled && unlocked,
  };
}

export default useAmbientAudio;
