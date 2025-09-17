import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import { GoogleAuth, JWTInput } from 'google-auth-library';
import { buildSystemInstruction } from './persona.js';
import { getLastTrace, recordTrace } from './trace.js';
import fs from 'fs/promises';
import path from 'path';
import { orchestrate } from './orchestrator.js';
import { OrchestratorInput } from '../../shared/contracts';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

// Lazy creation inside route to avoid boot-time key requirement

function now() { return new Date().toISOString(); }
const preview = (s?: string) => (s || '').replace(/\s+/g, ' ').slice(0, 120);

async function googleAccessToken() {
  const scopes = ['https://www.googleapis.com/auth/cloud-platform'];
  const json = process.env.GEMINI_SERVICE_ACCOUNT_JSON;
  let auth: GoogleAuth;
  if (json) auth = new GoogleAuth({ credentials: JSON.parse(json) as JWTInput, scopes });
  else auth = new GoogleAuth({ scopes });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token || !token.token) throw new Error('Failed to obtain Google access token');
  return token.token as string;
}

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true, ts: now() }));
app.get('/trace/last', (req: Request, res: Response) => res.json(getLastTrace(Number((req.query as any).n ?? 1))));

// Unified chat endpoint using orchestration layer
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const body = req.body as OrchestratorInput;
    const result = await orchestrate(body);
    if (result.error) return res.status(result.status ?? 500).json(result);
    res.json(result);
  } catch (err: any) {
    const status = err?.status || 500; const message = err?.message || 'Orchestration failed';
    recordTrace({ ts: now(), svc: 'orchestrator', event: 'route_error', status, message });
    res.status(status).json({ error: message, status });
  }
});


app.post('/test/openai', (_req: Request, res: Response) => {
  res.json({ content: 'Hello from OpenAI route test' });
});
app.post('/test/gemini', (_req: Request, res: Response) => {
  res.json({ content: 'Hello from Gemini route test.' });
});

// Simple GET self-tests that perform real upstream calls for quick verification
app.get('/selftest/openai', async (req: Request, res: Response) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    const model = (req.query.model as string) || 'gpt-5-mini';
    const instruction = 'You are a terse test assistant.';
    const mergedSystem = buildSystemInstruction(instruction, undefined, undefined);
    const payload = [
      { role: 'system', content: mergedSystem },
      { role: 'user', content: 'Reply with the token OPENAI_OK only.' }
    ];
    const isGpt5 = String(model).startsWith('gpt-5');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const params: any = { model, messages: payload };
    if (!isGpt5) params.temperature = 0.2;
    if (isGpt5) params.max_completion_tokens = 60; else params.max_tokens = 60;

    recordTrace({ ts: now(), svc: 'openai', event: 'selftest_request', model, parts: payload.length });
    const r = await openai.chat.completions.create(params);
    const content = r.choices?.[0]?.message?.content?.trim() ?? '';
    recordTrace({ ts: now(), svc: 'openai', event: 'selftest_response', model, chars: content.length, summary: preview(content) });
    res.json({ model, content });
  } catch (err: any) {
    const status = err?.status || 400; const message = err?.message || 'OpenAI selftest failed';
    recordTrace({ ts: now(), svc: 'openai', event: 'selftest_error', status, message });
    res.status(status).json({ error: message, status });
  }
});

