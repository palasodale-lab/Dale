# MOTO HOUSE – 2 Bedroom House · DPC

A scroll-driven product site and a 3D ad film for the **MOTO HOUSE** by **Dokona Papua Construction Limited (DPC)**.
*Proposed Rural Housing · Architectural Concept Proposal*

```bash
npm install
npm run dev          # site → http://localhost:5173   ·   ad film → http://localhost:5173/ad.html
npm run build        # static build in /dist (deploy anywhere)
```

## What's in here

| | |
|---|---|
| **Website** (`index.html`) | Nine pinned, scroll-scrubbed sections: Hero → Built for… → **Steel frame (real DPC photo)** → Bedroom count → Floor plan → Water → Views (Render ⇄ Blueprint) → Move in → Pick your size, then the footer. Built with Vite, vanilla JS, GSAP + ScrollTrigger and Lenis. |
| **3D ad film** (`ad.html`) | A 16-second real-time Three.js film of a procedural model of the steel-framed house. It shows the copy **"Less than 100K"**, **"Supply only"** and **"Coming soon"**, plus a scene where the cladding fades away to show the **steel frame**, then cuts to the real DPC frame photo. Use `?format=vertical` for the 9:16 social cut. |
| **Rendered videos** | `public/media/moto-house-ad.mp4` (1920×1080) and `public/media/moto-house-ad-vertical.mp4` (1080×1920), each with a poster JPG. The site plays the 16:9 film from the **▶ Watch the film** button in the closing section. |

## Editing

- **All copy and data are in [`src/content.js`](src/content.js)**: headlines (one array item per line), body text, nav, badges, room names and areas, comparison table, footer contacts and the ad-film copy. No copy is stored anywhere else.
- **Images** live in `public/assets/`. They are crops of the DPC marketing set you sent (phone screenshots, about 900–1,170 px wide). Swap in the original high-res exports under the same filenames for a sharper result:
  `render-rear-iso.jpg` (isometric rear view), `floorplan-3d.jpg`, `render-rear.jpg`, `render-right.jpg`, `render-left.jpg`, `elev-drawing-1.png` (front/rear elevations incl. Elevation C), `elev-drawing-2.png` (side elevations incl. Elevation D), `plan-drawing.png` (CAD floor plan), `steel-frame.jpg` (frame photo).
- **Overlays** (room outlines, hotspots, tank gauge, gutter line) are % coordinates in `content.js`, calibrated to these crops. Re-check them if you replace an image with a different crop. The image boxes use each image's aspect ratio.
- **Re-render the film** after you change ad copy or the model: `npm run render:ad` (16:9) and `npm run render:ad -- --vertical` (9:16). This needs Playwright Chromium (`npx playwright install chromium`) and `ffmpeg`. For a quick draft add `--fps 24 --scale 0.5`.

## ⚠️ Assumptions & TODOs (please check)

1. **3D model = approximation.** The film's house is a procedural model built from the DPC drawings and renders: 7000 × 6000 plan, 1728 verandah, skillion roof rising toward the verandah, white weatherboard, louvre windows, low black piles, centre hallway with rear steps, 2,500 L tank on the right as you face the rear wall. It is not construction data.
2. **Steel frame.** The model follows your photo: light-gauge galvanised members with screw-fixed V/W-web trusses. The copy says "light-gauge galvanised steel". Please confirm the spec.
3. **Water tank.** The site shows **2,500 L** as the renders do. The elevation drawings say **9,000 LITERS**. Confirm the size (TODO in `content.js`).
4. **Section 3 "front render".** The set has no front render, so section 3 crossfades to the **right elevation**. It shows the verandah steps, louvres, raised floor and gutter + downpipe for the hotspots.
5. **Room areas** were measured off the CAD plan (bedrooms ≈ 9.8 m², hallway 6.0 m², verandah ≈ 12.1 m², floor area 42 m² + verandah). They are shown as approximate/TBC. The **1BR and 3BR** models are invented variants marked **TBC**.
6. **Roof.** Deep-maroon corrugated sheet. The skillion is high at the verandah side, falls to the rear, and has a deep front overhang above the lower verandah roof, as in the renders. One of the CAD side elevations shows it the other way round. The model follows the renders.
7. **"Less than 100K"** is shown exactly as given, with no currency added (presumably PGK). "Supply only" is paired with the line "2 bedrooms · 1 bathroom · 1 home".
8. **Contacts and the DPC logo** are placeholders: a black-and-gold SVG mark styled after the DPC badge, phone, email and the `mailto:` on "Request this design". Drop in the real logo file when you have it.
9. The renders keep their tropical backgrounds and are feathered into the dark page with a soft mask. True cut-outs (transparent PNG/WebP) would float better. Swap them in under the same names.
10. The site uses **Inter Tight**, self-hosted through `@fontsource`, so it works offline.

## Motion and accessibility notes

- The house layer is one persistent "stage". Each section defines keyframes (x, scale, rotateY, image weights). A single ticker blends between them, so the house never hard-cuts: it crossfades, scales and turns, with a blurred depth layer and parallax that fake the 3D orbit.
- Accent colours tween for 0.6s per section: burgundy → orange → timber → green → blue → white. They drive the Enquire pill (text flips to dark on light accents), the glow under the house, the progress bar and the highlights.
- Counters are rolling odometer reels with tabular figures. They overshoot slightly, then settle.
- `prefers-reduced-motion` turns off Lenis, the film grain, smoothing, mask reveals and wipes. Content shows in its final state.
- Layouts are tuned for desktop and phone widths (the floor-plan card becomes a 2-column list on mobile).

## Structure

```
index.html · ad.html · vite.config.js
src/content.js        ← all copy and data
src/main.js           ← scroll choreography (stage, sections, counters, nav)
src/dom.js            ← markup built from content.js
src/styles.css
src/lib/counter.js    ← odometer and easing helpers
src/three/house.js    ← procedural 3D model of the Moto House (used by the ad film)
src/ad/ad.js|css      ← the ad film
scripts/render-ad.mjs ← renders the ad film to MP4
public/assets/        ← DPC images (crops of the marketing set) + steel-frame photo
public/media/         ← rendered ad videos and posters
```

*Proposed concept – subject to final design. 3D render photo may vary from actual/final design.*
