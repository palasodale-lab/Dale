import '@fontsource/inter-tight/400.css';
import '@fontsource/inter-tight/500.css';
import '@fontsource/inter-tight/600.css';
import '@fontsource/inter-tight/700.css';
import '@fontsource/inter-tight/800.css';
import './styles.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { renderPage } from './dom.js';
import { sections as S, site } from './content.js';
import { Odometer, backOut, remap, clamp, lerp } from './lib/counter.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobileMQ = window.matchMedia('(max-width: 900px)');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

renderPage($('#app'));
const root = document.documentElement;

/* ───────────── Smooth scroll ───────────── */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollTo = (target, opts = {}) => {
  if (lenis) lenis.scrollTo(target, { duration: 1.4, ...opts });
  else {
    const y = typeof target === 'number' ? target : $(target)?.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y + (opts.offset || 0) });
  }
};
$$('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1 && $(id)) {
      e.preventDefault();
      scrollTo(id);
    }
  })
);

/* ───────────── Accent colour + nav state ───────────── */
let currentAccent = S.hero.accent;
const isLight = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 170;
};
let viewIndex = 0; // current elevation in the Views section
function setAccent(c, dur = 0.6) {
  if (!c || c === currentAccent) return;
  currentAccent = c;
  gsap.to(root, { '--accent': c, duration: reduced ? 0 : dur, ease: 'power2.out', overwrite: 'auto' });
  root.style.setProperty('--on-accent', isLight(c) ? '#07080a' : '#ffffff');
}
root.style.setProperty('--accent', currentAccent);

const navLinks = $$('[data-nav]');
$$('.sec').forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 55%',
    end: 'bottom 55%',
    onToggle: (self) => {
      if (!self.isActive) return;
      if (sec.id !== 'views') setAccent(sec.dataset.accent);
      else setAccent(S.views.items[viewIndex]?.accent);
      const navId = { overview: 'overview', built: 'overview', frame: 'overview', stats: 'overview', floorplan: 'floorplan', water: 'water', views: 'views', closing: 'views', specs: 'specs' }[sec.id];
      navLinks.forEach((l) => l.classList.toggle('is-active', l.dataset.nav === navId));
    },
  });
});

/* progress bar */
const bar = $('.progress span');
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => (bar.style.transform = `scaleX(${s.progress})`) });

/* ───────────── Stage: the orbiting house ─────────────
   Each section owns keyframes for the stage state at local progress 0..1.
   One ticker reads scroll, interpolates the target and eases toward it,
   so the image never hard-cuts — it crossfades, scales and rotates. */
const K = (p, s) => ({ p, s });
const base = { x: 0, y: 0, s: 1, ry: 0, rx: 2, op: 1, ghost: 0, wRear: 1, wFront: 0, labels: 0 };
const st = (o) => ({ ...base, ...o });
const heroEnd = st({ y: 0, s: 1, ry: 5, ghost: 0.35 });
const builtEnd = st({ x: 19, y: 2, s: 1.12, ry: 11, rx: 3 });
const builtGone = { ...builtEnd, op: 0, s: 1.35, ry: 16 };
const statsIn = st({ x: 21, y: 4, s: 0.9, ry: -8, rx: 1, wRear: 0, wFront: 1 });
const KEYS = {
  overview: [K(0, st({ y: 4, s: 0.92, ry: -7, rx: 5, ghost: 1 })), K(1, heroEnd)],
  built: [K(0, heroEnd), K(0.55, builtEnd), K(1, builtEnd)],
  frame: [K(0, builtEnd), K(0.1, builtGone), K(1, builtGone)],
  stats: [K(0, { ...statsIn, op: 0, s: 0.8 }), K(0.18, statsIn), K(0.35, { ...statsIn, labels: 1, ry: -4 }), K(0.85, { ...statsIn, labels: 1, ry: 4 }), K(1, { ...statsIn, ry: 6, s: 0.96 })],
  floorplan: [K(0, { ...statsIn, ry: 6, s: 0.96 }), K(0.1, { ...statsIn, op: 0, s: 0.7, y: -8, ry: 14 }), K(1, { ...statsIn, op: 0, s: 0.7 })],
  water: [K(0, st({ op: 0, wRear: 1 })), K(1, st({ op: 0 }))],
  views: [K(0, st({ op: 0 })), K(1, st({ op: 0, y: 12, s: 0.85 }))],
  closing: [K(0, st({ op: 0, y: 12, s: 0.84, ry: -10 })), K(0.3, st({ y: 6, s: 0.86, ry: -4, ghost: 1 })), K(1, st({ y: 3, s: 0.9, ry: 7, ghost: 1 }))],
  specs: [K(0, st({ y: 3, s: 0.9, ry: 7, ghost: 1 })), K(0.35, st({ op: 0, y: -10, s: 0.8, ry: 12, ghost: 0 })), K(1, st({ op: 0, ghost: 0 }))],
};

