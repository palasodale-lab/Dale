/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MOTO HOUSE – ALL EDITABLE COPY & DATA LIVES HERE
 * ─────────────────────────────────────────────────────────────────────────────
 *  • Headlines are arrays of lines (each line gets its own mask reveal).
 *  • Image paths are relative to /public  (e.g. "assets/render-left.jpg").
 *  • Hotspot / room / tank coordinates are PERCENTAGES of the image box
 *    [x, y] or [x, y, width, height]. They are calibrated to the generated
 *    placeholder images — when you drop in the real DPC renders, re-tune them
 *    (search for "TODO(calibrate)").
 *  • Anything marked TODO / TBC is a placeholder value, not DPC data.
 */

const A = (f) => `${import.meta.env.BASE_URL}assets/${f}`;

export const ACCENTS = {
  burgundy: '#7a1f2b',
  orange: '#d0602c',
  timber: '#c8924f',
  green: '#6f9a52',
  blue: '#4f8fd6',
  white: '#f2f2f0',
};

export const site = {
  brand: 'DPC – Moto House',
  title: 'MOTO HOUSE – 2 Bedroom House',
  company: 'Dokona Papua Construction Limited',
  companyShort: 'DPC',
  tagline: 'Proposed Rural Housing · Architectural Concept Proposal',
  ghostWord: 'MOTO',
  scrollCue: 'Scroll',
  enquire: { label: 'Enquire', href: '#contact' },
  nav: [
    { label: 'Overview', href: '#overview' },
    { label: 'Floor Plan', href: '#floorplan' },
    { label: 'Water', href: '#water' },
    { label: 'Views', href: '#views' },
    { label: 'Specs', href: '#specs' },
  ],
  // Ad-campaign badges (also used in the 3D ad film)
  badges: ['Less than 100K', 'Supply only', 'Coming soon'],
  film: {
    label: 'Watch the film',
    src: `${import.meta.env.BASE_URL}media/moto-house-ad.mp4`,
    poster: `${import.meta.env.BASE_URL}media/moto-house-ad-poster.jpg`,
  },
};

export const images = {
  rearIso: A('render-rear-iso.jpg'),
  // Section 3 crossfades to the right elevation (shows steps, louvres, raised floor, gutter + downpipe).
  front: A('render-right.jpg'),
  planDrawing: A('plan-drawing.png'),
  // Real photo supplied by DPC — the light-gauge steel frame (truss chord + V webs, screw-fixed)
  steelFrame: A('steel-frame.jpg'),
  floorplan: A('floorplan-3d.jpg'),
  elev1: A('elev-drawing-1.png'),
  elev2: A('elev-drawing-2.png'),
  rear: A('render-rear.jpg'),
  right: A('render-right.jpg'),
  left: A('render-left.jpg'),
};

