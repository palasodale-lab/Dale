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
  // ASSUMPTION: no front render was listed in the brief. A placeholder render-front.jpg is supplied —
  // if DPC has no front render, point this at A('render-left.jpg').
  front: A('render-front.jpg'),
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
      'Rural-ready from the ground up — a steel frame raised on piles above flood, damp and termites, under a corrugated roof that sheds tropical rain.',
      'Louvre windows on every side pull the breeze straight through, so the house stays cool without power.',
    ],
  },

  stats: {
    id: 'stats',
    accent: ACCENTS.timber,
    count: 2,
    countLabel: 'Bedrooms.',
    headline: ['Two beds. One hall.', 'Zero wasted space.'],
    // TODO(calibrate): hotspot positions on the FRONT render ([x%, y%] of the image)
    hotspots: [
      { label: 'Steel frame on raised piles', at: [19.5, 66], side: 'left' },
      { label: 'Louvre windows', at: [25, 44.8], side: 'left' },
      { label: 'Front steps', at: [41.8, 77.5], side: 'right' },
      { label: 'Gutter + downpipe', at: [79, 40], side: 'right' },
    ],
  },

  floorplan: {
    id: 'floorplan',
    accent: ACCENTS.green,
    headline: ['Every room,', 'at a glance.'],
    cardTitle: 'Moto House · 2BR',
    areaUnit: 'm²',
    // rect = [x%, y%, w%, h%] on floorplan-3d image — TODO(calibrate) for the real plan.
    // area = TODO placeholder values (m²) — replace with DPC schedule.
    rooms: [
      { name: 'Bedroom 1', area: 9.0, rect: [23.13, 16.62, 18.75, 27.82], caption: 'Corner bedroom with cross-flow louvres on two walls.' },
      { name: 'Bedroom 2', area: 9.0, rect: [23.13, 44.44, 18.75, 27.81], caption: 'Second bedroom opening to the front for morning light.' },
      { name: 'Hallway', area: 6.0, rect: [41.88, 16.62, 6.25, 55.63], caption: 'One straight hall links sleeping and living — nothing wasted.' },
      { name: 'Bathroom', area: 3.6, rect: [48.13, 16.62, 12.49, 16.69], caption: 'Compact wet area grouped with the laundry for short plumbing runs.' },
      { name: 'Kitchen', area: 7.2, rect: [48.13, 33.31, 25, 16.69], caption: 'Bench along the side wall with a louvre window above.' },
      { name: 'Living / Diner', area: 9.6, rect: [48.13, 50, 25, 22.25], caption: 'Open living and dining that spills onto the front deck.' },
      { name: 'Laundry', area: 3.6, rect: [60.62, 16.62, 12.51, 16.69], caption: 'Rear laundry with its own back door to the tank and yard.' },
      { name: 'Front deck', area: 7.5, rect: [41.88, 72.25, 31.25, 13.91], caption: 'Covered-entry deck with rails and front steps down to the yard.' },
    ],
    areaNote: 'Areas are placeholders (TODO) — subject to final design.',
  },

  water: {
    id: 'water',
    accent: ACCENTS.blue,
    // TODO: confirm tank size. Render labels say 2,500 L; the elevation drawings say 9,000 L.
    count: 2500,
    countLabel: 'Litres.',
    headline: ['Rain in. Water stored.', 'Always on.'],
    body: 'Gutters along both eaves feed a downpipe straight into the rainwater tank on the stand — fresh water on site, no mains needed.',
    // TODO(calibrate): tank box [x,y,w,h] % and gutter/downpipe polyline on render-right
    tank: [58.47, 52.56, 20.15, 28.86],
    pipePath: [[66.12, 39.33], [76.3, 34.9], [76.1, 45.13], [69.3, 45.08], [69.28, 51.5]],
  },

  views: {
    id: 'views',
    accent: ACCENTS.white,
    headline: ['One house.', 'Every angle.'],
    toggle: { render: 'Render', blueprint: 'Blueprint' },
    // ASSUMPTION: Elevation C = rear, Elevation D = right side. TODO: confirm with DPC drawing set.
    items: [
      { key: 'rear', label: 'Rear', image: images.rear, blueprint: images.elev1, blueprintLabel: 'Elevation C · 1:75 @ A3', accent: ACCENTS.burgundy },
      { key: 'right', label: 'Right', image: images.right, blueprint: images.elev2, blueprintLabel: 'Elevation D · 1:75 @ A3', accent: ACCENTS.blue },
      { key: 'left', label: 'Left', image: images.left, blueprint: images.elev2, blueprintLabel: 'Elevation D (mirrored) · 1:75 @ A3', mirrorBlueprint: true, accent: ACCENTS.green },
      { key: 'plan', label: 'Plan', image: images.floorplan, blueprint: images.floorplan, blueprintLabel: 'Floor plan · NTS', accent: ACCENTS.timber },
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
      { label: 'Floor area', cells: ['TBC', { value: 48, suffix: ' m²', tbc: true }, 'TBC'] },
      { label: 'Water storage', cells: ['TBC', { value: 2500, suffix: ' L', tbc: true }, 'TBC'] },
      { label: 'Frame', cells: ['Steel', 'Steel frame', 'Steel'] },
      { label: 'Roof', cells: ['TBC', 'Corrugated iron, gable', 'TBC'] },
      { label: 'Cladding', cells: ['TBC', 'Weatherboard, timber-look (TBC)', 'TBC'] },
      { label: 'Foundation', cells: ['TBC', 'Raised on steel piles (TBC)', 'TBC'] },
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
