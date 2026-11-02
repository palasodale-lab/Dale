// Builds the page markup from content.js. No copy should live in this file.
import { site, sections as S, images } from './content.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const lines = (arr, cls = '') =>
  `<span class="lines ${cls}">${arr.map((l) => `<span class="line"><span class="line-inner">${esc(l)}</span></span>`).join('')}</span>`;
const badges = () => `<ul class="badges">${site.badges.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`;

export const dpcLogo = (size = 64) => `
<svg class="dpc-logo" width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="${esc(site.companyShort)} – ${esc(site.company)} (logo placeholder)">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1d58a"/><stop offset=".5" stop-color="#c79a3c"/><stop offset="1" stop-color="#8a6420"/></linearGradient>
    <path id="ring" d="M60 60 m-45 0 a45 45 0 1 1 90 0 a45 45 0 1 1 -90 0"/>
  </defs>
  <circle cx="60" cy="60" r="57" fill="none" stroke="url(#gold)" stroke-width="3"/>
  <circle cx="60" cy="60" r="35" fill="url(#gold)"/>
  <text x="60" y="68" text-anchor="middle" font-size="22" font-weight="800" fill="#141110" font-family="Inter Tight, sans-serif">DPC</text>
  <text font-size="8.6" font-weight="600" letter-spacing="1.2" fill="url(#gold)" font-family="Inter Tight, sans-serif"><textPath href="#ring" startOffset="0">DOKONA PAPUA CONSTRUCTION LIMITED ·</textPath></text>
</svg>`;

