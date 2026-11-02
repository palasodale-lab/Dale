/**
 * MOTO HOUSE — 25 s 3D ad film (DPC logo intro → house story → logo lockup).
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
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const params = new URLSearchParams(location.search);
const capture = params.has('capture');
const vertical = params.get('format') === 'vertical';
const DUR = 25;

/* ───────────── DOM ───────────── */
const el = document.getElementById('ad');
el.classList.toggle('is-vertical', vertical);
document.body.classList.toggle('is-capture', capture);
const m = (t, cls = '') => `<span class="mask ${cls}"><span>${t}</span></span>`;
const logoImg = (cls = '') => `<img class="${cls}" src="${images.logo}" alt="DPC – Dokona Papua Construction Limited" />`;
const gallery = [
  { src: images.rearIso, cap: 'Verandah living' },
  { src: images.left, cap: 'Louvre airflow' },
  { src: images.floorplan, cap: 'Every room, at a glance' },
];
el.innerHTML = `
  <div class="a-layer a-back"><div class="a-ghost">MOTO</div></div>
  <div class="a-layer a-front">
    <div class="a-photo"><img src="${images.steelFrame}" alt="" /><span class="a-photo-cap">Actual DPC steel frame</span></div>
    <div class="a-gallery">${gallery.map((g, i) => `<figure class="a-g" data-i="${i}"><img class="a-g-bg" src="${g.src}" alt="" /><img class="a-g-img" src="${g.src}" alt="" /><figcaption>${g.cap}</figcaption></figure>`).join('')}</div>
    <div class="a-mark">${logoImg('a-mark-logo')}<span>DPC <b>–</b> Moto House</span></div>
    <div class="a-block a-center a-presents a-small">${C.presents}</div>
    <div class="a-block a-center a-title">
      <h1 class="a-h a-xl">${m(C.title)}</h1>
      <div class="a-m">${m(C.subtitle)}</div>
    </div>
    <div class="a-block a-left a-frame">
      <div class="a-small">01 — Structure</div>
      <h2 class="a-h a-l">${m(C.frame)}</h2>
      <div class="a-sub">${C.frameSub}</div>
      <div class="a-features">${C.features.filter((f) => !/rain/i.test(f)).map((f) => `<span>${f}</span>`).join('')}</div>
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
    </div>
    <div class="a-outro">
      <div class="a-ring"></div><div class="a-ring a-ring--2"></div>
      <div class="a-outro-logo">${logoImg()}<i class="a-shine"></i></div>
      <div class="a-outro-title">${m(C.title)}</div>
      <div class="a-outro-tag">${C.outroTag}</div>
      <ul class="a-chips"><li>${C.priceLead} ${C.price}</li><li>${C.supply}</li><li>${C.comingSoon}</li></ul>
    </div>
    <div class="a-disc">${C.disclaimer}</div>
    <div class="a-corner">Proposed concept – subject to final design</div>
    <div class="a-bar"></div>
  </div>
  <div class="a-layer a-flash"></div>
  <div class="a-layer a-fx"></div>`;
if (!capture)
  document.body.insertAdjacentHTML(
    'beforeend',
    `<div class="a-controls"><button type="button" data-act="replay">↺ Replay</button><a href="?format=${vertical ? 'wide' : 'vertical'}">${vertical ? '16:9' : '9:16'}</a><a href="./">← Site</a></div>`
  );

/* ───────────── Three.js: renderer + house scene ───────────── */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: capture });
renderer.setPixelRatio(capture ? 1 : Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
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
const keep = new Set(['pile', 'steel', 'timberDark', 'black', 'lamp'].map((k) => house.materials[k]));
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

const hash = (i, k) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
// atmosphere: drifting dust motes (deterministic from time)
const N = 380;
const dustGeo = new THREE.BufferGeometry();
const seeds = new Float32Array(N * 3);
for (let i = 0; i < N; i++) seeds.set([(hash(i, 1) - 0.5) * 34, hash(i, 2) * 12, (hash(i, 3) - 0.5) * 34], i * 3);
dustGeo.setAttribute('position', new THREE.BufferAttribute(seeds.slice(), 3));
scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: '#ffd9b0', size: 0.05, transparent: true, opacity: 0.55, depthWrite: false })));
const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 200);

