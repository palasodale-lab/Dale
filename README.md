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
| **Website** (`index.html`) | Eight pinned, scroll-scrubbed sections: Hero → Built for… → Bedroom count → Floor plan → Water → Views (Render ⇄ Blueprint) → Move in → Pick your size, then the footer. Built with Vite, vanilla JS, GSAP + ScrollTrigger and Lenis. |
| **3D ad film** (`ad.html`) | A 16-second real-time Three.js film of a procedural model of the steel-framed house. It shows the copy **"Less than 100K"**, **"Supply only"** and **"Coming soon"**, plus a scene where the cladding fades away to show the **steel frame**. Use `?format=vertical` for the 9:16 social cut. |
| **Rendered videos** | `public/media/moto-house-ad.mp4` (1920×1080) and `public/media/moto-house-ad-vertical.mp4` (1080×1920), each with a poster JPG. The site plays the 16:9 film from the **▶ Watch the film** button in the closing section. |

## Editing

- **All copy and data are in [`src/content.js`](src/content.js)**: headlines (one array item per line), body text, nav, badges, room names and areas, comparison table, footer contacts and the ad-film copy. No copy is stored anywhere else.
- **Images** go in `public/assets/` and keep these filenames:
  `render-rear-iso.jpg`, `render-front.jpg`, `floorplan-3d.jpg`, `elev-drawing-1.png`, `elev-drawing-2.png`, `render-rear.jpg`, `render-right.jpg`, `render-left.jpg`.
- **Re-render the film** after you change ad copy: `npm run render:ad` (16:9) and `npm run render:ad -- --vertical` (9:16). This needs Playwright Chromium (`npx playwright install chromium`) and `ffmpeg`. For a quick draft add `--fps 24 --scale 0.5`.
- `npm run placeholders` rebuilds the placeholder images from the 3D model.

## ⚠️ Assumptions & TODOs (please check)

1. **The images you attached did not reach the repo.** So the site runs today, every file in `public/assets/` is a **placeholder** made from a procedural 3D model of the house. Each one is stamped "PLACEHOLDER". To swap them, drop the real DPC renders in under the same filenames.
2. **Calibrate the overlays after swapping images.** Hotspot leader lines, floor-plan room outlines, the water-tank gauge box and the gutter/downpipe line are stored as % coordinates in `content.js`. Search for `TODO(calibrate)`. They currently match the placeholders. Image boxes assume a 16:10 frame.
3. **Front render.** The brief asks for a crossfade to a "front render", but none was listed. A placeholder `render-front.jpg` is included. If DPC has none, point `images.front` at `render-left.jpg`.
4. **Steel frame.** The house is described as steel-framed. The model, copy and table show a steel frame and steel piles. Pile material and cladding (shown as timber-look weatherboard) are marked **TBC**.
5. **Water tank.** The site shows **2,500 L** as the renders do. The elevation drawings say **9,000 L**. Confirm the size (TODO in `content.js`).
6. **Elevations.** Elevation C is assumed to be the rear and Elevation D the right side. The "Left" blueprint is a mirrored Elevation D.
7. **Room areas** (floor-plan card) and **floor area 48 m²** are placeholders marked TODO/TBC. The **1BR and 3BR** models are invented variants. Every invented value shows a **TBC** tag.
8. **"Less than 100K"** is shown exactly as given, with no currency added (presumably PGK). "Supply only" is paired with the line "2 bedrooms · 1 bathroom · 1 home".
9. **Contacts and the DPC logo** are placeholders: a gold circular SVG mark, phone, email and the `mailto:` on "Request this design".
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
src/three/house.js    ← procedural 3D model (steel frame, piles, louvres, tank…)
src/ad/ad.js|css      ← the ad film
scripts/              ← render-ad.mjs, gen-placeholders.mjs
tools/placeholders.*  ← dev-only page used to render placeholder images
public/assets/        ← images (placeholders for now)
public/media/         ← rendered ad videos and posters
```

*Proposed concept – subject to final design. 3D render photo may vary from actual/final design.*