const secEls = $$('.sec');
let ranges = [];
function measure() {
  ranges = secEls.map((el) => {
    const top = el.offsetTop;
    const len = Math.max(1, el.offsetHeight - window.innerHeight);
    return { id: el.id, top, len, el };
  });
}
measure();
ScrollTrigger.addEventListener('refresh', measure);

function sample(keys, p) {
  if (p <= keys[0].p) return keys[0].s;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (p <= b.p) {
      const t = gsap.parseEase('power1.inOut')((p - a.p) / (b.p - a.p));
      const o = {};
      for (const k in a.s) o[k] = lerp(a.s[k], b.s[k], t);
      return o;
    }
  }
  return keys[keys.length - 1].s;
}
function stageTarget(y) {
  let r = ranges[0];
  for (const rg of ranges) if (y >= rg.top - 1) r = rg;
  return sample(KEYS[r.id] || KEYS.overview, clamp((y - r.top) / r.len));
}

const rig = $('.house-rig');
const imgRear = $('.house-img[data-k="rear"]');
const imgFront = $('.house-img[data-k="front"]');
const depth = $('.house-depth');
const hotspots = $('.hotspots');
const ghost = $('.ghost span');
const glow = $('.stage-glow');
const tilt = $('.house-tilt');
let cur = stageTarget(window.scrollY);
let mouse = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.tx = e.clientX / window.innerWidth - 0.5;
  mouse.ty = e.clientY / window.innerHeight - 0.5;
});

function applyStage(time) {
  const tgt = stageTarget(window.scrollY);
  const k = reduced ? 1 : 0.1;
  for (const key in tgt) cur[key] = lerp(cur[key], tgt[key], k);
  const xMul = mobileMQ.matches ? 0.15 : 1;
  const idle = reduced ? 0 : Math.sin(time * 0.6) * 0.6;
  rig.style.transform = `translate3d(${cur.x * xMul}vw, ${cur.y + idle * 0.6}vh, 0) scale(${cur.s}) rotateY(${cur.ry}deg) rotateX(${cur.rx}deg)`;
  rig.style.opacity = cur.op;
  imgRear.style.opacity = cur.wRear;
  imgFront.style.opacity = cur.wFront;
  // fake depth: parallax the layers against the rotation so it feels like orbiting an object
  imgRear.style.transform = `translate3d(${-cur.ry * 0.25}%, 0, 0)`;
  imgFront.style.transform = `translate3d(${-cur.ry * 0.25}%, 0, 30px)`;
  depth.style.opacity = 0.8 * cur.op;
  depth.src !== (cur.wFront > 0.5 ? imgFront.src : imgRear.src) && (depth.src = cur.wFront > 0.5 ? imgFront.src : imgRear.src);
  hotspots.style.opacity = cur.labels;
  hotspots.style.setProperty('--l', cur.labels);
  ghost.style.opacity = 0.22 * cur.ghost;
  ghost.style.transform = `translateY(-6vh) scale(${1 + (1 - cur.ghost) * 0.08})`;
  glow.style.opacity = 0.75 * cur.op;
  glow.style.transform = `translateX(${cur.x * xMul * 0.85}vw) scale(${cur.s})`;
  mouse.x = lerp(mouse.x, mouse.tx, 0.06);
  mouse.y = lerp(mouse.y, mouse.ty, 0.06);
  if (!reduced) tilt.style.transform = `rotateY(${mouse.x * 6}deg) rotateX(${-mouse.y * 4}deg)`;
}
gsap.ticker.add(applyStage);

/* hero entrance: house rises from darkness */
if (!reduced) {
  gsap.from('.house-intro', { y: 140, opacity: 0, filter: 'brightness(0)', duration: 2.4, ease: 'expo.out', delay: 0.2 });
  gsap.from('.ghost', { opacity: 0, scale: 1.08, duration: 2.8, ease: 'power2.out' });
  gsap.from('.sec-hero .line-inner', { yPercent: 110, duration: 1.2, ease: 'expo.out', delay: 0.9 });
  gsap.from(['.hero-eyebrow', '.hero-sub', '.hero-tag', '.sec-hero .badges li', '.scroll-cue'], { opacity: 0, y: 14, duration: 1, stagger: 0.08, delay: 1.2, ease: 'power3.out' });
}

