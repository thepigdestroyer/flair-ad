/* ============================================================
   FLAIR-AD · figures/chip-compare.js
   Standard ChIP-seq (no antibody) vs CETCh-seq (tagged + anti-tag)
   Side-by-side lay-friendly comparison
   ============================================================ */
(function () {
  'use strict';

  function build(container) {
    const P = window.FLAIR?.chartUtil?.PALETTE || {};
    const focal     = P.focal     || '#c2185b';
    const focalDeep = P.focalDeep || '#8e0f45';
    const ink       = P.ink       || '#0a2540';
    const ink2      = P.ink2      || '#425466';
    const ink3      = P.ink3      || '#5f6f82';
    const paper     = P.paper     || '#ffffff';
    const paper3    = P.paper3    || '#eef2f7';
    const faint     = P.faint     || '#cad5e1';

    // Two SVG art panels — DNA + proteins + antibody
    function failArt(W, H) {
      // DNA + multiple near-identical IRF family blobs + ONE antibody fanning to all of them
      // (the antibody doesn't fail to bind — it binds ALL of them)
      let s = '';
      const cy = H / 2 + 10;
      // DNA strands
      s += `<path d="M 18,${cy - 14}
                    C 50,${cy - 22} 90,${cy - 6} 130,${cy - 14}
                    C 170,${cy - 22} 210,${cy - 6} ${W - 18},${cy - 14}"
                  fill="none" stroke="${ink3}" stroke-width="1.6" opacity="0.55"/>`;
      s += `<path d="M 18,${cy + 6}
                    C 50,${cy - 2} 90,${cy + 14} 130,${cy + 6}
                    C 170,${cy - 2} 210,${cy + 14} ${W - 18},${cy + 6}"
                  fill="none" stroke="${ink3}" stroke-width="1.6" opacity="0.55"/>`;
      [40, 70, 100, 130, 160, 190, 220, 250].filter(x => x < W - 20).forEach(x => {
        s += `<line x1="${x}" y1="${cy - 12}" x2="${x}" y2="${cy + 4}"
                    stroke="${ink3}" stroke-width="0.9" opacity="0.35"/>`;
      });
      // Three near-identical IRF blobs on DNA
      const py = cy - 24;
      const blobs = [
        { x: W * 0.18, label: 'IRF1', op: 0.85 },
        { x: W * 0.50, label: 'IRF2', op: 0.55 },
        { x: W * 0.82, label: 'IRF8', op: 0.50 },
      ];
      blobs.forEach(b => {
        s += `<ellipse cx="${b.x}" cy="${py}" rx="20" ry="15" fill="${focal}" opacity="${b.op}"/>`;
        s += `<text x="${b.x}" y="${py + 4}" text-anchor="middle" font-size="10"
                    font-weight="700" fill="${paper}" font-family="Inter,sans-serif">${b.label}</text>`;
      });
      // ONE antibody centered above, with dashed lines fanning to ALL three blobs
      const ax = W / 2, ay = 24;
      s += `<g transform="translate(${ax},${ay})">
              <line x1="0" y1="0" x2="0" y2="14"  stroke="${ink2}" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
              <line x1="0" y1="0" x2="-12" y2="-12" stroke="${ink2}" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
              <line x1="0" y1="0" x2="12"  y2="-12" stroke="${ink2}" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
              <circle cx="-12" cy="-12" r="3.5" fill="${ink2}" opacity="0.85"/>
              <circle cx="12"  cy="-12" r="3.5" fill="${ink2}" opacity="0.85"/>
            </g>`;
      blobs.forEach(b => {
        s += `<line x1="${ax}" y1="${ay + 14}" x2="${b.x}" y2="${py - 14}"
                    stroke="${focal}" stroke-width="1.4" stroke-dasharray="4,3" opacity="0.65"/>`;
      });
      // Callout label
      s += `<text x="${W / 2}" y="${H - 12}" text-anchor="middle" font-size="10" font-weight="700"
                  fill="${focal}" font-family="Inter,sans-serif">grabs the whole IRF family &mdash; not just IRF1</text>`;
      return s;
    }

    function winArt(W, H) {
      let s = '';
      const cy = H / 2;
      // DNA strands
      s += `<path d="M 18,${cy - 14}
                    C 50,${cy - 22} 90,${cy - 6} 130,${cy - 14}
                    C 170,${cy - 22} 210,${cy - 6} ${W - 18},${cy - 14}"
                  fill="none" stroke="${ink3}" stroke-width="1.6" opacity="0.55"/>`;
      s += `<path d="M 18,${cy + 6}
                    C 50,${cy - 2} 90,${cy + 14} 130,${cy + 6}
                    C 170,${cy - 2} 210,${cy + 14} ${W - 18},${cy + 6}"
                  fill="none" stroke="${ink3}" stroke-width="1.6" opacity="0.55"/>`;
      [40, 70, 100, 130, 160, 190, 220, 250].filter(x => x < W - 20).forEach(x => {
        s += `<line x1="${x}" y1="${cy - 12}" x2="${x}" y2="${cy + 4}"
                    stroke="${ink3}" stroke-width="0.9" opacity="0.35"/>`;
      });
      // IRF1 protein with FLAG tag attached (small pink badge)
      const px = W * 0.45, py = cy - 22;
      s += `<ellipse cx="${px}" cy="${py}" rx="22" ry="17" fill="${focal}" opacity="0.85"/>`;
      s += `<text x="${px}" y="${py + 4}" text-anchor="middle" font-size="11"
                  font-weight="700" fill="${paper}" font-family="Inter,sans-serif">IRF1</text>`;
      // FLAG tag bump
      s += `<rect x="${px + 18}" y="${py - 22}" width="34" height="14" rx="4"
                  fill="${focalDeep}" opacity="0.95"/>`;
      s += `<text x="${px + 35}" y="${py - 12}" text-anchor="middle" font-size="9"
                  font-weight="800" fill="${paper}" font-family="JetBrains Mono, monospace">FLAG</text>`;
      // line connecting tag to protein
      s += `<line x1="${px + 16}" y1="${py - 6}" x2="${px + 21}" y2="${py - 14}"
                  stroke="${focalDeep}" stroke-width="2" stroke-linecap="round"/>`;

      // Antibody binds to FLAG (kept inside viewBox)
      const ax = px + 60, ay = py - 40;
      s += `<g transform="translate(${ax},${ay})">
              <line x1="0" y1="20" x2="0" y2="44" stroke="${focal}" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="0" y1="20" x2="-14" y2="0" stroke="${focal}" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="0" y1="20" x2="14"  y2="0" stroke="${focal}" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="-14" cy="0" r="4" fill="${focal}"/>
              <circle cx="14"  cy="0" r="4" fill="${focal}"/>
            </g>`;
      // anti-FLAG label to the right of the antibody, inside viewBox
      s += `<text x="${ax + 26}" y="${ay + 12}" font-size="9"
                  font-weight="700" fill="${focal}" font-family="Inter,sans-serif">anti-FLAG</text>`;
      // green-ish check (using focal hue) - but use simple checkmark in focal
      s += `<g transform="translate(${ax + 18},${ay + 30})">
              <circle cx="0" cy="0" r="11" fill="${focal}" opacity="0.95"/>
              <polyline points="-5,1 -1,5 5,-3" fill="none" stroke="${paper}" stroke-width="2.2"
                        stroke-linecap="round" stroke-linejoin="round"/>
            </g>`;
      // baseline
      s += `<line x1="0" y1="${H - 8}" x2="${W}" y2="${H - 8}"
                  stroke="${ink3}" stroke-width="0.8" opacity="0.2"/>`;
      return s;
    }

    const failW = 320, failH = 150;
    const winW = 320, winH = 150;

    const html = `
      <div class="chip-compare-wrap">
        <article class="chip-compare-col chip-compare-col--fail">
          <span class="chip-compare-label">Standard ChIP-seq · non-specific</span>
          <h3 class="chip-compare-title">No antibody can tell IRF1 from its family.</h3>
          <p class="chip-compare-body">
            ChIP-seq pulls a protein out of the cell using an antibody. For
            <span class="mono">IRF1</span>, every off-the-shelf antibody also
            binds its near-identical siblings (IRF2, IRF8, and the rest of the
            IRF1&ndash;9 family) &mdash; so the map you'd get is a blur of
            every IRF, not a fingerprint of IRF1.
          </p>
          <svg class="chip-compare-art" viewBox="0 0 ${failW} ${failH}" role="img"
               aria-label="DNA with three near-identical IRF family proteins (IRF1, IRF2, IRF8), one antibody above with dashed lines fanning to all three — non-specific binding">
            ${failArt(failW, failH)}
          </svg>
        </article>

        <span class="chip-compare-vs">vs</span>

        <article class="chip-compare-col chip-compare-col--win">
          <span class="chip-compare-label">CETCh-seq · IRF1-only</span>
          <h3 class="chip-compare-title">Tag only IRF1. Use a universal antibody.</h3>
          <p class="chip-compare-body">
            We use prime editing to glue a tiny <span class="mono">FLAG</span>
            barcode onto the IRF1 gene &mdash; and only the IRF1 gene. An
            off-the-shelf anti-FLAG antibody now pulls down IRF1 alone, no
            matter how similar its siblings are. Specific by design.
          </p>
          <svg class="chip-compare-art" viewBox="0 0 ${winW} ${winH}" role="img"
               aria-label="DNA with IRF1 protein carrying a FLAG tag, anti-FLAG antibody binding — works">
            ${winArt(winW, winH)}
          </svg>
        </article>
      </div>`;

    container.innerHTML = html;

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.registerPlugin(ScrollTrigger);
      const cols = container.querySelectorAll('.chip-compare-col');
      gsap.from(cols, {
        y: 20, duration: 0.6, ease: 'power2.out',
        stagger: 0.15,
        immediateRender: false,
        scrollTrigger: { trigger: container, start: 'top 80%', once: true },
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('fig-chip-compare');
    if (!el) return;
    build(el);
    if (window.FLAIR?.chartUtil?.observeResize) {
      window.FLAIR.chartUtil.observeResize(el, () => build(el));
    }
  });
})();
