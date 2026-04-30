/* ============================================================
   FLAIR-AD · figures/tipseq-flow.js
   Four-step TIP-seq workflow diagram.
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
    const lab       = '#3a6f7f';   // teal — same hue as lab pipeline elsewhere
    const labDeep   = '#1f4a57';

    const isNarrow = container.offsetWidth < 760;
    const cardW = isNarrow ? Math.min(320, container.offsetWidth - 56) : 175;
    const cardH = isNarrow ? 200 : 200;
    const gapX  = isNarrow ? 0 : 10;
    const gapY  = isNarrow ? 28 : 0;
    const N = 5;
    const W = isNarrow ? cardW + 40 : N * cardW + (N - 1) * gapX + 24;
    const titleH = 48;
    const captionH = 56;
    const H = isNarrow
      ? 16 + N * (titleH + cardH + captionH) + (N - 1) * gapY + 16
      : titleH + cardH + captionH + 24;

    /* ── Step painters ─────────────────────────────────────── */
    function helix(x, y, w, h, opts = {}) {
      const cy = y + h * 0.5;
      const stroke = opts.stroke || ink3;
      const op = opts.op ?? 0.55;
      let s = '';
      s += `<path d="M ${x + 8},${cy - 12}
                    C ${x + w * 0.25},${cy - 22}
                      ${x + w * 0.5},${cy - 2}
                      ${x + w * 0.75},${cy - 12}
                    C ${x + w * 0.85},${cy - 18}
                      ${x + w - 8},${cy - 12}
                      ${x + w - 8},${cy - 12}"
              fill="none" stroke="${stroke}" stroke-width="1.4" opacity="${op}"/>`;
      s += `<path d="M ${x + 8},${cy + 6}
                    C ${x + w * 0.25},${cy + 16}
                      ${x + w * 0.5},${cy - 4}
                      ${x + w * 0.75},${cy + 6}
                    C ${x + w * 0.85},${cy + 12}
                      ${x + w - 8},${cy + 6}
                      ${x + w - 8},${cy + 6}"
              fill="none" stroke="${stroke}" stroke-width="1.4" opacity="${op}"/>`;
      // base-pair ticks
      const span = w - 16;
      for (let i = 1; i < 8; i++) {
        const tx = x + 8 + (span / 8) * i;
        s += `<line x1="${tx}" y1="${cy - 9}" x2="${tx}" y2="${cy + 3}"
                    stroke="${stroke}" stroke-width="0.8" opacity="${op * 0.55}"/>`;
      }
      return s;
    }

    function antibody(cx, cy, col, scale = 1) {
      const k = scale;
      let s = '';
      s += `<g transform="translate(${cx},${cy})">
              <line x1="0" y1="${10 * k}" x2="0" y2="${24 * k}" stroke="${col}" stroke-width="${2.4 * k}" stroke-linecap="round"/>
              <line x1="0" y1="${10 * k}" x2="${-12 * k}" y2="${-6 * k}" stroke="${col}" stroke-width="${2.4 * k}" stroke-linecap="round"/>
              <line x1="0" y1="${10 * k}" x2="${12 * k}"  y2="${-6 * k}" stroke="${col}" stroke-width="${2.4 * k}" stroke-linecap="round"/>
              <circle cx="${-12 * k}" cy="${-6 * k}" r="${4 * k}" fill="${col}"/>
              <circle cx="${12 * k}"  cy="${-6 * k}" r="${4 * k}" fill="${col}"/>
            </g>`;
      return s;
    }

    function step1(x, y, w, h) {
      // "Antibody finds the protein on DNA"
      let s = '';
      s += helix(x + 8, y, w - 16, h);
      const cy = y + h * 0.5;
      // Protein blob
      const px = x + w * 0.5, py = cy - 24;
      s += `<ellipse cx="${px}" cy="${py}" rx="22" ry="15" fill="${lab}" opacity="0.9"/>`;
      s += `<text x="${px}" y="${py + 4}" text-anchor="middle" font-size="10"
                  font-weight="700" fill="${paper}" font-family="Inter,sans-serif">TF</text>`;
      // Antibody approaching from above
      s += antibody(px, py - 32, ink2, 0.95);
      // Animated approach arrow
      s += `<line x1="${px}" y1="${py - 50}" x2="${px}" y2="${py - 36}"
                  stroke="${ink2}" stroke-width="1.4" stroke-dasharray="3,3" opacity="0.55"/>`;
      // Label
      s += `<text x="${x + w / 2}" y="${y + h - 8}" text-anchor="middle"
                  font-size="10" fill="${ink2}" font-family="Inter,sans-serif">antibody &#x2192; target</text>`;
      return s;
    }

    function step2(x, y, w, h) {
      // "Tn5 fused to antibody cuts and tags DNA on either side"
      let s = '';
      s += helix(x + 8, y, w - 16, h);
      const cy = y + h * 0.5;
      const px = x + w * 0.5, py = cy - 24;
      // Protein
      s += `<ellipse cx="${px}" cy="${py}" rx="22" ry="15" fill="${lab}" opacity="0.85"/>`;
      s += `<text x="${px}" y="${py + 4}" text-anchor="middle" font-size="10"
                  font-weight="700" fill="${paper}" font-family="Inter,sans-serif">TF</text>`;
      // Antibody bound
      s += antibody(px, py - 30, lab, 0.95);
      // Tn5 box on top of antibody
      s += `<rect x="${px - 14}" y="${py - 56}" width="28" height="14" rx="3"
                  fill="${labDeep}" opacity="0.95"/>`;
      s += `<text x="${px}" y="${py - 46}" text-anchor="middle" font-size="9"
                  font-weight="800" fill="${paper}" font-family="JetBrains Mono, monospace">Tn5</text>`;
      // Cuts on either side of the protein
      [px - 30, px + 30].forEach(cx2 => {
        s += `<g stroke="${focal}" stroke-width="2.2" stroke-linecap="round">
                <line x1="${cx2 - 5}" y1="${cy - 14}" x2="${cx2 + 5}" y2="${cy - 2}"/>
                <line x1="${cx2 + 5}" y1="${cy - 14}" x2="${cx2 - 5}" y2="${cy - 2}"/>
              </g>`;
        // tag flag flying off
        s += `<rect x="${cx2 - 9}" y="${cy + 8}" width="18" height="9" rx="2"
                    fill="${focal}" opacity="0.9"/>`;
        s += `<text x="${cx2}" y="${cy + 15}" text-anchor="middle" font-size="6.5"
                    font-weight="700" fill="${paper}" font-family="JetBrains Mono, monospace">tag</text>`;
      });
      s += `<text x="${x + w / 2}" y="${y + h - 8}" text-anchor="middle"
                  font-size="10" fill="${ink2}" font-family="Inter,sans-serif">Tn5 cuts &amp; labels nearby DNA</text>`;
      return s;
    }

    function stepAmplify(x, y, w, h) {
      // "Linear amplification with T7 RNA polymerase — the secret sauce"
      // Single tagged DNA fragment at the top, produces MANY identical RNA
      // copies stacked beneath. Linear, not exponential.
      let s = '';
      const cy = y + h * 0.5;
      const cx = x + w / 2;

      // Original DNA fragment — offset chosen to vertically centre content in the card
      const fragY = y + 52;
      const fragLen = 90;
      const fragX = cx - fragLen / 2;
      // T7 promoter on the LEFT end of the fragment
      s += `<rect x="${fragX - 16}" y="${fragY - 5}" width="16" height="10" rx="2"
                  fill="${focalDeep}" opacity="0.95"/>`;
      s += `<text x="${fragX - 8}" y="${fragY + 3}" text-anchor="middle" font-size="6.5"
                  font-weight="800" fill="${paper}" font-family="JetBrains Mono, monospace">T7</text>`;
      // The fragment itself (DNA bar)
      s += `<rect x="${fragX}" y="${fragY - 4}" width="${fragLen}" height="8" rx="3"
                  fill="${paper2}" stroke="${ink3}" stroke-width="1"/>`;
      // tag bookend on the right end
      s += `<rect x="${fragX + fragLen - 4}" y="${fragY - 4}" width="4" height="8" fill="${focal}"/>`;
      // T7 polymerase pictogram (small arrow)
      s += `<polygon points="${fragX - 22},${fragY - 8} ${fragX - 18},${fragY - 8} ${fragX - 14},${fragY} ${fragX - 18},${fragY + 8} ${fragX - 22},${fragY + 8}"
                    fill="${focal}" opacity="0.9"/>`;
      s += `<text x="${cx}" y="${fragY - 12}" text-anchor="middle"
                  font-size="9" font-weight="700" fill="${focalDeep}"
                  font-family="Inter,sans-serif">1 tagged fragment</text>`;

      // "linear amplification" label between original and copies
      const copiesTopY = fragY + 22;
      s += `<text x="${cx}" y="${copiesTopY - 4}" text-anchor="middle"
                  font-size="8" fill="${focal}" font-family="JetBrains Mono, monospace"
                  letter-spacing="0.04em">T7 RNA pol &#x2193;</text>`;
      // RNA copies (linear scaling — every fragment gets the same number of copies)
      const nCopies = 7;
      for (let i = 0; i < nCopies; i++) {
        const ry = copiesTopY + 2 + i * 9;
        // each copy a bit shorter than original to look like RNA, in pink
        const copyLen = fragLen - 4;
        s += `<rect x="${cx - copyLen / 2}" y="${ry}" width="${copyLen}" height="5" rx="2"
                    fill="${focal}" opacity="${0.85 - i * 0.05}"/>`;
        // tag bookend on the right
        s += `<rect x="${cx + copyLen / 2 - 3}" y="${ry}" width="3" height="5" fill="${focalDeep}"/>`;
      }
      // "× many" annotation on the right of copies
      s += `<text x="${cx + fragLen / 2 + 6}" y="${copiesTopY + 32}" text-anchor="start"
                  font-size="11" font-weight="800" fill="${focalDeep}"
                  font-family="JetBrains Mono, monospace">&#xD7;100s</text>`;
      // small bracket grouping copies
      const brkX = cx - fragLen / 2 - 6;
      const brkY0 = copiesTopY + 2;
      const brkY1 = copiesTopY + 2 + nCopies * 9 - 4;
      s += `<path d="M ${brkX + 4},${brkY0} L ${brkX},${brkY0}
                    L ${brkX},${brkY1} L ${brkX + 4},${brkY1}"
                  fill="none" stroke="${ink3}" stroke-width="1" opacity="0.6"/>`;

      s += `<text x="${x + w / 2}" y="${y + h - 8}" text-anchor="middle"
                  font-size="10" fill="${ink2}" font-family="Inter,sans-serif">linear, not exponential</text>`;
      return s;
    }

    function step3(x, y, w, h) {
      // "Sequence the tagged fragments"
      let s = '';
      const cy = y + h * 0.5;
      // Stack of fragments fanning out
      const fragments = [
        { dx: -42, len: 46 },
        { dx: -22, len: 58 },
        { dx:   2, len: 70 },
        { dx:  22, len: 58 },
        { dx:  42, len: 46 },
      ];
      fragments.forEach((f, i) => {
        const fy = cy - 28 + i * 12;
        const fx = x + w / 2 + f.dx - f.len / 2;
        s += `<rect x="${fx}" y="${fy - 4}" width="${f.len}" height="6" rx="2.5"
                    fill="${paper2}" stroke="${ink3}" stroke-width="1"/>`;
        // tag indicators on each end
        s += `<rect x="${fx - 1}" y="${fy - 4}" width="3" height="6" fill="${focal}"/>`;
        s += `<rect x="${fx + f.len - 2}" y="${fy - 4}" width="3" height="6" fill="${focal}"/>`;
      });
      // sequencer icon
      const sxg = x + w / 2 - 22, syg = cy + 38;
      s += `<rect x="${sxg}" y="${syg}" width="44" height="22" rx="3"
                  fill="${ink}" opacity="0.92"/>`;
      s += `<text x="${sxg + 22}" y="${syg + 14}" text-anchor="middle" font-size="9"
                  font-weight="700" fill="${paper}" font-family="JetBrains Mono, monospace">SEQ</text>`;
      // arrows from fragments down into sequencer
      s += `<line x1="${x + w / 2}" y1="${cy + 28}" x2="${x + w / 2}" y2="${syg - 2}"
                  stroke="${ink3}" stroke-width="1.2" opacity="0.55"/>`;
      s += `<polygon points="${x + w / 2 - 4},${syg - 6} ${x + w / 2},${syg} ${x + w / 2 + 4},${syg - 6}"
                    fill="${ink3}" opacity="0.7"/>`;

      s += `<text x="${x + w / 2}" y="${y + h - 8}" text-anchor="middle"
                  font-size="10" fill="${ink2}" font-family="Inter,sans-serif">paired-end sequencing</text>`;
      return s;
    }

    function step4(x, y, w, h) {
      // "Pile up reads → peak = binding site"
      let s = '';
      const baseY = y + h - 36;
      const innerW = w - 32;
      const startX = x + 16;
      // Genome track
      s += `<line x1="${startX}" y1="${baseY}" x2="${startX + innerW}" y2="${baseY}"
                  stroke="${ink3}" stroke-width="1.2" opacity="0.6"/>`;
      [0.1, 0.3, 0.5, 0.7, 0.9].forEach(t => {
        const tx = startX + innerW * t;
        s += `<line x1="${tx}" y1="${baseY - 2}" x2="${tx}" y2="${baseY + 2}"
                    stroke="${ink3}" stroke-width="0.8" opacity="0.5"/>`;
      });
      // Peak bumps — Gaussian-ish
      const peakX = startX + innerW * 0.5;
      const peakHmax = h - 56;
      const path = [];
      const pts = 50;
      for (let i = 0; i <= pts; i++) {
        const t = i / pts;
        const xp = startX + innerW * t;
        const dx = (xp - peakX) / (innerW * 0.18);
        const yp = baseY - peakHmax * Math.exp(-dx * dx);
        path.push(`${i === 0 ? 'M' : 'L'} ${xp.toFixed(1)} ${yp.toFixed(1)}`);
      }
      // closure for fill
      const fillPath = path.concat([`L ${(startX + innerW).toFixed(1)} ${baseY}`,
                                    `L ${startX.toFixed(1)} ${baseY} Z`]).join(' ');
      s += `<path d="${fillPath}" fill="${focal}" opacity="0.18"/>`;
      s += `<path d="${path.join(' ')}" fill="none" stroke="${focal}" stroke-width="2"/>`;
      // Star at the peak top
      s += `<circle cx="${peakX}" cy="${baseY - peakHmax}" r="4"
                    fill="${focal}"/>`;
      s += `<text x="${peakX}" y="${baseY - peakHmax - 10}" text-anchor="middle"
                  font-size="9" font-weight="700" fill="${focalDeep}"
                  font-family="Inter,sans-serif">binding site</text>`;
      // axis label
      s += `<text x="${startX}" y="${baseY + 16}" text-anchor="start"
                  font-size="9" fill="${ink3}" font-family="JetBrains Mono, monospace">chr X</text>`;
      s += `<text x="${startX + innerW}" y="${baseY + 16}" text-anchor="end"
                  font-size="9" fill="${ink3}" font-family="JetBrains Mono, monospace">…position</text>`;

      s += `<text x="${x + w / 2}" y="${y + h - 8}" text-anchor="middle"
                  font-size="10" fill="${ink2}" font-family="Inter,sans-serif">peaks = binding map</text>`;
      return s;
    }

    const STEPS = [
      { num: '1', title: 'Find',     sub: 'antibody binds the protein on DNA',         paint: step1 },
      { num: '2', title: 'Cut & tag',sub: 'tethered Tn5 marks the flanking DNA',       paint: step2 },
      { num: '3', title: 'Amplify',  sub: 'T7 makes many linear RNA copies — no PCR',  paint: stepAmplify },
      { num: '4', title: 'Sequence', sub: 'tagged copies → reads',                     paint: step3 },
      { num: '5', title: 'Map',      sub: 'pile-up peaks reveal binding sites',        paint: step4 },
    ];

    let stepsSvg = '';
    let arrowsSvg = '';
    if (isNarrow) {
      const startX = 20;
      STEPS.forEach((step, i) => {
        const y = 16 + i * (titleH + cardH + captionH + gapY);
        // Title row
        stepsSvg += `<text x="${startX}" y="${y + 18}" font-size="13" font-weight="700"
                          fill="${labDeep}" font-family="JetBrains Mono, monospace">${step.num}</text>
                     <text x="${startX + 20}" y="${y + 18}" font-size="13" font-weight="700"
                          fill="${ink}" font-family="Inter Tight, Inter, sans-serif">${step.title}</text>`;
        stepsSvg += `<rect x="${startX}" y="${y + titleH - 8}" width="${cardW}" height="${cardH}" rx="12"
                          fill="${paper}" stroke="${ink3}" stroke-width="1" opacity="0.96"/>`;
        stepsSvg += step.paint(startX, y + titleH - 8, cardW, cardH);
        stepsSvg += `<text x="${startX + cardW / 2}" y="${y + titleH + cardH + 18}" text-anchor="middle"
                          font-size="11" fill="${ink2}" font-family="Inter,sans-serif">${step.sub}</text>`;
        // Down arrow
        if (i < STEPS.length - 1) {
          const ay0 = y + titleH + cardH + captionH;
          const ay1 = ay0 + gapY - 8;
          const ax = startX + cardW / 2;
          arrowsSvg += `<line x1="${ax}" y1="${ay0}" x2="${ax}" y2="${ay1}"
                              stroke="${focal}" stroke-width="1.8" stroke-linecap="round"/>
                        <polygon points="${ax - 5},${ay1 - 4} ${ax},${ay1 + 3} ${ax + 5},${ay1 - 4}"
                                  fill="${focal}"/>`;
        }
      });
    } else {
      const totalW = N * cardW + (N - 1) * gapX;
      const startX = (W - totalW) / 2;
      STEPS.forEach((step, i) => {
        const cx = startX + i * (cardW + gapX);
        // Title row above card
        stepsSvg += `<text x="${cx + 8}" y="${28}" font-size="14" font-weight="700"
                          fill="${labDeep}" font-family="JetBrains Mono, monospace">${step.num}</text>
                     <text x="${cx + 28}" y="${28}" font-size="14" font-weight="700"
                          fill="${ink}" font-family="Inter Tight, Inter, sans-serif">${step.title}</text>`;
        stepsSvg += `<rect x="${cx}" y="${titleH - 8}" width="${cardW}" height="${cardH}" rx="12"
                          fill="${paper}" stroke="${ink3}" stroke-width="1" opacity="0.96"/>`;
        stepsSvg += step.paint(cx, titleH - 8, cardW, cardH);
        // caption under card
        stepsSvg += `<text x="${cx + cardW / 2}" y="${titleH + cardH + 16}" text-anchor="middle"
                          font-size="11" fill="${ink2}" font-family="Inter,sans-serif">${step.sub}</text>`;
        // Right arrow between cards
        if (i < STEPS.length - 1) {
          const ax0 = cx + cardW + 2;
          const ax1 = ax0 + gapX - 4;
          const ay = titleH - 8 + cardH / 2;
          arrowsSvg += `<line x1="${ax0}" y1="${ay}" x2="${ax1}" y2="${ay}"
                              stroke="${focal}" stroke-width="1.6"/>
                        <polygon points="${ax1 - 6},${ay - 4} ${ax1 - 1},${ay} ${ax1 - 6},${ay + 4}"
                                  fill="${focal}"/>`;
        }
      });
    }

    const svg = `
      <svg viewBox="0 0 ${W} ${H}" role="img"
           aria-label="TIP-seq four-step workflow"
           style="width:100%;max-width:${W}px;display:block;margin:0 auto;overflow:visible">
        ${stepsSvg}
        ${arrowsSvg}
      </svg>`;
    container.innerHTML = svg;

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.registerPlugin(ScrollTrigger);
      const groups = container.querySelectorAll('svg > rect, svg > text');
      gsap.from(container.querySelector('svg'), {
        y: 12, duration: 0.55, ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: { trigger: container, start: 'top 82%', once: true },
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('fig-tipseq-flow');
    if (!el) return;
    build(el);
    if (window.FLAIR?.chartUtil?.observeResize) {
      window.FLAIR.chartUtil.observeResize(el, () => build(el));
    }
  });
})();
