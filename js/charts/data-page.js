(function () {
  'use strict';

  if (typeof d3 === 'undefined') {
    console.warn('data-page.js: D3 not loaded');
    return;
  }

  const { PALETTE, lazyBuild, observeResize, showTip, hideTip } = window.FLAIR.chartUtil;

  // ── Loci Table ────────────────────────────────────────────────────────────────
  function initLociTable() {
    const tbody = document.getElementById('loci-tbody');
    const table = document.getElementById('loci-table');
    if (!tbody || !table) return;

    let lociData  = [];
    let sortCol   = 'locus';
    let sortDir   = 'asc';  // 'asc' | 'desc'

    function renderTable() {
      const sorted = [...lociData].sort((a, b) => {
        let av = a[sortCol], bv = b[sortCol];
        // Normalize key mapping: logp → logP in data
        if (sortCol === 'logp') { av = a.logP; bv = b.logP; }
        if (sortCol === 'or')   { av = a.OR;   bv = b.OR;   }
        if (typeof av === 'string') {
          av = av.toLowerCase();
          bv = bv.toLowerCase();
        }
        let cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });

      tbody.innerHTML = sorted.map(d => `
        <tr>
          <td>${d.locus}</td>
          <td><span class="gene-chip">${escHtml(d.gene)}</span></td>
          <td>${d.chr}</td>
          <td><span class="snp-code">${escHtml(d.snp)}</span></td>
          <td class="num">${d.OR.toFixed(2)}</td>
          <td class="num">${d.logP.toFixed(2)}</td>
          <td>${d.linked
            ? '<span class="chip-yes">Yes</span>'
            : '<span class="chip-no">No</span>'}</td>
        </tr>
      `).join('');
    }

    function escHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    // Sort header click
    table.querySelectorAll('th[data-col]').forEach(th => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (sortCol === col) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortCol = col;
          sortDir = 'asc';
        }

        // Update sort classes on all headers
        table.querySelectorAll('th[data-col]').forEach(h => {
          h.classList.remove('sort-asc', 'sort-desc');
        });
        th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');

        renderTable();
      });
    });

    d3.json('data/gwas_loci.json').then(data => {
      lociData = data;
      renderTable();
    }).catch(err => console.warn('data-page loci table: failed to load data', err));
  }

  // ── DEG Lollipop Chart ────────────────────────────────────────────────────────
  function initDegLollipop() {
    const el = document.getElementById('chart-deg-table');
    if (!el) return;

    lazyBuild(el, (w, anim) => {
      buildLollipop(el, w, anim);
      observeResize(el, nw => buildLollipop(el, nw, false));
    });
  }

  function buildLollipop(el, width, animate) {
    d3.json('data/degs_table2.json').then(data => {
      // Sort by logFC descending
      const sorted = [...data].sort((a, b) => b.logFC - a.logFC);

      const numGenes = sorted.length;
      const height   = Math.max(400, numGenes * 22);
      const margin   = { t: 10, r: 100, b: 30, l: 90 };
      const innerW   = width  - margin.l - margin.r;
      const innerH   = height - margin.t - margin.b;

      d3.select(el).selectAll('svg').remove();
      if (innerW <= 0) return;

      const svg = d3.select(el)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('role', 'img')
      .attr('aria-label', 'Lollipop chart of effect sizes (log fold change) for the 26 robust differentially expressed genes in Alzheimer\'s disease: 21 are up-regulated, including APOE, TREM2 and CSF1R, and 5 are down-regulated, including CX3CR1');

      const g = svg.append('g')
        .attr('transform', `translate(${margin.l},${margin.t})`);

      const xExtent = d3.extent(sorted, d => d.logFC);
      const xAbsMax = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1])) + 0.3;

      const xScale = d3.scaleLinear()
        .domain([-xAbsMax, xAbsMax])
        .range([0, innerW]);

      const yScale = d3.scaleBand()
        .domain(sorted.map(d => d.gene))
        .range([0, innerH])
        .padding(0.4);

      const yMid = yScale.bandwidth() / 2;

      // X axis
      const xAxis = d3.axisBottom(xScale)
        .ticks(7)
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
        .attr('y', 26)
        .attr('text-anchor', 'middle')
        .attr('fill', PALETTE.ink2)
        .attr('font-size', '11px')
        .attr('font-family', 'sans-serif')
        .text('log₂ Fold Change');

      // Y axis (gene names)
      const yAxis = d3.axisLeft(yScale).tickSize(0);
      const yAxisG = g.append('g').call(yAxis);
      yAxisG.select('.domain').remove();
      yAxisG.selectAll('.tick text')
        .attr('fill', d => {
          const row = sorted.find(r => r.gene === d);
          return row && row.direction === 'up' ? PALETTE.focal : PALETTE.down;
        })
        .attr('font-size', '11px')
        .attr('font-weight', '500');

      // Zero line
      g.append('line')
        .attr('x1', xScale(0)).attr('x2', xScale(0))
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', PALETTE.ruleStrong)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,3');

      // Stems (lines)
      const stems = g.selectAll('line.stem')
        .data(sorted)
        .join('line')
        .attr('class', 'stem')
        .attr('x1', xScale(0))
        .attr('y1', d => yScale(d.gene) + yMid)
        .attr('y2', d => yScale(d.gene) + yMid)
        .attr('stroke', d => d.direction === 'up' ? PALETTE.focal : PALETTE.down)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.6);

      if (animate) {
        stems.attr('x2', xScale(0))
          .transition()
          .duration(700)
          .delay((d, i) => i * 20)
          .ease(d3.easeCubicOut)
          .attr('x2', d => xScale(d.logFC));
      } else {
        stems.attr('x2', d => xScale(d.logFC));
      }

      // Dots
      const dots = g.selectAll('circle.lollipop-dot')
        .data(sorted)
        .join('circle')
        .attr('class', 'lollipop-dot')
        .attr('cx', animate ? xScale(0) : d => xScale(d.logFC))
        .attr('cy', d => yScale(d.gene) + yMid)
        .attr('r', 5)
        .attr('fill', d => d.direction === 'up' ? PALETTE.focal : PALETTE.down)
        .attr('opacity', 0.85)
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
          .delay((d, i) => i * 20)
          .ease(d3.easeCubicOut)
          .attr('cx', d => xScale(d.logFC));
      }

      // logFC value labels to the right of dots
      g.selectAll('text.fc-label')
        .data(sorted)
        .join('text')
        .attr('class', 'fc-label')
        .attr('x', d => xScale(d.logFC) + (d.logFC >= 0 ? 8 : -8))
        .attr('y', d => yScale(d.gene) + yMid + 4)
        .attr('text-anchor', d => d.logFC >= 0 ? 'start' : 'end')
        .attr('font-size', '9px')
        .attr('font-family', 'var(--f-mono, monospace)')
        .attr('fill', d => d.direction === 'up' ? PALETTE.focal : PALETTE.down)
        .attr('pointer-events', 'none')
        .text(d => d.logFC.toFixed(2));

    }).catch(err => console.warn('data-page lollipop: failed to load data', err));
  }

  // ── DOMContentLoaded ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initLociTable();

    window.FLAIR.lociSummary().then(s => {
      document.querySelectorAll('[data-linked-loci]').forEach(n => { n.textContent = s.linked; });
      document.querySelectorAll('[data-linked-genes]').forEach(n => { n.textContent = s.genes; });
    }).catch(err => console.warn('data-page: could not compute microglial loci count', err));

    // DEG lollipop lives in a hidden tabbed panel; lazyBuild's IntersectionObserver
    // may not re-fire after display:none is removed. Use lazyBuild normally, but
    // also listen for the flair:buildempty event dispatched by tabs.js.
    initDegLollipop();

    const degEl = document.getElementById('chart-deg-table');
    if (degEl) {
      degEl.addEventListener('flair:buildempty', (e) => {
        if (!degEl.querySelector('svg')) {
          buildLollipop(degEl, e.detail.width, true);
          observeResize(degEl, nw => buildLollipop(degEl, nw, false));
        }
      });
    }
  });

})();
