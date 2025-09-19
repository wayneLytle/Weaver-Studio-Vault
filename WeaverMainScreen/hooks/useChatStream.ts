import { getApiBase } from '../services/chatService';
import type { OrchestratorInput } from '../shared/contracts';
import { useRef } from 'react';

export type StreamEvents = {
  onDelta?: (chunk: string) => void;
  onEnd?: (meta: { modelUsed?: string; engine?: string }) => void;
  onError?: (err: string) => void;
};

export function useChatStream() {
  const ctrlRef = useRef<AbortController | null>(null);
  async function stream(input: OrchestratorInput, events: StreamEvents = {}) {
    const base = getApiBase();
    ctrlRef.current?.abort();
    ctrlRef.current = new AbortController();
    const r = await fetch(`${base}/v1/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: ctrlRef.current.signal,
    });
    if (!r.ok || !r.body) {
      const t = await r.text().catch(() => '');
      events.onError?.(t || r.statusText || 'stream_start_failed');
      return;
    }
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Parse simple SSE lines
      let idx;
      while ((idx = buffer.indexOf('\n\n')) >= 0) {
        const raw = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 2);
        if (!raw) continue;
        const lines = raw.split('\n');
        let event = 'message';
        let data = '';
        for (const ln of lines) {
          if (ln.startsWith('event:')) event = ln.slice(6).trim();
          else if (ln.startsWith('data:')) data += ln.slice(5).trim();
        }
        try {
          const payload = data ? JSON.parse(data) : {};
          if (event === 'end') events.onEnd?.(payload);
          else if (event === 'error') events.onError?.(payload?.error || 'stream_error');
          else if (payload?.delta) events.onDelta?.(payload.delta);
        } catch {
          // fallback: treat as text delta
          if (event !== 'end' && event !== 'error') events.onDelta?.(data || raw);
        }
      }
    }
  }
  function cancel() {
    try { ctrlRef.current?.abort(); } catch {}
  }
  return { stream, cancel };
}
