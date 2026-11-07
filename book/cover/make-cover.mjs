// Cover generator for the print edition (148 x 210 mm softcover).
//
//   node book/cover/make-cover.mjs [--pages 240] [--caliper 0.113] [--title "..."] [--author "..."]
//
// Writes, next to this script:
//   cover.html        the cover as one SVG in millimetres (open in a browser to look at it)
//   cover.pdf         one page, full size with 3 mm bleed, fonts embedded (print file)
//   (set-boxes.py then cuts each page to the exact size and adds TrimBox/BleedBox; needs pypdf)
//   cover-guides.pdf  the same page with trim, spine, 12 mm safe area and barcode box drawn on (proof only)
//
// Spine width = pages / 2 x caliper + 0.4 mm cover allowance. Munken Pure 100 g is about 0.113 mm a
// sheet; confirm the final figure with the printer's spine calculator and rerun with --pages.

import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(here, '..', 'fonts');
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);

// ---- Geometry (mm) -------------------------------------------------------
const TRIM_W = 148, TRIM_H = 210, BLEED = 3, SAFE = 12;
const PAGES = Number(args.pages ?? 240);
const CALIPER = Number(args.caliper ?? 0.113);
const SPINE = Math.round((PAGES / 2 * CALIPER + 0.4) * 10) / 10;
const W = BLEED * 2 + TRIM_W * 2 + SPINE;
const H = BLEED * 2 + TRIM_H;
const BACK_X = BLEED, SPINE_X = BLEED + TRIM_W, FRONT_X = BLEED + TRIM_W + SPINE, TOP = BLEED;
const BARCODE = { w: 48, h: 27 };

const TITLE = args.title ?? 'Jump Out of the System';
const TITLE_LINES = (args.titleLines ?? 'Jump Out|of the System').split('|');
const AUTHOR = args.author ?? 'Author Name';

// ---- Colour (RGB screen values; CMYK targets in the design system) -------
const C = {
  midnight: '#18202e', // cover ground
  slate: '#2c3950',    // tiles inside the system
  vermilion: '#e0472a',// MU, the tile outside the system
  muted: '#8d99ad',    // rule labels, frame hairline
  knockout: '#ffffff', // unprinted board: letters, title, barcode box
};

// ---- The MIU ladder: every row is a legal derivation step from MI --------
const LADDER = [
  ['MI', 'axiom'],
  ['MII', 'rule II'],
  ['MIIII', 'rule II'],
  ['MIIIIU', 'rule I'],
  ['MUIU', 'rule III'],
  ['MUIUUIU', 'rule II'],
];
const T = 10, G = 1.6, P = T + G; // tile, gap, pitch

function tile(x, y, ch, fill, size = T, rot = 0) {
  const cx = x + size / 2, cy = y + size / 2;
  return `<g${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.08}" fill="${fill}"/>
    <text x="${cx}" y="${cy + size * 0.2}" text-anchor="middle" class="mono6" font-size="${size * 0.56}" fill="${C.knockout}">${ch}</text>
  </g>`;
}

function front(ox, oy) {
  const lx = ox + SAFE, ly = oy + 26;
  let s = '';
  // the system: a hairline frame around the ladder
  const frameW = 7 * P - G + 22, frameH = LADDER.length * P - G + 8;
  s += `<rect x="${lx - 4}" y="${ly - 4}" width="${frameW + 4}" height="${frameH}" fill="none" stroke="${C.muted}" stroke-width="0.25"/>`;
  LADDER.forEach(([str, rule], r) => {
    const y = ly + r * P;
    [...str].forEach((ch, i) => (s += tile(lx + i * P, y, ch, C.slate)));
    s += `<text x="${lx + str.length * P + 1.2}" y="${y + T * 0.62}" class="mono4" font-size="2.3" fill="${C.muted}" letter-spacing="0.15">${rule.toUpperCase()}</text>`;
  });
  // MU: outside the frame, tilted, as if it had jumped
  const mx = ox + TRIM_W - SAFE - 2 * T - G - 2.5, my = oy + SAFE + 3.5;
  s += tile(mx, my, 'M', C.vermilion, T, -9);
  s += tile(mx + P, my + 1.8, 'U', C.vermilion, T, -9);
  // title, bottom-left on the ground
  const size = 15.2; // mm, about 43 pt
  const baseY = oy + 147;
  TITLE_LINES.forEach((line, i) => {
    s += `<text x="${lx + 1.4}" y="${baseY + i * size * 0.98}" class="display" font-size="${size}" fill="${C.knockout}">${esc(line)}</text>`;
  });
  // author, on the safe line
  s += `<line x1="${lx}" x2="${lx + 18}" y1="${oy + TRIM_H - SAFE - 9}" y2="${oy + TRIM_H - SAFE - 9}" stroke="${C.vermilion}" stroke-width="0.6"/>`;
  s += `<text x="${lx}" y="${oy + TRIM_H - SAFE - 0.6}" class="mono5" font-size="3.3" fill="${C.knockout}" letter-spacing="0.5">${esc(AUTHOR.toUpperCase())}</text>`;
  return s;
}

function back(ox, oy) {
  let s = '';
  // the axiom alone, small, top left: where the front's ladder starts
  s += tile(ox + SAFE, oy + SAFE + 2, 'M', C.slate, 7);
  s += tile(ox + SAFE + 8.2, oy + SAFE + 2, 'I', C.slate, 7);
  // ISBN barcode box: white, low on the back, inside the safe area
  s += `<rect id="barcode" x="${ox + TRIM_W - SAFE - BARCODE.w}" y="${oy + TRIM_H - SAFE - BARCODE.h}" width="${BARCODE.w}" height="${BARCODE.h}" fill="${C.knockout}"/>`;
  return s;
}

