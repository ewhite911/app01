/**
 * Screenshots and a recording of the real app, from a browser.
 *
 * The mock-ups in this folder are HTML written by hand from the app's own
 * values. They are good for judging layout and they have been wrong: a prayer
 * list one item longer than the mock-up's pushed the Amen button off the
 * bottom of the screen, and nothing in the HTML could have shown that.
 *
 * This runs the actual screens instead. Expo builds the same source for web,
 * Chromium renders it at phone size, and Playwright's fake clock lets three
 * minutes pass in a few seconds so the routine can be captured end to end.
 *
 *   cd selah-daily && npx expo export --platform web
 *   node ../brand/serve.js selah-daily/dist &        # serves on 8099
 *   node brand/capture.js
 *
 * `src/db.web.ts` stands in for SQLite here and seeds a sample list, so the
 * screens come out looking like someone's, not empty.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.APP_URL || 'http://127.0.0.1:8099/';
const OUT = path.join(__dirname, 'real');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const STEPS = [
  ['01_today', 'Today'],
  ['02_intro', 'before starting'],
  ['03_still', 'minute 1 · be still'],
  ['04_people', 'minute 2 · bring your people'],
  ['05_thanks', 'minute 3 · give thanks'],
  ['06_amen', 'Amen'],
  ['07_prayers', 'Prayers'],
  ['08_settings', 'Settings'],
];

async function shots(browser) {
  const ctx = await browser.newContext(PHONE);
  const p = await ctx.newPage();
  await p.clock.install();
  p.on('pageerror', (e) => console.log('PAGE ERROR', String(e).slice(0, 200)));
  const shot = (n) => p.screenshot({ path: path.join(OUT, n + '.png') });

  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  await shot('01_today');

  await p.getByText(/^(Pray again|I.ve read it)$/).first().click();
  await p.waitForTimeout(600);
  await shot('02_intro');

  await p.getByText('Start 3 minutes').click();
  await p.waitForTimeout(300);
  // runFor, not fastForward: fastForward fires a repeating timer at most once,
  // so the countdown would sit at 2:59 and every phase would read "Be still."
  await p.clock.runFor(20000); await p.waitForTimeout(400); await shot('03_still');
  await p.clock.runFor(45000); await p.waitForTimeout(400);
  for (const who of [/Dad.s scan/, /Millers/]) {
    try { await p.getByText(who).first().click({ timeout: 1500 }); } catch {}
  }
  await p.waitForTimeout(400); await shot('04_people');
  await p.clock.runFor(60000); await p.waitForTimeout(400); await shot('05_thanks');

  await p.getByText(/^Amen$/).last().click();
  await p.waitForTimeout(1200); await shot('06_amen');
  await p.getByText('Done for today').click(); await p.waitForTimeout(700);
  await p.getByText(/^Prayers$/).first().click(); await p.waitForTimeout(800); await shot('07_prayers');
  await p.getByText(/^Settings$/).first().click(); await p.waitForTimeout(800); await shot('08_settings');
  await ctx.close();
}

async function video(browser) {
  const ctx = await browser.newContext({ ...PHONE, recordVideo: { dir: path.join(OUT, 'vid'), size: PHONE.viewport } });
  const p = await ctx.newPage();
  await p.clock.install();
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2600);
  await p.getByText(/^(Pray again|I.ve read it)$/).first().click();
  await p.waitForTimeout(1600);
  await p.getByText('Start 3 minutes').click();
  await p.waitForTimeout(500);
  // Three minutes of app time in sixty small steps, so it reads as about ten
  // seconds of video without the transitions snapping past.
  for (let i = 0; i < 60; i++) {
    await p.clock.runFor(3000);
    await p.waitForTimeout(160);
    if (i === 22 || i === 26) {
      try { await p.getByText(i === 22 ? /Dad.s scan/ : /Millers/).first().click({ timeout: 1500 }); } catch {}
      await p.waitForTimeout(220);
    }
  }
  await p.waitForTimeout(700);
  await p.getByText(/^Amen$/).last().click();
  await p.waitForTimeout(3000);
  await ctx.close();
}

async function sheet(browser) {
  const cells = STEPS.filter(([f]) => fs.existsSync(path.join(OUT, f + '.png')))
    .map(([f, cap]) =>
      `<figure><img src="data:image/png;base64,${fs.readFileSync(path.join(OUT, f + '.png')).toString('base64')}">` +
      `<figcaption>${cap}</figcaption></figure>`
    ).join('');
  const html =
    '<!doctype html><meta charset=utf-8><style>' +
    'body{background:#2b2b31;margin:0;padding:26px;display:flex;flex-wrap:wrap;gap:20px;justify-content:center;font:12px -apple-system,sans-serif}' +
    'figure{margin:0}img{width:300px;display:block;border-radius:30px;box-shadow:0 10px 30px rgba(0,0,0,.45)}' +
    'figcaption{color:#bbb;text-align:center;margin-top:8px;letter-spacing:.5px}</style>' + cells;
  const tmp = path.join(OUT, 'sheet.html');
  fs.writeFileSync(tmp, html);
  const p = await browser.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 1.5 });
  await p.goto('file://' + tmp);
  await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(__dirname, 'real_screens.png'), fullPage: true });
  await p.close();
  fs.unlinkSync(tmp);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  await shots(browser);
  await video(browser);
  await sheet(browser);
  await browser.close();

  const vids = fs.readdirSync(path.join(OUT, 'vid')).filter((f) => f.endsWith('.webm'));
  if (vids[0]) fs.copyFileSync(path.join(OUT, 'vid', vids[0]), path.join(__dirname, 'three_minutes.webm'));
  console.log('brand/real_screens.png and brand/three_minutes.webm written');
})();
