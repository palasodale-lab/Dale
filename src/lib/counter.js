/**
 * Rolling odometer counter with tabular figures.
 * Each digit is a vertical reel (0-9,0). Values are continuous, so the reels roll
 * like a mechanical counter. Use `backOut` mapping for the "overshoot then settle" feel.
 */
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const remap = (v, a, b) => clamp((v - a) / (b - a));
export const lerp = (a, b, t) => a + (b - a) * t;

/** back.out style easing: overshoots ~8–10 % then settles at 1. */
export function backOut(t, s = 1.5) {
  const c3 = s + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
}

export class Odometer {
  /**
   * @param {HTMLElement} el   container
   * @param {object} o
   * @param {number} o.target   final value (integer)
   * @param {number} [o.step=1] counting step (e.g. 100 → last two digits stay "00")
   * @param {boolean} [o.separators=true] thousands separators
   */
  constructor(el, { target, step = 1, separators = true }) {
    this.el = el;
    this.target = target;
    this.step = step;
    el.classList.add('odo');
    el.setAttribute('aria-label', target.toLocaleString('en-US'));
    const str = String(target);
    const staticCount = Math.round(Math.log10(step));
    this.reels = [];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < str.length; i++) {
      const fromRight = str.length - 1 - i;
      if (separators && i > 0 && (fromRight + 1) % 3 === 0) {
        const sep = document.createElement('span');
        sep.className = 'odo-sep';
        sep.textContent = ',';
        frag.appendChild(sep);
        this.reels.push({ sep, place: fromRight + 1 });
      }
      if (fromRight < staticCount) {
        const s = document.createElement('span');
        s.className = 'odo-static';
        s.textContent = '0';
        frag.appendChild(s);
        this.reels.push({ staticEl: s, place: fromRight });
        continue;
      }
      const reel = document.createElement('span');
      reel.className = 'odo-reel';
      const strip = document.createElement('span');
      strip.className = 'odo-strip';
      strip.setAttribute('aria-hidden', 'true');
      strip.innerHTML = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => `<span>${d}</span>`).join('');
      reel.appendChild(strip);
      frag.appendChild(reel);
      this.reels.push({ reel, strip, i: fromRight - staticCount, place: fromRight });
    }
    el.appendChild(frag);
    this.set(0);
  }

  /** Set a continuous value (may exceed target briefly for overshoot). */
  set(v) {
    const u = Math.max(0, v) / this.step;
    const mag = Math.max(1, Math.floor(Math.log10(Math.max(1, Math.round(v)))) + 1); // visible digits
    for (const r of this.reels) {
      const lead = r.place >= mag; // leading zero
      if (r.sep) {
        r.sep.style.opacity = lead ? 0.12 : 1;
        continue;
      }
      if (r.staticEl) {
        r.staticEl.style.opacity = lead ? 0.12 : 1;
        continue;
      }
      const d = u / Math.pow(10, r.i);
      let pos;
      if (r.i === 0) pos = d % 10;
      else {
        const lower = (u / Math.pow(10, r.i - 1)) % 10;
        pos = (Math.floor(d) % 10) + Math.max(0, lower - 9);
      }
      r.strip.style.transform = `translate3d(0, ${(-pos * 100) / 11}%, 0)`;
      r.reel.style.opacity = lead && v < this.target ? 0.12 : 1;
    }
  }
}
