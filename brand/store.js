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
    // A person, not a screen. The opener is the panel a store shows first in a
    // search result, and a photograph of somebody praying in a work truck says
    // what this app is faster than any screenshot of it can.
    photo: 'feature_truck_16x9.jpg',
    focus: '38% 30%',
    mark: true,
    head: "Some mornings\nthree minutes is\nall you've got.",
    sub: "That's the whole app.",
  },
  {
    shot: '02_intro',
    head: 'It walks you through it.',
    sub: 'Be still. Bring your people. Give thanks.\nA minute each, and it moves on by itself.',
  },
  {
    shot: '04_people',
    head: 'Minute two is for them.',
    sub: "Your list turns up right when you need it,\nand nowhere else in the app.",
  },
  {
    shot: '05_thanks',
    head: "You'll remember\nwhat He did.",
    sub: "Mark a prayer answered and it stays put.\nScroll back next year — it's still there.",
  },
  {
    shot: '06_amen',
    head: 'It grows on the days\nyou show up.',
    sub: "No streak to break. It never goes backwards,\nand it never scolds you for missing one.",
  },
  {
    photo: 'landing_steps_16x9.jpg',
    focus: '70% 42%',
    head: 'No ads.\nNo account.\nNo investors.',
    sub: "Members pay $3.99 a month.\nThat's what keeps it free\nfor the people who can't.",
    big: true,
  },
];

const FONTS = {
  figtree: fs.readFileSync(path.join(__dirname, 'fonts', 'Figtree-800.woff2')).toString('base64'),
  newsreader: fs.readFileSync(path.join(__dirname, 'fonts', 'Newsreader-400.woff2')).toString('base64'),
};

const page = (p, set) => {
  // Proportions taken off the reference listings: a headline that is genuinely
  // large, a quieter serif line under it, and nothing between them but space.
  const head = Math.round(set.w * (p.big ? 0.086 : 0.078));
  const sub = Math.round(set.w * 0.042);
  const phoneW = Math.round(set.w * 0.72);
  const photo = p.photo
    ? `url(data:image/jpeg;base64,${fs.readFileSync(path.join(__dirname, p.photo)).toString('base64')})`
    : null;
  const body = p.shot
    ? `<div class="phone"><img src="data:image/png;base64,${fs.readFileSync(path.join(IN, p.shot + '.png')).toString('base64')}"></div>`
    : '';
  return `<!doctype html><meta charset=utf-8><style>
  @font-face{font-family:Figtree;font-weight:800;src:url(data:font/woff2;base64,${FONTS.figtree}) format('woff2')}
  @font-face{font-family:Newsreader;font-weight:400;src:url(data:font/woff2;base64,${FONTS.newsreader}) format('woff2')}
  *{margin:0;box-sizing:border-box}
  body{width:${set.w}px;height:${set.h}px;overflow:hidden;position:relative;
    background:linear-gradient(172deg,#26355A,#141C30 70%);
    display:flex;flex-direction:column;align-items:center;color:#FFFDF9}
  ${photo ? `.bg{position:absolute;inset:0;background-image:${photo};background-size:cover;
      background-position:${p.focus};filter:saturate(.9)}
    .veil{position:absolute;inset:0;background:
      linear-gradient(180deg,rgba(12,17,30,.82) 0%,rgba(12,17,30,.55) 42%,rgba(12,17,30,.72) 100%)}` : ''}
  .mark,h1,.sub,.foot{position:relative;z-index:2}
  .mark{font-family:Figtree,sans-serif;font-size:${Math.round(sub * 0.9)}px;font-weight:800;
        letter-spacing:${Math.round(set.w * 0.007)}px;text-transform:uppercase;opacity:.75;
        padding-top:${Math.round(set.h * 0.075)}px}
  h1{font-family:Figtree,sans-serif;font-size:${head}px;line-height:1.14;font-weight:800;
     text-align:center;letter-spacing:-${Math.round(set.w * 0.0016)}px;white-space:pre-line;
     padding:${Math.round(set.h * (p.mark ? 0.028 : 0.115))}px ${Math.round(set.w * 0.06)}px 0;
     text-shadow:${photo ? '0 2px 24px rgba(0,0,0,.55)' : 'none'}}
  .sub{font-family:Newsreader,Georgia,serif;
       font-size:${p.big ? Math.round(sub * 1.15) : sub}px;line-height:1.5;text-align:center;
       white-space:pre-line;opacity:.9;
       padding:${Math.round(set.h * 0.026)}px ${Math.round(set.w * 0.09)}px 0;
       text-shadow:${photo ? '0 2px 18px rgba(0,0,0,.5)' : 'none'};
       ${p.big ? `flex:1;display:flex;align-items:center;justify-content:center;padding-bottom:${Math.round(set.h * 0.06)}px` : ''}}
  .foot{position:absolute;bottom:${Math.round(set.h * 0.06)}px;left:0;right:0;text-align:center;
        font-family:Figtree,sans-serif;font-size:${Math.round(sub * 0.9)}px;font-weight:800;opacity:.6;
        letter-spacing:${Math.round(set.w * 0.007)}px;text-transform:uppercase}
  .phone{position:absolute;left:50%;transform:translateX(-50%);z-index:2;
    top:${Math.round(set.h * 0.395)}px;width:${phoneW}px;
    border-radius:${Math.round(phoneW * 0.1)}px ${Math.round(phoneW * 0.1)}px 0 0;
    overflow:hidden;
    border:${Math.max(3, Math.round(set.w * 0.007))}px solid #46557E;border-bottom:0;
    box-shadow:0 ${Math.round(set.h * 0.008)}px ${Math.round(set.h * 0.045)}px rgba(0,0,0,.55)}
  .phone img{width:100%;display:block}
  </style>
  ${photo ? '<div class="bg"></div><div class="veil"></div>' : ''}
  ${p.mark ? '<div class="mark">Selah Daily</div>' : ''}
  <h1>${p.head}</h1><div class="sub">${p.sub}</div>
  ${body}
  ${p.big ? '<div class="foot">Selah Daily</div>' : ''}`;
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