export const sections = {
  hero: {
    id: 'overview',
    accent: ACCENTS.burgundy,
    eyebrow: 'DPC – Moto House',
    headline: ['MOTO HOUSE'],
    sub: '2 Bedroom House',
    tagline: 'Proposed Rural Housing · Architectural Concept Proposal',
  },

  built: {
    id: 'built',
    accent: ACCENTS.orange,
    headline: ['Built for the places', 'that break things.'],
    body: [
      'Rural-ready from the ground up — a steel frame raised on piles above flood, damp and termites, under a corrugated skillion roof that sheds tropical rain.',
      'Louvre windows on every side pull the breeze straight through, so the house stays cool without power.',
    ],
  },

  frame: {
    id: 'frame',
    accent: '#9aa4aa',
    eyebrow: 'Structure',
    headline: ['Steel bones.', 'Built to last.'],
    body: 'A light-gauge galvanised steel frame, screw-fixed truss by truss. It will not rot, warp or feed termites — and every member is stamped DPC.',
    caption: 'Actual DPC steel frame',
    // [x%, y%] on steel-frame.jpg
    callouts: [
      { label: 'Galvanised steel members', at: [72, 47] },
      { label: 'DPC-stamped', at: [50.5, 58] },
      { label: 'Screw-fixed truss joints', at: [62, 73] },
    ],
  },

  stats: {
    id: 'stats',
    accent: ACCENTS.timber,
    count: 2,
    countLabel: 'Bedrooms.',
    headline: ['Two beds. One hall.', 'Zero wasted space.'],
    // hotspot positions on render-right.jpg ([x%, y%] of the image)
    hotspots: [
      { label: 'Raised floor on piles', at: [42, 90], side: 'left' },
      { label: 'Louvre windows', at: [49, 53], side: 'left' },
      { label: 'Verandah steps', at: [8, 86], side: 'right' },
      { label: 'Gutter + downpipe', at: [93.5, 55], side: 'left' },
    ],
  },

  floorplan: {
    id: 'floorplan',
    accent: ACCENTS.green,
    headline: ['Every room,', 'at a glance.'],
    cardTitle: 'Moto House · 2BR',
    areaUnit: 'm²',
    // rect = [x%, y%, w%, h%] on floorplan-3d.jpg.
    // area = approx. m², measured off the DPC floor plan (7000 × 6000 + 1728 verandah) — TBC by DPC.
    rooms: [
      { name: 'Bedroom 1', area: 9.8, rect: [12.5, 39.6, 34.3, 29.8], caption: 'Front bedroom, 3.32 × 2.96 m, louvres on two walls for cross-breeze.' },
      { name: 'Bedroom 2', area: 9.8, rect: [12.5, 9.7, 34.3, 29.3], caption: 'Rear bedroom of the same size — quiet, away from the verandah.' },
      { name: 'Hallway', area: 6.0, rect: [47.4, 6.9, 10.8, 63.6], caption: 'One straight 1 m hall from the back door to the verandah — nothing wasted.' },
      { name: 'Bathroom', area: 4.5, rect: [58.6, 9.7, 27.9, 19.5], caption: 'Shower, WC and vanity, grouped with the laundry for short plumbing runs.' },
      { name: 'Kitchen', area: 4.3, rect: [58.6, 29.8, 27.9, 19.5], caption: 'Fridge, stove and sink along the wall, louvre window over the sink.' },
      { name: 'Living / Diner', area: 4.8, rect: [58.6, 49.3, 27.9, 20.6], caption: 'Living and dining that opens straight onto the verandah.' },
      { name: 'Laundry', area: 2.0, rect: [62.1, 3.5, 22.1, 6.2], caption: 'Covered rear laundry with tub and washer, beside the back steps.' },
      { name: 'Verandah', area: 12.1, rect: [10.6, 70.5, 77.5, 17.8], caption: 'Full-width 1.73 m verandah under its own roof, with black railings and steps.' },
    ],
    areaNote: 'Approx. areas from the DPC concept drawings — subject to final design.',
  },

  water: {
    id: 'water',
    accent: ACCENTS.blue,
    // TODO: confirm tank size. Render labels say 2,500 L; the elevation drawings say 9,000 L.
    count: 2500,
    countLabel: 'Litres.',
    headline: ['Rain in. Water stored.', 'Always on.'],
    body: 'Gutters along both eaves feed a downpipe straight into the rainwater tank on the stand — fresh water on site, no mains needed.',
    // tank box [x,y,w,h] % and gutter/downpipe polyline on render-right.jpg
    tank: [64, 40.5, 21, 50.5],
    pipePath: [[32, 16.5], [90, 37.5], [93.6, 42.5], [93.6, 76]],
  },

  views: {
    id: 'views',
    accent: ACCENTS.white,
    headline: ['One house.', 'Every angle.'],
    toggle: { render: 'Render', blueprint: 'Blueprint' },
    // Blueprints are crops of the DPC drawing set (elevations at 1:75 @ A3, floor plan).
    items: [
      { key: 'rear', label: 'Rear', image: images.rear, blueprint: images.elev1, blueprintLabel: 'Elevations · incl. Elevation C · 1:75 @ A3', accent: ACCENTS.burgundy },
      { key: 'right', label: 'Right', image: images.right, blueprint: images.elev2, blueprintLabel: 'Side elevations · incl. Elevation D · 1:75 @ A3', accent: ACCENTS.blue },
      { key: 'left', label: 'Left', image: images.left, blueprint: images.elev2, blueprintLabel: 'Side elevations · incl. Elevation D · 1:75 @ A3', accent: ACCENTS.green },
      { key: 'plan', label: 'Plan', image: images.floorplan, blueprint: images.planDrawing, blueprintLabel: 'Floor plan · 7000 × 7800', accent: ACCENTS.timber },
    ],
  },

  closing: {
    id: 'closing',
    accent: ACCENTS.burgundy,
    headline: ['Move in.'],
    counts: [
      { value: 2, label: 'bedrooms' },
      { value: 1, label: 'bathroom' },
      { value: 1, label: 'home' },
    ],
    ctaPrimary: { label: 'Request this design', href: 'mailto:info@example.com?subject=Moto%20House%20%E2%80%93%20design%20request' }, // TODO: real address
    ctaSecondary: { label: 'Compare models', href: '#specs' },
    disclaimer: '3D render photo may vary from actual/final design',
  },

  compare: {
    id: 'specs',
    accent: ACCENTS.white,
    headline: ['Pick your size.'],
    note: 'Values marked TBC are placeholders — the 1BR and 3BR models are proposed variants, not confirmed designs.',
    models: [
      { name: 'Moto 1BR', tag: 'Proposed', highlight: false },
      { name: 'Moto House 2BR', tag: 'This design', highlight: true },
      { name: 'Moto 3BR', tag: 'Proposed', highlight: false },
    ],
    // Each cell: number (counts up), string, or { value, suffix, tbc }
    rows: [
      { label: 'Bedrooms', cells: [1, 2, 3] },
      { label: 'Bathrooms', cells: [1, 1, 'TBC'] },
      { label: 'Floor area', cells: ['TBC', { value: 42, suffix: ' m² + 12 m² verandah', tbc: true }, 'TBC'] },
      { label: 'Water storage', cells: ['TBC', { value: 2500, suffix: ' L', tbc: true }, 'TBC'] },
      { label: 'Frame', cells: ['Steel', 'Steel frame', 'Steel'] },
      { label: 'Roof', cells: ['TBC', 'Corrugated iron, skillion', 'TBC'] },
      { label: 'Cladding', cells: ['TBC', 'White weatherboard', 'TBC'] },
      { label: 'Foundation', cells: ['TBC', 'Raised on piles (TBC)', 'TBC'] },
    ],
  },

  footer: {
    contact: [
      { label: 'Phone', value: '+675 000 0000' }, // TODO
      { label: 'Email', value: 'info@example.com' }, // TODO
      { label: 'Office', value: 'Papua New Guinea' }, // TODO
    ],
    note: 'Proposed concept – subject to final design',
    legal: `© ${new Date().getFullYear()} Dokona Papua Construction Limited`,
  },
};

/** Copy for the 3D ad film (ad.html → rendered to public/media/moto-house-ad.mp4) */
export const ad = {
  presents: 'Dokona Papua Construction presents',
  title: 'MOTO HOUSE',
  subtitle: '2 Bedroom House',
  frame: 'Steel frame',
  frameSub: 'Strong. Termite-proof. Built for rural PNG.',
  features: ['Steel frame', 'Raised on piles', 'Louvre airflow', 'Rainwater ready'],
  priceLead: 'Less than',
  price: '100K',
  supply: 'Supply only',
  supplySub: '2 bedrooms · 1 bathroom · 1 home',
  comingSoon: 'Coming soon',
  disclaimer: '3D render may vary from actual/final design',
};
