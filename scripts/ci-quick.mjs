import http from 'http';

function get(pathname, method='GET', body) {
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

async function main() {
  const health = await get('/health');
  if (health.status !== 200) throw new Error('Health failed');

  const chat = await get('/v1/chat', 'POST', { messages: [{ role: 'user', content: 'ping' }] });
  if (chat.status !== 200) throw new Error('/v1/chat failed: ' + chat.status);
  const parsed = JSON.parse(chat.body);
  if (!parsed || typeof parsed.content !== 'string') throw new Error('Invalid chat response');

  // stream test
  await new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: 4101, path: '/v1/chat/stream', method: 'POST', headers: { 'Content-Type': 'application/json' } }, res => {
      let gotDelta = false; let gotEnd = false; let buffer = '';
      res.on('data', chunk => {
        buffer += chunk.toString('utf8');
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const line = block.trim();
          if (!line) continue;
          if (line.startsWith('event: ')) {
            if (line.includes('event: end')) gotEnd = true;
          }
          if (line.startsWith('data: ')) {
            if (line.includes('"delta"')) gotDelta = true;
          }
        }
      });
      res.on('end', () => (gotDelta && gotEnd) ? resolve() : reject(new Error('Missing delta or end event in stream')));
    });
    req.on('error', reject);
    req.write(JSON.stringify({ messages: [{ role: 'user', content: 'stream ping' }] }));
    req.end();
  });

  console.log('[ci-quick] ok');
}

main().catch(err => { console.error(err); process.exit(1); });
