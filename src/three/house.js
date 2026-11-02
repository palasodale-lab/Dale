/**
 * Procedural low-poly model of the MOTO HOUSE (2 bedroom, steel-framed, raised on steel piles).
 * Used by the 3D ad film (src/ad) and by the placeholder-render generator (tools/).
 *
 * Units: metres. x = length (8 m), z = depth (6 m, +z = front/deck side), y = up.
 * Dimensions are an artistic approximation of the concept renders — NOT construction data.
 */
import * as THREE from 'three';

export const DIM = {
  halfX: 4,
  halfZ: 3,
  floorY: 1.2, // top of floor (raised on piles)
  wallH: 2.7,
  ridgeRise: 1.6,
  overhang: 0.5,
};

/** Room rectangles in plan (x0, z0, x1, z1). Areas shown on the site are TODO placeholders. */
export const ROOMS = {
  bedroom1: [-4, -3, -1, 0],
  bedroom2: [-4, 0, -1, 3],
  hallway: [-1, -3, 0, 3],
  bathroom: [0, -3, 2, -1.2],
  kitchen: [0, -1.2, 4, 0.6],
  living: [0, 0.6, 4, 3],
  laundry: [2, -3, 4, -1.2],
  deck: [-1, 3, 4, 4.5],
};

export const COLORS = {
  roof: '#7a1f2b',
  timber: '#c8924f',
  timberDark: '#6b4a32',
  pile: '#8d969c', // galvanised steel
  steel: '#9aa4aa',
  trim: '#e9e4da',
  glass: '#18232b',
  louvre: '#a9bcc8',
  tank: '#b8c3c9',
  gutter: '#d4d7d9',
};

/* ---------- canvas textures ---------- */
function canvasTex(w, h, draw, repeatX = 1, repeatY = 1) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function weatherboardTex() {
  return canvasTex(256, 256, (g, w, h) => {
    const boards = 8;
    for (let i = 0; i < boards; i++) {
      const y = (i * h) / boards;
      const shade = 0.88 + ((i * 37) % 11) / 60;
      const base = new THREE.Color(COLORS.timber).multiplyScalar(shade);
      const grad = g.createLinearGradient(0, y, 0, y + h / boards);
      grad.addColorStop(0, '#' + base.clone().multiplyScalar(1.08).getHexString());
      grad.addColorStop(0.85, '#' + base.getHexString());
      grad.addColorStop(1, '#' + base.clone().multiplyScalar(0.55).getHexString());
      g.fillStyle = grad;
      g.fillRect(0, y, w, h / boards);
      // grain
      g.globalAlpha = 0.07;
      for (let k = 0; k < 14; k++) {
        g.fillStyle = k % 2 ? '#000' : '#fff';
        g.fillRect(0, y + Math.random() * (h / boards), w, 1);
      }
      g.globalAlpha = 1;
    }
  }, 2, 2);
}

function corrugatedTex(hex, vertical = true) {
  return canvasTex(256, 64, (g, w, h) => {
    const base = new THREE.Color(hex);
    const ribs = 16;
    for (let i = 0; i < ribs; i++) {
      const x0 = (i * w) / ribs;
      const grad = g.createLinearGradient(x0, 0, x0 + w / ribs, 0);
      grad.addColorStop(0, '#' + base.clone().multiplyScalar(0.62).getHexString());
      grad.addColorStop(0.45, '#' + base.clone().multiplyScalar(1.25).getHexString());
      grad.addColorStop(1, '#' + base.clone().multiplyScalar(0.62).getHexString());
      g.fillStyle = grad;
      g.fillRect(x0, 0, w / ribs, h);
    }
  }, vertical ? 3 : 1, 1);
}

