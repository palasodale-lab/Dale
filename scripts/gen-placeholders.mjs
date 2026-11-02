/**
 * Generates PLACEHOLDER images in public/assets so the site runs before the real DPC
 * renders are dropped in. Renders come from the procedural 3D model (src/three/house.js);
 * the two elevation drawings are generated as SVG line drawings.
 *
 *   npm run placeholders            # (re)generate everything
 *
 * Writes scripts/placeholder-points.json with projected hotspot coordinates (in % of the
 * image) — these are the values used in src/content.js for the placeholder images.
 * Requires Playwright + Chromium (pre-installed in the dev container; locally: `npx playwright install chromium`).
 */
import { createServer } from 'vite';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Playwright is resolved via require so a globally installed copy also works.
const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public/assets');
await fs.mkdir(out, { recursive: true });

const server = await createServer({ root, logLevel: 'error', server: { port: 5199 } });
await server.listen();
const url = `http://localhost:${server.config.server.port}/tools/placeholders.html`;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('console', (m) => m.type() === 'error' && console.error('[page]', m.text()));
await page.goto(url);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });

const points = {};
for (const name of ['render-rear-iso', 'render-front', 'render-rear', 'render-right', 'render-left', 'floorplan-3d']) {
  const res = await page.evaluate((n) => window.renderView(n), name);
  const b64 = res.dataUrl.split(',')[1];
  await fs.writeFile(path.join(out, `${name}.jpg`), Buffer.from(b64, 'base64'));
  delete res.dataUrl;
  points[name] = res;
  console.log('✓', name);
}
await fs.writeFile(path.join(root, 'scripts/placeholder-points.json'), JSON.stringify(points, null, 2));