/* ───────────── Headline reveals (mask slide-up, chromatic blur on exit) ───────────── */
const CHROMA = '3px 0 0 rgba(255,40,60,.75), -3px 0 0 rgba(40,200,255,.75)';
function sectionTimeline(sec, { enter = 0.18, exit = 0.86 } = {}) {
  const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });
  const inners = $$('.reveal .line-inner', sec);
  const bodies = $$('.reveal-body', sec);
  if (reduced) return { tl, apply: () => {} };
  gsap.set(inners, { yPercent: 115 });
  gsap.set(bodies, { opacity: 0, y: 20 });
  tl.to(inners, { yPercent: 0, duration: enter, stagger: enter * 0.25, ease: 'power3.out' }, 0);
  tl.to(bodies, { opacity: 1, y: 0, duration: enter, ease: 'power2.out' }, enter * 0.6);
  tl.to(inners, { filter: 'blur(10px)', textShadow: CHROMA, opacity: 0, yPercent: -30, duration: 1 - exit, stagger: 0.02 }, exit);
  tl.to(bodies, { opacity: 0, filter: 'blur(6px)', duration: 1 - exit }, exit);
  tl.set({}, {}, 1);
  return tl;
}
function scrub(sec, onProgress, opts) {
  const tl = sectionTimeline(sec, opts);
  ScrollTrigger.create({
    trigger: sec,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      tl.progress?.(self.progress);
      onProgress?.(self.progress);
    },
    onRefresh: (self) => {
      tl.progress?.(self.progress);
      onProgress?.(self.progress);
    },
  });
}

/* hero exit */
const heroInners = $$('.sec-hero .line-inner');
const heroFade = $$('.hero-sub, .hero-tag, .sec-hero .badges, .scroll-cue, .hero-eyebrow');
scrub($('.sec-hero'), (p) => {
  if (reduced) return;
  const e = remap(p, 0.45, 0.85);
  gsap.set(heroInners, { filter: `blur(${e * 10}px)`, textShadow: e > 0.02 ? CHROMA : 'none', opacity: 1 - e, y: -e * 40 });
  gsap.set(heroFade, { opacity: 1 - e });
});

/* 2 — built */
scrub($('.sec-built'), null, { enter: 0.2, exit: 0.85 });

/* 2b — steel frame photo: slow push-in, callouts appear one by one */
const framePhoto = $('.frame-photo');
const callouts = $$('.callout');
scrub(
  $('.sec-frame'),
  (p) => {
    if (reduced) {
      callouts.forEach((c) => (c.style.opacity = 1));
      return;
    }
    const vin = remap(p, 0, 0.12);
    const vout = remap(p, 0.9, 1);
    framePhoto.style.opacity = Math.min(vin, 1 - vout);
    framePhoto.style.transform = `scale(${1.25 - 0.2 * p})`;
    framePhoto.style.filter = `blur(${(1 - vin) * 12}px) saturate(${0.6 + vin * 0.4})`;
    callouts.forEach((c, i) => {
      const a = Math.min(remap(p, 0.3 + i * 0.12, 0.38 + i * 0.12), 1 - vout);
      c.style.opacity = a;
      c.style.transform = `translateY(${(1 - a) * 10}px)`;
    });
    gsap.set('.frame-caption, .frame-shade', { opacity: Math.min(vin, 1 - vout) });
  },
  { enter: 0.16, exit: 0.88 }
);

/* 3 — stats count-up */
const statOdo = new Odometer($('.sec-stats .stat-num'), { target: S.stats.count });
const statWrap = $('.sec-stats .stat');
scrub(
  $('.sec-stats'),
  (p) => {
    const t = reduced ? 1 : remap(p, 0.05, 0.4);
    statOdo.set(S.stats.count * backOut(t, 2.2));
    if (!reduced) gsap.set(statWrap, { opacity: Math.min(remap(p, 0.02, 0.1), 1 - remap(p, 0.86, 0.98)) });
  },
  { enter: 0.2, exit: 0.86 }
);
// hotspot leader lines draw as labels fade in
gsap.ticker.add(() => {
  const l = parseFloat(hotspots.style.opacity) || 0;
  $$('.hotspot-line', hotspots).forEach((el) => (el.style.transform = `scaleX(${clamp(l * 1.4 - 0.2)})`));
});

