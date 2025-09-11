const fs = require('fs');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

function readPNG(path) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(path)
      .pipe(new PNG())
      .on('parsed', function () { resolve(this); })
      .on('error', reject);
  });
}

async function diff(aPath, bPath, outPath) {
  try {
    const a = await readPNG(aPath);
    const b = await readPNG(bPath);
    if (a.width !== b.width || a.height !== b.height) {
      return { code: 2, reason: 'dimension-mismatch', a: { w: a.width, h: a.height }, b: { w: b.width, h: b.height } };
    }
    const diff = new PNG({ width: a.width, height: a.height });
    const num = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
    await new Promise((res, rej) => diff.pack().pipe(fs.createWriteStream(outPath)).on('finish', res).on('error', rej));
    return { code: (num === 0 ? 0 : 1), diffPixels: num, out: outPath };
  } catch (e) {
    return { code: 3, reason: e.message || String(e) };
  }
}

// Export for programmatic use
module.exports = { diff };

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.error('Usage: node diff-screenshots.cjs <baseline.png> <target.png> [out.png]');
      process.exit(2);
    }
    const a = args[0];
    const b = args[1];
    const out = args[2] || 'diff.png';
    const res = await diff(a, b, out);
    if (res.code === 0) console.log(`Compared ${a} -> ${b}, pixels different: ${res.diffPixels}`);
    else if (res.code === 1) console.log(`Compared ${a} -> ${b}, pixels different: ${res.diffPixels}`);
    else console.error('Error diffing:', res);
    process.exit(res.code);
  })();
}
