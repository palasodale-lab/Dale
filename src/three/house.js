/**
 * Procedural low-poly model of the MOTO HOUSE – 2 Bedroom House (DPC).
 * Follows the DPC concept set: 7000 × 6000 plan + 1728 verandah, skillion roof rising toward
 * the verandah, white weatherboard, louvre windows, low black piles, centre hallway with rear
 * steps, rainwater tank beside the rear corner. Light-gauge galvanised steel frame inside.
 *
 * Units: metres. x = width (7 m, +x = right side / kitchen side), z = depth (+z = front / verandah), y = up.
 * Artistic approximation for the ad film only — NOT construction data.
 */
import * as THREE from 'three';

export const DIM = {
  halfX: 3.5,
  halfZ: 3,
  floorY: 0.7, // raised floor
  wallH: 2.4, // rear (low) wall height
  rise: 1.2, // skillion rise from rear to front over 6 m (~11°, as in the renders)
  verandah: 1.73,
};

/** Room rectangles in plan (x0, z0, x1, z1) — from the DPC floor plan (approx.). */
export const ROOMS = {
  bedroom2: [-3.5, -3, -0.1, 0],
  bedroom1: [-3.5, 0, -0.1, 3],
  hallway: [-0.1, -3, 0.9, 3],
  bathroom: [0.9, -3, 3.5, -1.07],
  kitchen: [0.9, -1.07, 3.5, 0.8],
  living: [0.9, 0.8, 3.5, 3],
  laundry: [0.9, -3.85, 3.2, -3],
  verandah: [-3.5, 3, 3.5, 4.73],
};

export const COLORS = {
  roof: '#7a1f2b',
  clad: '#f2f1ec',
  trim: '#ffffff',
  black: '#17181a',
  pile: '#1d1f22',
  steel: '#c3cbcf', // bright zinc-coated light-gauge steel (see public/assets/steel-frame.jpg)
  louvre: '#5a4532',
  door: '#9a6a3c',
  deck: '#7a5638',
  tank: '#c9cfd2',
  slab: '#b9b8b2',
};

/* ---------- canvas textures ---------- */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const BOARD_TILE = 1.36; // metres per texture tile (8 boards)
function weatherboardTex() {
  return canvasTex(64, 256, (g, w, h) => {
    const boards = 8;
    const base = new THREE.Color(COLORS.clad);
    for (let i = 0; i < boards; i++) {
      const y = (i * h) / boards;
      const grad = g.createLinearGradient(0, y, 0, y + h / boards);
      grad.addColorStop(0, '#' + base.clone().getHexString());
      grad.addColorStop(0.8, '#' + base.clone().multiplyScalar(0.93).getHexString());
      grad.addColorStop(1, '#' + base.clone().multiplyScalar(0.62).getHexString());
      g.fillStyle = grad;
      g.fillRect(0, y, w, h / boards);
    }
  });
}
/** Trapezoidal-rib roof sheet (like the burgundy Trimdek-style sheets in the DPC renders): 1 rib per tile. */
function roofSheetTex(hex) {
  return canvasTex(64, 8, (g, w, h) => {
    const c = new THREE.Color(hex);
    const hx = (k) => '#' + c.clone().multiplyScalar(k).getHexString();
    g.fillStyle = hx(1.0);
    g.fillRect(0, 0, w, h); // pan
    g.fillStyle = hx(0.55);
    g.fillRect(w * 0.70, 0, w * 0.06, h); // shadowed rib side
    g.fillStyle = hx(1.35);
    g.fillRect(w * 0.76, 0, w * 0.12, h); // rib crest highlight
    g.fillStyle = hx(0.8);
    g.fillRect(w * 0.88, 0, w * 0.05, h);
    g.fillStyle = hx(0.92);
    for (const x of [0.22, 0.46]) g.fillRect(w * x, 0, 1, h); // minor ribs
  });
}
const RIB = 0.19; // metres between major ribs
function ribTex(hex, ribs = 16, dark = 0.6, light = 1.25) {
  return canvasTex(256, 16, (g, w, h) => {
    const base = new THREE.Color(hex);
    for (let i = 0; i < ribs; i++) {
      const x0 = (i * w) / ribs;
      const grad = g.createLinearGradient(x0, 0, x0 + w / ribs, 0);
      grad.addColorStop(0, '#' + base.clone().multiplyScalar(dark).getHexString());
      grad.addColorStop(0.45, '#' + base.clone().multiplyScalar(light).getHexString());
      grad.addColorStop(1, '#' + base.clone().multiplyScalar(dark).getHexString());
      g.fillStyle = grad;
      g.fillRect(x0, 0, w / ribs, h);
    }
  });
}

