import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const url = process.argv[2] || 'http://localhost:5173/';
  const out = process.argv[3] || 'C:/Users/lytle/AppMountedDOM.html';

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(30000);

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    // wait for the app to mount main node
    await page.waitForSelector('#root, [role="application"], [aria-label]', { timeout: 10000 }).catch(() => {});
    const html = await page.content();
    fs.writeFileSync(out, html, 'utf8');
    console.log('mounted-dom-saved', out);
  } catch (err) {
    console.error('capture-failed', err && err.message);
    process.exit(2);
  } finally {
    await browser.close();
  }
})();