/* ───────────── Three.js: logo coin intro scene ───────────── */
const introScene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
introScene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const introCam = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 100);
introCam.position.set(0, 0, 6);
const logoTex = new THREE.TextureLoader().load(images.logo, () => (logoReady = true));
let logoReady = false;
logoTex.colorSpace = THREE.SRGBColorSpace;
logoTex.anisotropy = 8;
logoTex.center.set(0.5, 0.5);
logoTex.rotation = Math.PI / 2; // cylinder cap UVs are rotated a quarter turn
const gold = new THREE.MeshStandardMaterial({ color: '#d4a63f', metalness: 1, roughness: 0.22 });
const face = new THREE.MeshStandardMaterial({ map: logoTex, metalness: 0.55, roughness: 0.32, emissive: '#ffffff', emissiveMap: logoTex, emissiveIntensity: 0.28 });
const coin = new THREE.Group();
const disc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.1, 128, 1), [gold, face, face]);
disc.rotation.x = Math.PI / 2; // cap faces the camera
coin.add(disc);
// reeded edge
for (let i = 0; i < 120; i++) {
  const a = (i / 120) * Math.PI * 2;
  const r = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.1), gold);
  r.position.set(Math.cos(a) * 1.004, Math.sin(a) * 1.004, 0);
  coin.add(r);
}
introScene.add(coin);
const sweep = new THREE.PointLight('#fff2cc', 40, 12, 1.6);
introScene.add(sweep);
introScene.add(new THREE.AmbientLight('#ffffff', 0.25));
const keyLight = new THREE.DirectionalLight('#ffe6b0', 1.4);
keyLight.position.set(-3, 4, 5);
introScene.add(keyLight);
// gold embers
const NE = 260;
const emberGeo = new THREE.BufferGeometry();
const emberSeed = new Float32Array(NE * 3);
for (let i = 0; i < NE; i++) emberSeed.set([(hash(i, 4) - 0.5) * 9, (hash(i, 5) - 0.5) * 6, (hash(i, 6) - 0.5) * 4 - 1], i * 3);
emberGeo.setAttribute('position', new THREE.BufferAttribute(emberSeed.slice(), 3));
const embers = new THREE.Points(emberGeo, new THREE.PointsMaterial({ color: '#f2c45a', size: 0.035, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
introScene.add(embers);

/* ───────────── Timeline (the whole film) ─────────────
   0–3.4 logo coin · 3.4 title · 6.6 steel frame · 10 price · 13 real renders
   16 supply only · 19 coming soon · 22.2 logo lockup */
// cam: theta = orbit angle (0 = front, π = rear), phi = elevation, r = distance, ty = look-at height
const S = { intro: 1, cz: -14, cry: -4 * Math.PI, crx: 0, sweepX: -5, exposure: 1.05, sx: 0, sy: 0, theta: -2.45, phi: 0.06, r: 8.5, ty: 1.0, skin: 1, roofLift: 0, roofOp: 1, glowI: 0, count: 0, bar: 0 };
const palette = [ACCENTS.burgundy, ACCENTS.timber, '#9aa4aa', ACCENTS.orange, ACCENTS.green, ACCENTS.green, ACCENTS.burgundy, '#c79a3c'].map((c) => new THREE.Color(c));
const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
const show = (sel, at, d = 0.6) => tl.fromTo(sel, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power2.out' }, at);
const hide = (sel, at, d = 0.45) => tl.to(sel, { opacity: 0, filter: 'blur(14px)', duration: d, ease: 'power2.in' }, at);
const rise = (sel, at, d = 1) => tl.fromTo(`${sel} .mask > span`, { yPercent: 115 }, { yPercent: 0, duration: d, stagger: 0.08, ease: 'expo.out' }, at);
const chroma = (sel, at) =>
  tl.fromTo(sel, { textShadow: '0.06em 0 0 rgba(255,40,60,.9), -0.06em 0 0 rgba(40,200,255,.9)' }, { textShadow: '0em 0 0 rgba(255,40,60,0), 0em 0 0 rgba(40,200,255,0)', duration: 0.5, ease: 'power3.out' }, at);

tl.to(S, { bar: 1, duration: DUR, ease: 'none' }, 0);
tl.set('.a-mark, .a-corner', { opacity: 0 }, 0);

// 0 – 3.4  DPC logo: a gold coin spins out of the dark, light sweeps across, flash-cut to the house
tl.fromTo(S, { exposure: 0 }, { exposure: 1.1, duration: 1.0, ease: 'power2.out' }, 0);
tl.to(S, { cz: 0, cry: 0, duration: 2.2, ease: 'expo.out' }, 0.1);
tl.fromTo(S, { sweepX: -5 }, { sweepX: 5, duration: 1.4, ease: 'power1.inOut' }, 1.2);
show('.a-presents', 1.7, 0.6);
tl.to(S, { cz: 4.3, crx: -0.35, duration: 0.75, ease: 'power3.in' }, 2.65);
tl.fromTo('.a-flash', { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.in' }, 3.0);
tl.set(S, { intro: 0, exposure: 1.05 }, 3.3);
tl.set('.a-presents', { opacity: 0 }, 3.3);
tl.to('.a-flash', { opacity: 0, duration: 0.6, ease: 'power2.out' }, 3.3);
tl.to('.a-mark, .a-corner', { opacity: 0.85, duration: 0.6 }, 3.5);

// house sections — `O` shifts each block on the master clock
let O = 3.4;
// title: rise from the piles
tl.to(S, { theta: -1.75, phi: 0.36, r: 19, ty: 2.3, duration: 3.6, ease: 'power3.inOut' }, O);
tl.fromTo('.a-ghost', { opacity: 0, scale: 1.1 }, { opacity: 0.22, scale: 1, duration: 2.2, ease: 'power2.out' }, O + 0.3);
show('.a-title', O + 0.5, 0.2);
rise('.a-title', O + 0.5, 1.2);
hide('.a-title', O + 3.0);

// steel frame reveal + real frame photo
tl.to(S, { theta: -0.95, phi: 0.3, r: 17, ty: 2.6, duration: 3.4 }, O + 3.4);
tl.to(S, { skin: 0, duration: 0.9 }, O + 3.6);
tl.to(S, { sx: 0.2, duration: 1.4 }, O + 3.3);
tl.to(S, { glowI: 2, duration: 1 }, O + 3.4);
show('.a-frame', O + 3.8, 0.2);
rise('.a-frame', O + 3.8);
tl.from('.a-frame .a-sub, .a-frame .a-features span', { opacity: 0, y: 14, stagger: 0.08, duration: 0.6, ease: 'power3.out' }, O + 4.3);
tl.fromTo('.a-photo', { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' }, O + 4.75);
tl.fromTo('.a-photo img', { scale: 1.18 }, { scale: 1.04, duration: 1.6, ease: 'none' }, O + 4.75);
tl.to('.a-photo', { opacity: 0, duration: 0.35, ease: 'power2.in' }, O + 6.0);
tl.to(S, { skin: 1, duration: 0.8 }, O + 6.0);
hide('.a-frame', O + 6.25);
tl.to('.a-ghost', { opacity: 0, duration: 0.6 }, O + 3.4);

// price
tl.to(S, { theta: 0.55, phi: 0.16, r: 21, ty: 2.4, duration: 3.2 }, O + 6.4);
tl.to(S, { glowI: 3, duration: 1 }, O + 6.4);
tl.to(S, { sx: 0.22, duration: 1.2 }, O + 6.4);
show('.a-price', O + 6.8, 0.2);
rise('.a-price', O + 6.8);
tl.fromTo(S, { count: 0 }, { count: 100, duration: 1.3, ease: 'expo.out' }, O + 7.1);
chroma('.a-price .a-num', O + 7.3);
tl.fromTo('.a-price .a-num', { scale: 1.25 }, { scale: 1, duration: 0.7, ease: 'back.out(2)' }, O + 7.1);
hide('.a-price', O + 9.4);

// 13 – 16  real DPC renders: three quick Ken-Burns cuts with masked wipes
const G = O + 9.6;
tl.to(S, { glowI: 4, sx: 0, duration: 1 }, G);
tl.fromTo('.a-gallery', { opacity: 0 }, { opacity: 1, duration: 0.3 }, G);
gallery.forEach((g, i) => {
  const at = G + i * 1.0;
  const sel = `.a-g[data-i="${i}"]`;
  tl.fromTo(sel, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 0.55, ease: 'expo.inOut' }, at);
  tl.fromTo(`${sel} .a-g-img`, { scale: 1.16, xPercent: i % 2 ? 3 : -3 }, { scale: 1.02, xPercent: 0, duration: 1.5, ease: 'none' }, at);
  tl.fromTo(`${sel} figcaption`, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, at + 0.35);
  if (i > 0) tl.to(`.a-g[data-i="${i - 1}"] figcaption`, { opacity: 0, duration: 0.15 }, at);
});
tl.to('.a-gallery', { opacity: 0, duration: 0.4 }, G + 3.0);

// supply only — roof lifts, look inside
const P = G + 3.0 - 9.4; // offset so the original supply choreography starts after the gallery
tl.set(S, { theta: 0.55, phi: 0.16, r: 21, ty: 2.4, sx: 0 }, G + 2.9);
tl.to(S, { theta: 0.15, phi: 1.12, r: 23, ty: 1.2, duration: 2.6 }, P + 9.4);
tl.to(S, { roofLift: 4.5, roofOp: 0, duration: 1.6, ease: 'power3.inOut' }, P + 9.7);
tl.to(S, { glowI: 5, duration: 1 }, P + 9.6);
tl.to(S, { sy: -0.09, duration: 1.6 }, P + 9.4);
show('.a-supply', P + 10.1, 0.2);
rise('.a-supply', P + 10.1);
chroma('.a-supply .a-h', P + 10.2);
tl.from('.a-supply .a-sub', { opacity: 0, y: 12, duration: 0.6 }, P + 10.6);
hide('.a-supply', P + 11.9);
tl.to(S, { roofLift: 0, roofOp: 1, duration: 1.1, ease: 'power3.inOut' }, P + 11.5);

// coming soon
tl.to(S, { theta: 0.85, phi: 0.2, r: 23, ty: 3.6, duration: 2.4, ease: 'power2.inOut' }, P + 11.6);
tl.to(S, { glowI: 6, duration: 1 }, P + 12.4);
tl.to(S, { sy: -0.11, duration: 2.4 }, P + 12.2);
tl.to('.a-ghost', { opacity: 0.18, duration: 1 }, P + 12.6);
show('.a-end', P + 13.3, 0.2);
rise('.a-end', P + 13.3, 1.1);
chroma('.a-end .a-h', P + 13.4);
tl.from('.a-end .a-chips li', { opacity: 0, y: 16, stagger: 0.1, duration: 0.6, ease: 'power3.out' }, P + 13.5);
show('.a-disc', P + 14.0, 0.6);

// 22.2 – 25  logo lockup: house dims, logo lands with rings + shine
const L = P + 15.6;
hide('.a-end', L);
tl.to('.a-ghost, .a-mark', { opacity: 0, duration: 0.5 }, L);
tl.to(S, { exposure: 0.22, glowI: 7, r: 27, theta: 1.05, duration: 1.2, ease: 'power2.inOut' }, L);
tl.fromTo('.a-outro', { opacity: 0 }, { opacity: 1, duration: 0.5 }, L);
tl.fromTo('.a-outro-logo', { opacity: 0, scale: 0.55, rotate: -40 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.1, ease: 'back.out(1.6)' }, L + 0.15);
tl.fromTo('.a-ring', { opacity: 0.9, scale: 0.8 }, { opacity: 0, scale: 1.9, duration: 1.4, stagger: 0.25, ease: 'power2.out' }, L + 0.55);
tl.fromTo('.a-shine', { xPercent: -160 }, { xPercent: 160, duration: 1.0, ease: 'power2.inOut' }, L + 1.0);
rise('.a-outro-title', L + 0.8, 1.0);
tl.fromTo('.a-outro-tag', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, L + 1.2);
tl.fromTo('.a-outro .a-chips li', { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power3.out' }, L + 1.4);
tl.set({}, {}, DUR);

/* ───────────── Per-frame update ───────────── */
const countEl = el.querySelector('.a-count');
const barEl = el.querySelector('.a-bar');
const look = new THREE.Vector3();
const col = new THREE.Color();
function update(time) {
  renderer.toneMappingExposure = S.exposure;
  const vw = el.clientWidth, vh = el.clientHeight;
  const vert = vw < vh;
  const i = Math.min(palette.length - 2, Math.floor(S.glowI));
  col.copy(palette[i]).lerp(palette[i + 1], S.glowI - i);
  document.documentElement.style.setProperty('--accent', '#' + col.getHexString());
  countEl.textContent = Math.round(S.count);
  barEl.style.transform = `scaleX(${S.bar})`;

  if (S.intro > 0.5) {
    coin.position.set(0, vert ? 0.35 : 0.15, S.cz);
    coin.rotation.set(S.crx, S.cry, 0);
    coin.scale.setScalar(vert ? 0.85 : 1);
    sweep.position.set(S.sweepX, 1.2, 2.2);
    const ep = emberGeo.attributes.position;
    for (let k = 0; k < NE; k++) {
      ep.array[k * 3 + 1] = ((emberSeed[k * 3 + 1] + 3 + time * (0.3 + hash(k, 7) * 0.5)) % 6) - 3;
      ep.array[k * 3] = emberSeed[k * 3] + Math.sin(time + k) * 0.15;
    }
    ep.needsUpdate = true;
    renderer.render(introScene, introCam);
    return;
  }

  // camera
  const { theta, phi, ty } = S;
  const r = S.r * (vert ? 1.12 : 1);
  look.set(0, ty, 0.3);
  camera.position.set(look.x + r * Math.cos(phi) * Math.sin(theta), look.y + r * Math.sin(phi) + 0.2, look.z + r * Math.cos(phi) * Math.cos(theta));
  camera.lookAt(look);
  // screen-space framing: slide the house aside so copy never sits on top of it
  camera.setViewOffset(vw, vh, -(vert ? 0 : S.sx) * vw, (vert ? -S.sx * 0.9 : S.sy) * vh, vw, vh);
  // skin fade → steel frame
  for (const o of skin) {
    o.material.opacity = S.skin;
    o.visible = S.skin > 0.01;
    o.material.depthWrite = S.skin > 0.98;
  }
  house.frame.visible = S.skin < 0.99 || S.roofOp < 0.99;
  frameGlow.emissiveIntensity = 0.6 + (1 - S.skin) * 0.8;
  house.roof.position.y = S.roofLift;
  house.roof.traverse((o) => o.isMesh && (o.material.opacity = Math.min(S.skin, S.roofOp)));
  house.roof.visible = S.roofOp > 0.01;
  setGlow(col);
  glow.position.x = house.group.position.x;
  const pos = dustGeo.attributes.position;
  for (let k = 0; k < N; k++) {
    pos.array[k * 3 + 1] = (seeds[k * 3 + 1] + time * 0.25 + Math.sin(time * 0.5 + k) * 0.2) % 12;
    pos.array[k * 3] = seeds[k * 3] + Math.sin(time * 0.3 + k * 0.7) * 0.3;
  }
  pos.needsUpdate = true;
  renderer.render(scene, camera);
}

function resize() {
  const w = el.clientWidth;
  const h = el.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = introCam.aspect = w / h;
  camera.fov = w / h < 1 ? 52 : 32; // vertical cut needs a wider lens to keep the house in frame
  introCam.fov = w / h < 1 ? 48 : 30;
  camera.updateProjectionMatrix();
  introCam.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const whenReady = () =>
  Promise.all([
    document.fonts.ready,
    new Promise((res) => {
      const tick = () => (logoReady ? res() : setTimeout(tick, 50));
      tick();
    }),
    ...[...el.querySelectorAll('img')].map((img) => (img.complete ? null : new Promise((res) => (img.onload = img.onerror = res)))),
  ]);

if (capture) {
  window.__duration = DUR;
  window.__S = S; // exposed for framing checks
  window.__render = (t) => update(t);
  window.__seek = (t) => {
    tl.seek(t, false);
    update(t);
    return true;
  };
  whenReady().then(() => (window.__ready = true));
} else {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now();
  if (reduced) {
    whenReady().then(() => {
      tl.seek(DUR - 0.01);
      update(DUR);
    });
  } else {
    tl.repeat(-1).repeatDelay(1.2).play(0);
    gsap.ticker.add(() => update((performance.now() - t0) / 1000));
  }
  document.querySelector('[data-act="replay"]')?.addEventListener('click', () => tl.restart());
}