/* ---------- helpers ---------- */
const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...opts });

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Louvre window centred at (x,y) on a wall; normal along +z or +x etc. */
function louvreWindow(w, h, materials) {
  const g = new THREE.Group();
  const f = 0.07;
  g.add(box(w, h, 0.03, materials.glass, 0, 0, 0));
  g.add(box(w + f * 2, f, 0.1, materials.trim, 0, h / 2 + f / 2, 0.02));
  g.add(box(w + f * 2, f, 0.14, materials.trim, 0, -h / 2 - f / 2, 0.04));
  g.add(box(f, h, 0.1, materials.trim, -w / 2 - f / 2, 0, 0.02));
  g.add(box(f, h, 0.1, materials.trim, w / 2 + f / 2, 0, 0.02));
  const slats = Math.max(5, Math.round(h / 0.13));
  for (let i = 0; i < slats; i++) {
    const s = box(w - 0.02, 0.012, 0.12, materials.louvre, 0, -h / 2 + (i + 0.5) * (h / slats), 0.05);
    s.rotation.x = -0.45;
    g.add(s);
  }
  return g;
}

/**
 * Build the house. Returns { group, roof, tank, interior, exterior, anchors }.
 * `roof` is a group you can lift / fade (exploded view). `anchors` are world points for labels.
 */
