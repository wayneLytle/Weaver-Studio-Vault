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

async function compareImages(aPath, bPath, outPath, options = {}) {
  try {
    const a = await readPNG(aPath);
    const b = await readPNG(bPath);
    if (a.width !== b.width || a.height !== b.height) {
      return { ok: false, reason: 'dimension-mismatch', a: { w: a.width, h: a.height }, b: { w: b.width, h: b.height } };
    }
    const diff = new PNG({ width: a.width, height: a.height });
    // Prepare masked copies if ignoreRects provided
    const aData = Buffer.from(a.data);
    const bData = Buffer.from(b.data);
    const tolerance = typeof options.tolerance === 'number' ? options.tolerance : 0.12;
    if (Array.isArray(options.ignoreRects)) {
      for (const r of options.ignoreRects) {
        // r: { x, y, width, height } in pixels
        const x0 = Math.max(0, Math.floor(r.x));
        const y0 = Math.max(0, Math.floor(r.y));
        const w = Math.max(0, Math.floor(r.width));
        const h = Math.max(0, Math.floor(r.height));
        for (let yy = y0; yy < Math.min(a.height, y0 + h); yy++) {
          for (let xx = x0; xx < Math.min(a.width, x0 + w); xx++) {
            const idx = (yy * a.width + xx) << 2;
            // zero out RGBA in both images so pixelmatch ignores these pixels
            aData[idx] = 0; aData[idx+1] = 0; aData[idx+2] = 0; aData[idx+3] = 0;
            bData[idx] = 0; bData[idx+1] = 0; bData[idx+2] = 0; bData[idx+3] = 0;
          }
        }
      }
    }
    const num = pixelmatch(aData, bData, diff.data, a.width, a.height, { threshold: tolerance });
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
      } else if (step.type === 'type') {
        // fill or type text into a selector
        if (!step.selector) {
          results.push({ step, ok: false, reason: 'missing-selector' });
        } else {
          const el = page.locator(step.selector);
          await el.waitFor({ state: 'visible', timeout: step.timeout || 10000 });
          if (typeof el.fill === 'function') {
            // prefer fill for clean input replacement
            await el.fill(step.text || '');
          } else {
            await el.type(step.text || '');
          }
          results.push({ step, ok: true });
        }
      } else if (step.type === 'press') {
        // press a key on a selector or page
        if (step.selector) {
          const el = page.locator(step.selector);
          await el.waitFor({ state: 'visible', timeout: step.timeout || 10000 });
          await el.press(step.key || 'Enter');
          results.push({ step, ok: true });
        } else {
          await page.keyboard.press(step.key || 'Enter');
          results.push({ step, ok: true });
        }
      } else if (step.type === 'compare') {
        const a = path.resolve(step.baseline);
        const b = path.resolve(path.join(outDir, step.target));
        const out = path.resolve(path.join(outDir, step.out || `diff-${Date.now()}.png`));
        // support tolerance and ignoreRects (allow ignoreRects to be percentage-based)
        const options = {};
        options.tolerance = typeof step.tolerance === 'number' ? step.tolerance : undefined;
        if (Array.isArray(step.ignoreRects)) {
          // convert percentage rects to pixels if rects use unit 'percent' or values <=100
          const rects = [];
          for (const r of step.ignoreRects) {
            if (r.unit === 'percent' || (r.width <= 100 && r.height <= 100 && r.x <= 100 && r.y <= 100)) {
              // percentages relative to page size
              const canvas = { w: spec.viewport && spec.viewport.width ? spec.viewport.width : 1280, h: spec.viewport && spec.viewport.height ? spec.viewport.height : 800 };
              rects.push({ x: Math.round((r.x / 100) * canvas.w), y: Math.round((r.y / 100) * canvas.h), width: Math.round((r.width / 100) * canvas.w), height: Math.round((r.height / 100) * canvas.h) });
            } else {
              rects.push({ x: r.x, y: r.y, width: r.width, height: r.height });
            }
          }
          options.ignoreRects = rects;
        }
        const cmp = await compareImages(a, b, out, options);
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
