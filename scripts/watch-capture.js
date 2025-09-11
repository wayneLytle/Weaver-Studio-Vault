import puppeteer from 'puppeteer';
import fs from 'fs';
import readline from 'readline';

const url = process.argv[2] || 'http://localhost:5173/';
const outDir = 'C:/Users/lytle';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  console.log('Puppeteer watcher started. Press ENTER to capture (Ctrl+C to exit).');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on('line', async () => {
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForSelector('#root, [role="application"], [aria-label]',{ timeout: 10000 }).catch(() => {});
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const html = await page.content();
      const domPath = `${outDir}/AppMountedDOM-${timestamp}.html`;
      const screenshotPath = `${outDir}/AppScreenshot-${timestamp}.png`;
      fs.writeFileSync(domPath, html, 'utf8');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`captured: ${domPath} and ${screenshotPath}`);
    } catch (err) {
      console.error('capture-failed', err && err.message);
    }
  });

  process.on('SIGINT', async () => {
    console.log('shutting down puppet watcher');
    rl.close();
    await browser.close();
    process.exit(0);
  });
})();