export function buildHouse() {
  const { halfX, halfZ, floorY, wallH, ridgeRise, overhang } = DIM;
  const top = floorY + wallH;
  const group = new THREE.Group();

  const M = {
    clad: new THREE.MeshStandardMaterial({ map: weatherboardTex(), roughness: 0.8 }),
    roof: new THREE.MeshStandardMaterial({ map: corrugatedTex('#a3293a'), roughness: 0.5, metalness: 0.12, side: THREE.DoubleSide }),
    pile: mat(COLORS.pile, { roughness: 0.35, metalness: 0.75 }),
    steel: mat(COLORS.steel, { roughness: 0.3, metalness: 0.8 }),
    timberDark: mat(COLORS.timberDark),
    trim: mat(COLORS.trim, { roughness: 0.5 }),
    glass: mat(COLORS.glass, { roughness: 0.15, metalness: 0.6 }),
    louvre: mat(COLORS.louvre, { roughness: 0.2, metalness: 0.4 }),
    tank: new THREE.MeshStandardMaterial({ map: corrugatedTex(COLORS.tank), roughness: 0.4, metalness: 0.5 }),
    gutter: mat(COLORS.gutter, { roughness: 0.35, metalness: 0.6 }),
    floor: mat('#8a6440', { roughness: 0.6 }),
    tile: mat('#9aa3a8', { roughness: 0.4 }),
    interiorWall: mat('#efe9df', { roughness: 0.9 }),
  };
  // the cladding texture repeats differently per wall size
  const cladFor = (len) => {
    const m = M.clad.clone();
    m.map = M.clad.map.clone();
    m.map.needsUpdate = true;
    m.map.repeat.set(len / 2, wallH / 1.1);
    return m;
  };

  const exterior = new THREE.Group();
  const interior = new THREE.Group();
  group.add(exterior, interior);

  /* piles + bearers */
  for (const x of [-3.85, -1.3, 1.3, 3.85])
    for (const z of [-2.85, 0, 2.85]) exterior.add(box(0.16, floorY - 0.15, 0.16, M.pile, x, (floorY - 0.15) / 2, z));
  for (const x of [-0.85, 1.5, 3.85]) exterior.add(box(0.14, floorY - 0.2, 0.14, M.pile, x, (floorY - 0.2) / 2, 4.35));
  // pile base plates
  for (const x of [-3.85, -1.3, 1.3, 3.85]) for (const z of [-2.85, 0, 2.85]) exterior.add(box(0.36, 0.04, 0.36, M.steel, x, 0.02, z));
  // steel bearers / floor frame
  exterior.add(box(halfX * 2 + 0.2, 0.22, halfZ * 2 + 0.2, M.steel, 0, floorY - 0.11, 0));
  // floor boards inside
  const floorSlab = box(halfX * 2, 0.04, halfZ * 2, M.floor, 0, floorY + 0.02, 0);
  interior.add(floorSlab);

  /* exterior walls */
  const t = 0.12;
  const wallY = floorY + wallH / 2;
  exterior.add(box(halfX * 2, wallH, t, cladFor(8), 0, wallY, halfZ)); // front
  exterior.add(box(halfX * 2, wallH, t, cladFor(8), 0, wallY, -halfZ)); // rear
  exterior.add(box(t, wallH, halfZ * 2, cladFor(6), halfX, wallY, 0)); // right
  exterior.add(box(t, wallH, halfZ * 2, cladFor(6), -halfX, wallY, 0)); // left
  // corner trims
  for (const x of [-halfX, halfX]) for (const z of [-halfZ, halfZ]) exterior.add(box(0.16, wallH, 0.16, M.trim, x, wallY, z));

  /* windows */
  const addWin = (w, h, x, y, z, rotY) => {
    const win = louvreWindow(w, h, M);
    win.position.set(x, y, z);
    win.rotation.y = rotY;
    exterior.add(win);
    return win;
  };
  const wy = floorY + 1.55;
  const eps = t / 2 + 0.02;
  addWin(1.3, 1.1, -2.5, wy, halfZ + eps, 0); // bed 2 front
  addWin(1.6, 1.1, 2.9, wy, halfZ + eps, 0); // living front
  addWin(1.3, 1.1, -2.5, wy, -halfZ - eps, Math.PI); // bed 1 rear
  addWin(0.7, 0.6, 1.0, floorY + 1.8, -halfZ - eps, Math.PI); // bath
  addWin(0.9, 0.8, 3.0, floorY + 1.7, -halfZ - eps, Math.PI); // laundry
  addWin(1.2, 1.1, -halfX - eps, wy, -1.5, -Math.PI / 2); // left
  addWin(1.2, 1.1, -halfX - eps, wy, 1.5, -Math.PI / 2);
  addWin(1.2, 0.9, halfX + eps, floorY + 1.65, -0.3, Math.PI / 2); // kitchen
  addWin(1.2, 1.1, halfX + eps, wy, 1.8, Math.PI / 2); // living side

  /* front door */
  exterior.add(box(0.95, 2.1, 0.06, M.timberDark, 0.7, floorY + 1.05, halfZ + 0.07));
  exterior.add(box(1.1, 0.08, 0.1, M.trim, 0.7, floorY + 2.14, halfZ + 0.08));
  // rear door (laundry)
  exterior.add(box(0.85, 2.05, 0.06, M.timberDark, 2.1, floorY + 1.03, -halfZ - 0.07));

  /* front deck, rails, steps */
  const [dx0, dz0, dx1, dz1] = ROOMS.deck;
  exterior.add(box(dx1 - dx0, 0.12, dz1 - dz0, M.timberDark, (dx0 + dx1) / 2, floorY - 0.06, (dz0 + dz1) / 2));
  const railH = 0.95;
  const stepX = 1.6;
  for (let x = dx0; x <= dx1 + 0.01; x += 0.625) {
    if (Math.abs(x - stepX) < 0.55) continue;
    exterior.add(box(0.07, railH, 0.07, M.trim, x, floorY + railH / 2, dz1 - 0.04));
  }
  exterior.add(box(stepX - 0.6 - dx0, 0.07, 0.09, M.trim, (dx0 + stepX - 0.6) / 2, floorY + railH, dz1 - 0.04));
  exterior.add(box(dx1 - (stepX + 0.6), 0.07, 0.09, M.trim, (dx1 + stepX + 0.6) / 2, floorY + railH, dz1 - 0.04));
  for (const x of [dx0, dx1]) {
    exterior.add(box(0.09, 0.07, dz1 - dz0, M.trim, x, floorY + railH, (dz0 + dz1) / 2));
    for (const z of [dz0 + 0.5, dz0 + 1.0]) exterior.add(box(0.07, railH, 0.07, M.trim, x, floorY + railH / 2, z));
  }
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    const h = floorY - ((i + 1) * floorY) / (steps + 1);
    exterior.add(box(1.1, 0.07, 0.32, M.timberDark, stepX, h, dz1 + 0.16 + i * 0.3));
  }
  exterior.add(box(0.06, floorY, 1.3, M.timberDark, stepX - 0.56, floorY / 2 - 0.1, dz1 + 0.6));
  exterior.add(box(0.06, floorY, 1.3, M.timberDark, stepX + 0.56, floorY / 2 - 0.1, dz1 + 0.6));

  /* roof (separate group so it can be exploded) */
  const roof = new THREE.Group();
  const runZ = halfZ + overhang;
  const drop = (ridgeRise * runZ) / halfZ;
  const slope = Math.hypot(runZ, drop);
  const ang = Math.atan2(drop, runZ);
  const lift = 0.08; // keeps wall tops from poking through the roof sheet
  const ridgeY = top + ridgeRise + lift;
  const roofLen = halfX * 2 + overhang * 2;
  for (const s of [1, -1]) {
    const p = box(roofLen, 0.05, slope, M.roof, 0, ridgeY - drop / 2, (s * runZ) / 2);
    p.rotation.x = s * ang;
    p.material = M.roof.clone();
    p.material.map = M.roof.map.clone();
    p.material.map.repeat.set(roofLen * 1.6, 1);
    p.material.map.needsUpdate = true;
    roof.add(p);
    // fascia
    roof.add(box(roofLen, 0.18, 0.04, M.trim, 0, ridgeY - drop - 0.06, s * (runZ + 0.02)));
  }
  roof.add(box(roofLen + 0.04, 0.1, 0.22, M.gutter, 0, ridgeY + 0.03, 0)); // ridge cap
  // gable triangles
  const tri = new THREE.Shape();
  tri.moveTo(-halfZ, 0);
  tri.lineTo(halfZ, 0);
  tri.lineTo(halfZ, lift);
  tri.lineTo(0, ridgeRise + lift);
  tri.lineTo(-halfZ, lift);
  tri.closePath();
  for (const s of [1, -1]) {
    const g = new THREE.Mesh(new THREE.ShapeGeometry(tri), cladFor(6));
    g.material.side = THREE.DoubleSide;
    g.rotation.y = Math.PI / 2;
    g.position.set(s * (halfX + 0.061), top, 0);
    g.castShadow = true;
    roof.add(g);
    // gable vent (louvre)
    const v = louvreWindow(0.6, 0.4, M);
    v.position.set(s * (halfX + 0.09), top + 0.65, 0);
    v.rotation.y = (s * Math.PI) / 2;
    roof.add(v);
    // barge boards
    for (const side of [1, -1]) {
      const b = box(0.04, 0.16, slope, M.trim, s * (halfX + overhang), ridgeY - drop / 2, (side * runZ) / 2);
      b.rotation.x = side * ang;
      roof.add(b);
    }
  }
  // gutters front & back
  const eaveY = ridgeY - drop - 0.1;
  const gutterZ = runZ + 0.08;
  for (const s of [1, -1]) {
    const gm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, roofLen, 12), M.gutter);
    gm.rotation.z = Math.PI / 2;
    gm.position.set(0, eaveY, s * gutterZ);
    gm.castShadow = true;
    roof.add(gm);
  }
  group.add(roof);

  /* water tank + stand + downpipe (rear right) */
  const tank = new THREE.Group();
  const tankPos = new THREE.Vector3(5.55, 0, -2.4);
  const standH = 0.55;
  const tankR = 0.95;
  const tankH = 1.75;
  tank.add(box(2.1, standH, 2.1, M.timberDark, 0, standH / 2, 0));
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(tankR, tankR, tankH, 40, 1), M.tank.clone());
  cyl.material.map = M.tank.map.clone();
  cyl.material.map.repeat.set(1, 1);
  cyl.material.map.rotation = Math.PI / 2;
  cyl.material.map.repeat.set(10, 1);
  cyl.material.map.needsUpdate = true;
  cyl.position.y = standH + tankH / 2;
  cyl.castShadow = cyl.receiveShadow = true;
  tank.add(cyl);
  const lid = new THREE.Mesh(new THREE.ConeGeometry(tankR * 1.02, 0.22, 40), M.gutter);
  lid.position.y = standH + tankH + 0.11;
  tank.add(lid);
  tank.add(box(0.08, 0.08, 0.5, M.gutter, 0, standH + 0.2, tankR + 0.2)); // tap
  tank.position.copy(tankPos);
  group.add(tank);

  const dpX = halfX + overhang - 0.15;
  const tankTopY = standH + tankH + 0.2;
  const pipePts = [
    new THREE.Vector3(dpX, eaveY, -gutterZ),
    new THREE.Vector3(dpX, tankTopY + 0.35, -gutterZ),
    new THREE.Vector3(tankPos.x - 0.2, tankTopY + 0.35, tankPos.z - 0.2),
    new THREE.Vector3(tankPos.x - 0.2, tankTopY - 0.05, tankPos.z - 0.2),
  ];
  const path = new THREE.CurvePath();
  for (let i = 0; i < pipePts.length - 1; i++) path.add(new THREE.LineCurve3(pipePts[i], pipePts[i + 1]));
  const pipe = new THREE.Mesh(new THREE.TubeGeometry(path, 40, 0.05, 8, false), M.gutter);
  pipe.castShadow = true;
  group.add(pipe);

  /* interior: room floors (tile in wet areas) + partition walls */
  const ih = wallH * 0.98;
  const iw = (len, x, z, alongX) =>
    interior.add(box(alongX ? len : 0.08, ih, alongX ? 0.08 : len, M.interiorWall, x, floorY + ih / 2, z));
  iw(6, -1, 0, false);
  iw(6, 0, 0, false);
  iw(3, -2.5, 0, true);
  iw(4, 2, -1.2, true);
  iw(1.8, 2, -2.1, false);
  for (const key of ['bathroom', 'laundry']) {
    const [x0, z0, x1, z1] = ROOMS[key];
    interior.add(box(x1 - x0 - 0.1, 0.02, z1 - z0 - 0.1, M.tile, (x0 + x1) / 2, floorY + 0.05, (z0 + z1) / 2));
  }
  // simple furniture blocks so the cutaway reads as a plan
  const furn = mat('#d8d2c6', { roughness: 0.9 });
  const soft = mat('#7a1f2b', { roughness: 0.9 });
  interior.add(box(1.6, 0.45, 2.0, furn, -2.5, floorY + 0.25, -1.6)); // bed 1
  interior.add(box(1.4, 0.45, 2.0, furn, -2.5, floorY + 0.25, 1.6)); // bed 2
  interior.add(box(0.6, 0.9, 1.6, furn, 3.65, floorY + 0.45, -0.3)); // kitchen bench
  interior.add(box(1.8, 0.45, 0.8, soft, 1.6, floorY + 0.25, 2.4)); // sofa
  interior.add(box(1.1, 0.75, 0.8, M.timberDark, 2.8, floorY + 0.38, 1.2)); // dining
  interior.add(box(0.8, 0.5, 0.45, furn, 1.0, floorY + 0.3, -2.7)); // vanity
  interior.add(box(0.6, 0.85, 0.6, furn, 3.5, floorY + 0.43, -2.6)); // washer

  /* steel frame skeleton (light-gauge studs, plates, trusses) — hidden inside the cladding,
     revealed in the ad by fading the cladding / roof. */
  const frame = new THREE.Group();
  const studT = 0.06;
  const ring = (y) => {
    frame.add(box(halfX * 2, studT, studT, M.steel, 0, y, halfZ));
    frame.add(box(halfX * 2, studT, studT, M.steel, 0, y, -halfZ));
    frame.add(box(studT, studT, halfZ * 2, M.steel, halfX, y, 0));
    frame.add(box(studT, studT, halfZ * 2, M.steel, -halfX, y, 0));
  };
  ring(floorY + studT / 2);
  ring(top - studT / 2);
  ring(floorY + wallH * 0.45);
  for (let x = -halfX; x <= halfX + 0.01; x += 0.6) for (const z of [halfZ, -halfZ]) frame.add(box(studT, wallH, studT, M.steel, x, wallY, z));
  for (let z = -halfZ + 0.6; z < halfZ - 0.01; z += 0.6) for (const x of [halfX, -halfX]) frame.add(box(studT, wallH, studT, M.steel, x, wallY, z));
  // roof trusses
  for (let x = -halfX; x <= halfX + 0.01; x += 1) {
    const truss = new THREE.Group();
    const rafterLen = Math.hypot(halfZ, ridgeRise);
    const a = Math.atan2(ridgeRise, halfZ);
    for (const sgn of [1, -1]) {
      const r = box(studT, studT, rafterLen, M.steel, 0, top + ridgeRise / 2 - 0.02, (sgn * halfZ) / 2);
      r.rotation.x = sgn * a;
      truss.add(r);
    }
    truss.add(box(studT, studT, halfZ * 2, M.steel, 0, top, 0)); // bottom chord
    truss.add(box(studT, ridgeRise, studT, M.steel, 0, top + ridgeRise / 2, 0)); // king post
    for (const sgn of [1, -1]) {
      // web: from the bottom-chord centre up to the rafter mid-point (stays under the roof sheet)
      const w = box(studT * 0.8, studT * 0.8, Math.hypot(halfZ / 2, ridgeRise / 2) - 0.1, M.steel, 0, top + ridgeRise / 4, (sgn * halfZ) / 4);
      w.rotation.x = -sgn * Math.atan2(ridgeRise / 2, halfZ / 2);
      truss.add(w);
    }
    truss.position.x = x;
    frame.add(truss);
  }
  for (const z of [-2, -1, 0.0001, 1, 2]) {
    const y = top + ridgeRise * (1 - Math.abs(z) / halfZ);
    frame.add(box(halfX * 2, studT * 0.7, studT * 0.7, M.steel, 0, y + 0.04, z)); // purlins
  }
  group.add(frame);

  group.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  const anchors = {
    raisedFloor: new THREE.Vector3(-3.85, 0.6, 2.85),
    louvre: new THREE.Vector3(-2.5, wy, halfZ + 0.1),
    steps: new THREE.Vector3(stepX, 0.5, dz1 + 0.7),
    gutter: new THREE.Vector3(2.6, eaveY, gutterZ),
    downpipe: pipePts,
    gutterRear: [new THREE.Vector3(-halfX - overhang, eaveY, -gutterZ), new THREE.Vector3(halfX + overhang, eaveY, -gutterZ)],
    tankBox: { center: tankPos.clone(), r: tankR, y0: standH, y1: standH + tankH },
  };

  return { group, roof, tank, interior, exterior, frame, anchors, materials: M };
}

/** Studio lighting rig shared by the ad and the placeholder renders. */
export function addLights(scene, { shadowSize = 2048 } = {}) {
  const hemi = new THREE.HemisphereLight('#cfe3ff', '#2a1d14', 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff1dc', 2.6);
  sun.position.set(-9, 16, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  const c = sun.shadow.camera;
  c.left = c.bottom = -12;
  c.right = c.top = 12;
  c.near = 1;
  c.far = 50;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#9cc4ff', 1.1);
  rim.position.set(10, 6, -12);
  scene.add(rim);
  const fill = new THREE.DirectionalLight('#ffd2a8', 0.5);
  fill.position.set(12, 3, 8);
  scene.add(fill);
  return { hemi, sun, rim, fill };
}

/** Dark reflective-ish floor with a coloured glow pool. Returns { ground, glow, setGlow(color) }. */
export function addGround(scene, glowColor = '#7a1f2b') {
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(60, 64),
    new THREE.MeshStandardMaterial({ color: '#0b0c0f', roughness: 0.55, metalness: 0.3 })
  );
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
  const glowMat = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(gc),
    color: glowColor,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.9,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.01;
  scene.add(glow);
  return { ground, glow, setGlow: (c) => glowMat.color.set(c) };
}
