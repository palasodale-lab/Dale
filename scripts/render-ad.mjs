/**
 * Renders the 3D ad film (ad.html) to MP4, frame by frame (deterministic, no dropped frames).
 *
 *   npm run render:ad                 # 16:9  1920×1080 → public/media/moto-house-ad.mp4
 *   npm run render:ad -- --vertical   # 9:16  1080×1920 → public/media/moto-house-ad-vertical.mp4
 *   npm run render:ad -- --fps 24 --scale 0.5   # quicker draft
 *
 * Needs Playwright + Chromium and ffmpeg (libx264) on PATH.
 */
import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i < 0 ? d : args[i + 1];
};
const vertical = args.includes('--vertical');
const fps = +flag('fps', 30);
const scale = +flag('scale', 1);
const W = Math.round((vertical ? 1080 : 1920) * scale);
const H = Math.round((vertical ? 1920 : 1080) * scale);
const name = vertical ? 'moto-house-ad-vertical' : 'moto-house-ad';
const framesDir = path.join(root, '.ad-frames', name);
const outDir = path.join(root, 'public/media');
await fs.rm(framesDir, { recursive: true, force: true });
await fs.mkdir(framesDir, { recursive: true });
await fs.mkdir(outDir, { recursive: true });

const server = await createServer({ root, logLevel: 'error', server: { port: 5198 } });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('console', (m) => m.type() === 'error' && console.error('[page]', m.text()));
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.goto(`http://localhost:${server.config.server.port}/ad.html?capture=1${vertical ? '&format=vertical' : ''}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
const dur = await page.evaluate(() => window.__duration);
const total = Math.round(dur * fps);
const t0 = Date.now();
for (let f = 0; f < total; f++) {
  await page.evaluate((t) => window.__seek(t), f / fps);
  for (let attempt = 0; ; attempt++) {
    try {
      await page.screenshot({ path: path.join(framesDir, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92, timeout: 120000 });
      break;
    } catch (e) {
      if (attempt >= 2) throw e;
      console.warn(`\nretrying frame ${f}…`);
    }
  }
  if (f % 30 === 0) process.stdout.write(`\rframe ${f}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
// poster = end card
await page.evaluate((t) => window.__seek(t), dur - 1);
await page.screenshot({ path: path.join(outDir, `${name}-poster.jpg`), type: 'jpeg', quality: 88 });
await browser.close();
await server.close();
console.log('\nencoding…');

const out = path.join(outDir, `${name}.mp4`);
await new Promise((res, rej) => {
  const ff = spawn(
    'ffmpeg',
    ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(framesDir, 'f%05d.jpg'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: 'inherit' }
  );
  ff.on('exit', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exited ' + c))));
});
await fs.rm(framesDir, { recursive: true, force: true });
console.log('✓', path.relative(root, out));
