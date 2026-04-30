/* ============================================================
   FLAIR-AD · figures/microglia-primer.js
   Lay-friendly intro: brain → zoom → microglia among neurons
   ============================================================ */
(function () {
  'use strict';

  function build(container) {
    const P = window.FLAIR?.chartUtil?.PALETTE || {};
    const focal     = P.focal     || '#c2185b';
    const focalDeep = P.focalDeep || '#8e0f45';
    const ink       = P.ink       || '#0a2540';
    const ink2      = P.ink2      || '#425466';
    const ink3      = P.ink3      || '#6a7a8c';
    const paper     = P.paper     || '#ffffff';
    const paper2    = P.paper2    || '#f6f8fb';
    const paper3    = P.paper3    || '#eef2f7';
    const context   = P.context   || '#a0b3c7';
    const faint     = P.faint     || '#cad5e1';

    const isNarrow = container.offsetWidth < 640;
    // Wide layout: side-by-side. Narrow: brain on top, zoom panel below.
    const W = isNarrow ? 380 : 920;
    const H = isNarrow ? 500 : 360;

    const brainCX = isNarrow ? W / 2 : 150;
    const brainCY = isNarrow ? 80 : 180;
    const brainRX = isNarrow ? 64 : 92;
    const brainRY = isNarrow ? 50 : 78;

    const zoomW = isNarrow ? W - 24 : 540;
    const zoomH = isNarrow ? 260 : 280;
    const zoomX = isNarrow ? 12 : 350;
    const zoomY = isNarrow ? 210 : 40;
    const zoomCX = zoomX + zoomW / 2, zoomCY = zoomY + zoomH / 2;

    // Microglia in zoom: branched cell drawn with a few processes
    function microgliaPaths(cx, cy, somaR, col, processes) {
      let svg = '';
      processes.forEach(([angle, len, jitter, branchAt]) => {
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
          const ba = angle + 0.55, bl = len * 0.32;
          const b1x = bx + bl * Math.cos(ba), b1y = by + bl * Math.sin(ba);
          const ba2 = angle - 0.45;
          const b2x = bx + bl * 0.7 * Math.cos(ba2), b2y = by + bl * 0.7 * Math.sin(ba2);
          d += ` M${bx.toFixed(1)},${by.toFixed(1)} L${b1x.toFixed(1)},${b1y.toFixed(1)}`;
          d += ` M${bx.toFixed(1)},${by.toFixed(1)} L${b2x.toFixed(1)},${b2y.toFixed(1)}`;
        }
        svg += `<path d="${d}" stroke="${col}" stroke-width="2" fill="none"
                stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>`;
      });
      svg += `<circle cx="${cx}" cy="${cy}" r="${somaR}" fill="${col}" opacity="0.18"/>
              <circle cx="${cx}" cy="${cy}" r="${somaR}" fill="none" stroke="${col}" stroke-width="2"/>
              <ellipse cx="${cx - somaR * 0.25}" cy="${cy - somaR * 0.25}" rx="${somaR * 0.35}" ry="${somaR * 0.3}"
                       fill="${col}" opacity="0.55"/>`;
      return svg;
    }

    // Neuron (pyramidal) silhouettes — apical dendrite up, axon down
    function neuronPath(cx, cy, scale, col) {
      const s = scale;
      return `
        <g transform="translate(${cx},${cy})">
          <path d="M 0,${-30*s} L ${-12*s},${0} L ${-7*s},${5*s}
                   L ${-3*s},${22*s}  M ${-7*s},${10*s} L ${-15*s},${26*s}
                   M ${0},${5*s} L ${0},${50*s}
                   M ${12*s},${0} L ${7*s},${5*s} L ${3*s},${22*s}
                   M ${7*s},${10*s} L ${15*s},${26*s}"
                fill="none" stroke="${col}" stroke-width="${1.4 * s}"
                stroke-linecap="round" opacity="0.55"/>
          <path d="M 0,${-30*s} L ${-12*s},${0} L ${0},${5*s} L ${12*s},${0} Z"
                fill="${col}" opacity="0.18" stroke="${col}" stroke-width="${1.2 * s}"/>
          <circle cx="${-2*s}" cy="${-12*s}" r="${3*s}" fill="${col}" opacity="0.45"/>
        </g>`;
    }

    const procScale = isNarrow ? 0.65 : 1;
    const somaR = isNarrow ? 12 : 16;
    const microgliaProcesses = [
      [0,        38 * procScale, -5, 0.55],
      [0.78,     32 * procScale,  6, 0.50],
      [1.57,     28 * procScale, -4, null],
      [2.36,     34 * procScale,  7, 0.55],
      [3.14,     40 * procScale, -6, 0.60],
      [3.93,     30 * procScale,  5, null],
      [4.71,     26 * procScale, -5, 0.55],
      [5.50,     32 * procScale,  7, null],
    ];

    const svg = `
      <svg viewBox="0 0 ${W} ${H}" role="img"
           aria-label="Schematic showing the brain with a microglia surrounded by neurons"
           class="primer-fig"
           style="max-width:${W}px;margin:0 auto;overflow:visible">

        <!-- Soft background blobs for depth -->
        <defs>
          <radialGradient id="primer-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${focal}" stop-opacity="0.10"/>
            <stop offset="60%" stop-color="${focal}" stop-opacity="0.04"/>
            <stop offset="100%" stop-color="${focal}" stop-opacity="0"/>
          </radialGradient>
          <marker id="primer-arrow" viewBox="0 0 10 10" refX="8" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,1 L9,5 L0,9 Z" fill="${ink3}"/>
          </marker>
        </defs>

        <!-- ── Left: brain silhouette ── -->
        <g aria-label="Brain">
          <ellipse cx="${brainCX + 4}" cy="${brainCY + 6}" rx="${brainRX}" ry="${brainRY}"
                   fill="${ink3}" opacity="0.08"/>
          <path d="
            M ${brainCX - brainRX},${brainCY}
            C ${brainCX - brainRX},${brainCY - brainRY * 1.02}
              ${brainCX - 18},${brainCY - brainRY * 1.05}
              ${brainCX},${brainCY - brainRY * 0.95}
            C ${brainCX + 22},${brainCY - brainRY * 1.05}
              ${brainCX + brainRX},${brainCY - brainRY * 0.85}
              ${brainCX + brainRX},${brainCY}
            C ${brainCX + brainRX},${brainCY + brainRY * 0.9}
              ${brainCX + 28},${brainCY + brainRY * 1.02}
              ${brainCX},${brainCY + brainRY}
            C ${brainCX - 30},${brainCY + brainRY * 1.02}
              ${brainCX - brainRX},${brainCY + brainRY * 0.9}
              ${brainCX - brainRX},${brainCY}
            Z"
            fill="${paper}" stroke="${ink2}" stroke-width="1.8" stroke-linejoin="round"/>
          <!-- central fissure -->
          <path d="M ${brainCX},${brainCY - brainRY * 0.92}
                   C ${brainCX + 3},${brainCY - 30} ${brainCX - 3},${brainCY + 18} ${brainCX},${brainCY + brainRY * 0.96}"
                fill="none" stroke="${ink2}" stroke-width="1.2" opacity="0.6"/>
          <!-- gyri ripples -->
          <path d="M ${brainCX - 60},${brainCY - 30}
                   C ${brainCX - 50},${brainCY - 36} ${brainCX - 38},${brainCY - 22} ${brainCX - 28},${brainCY - 30}"
                fill="none" stroke="${ink2}" stroke-width="1" opacity="0.4"/>
          <path d="M ${brainCX - 60},${brainCY + 4}
                   C ${brainCX - 48},${brainCY - 4} ${brainCX - 36},${brainCY + 14} ${brainCX - 24},${brainCY + 4}"
                fill="none" stroke="${ink2}" stroke-width="1" opacity="0.4"/>
          <path d="M ${brainCX - 60},${brainCY + 36}
                   C ${brainCX - 48},${brainCY + 28} ${brainCX - 36},${brainCY + 46} ${brainCX - 24},${brainCY + 38}"
                fill="none" stroke="${ink2}" stroke-width="1" opacity="0.4"/>
          <path d="M ${brainCX + 28},${brainCY - 30}
                   C ${brainCX + 38},${brainCY - 36} ${brainCX + 50},${brainCY - 22} ${brainCX + 60},${brainCY - 30}"
                fill="none" stroke="${ink2}" stroke-width="1" opacity="0.4"/>
          <path d="M ${brainCX + 24},${brainCY + 4}
                   C ${brainCX + 36},${brainCY - 4} ${brainCX + 48},${brainCY + 14} ${brainCX + 60},${brainCY + 4}"
                fill="none" stroke="${ink2}" stroke-width="1" opacity="0.4"/>
          <path d="M ${brainCX + 24},${brainCY + 36}
                   C ${brainCX + 36},${brainCY + 28} ${brainCX + 48},${brainCY + 46} ${brainCX + 60},${brainCY + 38}"
                fill="none" stroke="${ink2}" stroke-width="1" opacity="0.4"/>
          <!-- focus dot inside brain showing where we zoom -->
          <circle cx="${brainCX + 24}" cy="${brainCY - 6}" r="6" fill="${focal}" opacity="0.95"/>
          <circle cx="${brainCX + 24}" cy="${brainCY - 6}" r="11" fill="none"
                  stroke="${focal}" stroke-width="1.5" opacity="0.7"/>
          <circle cx="${brainCX + 24}" cy="${brainCY - 6}" r="18" fill="none"
                  stroke="${focal}" stroke-width="1" opacity="0.35"/>
          <text x="${brainCX}" y="${brainCY + brainRY + 22}" text-anchor="middle"
                font-size="13" font-weight="700" fill="${ink}"
                font-family="Inter,sans-serif">Your brain</text>
          <text x="${brainCX}" y="${brainCY + brainRY + 38}" text-anchor="middle"
                font-size="10" fill="${ink3}" font-family="Inter,sans-serif">~86 billion cells</text>
        </g>

        <!-- ── Zoom funnel from focus dot to zoom panel ── -->
        ${isNarrow ? `
          <line x1="${brainCX}" y1="${brainCY + brainRY + 4}" x2="${zoomCX}" y2="${zoomY - 4}"
                stroke="${focal}" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.55"/>
        ` : `
          <path d="M ${brainCX + 30},${brainCY - 15}
                   L ${zoomX + 4},${zoomY + 10}
                   M ${brainCX + 30},${brainCY + 3}
                   L ${zoomX + 4},${zoomY + zoomH - 10}"
                stroke="${focal}" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.55" fill="none"/>
        `}

        <!-- ── Right: zoom panel ── -->
        <rect x="${zoomX}" y="${zoomY}" width="${zoomW}" height="${zoomH}" rx="14"
              fill="${paper}" stroke="${ink3}" stroke-width="1.2" opacity="0.95"/>
        <rect x="${zoomX}" y="${zoomY}" width="${zoomW}" height="${zoomH}" rx="14"
              fill="url(#primer-glow)"/>

        <!-- corner marks suggesting zoom -->
        <path d="M ${zoomX + 6},${zoomY + 18} L ${zoomX + 6},${zoomY + 6} L ${zoomX + 18},${zoomY + 6}"
              fill="none" stroke="${ink3}" stroke-width="1" opacity="0.6"/>
        <path d="M ${zoomX + zoomW - 6},${zoomY + 18} L ${zoomX + zoomW - 6},${zoomY + 6} L ${zoomX + zoomW - 18},${zoomY + 6}"
              fill="none" stroke="${ink3}" stroke-width="1" opacity="0.6"/>
        <path d="M ${zoomX + 6},${zoomY + zoomH - 18} L ${zoomX + 6},${zoomY + zoomH - 6} L ${zoomX + 18},${zoomY + zoomH - 6}"
              fill="none" stroke="${ink3}" stroke-width="1" opacity="0.6"/>
        <path d="M ${zoomX + zoomW - 6},${zoomY + zoomH - 18} L ${zoomX + zoomW - 6},${zoomY + zoomH - 6} L ${zoomX + zoomW - 18},${zoomY + zoomH - 6}"
              fill="none" stroke="${ink3}" stroke-width="1" opacity="0.6"/>

        <!-- Neurons scattered (faint, context), positions proportional -->
        ${[
          [0.16, 0.30, 1.05],
          [0.32, 0.22, 0.85],
          [0.85, 0.27, 1.00],
          [0.76, 0.72, 0.90],
          [0.18, 0.78, 1.10],
          [0.37, 0.82, 0.85],
          [0.94, 0.72, 0.85],
        ].map(([fx, fy, sc]) =>
          neuronPath(zoomX + fx * zoomW, zoomY + fy * zoomH, isNarrow ? sc * 0.78 : sc, context)
        ).join('')}

        <!-- Microglia (focal) in centre of zoom -->
        ${microgliaPaths(zoomCX, zoomCY, somaR, focal, microgliaProcesses)}

        <!-- Microglia call-out badge -->
        ${(() => {
          const cw = isNarrow ? 92 : 106;
          const ch = isNarrow ? 30 : 34;
          const off = isNarrow ? { dx: 18, dy: -22, lx: 50, ly: -42, rx: 44, ry: -52 }
                              : { dx: 22, dy: -22, lx: 70, ly: -60, rx: 64, ry: -78 };
          const tx = zoomCX + off.rx + cw / 2;
          return `
            <line x1="${zoomCX + off.dx}" y1="${zoomCY + off.dy}" x2="${zoomCX + off.lx}" y2="${zoomCY + off.ly}"
                  stroke="${focal}" stroke-width="1.4" opacity="0.8"/>
            <rect x="${zoomCX + off.rx}" y="${zoomCY + off.ry}" width="${cw}" height="${ch}" rx="8"
                  fill="${paper}" stroke="${focal}" stroke-width="1.4"/>
            <text x="${tx}" y="${zoomCY + off.ry + 14}" text-anchor="middle"
                  font-size="${isNarrow ? 11 : 12}" font-weight="700" fill="${focal}"
                  font-family="Inter,sans-serif">Microglia</text>
            <text x="${tx}" y="${zoomCY + off.ry + 26}" text-anchor="middle"
                  font-size="${isNarrow ? 8 : 9}" fill="${focalDeep}" font-family="Inter,sans-serif">brain immune cell</text>
          `;
        })()}

        <!-- Neuron call-out badge -->
        ${(() => {
          const cw = isNarrow ? 84 : 100;
          const ch = isNarrow ? 26 : 28;
          const bx = zoomX + (isNarrow ? 12 : 32);
          const by = zoomY + (isNarrow ? 8 : 12);
          const tx = bx + cw / 2;
          return `
            <line x1="${zoomX + zoomW * 0.32}" y1="${zoomY + zoomH * 0.30}" x2="${tx}" y2="${by + ch}"
                  stroke="${ink3}" stroke-width="1" opacity="0.55"/>
            <rect x="${bx}" y="${by}" width="${cw}" height="${ch}" rx="7"
                  fill="${paper}" stroke="${ink3}" stroke-width="1.2"/>
            <text x="${tx}" y="${by + 13}" text-anchor="middle"
                  font-size="${isNarrow ? 10 : 11}" font-weight="600" fill="${ink2}"
                  font-family="Inter,sans-serif">Neurons</text>
            <text x="${tx}" y="${by + 22}" text-anchor="middle"
                  font-size="${isNarrow ? 8 : 8.5}" fill="${ink3}" font-family="Inter,sans-serif">~9 in 10 cells</text>
          `;
        })()}

        <!-- Tag: "1 in 10" stat -->
        ${(() => {
          const tw = isNarrow ? 102 : 118;
          const th = isNarrow ? 26 : 28;
          const tx = zoomX + zoomW - tw - 10;
          const ty = zoomY + zoomH - th - 10;
          return `
            <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${th / 2}"
                  fill="${focal}" opacity="0.95"/>
            <text x="${tx + tw / 2}" y="${ty + th / 2 + 4}" text-anchor="middle"
                  font-size="${isNarrow ? 10 : 11}" font-weight="700" fill="${paper}"
                  font-family="Inter,sans-serif">1 in 10 = microglia</text>
          `;
        })()}

        <!-- Caption ribbon under zoom panel -->
        <text x="${W / 2}" y="${H - 14}" text-anchor="middle"
              font-size="${isNarrow ? 10 : 11}" fill="${ink2}" font-family="Inter,sans-serif">
          ${isNarrow
            ? 'Microglia patrol the spaces between neurons.'
            : 'Microglia patrol the spaces between neurons. They sense damage, infection, and stress.'}
        </text>
      </svg>`;

    container.innerHTML = svg;

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.from(container, {
        y: 18, duration: 0.7, ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: { trigger: container, start: 'top 85%', once: true },
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('fig-microglia-primer');
    if (!el) return;
    build(el);
    if (window.FLAIR?.chartUtil?.observeResize) {
      window.FLAIR.chartUtil.observeResize(el, () => build(el));
    }
  });
})();
