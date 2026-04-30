/* ============================================================
   FLAIR-AD · hero-halo.js
   Subtle slow-rotation animation on the conic-gradient halo.
   Disabled under prefers-reduced-motion.
   ============================================================ */

(function () {
  'use strict';

  const el = document.getElementById('hero-halo');
  if (!el) return;

  const reduced = window.FLAIR?.prefersReducedMotion?.() ??
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  let angle = 300;
  let lastT = performance.now();
  let running = true;

  // Pause when the halo is offscreen — saves CPU on long scrolls.
  const io = new IntersectionObserver(([en]) => {
    running = en.isIntersecting;
    if (running) { lastT = performance.now(); requestAnimationFrame(tick); }
  }, { threshold: 0 });
  io.observe(el);

  function tick(now) {
    if (!running) return;
    const dt = now - lastT;
    lastT = now;
    // ~6 degrees per second
    angle = (angle + dt * 0.006) % 360;
    el.style.background = `
      conic-gradient(
        from ${angle}deg at 55% 55%,
        rgba(255,204,229,0.55),
        rgba(255,102,163,0.55),
        rgba(194,24,91,0.55),
        rgba(255,204,229,0.55)
      )`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
