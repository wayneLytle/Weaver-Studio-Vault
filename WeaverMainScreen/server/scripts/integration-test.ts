import 'dotenv/config';
import { spawn } from 'child_process';
import path from 'path';

async function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
async function waitForHealth(url: string, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch {}
    await delay(500);
  }
  throw new Error('Server did not become healthy in time');
}

async function postJson(url: string, body: any) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const txt = await r.text();
  let json: any;
  try { json = JSON.parse(txt); } catch { json = { text: txt }; }
  return { ok: r.ok, status: r.status, json };
}

async function run() {
  const port = Number(process.env.PORT ?? 4101);
  const base = `http://127.0.0.1:${port}`;

  // Start the server (non-watch)
  console.log('Starting server for integration test...');
  const tsxBin = path.join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
  let child;
  if (process.platform === 'win32') {
    const cmd = `"${tsxBin}" src/index.ts`;
    child = spawn('cmd.exe', ['/c', cmd], { cwd: process.cwd(), env: process.env, stdio: 'pipe', shell: false });
  } else {
    child = spawn(tsxBin, ['src/index.ts'], { cwd: process.cwd(), env: process.env, stdio: 'pipe', shell: false });
  }

  child.stdout.on('data', d => process.stdout.write(d));
  child.stderr.on('data', d => process.stderr.write(d));

  try {
    await waitForHealth(`${base}/health`, 30000);
    console.log('Server healthy. Running model checks...');

    const messages = [
      { role: 'system', content: 'You are terse.' },
      { role: 'user', content: 'Say HELLO.' }
    ];

  const openaiGpt5 = await postJson(`${base}/api/chat`, { engine: 'openai', model: 'gpt-5-mini', messages });
  const openaiG4o = await postJson(`${base}/api/chat`, { engine: 'openai', model: 'gpt-4o-mini', messages });

  const geminiFlash = await postJson(`${base}/api/chat`, { engine: 'gemini', model: 'gemini-2.5-flash', messages });
  const geminiPro = await postJson(`${base}/api/chat`, { engine: 'gemini', model: 'gemini-2.5-pro', messages });

    const results = {
      openai: {
        gpt5: { status: openaiGpt5.status, ok: openaiGpt5.ok, modelUsed: openaiGpt5.json?.modelUsed, preview: (openaiGpt5.json?.content || '').slice(0, 60) },
        g4o: { status: openaiG4o.status, ok: openaiG4o.ok, modelUsed: openaiG4o.json?.modelUsed, preview: (openaiG4o.json?.content || '').slice(0, 60) }
      },
      gemini: {
        flash: { status: geminiFlash.status, ok: geminiFlash.ok, modelUsed: geminiFlash.json?.modelUsed, preview: (geminiFlash.json?.content || '').slice(0, 60) },
        pro: { status: geminiPro.status, ok: geminiPro.ok, modelUsed: geminiPro.json?.modelUsed, preview: (geminiPro.json?.content || '').slice(0, 60) }
      }
    };

    console.log('Integration results:\n', JSON.stringify(results, null, 2));

    // Basic assertions
    if (!openaiGpt5.ok || !openaiG4o.ok || !geminiFlash.ok || !geminiPro.ok) {
      throw new Error('One or more endpoints returned non-OK status');
    }
  } finally {
    console.log('Stopping server...');
    if (process.platform === 'win32') {
      // Best-effort terminate
      child.kill('SIGTERM');
      await delay(1000);
      child.kill('SIGKILL');
    } else {
      child.kill('SIGTERM');
    }
  }
}

run().catch(err => {
  console.error('Integration test failed:', err?.message || err);
  process.exit(1);
});
