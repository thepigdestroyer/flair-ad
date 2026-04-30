/* ============================================================
   FLAIR-AD · figures/causal-chain.js
   "From DNA letter to disease risk" — five-step explainer
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

    const isNarrow = container.offsetWidth < 720;
    const cols = isNarrow ? 1 : 5;
    const stepGap = isNarrow ? 28 : 12;
    const cardH = isNarrow ? 170 : 200;
    const captionH = isNarrow ? 56 : 50;
    const W = isNarrow ? 360 : 980;
    const stepW = isNarrow ? W - 40 : (W - 60) / 5;
    const top = 24;
    const H = isNarrow
      ? top + 5 * (cardH + captionH) + 4 * stepGap + 16
      : 280;

    // ── Step painters (SVG groups), drawn into stepW × cardH boxes ──
    function svgSnp(x, y, w, h) {
      const letters = ['A','T','G','C','A','T','C','G'];
      const pairs   = ['T','A','C','G','T','A','G','C']; // complementary strand
      const focalIdx = 4;
      const wasLetter = letters[focalIdx]; // 'A'
      const newLetter = 'G';
      let s = '';

      // ── Helix region (top of card) ──
      const helixT = y + 14;
      const helixB = y + 64;
      const helixCY = (helixT + helixB) / 2;
      const dnaL = x + 14;
      const dnaR = x + w - 14;
      const dnaW = dnaR - dnaL;

      // Two strands as offset sinusoids that cross over at evenly spaced nodes.
      // Sample N points and build a smooth path on each.
      const N = 60;
      const periods = 2.5; // number of full crossover cycles across the strand
      const amp = (helixB - helixT) / 2;
      function strandPath(phase) {
        const pts = [];
        for (let i = 0; i <= N; i++) {
          const t = i / N;
          const px = dnaL + dnaW * t;
          const py = helixCY + Math.sin(t * periods * 2 * Math.PI + phase) * amp;
          pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
        }
        return pts.join(' ');
      }
      // Front strand (solid, darker)
      s += `<path d="${strandPath(0)}"
                  fill="none" stroke="${ink2}" stroke-width="2"
                  stroke-linecap="round" opacity="0.85"/>`;
      // Back strand (dashed-out behind)
      s += `<path d="${strandPath(Math.PI)}"
                  fill="none" stroke="${ink3}" stroke-width="2"
                  stroke-linecap="round" opacity="0.55"/>`;

      // Base-pair rungs at evenly spaced intervals
      const rungN = 14;
      for (let i = 0; i < rungN; i++) {
        const t = (i + 0.5) / rungN;
        const px = dnaL + dnaW * t;
        const yA = helixCY + Math.sin(t * periods * 2 * Math.PI) * amp;
        const yB = helixCY + Math.sin(t * periods * 2 * Math.PI + Math.PI) * amp;
        // Only draw rungs where strands are reasonably separated
        if (Math.abs(yA - yB) < 6) continue;
        // Highlight the rung nearest the focal letter
        const focalT = (focalIdx + 0.5) / letters.length;
        const isFocalRung = Math.abs(t - focalT) < (1 / rungN) / 1.6;
        s += `<line x1="${px.toFixed(1)}" y1="${yA.toFixed(1)}"
                    x2="${px.toFixed(1)}" y2="${yB.toFixed(1)}"
                    stroke="${isFocalRung ? focal : ink3}"
                    stroke-width="${isFocalRung ? 1.4 : 0.9}"
                    opacity="${isFocalRung ? 0.85 : 0.45}"/>`;
      }

      // Focal SNP marker (pink dot) on the strand at the focal position
      const focalT = (focalIdx + 0.5) / letters.length;
      const focalDnaX = dnaL + dnaW * focalT;
      const focalDnaY = helixCY + Math.sin(focalT * periods * 2 * Math.PI) * amp;
      s += `<circle cx="${focalDnaX.toFixed(1)}" cy="${focalDnaY.toFixed(1)}" r="6"
                    fill="${focal}" opacity="0.25"/>`;
      s += `<circle cx="${focalDnaX.toFixed(1)}" cy="${focalDnaY.toFixed(1)}" r="3"
                    fill="${focal}"/>`;

      // ── Letter strip (bottom of card, with complementary pair) ──
      const total = letters.length;
      const innerW = w - 24;
      const lW = Math.min(20, innerW / total - 2);
      const stripStartX = x + (w - (lW * total + (total - 1) * 4)) / 2;
      const stripCY = y + h * 0.74;
      // Center between top row and bottom row
      const rowGap = 4;

      // ── Zoom-in cone: dashed lines from the focal SNP on the helix
      // down to the focal letter box, framing it like a lens callout.
      const focalLx = stripStartX + focalIdx * (lW + 4);
      const focalLxC = focalLx + lW / 2;
      const stripTopY = stripCY - 12 - 12; // top edge of upper letter row
      // little focus marker on helix (a small bracket)
      s += `<g stroke="${focal}" stroke-width="1.2" fill="none" opacity="0.85">
              <line x1="${(focalDnaX - 7).toFixed(1)}" y1="${(focalDnaY + 9).toFixed(1)}"
                    x2="${(focalDnaX - 7).toFixed(1)}" y2="${(focalDnaY + 14).toFixed(1)}"/>
              <line x1="${(focalDnaX + 7).toFixed(1)}" y1="${(focalDnaY + 9).toFixed(1)}"
                    x2="${(focalDnaX + 7).toFixed(1)}" y2="${(focalDnaY + 14).toFixed(1)}"/>
              <line x1="${(focalDnaX - 7).toFixed(1)}" y1="${(focalDnaY + 14).toFixed(1)}"
                    x2="${(focalDnaX + 7).toFixed(1)}" y2="${(focalDnaY + 14).toFixed(1)}"/>
            </g>`;
      // dashed cone lines down to letter box
      s += `<line x1="${(focalDnaX - 7).toFixed(1)}" y1="${(focalDnaY + 14).toFixed(1)}"
                  x2="${(focalLx - 1).toFixed(1)}" y2="${stripTopY - 2}"
                  stroke="${focal}" stroke-width="1" stroke-dasharray="3,2" opacity="0.7"/>`;
      s += `<line x1="${(focalDnaX + 7).toFixed(1)}" y1="${(focalDnaY + 14).toFixed(1)}"
                  x2="${(focalLx + lW + 1).toFixed(1)}" y2="${stripTopY - 2}"
                  stroke="${focal}" stroke-width="1" stroke-dasharray="3,2" opacity="0.7"/>`;

      // Top row letters (the strand we read)
      letters.forEach((ch, i) => {
        const lx = stripStartX + i * (lW + 4);
        const isFocal = i === focalIdx;
        const showCh = isFocal ? newLetter : ch;
        s += `<rect x="${lx}" y="${stripCY - 24}" width="${lW}" height="22" rx="3"
                    fill="${isFocal ? focal : paper}"
                    stroke="${isFocal ? focal : ink3}" stroke-width="${isFocal ? 1.5 : 1}"/>`;
        s += `<text x="${lx + lW / 2}" y="${stripCY - 8}" text-anchor="middle"
                    font-size="${Math.min(13, lW * 0.7)}" font-weight="700"
                    fill="${isFocal ? paper : ink2}"
                    font-family="JetBrains Mono, monospace">${showCh}</text>`;
      });
      // Pair rungs between rows
      letters.forEach((_, i) => {
        const lx = stripStartX + i * (lW + 4) + lW / 2;
        s += `<line x1="${lx}" y1="${stripCY - 2}" x2="${lx}" y2="${stripCY + rowGap}"
                    stroke="${ink3}" stroke-width="0.8" opacity="0.4"/>`;
      });
      // Bottom row letters (complementary strand, faded)
      pairs.forEach((ch, i) => {
        const lx = stripStartX + i * (lW + 4);
        const isFocal = i === focalIdx;
        s += `<rect x="${lx}" y="${stripCY + rowGap}" width="${lW}" height="18" rx="3"
                    fill="${paper2}" stroke="${ink3}" stroke-width="1" opacity="0.85"/>`;
        s += `<text x="${lx + lW / 2}" y="${stripCY + rowGap + 13}" text-anchor="middle"
                    font-size="${Math.min(11, lW * 0.6)}" font-weight="500"
                    fill="${ink3}" font-family="JetBrains Mono, monospace">${isFocal ? 'C' : ch}</text>`;
      });

      // SNP annotation: "A → G" arrow above focal box
      s += `<text x="${focalLxC}" y="${stripCY - 30}" text-anchor="middle"
                  font-size="9" font-weight="700" fill="${focal}"
                  font-family="Inter,sans-serif">SNP</text>`;
      // "was A • now G" line
      s += `<text x="${focalLxC}" y="${stripCY + rowGap + 32}" text-anchor="middle"
                  font-size="10" font-weight="700" fill="${focalDeep}"
                  font-family="JetBrains Mono, monospace">${wasLetter}&#x2009;&#x2192;&#x2009;${newLetter}</text>`;

      return s;
    }

    function svgEnhancer(x, y, w, h) {
      const cy = y + h * 0.5;
      let s = '';
      // chromosome track
      s += `<rect x="${x + 16}" y="${cy + 4}" width="${w - 32}" height="6" rx="3"
                  fill="${ink3}" opacity="0.18"/>`;
      // tick marks for "DNA elements"
      [0.15, 0.34, 0.5, 0.68, 0.85].forEach(t => {
        const tx = x + 16 + (w - 32) * t;
        s += `<line x1="${tx}" y1="${cy + 2}" x2="${tx}" y2="${cy + 12}"
                    stroke="${ink3}" stroke-width="1" opacity="0.4"/>`;
      });
      // enhancer block (focal) — sits to the LEFT of centre so the looping
      // arc has room to sweep over to the gene without overlapping any label
      const ex = x + 22;
      const eW = 36;
      s += `<rect x="${ex}" y="${cy - 12}" width="${eW}" height="22" rx="5"
                  fill="${focal}" opacity="0.22"
                  stroke="${focal}" stroke-width="1.4"/>`;
      s += `<text x="${ex + eW / 2}" y="${cy + 2}" text-anchor="middle"
                  font-size="9" font-weight="700" fill="${focalDeep}"
                  font-family="JetBrains Mono, monospace">enh</text>`;
      // gene at the right
      const gx = x + w - 50;
      s += `<polygon points="${gx},${cy - 14} ${gx + 28},${cy - 14}
                            ${gx + 34},${cy} ${gx + 28},${cy + 14}
                            ${gx},${cy + 14}"
                    fill="${ink2}" opacity="0.85"/>`;
      s += `<text x="${gx + 14}" y="${cy + 4}" text-anchor="middle"
                  font-size="9" font-weight="700" fill="${paper}"
                  font-family="Inter,sans-serif">gene</text>`;
      // looping connection enhancer → gene (stays high above the labels)
      const arcStartX = ex + eW;
      const arcEndX = gx + 4;
      const arcMidX = (arcStartX + arcEndX) / 2;
      s += `<path d="M ${arcStartX},${cy - 12}
                    Q ${arcMidX},${cy - 50}
                    ${arcEndX},${cy - 14}"
                  fill="none" stroke="${focal}" stroke-width="1.5"
                  stroke-dasharray="4,3" opacity="0.85"/>`;
      // arrow tip on gene end of arc
      s += `<polygon points="${arcEndX - 4},${cy - 18} ${arcEndX + 1},${cy - 12} ${arcEndX - 5},${cy - 11}"
                    fill="${focal}" opacity="0.85"/>`;
      // dimmer-switch label BELOW the enhancer so it never overlaps the arc
      s += `<line x1="${ex + eW / 2}" y1="${cy + 12}" x2="${ex + eW / 2}" y2="${cy + 22}"
                  stroke="${focal}" stroke-width="1" opacity="0.7"/>`;
      s += `<text x="${ex + eW / 2}" y="${cy + 32}" text-anchor="middle"
                  font-size="9" fill="${focal}" font-family="Inter,sans-serif" font-weight="600">dimmer switch</text>`;
      return s;
    }

    function svgExpression(x, y, w, h) {
      const cy = y + h * 0.55;
      let s = '';
      // baseline
      s += `<line x1="${x + 16}" y1="${cy + 18}" x2="${x + w - 16}" y2="${cy + 18}"
                  stroke="${ink3}" stroke-width="1" opacity="0.45"/>`;
      // bars: low (gray) → high (focal)
      const bars = [
        { v: 0.30, col: ink3, op: 0.4, label: 'before' },
        { v: 0.85, col: focal, op: 0.95, label: 'after' },
      ];
      const innerW = w - 36;
      const bW = innerW / 2 - 16;
      bars.forEach((b, i) => {
        const bx = x + 18 + i * (bW + 16);
        const bh = (h * 0.55) * b.v;
        s += `<rect x="${bx}" y="${cy + 18 - bh}" width="${bW}" height="${bh}" rx="3"
                    fill="${b.col}" opacity="${b.op}"/>`;
        s += `<text x="${bx + bW / 2}" y="${cy + 32}" text-anchor="middle"
                    font-size="9" fill="${ink3}" font-family="Inter,sans-serif">${b.label}</text>`;
      });
      // arrow up showing increase
      const ax = x + 18 + bW + 8;
      s += `<line x1="${ax}" y1="${cy + 8}" x2="${ax}" y2="${cy - 18}"
                  stroke="${focal}" stroke-width="2" stroke-linecap="round"/>`;
      s += `<polyline points="${ax - 5},${cy - 13} ${ax},${cy - 22} ${ax + 5},${cy - 13}"
                  fill="none" stroke="${focal}" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>`;
      // axis label
      s += `<text x="${x + w / 2}" y="${y + 24}" text-anchor="middle"
                  font-size="9" font-weight="600" fill="${ink2}"
                  font-family="Inter,sans-serif">gene activity</text>`;
      return s;
    }

    function svgState(x, y, w, h) {
      const cy = y + h * 0.5;
      let s = '';
      // Two cells: branched (faint) → ameboid (focal), with arrow
      const lcx = x + w * 0.28, rcx = x + w * 0.72;
      const r1 = 11, r2 = 14;
      // branched cell (small)
      const procAngles1 = [0, 0.7, 1.4, 2.1, 2.8, 3.5, 4.2, 4.9];
      procAngles1.forEach(a => {
        const sx = lcx + Math.cos(a) * r1, sy = cy + Math.sin(a) * r1;
        const ex = lcx + Math.cos(a) * (r1 + 14), ey = cy + Math.sin(a) * (r1 + 14);
        s += `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}"
                    stroke="${ink3}" stroke-width="1.3" opacity="0.7" stroke-linecap="round"/>`;
      });
      s += `<circle cx="${lcx}" cy="${cy}" r="${r1}" fill="${ink3}" opacity="0.2"/>`;
      s += `<circle cx="${lcx}" cy="${cy}" r="${r1}" fill="none" stroke="${ink3}" stroke-width="1.2"/>`;
      // ameboid cell
      const procAngles2 = [0.3, 1.8, 3.2, 4.6];
      procAngles2.forEach(a => {
        const sx = rcx + Math.cos(a) * r2, sy = cy + Math.sin(a) * r2;
        const ex = rcx + Math.cos(a) * (r2 + 8), ey = cy + Math.sin(a) * (r2 + 8);
        s += `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}"
                    stroke="${focal}" stroke-width="2.5" opacity="0.85" stroke-linecap="round"/>`;
      });
      s += `<circle cx="${rcx}" cy="${cy}" r="${r2}" fill="${focal}" opacity="0.18"/>`;
      s += `<circle cx="${rcx}" cy="${cy}" r="${r2}" fill="none" stroke="${focal}" stroke-width="2"/>`;
      // arrow
      s += `<line x1="${lcx + r1 + 16}" y1="${cy}" x2="${rcx - r2 - 14}" y2="${cy}"
                  stroke="${focal}" stroke-width="1.4" stroke-dasharray="4,3" opacity="0.8"/>`;
      s += `<polygon points="${rcx - r2 - 14},${cy - 4} ${rcx - r2 - 6},${cy} ${rcx - r2 - 14},${cy + 4}"
                    fill="${focal}"/>`;
      // labels under cells
      s += `<text x="${lcx}" y="${cy + r1 + 26}" text-anchor="middle"
                  font-size="9" fill="${ink3}" font-family="Inter,sans-serif">resting</text>`;
      s += `<text x="${rcx}" y="${cy + r2 + 26}" text-anchor="middle"
                  font-size="9" font-weight="700" fill="${focal}"
                  font-family="Inter,sans-serif">activated</text>`;
      return s;
    }

    function svgRisk(x, y, w, h) {
      const cy = y + h * 0.5;
      let s = '';
      // gauge dial — 180° arc
      const cxg = x + w / 2, cyg = cy + 20;
      const rg = Math.min(50, w * 0.35);
      const arcStart = (deg) => {
        const a = (180 - deg) * Math.PI / 180;
        return [cxg + rg * Math.cos(a), cyg - rg * Math.sin(a)];
      };
      const [sx, sy] = arcStart(0);
      const [ex, ey] = arcStart(180);
      s += `<path d="M ${sx},${sy} A ${rg} ${rg} 0 0 1 ${ex},${ey}"
                  fill="none" stroke="${ink3}" stroke-width="6" opacity="0.18"
                  stroke-linecap="round"/>`;
      // colored arc (risk progression)
      s += `<path d="M ${sx},${sy} A ${rg} ${rg} 0 0 1 ${ex},${ey}"
                  fill="none" stroke="${focal}" stroke-width="6"
                  stroke-dasharray="${rg * Math.PI * 0.78} ${rg * Math.PI}"
                  stroke-linecap="round"/>`;
      // needle ~70%
      const needleA = (180 - 180 * 0.78) * Math.PI / 180;
      const nx = cxg + (rg - 4) * Math.cos(needleA);
      const ny = cyg - (rg - 4) * Math.sin(needleA);
      s += `<line x1="${cxg}" y1="${cyg}" x2="${nx}" y2="${ny}"
                  stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`;
      s += `<circle cx="${cxg}" cy="${cyg}" r="4" fill="${ink}"/>`;
      // gauge labels
      s += `<text x="${sx - 4}" y="${sy + 14}" text-anchor="middle"
                  font-size="9" fill="${ink3}" font-family="Inter,sans-serif">low</text>`;
      s += `<text x="${ex + 4}" y="${ey + 14}" text-anchor="middle"
                  font-size="9" fill="${focal}" font-family="Inter,sans-serif">high</text>`;
      // big label above gauge
      s += `<text x="${cxg}" y="${cyg - rg - 8}" text-anchor="middle"
                  font-size="11" font-weight="700" fill="${focalDeep}"
                  font-family="Inter,sans-serif">Alzheimer's risk</text>`;
      return s;
    }

    const STEPS = [
      {
        title: '1. A DNA variant',
        sub: 'one letter swap',
        body: 'A common single-letter change &mdash; an SNP &mdash; sits in your genome.',
        paint: svgSnp,
      },
      {
        title: '2. Lands in a switch',
        sub: 'enhancer, not gene',
        body: 'It hits a regulatory <em>enhancer</em>, the dimmer that tunes a nearby gene.',
        paint: svgEnhancer,
      },
      {
        title: '3. Tunes the gene',
        sub: 'expression shifts',
        body: 'The gene speaks louder &mdash; or quieter &mdash; in the cells that read this enhancer.',
        paint: svgExpression,
      },
      {
        title: '4. Shifts microglia',
        sub: 'resting → activated',
        body: 'Hundreds of these tweaks push microglia into the disease-associated state.',
        paint: svgState,
      },
      {
        title: '5. Tilts the dial',
        sub: 'lifetime risk',
        body: 'The cumulative tilt of those switches is what we measure as inherited risk.',
        paint: svgRisk,
      },
    ];

    let panels = '';
    let arrows = '';
    if (isNarrow) {
      // Vertical stack
      const startX = 20;
      STEPS.forEach((step, i) => {
        const y = top + i * (cardH + captionH + stepGap);
        panels += `
          <g class="causal-step" data-i="${i}">
            <rect x="${startX}" y="${y}" width="${stepW}" height="${cardH}" rx="12"
                  fill="${paper}" stroke="${ink3}" stroke-width="1" opacity="0.96"/>
            ${step.paint(startX, y, stepW, cardH)}
            <text x="${startX + stepW / 2}" y="${y + cardH + 22}" text-anchor="middle"
                  font-size="13" font-weight="700" fill="${ink}"
                  font-family="Inter,sans-serif">${step.title}</text>
            <text x="${startX + stepW / 2}" y="${y + cardH + 38}" text-anchor="middle"
                  font-size="10" fill="${focalDeep}"
                  font-family="JetBrains Mono, monospace">${step.sub}</text>
          </g>`;
        if (i < STEPS.length - 1) {
          const ay0 = y + cardH + captionH;
          const ay1 = ay0 + stepGap - 4;
          const ax = startX + stepW / 2;
          arrows += `
            <g>
              <line x1="${ax}" y1="${ay0}" x2="${ax}" y2="${ay1}"
                    stroke="${focal}" stroke-width="1.8" stroke-linecap="round"/>
              <polygon points="${ax - 5},${ay1 - 4} ${ax},${ay1 + 3} ${ax + 5},${ay1 - 4}"
                       fill="${focal}"/>
            </g>`;
        }
      });
    } else {
      const totalW = stepW * STEPS.length + stepGap * (STEPS.length - 1);
      const startX = (W - totalW) / 2;
      STEPS.forEach((step, i) => {
        const x = startX + i * (stepW + stepGap);
        panels += `
          <g class="causal-step" data-i="${i}">
            <rect x="${x}" y="${top}" width="${stepW}" height="${cardH}" rx="12"
                  fill="${paper}" stroke="${ink3}" stroke-width="1" opacity="0.96"/>
            ${step.paint(x, top, stepW, cardH)}
            <text x="${x + stepW / 2}" y="${top + cardH + 22}" text-anchor="middle"
                  font-size="12" font-weight="700" fill="${ink}"
                  font-family="Inter,sans-serif">${step.title}</text>
            <text x="${x + stepW / 2}" y="${top + cardH + 38}" text-anchor="middle"
                  font-size="10" fill="${focalDeep}"
                  font-family="JetBrains Mono, monospace">${step.sub}</text>
          </g>`;
        if (i < STEPS.length - 1) {
          const ax = x + stepW + 1;
          const ay = top + cardH / 2;
          arrows += `
            <g>
              <line x1="${ax}" y1="${ay}" x2="${ax + stepGap - 2}" y2="${ay}"
                    stroke="${focal}" stroke-width="1.6"/>
              <polygon points="${ax + stepGap - 6},${ay - 4} ${ax + stepGap - 1},${ay} ${ax + stepGap - 6},${ay + 4}"
                       fill="${focal}"/>
            </g>`;
        }
      });
    }

    const totalH = isNarrow ? H : H + 60;
    const svg = `
      <svg viewBox="0 0 ${W} ${totalH}" role="img"
           aria-label="Causal chain: SNP variant alters an enhancer, changes gene expression, shifts microglial state, raises Alzheimer risk"
           style="width:100%;max-width:${W}px;display:block;margin:0 auto;overflow:visible">
        ${panels}
        ${arrows}
      </svg>`;

    container.innerHTML = `<div class="causal-wrap">${svg}</div>`;

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.registerPlugin(ScrollTrigger);
      const cards = container.querySelectorAll('.causal-step');
      gsap.from(cards, {
        y: 16, duration: 0.55, ease: 'power2.out',
        stagger: 0.09,
        immediateRender: false,
        scrollTrigger: { trigger: container, start: 'top 82%', once: true },
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('fig-causal-chain');
    if (!el) return;
    build(el);
    if (window.FLAIR?.chartUtil?.observeResize) {
      window.FLAIR.chartUtil.observeResize(el, () => build(el));
    }
  });
})();
