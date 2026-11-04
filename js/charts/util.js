/* ============================================================
   FLAIR-AD · charts/util.js
   Shared palette helpers · ResizeObserver debounce · tooltip factory
   ============================================================ */

(function () {
  'use strict';

  const root = document.documentElement;
  const cssVar = (name, fallback) => {
    const v = getComputedStyle(root).getPropertyValue(name).trim();
    return v || fallback;
  };

  const PALETTE = {
    focal:     cssVar('--c-accent',            '#c2185b'),
    focal2:    cssVar('--c-accent-2',          '#e91e63'),
    focalDeep: cssVar('--c-accent-deep',       '#8e0f45'),
    focalWash: cssVar('--c-accent-wash',       'rgba(194,24,91,0.08)'),
    context:   cssVar('--c-chart-context',     '#a0b3c7'),
    faint:     cssVar('--c-chart-faint',       '#cad5e1'),
    up:        cssVar('--c-chart-up',          '#c2185b'),
    down:      cssVar('--c-chart-down',        '#3a6f7f'),
    microglia: cssVar('--c-chart-microglia',   '#c2185b'),
    neuron:    cssVar('--c-chart-neuron',      '#9c7a3f'),
    astro:     cssVar('--c-chart-astro',       '#3a6f7f'),
    oligo:     cssVar('--c-chart-oligo',       '#7a6b8e'),
    opc:       cssVar('--c-chart-opc',         '#a85c6e'),
    ink:       cssVar('--c-ink',               '#0a2540'),
    ink2:      cssVar('--c-ink-2',             '#425466'),
    ink3:      cssVar('--c-ink-3',             '#6a7a8c'),
    paper:     cssVar('--c-paper',             '#ffffff'),
    paper2:    cssVar('--c-paper-2',           '#f6f8fb'),
    paper3:    cssVar('--c-paper-3',           '#eef2f7'),
    rule:      cssVar('--c-rule',              'rgba(10,37,64,0.08)'),
    ruleStrong:cssVar('--c-rule-strong',       'rgba(10,37,64,0.18)'),
  };

  function debounce(fn, wait) {
    let t = null;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /**
   * observeResize — watch a container and call fn(width) when it changes,
   * debounced 150 ms, ignoring sub-pixel changes < 4 px.
   */
  function observeResize(container, fn) {
    let lastW = container.getBoundingClientRect().width;
    const ro = new ResizeObserver(debounce(() => {
      const w = container.getBoundingClientRect().width;
      if (Math.abs(w - lastW) < 4) return;
      lastW = w;
      fn(w);
    }, 150));
    ro.observe(container);
    return () => ro.disconnect();
  }

  /**
   * lazyBuild — only fire `build()` when the container scrolls into view.
   * `animateOnFirstHit` defaults to true — the build is told it can animate.
   * If the user prefers reduced motion, or if called imperatively after first
   * intersection, animation is false (final frame only).
   */
  function lazyBuild(container, build) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window)) {
      build(container.getBoundingClientRect().width, !reduced);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          io.unobserve(en.target);
          build(en.target.getBoundingClientRect().width, !reduced);
        }
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });
    io.observe(container);
  }

  /**
   * makeTooltip — singleton chart tooltip, shared across every chart.
   */
  let _tip;
  function tooltip() {
    if (_tip) return _tip;
    _tip = document.createElement('div');
    _tip.className = 'chart-tooltip';
    _tip.setAttribute('role', 'status');
    document.body.appendChild(_tip);
    return _tip;
  }

  function showTip(event, html) {
    const tip = tooltip();
    tip.innerHTML = html;
    tip.classList.add('visible');
    const r = tip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const x = Math.min(event.clientX + 14, vw - r.width  - 8);
    const y = event.clientY - r.height - 10 < 8
            ? event.clientY + 16
            : event.clientY - r.height - 10;
    tip.style.left = x + 'px';
    tip.style.top  = y + 'px';
  }
  function hideTip() {
    if (_tip) _tip.classList.remove('visible');
  }

  // Microglial-locus counts, computed once from data/gwas_loci.json.
  // `linked` loci are those whose nearest gene is primarily expressed in microglia.
  let _lociSummary = null;
  function lociSummary() {
    if (!_lociSummary) {
      _lociSummary = fetch('data/gwas_loci.json')
        .then(r => r.json())
        .then(rows => {
          const linked = rows.filter(d => d.linked);
          return {
            total: rows.length,
            linked: linked.length,
            genes: new Set(linked.map(d => d.nearestGene || d.gene)).size,
          };
        });
    }
    return _lociSummary;
  }

  // Expose globally so every chart file can use these without ES modules.
  window.FLAIR = window.FLAIR || {};
  window.FLAIR.lociSummary = lociSummary;
  window.FLAIR.chartUtil = {
    PALETTE, debounce, observeResize, lazyBuild,
    tooltip, showTip, hideTip,
  };
})();
