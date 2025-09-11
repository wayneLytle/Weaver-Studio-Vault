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

async function main() {
  const repo = path.resolve('.');
  const baseline = path.join(repo, 'visual-baselines', 'authscreen', 'AuthScreenBG.png');
  const targets = [ 'before.png', 'after.png' ].map(f => path.join(repo, 'visual-out', f));
  const outDir = path.join(repo, 'visual-out');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const report = [];
  for (const tgt of targets) {
    const name = path.basename(tgt, '.png');
    const out = path.join(outDir, `diff-${name}.png`);
    const res = await compare(baseline, tgt, out);
    report.push({ baseline: baseline, target: tgt, result: res });
  }

  const reportPath = path.join(outDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Report written to', reportPath);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => { console.error(e); process.exit(2); });