/* 4 — floor plan */
const rooms = $$('.room');
const roomItems = $$('.plan-list li');
const capIdx = $('.plan-caption-idx');
const capName = $('.plan-caption-name');
const capText = $('.plan-caption-text');
const areaEl = $('.plan-area-num');
const area = { v: 0 };
const planTilt = $('.plan-tilt');
let roomIdx = -1;
function setRoom(i) {
  if (i === roomIdx) return;
  roomIdx = i;
  const r = S.floorplan.rooms[i];
  rooms.forEach((el, k) => el.classList.toggle('is-active', k === i));
  roomItems.forEach((el, k) => el.classList.toggle('is-active', k === i));
  const n = S.floorplan.rooms.length;
  const swap = () => {
    capIdx.textContent = `${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
    capName.textContent = r.name;
    capText.textContent = r.caption;
  };
  if (reduced) swap();
  else
    gsap.timeline()
      .to([capName, capText], { opacity: 0, y: -8, duration: 0.18, ease: 'power2.in', onComplete: swap })
      .to([capName, capText], { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' });
  gsap.to(area, { v: r.area, duration: reduced ? 0 : 0.7, ease: 'back.out(2)', onUpdate: () => (areaEl.textContent = area.v.toFixed(1)) });
}
setRoom(0);
scrub(
  $('.sec-plan'),
  (p) => {
    const n = S.floorplan.rooms.length;
    setRoom(Math.min(n - 1, Math.floor(remap(p, 0.12, 0.92) * n)));
    if (reduced) return;
    const inP = backOut(remap(p, 0.0, 0.14), 1.2);
    const out = remap(p, 0.93, 1);
    planTilt.style.transform = `scale(${0.6 + 0.4 * inP - out * 0.1}) rotateX(${lerp(34, 16, p)}deg) rotateZ(${lerp(-5, 3, p)}deg) translateY(${out * -4}vh)`;
    planTilt.style.opacity = Math.min(remap(p, 0, 0.08), 1 - out);
    gsap.set('.plan-card', { opacity: Math.min(remap(p, 0.08, 0.16), 1 - out), x: (1 - remap(p, 0.06, 0.16)) * 40 });
    gsap.set('.plan-caption', { opacity: Math.min(remap(p, 0.1, 0.16), 1 - out) });
  },
  { enter: 0.1, exit: 0.93 }
);

/* 5 — water */
const waterOdo = new Odometer($('.sec-water .stat-num'), { target: S.water.count, step: 100 });
const tankFill = $('.tank-fill');
const pipe = $('.pipes polyline');
const waterBox = $('.water-box');
const waterBg = $('.water-bg');
scrub(
  $('.sec-water'),
  (p) => {
    const fill = reduced ? 1 : remap(p, 0.2, 0.7);
    waterOdo.set(S.water.count * backOut(fill, 1.6));
    tankFill.style.transform = `scaleY(${clamp(backOut(fill, 1.2) * 0.92)})`;
    pipe.style.strokeDashoffset = reduced ? 0 : 1 - remap(p, 0.08, 0.3);
    if (reduced) {
      waterBg.style.opacity = 1;
      return;
    }
    waterBg.style.opacity = Math.min(remap(p, 0, 0.1), 1 - remap(p, 0.9, 1));
    const zoom = remap(p, 0.3, 0.75);
    waterBox.style.transform = `scale(${1 + zoom * 0.35}) translateX(${(1 - remap(p, 0, 0.12)) * 6}vw)`;
    waterBox.style.opacity = Math.min(remap(p, 0.02, 0.12), 1 - remap(p, 0.9, 1));
    gsap.set('.sec-water .stat', { opacity: Math.min(remap(p, 0.12, 0.2), 1 - remap(p, 0.88, 0.97)) });
  },
  { enter: 0.18, exit: 0.88 }
);

/* 6 — views: scroll OR click swaps view with a masked wipe */
const layers = $$('.view-layer');
const swatches = $$('.swatch');
const viewsBox = $('.views-box');
layers[0].classList.add('is-shown');
function setView(i, fromClick = false) {
  if (i === viewIndex) return;
  const prev = layers[viewIndex];
  const next = layers[i];
  const dir = i > viewIndex ? 1 : -1;
  viewIndex = i;
  layers.forEach((l) => l.classList.remove('is-active'));
  next.classList.add('is-active');
  swatches.forEach((s, k) => {
    s.classList.toggle('is-active', k === i);
    s.setAttribute('aria-selected', k === i);
  });
  setAccent(S.views.items[i].accent);
  gsap.killTweensOf(layers);
  if (reduced) {
    layers.forEach((l) => (l.style.clipPath = 'inset(0 0 0 100%)'));
    next.style.clipPath = 'inset(0 0 0 0)';
    return;
  }
  gsap.fromTo(
    next,
    { clipPath: dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)', scale: 1.06, rotateY: dir * -8, filter: 'brightness(1.6)' },
    { clipPath: 'inset(0 0 0 0%)', scale: 1, rotateY: 0, filter: 'brightness(1)', duration: 1.05, ease: 'expo.inOut' }
  );
  gsap.to(prev, { scale: 0.96, opacity: 0.4, duration: 1.05, ease: 'expo.inOut', onComplete: () => gsap.set(prev, { clipPath: 'inset(0 0 0 100%)', opacity: 1, scale: 1 }) });
  if (fromClick) {
    const r = ranges.find((x) => x.id === 'views');
    const n = layers.length;
    scrollTo(r.top + r.len * (0.12 + (0.82 * (i + 0.5)) / n), { duration: 1 });
  }
}
swatches.forEach((s) => s.addEventListener('click', () => setView(+s.dataset.i, true)));
$$('.toggle-btn').forEach((b) =>
  b.addEventListener('click', () => {
    const blue = b.dataset.mode === 'blueprint';
    viewsBox.classList.toggle('is-blueprint', blue);
    $$('.toggle-btn').forEach((x) => {
      x.classList.toggle('is-on', x === b);
      x.setAttribute('aria-pressed', x === b);
    });
  })
);
let clickLock = 0;
swatches.forEach((s) => s.addEventListener('click', () => (clickLock = performance.now() + 1100)));
scrub(
  $('.sec-views'),
  (p) => {
    const n = layers.length;
    if (performance.now() > clickLock) setView(Math.min(n - 1, Math.max(0, Math.floor(remap(p, 0.12, 0.94) * n))));
    if (reduced) return;
    const vin = remap(p, 0, 0.1);
    const vout = remap(p, 0.94, 1);
    gsap.set('.views-stage', { opacity: Math.min(vin, 1 - vout), scale: 0.92 + vin * 0.08 });
    gsap.set('.swatches, .toggle', { opacity: Math.min(remap(p, 0.06, 0.12), 1 - vout) });
  },
  { enter: 0.1, exit: 0.94 }
);

/* 7 — closing */
const ccOdos = $$('.cc-num').map((el, i) => new Odometer(el, { target: S.closing.counts[i].value, separators: false }));
scrub(
  $('.sec-closing'),
  (p) => {
    ccOdos.forEach((o, i) => o.set(o.target * backOut(reduced ? 1 : remap(p, 0.18 + i * 0.06, 0.4 + i * 0.06), 2)));
    if (reduced) return;
    gsap.set('.closing-counts', { opacity: Math.min(remap(p, 0.15, 0.25), 1 - remap(p, 0.9, 1)) });
    gsap.set('.closing-bottom', { opacity: Math.min(remap(p, 0.3, 0.45), 1 - remap(p, 0.92, 1)), y: (1 - remap(p, 0.3, 0.45)) * 30 });
  },
  { enter: 0.2, exit: 0.92 }
);

/* 8 — compare table */
if (!reduced) {
  gsap.set('.sec-compare .line-inner', { yPercent: 115 });
  ScrollTrigger.create({
    trigger: '.sec-compare',
    start: 'top 70%',
    once: true,
    onEnter: () => gsap.to('.sec-compare .line-inner', { yPercent: 0, duration: 1.1, ease: 'expo.out' }),
  });
  $$('.c-row').forEach((row, i) => {
    gsap.set(row, { opacity: 0, y: 24 });
    ScrollTrigger.create({
      trigger: row,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        gsap.to(row, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: (i % 3) * 0.05 });
        $$('.num', row).forEach((n) => {
          const to = +n.dataset.to;
          const o = { v: 0 };
          gsap.to(o, {
            v: to,
            duration: 1.3,
            ease: 'back.out(1.6)',
            onUpdate: () => (n.textContent = Math.max(0, Math.round(o.v)).toLocaleString('en-US')),
          });
        });
      },
    });
  });
}

/* ───────────── Film modal ───────────── */
const film = $('.film');
const video = $('.film-video');
$$('[data-film]').forEach((b) =>
  b.addEventListener('click', () => {
    film.hidden = false;
    lenis?.stop();
    video.play().catch(() => {});
  })
);
const closeFilm = () => {
  film.hidden = true;
  video.pause();
  lenis?.start();
};
$('.film-close').addEventListener('click', closeFilm);
film.addEventListener('click', (e) => e.target === film && closeFilm());
window.addEventListener('keydown', (e) => e.key === 'Escape' && !film.hidden && closeFilm());

/* refresh after images/fonts load so ranges are exact */
window.addEventListener('load', () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());
mobileMQ.addEventListener?.('change', () => ScrollTrigger.refresh());
console.info(`%c${site.title}`, 'color:#c8924f;font-weight:800');
