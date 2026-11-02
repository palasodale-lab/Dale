/**
 * MOTO HOUSE — 16 s 3D ad film.
 * Live:     /ad.html            (loops, 16:9)      /ad.html?format=vertical  (9:16 social cut)
 * Capture:  /ad.html?capture=1  exposes window.__seek(t) so scripts/render-ad.mjs can
 *           render frame-perfect video. Copy lives in src/content.js → `ad`.
 */
import '@fontsource/inter-tight/500.css';
import '@fontsource/inter-tight/600.css';
import '@fontsource/inter-tight/700.css';
import '@fontsource/inter-tight/800.css';
import './ad.css';
import * as THREE from 'three';
import gsap from 'gsap';
import { buildHouse, addLights, addGround } from '../three/house.js';
import { ad as C, ACCENTS, images } from '../content.js';
import { dpcLogo } from '../dom.js';

const params = new URLSearchParams(location.search);
const capture = params.has('capture');
const vertical = params.get('format') === 'vertical';
const DUR = 16;

/* ───────────── DOM ───────────── */
const el = document.getElementById('ad');
el.classList.toggle('is-vertical', vertical);
document.body.classList.toggle('is-capture', capture);
const m = (t, cls = '') => `<span class="mask ${cls}"><span>${t}</span></span>`;
el.innerHTML = `
  <div class="a-layer a-back"><div class="a-ghost">MOTO</div></div>
  <div class="a-layer a-front">
    <div class="a-photo"><img src="${images.steelFrame}" alt="" /><span class="a-photo-cap">Actual DPC steel frame</span></div>
    <div class="a-mark">DPC <b>–</b> Moto House</div>
    <div class="a-block a-center a-presents a-small">${C.presents}</div>
    <div class="a-block a-center a-title">
      <h1 class="a-h a-xl">${m(C.title)}</h1>
      <div class="a-m">${m(C.subtitle)}</div>
    </div>
    <div class="a-block a-left a-frame">
      <div class="a-small">01 — Structure</div>
      <h2 class="a-h a-l">${m(C.frame)}</h2>
      <div class="a-sub">${C.frameSub}</div>
      <div class="a-features">${C.features.map((f) => `<span>${f}</span>`).join('')}</div>
    </div>
    <div class="a-block a-left a-price">
      <div class="a-lead">${m(C.priceLead)}</div>
      <div class="a-num">${m('<b class="a-count">0</b>K')}</div>
    </div>
    <div class="a-block a-center a-supply">
      <h2 class="a-h a-l">${m(C.supply)}</h2>
      <div class="a-sub">${C.supplySub}</div>
    </div>
    <div class="a-block a-center a-end">
      <div class="a-small">${C.title} · ${C.subtitle}</div>
      <h2 class="a-h a-xl">${m(C.comingSoon)}</h2>
      <ul class="a-chips"><li>${C.priceLead} ${C.price}</li><li>${C.supply}</li><li>${C.comingSoon}</li></ul>
      <div class="a-logo">${dpcLogo(120)}</div>
    </div>
    <div class="a-disc">${C.disclaimer}</div>
    <div class="a-corner">Proposed concept – subject to final design</div>
    <div class="a-bar"></div>
  </div>
  <div class="a-layer a-fx"></div>`;
if (!capture)
  document.body.insertAdjacentHTML(
    'beforeend',
    `<div class="a-controls"><button type="button" data-act="replay">↺ Replay</button><a href="?format=${vertical ? 'wide' : 'vertical'}">${vertical ? '16:9' : '9:16'}</a><a href="./">← Site</a></div>`
  );

/* ───────────── Three.js scene ───────────── */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: capture });
renderer.setPixelRatio(capture ? 1 : Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 0);
el.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#07080a', 26, 70);
addLights(scene, { shadowSize: capture ? 2048 : 1536 });
const { ground, glow, setGlow } = addGround(scene, ACCENTS.burgundy);
ground.material.color.set('#0a0b0e');
const house = buildHouse();
scene.add(house.group);
house.group.position.x = -0.6;

// "skin" = everything that hides the steel frame (cladding, roof sheets, windows, trims, gutters)
const keep = new Set([house.materials.pile, house.materials.steel, house.materials.timberDark]);
const skin = [];
for (const g of [house.exterior, house.roof, house.interior])
  g.traverse((o) => {
    if (!o.isMesh || keep.has(o.material)) return;
    if (g === house.interior && o.material !== house.materials.interiorWall) return;
    o.material = o.material.clone();
    o.material.transparent = true;
    skin.push(o);
  });
const frameGlow = new THREE.MeshStandardMaterial({ color: '#d6dde1', metalness: 0.85, roughness: 0.3, emissive: '#2f3a42', emissiveIntensity: 0.6 });
house.frame.traverse((o) => o.isMesh && (o.material = frameGlow));

