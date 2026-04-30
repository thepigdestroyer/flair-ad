/* ============================================================
   FLAIR-AD · figures/microglia-state.js
   Three-state microglia: alarmed ← gardener → DAM
   Gardener is centred; two outward arrows show divergent states
   ============================================================ */
(function () {
  'use strict';

  function process(cx, cy, angle, somaR, len, jitter, branchAt) {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const sx = cx + somaR * cos, sy = cy + somaR * sin;
    const ex = cx + (somaR + len) * cos, ey = cy + (somaR + len) * sin;
    const cp1x = sx + len * 0.4 * cos + jitter * (-sin);
    const cp1y = sy + len * 0.4 * sin + jitter * cos;
    const cp2x = ex - len * 0.2 * cos + jitter * 0.4 * (-sin);
    const cp2y = ey - len * 0.2 * sin + jitter * 0.4 * cos;
    let d = `M${sx.toFixed(1)},${sy.toFixed(1)} C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
    if (branchAt) {
      const bx = cx + (somaR + len * branchAt) * cos;
      const by = cy + (somaR + len * branchAt) * sin;
      const ba = angle + 0.5, bl = len * 0.3;
      const b1x = bx + bl * Math.cos(ba), b1y = by + bl * Math.sin(ba);
      const ba2 = angle - 0.4;
      const b2x = bx + bl * 0.7 * Math.cos(ba2), b2y = by + bl * 0.7 * Math.sin(ba2);
      d += ` M${bx.toFixed(1)},${by.toFixed(1)} L${b1x.toFixed(1)},${b1y.toFixed(1)}`;
      d += ` M${bx.toFixed(1)},${by.toFixed(1)} L${b2x.toFixed(1)},${b2y.toFixed(1)}`;
    }
    return d;
  }

  // Gardener: many fine branches, small soma
  function gardenerSVG(cx, cy, col) {
    const somaR = 13;
    const procs = [
      [0,    50, -5,  0.6],
      [0.78, 38,  6,  0.5],
      [1.57, 32, -4,  0.6],
      [2.36, 36,  8,  0.55],
      [3.14, 52, -6,  0.6],
      [3.93, 42,  5,  0.5],
      [4.71, 32, -5,  0.55],
      [5.50, 30,  7,  null],
    ];
    let s = procs.map(([a,l,j,b]) =>
      `<path d="${process(cx,cy,a,somaR,l,j,b)}" stroke="${col}" stroke-width="1.7"
              fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`
    ).join('');
    s += `<circle cx="${cx}" cy="${cy}" r="${somaR}" fill="${col}" opacity="0.18"/>
          <circle cx="${cx}" cy="${cy}" r="${somaR}" fill="none" stroke="${col}" stroke-width="1.5"/>
          <ellipse cx="${cx-3}" cy="${cy-3}" rx="4" ry="3.5" fill="${col}" opacity="0.55"/>`;
    return s;
  }

  // Alarmed/activated: medium soma, mid-thickness processes, partial retraction
  function alarmedSVG(cx, cy, col) {
    const somaR = 17;
    const procs = [
      [0.2, 28, -6, 0.5],
      [1.1, 22,  5, null],
      [2.0, 26, -4, 0.5],
      [2.9, 24,  6, null],
      [3.8, 28, -5, 0.5],
      [4.7, 20,  4, null],
      [5.6, 24, -3, 0.5],
    ];
    let s = procs.map(([a,l,j,b]) =>
      `<path d="${process(cx,cy,a,somaR,l,j,b)}" stroke="${col}" stroke-width="2.3"
              fill="none" stroke-linecap="round" opacity="0.85"/>`
    ).join('');
    s += `<circle cx="${cx}" cy="${cy}" r="${somaR}" fill="${col}" opacity="0.18"/>
          <circle cx="${cx}" cy="${cy}" r="${somaR}" fill="none" stroke="${col}" stroke-width="1.7"/>
          <circle cx="${cx-3}" cy="${cy-3}" r="5" fill="${col}" opacity="0.5"/>
          <circle cx="${cx+4}" cy="${cy+2}" r="3" fill="${col}" opacity="0.35"/>`;
    return s;
  }

  // DAM (disease-associated microglia): large soma, few stubby processes, ameboid
  function damSVG(cx, cy, col) {
    const somaR = 21;
    const procs = [
      [0.4, 22, -8],
      [1.9, 18,  6],
      [3.3, 20, -7],
      [4.8, 16,  9],
    ];
    let s = procs.map(([a,l,j]) =>
      `<path d="${process(cx,cy,a,somaR,l,j,null)}" stroke="${col}" stroke-width="3.2"
              fill="none" stroke-linecap="round" opacity="0.88"/>`
    ).join('');
    s += `<circle cx="${cx}" cy="${cy}" r="${somaR}" fill="${col}" opacity="0.16"/>
          <circle cx="${cx}" cy="${cy}" r="${somaR}" fill="none" stroke="${col}" stroke-width="2"/>
          <circle cx="${cx-5}" cy="${cy-4}" r="7" fill="${col}" opacity="0.22"/>
          <circle cx="${cx+6}" cy="${cy+3}" r="5" fill="${col}" opacity="0.18"/>
          <ellipse cx="${cx-2}" cy="${cy-2}" rx="6" ry="5" fill="${col}" opacity="0.55"/>
          <circle cx="${cx+2}" cy="${cy+2}" r="2.5" fill="${col}" opacity="0.4"/>`;
    [0.2, 1.0, 2.2, 3.6, 5.0].forEach(a => {
      const bx = cx + (somaR + 3) * Math.cos(a);
      const by = cy + (somaR + 3) * Math.sin(a);
      s += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="3.5"
                    fill="${col}" opacity="0.25" stroke="${col}" stroke-width="0.9"/>`;
    });
    return s;
  }

  function build(container) {
    const P = window.FLAIR?.chartUtil?.PALETTE || {};
    const focal     = P.focal     || '#c2185b';
    const focalDeep = P.focalDeep || '#8e0f45';
    const ink       = P.ink       || '#0a2540';
    const ink2      = P.ink2      || '#425466';
    const ink3      = P.ink3      || '#6a7a8c';
    const paper2    = P.paper2    || '#f6f8fb';
    const gardener  = '#2f7d3f'; // sage green for gardener
    const alarm     = '#c87a1a'; // amber for alarm/activated
    // DAM uses focal (magenta)

    const W = 820, H = 320;
    const panelW = 180;
    const gap = 120;
    // Layout: Alarmed (left) | Gardener (centre) | DAM (right)
    const x1 = 20;                       // Alarmed panel
    const x2 = x1 + panelW + gap;        // Gardener panel
    const x3 = x2 + panelW + gap;        // DAM panel
    const cy = 150;
    const cx1 = x1 + panelW / 2;         // Alarmed centre
    const cx2 = x2 + panelW / 2;         // Gardener centre
    const cx3 = x3 + panelW / 2;         // DAM centre

    // Arrow pointing LEFT — used in left gap (Gardener → Alarmed)
    const arrowLeft = (xMid) => `
      <line x1="${xMid + 20}" y1="${cy + 6}" x2="${xMid - 14}" y2="${cy + 6}"
            stroke="${ink3}" stroke-width="1.4" stroke-dasharray="5,4" opacity="0.7"/>
      <polygon points="${xMid - 14},${cy + 2} ${xMid - 22},${cy + 6} ${xMid - 14},${cy + 10}"
               fill="${ink3}" opacity="0.7"/>`;

    // Arrow pointing RIGHT — used in right gap (Gardener → DAM)
    const arrowRight = (xMid) => `
      <line x1="${xMid - 20}" y1="${cy + 6}" x2="${xMid + 14}" y2="${cy + 6}"
            stroke="${ink3}" stroke-width="1.4" stroke-dasharray="5,4" opacity="0.7"/>
      <polygon points="${xMid + 14},${cy + 2} ${xMid + 22},${cy + 6} ${xMid + 14},${cy + 10}"
               fill="${ink3}" opacity="0.7"/>`;

    const leftGapMid  = x1 + panelW + gap / 2;
    const rightGapMid = x2 + panelW + gap / 2;

    const svg = `
      <svg viewBox="0 0 ${W} ${H}" role="img" preserveAspectRatio="xMidYMid meet"
           aria-label="Three microglia states: gardener (homeostatic) in the centre; two arrows diverge — left to alarmed (LPS-activated), right to disease-associated / DAM"
           style="width:100%;max-width:${W}px;height:auto;display:block;margin:0 auto">

        <!-- Panel backgrounds: Alarmed (left), Gardener (centre), DAM (right) -->
        <rect x="${x1}" y="20" width="${panelW}" height="280" rx="14"
              fill="rgba(200,122,26,0.08)" stroke="rgba(200,122,26,0.28)" stroke-width="1"/>
        <rect x="${x2}" y="20" width="${panelW}" height="280" rx="14"
              fill="${paper2}" stroke="rgba(10,37,64,0.12)" stroke-width="1"/>
        <rect x="${x3}" y="20" width="${panelW}" height="280" rx="14"
              fill="rgba(194,24,91,0.07)" stroke="rgba(194,24,91,0.28)" stroke-width="1"/>

        <!-- Top: state names -->
        <text x="${cx1}" y="50" text-anchor="middle" font-size="13" font-weight="700"
              fill="${alarm}" font-family="Inter,sans-serif">Alarmed</text>
        <text x="${cx1}" y="66" text-anchor="middle" font-size="10"
              fill="${ink3}" font-family="Inter,sans-serif">(activated · LPS)</text>

        <text x="${cx2}" y="50" text-anchor="middle" font-size="13" font-weight="700"
              fill="${gardener}" font-family="Inter,sans-serif">Gardener</text>
        <text x="${cx2}" y="66" text-anchor="middle" font-size="10"
              fill="${ink3}" font-family="Inter,sans-serif">(homeostatic)</text>

        <text x="${cx3}" y="50" text-anchor="middle" font-size="13" font-weight="700"
              fill="${focal}" font-family="Inter,sans-serif">Disease-associated</text>
        <text x="${cx3}" y="66" text-anchor="middle" font-size="10"
              fill="${focal}" font-family="Inter,sans-serif" opacity="0.8">(DAM)</text>

        <!-- Cells -->
        ${alarmedSVG (cx1, cy + 4, alarm)}
        ${gardenerSVG(cx2, cy + 4, gardener)}
        ${damSVG     (cx3, cy + 4, focal)}

        <!-- Arrows from Gardener outward to each state -->
        ${arrowLeft (leftGapMid)}
        ${arrowRight(rightGapMid)}

        <!-- Stimulus chips (sized post-render via getBBox) -->
        <g class="state-stim-chip" data-color="${alarm}">
          <rect class="chip-bg" rx="7" ry="7" fill="#ffffff"
                stroke="${alarm}" stroke-width="1" opacity="0.95"/>
          <text x="${leftGapMid}" y="${cy - 12}" text-anchor="middle"
                font-size="10" font-weight="600" fill="${alarm}"
                font-family="Inter,sans-serif">LPS</text>
        </g>
        <g class="state-stim-chip" data-color="${focal}">
          <rect class="chip-bg" rx="7" ry="7" fill="#ffffff"
                stroke="${focal}" stroke-width="1" opacity="0.95"/>
          <text x="${rightGapMid}" y="${cy - 22}" text-anchor="middle"
                font-size="10" font-weight="600" fill="${focal}"
                font-family="Inter,sans-serif">amyloid-β +</text>
          <text x="${rightGapMid}" y="${cy - 10}" text-anchor="middle"
                font-size="10" font-weight="600" fill="${focal}"
                font-family="Inter,sans-serif">apoptotic neurons</text>
        </g>

        <!-- Bottom: trait callouts -->
        <text x="${cx1}" y="248" text-anchor="middle" font-size="10"
              fill="${ink2}" font-family="Inter,sans-serif">starting to retract</text>
        <text x="${cx1}" y="262" text-anchor="middle" font-size="10"
              fill="${ink3}" font-family="Inter,sans-serif" opacity="0.8">"raising the alarm"</text>
        <text x="${cx1}" y="282" text-anchor="middle" font-size="10"
              fill="${alarm}" font-family="JetBrains Mono, monospace" font-weight="600">IRF1: rising</text>

        <text x="${cx2}" y="248" text-anchor="middle" font-size="10"
              fill="${ink2}" font-family="Inter,sans-serif">many fine branches</text>
        <text x="${cx2}" y="262" text-anchor="middle" font-size="10"
              fill="${ink3}" font-family="Inter,sans-serif" opacity="0.8">"watching the neighbourhood"</text>
        <text x="${cx2}" y="282" text-anchor="middle" font-size="10"
              fill="${gardener}" font-family="JetBrains Mono, monospace" font-weight="600">IRF1: low</text>

        <text x="${cx3}" y="248" text-anchor="middle" font-size="10"
              fill="${ink2}" font-family="Inter,sans-serif" opacity="0.9">few stubby processes</text>
        <text x="${cx3}" y="262" text-anchor="middle" font-size="10"
              fill="${focal}" font-family="Inter,sans-serif" opacity="0.85">"attacking the brain"</text>
        <text x="${cx3}" y="282" text-anchor="middle" font-size="10"
              fill="${focal}" font-family="JetBrains Mono, monospace" font-weight="700">IRF1: HIGH</text>
      </svg>`;

    container.innerHTML = svg;

    // Size each stimulus chip to fit its text bounding box.
    container.querySelectorAll('.state-stim-chip').forEach(g => {
      const rect = g.querySelector('.chip-bg');
      const texts = g.querySelectorAll('text');
      if (!rect || texts.length === 0) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      texts.forEach(t => {
        const b = t.getBBox();
        if (b.width === 0 && b.height === 0) return;
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.width);
        maxY = Math.max(maxY, b.y + b.height);
      });
      if (!isFinite(minX)) return;
      const padX = 8, padY = 3;
      rect.setAttribute('x', minX - padX);
      rect.setAttribute('y', minY - padY);
      rect.setAttribute('width', (maxX - minX) + padX * 2);
      rect.setAttribute('height', (maxY - minY) + padY * 2);
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.from(container, {
        y: 14, duration: 0.6, ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: { trigger: container, start: 'top 80%', once: true },
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('fig-microglia-state');
    if (!el) return;
    build(el);
    if (window.FLAIR?.chartUtil?.observeResize) {
      window.FLAIR.chartUtil.observeResize(el, () => build(el));
    }
  });
})();
