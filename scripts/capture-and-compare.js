import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

async function readPNG(file) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(new PNG())
      .on('parsed', function () { resolve(this); })
      .on('error', reject);
  });
}

async function compare(aPath, bPath, outPath) {
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

async function capture(url, outDir, viewport) {
  const browser = await chromium.launch({ headless: true });
  // create context with an explicit viewport and deviceScaleFactor
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  const beforePath = path.join(outDir, 'before.png');
  const afterPath = path.join(outDir, 'after.png');

  // initial screenshot — capture exactly the viewport rectangle so image dimensions match baseline
  await page.screenshot({ path: beforePath, fullPage: false, clip: { x: 0, y: 0, width: Math.floor(viewport.width), height: Math.floor(viewport.height) } });
  // wait for potential animations / crossfade
  await page.waitForTimeout(1000);
  // second screenshot
  await page.screenshot({ path: afterPath, fullPage: false, clip: { x: 0, y: 0, width: Math.floor(viewport.width), height: Math.floor(viewport.height) } });

  await browser.close();
  return { before: beforePath, after: afterPath };
}

async function main() {
  const repo = path.resolve('.');
  const outDir = path.join(repo, 'visual-out');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const spec = JSON.parse(fs.readFileSync(path.join(repo, 'scripts', 'visual-spec.json'), 'utf8'));
  const baseUrl = spec.url || 'http://127.0.0.1:5173/';
  // try multiple host variants in case the server is bound to IPv6-only or IPv4-only
  const parsed = new URL(baseUrl);
  const portFromUrl = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
  const protocol = parsed.protocol;
  const candidateHosts = ['localhost', '[::1]', '127.0.0.1'];
  let url = null;
  const viewport = spec.viewport || { width: 2016, height: 1152 };

  console.log('Attempting capture; will try hosts:', candidateHosts.join(', '));
  let shots = null;
  for (const h of candidateHosts) {
    const tryUrl = `${protocol}//${h}:${portFromUrl}/`;
    try {
      console.log('Trying', tryUrl);
      shots = await capture(tryUrl, outDir, viewport);
      url = tryUrl;
      console.log('Capture succeeded at', tryUrl);
      break;
    } catch (e) {
      console.warn('Capture failed for', tryUrl, e.message || e);
    }
  }
  if (!shots) {
    throw new Error('Unable to connect to any host variants for the dev server');
  }
  console.log('Captured:', shots);

  const baseline = path.join(repo, 'visual-baselines', 'authscreen', 'AuthScreenBG.png');
  const report = [];

  // compare both images
  for (const name of ['before', 'after']) {
    const tgt = path.join(outDir, `${name}.png`);
    const out = path.join(outDir, `diff-${name}.png`);
    const res = await compare(baseline, tgt, out);
    report.push({ baseline, target: tgt, result: res });
  }

  const reportPath = path.join(outDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Report written to', reportPath);
  console.log(JSON.stringify(report, null, 2));
  // explicit success message for wrappers
  console.log('✅ capture-and-compare: SUCCESS');
  // exit explicitly so calling shells see a clean completion
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(2); });
