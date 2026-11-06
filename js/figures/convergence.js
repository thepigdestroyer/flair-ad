/* ============================================================
   FLAIR-AD · figures/convergence.js
   Three-evidence convergence diagram for overview panel
   ============================================================ */
(function () {
  'use strict';

  function build(el) {
    const P = window.FLAIR?.chartUtil?.PALETTE || {};
    const focal     = P.focal     || '#c2185b';
    const focalDeep = P.focalDeep || '#8e0f45';
    const ink       = P.ink       || '#0a2540';
    const ink2      = P.ink2      || '#425466';
    const ink3      = P.ink3      || '#5f6f82';
    const paper2    = P.paper2    || '#f6f8fb';
    const context   = P.context   || '#a0b3c7';

    const W = 720, H = 360;
    // Three source nodes — label INSIDE, sub caption ABOVE (away from
    // the convergence lines which exit the bottom of each source).
    const sources = [
      { x: 110, y: 102, label: 'GWAS',      sub: '29 risk loci' },
      { x: 360, y: 84,  label: 'snRNA-seq', sub: '26 DEGs' },
      { x: 610, y: 102, label: 'EWCE',      sub: '4.1σ enrichment' },
    ];
    const target = { x: 360, y: 248, label: 'Microglia', sub: 'The causal cell type' };
    const sourceR = 50;
    const targetR = 58;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Three independent lines of evidence — GWAS, snRNA-seq, and EWCE — all converge on microglia as the causal cell type in Alzheimer\'s disease');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.cssText = `width:100%;max-width:${W}px;height:auto;display:block;margin:0 auto`;

    // Arrow marker
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="cv-arr" viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="5" markerHeight="5" orient="auto">
        <path d="M0,1 L9,5 L0,9 Z" fill="${focal}"/>
      </marker>
      <filter id="cv-glow">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;
    svg.appendChild(defs);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Convergence lines (bezier curves from sources to target)
    sources.forEach(src => {
      const cx = (src.x + target.x) / 2;
      const cy = (src.y + target.y) / 2 + 10;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${src.x},${src.y + sourceR} Q${cx},${cy} ${target.x},${target.y - targetR}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', focal);
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-dasharray', '6,4');
      path.setAttribute('marker-end', 'url(#cv-arr)');
      path.setAttribute('opacity', '0.6');
      g.appendChild(path);
    });

    // Source nodes — circle + centred label inside; sub caption below circle
    sources.forEach(src => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', src.x); circle.setAttribute('cy', src.y);
      circle.setAttribute('r', String(sourceR));
      circle.setAttribute('fill', paper2);
      circle.setAttribute('stroke', ink3); circle.setAttribute('stroke-width', '1.5');
      g.appendChild(circle);

      // Label centred vertically in circle
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', src.x); text.setAttribute('y', src.y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('font-size', '13'); text.setAttribute('font-weight', '700');
      text.setAttribute('fill', ink2);
      text.setAttribute('font-family', 'Inter, sans-serif');
      text.textContent = src.label;
      g.appendChild(text);

      // Sub caption ABOVE the circle so it stays clear of the
      // convergence line that exits the bottom of the circle.
      const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      sub.setAttribute('x', src.x);
      sub.setAttribute('y', src.y - sourceR - 10);
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('font-size', '11');
      sub.setAttribute('fill', ink3);
      sub.setAttribute('font-family', 'Inter, sans-serif');
      sub.textContent = src.sub;
      g.appendChild(sub);
    });

    // Target node — larger, focal-colored
    const targetCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    targetCircle.setAttribute('cx', target.x); targetCircle.setAttribute('cy', target.y);
    targetCircle.setAttribute('r', String(targetR));
    targetCircle.setAttribute('fill', 'rgba(194,24,91,0.10)');
    targetCircle.setAttribute('stroke', focal); targetCircle.setAttribute('stroke-width', '2');
    g.appendChild(targetCircle);

    // Glow ring
    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glow.setAttribute('cx', target.x); glow.setAttribute('cy', target.y);
    glow.setAttribute('r', String(targetR + 6));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', focal); glow.setAttribute('stroke-width', '1');
    glow.setAttribute('opacity', '0.25');
    g.appendChild(glow);

    // Target label centred in circle
    const tLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tLabel.setAttribute('x', target.x); tLabel.setAttribute('y', target.y);
    tLabel.setAttribute('text-anchor', 'middle');
    tLabel.setAttribute('dominant-baseline', 'central');
    tLabel.setAttribute('font-size', '16'); tLabel.setAttribute('font-weight', '800');
    tLabel.setAttribute('fill', focal);
    tLabel.setAttribute('font-family', 'Inter Tight, Inter, sans-serif');
    tLabel.textContent = target.label;
    g.appendChild(tLabel);

    // Target sub OUTSIDE circle (below)
    const tSub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tSub.setAttribute('x', target.x);
    tSub.setAttribute('y', target.y + targetR + 18);
    tSub.setAttribute('text-anchor', 'middle');
    tSub.setAttribute('font-size', '12');
    tSub.setAttribute('font-weight', '600');
    tSub.setAttribute('fill', focalDeep);
    tSub.setAttribute('font-family', 'Inter, sans-serif');
    tSub.textContent = target.sub;
    g.appendChild(tSub);

    svg.appendChild(g);
    el.innerHTML = '';
    el.appendChild(svg);

    // Animate in (slide-only so SVG remains visible if trigger never fires)
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.from(svg, {
        scale: 0.94,
        duration: 0.7, ease: 'power2.out',
        transformOrigin: 'center center',
        immediateRender: false,
        scrollTrigger: { trigger: el, start: 'top 80%', once: true },
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('fig-convergence');
    if (!el) return;
    build(el);
    if (window.FLAIR?.chartUtil?.observeResize) {
      window.FLAIR.chartUtil.observeResize(el, () => build(el));
    }
  });
})();
