#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const errors = [];

function walk(dir, cb) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, cb); else cb(p);
  }
}

const frontendDir = path.join(root, 'WeaverMainScreen');
const serverDir = path.join(frontendDir, 'server');
const contractsDir = path.join(serverDir, 'contracts');
const openapiPath = path.join(contractsDir, 'openapi.yaml');
const includeGlobs = [
  path.join(frontendDir, 'components'),
  path.join(frontendDir, 'services'),
  path.join(frontendDir, 'hooks'),
  path.join(frontendDir, 'tw'),
  path.join(frontendDir, 'utils'),
  path.join(frontendDir, 'src'),
];
const ignoreRoots = [
  path.join(frontendDir, 'public'),
  path.join(frontendDir, 'node_modules'),
  path.join(frontendDir, 'services', 'llm'), // to be deprecated; exclude from guard for now
];

// Rule 1: Frontend must not import server-only packages
const serverOnly = ['express', 'fs', 'openai', 'cors', 'express-rate-limit'];
const frontendFiles = [];
walk(frontendDir, (p) => {
  if (!/\.(t|j)sx?$/.test(p)) return;
  if (p === path.join(frontendDir, 'vite.config.ts')) return;
  if (ignoreRoots.some(r => p.startsWith(r + path.sep))) return;
  if (p.startsWith(serverDir + path.sep)) return; // server is allowed to use server deps
  if (!includeGlobs.some(r => p.startsWith(r + path.sep))) return;
  frontendFiles.push(p);
});

for (const file of frontendFiles) {
  const src = fs.readFileSync(file, 'utf8');
  for (const mod of serverOnly) {
    const re = new RegExp(`(?:from\\s+['\"]${mod}['\"]|require\\(\\s*['\"]${mod}['\"]\\s*\\))`, 'g');
    if (re.test(src)) errors.push({ file, msg: `Frontend imports server module '${mod}'` });
  }
}

// Rule 2: No LLM keys in frontend bundle
const keyRe = /(OPENAI|ANTHROPIC|GEMINI|GOOGLE|COHERE|DEEPSEEK)_API_KEY\b/gi;
for (const file of frontendFiles) {
  const src = fs.readFileSync(file, 'utf8');
  if (keyRe.test(src)) errors.push({ file, msg: 'Potential LLM API key usage in frontend. Use API Gateway.' });
}

// Rule 3: Frontend must call API via VITE_API_BASE
const chatSvc = path.join(frontendDir, 'services', 'chatService.ts');
if (fs.existsSync(chatSvc)) {
  const src = fs.readFileSync(chatSvc, 'utf8');
  if (!/VITE_API_BASE/.test(src)) errors.push({ file: chatSvc, msg: 'chatService should use VITE_API_BASE for API host' });
}

// Rule 4: Gateway routes should prefer /v1/ and expose chat + stream
const gatewayIdx = path.join(serverDir, 'src', 'index.ts');
if (fs.existsSync(gatewayIdx)) {
  const src = fs.readFileSync(gatewayIdx, 'utf8');
  if (!/\/v1\//.test(src)) {
    errors.push({ file: gatewayIdx, msg: 'Gateway should expose versioned /v1 routes' });
  }
  if (!/post\('\/v1\/chat'/.test(src)) errors.push({ file: gatewayIdx, msg: 'Missing /v1/chat endpoint' });
  if (!/post\('\/v1\/chat\/stream'/.test(src)) errors.push({ file: gatewayIdx, msg: 'Missing /v1/chat/stream endpoint' });

  // Rule 5: CORS should allow current dev port (from Vite if specified) or include baseDevPorts mapping
  const viteCfg = path.join(frontendDir, 'vite.config.ts');
  let devPort = null;
  if (fs.existsSync(viteCfg)) {
    const vsrc = fs.readFileSync(viteCfg, 'utf8');
    const m = vsrc.match(/\bport\s*:\s*(\d{4,5})/);
    if (m) devPort = Number(m[1]);
  }
  if (devPort) {
    const hasDynamic = /baseDevPorts/.test(src) && /localhost/.test(src) && /127\.0\.0\.1/.test(src);
    const hasLiteral = src.includes(`http://localhost:${devPort}`) || src.includes(`http://127.0.0.1:${devPort}`);
    if (!hasDynamic && !hasLiteral) {
      errors.push({ file: gatewayIdx, msg: `CORS should include dev port ${devPort} (localhost or 127.0.0.1)` });
    }
  }

  // Rule 6: Allow multiple env origins via ALLOW_ORIGINS and enable preflight OPTIONS
  if (!/ALLOW_ORIGINS/.test(src)) errors.push({ file: gatewayIdx, msg: 'CORS should parse ALLOW_ORIGINS for multiple entries' });
  if (!/app\.options\('\*',\s*cors\(\)\)/.test(src)) errors.push({ file: gatewayIdx, msg: 'CORS should enable global OPTIONS preflight' });
}

// Rule 7: OpenAPI contract must exist and be non-empty at server/contracts/openapi.yaml
try {
  if (!fs.existsSync(openapiPath)) {
    errors.push({ file: openapiPath, msg: 'Missing OpenAPI contract file. Expected server/contracts/openapi.yaml' });
  } else {
    const stat = fs.statSync(openapiPath);
    if (!stat.isFile() || stat.size < 10) {
      errors.push({ file: openapiPath, msg: 'OpenAPI contract appears empty or invalid' });
    }
  }
} catch (e) {
  errors.push({ file: openapiPath, msg: 'Error checking OpenAPI contract: ' + (e && e.message ? e.message : String(e)) });
}

if (errors.length) {
  console.error('\n[ARCH CHECK] Violations found:');
  for (const e of errors) console.error(`- ${e.file}: ${e.msg}`);
  process.exit(1);
}
console.log('[ARCH CHECK] OK');
