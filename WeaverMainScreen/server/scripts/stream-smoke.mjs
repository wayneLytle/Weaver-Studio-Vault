// Simple SSE smoke test
const url = 'http://localhost:4101/v1/chat/stream';
const payload = { messages: [{ role: 'user', content: 'hello stream smoke' }] };

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
if (!res.ok || !res.body) {
  console.error('Stream start failed', res.status, await res.text().catch(()=>''));
  process.exit(1);
}
const reader = res.body.getReader();
const dec = new TextDecoder();
let total = 0;
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = dec.decode(value);
  process.stdout.write(chunk);
  total += chunk.length;
  if (total > 500) break; // don't spam terminal
}
process.exit(0);