/* ---------- elevation drawings (SVG → PNG) ---------- */
const W = 1600, H = 1131, S = 105; // px per metre
function drawing({ title, sub, view }) {
  const gx = 800, gy = 820; // ground origin
  const X = (m) => gx + m * S;
  const Y = (m) => gy - m * S;
  const L = [];
  const line = (x1, y1, x2, y2, w = 2) => L.push(`<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" stroke-width="${w}"/>`);
  const rect = (x, y, w, h, sw = 2, fill = 'none') =>
    L.push(`<rect x="${X(x)}" y="${Y(y + h)}" width="${w * S}" height="${h * S}" stroke-width="${sw}" fill="${fill}"/>`);
  const poly = (pts, sw = 2) => L.push(`<polygon points="${pts.map(([a, b]) => `${X(a)},${Y(b)}`).join(' ')}" stroke-width="${sw}" fill="none"/>`);
  const pline = (pts, sw = 2) => L.push(`<polyline points="${pts.map(([a, b]) => `${X(a)},${Y(b)}`).join(' ')}" stroke-width="${sw}" fill="none"/>`);
  const louvre = (cx, cy, w, h) => {
    rect(cx - w / 2, cy - h / 2, w, h, 2.5);
    for (let y = cy - h / 2 + 0.12; y < cy + h / 2; y += 0.12) line(cx - w / 2, y, cx + w / 2, y, 1);
  };
  const half = view === 'rear' ? 4 : 3;
  const floorY = 1.2, top = 3.9, ridge = 5.5, eave = 3.63, ov = 0.5;
  line(-7.2, 0, 7.2, 0, 3);
  // piles
  const piles = view === 'rear' ? [-3.85, -1.3, 1.3, 3.85] : [-2.85, 0, 2.85];
  for (const p of piles) rect(p - 0.08, 0, 0.16, floorY - 0.2, 2);
  rect(-half - 0.1, floorY - 0.22, half * 2 + 0.2, 0.22, 2);
  // walls + boards
  rect(-half, floorY, half * 2, top - floorY, 3);
  for (let y = floorY + 0.3; y < top; y += 0.3) line(-half, y, half, y, 0.6);
  if (view === 'rear') {
    // roof as seen from rear: slope band
    poly([[-half - ov, eave], [half + ov, eave], [half + ov, ridge], [-half - ov, ridge]], 3);
    for (let x = -half - ov; x <= half + ov; x += 0.18) line(x, eave, x, ridge, 0.5);
    line(-half - ov, eave - 0.1, half + ov, eave - 0.1, 4); // gutter
    // windows (mirrored: viewer looks at -z face, so +x is on the left)
    louvre(2.5, floorY + 1.55, 1.3, 1.1);
    louvre(-1.0, floorY + 1.8, 0.7, 0.6);
    louvre(-3.0, floorY + 1.7, 0.9, 0.8);
    rect(-2.1 - 0.42, floorY, 0.85, 2.05, 2.5);
    // tank (x=+5.55 → left)
    rect(-5.55 - 1.05, 0, 2.1, 0.55, 2);
    rect(-5.55 - 0.95, 0.55, 1.9, 1.75, 2.5);
    for (let y = 0.7; y < 2.3; y += 0.12) line(-6.5, y, -4.6, y, 0.5);
    pline([[-4.4, eave - 0.1], [-4.4, 2.85], [-5.35, 2.85], [-5.35, 2.5]], 3);
  } else {
    // right side elevation: horizontal axis = -z (front on the left)
    poly([[-half - ov, eave], [0, ridge], [half + ov, eave]], 3);
    poly([[-half, top], [0, ridge - 0.02], [half, top]], 1.5);
    louvre(0, top + 0.65, 0.6, 0.4);
    louvre(0.3, floorY + 1.65, 1.2, 0.9);
    louvre(-1.8, floorY + 1.55, 1.2, 1.1);
    L.push(`<circle cx="${X(-half - ov - 0.08)}" cy="${Y(eave - 0.1)}" r="7" stroke-width="2" fill="none"/>`);
    L.push(`<circle cx="${X(half + ov + 0.08)}" cy="${Y(eave - 0.1)}" r="7" stroke-width="2" fill="none"/>`);
    // deck + steps on the left (front)
    rect(-4.5, floorY - 0.12, 1.5, 0.12, 2);
    line(-4.46, floorY, -4.46, floorY + 0.95, 2);
    line(-4.46, floorY + 0.95, -3, floorY + 0.95, 2);
    for (let i = 0; i < 4; i++) rect(-4.5 - 0.3 * (i + 1), floorY - ((i + 1) * floorY) / 5 - 0.07, 0.32, 0.07, 1.5);
    rect(-4.35, 0, 0.14, floorY - 0.2, 2);
    // tank in front, rear side → right
    rect(2.4 - 1.05, 0, 2.1, 0.55, 2);
    rect(2.4 - 0.95, 0.55, 1.9, 1.75, 2.5);
    for (let y = 0.7; y < 2.3; y += 0.12) line(1.45, y, 3.35, y, 0.5);
    pline([[half + ov + 0.08, eave - 0.1], [half + ov + 0.08, 2.85], [2.6, 2.85], [2.6, 2.5]], 3);
  }
  // dimensions
  const dim = (x1, x2, y, t) => {
    line(x1, y, x2, y, 1);
    line(x1, y - 0.12, x1, y + 0.12, 1);
    line(x2, y - 0.12, x2, y + 0.12, 1);
    L.push(`<text x="${(X(x1) + X(x2)) / 2}" y="${Y(y) - 10}" text-anchor="middle" font-size="18" fill="#111" stroke="none">${t}</text>`);
  };
  dim(-half, half, -0.8, `${half * 2 * 1000} (TBC)`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="#fff"/>
  <rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="none" stroke="#111" stroke-width="3"/>
  <g stroke="#111" fill="none" stroke-linecap="square">${L.join('')}</g>
  <g font-family="Arial, Helvetica, sans-serif" fill="#111">
    <text x="${gx}" y="${gy + 150}" text-anchor="middle" font-size="40" font-weight="700" letter-spacing="4">${title}</text>
    <text x="${gx}" y="${gy + 190}" text-anchor="middle" font-size="22" letter-spacing="2">${sub}</text>
    <rect x="${W - 510}" y="${H - 200}" width="440" height="140" fill="none" stroke="#111" stroke-width="2"/>
    <text x="${W - 490}" y="${H - 162}" font-size="20" font-weight="700">MOTO HOUSE – 2 BEDROOM</text>
    <text x="${W - 490}" y="${H - 132}" font-size="16">DOKONA PAPUA CONSTRUCTION LTD (DPC)</text>
    <text x="${W - 490}" y="${H - 104}" font-size="16">SCALE 1:75 @ A3 · DIMENSIONS TBC</text>
    <text x="${W - 490}" y="${H - 76}" font-size="14" fill="#b00">PLACEHOLDER DRAWING – REPLACE WITH DPC SET</text>
  </g></svg>`;
}
for (const [file, cfg] of [
  ['elev-drawing-1.png', { title: 'ELEVATION C', sub: 'REAR ELEVATION · SCALE 1:75', view: 'rear' }],
  ['elev-drawing-2.png', { title: 'ELEVATION D', sub: 'RIGHT SIDE ELEVATION · SCALE 1:75', view: 'side' }],
]) {
  const p2 = await browser.newPage({ viewport: { width: W, height: H } });
  await p2.setContent(`<html><body style="margin:0">${drawing(cfg)}</body></html>`);
  await p2.screenshot({ path: path.join(out, file) });
  await p2.close();
  console.log('✓', file);
}

await browser.close();
await server.close();