/* ---------- helpers ---------- */
const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...opts });
function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}
/** Square-section member between two points (frame / truss webs / rails). */
function member(a, b, t, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(t, t, a.distanceTo(b)), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.lookAt(b); // +z (long axis) toward b
  return m;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function texFor(material, u, v) {
  const m = material.clone();
  m.map = material.map.clone();
  m.map.repeat.set(u, v);
  m.map.needsUpdate = true;
  return m;
}

/** Louvre window (dark timber blades in a white frame), facing +z in local space. */
function louvreWindow(w, h, M, split = true) {
  const g = new THREE.Group();
  const f = 0.07;
  g.add(box(w, h, 0.03, M.glass, 0, 0, 0));
  g.add(box(w + f * 2, f, 0.08, M.trim, 0, h / 2 + f / 2, 0.02));
  g.add(box(w + f * 2.4, f, 0.12, M.trim, 0, -h / 2 - f / 2, 0.04));
  g.add(box(f, h, 0.08, M.trim, -w / 2 - f / 2, 0, 0.02));
  g.add(box(f, h, 0.08, M.trim, w / 2 + f / 2, 0, 0.02));
  if (split) g.add(box(0.05, h, 0.07, M.louvre, 0, 0, 0.03));
  const n = Math.max(5, Math.round(h / 0.1));
  for (let i = 0; i < n; i++) {
    const s = box(w - 0.02, 0.012, 0.1, M.louvre, 0, -h / 2 + (i + 0.5) * (h / n), 0.04);
    s.rotation.x = -0.5;
    g.add(s);
  }
  return g;
}

/**
 * Build the house. Returns { group, roof, tank, interior, exterior, frame, materials }.
 * `roof` can be lifted / faded (exploded view); `frame` is the steel skeleton inside the walls.
 */
export function buildHouse() {
  const { halfX, halfZ, floorY, wallH, rise, verandah } = DIM;
  const slope = rise / (halfZ * 2);
  const topAt = (z) => floorY + wallH + slope * (z + halfZ); // wall top / roof underside at depth z
  const group = new THREE.Group();

  const cladBase = new THREE.MeshStandardMaterial({ map: weatherboardTex(), roughness: 0.7 });
  const roofBase = new THREE.MeshStandardMaterial({ map: roofSheetTex('#4f141c'), roughness: 0.6, metalness: 0.12, side: THREE.DoubleSide }); // deep maroon
  const M = {
    clad: cladBase,
    roof: roofBase,
    trim: mat(COLORS.trim, { roughness: 0.5 }),
    black: mat(COLORS.black, { roughness: 0.6 }),
    pile: mat(COLORS.pile, { roughness: 0.45, metalness: 0.5 }),
    steel: mat(COLORS.steel, { roughness: 0.3, metalness: 0.8 }),
    timberDark: mat(COLORS.deck, { roughness: 0.8 }),
    louvre: mat(COLORS.louvre, { roughness: 0.6 }),
    door: mat(COLORS.door, { roughness: 0.55 }),
    glass: mat('#1b2328', { roughness: 0.2, metalness: 0.5 }),
    tank: new THREE.MeshStandardMaterial({ map: ribTex(COLORS.tank, 18, 0.72, 1.12), roughness: 0.35, metalness: 0.55 }),
    slab: mat(COLORS.slab, { roughness: 0.9 }),
    gutter: mat('#f4f4f2', { roughness: 0.4, metalness: 0.2 }),
    floor: mat('#c9a77d', { roughness: 0.7 }),
    tile: mat('#d5d8d8', { roughness: 0.4 }),
    interiorWall: mat('#f4f1ea', { roughness: 0.9 }),
    lamp: new THREE.MeshStandardMaterial({ color: '#2a2a2a', emissive: '#ffd59a', emissiveIntensity: 1.4 }),
  };
  M.tank.map.repeat.set(1, 14);
  M.tank.map.rotation = Math.PI / 2;

  const exterior = new THREE.Group();
  const interior = new THREE.Group();
  const roof = new THREE.Group();
  const frame = new THREE.Group();
  group.add(exterior, interior, roof, frame);

  /* ── subfloor: low black piles + bearers ── */
  const pileH = floorY - 0.18;
  const piles = [];
  for (const x of [-3.4, -1.7, 0, 1.7, 3.4]) for (const z of [-2.9, -1, 1, 2.9]) piles.push([x, z]);
  for (const x of [-3.4, -1.2, 1.2, 3.4]) piles.push([x, 4.6]);
  for (const [x, z] of piles) exterior.add(box(0.14, pileH, 0.14, M.pile, x, pileH / 2, z));
  exterior.add(box(halfX * 2 + 0.06, 0.2, halfZ * 2 + 0.06, M.black, 0, floorY - 0.1, 0));
  interior.add(box(halfX * 2 - 0.1, 0.03, halfZ * 2 - 0.1, M.floor, 0, floorY + 0.015, 0));

  /* ── walls (white weatherboard) ── */
  const t = 0.12;
  const rearTop = floorY + wallH;
  const frontTop = floorY + wallH + rise;
  exterior.add(box(halfX * 2, wallH, t, texFor(cladBase, (halfX * 2) / BOARD_TILE, wallH / BOARD_TILE), 0, floorY + wallH / 2, -halfZ));
  exterior.add(box(halfX * 2, wallH + rise, t, texFor(cladBase, (halfX * 2) / BOARD_TILE, (wallH + rise) / BOARD_TILE), 0, floorY + (wallH + rise) / 2, halfZ));
  // side walls: trapezoids (skillion)
  const side = new THREE.Shape();
  side.moveTo(-halfZ, 0);
  side.lineTo(halfZ, 0);
  side.lineTo(halfZ, wallH + rise);
  side.lineTo(-halfZ, wallH);
  side.closePath();
  const sideGeo = new THREE.ExtrudeGeometry(side, { depth: t, bevelEnabled: false });
  const sideMat = texFor(cladBase, 1 / BOARD_TILE, 1 / BOARD_TILE);
  for (const s of [1, -1]) {
    const w = new THREE.Mesh(sideGeo, sideMat);
    w.rotation.y = -Math.PI / 2; // shape x → world +z; extrusion → world −x
    w.position.set(s * halfX + t / 2, floorY, 0);
    exterior.add(w);
  }
  for (const x of [-halfX, halfX]) {
    exterior.add(box(0.14, wallH, 0.14, M.trim, x, floorY + wallH / 2, -halfZ));
    exterior.add(box(0.14, wallH + rise, 0.14, M.trim, x, floorY + (wallH + rise) / 2, halfZ));
  }

  /* ── openings ── */
  const addWin = (w, h, x, y, z, rotY) => {
    const win = louvreWindow(w, h, M);
    win.position.set(x, y, z);
    win.rotation.y = rotY;
    exterior.add(win);
  };
  const wy = floorY + 1.45;
  const out = t / 2 + 0.02;
  // rear (bedroom 2 + bathroom) — as in the rear elevation render
  addWin(1.2, 1.15, -2.0, wy, -halfZ - out, Math.PI);
  addWin(1.2, 1.15, 2.2, wy, -halfZ - out, Math.PI);
  const door = (z, rotY) => {
    const d = new THREE.Group();
    d.add(box(0.92, 2.05, 0.06, M.door, 0, 1.025, 0));
    const oval = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24), M.glass);
    oval.scale.y = 1.7;
    oval.position.set(0, 1.45, 0.035);
    d.add(oval);
    d.add(box(1.06, 0.07, 0.08, M.trim, 0, 2.08, 0));
    d.position.set(0.4, floorY, z);
    d.rotation.y = rotY;
    exterior.add(d);
  };
  door(-halfZ - 0.07, Math.PI);
  door(halfZ + 0.07, 0);
  for (const x of [-2.75, -0.35, 1.15, 3.0]) exterior.add(box(0.1, 0.16, 0.1, M.lamp, x, floorY + 2.05, -halfZ - 0.1));
  const steps = (z0, dir, n, w) => {
    for (let i = 0; i < n; i++) {
      const h = floorY - ((i + 1) * floorY) / (n + 1);
      exterior.add(box(w, 0.06, 0.3, M.timberDark, 0.4, h, z0 + dir * (0.15 + i * 0.28)));
    }
    const run = n * 0.28 + 0.1;
    for (const sx of [-1, 1]) {
      const x = 0.4 + (sx * w) / 2;
      exterior.add(member(V(x, floorY + 0.9, z0), V(x, 0.95, z0 + dir * run), 0.04, M.black));
      exterior.add(box(0.05, 0.95, 0.05, M.black, x, 0.48, z0 + dir * run));
      exterior.add(box(0.05, floorY + 0.9, 0.05, M.black, x, (floorY + 0.9) / 2, z0));
    }
  };
  steps(-halfZ - 0.06, -1, 3, 1.0);
  // laundry nook at the rear right (under the roof overhang)
  exterior.add(box(2.3, 0.05, 0.85, M.timberDark, 2.05, floorY - 0.03, -halfZ - 0.43));
  // sides: kitchen window (right), two bedroom windows (left); front: bedroom 1 + living
  addWin(1.0, 1.0, halfX + out, wy + 0.05, -0.15, Math.PI / 2);
  addWin(1.2, 1.15, -halfX - out, wy, -1.5, -Math.PI / 2);
  addWin(1.2, 1.15, -halfX - out, wy, 1.5, -Math.PI / 2);
  addWin(1.2, 1.15, -1.8, wy, halfZ + out, 0);
  addWin(1.5, 1.15, 2.2, wy, halfZ + out, 0);

  /* ── verandah: deck, black posts + railings, steps ── */
  const vz0 = halfZ, vz1 = halfZ + verandah;
  exterior.add(box(halfX * 2, 0.1, verandah, M.timberDark, 0, floorY - 0.05, (vz0 + vz1) / 2));
  const railH = 0.9;
  const postH = frontTop - floorY - 0.7;
  for (const x of [-halfX, -0.1, 0.9, halfX]) exterior.add(box(0.1, postH, 0.1, M.black, x, floorY + postH / 2, vz1 - 0.05));
  const rail = (a, b) => {
    exterior.add(member(V(a.x, floorY + railH, a.z), V(b.x, floorY + railH, b.z), 0.06, M.black));
    exterior.add(member(V(a.x, floorY + 0.1, a.z), V(b.x, floorY + 0.1, b.z), 0.04, M.black));
    const n = Math.floor(Math.hypot(b.x - a.x, b.z - a.z) / 0.12);
    for (let i = 1; i < n; i++) {
      const k = i / n;
      exterior.add(box(0.025, railH - 0.1, 0.025, M.black, a.x + (b.x - a.x) * k, floorY + 0.1 + (railH - 0.1) / 2, a.z + (b.z - a.z) * k));
    }
  };
  rail({ x: -halfX, z: vz1 - 0.05 }, { x: -0.1, z: vz1 - 0.05 });
  rail({ x: 0.9, z: vz1 - 0.05 }, { x: halfX, z: vz1 - 0.05 });
  rail({ x: -halfX, z: vz0 }, { x: -halfX, z: vz1 - 0.05 });
  rail({ x: halfX, z: vz0 }, { x: halfX, z: vz1 - 0.05 });
  steps(vz1, 1, 3, 1.0);

  /* ── roofs: main skillion (high at the verandah side) + lower verandah skillion ── */
  const lift = 0.06;
  const oh = 0.45; // rear + side overhang
  const z0 = -halfZ - oh, z1 = halfZ + 0.6; // deep overhang at the high (verandah) edge
  const runLen = Math.hypot(z1 - z0, (z1 - z0) * slope);
  const roofW = halfX * 2 + oh * 2;
  const main = box(roofW, 0.05, runLen, texFor(roofBase, roofW / RIB, 1), 0, topAt((z0 + z1) / 2) + lift + 0.03, (z0 + z1) / 2);
  main.rotation.x = -Math.atan(slope);
  roof.add(main);
  roof.add(box(roofW, 0.2, 0.04, M.trim, 0, topAt(z1) + lift - 0.04, z1 + 0.02));
  roof.add(box(roofW, 0.14, 0.04, M.trim, 0, topAt(z0) + lift - 0.02, z0 - 0.02));
  for (const s of [1, -1]) {
    const b = member(V((s * roofW) / 2, topAt(z0) + lift, z0), V((s * roofW) / 2, topAt(z1) + lift, z1), 0.05, M.trim);
    b.scale.set(1, 3, 1);
    roof.add(b);
  }
  const gY = topAt(z0) + lift - 0.12;
  const gutter = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, roofW, 12), M.gutter);
  gutter.rotation.z = Math.PI / 2;
  gutter.position.set(0, gY, z0 - 0.08);
  roof.add(gutter);
  const vTop = frontTop - 0.35; // tucked under the main roof's high edge
  const vEnd = vz1 + 0.35;
  const vDrop = 0.45;
  const vLen = Math.hypot(vEnd - halfZ, vDrop);
  const vr = box(roofW, 0.04, vLen, texFor(roofBase, roofW / RIB, 1), 0, vTop - vDrop / 2, (halfZ + vEnd) / 2);
  vr.rotation.x = Math.atan2(vDrop, vEnd - halfZ);
  roof.add(vr);
  roof.add(box(roofW, 0.16, 0.04, M.trim, 0, vTop - vDrop - 0.05, vEnd + 0.02));
  for (const s of [1, -1]) roof.add(box(0.03, 0.22, verandah, M.louvre, s * halfX, vTop - vDrop / 2 - 0.22, (vz0 + vz1) / 2)); // slatted infill

  /* ── rainwater tank (right side, toward the rear) ── */
  const tank = new THREE.Group();
  const tankPos = V(-halfX - 1.35, 0, -1.4); // on the right when facing the rear wall (as in the rear renders)
  const tankR = 1.0, tankH = 1.9, slabH = 0.18;
  tank.add(box(2.4, slabH, 2.4, M.slab, 0, slabH / 2, 0));
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(tankR, tankR, tankH, 48), M.tank);
  cyl.position.y = slabH + tankH / 2;
  tank.add(cyl);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.15, tankR, 0.25, 48), M.gutter);
  lid.position.y = slabH + tankH + 0.125;
  tank.add(lid);
  const lbl = canvasTex(256, 96, (g) => {
    g.font = '800 34px sans-serif';
    g.fillStyle = '#23262a';
    g.textAlign = 'center';
    g.fillText('2500 LITRES', 128, 42);
    g.font = '700 22px sans-serif';
    g.fillText('WATER TANKS', 128, 76);
  });
  lbl.wrapS = lbl.wrapT = THREE.ClampToEdgeWrapping;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.38), new THREE.MeshBasicMaterial({ map: lbl, transparent: true }));
  label.position.set(-tankR - 0.01, slabH + tankH * 0.62, 0);
  label.rotation.y = -Math.PI / 2;
  tank.add(label);
  tank.position.copy(tankPos);
  group.add(tank);
  const dpx = -(halfX + oh - 0.1);
  const tankTop = slabH + tankH + 0.2;
  const pts = [V(dpx, gY, z0 - 0.08), V(dpx, tankTop + 0.3, z0 - 0.08), V(tankPos.x, tankTop + 0.3, tankPos.z - 0.3), V(tankPos.x, tankTop, tankPos.z - 0.3)];
  const path = new THREE.CurvePath();
  for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(path, 40, 0.045, 8, false), M.gutter));
  const dp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, gY), M.gutter);
  dp2.position.set(-dpx, gY / 2, z0 - 0.08);
  group.add(dp2);

  /* ── interior: partitions, wet-area tiles, furniture ── */
  const ih = wallH - 0.05;
  const iw = (len, x, z, alongX) => interior.add(box(alongX ? len : 0.08, ih, alongX ? 0.08 : len, M.interiorWall, x, floorY + ih / 2, z));
  iw(6, -0.1, 0, false);
  iw(6, 0.9, 0, false);
  iw(3.4, -1.8, 0, true);
  iw(2.6, 2.2, -1.07, true);
  const [bx0, bz0, bx1, bz1] = ROOMS.bathroom;
  interior.add(box(bx1 - bx0 - 0.1, 0.02, bz1 - bz0 - 0.1, M.tile, (bx0 + bx1) / 2, floorY + 0.04, (bz0 + bz1) / 2));
  const linen = mat('#eeeae2', { roughness: 0.9 });
  const olive = mat('#6f7a4a', { roughness: 0.9 });
  for (const z of [-1.5, 1.5]) {
    interior.add(box(1.6, 0.42, 2.0, linen, -2.4, floorY + 0.23, z));
    interior.add(box(0.6, 0.44, 2.02, olive, -2.2, floorY + 0.24, z));
  }
  interior.add(box(2.4, 0.9, 0.6, linen, 2.2, floorY + 0.45, -0.75));
  interior.add(box(1.6, 0.45, 0.8, olive, 1.9, floorY + 0.25, 2.5));
  interior.add(box(0.8, 0.75, 1.0, M.timberDark, 3.0, floorY + 0.38, 1.4));

  /* ── light-gauge steel frame (studs, plates, skillion Warren trusses) ── */
  const st = 0.06;
  const sm = M.steel;
  const y0 = floorY + 0.03;
  for (let x = -halfX; x <= halfX + 0.01; x += 0.6) {
    frame.add(member(V(x, y0, -halfZ), V(x, rearTop, -halfZ), st, sm));
    frame.add(member(V(x, y0, halfZ), V(x, frontTop, halfZ), st, sm));
  }
  for (let z = -halfZ + 0.6; z < halfZ - 0.01; z += 0.6) for (const x of [-halfX, halfX]) frame.add(member(V(x, y0, z), V(x, topAt(z), z), st, sm));
  for (const z of [-halfZ, halfZ]) {
    frame.add(member(V(-halfX, y0, z), V(halfX, y0, z), st, sm));
    frame.add(member(V(-halfX, topAt(z), z), V(halfX, topAt(z), z), st, sm));
    frame.add(member(V(-halfX, floorY + 1.1, z), V(halfX, floorY + 1.1, z), st, sm));
  }
  for (const x of [-halfX, halfX]) {
    frame.add(member(V(x, y0, -halfZ), V(x, y0, halfZ), st, sm));
    frame.add(member(V(x, topAt(-halfZ), -halfZ), V(x, topAt(halfZ), halfZ), st, sm));
    frame.add(member(V(x, floorY + 1.1, -halfZ), V(x, floorY + 1.1, halfZ), st, sm));
  }
  for (let x = -halfX; x <= halfX + 0.01; x += 1.0) {
    frame.add(member(V(x, rearTop, -halfZ), V(x, rearTop, halfZ), st, sm)); // bottom chord
    frame.add(member(V(x, topAt(-halfZ) - 0.02, -halfZ), V(x, topAt(halfZ) - 0.02, halfZ), st, sm)); // top chord
    for (let z = -halfZ; z < halfZ - 0.01; z += 1) {
      const peak = V(x, topAt(z + 0.5) - 0.05, z + 0.5);
      frame.add(member(V(x, rearTop + 0.03, z), peak, st * 0.8, sm));
      frame.add(member(peak, V(x, rearTop + 0.03, z + 1), st * 0.8, sm));
    }
  }
  for (const z of [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]) frame.add(member(V(-halfX, topAt(z) + 0.02, z), V(halfX, topAt(z) + 0.02, z), st * 0.7, sm));

  group.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  label.castShadow = false;

  return { group, roof, tank, interior, exterior, frame, materials: M };
}

