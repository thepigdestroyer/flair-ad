(function () {
  'use strict';

  if (typeof d3 === 'undefined') {
    console.warn('volcano.js: D3 not loaded');
    return;
  }

  const { PALETTE, lazyBuild, observeResize, showTip, hideTip } = window.FLAIR.chartUtil;

  const LOG05 = -Math.log10(0.05); // ≈ 1.301

  function classify(d) {
    if (d.logFC > 0.5 && d.adjPval < 0.05) return 'up';
    if (d.logFC < -0.5 && d.adjPval < 0.05) return 'down';
    return 'ns';
  }

  function pointColor(cls) {
    if (cls === 'up')   return PALETTE.up;
    if (cls === 'down') return PALETTE.down;
    return PALETTE.faint;
  }

  function build(el, width, animate) {
    const height  = Math.max(320, Math.round(width * 0.65));
    const margin  = { t: 20, r: 120, b: 50, l: 54 };
    const innerW  = width  - margin.l - margin.r;
    const innerH  = height - margin.t - margin.b;

    d3.select(el).selectAll('svg').remove();
    if (innerW <= 0) return;

    const svg = d3.select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Volcano plot of the 26 robust differentially expressed genes in Alzheimer\'s disease versus control (Murphy 2023 pseudobulk reanalysis); APOE, TREM2 and CSF1R are up-regulated and CX3CR1 is down-regulated');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.l},${margin.t})`);

    d3.json('data/degs_table2.json').then(data => {
      data.forEach(d => {
        d.negLogP = -Math.log10(d.adjPval);
        d._class  = classify(d);
      });

      const maxNegLogP = d3.max(data, d => d.negLogP);

      const xScale = d3.scaleLinear()
        .domain([-3, 3])
        .range([0, innerW]);

      const yScale = d3.scaleLinear()
        .domain([0, maxNegLogP + 1])
        .range([innerH, 0]);

      // Grid lines via axes
      const xAxis = d3.axisBottom(xScale).ticks(7).tickSize(-innerH);
      const yAxis = d3.axisLeft(yScale).ticks(6).tickSize(-innerW);

      const xAxisG = g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(xAxis);
      xAxisG.select('.domain').remove();
      xAxisG.selectAll('.tick line').attr('stroke', PALETTE.rule);
      xAxisG.selectAll('.tick text')
        .attr('fill', PALETTE.ink3)
        .attr('font-size', '11px')
        .attr('font-family', 'var(--f-mono, monospace)');

      xAxisG.append('text')
        .attr('x', innerW / 2)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .attr('fill', PALETTE.ink2)
        .attr('font-size', '12px')
        .attr('font-family', 'sans-serif')
        .text('log₂ Fold Change');

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
        .attr('y', -42)
        .attr('text-anchor', 'middle')
        .attr('fill', PALETTE.ink2)
        .attr('font-size', '12px')
        .attr('font-family', 'sans-serif')
        .text('−log₁₀(adj. p-value)');

      // Threshold lines
      // Vertical at x = ±0.5
      [-0.5, 0.5].forEach(v => {
        g.append('line')
          .attr('x1', xScale(v)).attr('x2', xScale(v))
          .attr('y1', 0).attr('y2', innerH)
          .attr('stroke', PALETTE.ink3)
          .attr('stroke-width', 0.8)
          .attr('stroke-dasharray', '4,3');
      });

      // Horizontal at y = -log10(0.05)
      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', yScale(LOG05)).attr('y2', yScale(LOG05))
        .attr('stroke', PALETTE.ink3)
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '4,3');

      // Points
      const dots = g.selectAll('circle.volcano-dot')
        .data(data)
        .join('circle')
        .attr('class', 'volcano-dot')
        .attr('cx', d => xScale(d.logFC))
        .attr('cy', animate ? innerH : d => yScale(d.negLogP))
        .attr('r', 5)
        .attr('fill', d => pointColor(d._class))
        .attr('opacity', d => d._class === 'ns' ? 0.5 : 0.85)
        .attr('stroke', d => d._class !== 'ns' ? d3.color(pointColor(d._class)).darker(0.5) : 'none')
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .on('mouseover mousemove', function (event, d) {
          showTip(event, `
            <strong>${d.gene}</strong><br>
            Cell type: ${d.cell}<br>
            log₂FC = ${d.logFC.toFixed(3)}<br>
            adj. p = ${d.adjPval < 0.001 ? d.adjPval.toExponential(2) : d.adjPval.toFixed(4)}<br>
            Direction: ${d.direction}
          `);
        })
        .on('mouseout', hideTip);

      if (animate) {
        dots.transition()
          .duration(700)
          .delay((d, i) => i * 8)
          .ease(d3.easeCubicOut)
          .attr('cy', d => yScale(d.negLogP));
      }

      // Gene labels: top 6 up-regulated and top 6 down-regulated by significance
      const upTop   = data.filter(d => d._class === 'up')
                          .sort((a, b) => b.negLogP - a.negLogP).slice(0, 6);
      const downTop = data.filter(d => d._class === 'down')
                          .sort((a, b) => b.negLogP - a.negLogP).slice(0, 6);
      const labelPoints = [...upTop, ...downTop];

      g.selectAll('text.gene-label')
        .data(labelPoints)
        .join('text')
        .attr('class', 'gene-label')
        .attr('x', d => xScale(d.logFC) + (d.logFC > 0 ? 7 : -7))
        .attr('y', d => yScale(d.negLogP) + 4)
        .attr('text-anchor', d => d.logFC > 0 ? 'start' : 'end')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .attr('fill', d => pointColor(d._class))
        .attr('pointer-events', 'none')
        .text(d => d.gene);

      // Legend (top-right, inside plot area)
      const legendData = [
        { label: 'Up-regulated',   color: PALETTE.up   },
        { label: 'Down-regulated', color: PALETTE.down  },
        { label: 'Not significant',color: PALETTE.faint },
      ];

      const legendX = innerW + 8;
      const legendY = 10;

      legendData.forEach(({ label, color }, i) => {
        const ly = legendY + i * 20;
        g.append('circle')
          .attr('cx', legendX + 6)
          .attr('cy', ly)
          .attr('r', 5)
          .attr('fill', color)
          .attr('opacity', 0.85);

        g.append('text')
          .attr('x', legendX + 15)
          .attr('y', ly + 4)
          .attr('font-size', '10px')
          .attr('fill', PALETTE.ink2)
          .text(label);
      });

    }).catch(err => console.warn('volcano: failed to load data', err));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('chart-volcano-full');
    if (!el) return;
    lazyBuild(el, (w, anim) => {
      build(el, w, anim);
      observeResize(el, nw => build(el, nw, false));
    });
    el.addEventListener('flair:buildempty', (e) => {
      if (!el.querySelector('svg')) {
        build(el, e.detail.width, true);
        observeResize(el, nw => build(el, nw, false));
      }
    });
  });

})();