app.get('/selftest/gemini', async (req: Request, res: Response) => {
  try {
    const model = (req.query.model as string) || 'gemini-2.5-flash';
    const projectId = process.env.GOOGLE_PROJECT_ID;
    const location = process.env.GOOGLE_LOCATION || 'us-central1';
    if (!projectId) return res.status(500).json({ error: 'Missing GOOGLE_PROJECT_ID' });
    const token = await googleAccessToken();

    const instruction = 'You are a terse test assistant.';
    const mergedSystem = buildSystemInstruction(instruction, undefined, undefined);
    const contents = [
      { role: 'user', parts: [{ text: 'Reply with the token GEMINI_OK only.' }] }
    ];
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
    const body: any = { contents, generationConfig: { temperature: 0.2, maxOutputTokens: 60 } };
    if (mergedSystem) body.systemInstruction = { role: 'system', parts: [{ text: mergedSystem }] };
    recordTrace({ ts: now(), svc: 'gemini', event: 'selftest_request', model, projectId, location });
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const txt = await r.clone().text();
    if (!r.ok) {
      let message = txt || r.statusText; try { const j = JSON.parse(txt); message = j?.error?.message || message; } catch {}
      const status = r.status; recordTrace({ ts: now(), svc: 'gemini', event: 'selftest_error', status, message });
      return res.status(status).json({ error: message, status });
    }
    const data: any = await r.json();
    const content = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('\n') || '';
    recordTrace({ ts: now(), svc: 'gemini', event: 'selftest_response', model, chars: content.length, summary: preview(content) });
    res.json({ model, content });
  } catch (err: any) {
    const status = err?.status || 400; const message = err?.message || 'Gemini selftest failed';
    recordTrace({ ts: now(), svc: 'gemini', event: 'selftest_error', status, message });
    res.status(status).json({ error: message, status });
  }
});

const port = Number(process.env.PORT ?? 4101);
app.listen(port, async () => {
  console.log(`[weaver-main-server] http://localhost:${port}`);
  // Kick off boot self-tests without blocking the server
  setTimeout(() => runBootSelfTests().catch(err => console.error('Boot selftests failed:', err?.message || err)), 200);
});

async function runBootSelfTests() {
  const results: any = { ts: now(), openai: {}, gemini: {} };
  // OpenAI test
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');
    for (const model of ['gpt-5-mini', 'gpt-4o-mini']) {
      try {
        const mergedSystem = buildSystemInstruction('You are terse.', undefined, undefined);
        const payload = [
          { role: 'system', content: mergedSystem },
          { role: 'user', content: `Say OPENAI_OK for ${model}.` }
        ];
        const isGpt5 = String(model).startsWith('gpt-5');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const params: any = { model, messages: payload };
        if (!isGpt5) params.temperature = 0.2;
        if (isGpt5) params.max_completion_tokens = 60; else params.max_tokens = 60;
        const r = await openai.chat.completions.create(params);
        const content = r.choices?.[0]?.message?.content?.trim() ?? '';
        results.openai[model] = { ok: true, len: content.length, preview: preview(content) };
      } catch (e: any) {
        results.openai[model] = { ok: false, error: e?.message || String(e) };
      }
    }
  } catch (err: any) {
    results.openai = { ok: false, error: err?.message || String(err) };
  }
  // Gemini test
  try {
    const projectId = process.env.GOOGLE_PROJECT_ID;
    const location = process.env.GOOGLE_LOCATION || 'us-central1';
    if (!projectId) throw new Error('Missing GOOGLE_PROJECT_ID');
    const token = await googleAccessToken();
    for (const model of ['gemini-2.5-flash', 'gemini-2.5-pro']) {
      try {
        const contents = [ { role: 'user', parts: [{ text: `Say GEMINI_OK for ${model}.` }] } ];
        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
        const body: any = { contents, generationConfig: { temperature: 0.2, maxOutputTokens: 60 } };
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
        const txt = await r.clone().text();
        if (!r.ok) {
          let message = txt || r.statusText; try { const j = JSON.parse(txt); message = j?.error?.message || message; } catch {}
          results.gemini[model] = { ok: false, status: r.status, error: message };
        } else {
          const data: any = await r.json();
          const content = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('\n') || '';
          results.gemini[model] = { ok: true, len: content.length, preview: preview(content) };
        }
      } catch (e: any) {
        results.gemini[model] = { ok: false, error: e?.message || String(e) };
      }
    }
  } catch (err: any) {
    results.gemini = { ok: false, error: err?.message || String(err) };
  }
  try {
    const outPath = path.join(process.cwd(), 'selftest-results.json');
    await fs.writeFile(outPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log('Selftest results written to', outPath);
  } catch (e) {
    console.warn('Failed to write selftest results:', e);
  }
}
