const path = require('path');
const fs = require('fs');
const diffModule = require('./diff-screenshots.cjs');

async function run() {
  const outDir = path.resolve('./visual-out/authscreen');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const pairs = [
    {
      name: 'before',
      baseline: path.resolve('./visual-baselines/authscreen/AuthScreenBG.png'),
      target: path.resolve('./visual-out/authscreen/before.png'),
      diffOut: path.resolve('./visual-out/authscreen/diff-before.png')
    },
    {
      name: 'after-enter',
      baseline: path.resolve('./visual-baselines/authscreen/AuthScreenReviewReference.png'),
      target: path.resolve('./visual-out/authscreen/after-enter.png'),
      diffOut: path.resolve('./visual-out/authscreen/diff-after-enter.png')
    }
  ];

  const report = { generatedAt: new Date().toISOString(), results: [] };
  for (const p of pairs) {
    const res = await diffModule.diff(p.baseline, p.target, p.diffOut);
    report.results.push({ name: p.name, baseline: p.baseline, target: p.target, diffImage: p.diffOut, result: res });
  }

  const outFile = path.resolve('./visual-out/authscreen/diff-report.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8');
  console.log('Wrote', outFile);
}

run().catch((e) => { console.error(e); process.exit(2); });