// atmosphere: drifting dust motes (deterministic from time)
const N = 380;
const dustGeo = new THREE.BufferGeometry();
const seeds = new Float32Array(N * 3);
for (let i = 0; i < N; i++) {
  const r = (k) => {
    const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  seeds.set([(r(1) - 0.5) * 34, r(2) * 12, (r(3) - 0.5) * 34], i * 3);
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(seeds.slice(), 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: '#ffd9b0', size: 0.05, transparent: true, opacity: 0.55, depthWrite: false }));
scene.add(dust);

const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 200);

/* ───────────── Timeline (the whole film) ───────────── */
// cam: theta = orbit angle (0 = front, π = rear), phi = elevation, r = distance, ty = look-at height
const S = { sx: 0, sy: 0, theta: -2.45, phi: 0.06, r: 8.5, ty: 1.0, skin: 1, roofLift: 0, roofOp: 1, glowI: 0, count: 0, bar: 0 };
const palette = [ACCENTS.burgundy, ACCENTS.timber, '#9aa4aa', ACCENTS.orange, ACCENTS.green, ACCENTS.burgundy].map((c) => new THREE.Color(c));
const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
const show = (sel, at, d = 0.6) => tl.fromTo(sel, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power2.out' }, at);
const hide = (sel, at, d = 0.45) => tl.to(sel, { opacity: 0, filter: 'blur(14px)', duration: d, ease: 'power2.in' }, at);
const rise = (sel, at, d = 1) => tl.fromTo(`${sel} .mask > span`, { yPercent: 115 }, { yPercent: 0, duration: d, stagger: 0.08, ease: 'expo.out' }, at);
const chroma = (sel, at) =>
  tl.fromTo(sel, { textShadow: '0.06em 0 0 rgba(255,40,60,.9), -0.06em 0 0 rgba(40,200,255,.9)' }, { textShadow: '0em 0 0 rgba(255,40,60,0), 0em 0 0 rgba(40,200,255,0)', duration: 0.5, ease: 'power3.out' }, at);

tl.to(S, { bar: 1, duration: DUR, ease: 'none' }, 0);

// 0 – 3.2  Rise from the piles; title
tl.to(S, { theta: -1.75, phi: 0.36, r: 19, ty: 2.3, duration: 3.6, ease: 'power3.inOut' }, 0);
tl.fromTo('.a-ghost', { opacity: 0, scale: 1.1 }, { opacity: 0.22, scale: 1, duration: 2.2, ease: 'power2.out' }, 0.3);
show('.a-presents', 0.3, 0.8);
hide('.a-presents', 2.1);
show('.a-title', 1.4, 0.2);
rise('.a-title', 1.4, 1.2);
hide('.a-title', 3.25);

// 3.2 – 6.6  Steel frame reveal
tl.to(S, { theta: -0.95, phi: 0.3, r: 17, ty: 2.6, duration: 3.4 }, 3.4);
tl.to(S, { skin: 0, duration: 0.9, ease: 'power2.inOut' }, 3.6);
tl.to(S, { sx: 0.2, duration: 1.4 }, 3.3);
tl.to(S, { glowI: 2, duration: 1 }, 3.4);
show('.a-frame', 3.8, 0.2);
rise('.a-frame', 3.8);
tl.from('.a-frame .a-sub, .a-frame .a-features span', { opacity: 0, y: 14, stagger: 0.08, duration: 0.6, ease: 'power3.out' }, 4.3);
// cut to the real DPC frame photo, then back to 3D
tl.fromTo('.a-photo', { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 4.75);
tl.fromTo('.a-photo img', { scale: 1.18 }, { scale: 1.04, duration: 1.6, ease: 'none' }, 4.75);
tl.to('.a-photo', { opacity: 0, duration: 0.35, ease: 'power2.in' }, 6.0);
tl.to(S, { skin: 1, duration: 0.8 }, 6.0);
hide('.a-frame', 6.25);
tl.to('.a-ghost', { opacity: 0, duration: 0.6 }, 3.4);

// 6.6 – 9.6  Price
tl.to(S, { theta: 0.55, phi: 0.16, r: 21, ty: 2.4, duration: 3.2 }, 6.4);
tl.to(S, { glowI: 3, duration: 1 }, 6.4);
tl.to(S, { sx: 0.22, duration: 1.2 }, 6.4);
show('.a-price', 6.8, 0.2);
rise('.a-price', 6.8);
tl.fromTo(S, { count: 0 }, { count: 100, duration: 1.3, ease: 'expo.out' }, 7.1);
chroma('.a-price .a-num', 7.3);
tl.fromTo('.a-price .a-num', { scale: 1.25 }, { scale: 1, duration: 0.7, ease: 'back.out(2)' }, 7.1);
hide('.a-price', 9.4);

// 9.6 – 12.6  Supply only — roof lifts, look inside
tl.to(S, { theta: 0.15, phi: 1.12, r: 23, ty: 1.2, duration: 2.6 }, 9.4);
tl.to(S, { roofLift: 4.5, roofOp: 0, duration: 1.6, ease: 'power3.inOut' }, 9.7);
tl.to(S, { glowI: 4, duration: 1 }, 9.6);
tl.to(S, { sx: 0, sy: -0.14, duration: 1.6 }, 9.4);
show('.a-supply', 10.1, 0.2);
rise('.a-supply', 10.1);
chroma('.a-supply .a-h', 10.2);
tl.from('.a-supply .a-sub', { opacity: 0, y: 12, duration: 0.6 }, 10.6);
hide('.a-supply', 12.3);
tl.to(S, { roofLift: 0, roofOp: 1, duration: 1.3, ease: 'power3.inOut' }, 12.0);

// 12.6 – 16  Coming soon end card
tl.to(S, { theta: 0.85, phi: 0.2, r: 23, ty: 3.6, duration: 3.6, ease: 'power2.inOut' }, 12.2);
tl.to(S, { glowI: 5, duration: 1 }, 12.4);
tl.to(S, { sy: -0.2, duration: 2.4 }, 12.2);
tl.to('.a-ghost', { opacity: 0.18, duration: 1 }, 12.6);
show('.a-end', 12.8, 0.2);
rise('.a-end', 12.9, 1.2);
chroma('.a-end .a-h', 13.0);
tl.from('.a-end .a-chips li', { opacity: 0, y: 16, stagger: 0.1, duration: 0.6, ease: 'power3.out' }, 13.5);
tl.from('.a-end .a-logo', { opacity: 0, scale: 0.6, rotate: -90, duration: 1, ease: 'expo.out' }, 13.8);
show('.a-disc', 14.0, 0.6);
tl.set({}, {}, DUR);

/* ───────────── Per-frame update ───────────── */
const countEl = el.querySelector('.a-count');
const barEl = el.querySelector('.a-bar');
const look = new THREE.Vector3();
const col = new THREE.Color();
function update(time) {
  // camera
  const { theta, phi, ty } = S;
  const r = S.r * (el.clientWidth < el.clientHeight ? 1.12 : 1);
  look.set(0, ty, 0.3);
  camera.position.set(look.x + r * Math.cos(phi) * Math.sin(theta), look.y + r * Math.sin(phi) + 0.2, look.z + r * Math.cos(phi) * Math.cos(theta));
  camera.lookAt(look);
  // screen-space framing: slide the house aside so copy never sits on top of it
  const vw = el.clientWidth, vh = el.clientHeight;
  const vert = vw < vh;
  camera.setViewOffset(vw, vh, -(vert ? 0 : S.sx) * vw, (vert ? -S.sx * 0.9 : S.sy) * vh, vw, vh);
  // skin fade → steel frame
  for (const o of skin) {
    o.material.opacity = S.skin;
    o.visible = S.skin > 0.01;
    o.material.depthWrite = S.skin > 0.98;
  }
  house.frame.visible = S.skin < 0.99 || S.roofOp < 0.99;
  frameGlow.emissiveIntensity = 0.6 + (1 - S.skin) * 0.8;
  // roof explode
  house.roof.position.y = S.roofLift;
  house.roof.traverse((o) => o.isMesh && (o.material.opacity = Math.min(S.skin, S.roofOp)));
  house.roof.visible = S.roofOp > 0.01;
  // glow colour through the palette
  const i = Math.min(palette.length - 2, Math.floor(S.glowI));
  col.copy(palette[i]).lerp(palette[i + 1], S.glowI - i);
  setGlow(col);
  document.documentElement.style.setProperty('--accent', '#' + col.getHexString());
  glow.position.x = house.group.position.x;
  // dust drift
  const pos = dustGeo.attributes.position;
  for (let k = 0; k < N; k++) {
    pos.array[k * 3 + 1] = (seeds[k * 3 + 1] + time * 0.25 + Math.sin(time * 0.5 + k) * 0.2) % 12;
    pos.array[k * 3] = seeds[k * 3] + Math.sin(time * 0.3 + k * 0.7) * 0.3;
  }
  pos.needsUpdate = true;
  countEl.textContent = Math.round(S.count);
  barEl.style.transform = `scaleX(${S.bar})`;
  renderer.render(scene, camera);
}

function resize() {
  const w = el.clientWidth;
  const h = el.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 1 ? 52 : 32; // vertical cut needs a wider lens to keep the house in frame
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

if (capture) {
  window.__duration = DUR;
  window.__seek = (t) => {
    tl.seek(t, false);
    update(t);
    return true;
  };
  document.fonts.ready.then(() => (window.__ready = true));
} else {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now();
  if (reduced) {
    tl.seek(DUR - 0.01);
    update(DUR);
  } else {
    tl.repeat(-1).repeatDelay(1.2).play(0);
    gsap.ticker.add(() => update((performance.now() - t0) / 1000));
  }
  document.querySelector('[data-act="replay"]')?.addEventListener('click', () => tl.restart());
}
