/**
 * Store screenshots, built from the real app.
 *
 * Run brand/capture.js first; this reads what it wrote and puts each screen on
 * a panel. Two sets come out, because the stores disagree about shape: Google
 * Play wants 9:16 and rejects anything else, Apple wants the 6.7-inch iPhone at
 * 1290x2796.
 *
 *   node brand/store.js
 *
 * The layout follows what the category actually does, which is worth copying:
 * one brand colour on every panel so six of them read as one block in a search
 * result; a bold headline at the top with a quieter line under it; and the
 * phone bleeding off the bottom edge rather than floating whole, so the panel
 * looks like a window into the app instead of a product shot. A panel with no
 * phone at all is normal too.
 *
 * What is not copied is the testimonial in that second line. The apps at the
 * top of this category have millions of users to quote. This one has none, and
 * an invented review would be a fabricated review — against store policy, and a
 * strange way to open an app whose whole pitch is that it is run honestly. That
 * line holds a plain fact instead.
 *
 * Nor is the gloss. Those listings are made by media companies and look it;
 * matching them on production is a fight this app loses on the first panel.
 * Navy against a category of purple, and a promise rather than a feature list.
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
  {
    shot: '01_today',
    mark: true,
    head: 'Three minutes.\nThat is the whole app.',
    sub: 'A verse, the people you carry, and thanks.\nThen you get on with your day.',
  },
  {
    shot: '02_intro',
    head: 'Be still.\nBring your people.\nGive thanks.',
    sub: 'Each minute arrives on its own.\nYou are led through it, not timed.',
  },
  {
    shot: '04_people',
    head: 'The names you carry,\nin front of you.',
    sub: 'The second minute belongs to them.',
  },
  {
    shot: '05_thanks',
    head: 'See what was\nanswered.',
    sub: 'Every request you mark answered is kept.\nA year from now it is still there.',
  },
  {
    shot: '06_amen',
    head: 'It grows on the days\nyou show up.',
    sub: 'It never wilts and it never goes backwards.\nThere is no streak to lose.',
  },
  {
    // No phone. Settings is the honest illustration of this and it is a wall of
    // 13pt text that turns to grey mush at the size a store renders a panel.
    head: 'No ads.\nNo account.\nNo investors.',
    sub: 'Members pay $3.99 a month.\nThat is what keeps it free\nfor everyone who cannot.',
    big: true,
  },
];

const page = (p, set) => {
  const head = Math.round(set.w * 0.068);
  const sub = Math.round(set.w * 0.035);
  // The phone runs off the bottom edge. Only the top of it is on the panel, so
  // the headline gets real room and the panel reads as a window rather than a
  // product shot.
  const phoneW = Math.round(set.w * 0.66);
  const body = p.shot
    ? `<div class="phone"><img src="data:image/png;base64,${fs.readFileSync(path.join(IN, p.shot + '.png')).toString('base64')}"></div>`
    : '';
  return `<!doctype html><meta charset=utf-8><style>
  *{margin:0;box-sizing:border-box}
  body{width:${set.w}px;height:${set.h}px;overflow:hidden;position:relative;
    background:linear-gradient(175deg,#233150,#141C30 62%);
    display:flex;flex-direction:column;align-items:center;
    font-family:-apple-system,"Segoe UI",Roboto,sans-serif;color:#FFFDF9}
  .mark{font-size:${Math.round(sub * 1.15)}px;font-weight:700;letter-spacing:${Math.round(set.w * 0.006)}px;
        text-transform:uppercase;opacity:.65;padding-top:${Math.round(set.h * 0.052)}px}
  h1{font-size:${head}px;line-height:1.18;font-weight:800;text-align:center;letter-spacing:-1px;
     white-space:pre-line;padding:${Math.round(set.h * (p.mark ? 0.022 : 0.062))}px ${Math.round(set.w * 0.07)}px 0}
  .rule{width:${Math.round(set.w * 0.085)}px;height:${Math.max(3, Math.round(set.w * 0.005))}px;
        border-radius:99px;background:#E9A84B;margin:${Math.round(set.h * 0.024)}px 0}
  .sub{font-family:Georgia,"Times New Roman",serif;font-size:${p.big ? Math.round(sub * 1.35) : sub}px;
       line-height:1.55;text-align:center;white-space:pre-line;opacity:.88;
       padding:0 ${Math.round(set.w * 0.1)}px;
       ${p.big ? `flex:1;display:flex;align-items:center;justify-content:center;padding-bottom:${Math.round(set.h * 0.1)}px` : ''}}
  .phone{position:absolute;left:50%;transform:translateX(-50%);
    top:${Math.round(set.h * 0.355)}px;width:${phoneW}px;
    border-radius:${Math.round(phoneW * 0.085)}px ${Math.round(phoneW * 0.085)}px 0 0;
    overflow:hidden;
    border:${Math.max(2, Math.round(set.w * 0.004))}px solid #2E3A57;border-bottom:0;
    box-shadow:0 ${Math.round(set.h * 0.01)}px ${Math.round(set.h * 0.04)}px rgba(0,0,0,.6)}
  .phone img{width:100%;display:block}
  </style>
  ${p.mark ? '<div class="mark">Selah Daily</div>' : ''}
  <h1>${p.head}</h1><div class="rule"></div><div class="sub">${p.sub}</div>
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
