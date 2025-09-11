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
      console.error('Dimension mismatch:', aPath, bPath);
      return 2;
    }
    const diff = new PNG({ width: a.width, height: a.height });
    const num = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
    diff.pack().pipe(fs.createWriteStream(outPath));
    console.log(`Compared ${aPath} -> ${bPath}, pixels different: ${num}`);
    return num === 0 ? 0 : 1;
  } catch (e) {
    console.error('Error diffing:', e.message || e);
    return 3;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node diff-screenshots.js <baseline.png> <target.png> [out.png]');
    process.exit(2);
  }
  const a = args[0];
  const b = args[1];
  const out = args[2] || 'diff.png';
  const code = await diff(a, b, out);
  process.exit(code);
}

main();
