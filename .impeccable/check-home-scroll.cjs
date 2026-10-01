/* eslint-disable @typescript-eslint/no-require-imports -- Standalone browser regression check. */
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/minio/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({viewport:{width,height:844}});
      await page.goto('http://localhost:3000/?ref=SCROLLCHECK');
      await page.waitForFunction(() => history.scrollRestoration === 'manual');
      assert.equal(await page.evaluate(() => scrollY), 0, 'Fresh entry stays at top');
      await page.locator('#recent-cuts').scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(() => scrollY > 500));
      await page.reload();
      await page.waitForFunction(() => history.scrollRestoration === 'manual' && scrollY === 0);
      await page.waitForTimeout(600);
      assert.equal(await page.evaluate(() => scrollY), 0, 'Refresh does not restore gallery position');
      await page.getByRole('link',{name:width < 1024 ? 'View the gallery' : 'Gallery',exact:true}).filter({visible:true}).click();
      await page.waitForFunction(() => location.hash === '#recent-cuts' && scrollY > 500);
      await page.reload();
      await page.waitForFunction(() => history.scrollRestoration === 'manual' && scrollY === 0 && !location.hash);
      assert.equal(await page.evaluate(() => new URL(location.href).searchParams.get('ref')), 'SCROLLCHECK');
      await page.goto('http://localhost:3000/#recent-cuts');
      await page.waitForFunction(() => history.scrollRestoration === 'manual' && scrollY === 0 && !location.hash);
      const heroBook = page.locator('main').getByRole('link',{name:width < 1024 ? 'Book Appointment' : 'Book',exact:true}).filter({visible:true}).first();
      assert.ok(await heroBook.isVisible());
      const bounds = await heroBook.boundingBox();
      assert.ok(bounds.y >= 0 && bounds.y < 844, 'Hero booking button remains in the opening viewport');
      await page.goto('http://localhost:3000/booking');
      await page.waitForFunction(() => history.scrollRestoration === 'auto');
      console.log('PASS', width, 'entry, refresh, gallery URL, deliberate gallery click, referral query, booking entry and restoration cleanup');
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});