export function renderPage(root) {
  const { hero, built, frame, stats, floorplan, water, views, closing, compare, footer } = S;

  root.innerHTML = `
<a class="skip" href="#main">Skip to content</a>
<div class="fx-vignette" aria-hidden="true"></div>
<div class="fx-grain" aria-hidden="true"></div>

<header class="nav" role="banner">
  <a class="nav-brand" href="#overview">${esc(site.brand)}</a>
  <nav class="nav-links" aria-label="Sections">
    ${site.nav.map((n) => `<a href="${n.href}" data-nav="${n.href.slice(1)}">${esc(n.label)}</a>`).join('')}
  </nav>
  <a class="pill" href="${site.enquire.href}">${esc(site.enquire.label)}</a>
</header>
<div class="progress" aria-hidden="true"><span></span></div>

<!-- Persistent stage: the house "object" that orbits between sections -->
<div class="stage" aria-hidden="true">
  <div class="ghost"><span>${esc(site.ghostWord)}</span></div>
  <div class="stage-glow"></div>
  <div class="house-tilt">
    <div class="house-intro">
      <div class="house-rig">
        <div class="house-box">
          <img class="house-depth" src="${images.rearIso}" alt="" />
          <img class="house-img" data-k="rear" src="${images.rearIso}" alt="" />
          <img class="house-img" data-k="front" src="${images.front}" alt="" />
          <div class="hotspots">
            ${stats.hotspots
              .map(
                (h, i) => `<div class="hotspot hotspot--${h.side}" style="--x:${h.at[0]}%;--y:${h.at[1]}%;--i:${i}">
                  <i class="hotspot-dot"></i><i class="hotspot-line"></i><span class="hotspot-label">${esc(h.label)}</span></div>`
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<main id="main">
  <!-- 1 HERO -->
  <section class="sec sec-hero" id="${hero.id}" data-accent="${hero.accent}" style="--h:220vh">
    <div class="sticky">
      <p class="eyebrow hero-eyebrow">${esc(hero.eyebrow)}</p>
      <div class="hero-copy">
        <h1 class="display hero-title">${lines(hero.headline)}</h1>
        <p class="hero-sub">${esc(hero.sub)}</p>
        <p class="hero-tag">${esc(hero.tagline)}</p>
        ${badges()}
      </div>
      <div class="scroll-cue"><span>${esc(site.scrollCue)}</span><i></i></div>
    </div>
  </section>

  <!-- 2 BUILT -->
  <section class="sec sec-built" id="${built.id}" data-accent="${built.accent}" style="--h:220vh">
    <div class="sticky">
      <div class="copy copy--left">
        <h2 class="display reveal">${lines(built.headline)}</h2>
        <div class="body reveal-body">${built.body.map((b) => `<p>${esc(b)}</p>`).join('')}</div>
      </div>
    </div>
  </section>

  <!-- 2b STEEL FRAME (real DPC photo) -->
  <section class="sec sec-frame" id="${frame.id}" data-accent="${frame.accent}" style="--h:260vh">
    <div class="sticky">
      <div class="frame-photo">
        <img src="${images.steelFrame}" alt="Close-up of the DPC light-gauge steel frame: a truss chord with V-shaped web members, screw-fixed, stamped DPC" />
        ${frame.callouts
          .map((c, i) => `<div class="callout" style="--x:${c.at[0]}%;--y:${c.at[1]}%;--i:${i}"><i class="callout-dot"></i><span class="callout-label">${esc(c.label)}</span></div>`)
          .join('')}
      </div>
      <div class="frame-shade" aria-hidden="true"></div>
      <div class="copy copy--left">
        <p class="eyebrow reveal-body">${esc(frame.eyebrow)}</p>
        <h2 class="display reveal">${lines(frame.headline)}</h2>
        <p class="body reveal-body">${esc(frame.body)}</p>
      </div>
      <p class="frame-caption">${esc(frame.caption)}</p>
    </div>
  </section>

  <!-- 3 STATS -->
  <section class="sec sec-stats" id="${stats.id}" data-accent="${stats.accent}" style="--h:300vh">
    <div class="sticky">
      <div class="copy copy--left">
        <div class="stat"><span class="stat-num" data-count="${stats.count}"></span><span class="stat-label">${esc(stats.countLabel)}</span></div>
        <h2 class="display reveal">${lines(stats.headline)}</h2>
      </div>
    </div>
  </section>

  <!-- 4 FLOOR PLAN -->
  <section class="sec sec-plan" id="${floorplan.id}" data-accent="${floorplan.accent}" style="--h:520vh">
    <div class="sticky">
      <div class="plan-glow" aria-hidden="true"></div>
      <div class="plan-left">
        <h2 class="display reveal">${lines(floorplan.headline)}</h2>
        <div class="plan-caption" aria-live="polite">
          <span class="plan-caption-idx">01 / 0${floorplan.rooms.length}</span>
          <strong class="plan-caption-name">${esc(floorplan.rooms[0].name)}</strong>
          <p class="plan-caption-text">${esc(floorplan.rooms[0].caption)}</p>
        </div>
      </div>
      <div class="plan-view">
        <div class="plan-tilt">
          <div class="plan-box">
            <img src="${images.floorplan}" alt="3D floor plan of the Moto House" />
            ${floorplan.rooms
              .map(
                (r, i) =>
                  `<div class="room" data-i="${i}" style="left:${r.rect[0]}%;top:${r.rect[1]}%;width:${r.rect[2]}%;height:${r.rect[3]}%"><span>${esc(r.name)}</span></div>`
              )
              .join('')}
          </div>
        </div>
      </div>
      <aside class="glass plan-card" aria-label="Room list">
        <div class="plan-card-head"><span>${esc(floorplan.cardTitle)}</span><span class="live-dot">Live</span></div>
        <div class="plan-area"><span class="plan-area-num">0.0</span><span class="plan-area-unit">${esc(floorplan.areaUnit)}</span></div>
        <ol class="plan-list">
          ${floorplan.rooms.map((r, i) => `<li data-i="${i}"><span>${esc(r.name)}</span><span>${r.area.toFixed(1)} ${esc(floorplan.areaUnit)}</span></li>`).join('')}
        </ol>
        <p class="plan-note">${esc(floorplan.areaNote)}</p>
      </aside>
    </div>
  </section>

  <!-- 5 WATER -->
  <section class="sec sec-water" id="${water.id}" data-accent="${water.accent}" style="--h:320vh">
    <div class="sticky">
      <div class="water-bg" aria-hidden="true"></div>
      <div class="copy copy--left water-copy">
        <div class="stat"><span class="stat-num" data-count="${water.count}" data-step="100"></span><span class="stat-label">${esc(water.countLabel)}</span></div>
        <h2 class="display reveal">${lines(water.headline)}</h2>
        <p class="body reveal-body">${esc(water.body)}</p>
      </div>
      <div class="water-view">
        <div class="water-box" style="--tx:${water.tank[0] + water.tank[2] / 2}%;--ty:${water.tank[1] + water.tank[3] / 2}%">
          <img src="${images.right}" alt="Right elevation render showing the rainwater tank" />
          <svg class="pipes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points="${water.pipePath.map((p) => p.join(',')).join(' ')}" pathLength="1" />
          </svg>
          <div class="tank-gauge" style="left:${water.tank[0]}%;top:${water.tank[1]}%;width:${water.tank[2]}%;height:${water.tank[3]}%">
            <div class="tank-fill"><i class="tank-wave"></i></div>
            <div class="tank-ticks">${'<i></i>'.repeat(5)}</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 6 VIEWS -->
  <section class="sec sec-views" id="${views.id}" data-accent="${views.accent}" style="--h:440vh">
    <div class="sticky">
      <div class="views-head">
        <h2 class="display reveal">${lines(views.headline)}</h2>
        <div class="toggle" role="group" aria-label="Render or blueprint">
          <button type="button" class="toggle-btn is-on" data-mode="render" aria-pressed="true">${esc(views.toggle.render)}</button>
          <span class="toggle-arrows" aria-hidden="true">⇄</span>
          <button type="button" class="toggle-btn" data-mode="blueprint" aria-pressed="false">${esc(views.toggle.blueprint)}</button>
        </div>
      </div>
      <div class="views-stage">
        <div class="views-glow" aria-hidden="true"></div>
        <div class="views-box">
          ${views.items
            .map(
              (v, i) => `<figure class="view-layer${i === 0 ? ' is-active' : ''}" data-i="${i}">
                <img class="view-render" src="${v.image}" alt="${esc(v.label)} view" />
                <img class="view-blue${v.mirrorBlueprint ? ' is-mirror' : ''}" src="${v.blueprint}" alt="${esc(v.blueprintLabel)}" />
                <figcaption><span class="cap-render">${esc(v.label)} · Render</span><span class="cap-blue">${esc(v.blueprintLabel)}</span></figcaption>
              </figure>`
            )
            .join('')}
        </div>
      </div>
      <div class="swatches" role="tablist" aria-label="Choose a view">
        ${views.items
          .map(
            (v, i) => `<button type="button" role="tab" class="swatch${i === 0 ? ' is-active' : ''}" data-i="${i}" aria-selected="${i === 0}" style="--sw:${v.accent}">
              <span class="swatch-thumb"><img src="${v.image}" alt="" /></span><span class="swatch-label">${esc(v.label)}</span></button>`
          )
          .join('')}
      </div>
    </div>
  </section>

  <!-- 7 CLOSING -->
  <section class="sec sec-closing" id="${closing.id}" data-accent="${closing.accent}" style="--h:240vh">
    <div class="sticky">
      <div class="closing-top">
        <h2 class="display display--xl reveal">${lines(closing.headline)}</h2>
        <p class="closing-counts">${closing.counts
          .map((c, i) => `<span class="cc"><span class="cc-num" data-count="${c.value}"></span> ${esc(c.label)}</span>${i < closing.counts.length - 1 ? '<span class="cc-dot">·</span>' : '.'}`)
          .join('')}</p>
      </div>
      <div class="closing-bottom">
        ${badges()}
        <div class="ctas">
          <a class="btn btn--primary" href="${closing.ctaPrimary.href}">${esc(closing.ctaPrimary.label)}</a>
          <a class="btn btn--ghost" href="${closing.ctaSecondary.href}">${esc(closing.ctaSecondary.label)}</a>
          <button type="button" class="btn btn--film" data-film>▶ ${esc(site.film.label)}</button>
        </div>
        <p class="disclaimer">${esc(closing.disclaimer)}</p>
      </div>
    </div>
  </section>

  <!-- 8 COMPARE -->
  <section class="sec sec-compare" id="${compare.id}" data-accent="${compare.accent}">
    <div class="compare-inner">
      <h2 class="display reveal">${lines(compare.headline)}</h2>
      <div class="table-wrap">
        <table class="compare">
          <thead><tr><th scope="col"><span class="sr">Spec</span></th>${compare.models
            .map((m) => `<th scope="col" class="${m.highlight ? 'is-hl' : ''}"><span class="m-tag">${esc(m.tag)}</span><span class="m-name">${esc(m.name)}</span></th>`)
            .join('')}</tr></thead>
          <tbody>
            ${compare.rows
              .map(
                (r) => `<tr class="c-row"><th scope="row">${esc(r.label)}</th>${r.cells
                  .map((c, i) => {
                    const hl = compare.models[i].highlight ? ' class="is-hl"' : '';
                    if (typeof c === 'number') return `<td${hl}><span class="num" data-to="${c}">${c}</span></td>`;
                    if (c && typeof c === 'object')
                      return `<td${hl}><span class="num" data-to="${c.value}">${c.value.toLocaleString('en-US')}</span>${esc(c.suffix || '')}${c.tbc ? ' <em class="tbc">TBC</em>' : ''}</td>`;
                    if (c === 'TBC') return `<td${hl}><em class="tbc">TBC</em></td>`;
                    return `<td${hl}>${esc(c).replace(/\(?TBC\)?/, '<em class="tbc">TBC</em>')}</td>`;
                  })
                  .join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
      <p class="compare-note">${esc(compare.note)}</p>
    </div>
  </section>
</main>

<footer class="footer" id="contact">
  <div class="footer-brand">${dpcLogo(84)}<div><strong>${esc(site.company)}</strong><span>${esc(site.title)}</span></div></div>
  <dl class="footer-contact">${footer.contact.map((c) => `<div><dt>${esc(c.label)}</dt><dd>${esc(c.value)}</dd></div>`).join('')}</dl>
  <p class="footer-note">${esc(footer.note)}</p>
  <p class="footer-legal">${esc(footer.legal)}</p>
</footer>

<div class="film" role="dialog" aria-modal="true" aria-label="${esc(site.film.label)}" hidden>
  <button type="button" class="film-close" aria-label="Close">×</button>
  <video class="film-video" controls playsinline preload="none" poster="${site.film.poster}">
    <source src="${site.film.src}" type="video/mp4" />
  </video>
  <a class="film-fallback" href="ad.html" target="_blank" rel="noopener">Open the live 3D version →</a>
</div>`;
}
