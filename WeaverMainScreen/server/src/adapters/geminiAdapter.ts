import { OrchestratorInput, OrchestratorResult } from '../../../shared/contracts.js';
import { GoogleAuth, JWTInput } from 'google-auth-library';

async function googleAccessToken() {
  const scopes = ['https://www.googleapis.com/auth/cloud-platform'];
  const json = process.env.GEMINI_SERVICE_ACCOUNT_JSON;
  const auth = json ? new GoogleAuth({ credentials: JSON.parse(json) as JWTInput, scopes }) : new GoogleAuth({ scopes });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token || !token.token) throw new Error('Failed to obtain Google access token');
  return token.token as string;
}

export async function runGemini(input: OrchestratorInput & { traceId: string }): Promise<OrchestratorResult> {
  const projectId = input.projectId || process.env.GOOGLE_PROJECT_ID;
  const location = input.location || process.env.GOOGLE_LOCATION || 'us-central1';
  if (!projectId) throw new Error('Missing GOOGLE_PROJECT_ID');
  const token = await googleAccessToken();
  const system = input.messages.find(m => m.role === 'system')?.content;
  const contents = input.messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${input.model}:generateContent`;
  const body: any = { contents, generationConfig: { temperature: input.temperature ?? 0.6, maxOutputTokens: input.maxTokens ?? 600 } };
  if (system) body.systemInstruction = { role: 'system', parts: [{ text: system }] };
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  const txt = await r.clone().text();
  if (!r.ok) {
    let message = txt || r.statusText; try { const j = JSON.parse(txt); message = j?.error?.message || message; } catch {}
    const err: any = new Error(message); err.status = r.status; throw err;
  }
  const data: any = await r.json();
  const content = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('\n') || '';
  return { content, modelUsed: String(input.model), engine: 'gemini', attempts: 1, traceId: input.traceId };
}