function spine(ox, oy) {
  if (SPINE < 4) return '';
  const cx = ox + SPINE / 2;
  const fs = Math.min(4.2, SPINE * 0.42); // mm cap-to-descender budget across the spine
  let s = '';
  // reads top to bottom (UK/US); rotate 90 degrees clockwise about the spine centre line
  s += `<g transform="translate(${cx} ${oy + SAFE}) rotate(90)">`;
  s += `<text x="0" y="${fs * 0.35}" class="subhead" font-size="${fs}" fill="${C.knockout}">${esc(TITLE)}</text>`;
  if (SPINE >= 8) {
    s += `<text x="${TRIM_H - 2 * SAFE - 6}" y="${fs * 0.3}" text-anchor="end" class="mono5" font-size="${fs * 0.62}" fill="${C.knockout}" letter-spacing="0.35">${esc(AUTHOR.toUpperCase())}</text>`;
  }
  s += `</g>`;
  // MU mark at the foot of the spine
  const m = Math.min(4.5, SPINE * 0.45);
  s += `<rect x="${cx - m / 2}" y="${oy + TRIM_H - SAFE - m}" width="${m}" height="${m}" rx="${m * 0.08}" fill="${C.vermilion}"/>`;
  return s;
}

function guides() {
  const g = (x1, y1, x2, y2, c) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="0.2"/>`;
  let s = '<g id="guides">';
  // trim box
  s += `<rect x="${BLEED}" y="${BLEED}" width="${W - 2 * BLEED}" height="${TRIM_H}" fill="none" stroke="#00b7ff" stroke-width="0.25"/>`;
  // spine folds
  s += g(SPINE_X, 0, SPINE_X, H, '#00b7ff') + g(FRONT_X, 0, FRONT_X, H, '#00b7ff');
  // safe areas, 12 mm inside each panel's trim
  for (const x of [BACK_X, FRONT_X]) s += `<rect x="${x + SAFE}" y="${TOP + SAFE}" width="${TRIM_W - 2 * SAFE}" height="${TRIM_H - 2 * SAFE}" fill="none" stroke="#ff2bd6" stroke-width="0.2" stroke-dasharray="1 1"/>`;
  s += `<rect x="${SPINE_X}" y="${TOP + SAFE}" width="${SPINE}" height="${TRIM_H - 2 * SAFE}" fill="none" stroke="#ff2bd6" stroke-width="0.2" stroke-dasharray="1 1"/>`;
  const lab = (x, y, t) => `<text x="${x}" y="${y}" class="mono4" font-size="2" fill="#ff2bd6">${t}</text>`;
  s += lab(BACK_X + SAFE, TOP + SAFE - 1, 'BACK 148 x 210 / SAFE 12 MM');
  s += lab(FRONT_X + SAFE, TOP + TRIM_H - SAFE + 3, 'FRONT 148 x 210 / SAFE 12 MM');
  s += lab(SPINE_X + 0.5, TOP + TRIM_H + 2.4, `SPINE ${SPINE} MM (${PAGES} PP)`);
  s += lab(BACK_X + TRIM_W - SAFE - BARCODE.w + 1, TOP + TRIM_H - SAFE - BARCODE.h + 3, 'ISBN 48 x 27');
  s += '</g>';
  return s;
}

function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

function svg(withGuides) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  <rect x="0" y="0" width="${W}" height="${H}" fill="${C.midnight}"/>
  ${back(BACK_X, TOP)}
  ${spine(SPINE_X, TOP)}
  ${front(FRONT_X, TOP)}
  ${withGuides ? guides() : ''}
</svg>`;
}

function html(withGuides) {
  const f = (file) => `url(data:font/ttf;base64,${readFileSync(join(fontsDir, file)).toString('base64')}) format('truetype')`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Cover</title><style>
@font-face{font-family:'SS4 Display';src:${f('SourceSerif4Display-SemiBold.ttf')};font-weight:600}
@font-face{font-family:'SS4 Subhead';src:${f('SourceSerif4Subhead-SemiBold.ttf')};font-weight:600}
@font-face{font-family:'Plex Mono';src:${f('IBMPlexMono-400.ttf')};font-weight:400}
@font-face{font-family:'Plex Mono';src:${f('IBMPlexMono-500.ttf')};font-weight:500}
@font-face{font-family:'Plex Mono';src:${f('IBMPlexMono-600.ttf')};font-weight:600}
@page{margin:0}
html,body{margin:0;padding:0;background:#fff}
svg{display:block}
.display{font-family:'SS4 Display';font-weight:600;letter-spacing:-0.02em}
.subhead{font-family:'SS4 Subhead';font-weight:600}
.mono4{font-family:'Plex Mono';font-weight:400}
.mono5{font-family:'Plex Mono';font-weight:500}
.mono6{font-family:'Plex Mono';font-weight:600}
</style></head><body>${svg(withGuides)}</body></html>`;
}

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, withGuides] of [['cover', false], ['cover-guides', true]]) {
  const doc = html(withGuides);
  if (!withGuides) writeFileSync(join(here, 'cover.html'), doc);
  await page.setContent(doc);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: join(here, `${name}.pdf`), width: `${W / 25.4}in`, height: `${H / 25.4}in`, printBackground: true });
  execFileSync('python3', [join(here, 'set-boxes.py'), join(here, `${name}.pdf`), String(W), String(H), String(BLEED)]);
}
writeFileSync(join(here, 'cover-svg.svg'), svg(true));
await browser.close();
console.log(`spine ${SPINE} mm for ${PAGES} pp at ${CALIPER} mm/sheet; page ${W} x ${H} mm`);
