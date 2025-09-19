import http from 'http';

function options(pathname, origin) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 4101,
      path: pathname,
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    }, res => {
      const headers = res.headers;
      resolve({ status: res.statusCode, headers });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const origin = process.env.CI_ORIGIN || 'http://localhost:5173';
  const r = await options('/v1/chat', origin);
  if (!r.status || r.status < 200 || r.status >= 400) throw new Error(`Unexpected status ${r.status}`);
  if (r.headers['access-control-allow-origin'] !== origin) throw new Error('Missing/incorrect ACAO');
  if (r.headers['access-control-allow-credentials'] !== 'true') throw new Error('Missing credentials');

  const rs = await options('/v1/chat/stream', origin);
  if (!rs.status || rs.status < 200 || rs.status >= 400) throw new Error(`Unexpected status (stream) ${rs.status}`);
  if (rs.headers['access-control-allow-origin'] !== origin) throw new Error('Missing/incorrect ACAO (stream)');
  if (rs.headers['access-control-allow-credentials'] !== 'true') throw new Error('Missing credentials (stream)');
  console.log('[ci-preflight] ok');
}

main().catch(err => { console.error(err); process.exit(1); });
