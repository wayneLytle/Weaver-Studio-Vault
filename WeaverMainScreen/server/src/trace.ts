export type TraceEvent = { ts: string; svc: string; event: string; [k: string]: any };
const MAX_TRACE = 200;
const buf: TraceEvent[] = [];
export function recordTrace(evt: TraceEvent) {
  const redacted = JSON.parse(JSON.stringify(evt));
  for (const k of Object.keys(redacted)) {
    if (typeof redacted[k] === 'string' && /key|token|secret|password/i.test(k)) {
      redacted[k] = '[redacted]';
    }
  }
  buf.push(redacted); if (buf.length > MAX_TRACE) buf.shift();
}
export function getLastTrace(n = 1) { return buf.slice(-Math.max(1, Math.min(n, MAX_TRACE))); }
