/**
 * Store screenshots, built from the real app.
 *
 * Run brand/capture.js first; this reads what it wrote and puts each screen on
 * a panel with a headline. Two sets come out, because the stores disagree about
 * shape: Google Play wants 9:16 and rejects anything else, Apple wants the
 * 6.7-inch iPhone at 1290x2796.
 *
 *   node brand/store.js
 *
 * On the design: this deliberately does not try to look like Pray.com or
 * Hallow. Those are media companies and their listings look it. Competing on
 * production against them is a fight this app loses on the first panel. What it
 * has instead is the promise — three minutes, no account, nothing leaves the
 * phone — so the panels are quiet, the headline is a sentence rather than a
 * feature, and the first three carry the whole pitch, since those are the ones
 * that show in search results.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const IN = path.join(__dirname, 'real');
const OUT = path.join(__dirname, 'store');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const SETS = [
  { name: 'play', w: 1080, h: 1920 },   // 9:16 exactly; Play rejects other ratios
  { name: 'ios', w: 1290, h: 2796 },    // iPhone 6.7-inch
];

const PANELS = [
  { shot: '01_today', head: 'Three minutes.\nThat is the whole app.', tone: 'navy' },
  { shot: '02_intro', head: 'Be still.\nBring your people.\nGive thanks.', tone: 'cream' },
  { shot: '04_people', head: 'The names you carry,\nin front of you.', tone: 'navy' },
  { shot: '05_thanks', head: 'A year from now,\nyou will see\nwhat was answered.', tone: 'cream' },
  { shot: '06_amen', head: 'It grows on the days\nyou show up.', tone: 'navy' },
  // No phone on the last one. The Settings screen is the honest illustration of
  // this promise and it is a wall of 13pt text — unreadable at the size a store
  // actually shows a screenshot. The promise reads better on its own.
  {
    head: 'No ads.\nNo account.\nNo investors.',
    sub: 'Members pay $3.99 a month.\nThat is what keeps it free\nfor everyone who cannot.',
    tone: 'navy',
  },
];

const page = (p, set) => {
  const navy = p.tone === 'navy';
  const head = Math.round(set.w * 0.066);
  // The header gets a fixed share of the panel and the phone gets the rest,
  // sized by height rather than width. Sizing by width cropped the bottom of
  // the phone off every 9:16 panel, which is the shape Google Play demands.
  const phoneH = Math.round(set.h * 0.66);
  const phoneW = Math.round(phoneH * (390 / 844));
  const body = p.shot
    ? `<div class="phone"><img src="data:image/png;base64,${fs.readFileSync(path.join(IN, p.shot + '.png')).toString('base64')}"></div>`
    : `<p class="sub">${p.sub}</p>`;
  return `<!doctype html><meta charset=utf-8><style>
  *{margin:0;box-sizing:border-box}
  body{width:${set.w}px;height:${set.h}px;overflow:hidden;
    background:${navy ? '#141C30' : '#FFFDF9'};
    display:flex;flex-direction:column;align-items:center;
    font:-apple-system,"Segoe UI",Roboto,sans-serif;
    color:${navy ? '#FFFDF9' : '#1B2233'};}
  header{height:${Math.round(set.h * 0.28)}px;display:flex;flex-direction:column;
         align-items:center;justify-content:center;padding:0 ${Math.round(set.w * 0.07)}px}
  h1{font-size:${head}px;line-height:1.22;font-weight:700;text-align:center;
     letter-spacing:-.5px;white-space:pre-line}
  .rule{width:${Math.round(set.w * 0.09)}px;height:${Math.max(3, Math.round(set.w * 0.005))}px;
        border-radius:99px;background:#E9A84B;margin-top:${Math.round(set.h * 0.022)}px}
  .phone{width:${phoneW}px;height:${phoneH}px;border-radius:${Math.round(phoneW * 0.085)}px;
    overflow:hidden;
    box-shadow:0 ${Math.round(set.h * 0.012)}px ${Math.round(set.h * 0.035)}px rgba(0,0,0,${navy ? 0.55 : 0.22});
    border:${Math.max(2, Math.round(set.w * 0.004))}px solid ${navy ? '#2A3550' : '#E6E2DA'};}
  .phone img{width:100%;display:block}
  .sub{flex:1;display:flex;align-items:center;justify-content:center;
       font-size:${Math.round(head * 0.62)}px;line-height:1.5;text-align:center;
       white-space:pre-line;opacity:.8;padding:0 ${Math.round(set.w * 0.1)}px
       ${Math.round(set.h * 0.12)}px}
  </style>
  <header><h1>${p.head}</h1><div class="rule"></div></header>
  ${body}`;
};

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const set of SETS) {
    const dir = path.join(OUT, set.name);
    fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < PANELS.length; i++) {
      const p = await browser.newPage({ viewport: { width: set.w, height: set.h } });
      const tmp = path.join(dir, `_${i}.html`);
      fs.writeFileSync(tmp, page(PANELS[i], set));
      await p.goto('file://' + tmp);
      await p.waitForTimeout(250);
      await p.screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, '0')}.png`) });
      await p.close();
      fs.unlinkSync(tmp);
    }
    console.log(set.name, set.w + 'x' + set.h, PANELS.length + ' panels');
  }

  // A contact sheet, so the set can be judged as a row the way a store shows it.
  const cells = SETS.map((set) => {
    const imgs = PANELS.map((_, i) =>
      `<img src="data:image/png;base64,${fs.readFileSync(path.join(OUT, set.name, String(i + 1).padStart(2, '0') + '.png')).toString('base64')}">`
    ).join('');
    return `<section><h2>${set.name} · ${set.w}×${set.h}</h2><div class="row">${imgs}</div></section>`;
  }).join('');
  const sheet = path.join(OUT, '_sheet.html');
  fs.writeFileSync(sheet, `<!doctype html><meta charset=utf-8><style>
    body{background:#2b2b31;margin:0;padding:24px;font:13px -apple-system,sans-serif;color:#bbb}
    h2{font-weight:600;letter-spacing:1px;margin:18px 0 10px;text-transform:uppercase;font-size:12px}
    .row{display:flex;gap:14px}img{width:210px;border-radius:12px;display:block}
  </style>${cells}`);
  const q = await browser.newPage({ viewport: { width: 1420, height: 1200 }, deviceScaleFactor: 1.4 });
  await q.goto('file://' + sheet);
  await q.waitForTimeout(600);
  await q.screenshot({ path: path.join(__dirname, 'store_screens.png'), fullPage: true });
  await q.close();
  fs.unlinkSync(sheet);
  await browser.close();
  console.log('brand/store_screens.png written');
})();
