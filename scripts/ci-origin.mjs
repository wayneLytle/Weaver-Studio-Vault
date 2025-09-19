import http from 'http';

const ORIGIN = process.argv[2] || process.env.ORIGIN || 'http://localhost:5176';

function reqJSON(pathname, body) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(body));
    const req = http.request({
      hostname: 'localhost', port: 4101, path: pathname, method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'Content-Length': data.length,
        'Origin': ORIGIN
      }
    }, res => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function reqStream(pathname, body) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(body));
    const req = http.request({
      hostname: 'localhost', port: 4101, path: pathname, method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'Content-Length': data.length,
        'Origin': ORIGIN
      }
    }, res => {
      let gotDelta = false; let gotEnd = false; let buffer = '';
      const acao = res.headers['access-control-allow-origin'];
      res.on('data', chunk => {
        buffer += chunk.toString('utf8');
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const line = block.trim();
          if (!line) continue;
          if (line.startsWith('event: ') && line.includes('event: end')) gotEnd = true;
          if (line.startsWith('data: ') && line.includes('"delta"')) gotDelta = true;
        }
      });
      res.on('end', () => resolve({ acao, ok: gotDelta && gotEnd }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const chat = await reqJSON('/v1/chat', { messages: [{ role: 'user', content: 'ping' }] });
  if (chat.status !== 200) throw new Error('chat status ' + chat.status);
  if (chat.headers['access-control-allow-origin'] !== ORIGIN) throw new Error('chat ACAO mismatch: ' + chat.headers['access-control-allow-origin']);
  const parsed = JSON.parse(chat.body);
  if (!parsed || typeof parsed.content !== 'string') throw new Error('invalid chat body');

  const stream = await reqStream('/v1/chat/stream', { messages: [{ role: 'user', content: 'stream' }] });
  if (stream.acao !== ORIGIN) throw new Error('stream ACAO mismatch: ' + stream.acao);
  if (!stream.ok) throw new Error('stream missing delta or end');

  console.log('[ci-origin] ok for', ORIGIN);
}

main().catch(err => { console.error(err); process.exit(1); });
