import 'dotenv/config';
import OpenAI from 'openai';
import { GoogleAuth, JWTInput } from 'google-auth-library';
import fs from 'fs/promises';
import path from 'path';

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

async function run() {
  const results: any = { ts: now(), openai: {}, gemini: {} };
  // OpenAI
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');
    for (const model of ['gpt-5-mini', 'gpt-4o-mini']) {
      try {
        const isGpt5 = String(model).startsWith('gpt-5');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const params: any = {
          model,
          messages: [
            { role: 'system', content: 'You are terse.' },
            { role: 'user', content: `Reply with OPENAI_OK for ${model}.` },
          ]
        };
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

  // Gemini
  try {
    const projectId = process.env.GOOGLE_PROJECT_ID;
    const location = process.env.GOOGLE_LOCATION || 'us-central1';
    if (!projectId) throw new Error('Missing GOOGLE_PROJECT_ID');
    const token = await googleAccessToken();
    for (const model of ['gemini-2.5-flash', 'gemini-2.5-pro']) {
      try {
        const contents = [ { role: 'user', parts: [{ text: `Reply with GEMINI_OK for ${model}.` }] } ];
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

  const outPath = path.join(process.cwd(), 'selftest-results.json');
  await fs.writeFile(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log('Wrote selftest results to', outPath);
  console.log(JSON.stringify(results, null, 2));
}

run().catch((e) => {
  console.error('Selftest failed:', e?.message || e);
  process.exit(1);
});
