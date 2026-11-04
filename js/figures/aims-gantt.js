/* ============================================================
   FLAIR-AD · figures/aims-gantt.js
   Gantt chart for data.html aims panel (D3 SVG)
   ============================================================ */
(function () {
  'use strict';

  // PhD: 01/10/2026 → 30/09/2030. Year 1 = Q4 2026 → Q3 2027.
  const AIMS = [
    { label: 'Aim 1 · Tag IRF1 in HCT116',     start: [2026,4], end: [2027,3], active: true  },
    { label: 'Aim 2 · Carry into microglia',   start: [2027,4], end: [2028,3], active: false },
    { label: 'Aim 3 · Map across 3 states',    start: [2028,4], end: [2029,3], active: false },
    { label: 'Aim 4 · Connect to AD genetics', start: [2029,4], end: [2030,3], active: false },
  ];

  // Single source of truth for the aim dates: data.html reads the same list
  // (aim rows and chart sub-title are filled from it on DOMContentLoaded).
  window.FLAIR = window.FLAIR || {};
  window.FLAIR.aims = AIMS;

  function toDecimal([yr, q]) { return yr + (q - 1) / 4; }
  // End quarters are inclusive, so a bar ends where the following quarter starts.
  function endDecimal(q) { return toDecimal(q) + 0.25; }
  const fmt = ([yr, q]) => `${yr} Q${q}`;

  function fillDates() {
    document.querySelectorAll('[data-aim-range]').forEach(n => {
      const aim = AIMS[Number(n.dataset.aimRange) - 1];
      if (aim) n.textContent = `${fmt(aim.start)} \u2192 ${fmt(aim.end)}`;
    });
    document.querySelectorAll('[data-aims-span]').forEach(n => {
      n.textContent = `${fmt(AIMS[0].start)} \u2192 ${fmt(AIMS[AIMS.length - 1].end)}`;
    });
  }

  function build(el, width, animate) {
    const P = window.FLAIR?.chartUtil?.PALETTE || {};
    const focal  = P.focal  || '#c2185b';
    const ink    = P.ink    || '#0a2540';
    const ink2   = P.ink2   || '#425466';
    const ink3   = P.ink3   || '#6a7a8c';
    const paper2 = P.paper2 || '#f6f8fb';
    const paper3 = P.paper3 || '#eef2f7';
    const rule   = P.rule   || 'rgba(10,37,64,0.08)';

    // Narrow viewports (~mobile): drop the wide left-label gutter and put
    // the aim labels INSIDE/ABOVE each bar so the timeline can breathe.
    const isNarrow = width < 600;
    const height  = isNarrow ? 280 : 200;
    const margin  = isNarrow
      ? { t: 24, r: 16, b: 44, l: 16 }
      : { t: 24, r: 24, b: 40, l: 160 };
    const innerW  = width  - margin.l - margin.r;
    const innerH  = height - margin.t - margin.b;

    d3.select(el).selectAll('svg').interrupt().remove();
    if (innerW <= 0) return;

    const svg = d3.select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('aria-label', 'Gantt chart: four PhD aims from 2026 Q4 to 2030 Q3');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.l},${margin.t})`);

    // X scale: time in decimal years (PhD spans Oct 2026 → Sep 2030)
    const xDomain = [2026 + 0.25, 2030 + 0.75];
    const xScale = d3.scaleLinear()
      .domain(xDomain)
      .range([0, innerW]);

    // Y scale: one row per aim
    const yScale = d3.scaleBand()
      .domain(AIMS.map(a => a.label))
      .range([0, innerH])
      .padding(0.35);

    // Year grid lines and labels
    [2027, 2028, 2029, 2030].forEach(yr => {
      const x = xScale(yr);
      g.append('line')
        .attr('x1', x).attr('x2', x)
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', rule)
        .attr('stroke-width', 1);
      g.append('text')
        .attr('x', x)
        .attr('y', innerH + 16)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', ink3)
        .text(yr);
    });

    // Q labels on x axis (Q4 2026 start, Q3 2030 end — full PhD timeline)
    const quarters = [
      [2026, 2], [2026, 3], [2026, 4],
      [2027, 1], [2027, 2], [2027, 3], [2027, 4],
      [2028, 1], [2028, 2], [2028, 3], [2028, 4],
      [2029, 1], [2029, 2], [2029, 3], [2029, 4],
      [2030, 1], [2030, 2], [2030, 3],
    ];
    quarters.forEach(([yr, q]) => {
      const x = xScale(toDecimal([yr, q]));
      if (x < 0 || x > innerW) return;
      g.append('line')
        .attr('x1', x).attr('x2', x)
        .attr('y1', innerH).attr('y2', innerH + 5)
        .attr('stroke', ink3)
        .attr('stroke-width', 0.8);
      if (q % 2 === 1) {
        g.append('text')
          .attr('x', x)
          .attr('y', innerH + 28)
          .attr('text-anchor', 'middle')
          .attr('font-size', '8px')
          .attr('fill', ink3)
          .text(`Q${q}`);
      }
    });

    // Aim bars
    AIMS.forEach(aim => {
      const x0 = Math.max(0, xScale(toDecimal(aim.start)));
      const x1 = Math.min(innerW, xScale(endDecimal(aim.end)));
      const barW = Math.max(1, x1 - x0);
      const y  = yScale(aim.label);
      const bh = Math.max(8, yScale.bandwidth());
      const color = aim.active ? focal : ink2;

      // Background track (only if there's room)
      if (innerW > 0) {
        g.append('rect')
          .attr('x', 0).attr('y', y)
          .attr('width', innerW).attr('height', bh)
          .attr('fill', paper2).attr('rx', 2);
      }

      // Aim bar
      const bar = g.append('rect')
        .attr('x', x0)
        .attr('y', y + 2)
        .attr('height', Math.max(4, bh - 4))
        .attr('rx', 4)
        .attr('fill', color)
        .attr('opacity', aim.active ? 0.85 : 0.55);

      // Set width directly. Earlier we used a d3 transition for an
      // animated wipe-in effect, but it conflicted with re-entrant builds
      // (ResizeObserver / lazyBuild firing simultaneously) and emitted
      // dozens of negative-width SVG errors during the in-flight
      // transition.  A static bar is fine — the section already has a
      // GSAP fade-in on the figure container.
      bar.attr('width', barW);

      // Active indicator pulse ring
      if (aim.active) {
        g.append('circle')
          .attr('cx', x0 + barW / 2)
          .attr('cy', y + bh / 2)
          .attr('r', 5)
          .attr('fill', 'none')
          .attr('stroke', focal)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.5);
      }

      if (isNarrow) {
        // Mobile: label sits ABOVE the bar so the bar can use the full row width
        g.append('text')
          .attr('x', 0)
          .attr('y', y - 4)
          .attr('text-anchor', 'start')
          .attr('font-size', '10px')
          .attr('font-weight', aim.active ? '600' : '500')
          .attr('fill', aim.active ? focal : ink2)
          .text(aim.label);
        // Duration on the right of the row, in mono
        const [sy, sq] = aim.start, [ey, eq] = aim.end;
        g.append('text')
          .attr('x', innerW)
          .attr('y', y - 4)
          .attr('text-anchor', 'end')
          .attr('font-size', '9px')
          .attr('font-family', 'var(--f-mono, monospace)')
          .attr('fill', ink3)
          .text(`${sy} Q${sq}–${ey} Q${eq}`);
      } else {
        // Desktop: label in the left gutter
        g.append('text')
          .attr('x', -8)
          .attr('y', y + bh / 2 + 4)
          .attr('text-anchor', 'end')
          .attr('font-size', '11px')
          .attr('font-weight', aim.active ? '600' : '400')
          .attr('fill', aim.active ? focal : ink2)
          .text(aim.label);
        // Duration label inside bar (only if bar is wide enough)
        if (barW > 60) {
          const [sy, sq] = aim.start, [ey, eq] = aim.end;
          g.append('text')
            .attr('x', x0 + barW / 2)
            .attr('y', y + bh / 2 + 4)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('font-family', 'var(--f-mono, monospace)')
            .attr('fill', 'white')
            .attr('opacity', 0.9)
            .text(`${sy} Q${sq} – ${ey} Q${eq}`);
        }
      }
    });

    // "Now" marker — current decimal year, computed live
    const nowDate = new Date();
    const nowDecimal = nowDate.getFullYear()
      + (nowDate.getMonth() / 12)
      + (nowDate.getDate() / 365);
    if (nowDecimal >= xDomain[0] && nowDecimal <= xDomain[1]) {
      const nowX = xScale(nowDecimal);
      g.append('line')
        .attr('x1', nowX).attr('x2', nowX)
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', focal)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,3')
        .attr('opacity', 0.7);
      g.append('text')
        .attr('x', nowX + 4)
        .attr('y', 10)
        .attr('font-size', '8px')
        .attr('fill', focal)
        .text('today');
    }
    // PhD start marker (always shown)
    const phdStartX = xScale(2026 + 0.75);
    g.append('line')
      .attr('x1', phdStartX).attr('x2', phdStartX)
      .attr('y1', -8).attr('y2', innerH)
      .attr('stroke', ink2)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.45);
    g.append('text')
      .attr('x', phdStartX + 4)
      .attr('y', -2)
      .attr('font-size', '8px')
      .attr('fill', ink3)
      .text('PhD start');
  }

  document.addEventListener('DOMContentLoaded', () => {
    fillDates();
    if (typeof d3 === 'undefined') return;
    const el = document.getElementById('fig-aims-gantt');
    if (!el) return;

    const util = window.FLAIR?.chartUtil;
    if (util) {
      util.lazyBuild(el, (w, anim) => {
        build(el, w, anim);
        util.observeResize(el, nw => build(el, nw, false));
      });
      el.addEventListener('flair:buildempty', e => {
        if (!el.querySelector('svg')) {
          build(el, e.detail.width, true);
          util.observeResize(el, nw => build(el, nw, false));
        }
      });
    } else {
      build(el, el.offsetWidth || 600, false);
    }
  });
})();
