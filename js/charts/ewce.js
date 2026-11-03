(function () {
  'use strict';

  if (typeof d3 === 'undefined') {
    console.warn('ewce.js: D3 not loaded');
    return;
  }

  const { PALETTE, lazyBuild, observeResize, showTip, hideTip } = window.FLAIR.chartUtil;

  // Module-level data cache
  let ewceData = null;

  function loadData() {
    if (ewceData) return Promise.resolve(ewceData);
    return d3.json('data/ewce_scores.json').then(data => {
      ewceData = data;
      return data;
    });
  }

  // Abbreviated cell type names for mini
  const CELL_ABBR = {
    'Pyramidal (SS)':  'Pyr.SS',
    'Pyramidal (CA1)': 'Pyr.CA1',
    'Interneurons':    'Intern.',
    'Microglia':       'Micro.',
    'Astrocytes':      'Astro.',
    'Endothelial':     'Endo.',
    'Oligodendrocytes':'Oligo.',
    'Mural cells':     'Mural',
  };

  function makeColorScale(maxScore) {
    return d3.scaleSequential()
      .domain([0, maxScore])
      .interpolator(d3.interpolateRgb(PALETTE.paper2, PALETTE.focal));
  }

  // ── Mini Heatmap ─────────────────────────────────────────────────────────────
  function buildMini(el, width, animate, data) {
    const height = Math.round(width * 9 / 16);
    const margin = { t: 8, r: 8, b: 28, l: 30 };
    const innerW = width - margin.l - margin.r;
    const innerH = height - margin.t - margin.b;

    d3.select(el).selectAll('svg').remove();
    if (innerW <= 0) return;

    const disorders  = data.disorders;
    const cellTypes  = data.cellTypes;
    const nRows      = disorders.length;
    const nCols      = cellTypes.length;
    const cellW      = innerW / nCols;
    const cellH      = innerH / nRows;

    const allScores  = disorders.flatMap(d => d.scores);
    const maxScore   = d3.max(allScores);
    const colorScale = makeColorScale(maxScore);

    const svg = d3.select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Heatmap preview of EWCE cell-type enrichment: microglia show the strongest enrichment for Alzheimer\'s disease, at 4.1 standard deviations above the mean');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.l},${margin.t})`);

    // Flatten cells for data join
    const miniCells = [];
    disorders.forEach((disorder, row) => {
      disorder.scores.forEach((score, col) => {
        miniCells.push({ row, col, score, sig: disorder.significant[col] });
      });
    });

    // Cell rects
    const cellRects = g.selectAll('rect.mini-cell')
      .data(miniCells)
      .join('rect')
      .attr('class', 'mini-cell')
      .attr('x', d => d.col * cellW)
      .attr('y', d => d.row * cellH)
      .attr('width', Math.max(0, cellW - 1))
      .attr('height', Math.max(0, cellH - 1))
      .attr('fill', d => colorScale(d.score))
      .attr('rx', 1);

    // Significant star labels
    g.selectAll('text.mini-star')
      .data(miniCells.filter(d => d.sig))
      .join('text')
      .attr('class', 'mini-star')
      .attr('x', d => d.col * cellW + cellW / 2)
      .attr('y', d => d.row * cellH + cellH / 2 + 3)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px')
      .attr('fill', PALETTE.paper)
      .attr('pointer-events', 'none')
      .text('*');

    // Y axis: disorder abbreviations
    disorders.forEach((disorder, row) => {
      g.append('text')
        .attr('x', -4)
        .attr('y', row * cellH + cellH / 2 + 3)
        .attr('text-anchor', 'end')
        .attr('font-size', '8px')
        .attr('fill', PALETTE.ink3)
        .text(disorder.abbr);
    });

    // X axis: abbreviated cell type names
    cellTypes.forEach((ct, col) => {
      g.append('text')
        .attr('x', col * cellW + cellW / 2)
        .attr('y', innerH + 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '7px')
        .attr('fill', PALETTE.ink3)
        .text(CELL_ABBR[ct] || ct);
    });
  }

  // ── Full Heatmap ─────────────────────────────────────────────────────────────
  function buildFull(el, width, animate, data) {
    const height     = Math.max(320, Math.round(width * 0.55));
    const margin     = { t: 20, r: 120, b: 90, l: 160 };
    const innerW     = width - margin.l - margin.r;
    const innerH     = height - margin.t - margin.b;

    d3.select(el).selectAll('svg').remove();
    if (innerW <= 0) return;

    const disorders  = data.disorders;
    const cellTypes  = data.cellTypes;
    const nRows      = disorders.length;
    const nCols      = cellTypes.length;
    const cellW      = innerW / nCols;
    const cellH      = innerH / nRows;

    const allScores  = disorders.flatMap(d => d.scores);
    const maxScore   = d3.max(allScores);
    const colorScale = makeColorScale(maxScore);

    const svg = d3.select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Heatmap of EWCE cell-type enrichment for 7 brain disorders across 8 cell types. Microglia are the top cell type for Alzheimer\'s disease (4.1 standard deviations above the mean, p below 0.00001); schizophrenia and autism enrich instead in pyramidal neurons');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.l},${margin.t})`);

    // Flat list of cells for data binding
    const cells = [];
    disorders.forEach((disorder, row) => {
      disorder.scores.forEach((score, col) => {
        cells.push({ disorder, row, col, score, sig: disorder.significant[col], pValue: disorder.pValues[col] });
      });
    });

    // Cells
    g.selectAll('rect.hm-cell')
      .data(cells)
      .join('rect')
      .attr('class', 'hm-cell')
      .attr('x', d => d.col * cellW)
      .attr('y', d => d.row * cellH)
      .attr('width', Math.max(0, cellW - 1.5))
      .attr('height', Math.max(0, cellH - 1.5))
      .attr('fill', d => colorScale(d.score))
      .attr('rx', 2)
      .attr('stroke', d => d.sig ? PALETTE.focal : 'none')
      .attr('stroke-width', d => d.sig ? 1.5 : 0)
      .style('cursor', 'pointer')
      .on('mouseover mousemove', function (event, d) {
        showTip(event, `
          <strong>${d.disorder.name}</strong><br>
          ${cellTypes[d.col]}<br>
          Score: ${d.score.toFixed(3)}<br>
          p = ${d.pValue < 0.001 ? d.pValue.toExponential(2) : d.pValue.toFixed(4)}
          ${d.sig ? '<br><em>Significant</em>' : ''}
        `);
      })
      .on('mouseout', hideTip);

    // Significant cell star labels
    g.selectAll('text.sig-star')
      .data(cells.filter(d => d.sig))
      .join('text')
      .attr('class', 'sig-star')
      .attr('x', d => d.col * cellW + cellW / 2)
      .attr('y', d => d.row * cellH + cellH / 2 + 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', PALETTE.paper)
      .attr('pointer-events', 'none')
      .text('*');

    // Y axis: full disorder names
    disorders.forEach((disorder, row) => {
      g.append('text')
        .attr('x', -8)
        .attr('y', row * cellH + cellH / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('fill', PALETTE.ink2)
        .text(disorder.name);
    });

    // X axis: full cell type names, rotated -45deg
    cellTypes.forEach((ct, col) => {
      g.append('text')
        .attr('transform', `translate(${col * cellW + cellW / 2},${innerH + 8}) rotate(-45)`)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('fill', PALETTE.ink2)
        .text(ct);
    });

    // Legend (color scale bar) on the right
    const legendH = Math.min(innerH * 0.7, 140);
    const legendW = 12;
    const legendX = innerW + 20;
    const legendY = (innerH - legendH) / 2;

    const defs = svg.append('defs');
    const gradId = 'ewce-grad-' + Math.random().toString(36).slice(2, 7);
    const grad = defs.append('linearGradient')
      .attr('id', gradId)
      .attr('x1', '0%').attr('y1', '100%')
      .attr('x2', '0%').attr('y2', '0%');

    grad.append('stop').attr('offset', '0%').attr('stop-color', PALETTE.paper2);
    grad.append('stop').attr('offset', '100%').attr('stop-color', PALETTE.focal);

    const lg = g.append('g').attr('transform', `translate(${legendX},${legendY})`);

    lg.append('rect')
      .attr('width', legendW)
      .attr('height', legendH)
      .attr('fill', `url(#${gradId})`)
      .attr('rx', 2);

    const legendScale = d3.scaleLinear()
      .domain([0, maxScore])
      .range([legendH, 0]);

    const legendAxis = d3.axisRight(legendScale).ticks(4).tickSize(4);
    const lgAxisG = lg.append('g')
      .attr('transform', `translate(${legendW},0)`)
      .call(legendAxis);

    lgAxisG.select('.domain').remove();
    lgAxisG.selectAll('.tick line').attr('stroke', PALETTE.ruleStrong);
    lgAxisG.selectAll('.tick text')
      .attr('fill', PALETTE.ink3)
      .attr('font-size', '9px');

    lg.append('text')
      .attr('x', legendW / 2)
      .attr('y', -6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', PALETTE.ink3)
      .text('Score');
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const miniEl = document.getElementById('mini-ewce');
    if (miniEl) {
      lazyBuild(miniEl, (w, anim) => {
        loadData().then(data => {
          buildMini(miniEl, w, anim, data);
          observeResize(miniEl, nw => loadData().then(d => buildMini(miniEl, nw, false, d)));
        }).catch(err => console.warn('ewce mini: failed to load data', err));
      });
    }

    const fullEl = document.getElementById('chart-ewce-full');
    if (fullEl) {
      lazyBuild(fullEl, (w, anim) => {
        loadData().then(data => {
          buildFull(fullEl, w, anim, data);
          observeResize(fullEl, nw => loadData().then(d => buildFull(fullEl, nw, false, d)));
        }).catch(err => console.warn('ewce full: failed to load data', err));
      });
      fullEl.addEventListener('flair:buildempty', (e) => {
        if (!fullEl.querySelector('svg')) {
          loadData().then(data => {
            buildFull(fullEl, e.detail.width, true, data);
            observeResize(fullEl, nw => loadData().then(d => buildFull(fullEl, nw, false, d)));
          });
        }
      });
    }
  });

})();
