/* ============================================================
   FLAIR-AD · main.js
   Nav toggle · smooth scroll offset · reveal-on-scroll observer
   ============================================================ */

(function () {
  'use strict';

  // ───── Nav toggle (mobile) ─────
  const nav    = document.getElementById('site-nav');
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    // Close when any nav-link is clicked (mobile)
    links?.addEventListener('click', (e) => {
      if (e.target.matches('.nav-link, .nav-link--cta')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ───── Reveal-on-scroll observer ─────
  const reveal = document.querySelectorAll('.reveal');
  if (reveal.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    reveal.forEach((el) => io.observe(el));
  }

  // ───── Smooth anchor offset (account for sticky nav) ─────
  const nH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - nH - 8;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  }, false);

  // ───── js-ready class (enables GSAP-driven opacity:0 on hero) ─────
  document.body.classList.add('js-ready');

  // ───── Utility ─────
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  window.FLAIR = window.FLAIR || {};
  window.FLAIR.prefersReducedMotion = prefersReducedMotion;
})();
