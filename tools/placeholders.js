// Dev-only page used by scripts/gen-placeholders.mjs to render placeholder "renders"
// of the procedural house at the exact filenames the site expects.
import * as THREE from 'three';
import { buildHouse, addLights, addGround, ROOMS, DIM } from '../src/three/house.js';

const W = 1600, H = 1000;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0c0d10');
scene.fog = new THREE.Fog('#0c0d10', 30, 60);
addLights(scene);
const { setGlow } = addGround(scene, '#3a3f47');
const house = buildHouse();
scene.add(house.group);

const VIEWS = {
  'render-rear-iso': { pos: [-12, 9.5, -12.5], look: [0.6, 2.0, 0], fov: 32, glow: '#5a2a30' },
  'render-front': { pos: [7.5, 3.4, 15.5], look: [0.6, 2.2, 0.8], fov: 34, glow: '#4a3a2a' },
  'render-rear': { pos: [0.8, 2.8, -17], look: [0.8, 2.4, 0], fov: 32, glow: '#3a3f47' },
  'render-right': { pos: [17.5, 2.8, -0.6], look: [0.9, 2.4, -0.4], fov: 32, glow: '#2a3a52' },
  'render-left': { pos: [-17, 2.8, 0.8], look: [-0.4, 2.4, 0.4], fov: 32, glow: '#3a4a30' },
};

function project(cam, v) {
  const p = v.clone().project(cam);
  return [+(((p.x + 1) / 2) * 100).toFixed(2), +(((1 - p.y) / 2) * 100).toFixed(2)];
}

function label(text) {
  // stamp "PLACEHOLDER" on the frame so nobody mistakes it for a real render
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.drawImage(renderer.domElement, 0, 0);
  g.font = '600 18px sans-serif';
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.fillText(text, 28, H - 28);
  return c;
}

window.renderView = (name) => {
  renderer.clippingPlanes = [];
  house.roof.visible = house.tank.visible = true;
  scene.fog.near = 30;
  let cam, extra = {};
  if (name === 'floorplan-3d') {
    cam = new THREE.OrthographicCamera(-8, 8, 5, -5, 0.1, 100);
    cam.position.set(0.3, 22, 9);
    cam.lookAt(0.3, DIM.floorY, 0.6);
    renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), DIM.floorY + 1.25)];
    house.roof.visible = false;
    house.tank.visible = false;
    setGlow('#2c3138');
    cam.updateMatrixWorld();
    const rooms = {};
    for (const [k, [x0, z0, x1, z1]] of Object.entries(ROOMS)) {
      const a = project(cam, new THREE.Vector3(x0, DIM.floorY, z0));
      const b = project(cam, new THREE.Vector3(x1, DIM.floorY, z1));
      rooms[k] = [a[0], a[1], +(b[0] - a[0]).toFixed(2), +(b[1] - a[1]).toFixed(2)];
    }
    extra.rooms = rooms;
  } else {
    const v = VIEWS[name];
    cam = new THREE.PerspectiveCamera(v.fov, W / H, 0.1, 200);
    cam.position.set(...v.pos);
    cam.lookAt(...v.look);
    setGlow(v.glow);
    cam.updateMatrixWorld();
    const A = house.anchors;
    extra.points = {
      raisedFloor: project(cam, A.raisedFloor),
      louvre: project(cam, A.louvre),
      steps: project(cam, A.steps),
      gutter: project(cam, A.gutter),
      downpipe: A.downpipe.map((p) => project(cam, p)),
      gutterRear: A.gutterRear.map((p) => project(cam, p)),
    };
    const t = A.tankBox;
    const corners = [];
    for (const dy of [t.y0, t.y1]) for (const dx of [-t.r, t.r]) for (const dz of [-t.r, t.r])
      corners.push(project(cam, new THREE.Vector3(t.center.x + dx, dy, t.center.z + dz)));
    const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
    extra.tank = [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)].map((n) => +n.toFixed(2));
  }
  renderer.render(scene, cam);
  const c = label('PLACEHOLDER — procedural model, replace with DPC render · ' + name);
  return { dataUrl: c.toDataURL('image/jpeg', 0.9), ...extra };
};
window.__ready = true;
