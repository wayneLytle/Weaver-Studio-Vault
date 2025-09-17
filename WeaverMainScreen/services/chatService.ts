import type { OrchestratorInput, OrchestratorResult } from '../shared/contracts';

const rawBase = (import.meta.env?.VITE_API_BASE || import.meta.env?.VITE_API_BASE_URL || '').trim();
const API_BASE = (rawBase ? rawBase : 'http://localhost:4101').replace(/\/$/, '');

export async function chat(input: OrchestratorInput, signal?: AbortSignal): Promise<OrchestratorResult> {
  const r = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });
  if (!r.ok) {
    const text = await r.text();
    try { const j = JSON.parse(text); throw new Error(j.error || text); } catch {
      throw new Error(text || r.statusText);
    }
  }
  return r.json();
}
