(function () {
  'use strict';

  if (typeof d3 === 'undefined') {
    console.warn('qc.js: D3 not loaded');
    return;
  }

  const { PALETTE, lazyBuild, observeResize, showTip, hideTip } = window.FLAIR.chartUtil;

  const fmt = d3.format(',');

  // ── QC Waterfall ─────────────────────────────────────────────────────────────
  function buildWaterfall(el, width, animate) {
    const height  = Math.max(180, Math.round(width * 0.3));
    const margin  = { t: 12, r: 60, b: 36, l: 190 };
    const innerW  = width  - margin.l - margin.r;
    const innerH  = height - margin.t - margin.b;

    d3.select(el).selectAll('svg').remove();
    if (innerW <= 0) return;

    const svg = d3.select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('aria-label', 'QC waterfall chart');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.l},${margin.t})`);

    d3.json('data/qc_stats.json').then(({ qc_steps }) => {
      const rawCount = qc_steps[0].count;

      const xScale = d3.scaleLinear()
        .domain([0, rawCount])
        .range([0, innerW]);

      const yScale = d3.scaleBand()
        .domain(qc_steps.map(d => d.step))
        .range([0, innerH])
        .padding(0.25);

      // X axis
      const xAxis = d3.axisBottom(xScale)
        .ticks(4)
        .tickFormat(fmt)
        .tickSize(-innerH);

      const xAxisG = g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(xAxis);

      xAxisG.select('.domain').remove();
      xAxisG.selectAll('.tick line').attr('stroke', PALETTE.rule);
      xAxisG.selectAll('.tick text')
        .attr('fill', PALETTE.ink3)
        .attr('font-size', '10px')
        .attr('font-family', 'var(--f-mono, monospace)');

      xAxisG.append('text')
        .attr('x', innerW / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('fill', PALETTE.ink2)
        .attr('font-size', '11px')
        .text('Nuclei count');

      // Y axis
      const yAxis = d3.axisLeft(yScale).tickSize(0);
      const yAxisG = g.append('g').call(yAxis);
      yAxisG.select('.domain').remove();
      yAxisG.selectAll('.tick text')
        .attr('fill', PALETTE.ink2)
        .attr('font-size', '11px')
        .call(wrapText, margin.l - 10);

      // Bars
      const lastIdx = qc_steps.length - 1;
      const bars = g.selectAll('rect.qc-bar')
        .data(qc_steps)
        .join('rect')
        .attr('class', 'qc-bar')
        .attr('x', 0)
        .attr('y', d => yScale(d.step))
        .attr('height', yScale.bandwidth())
        .attr('fill', (d, i) => i === lastIdx ? PALETTE.focal : PALETTE.ink2)
        .attr('rx', 2)
        .attr('opacity', 0.85)
        .style('cursor', 'pointer')
        .on('mouseover mousemove', function (event, d) {
          const pct = ((d.count / rawCount) * 100).toFixed(1);
          showTip(event, `
            <strong>${d.step}</strong><br>
            ${d.label}<br>
            Count: ${fmt(d.count)}<br>
            ${pct}% of raw
          `);
        })
        .on('mouseout', hideTip);

      if (animate) {
        bars.attr('width', 0)
          .transition()
          .duration(700)
          .delay((d, i) => i * 80)
          .ease(d3.easeCubicOut)
          .attr('width', d => xScale(d.count));
      } else {
        bars.attr('width', d => xScale(d.count));
      }

      // Bar count labels
      g.selectAll('text.qc-label')
        .data(qc_steps)
        .join('text')
        .attr('class', 'qc-label')
        .attr('x', d => xScale(d.count) + 5)
        .attr('y', d => yScale(d.step) + yScale.bandwidth() / 2 + 4)
        .attr('font-size', '10px')
        .attr('font-family', 'var(--f-mono, monospace)')
        .attr('fill', PALETTE.ink2)
        .text(d => fmt(d.count));

    }).catch(err => console.warn('qc waterfall: failed to load data', err));
  }

  // Simple text wrapping for long Y-axis labels
  function wrapText(selection, maxWidth) {
    selection.each(function () {
      const text = d3.select(this);
      const str  = text.text();
      if (str.length > 22) {
        text.text(str.slice(0, 21) + '…');
      }
    });
  }

  // ── DEG Comparison ───────────────────────────────────────────────────────────
  function buildDegBar(el, width, animate) {
    const height   = Math.max(240, Math.round(width * 0.4));
    const margin   = { t: 20, r: 170, b: 50, l: 60 };
    const innerW   = width  - margin.l - margin.r;
    const innerH   = height - margin.t - margin.b;

    d3.select(el).selectAll('svg').remove();
    if (innerW <= 0) return;

    const svg = d3.select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('aria-label', 'DEG count comparison: pseudoreplication vs pseudobulk');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.l},${margin.t})`);

    d3.json('data/qc_stats.json').then(({ deg_comparison }) => {
      const methods   = ['Pseudoreplication (Mathys)', 'Pseudobulk (Murphy)'];
      const cellTypes = [...new Set(deg_comparison.map(d => d.cellType))];

      const methodColors = {
        'Pseudoreplication (Mathys)': '#c0392b',
        'Pseudobulk (Murphy)':        PALETTE.focal,
      };

      const xOuter = d3.scaleBand()
        .domain(cellTypes)
        .range([0, innerW])
        .padding(0.25);

      const xInner = d3.scaleBand()
        .domain(methods)
        .range([0, xOuter.bandwidth()])
        .padding(0.08);

      const maxDegs = d3.max(deg_comparison, d => d.degs);
      const yScale  = d3.scaleLinear()
        .domain([0, maxDegs * 1.08])
        .range([innerH, 0]);

      // Y axis
      const yAxis = d3.axisLeft(yScale).ticks(5).tickSize(-innerW);
      const yAxisG = g.append('g').call(yAxis);
      yAxisG.select('.domain').remove();
      yAxisG.selectAll('.tick line').attr('stroke', PALETTE.rule);
      yAxisG.selectAll('.tick text')
        .attr('fill', PALETTE.ink3)
        .attr('font-size', '11px')
        .attr('font-family', 'var(--f-mono, monospace)');

      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -48)
        .attr('text-anchor', 'middle')
        .attr('fill', PALETTE.ink2)
        .attr('font-size', '11px')
        .text('DEG count');

      // X axis
      const xAxis = d3.axisBottom(xOuter).tickSize(0);
      const xAxisG = g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(xAxis);
      xAxisG.select('.domain').attr('stroke', PALETTE.ruleStrong);
      xAxisG.selectAll('.tick text')
        .attr('fill', PALETTE.ink2)
        .attr('font-size', '10px')
        .attr('dy', '1em');

      // Grouped bars
      cellTypes.forEach(ct => {
        const ctData = deg_comparison.filter(d => d.cellType === ct);
        const ctG    = g.append('g')
          .attr('transform', `translate(${xOuter(ct)},0)`);

        ctData.forEach(d => {
          const barX = xInner(d.method);
          const barH = innerH - yScale(d.degs);
          const barY = yScale(d.degs);

          const rect = ctG.append('rect')
            .attr('x', barX)
            .attr('y', animate ? innerH : barY)
            .attr('width', xInner.bandwidth())
            .attr('height', animate ? 0 : barH)
            .attr('fill', methodColors[d.method])
            .attr('rx', 2)
            .attr('opacity', 0.85)
            .style('cursor', 'pointer')
            .on('mouseover mousemove', function (event) {
              showTip(event, `
                <strong>${d.cellType}</strong><br>
                ${d.method}<br>
                DEGs: ${fmt(d.degs)}
              `);
            })
            .on('mouseout', hideTip);

          if (animate) {
            rect.transition()
              .duration(600)
              .delay(ctData.indexOf(d) * 60)
              .ease(d3.easeCubicOut)
              .attr('y', barY)
              .attr('height', barH);
          }

          // Count label above bar
          if (d.degs > 0) {
            ctG.append('text')
              .attr('x', barX + xInner.bandwidth() / 2)
              .attr('y', barY - 3)
              .attr('text-anchor', 'middle')
              .attr('font-size', '9px')
              .attr('font-family', 'var(--f-mono, monospace)')
              .attr('fill', PALETTE.ink2)
              .text(fmt(d.degs));
          }
        });
      });

      // Legend top-right
      const legendX = innerW + 10;
      methods.forEach((method, i) => {
        const ly = i * 22;
        g.append('rect')
          .attr('x', legendX)
          .attr('y', ly)
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', methodColors[method])
          .attr('rx', 2);

        g.append('text')
          .attr('x', legendX + 16)
          .attr('y', ly + 10)
          .attr('font-size', '10px')
          .attr('fill', PALETTE.ink2)
          .text(method);
      });

    }).catch(err => console.warn('qc degbar: failed to load data', err));
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function wireChart(el, buildFn) {
    if (!el) return;
    lazyBuild(el, (w, anim) => {
      buildFn(el, w, anim);
      observeResize(el, nw => buildFn(el, nw, false));
    });
    // Fallback for hidden-panel IO miss: tabs.js dispatches this when panel opens
    el.addEventListener('flair:buildempty', (e) => {
      if (!el.querySelector('svg')) {
        buildFn(el, e.detail.width, true);
        observeResize(el, nw => buildFn(el, nw, false));
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    wireChart(document.getElementById('chart-qc'),     buildWaterfall);
    wireChart(document.getElementById('chart-degbar'), buildDegBar);
  });

})();
