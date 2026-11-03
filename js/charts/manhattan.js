(function () {
  'use strict';

  if (typeof d3 === 'undefined') {
    console.warn('manhattan.js: D3 not loaded');
    return;
  }

  const { PALETTE, lazyBuild, observeResize, showTip, hideTip } = window.FLAIR.chartUtil;

  // GRCh37 chromosome lengths in Mb (chrs 1-22)
  const CHR_LENGTHS = [249, 243, 198, 191, 180, 171, 159, 146, 141, 135, 135, 133, 115, 107, 102, 90, 81, 78, 59, 63, 48, 51];

  // Pre-compute cumulative offsets
  function buildChrOffsets() {
    const offsets = [];
    let cumulative = 0;
    CHR_LENGTHS.forEach(len => {
      offsets.push(cumulative);
      cumulative += len;
    });
    return { offsets, total: cumulative };
  }

  function getGenomicX(d, offsets) {
    return offsets[d.chr - 1] + d.bp / 1e6;
  }

  // ── Mini Manhattan ──────────────────────────────────────────────────────────
  function buildMini(el, width, animate) {
    const height = Math.round(width * 9 / 16);
    const margin = { t: 12, r: 8, b: 24, l: 36 };
    const innerW = width - margin.l - margin.r;
    const innerH = height - margin.t - margin.b;

    d3.select(el).selectAll('svg').remove();
    if (innerW <= 0) return;

    const svg = d3.select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Manhattan plot of 29 Alzheimer\'s disease risk loci from the Jansen 2019 meta-analysis; loci whose nearest gene is mainly expressed in microglia are highlighted in magenta');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.l},${margin.t})`);

    const { offsets, total } = buildChrOffsets();

    const xScale = d3.scaleLinear()
      .domain([0, total])
      .range([0, innerW]);

    d3.json('data/gwas_loci.json').then(data => {
      const Y_CAP_MINI = 60;
      const yScale = d3.scaleLinear()
        .domain([0, Y_CAP_MINI + 2])
        .range([innerH, 0]);

      // Chromosome bands (alternating paper2/paper3)
      CHR_LENGTHS.forEach((len, i) => {
        const x0 = xScale(offsets[i]);
        const x1 = xScale(offsets[i] + len);
        g.append('rect')
          .attr('x', x0)
          .attr('y', 0)
          .attr('width', x1 - x0)
          .attr('height', innerH)
          .attr('fill', i % 2 === 0 ? PALETTE.paper2 : PALETTE.paper3)
          .attr('stroke', 'none');
      });

      // Threshold line at logP = 7.3
      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', yScale(7.3)).attr('y2', yScale(7.3))
        .attr('stroke', PALETTE.ink3)
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '3,3');

      // Y axis (minimal, 4 ticks)
      const yAxis = d3.axisLeft(yScale)
        .ticks(4)
        .tickSize(-innerW)
        .tickFormat(d3.format('d'));

      const yAxisG = g.append('g').call(yAxis);
      yAxisG.select('.domain').remove();
      yAxisG.selectAll('.tick line')
        .attr('stroke', PALETTE.rule)
        .attr('stroke-dasharray', null);
      yAxisG.selectAll('.tick text')
        .attr('fill', PALETTE.ink3)
        .attr('font-size', '9px');

      const miniPlotData = data.map(d => ({ ...d, plotLogP: Math.min(d.logP, Y_CAP_MINI) }));

      const dots = g.selectAll('circle.locus')
        .data(miniPlotData)
        .join('circle')
        .attr('class', 'locus')
        .attr('cx', d => xScale(getGenomicX(d, offsets)))
        .attr('cy', animate ? innerH : d => yScale(d.plotLogP))
        .attr('r', d => d.linked ? 3.5 : 2.5)
        .attr('fill', d => d.linked ? PALETTE.focal : PALETTE.context)
        .attr('opacity', d => d.linked ? 0.9 : 0.6);

      if (animate) {
        dots.transition()
          .duration(700)
          .delay((d, i) => i * 25)
          .ease(d3.easeCubicOut)
          .attr('cy', d => yScale(d.plotLogP));
      }
    }).catch(err => console.warn('manhattan mini: failed to load data', err));
  }

  // ── Full Manhattan ──────────────────────────────────────────────────────────
  function buildFull(el, width, animate) {
    const height = Math.max(320, Math.round(width * 0.42));
    const margin = { t: 20, r: 20, b: 50, l: 54 };
    const innerW = width - margin.l - margin.r;
    const innerH = height - margin.t - margin.b;

    d3.select(el).selectAll('svg').remove();
    if (innerW <= 0) return;

    const svg = d3.select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Manhattan plot of 29 Alzheimer\'s disease risk loci from the Jansen 2019 meta-analysis, by chromosome position and significance (minus log10 p). Loci whose nearest gene is mainly expressed in microglia are highlighted in magenta; APOE is the strongest signal and is capped at 60 for display');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.l},${margin.t})`);

    const { offsets, total } = buildChrOffsets();

    const xScale = d3.scaleLinear()
      .domain([0, total])
      .range([0, innerW]);

    d3.json('data/gwas_loci.json').then(data => {
      // Cap y-axis at 60 so extreme APOE outlier doesn't compress all other loci.
      // Points above the cap are plotted at the cap with a ≫ break marker.
      const Y_CAP = 60;
      const yScale = d3.scaleLinear()
        .domain([0, Y_CAP + 2])
        .range([innerH, 0]);

      // Chromosome bands
      CHR_LENGTHS.forEach((len, i) => {
        const x0 = xScale(offsets[i]);
        const x1 = xScale(offsets[i] + len);
        g.append('rect')
          .attr('x', x0)
          .attr('y', 0)
          .attr('width', x1 - x0)
          .attr('height', innerH)
          .attr('fill', i % 2 === 0 ? PALETTE.paper2 : PALETTE.paper3)
          .attr('stroke', 'none');
      });

      // Threshold lines
      // Genome-wide: 7.3
      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', yScale(7.3)).attr('y2', yScale(7.3))
        .attr('stroke', PALETTE.focal)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,3');

      g.append('text')
        .attr('x', innerW - 2)
        .attr('y', yScale(7.3) - 3)
        .attr('text-anchor', 'end')
        .attr('font-size', '9px')
        .attr('fill', PALETTE.focal)
        .text('GW sig.');

      // Suggestive: 5
      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', yScale(5)).attr('y2', yScale(5))
        .attr('stroke', PALETTE.ink3)
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '3,3');

      g.append('text')
        .attr('x', innerW - 2)
        .attr('y', yScale(5) - 3)
        .attr('text-anchor', 'end')
        .attr('font-size', '9px')
        .attr('fill', PALETTE.ink3)
        .text('Suggestive');

      // Y axis
      const yAxis = d3.axisLeft(yScale)
        .ticks(6)
        .tickSize(-innerW);

      const yAxisG = g.append('g').call(yAxis);
      yAxisG.select('.domain').remove();
      yAxisG.selectAll('.tick line')
        .attr('stroke', PALETTE.rule);
      yAxisG.selectAll('.tick text')
        .attr('fill', PALETTE.ink3)
        .attr('font-size', '11px');

      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -42)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', PALETTE.ink2)
        .text('−log₁₀(p-value)');

      // X axis: chr labels at midpoints, show every other chr number
      const chrMids = CHR_LENGTHS.map((len, i) => ({
        chr: i + 1,
        mid: xScale(offsets[i] + len / 2)
      }));

      const xAxisG = g.append('g').attr('transform', `translate(0,${innerH})`);
      xAxisG.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('stroke', PALETTE.ruleStrong)
        .attr('stroke-width', 0.8);

      chrMids.forEach(({ chr, mid }) => {
        if (chr % 2 === 1 || chr === 22) {
          xAxisG.append('text')
            .attr('x', mid)
            .attr('y', 14)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('fill', PALETTE.ink3)
            .text(chr);
        }
      });

      g.append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH + 42)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', PALETTE.ink2)
        .text('Chromosome');

      // Plot each point capped at Y_CAP; track which are capped
      const plotData = data.map(d => ({ ...d, plotLogP: Math.min(d.logP, Y_CAP), capped: d.logP > Y_CAP }));

      const dots = g.selectAll('circle.locus')
        .data(plotData)
        .join('circle')
        .attr('class', 'locus')
        .attr('cx', d => xScale(getGenomicX(d, offsets)))
        .attr('cy', animate ? innerH : d => yScale(d.plotLogP))
        .attr('r', d => d.linked ? 5 : 3.5)
        .attr('fill', d => d.linked ? PALETTE.focal : PALETTE.context)
        .attr('opacity', d => d.linked ? 0.9 : 0.65)
        .style('cursor', 'pointer')
        .on('mouseover mousemove', function (event, d) {
          showTip(event, `
            <strong>${d.gene}</strong><br>
            Chr${d.chr}:${d.bp.toLocaleString()}<br>
            −log₁₀(p) = ${d.logP.toFixed(2)}${d.capped ? ' (capped at axis)' : ''}<br>
            OR = ${d.OR.toFixed(2)}<br>
            SNP: ${d.snp}
          `);
        })
        .on('mouseout', hideTip);

      if (animate) {
        dots.transition()
          .duration(800)
          .delay((d, i) => i * 20)
          .ease(d3.easeCubicOut)
          .attr('cy', d => yScale(d.plotLogP));
      }

      // Break markers (≫) for capped points
      g.selectAll('text.cap-marker')
        .data(plotData.filter(d => d.capped))
        .join('text')
        .attr('class', 'cap-marker')
        .attr('x', d => xScale(getGenomicX(d, offsets)))
        .attr('y', d => yScale(d.plotLogP) - 7)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', PALETTE.focal)
        .attr('pointer-events', 'none')
        .text('≫');

      // Labels on linked/microglial loci
      const linked = plotData.filter(d => d.linked);
      g.selectAll('text.gene-label')
        .data(linked)
        .join('text')
        .attr('class', 'gene-label')
        .attr('x', d => xScale(getGenomicX(d, offsets)))
        .attr('y', d => yScale(d.plotLogP) - (d.capped ? 18 : 8))
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .attr('fill', PALETTE.focalDeep)
        .attr('pointer-events', 'none')
        .text(d => d.gene);

    }).catch(err => console.warn('manhattan full: failed to load data', err));
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const miniEl = document.getElementById('mini-manhattan');
    if (miniEl) {
      lazyBuild(miniEl, (w, anim) => {
        buildMini(miniEl, w, anim);
        observeResize(miniEl, nw => buildMini(miniEl, nw, false));
      });
    }

    const fullEl = document.getElementById('chart-manhattan-full');
    if (fullEl) {
      lazyBuild(fullEl, (w, anim) => {
        buildFull(fullEl, w, anim);
        observeResize(fullEl, nw => buildFull(fullEl, nw, false));
      });
      fullEl.addEventListener('flair:buildempty', (e) => {
        if (!fullEl.querySelector('svg')) {
          buildFull(fullEl, e.detail.width, true);
          observeResize(fullEl, nw => buildFull(fullEl, nw, false));
        }
      });
    }
  });

})();
