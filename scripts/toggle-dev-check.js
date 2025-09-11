const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:5173/');
    await page.screenshot({ path: 'before.png', fullPage: true });
    const btn = await page.$('button[aria-label="Toggle Dev Mode"]');
    if (!btn) {
      console.log('Toggle not found');
      await browser.close();
      process.exit(2);
    }
    await btn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'after-on.png', fullPage: true });
    await btn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'after-off.png', fullPage: true });
    console.log('Screenshots saved: before.png, after-on.png, after-off.png');
  } catch (err) {
    console.error('error', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
