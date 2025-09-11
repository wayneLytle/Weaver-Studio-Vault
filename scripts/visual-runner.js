const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

function waitForServer(url, timeoutMs = 30000, interval = 500) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.request(url, { method: 'HEAD', timeout: 2000 }, (res) => { res.resume(); resolve(); });
      req.on('error', () => { if (Date.now() - start > timeoutMs) return reject(new Error('Timeout waiting for server at ' + url)); setTimeout(check, interval); });
      req.on('timeout', () => { req.destroy(); if (Date.now() - start > timeoutMs) return reject(new Error('Timeout waiting for server at ' + url)); setTimeout(check, interval); });
      req.end();
    };
    check();
  });
}

async function readPNG(file) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(new PNG())
      .on('parsed', function () { resolve(this); })
      .on('error', reject);
  });
}

async function compareImages(aPath, bPath, outPath) {
  try {
    const a = await readPNG(aPath);
    const b = await readPNG(bPath);
    if (a.width !== b.width || a.height !== b.height) {
      return { ok: false, reason: 'dimension-mismatch', a: { w: a.width, h: a.height }, b: { w: b.width, h: b.height } };
    }
    const diff = new PNG({ width: a.width, height: a.height });
    const num = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.12 });
    await new Promise((res, rej) => diff.pack().pipe(fs.createWriteStream(outPath)).on('finish', res).on('error', rej));
    return { ok: num === 0, diffPixels: num, out: outPath };
  } catch (e) {
    return { ok: false, reason: e.message || String(e) };
  }
}

async function run(specPath, opts = {}) {
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const url = spec.url || 'http://127.0.0.1:5173/';
  await waitForServer(url, opts.serverTimeout || 30000);
  const browser = await chromium.launch({ headless: !opts.headed });
  const context = await browser.newContext({ viewport: spec.viewport || { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });

  const results = [];
  const outDir = spec.outDir || process.cwd();
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const step of spec.steps || []) {
    try {
      if (step.type === 'wait') {
        await page.waitForTimeout(step.ms || 500);
        results.push({ step, ok: true });
      } else if (step.type === 'click') {
        const loc = page.locator(step.selector);
        await loc.waitFor({ state: 'visible', timeout: step.timeout || 10000 });
        await loc.click({ timeout: step.clickTimeout || 10000 });
        results.push({ step, ok: true });
      } else if (step.type === 'screenshot') {
        const p = path.join(outDir, step.filename || `shot-${Date.now()}.png`);
        if (step.selector) {
          const el = page.locator(step.selector);
          await el.waitFor({ state: 'visible', timeout: 5000 });
          await el.screenshot({ path: p });
        } else {
          await page.screenshot({ path: p, fullPage: !!step.fullPage });
        }
        results.push({ step, ok: true, path: p });
      } else if (step.type === 'compare') {
        const a = path.resolve(step.baseline);
        const b = path.resolve(path.join(outDir, step.target));
        const out = path.resolve(path.join(outDir, step.out || `diff-${Date.now()}.png`));
        const cmp = await compareImages(a, b, out);
        results.push({ step, ok: cmp.ok, info: cmp });
      } else if (step.type === 'html-dump') {
        const file = path.join(outDir, step.filename || 'page-debug.html');
        const html = await page.content();
        fs.writeFileSync(file, html, 'utf8');
        results.push({ step, ok: true, path: file });
      } else {
        results.push({ step, ok: false, reason: 'unknown-step' });
      }
      if (step.postWait) await page.waitForTimeout(step.postWait);
    } catch (e) {
      results.push({ step, ok: false, error: (e && e.message) || String(e) });
    }
  }

  await browser.close();
  return results;
}

if (require.main === module) {
  const arg = process.argv[2] || './scripts/visual-spec.json';
  const opts = { headed: process.argv.includes('--headed') };
  run(arg, opts).then((res) => {
    console.log('Run results:');
    console.log(JSON.stringify(res, null, 2));
    const failed = res.some(r => !r.ok);
    process.exit(failed ? 1 : 0);
  }).catch((err) => { console.error(err); process.exit(2); });
}
