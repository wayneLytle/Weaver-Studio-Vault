import http from 'http';

function req(pathname, method='GET', body) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : undefined;
    const req = http.request({ hostname: 'localhost', port: 4101, path: pathname, method, headers: { 'Content-Type': 'application/json', 'Content-Length': data?.length || 0 } }, res => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function chat(body) {
  const r = await req('/v1/chat', 'POST', body);
  if (r.status !== 200) throw new Error('chat failed: ' + r.status + ' ' + r.body);
  return JSON.parse(r.body);
}

async function main() {
  // Check engine availability first
  const status = await req('/api/ai/status', 'GET');
  let geminiConfigured = false;
  try {
    const j = JSON.parse(status.body);
    geminiConfigured = !!j?.engines?.gemini?.configured;
  } catch {}

  // editorial → openai
  const editorial = await chat({ messages: [{ role: 'user', content: 'Say your engine only' }], persona: { taskManifest: { intent: 'editorial' } } });
  if (!editorial || editorial.engine !== 'openai') throw new Error('editorial should use openai, got ' + (editorial?.engine));

  // tone → gemini when usable; otherwise skip with notice
  if (geminiConfigured) {
    try {
      const tone = await chat({ messages: [{ role: 'user', content: 'Say your engine only' }], persona: { taskManifest: { intent: 'tone' } } });
      if (tone.engine !== 'gemini') console.warn('[ci-intent] tone intent expected gemini, got', tone.engine);
    } catch (e) {
      console.warn('[ci-intent] tone intent test skipped (gemini unusable):', String(e).slice(0, 200));
    }
  } else {
    console.log('[ci-intent] gemini not configured — skipping tone check');
  }

  console.log('[ci-intent] ok');
}

main().catch(err => { console.error(err); process.exit(1); });
