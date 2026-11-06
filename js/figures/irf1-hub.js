/* ============================================================
   FLAIR-AD · figures/irf1-hub.js
   IRF1 master regulator: hub-and-spoke into enhancers and genes
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
    const paper2    = P.paper2    || '#f6f8fb';
    const context   = P.context   || '#a0b3c7';

    const isNarrow = container.offsetWidth < 600;
    const W = isNarrow ? 400 : 880;
    const H = isNarrow ? 480 : 440;
    const cx = W / 2;
    const cy = isNarrow ? H / 2 - 4 : H / 2 - 4;
    const ringR = isNarrow ? 158 : 168;
    const innerR = isNarrow ? 56 : 62;
    const enhR = isNarrow ? 100 : 110;

    // Outer enhancer/gene targets — ApoE4 is the strongest known AD risk gene
    // and the 2026 ME-seq paper placed IRF1 upstream of it, so we mark it specially.
    const TARGETS = [
      { ang: -1.57, gene: 'ApoE4',  hit: true,  apoe: true },
      { ang: -1.05, gene: 'TREM2',  hit: true  },
      { ang: -0.55, gene: 'CD33',   hit: true  },
      { ang: -0.05, gene: 'INPP5D', hit: true  },
      { ang:  0.45, gene: 'MS4A6A', hit: false },
      { ang:  0.95, gene: 'MEF2C',  hit: true  },
      { ang:  1.55, gene: 'BIN1',   hit: false },
      { ang:  2.05, gene: 'SPI1',   hit: true  },
      { ang:  2.55, gene: 'PICALM', hit: false },
      { ang:  3.05, gene: 'PLCG2',  hit: true  },
      { ang: -2.65, gene: 'ABCA7',  hit: false },
      { ang: -2.10, gene: 'CR1',    hit: true  },
    ];

    let spokes = '';
    let nodes = '';
    let labels = '';
    TARGETS.forEach((t) => {
      const tx = cx + Math.cos(t.ang) * ringR;
      const ty = cy + Math.sin(t.ang) * ringR;
      // Enhancer mid-point along spoke (outside hub-glow)
      const ex = cx + Math.cos(t.ang) * enhR;
      const ey = cy + Math.sin(t.ang) * enhR;

      const col = t.hit ? focal : ink3;
      const op  = t.hit ? 0.85 : 0.45;

      // Spoke from hub edge to enhancer
      const startX = cx + Math.cos(t.ang) * (innerR + 18);
      const startY = cy + Math.sin(t.ang) * (innerR + 18);
      spokes += `<line x1="${startX}" y1="${startY}" x2="${ex}" y2="${ey}"
                       stroke="${col}" stroke-width="${t.hit ? 1.6 : 1.2}"
                       stroke-linecap="round" opacity="${op}"/>`;
      // Enhancer pill (small)
      spokes += `<rect x="${ex - 9}" y="${ey - 5}" width="18" height="10" rx="3"
                       fill="${t.hit ? focal : paper}"
                       stroke="${col}" stroke-width="1" opacity="${t.hit ? 0.85 : 0.95}"/>`;
      spokes += `<text x="${ex}" y="${ey + 3}" text-anchor="middle" font-size="6.5"
                       fill="${t.hit ? paper : ink3}" font-weight="700"
                       font-family="JetBrains Mono, monospace">enh</text>`;
      // Spoke from enhancer to gene tag
      spokes += `<line x1="${ex}" y1="${ey}" x2="${tx}" y2="${ty}"
                       stroke="${col}" stroke-width="${t.hit ? 1.4 : 1.1}"
                       stroke-dasharray="3,2" opacity="${op}"/>`;

      // Gene chip — ApoE4 gets a slightly bigger, glowing chip
      const chipW = t.apoe ? (isNarrow ? 64 : 76) : (isNarrow ? 56 : 64);
      const chipH = t.apoe ? (isNarrow ? 24 : 28) : (isNarrow ? 20 : 22);
      const chipX = tx - chipW / 2;
      const chipY = ty - chipH / 2;
      if (t.apoe) {
        // halo behind ApoE4 chip
        nodes += `<rect x="${chipX - 4}" y="${chipY - 4}" width="${chipW + 8}" height="${chipH + 8}" rx="14"
                        fill="${focal}" opacity="0.18"/>`;
      }
      nodes += `<rect x="${chipX}" y="${chipY}" width="${chipW}" height="${chipH}" rx="11"
                      fill="${t.hit ? focal : paper}"
                      stroke="${t.apoe ? focalDeep : col}"
                      stroke-width="${t.apoe ? 2 : 1.4}" opacity="${t.hit ? 0.95 : 1}"/>`;
      // GWAS marker (star) — bigger for ApoE4
      if (t.hit) {
        const mr = t.apoe ? 5 : 4;
        nodes += `<circle cx="${chipX + chipW - mr - 3}" cy="${chipY + mr + 1}" r="${mr}"
                          fill="${paper}" stroke="${focalDeep}" stroke-width="1.2"/>`;
        nodes += `<text x="${chipX + chipW - mr - 3}" y="${chipY + mr + 3}" text-anchor="middle"
                          font-size="${t.apoe ? 7 : 6}" font-weight="700" fill="${focalDeep}"
                          font-family="JetBrains Mono, monospace">★</text>`;
      }
      labels += `<text x="${tx}" y="${ty + (t.apoe ? 5 : 4)}" text-anchor="middle"
                       font-size="${t.apoe ? 12 : 10}"
                       fill="${t.hit ? paper : ink2}" font-weight="${t.apoe ? '800' : '700'}"
                       font-family="JetBrains Mono, monospace">${t.gene}</text>`;
      if (t.apoe) {
        // little tag pulled out beyond chip
        const tagX = tx + Math.cos(t.ang) * 50;
        const tagY = ty + Math.sin(t.ang) * 50;
        labels += `<text x="${tagX}" y="${tagY}" text-anchor="middle"
                         font-size="9" font-style="italic" fill="${focalDeep}"
                         font-family="Inter,sans-serif"
                         font-weight="600">strongest risk gene</text>`;
      }
    });

    // Hub — note "candidate master regulator" sits BELOW the hub to avoid the glow ring
    const hub = `
      <circle cx="${cx}" cy="${cy}" r="${innerR + 14}" fill="${focal}" opacity="0.06"/>
      <circle cx="${cx}" cy="${cy}" r="${innerR + 6}" fill="${focal}" opacity="0.10"/>
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="${paper}"
              stroke="${focal}" stroke-width="2"/>
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="22" font-weight="800"
            fill="${focal}" font-family="Inter Tight, Inter, sans-serif">IRF1</text>
      <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="10"
            fill="${focalDeep}" font-family="Inter,sans-serif">transcription factor</text>`;
    // Subtitle outside the hub, at the bottom of the canvas
    const subtitle = `<text x="${cx}" y="${H - 18}" text-anchor="middle"
                            font-size="11" font-style="italic"
                            fill="${ink3}" font-family="Inter,sans-serif"
                            opacity="0.95">IRF1 — candidate master regulator</text>`;

    // Legend — top-left corner so it doesn't fight the bottom subtitle
    const legX = 18, legY = 18;
    const legend = `
      <g font-family="Inter,sans-serif" font-size="10" fill="${ink2}">
        <rect x="${legX}" y="${legY}" width="14" height="10" rx="3" fill="${focal}" opacity="0.95"/>
        <text x="${legX + 20}" y="${legY + 9}">overlaps GWAS risk locus</text>
        <rect x="${legX}" y="${legY + 18}" width="14" height="10" rx="3"
              fill="${paper}" stroke="${ink3}" stroke-width="1.2"/>
        <text x="${legX + 20}" y="${legY + 27}">other microglial gene</text>
        <text x="${W - 16}" y="${legY + 9}" text-anchor="end" font-size="9"
              font-style="italic" fill="${ink3}">target genes shown are illustrative</text>
      </g>`;

    const svg = `
      <svg viewBox="0 0 ${W} ${H}" role="img" preserveAspectRatio="xMidYMid meet"
           aria-label="IRF1 hub controlling many microglial enhancers; several target genes overlap Alzheimer GWAS risk loci"
           style="width:100%;max-width:${W}px;display:block;margin:0 auto">
        ${spokes}
        ${hub}
        ${nodes}
        ${labels}
        ${legend}
        ${subtitle}
      </svg>`;

    container.innerHTML = svg;

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.from(container, {
        scale: 0.96, duration: 0.7, ease: 'power2.out',
        transformOrigin: 'center center',
        immediateRender: false,
        scrollTrigger: { trigger: container, start: 'top 82%', once: true },
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('fig-irf1-hub');
    if (!el) return;
    build(el);
    if (window.FLAIR?.chartUtil?.observeResize) {
      window.FLAIR.chartUtil.observeResize(el, () => build(el));
    }
  });
})();