/** Warm tropical-afternoon lighting rig. */
export function addLights(scene, { shadowSize = 2048 } = {}) {
  scene.add(new THREE.HemisphereLight('#d6e8ff', '#3a2a1c', 1.0));
  const sun = new THREE.DirectionalLight('#fff0d8', 2.6);
  sun.position.set(-9, 15, 11);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  const c = sun.shadow.camera;
  c.left = c.bottom = -11;
  c.right = c.top = 11;
  c.near = 1;
  c.far = 50;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#9cc4ff', 1.0);
  rim.position.set(10, 6, -12);
  scene.add(rim);
  const fill = new THREE.DirectionalLight('#ffd2a8', 0.5);
  fill.position.set(12, 3, 8);
  scene.add(fill);
  return { sun, rim, fill };
}

/** Dark floor with a coloured glow pool. Returns { ground, glow, setGlow(color) }. */
export function addGround(scene, glowColor = '#7a1f2b') {
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshStandardMaterial({ color: '#0b0c0f', roughness: 0.55, metalness: 0.3 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const gc = document.createElement('canvas');
  gc.width = gc.height = 256;
  const g = gc.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const glowMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), color: glowColor, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.01;
  scene.add(glow);
  return { ground, glow, setGlow: (c) => glowMat.color.set(c) };
}
