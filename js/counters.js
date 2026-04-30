/* ============================================================
   FLAIR-AD · counters.js
   Stat counter-ups · once per element on first visibility
   ============================================================ */

(function () {
  'use strict';

  const nodes = document.querySelectorAll('.counter[data-target]');
  if (!nodes.length) return;

  const reduced = window.FLAIR?.prefersReducedMotion?.() ??
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    nodes.forEach((el) => {
      const t = el.dataset.target;
      const s = el.dataset.suffix || '';
      el.textContent = formatFinal(t, el.dataset.decimals) + s;
    });
    return;
  }

  const DUR = 1200; // ms

  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

  function formatFinal(raw, decimals) {
    const n = parseFloat(raw);
    if (Number.isNaN(n)) return raw;
    const d = parseInt(decimals || 0, 10);
    return d > 0 ? n.toFixed(d) : String(Math.round(n));
  }

  function animate(el) {
    const target    = parseFloat(el.dataset.target);
    if (Number.isNaN(target)) return;
    const decimals  = parseInt(el.dataset.decimals || 0, 10);
    const suffix    = el.dataset.suffix || '';
    const startedAt = performance.now();

    function step(now) {
      const t = Math.min(1, (now - startedAt) / DUR);
      const v = target * easeOutQuart(t);
      el.textContent = (decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString()) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = formatFinal(el.dataset.target, decimals) + suffix;
    }
    requestAnimationFrame(step);
  }

  const animated = new WeakSet();
  function fireOnce(el) {
    if (animated.has(el)) return;
    animated.add(el);
    animate(el);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        fireOnce(en.target);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.3, rootMargin: '0px 0px -8% 0px' });

  nodes.forEach((el) => {
    el.textContent = '0' + (el.dataset.suffix || '');
    io.observe(el);
  });

  /* Safety net: if a counter is still at "0" 2.5 s after load (e.g. the
     IntersectionObserver never fired due to programmatic scrolling, slow
     connection, or browser quirk), snap it to its final value. */
  setTimeout(() => {
    nodes.forEach((el) => {
      if (animated.has(el)) return;
      const t = el.dataset.target;
      const s = el.dataset.suffix || '';
      el.textContent = formatFinal(t, el.dataset.decimals) + s;
      animated.add(el);
      io.unobserve(el);
    });
  }, 2500);
})();
