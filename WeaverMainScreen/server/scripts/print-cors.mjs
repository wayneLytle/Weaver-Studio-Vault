import 'dotenv/config';

const devPorts = [5173, 5174, 5175, 6006];
const defaults = [
  ...devPorts.map(p => `http://localhost:${p}`),
  ...devPorts.map(p => `http://127.0.0.1:${p}`),
];

const extraRaw = (process.env.ALLOW_ORIGINS || process.env.ALLOW_ORIGIN || '').trim();
const extra = extraRaw ? extraRaw.split(/[ ,;]+/).map(s => s.trim()).filter(Boolean) : [];
const origins = [...defaults, ...extra];

console.log('[cors] defaults:');
for (const o of defaults) console.log(' -', o);
console.log('[cors] ALLOW_ORIGINS:', extraRaw || '(not set)');
console.log('[cors] effective:');
for (const o of origins) console.log(' -', o);
