(function () {
  'use strict';

  if (typeof d3 === 'undefined') {
    console.warn('cell-types.js: D3 not loaded');
    return;
  }

  const { PALETTE, lazyBuild, observeResize } = window.FLAIR.chartUtil;

  // Murphy 2023 reanalysis — share of robust AD differential genes per cell type.
  // Microglia carries ~96% of the robust DEG signal; everything else is rounding.
  const DATA = [
    { cell: 'Microglia',        share: 96, sig: true  },
    { cell: 'Astrocytes',       share:  2, sig: false },
    { cell: 'Endothelial',      share:  1, sig: false },
    { cell: 'Oligodendrocytes', share:  1, sig: false },
  ];
  const TOTAL_DEGS = 26;

  function cellColor(cell) {
    if (cell === 'Microglia') return PALETTE.microglia;
    if (cell === 'Astrocytes') return PALETTE.astro;
    if (cell === 'Oligodendrocytes') return PALETTE.oligo;
    return PALETTE.context;
  }

  function build(el, width) {
    const height = Math.max(180, Math.round(width * 9 / 16));
    const margin = { t: 14, r: 14, b: 30, l: 110 };
    const innerW = Math.max(40, width - margin.l - margin.r);
    const innerH = height - margin.t - margin.b;

    d3.select(el).selectAll('svg').remove();

    const svg = d3.select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('role', 'img')
      .attr('aria-label', 'Bar chart of cell types: microglia carry 25 of the 26 robust differentially expressed genes in Alzheimer\'s disease brains (Murphy 2023 reanalysis)');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.l},${margin.t})`);

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerW]);
    const yScale = d3.scaleBand()
      .domain(DATA.map(d => d.cell))
      .range([0, innerH])
      .padding(0.3);

    // Axis
    const xAxisG = g.append('g').attr('transform', `translate(0,${innerH})`);
    xAxisG.call(d3.axisBottom(xScale).ticks(4).tickFormat(d => d + '%').tickSize(-innerH));
    xAxisG.select('.domain').remove();
    xAxisG.selectAll('.tick line').attr('stroke', PALETTE.rule);
    xAxisG.selectAll('.tick text').attr('fill', PALETTE.ink3).attr('font-size', '10px');
    xAxisG.append('text')
      .attr('x', innerW / 2).attr('y', 26)
      .attr('text-anchor', 'middle').attr('fill', PALETTE.ink2).attr('font-size', '11px')
      .text('share of robust DEGs');

    const yAxisG = g.append('g').call(d3.axisLeft(yScale).tickSize(0));
    yAxisG.select('.domain').remove();
    yAxisG.selectAll('.tick text')
      .attr('fill', d => d === 'Microglia' ? PALETTE.focal : PALETTE.ink2)
      .attr('font-size', '11px')
      .attr('font-weight', d => d === 'Microglia' ? '700' : '400');

    // Bars
    g.selectAll('rect.bar')
      .data(DATA)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.cell))
      .attr('height', yScale.bandwidth())
      .attr('width', d => xScale(d.share))
      .attr('fill', d => cellColor(d.cell))
      .attr('opacity', d => d.sig ? 0.9 : 0.55)
      .attr('rx', 2);

    // Inline labels
    g.selectAll('text.bar-label')
      .data(DATA)
      .join('text')
      .attr('class', 'bar-label')
      .attr('x', d => d.sig ? xScale(d.share) - 6 : xScale(d.share) + 6)
      .attr('y', d => yScale(d.cell) + yScale.bandwidth() / 2 + 4)
      .attr('text-anchor', d => d.sig ? 'end' : 'start')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--f-mono, monospace)')
      .attr('fill', d => d.sig ? 'rgba(255,255,255,0.95)' : PALETTE.ink3)
      .text(d => `${d.share}%`);

    // Caption inside the figure (below x-axis tail)
    const microShare = DATA.find(d => d.cell === 'Microglia').share;
    const microCount = Math.round(TOTAL_DEGS * microShare / 100);
    g.append('text')
      .attr('x', innerW)
      .attr('y', -2)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--f-mono, monospace)')
      .attr('fill', PALETTE.ink3)
      .text(`${microCount} / ${TOTAL_DEGS} robust DEGs`);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('mini-celltypes');
    if (!el) return;
    lazyBuild(el, (w) => {
      build(el, w);
      observeResize(el, nw => build(el, nw));
    });
  });

})();
