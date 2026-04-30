/* ============================================================
   FLAIR-AD · scrollytelling.js
   GSAP + ScrollTrigger animations for index.html
   Requires: gsap.min.js + ScrollTrigger.min.js (deferred before this)

   Animations are translate-only (no opacity:0 from-state) so that even
   if a ScrollTrigger never fires (slow scripts, programmatic scrolling,
   reduced-motion preferences) every element is fully visible. The
   `immediateRender:false` guard means the from-state is applied only
   when the trigger actually fires, so the natural rendered state is
   what users see by default.
   ============================================================ */

(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return; // honour user preference; CSS handles final state

  const EASE  = 'power2.out';
  const DUR   = 0.55;
  const START = 'top 84%';

  // Common scrollTrigger config — once: true so it doesn't replay on scroll back
  const st = (trigger, vars) => ({ trigger, start: START, once: true, ...vars });

  // gsap.from variant that does NOT pre-render the from state (so element
  // stays visible until the trigger fires)
  function fromOnTrigger(els, fromVars, trigger) {
    if (!els || (els.length === 0 && !els.tagName)) return;
    return gsap.from(els, {
      ...fromVars,
      duration: DUR,
      ease: EASE,
      immediateRender: false,
      scrollTrigger: st(trigger || (els.tagName ? els : els[0])),
    });
  }

  function staggerSlide(selector, extra = {}) {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    gsap.from(els, {
      y: 20,
      duration: DUR,
      ease: EASE,
      stagger: 0.12,
      immediateRender: false,
      scrollTrigger: st(els[0]),
      ...extra,
    });
  }

  document.addEventListener('DOMContentLoaded', () => {

    /* ── Hero: staggered entry on load ─────────────────────── */
    const heroEls = document.querySelectorAll(
      '.hero-pill, .hero-title, .hero-lede, .hero-actions, .hero-meta'
    );
    if (heroEls.length) {
      gsap.from(heroEls, {
        opacity: 0, y: 16,
        duration: 0.65, ease: EASE,
        stagger: 0.12,
        delay: 0.08,
        clearProps: 'all',
      });
    }

    /* ── Hero halo parallax ────────────────────────────────── */
    const halo = document.getElementById('hero-halo');
    if (halo) {
      gsap.to(halo, {
        yPercent: -30,
        ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.2 },
      });
    }

    /* ── Stat bar ──────────────────────────────────────────── */
    const stats = document.querySelectorAll('.stat');
    if (stats.length) {
      gsap.from(stats, {
        y: 20, scale: 0.97,
        duration: DUR, ease: EASE,
        stagger: 0.08,
        immediateRender: false,
        scrollTrigger: st(stats[0]),
      });
    }

    /* ── Section heads ─────────────────────────────────────── */
    document.querySelectorAll('.section-head').forEach(head => {
      gsap.from(head.children, {
        y: 14,
        duration: DUR, ease: EASE,
        stagger: 0.1,
        immediateRender: false,
        scrollTrigger: st(head),
      });
    });

    /* ── Evidence cards ────────────────────────────────────── */
    staggerSlide('.evidence-card');

    /* ── Paradigm cards ────────────────────────────────────── */
    const oldCard = document.querySelector('.paradigm-card--old');
    const newCard = document.querySelector('.paradigm-card--new');
    const paradigmArrow = document.querySelector('.paradigm-arrow');
    if (oldCard) {
      gsap.from(oldCard, {
        x: -24, duration: DUR, ease: EASE,
        immediateRender: false,
        scrollTrigger: st(oldCard),
      });
    }
    if (paradigmArrow) {
      gsap.from(paradigmArrow, {
        scaleX: 0,
        duration: 0.4, ease: EASE,
        transformOrigin: 'left center',
        immediateRender: false,
        scrollTrigger: { trigger: oldCard || paradigmArrow, start: START, once: true },
        delay: 0.3,
      });
    }
    if (newCard) {
      gsap.from(newCard, {
        x: 24, duration: DUR, ease: EASE,
        immediateRender: false,
        scrollTrigger: st(newCard),
        delay: 0.15,
      });
    }

    /* ── Microglia state figure ────────────────────────────── */
    const mgFig = document.getElementById('fig-microglia-state');
    if (mgFig) {
      gsap.from(mgFig, {
        scale: 0.96,
        duration: 0.65, ease: EASE,
        transformOrigin: 'center center',
        immediateRender: false,
        scrollTrigger: st(mgFig),
      });
    }

    /* ── Why prose paragraphs ──────────────────────────────── */
    const whyParas = document.querySelectorAll('#why .prose > *');
    if (whyParas.length) {
      gsap.from(whyParas, {
        y: 12,
        duration: DUR, ease: EASE,
        stagger: 0.14,
        immediateRender: false,
        scrollTrigger: st(whyParas[0]),
      });
    }

    /* ── Aim cards ─────────────────────────────────────────── */
    staggerSlide('.aim-card');

    /* ── About ─────────────────────────────────────────────── */
    const aboutCard = document.querySelector('.about-card');
    const aboutLinks = document.querySelector('.about-links');
    if (aboutCard) {
      gsap.from(aboutCard, {
        y: 18,
        duration: DUR, ease: EASE,
        immediateRender: false,
        scrollTrigger: st(aboutCard),
      });
    }
    if (aboutLinks) {
      gsap.from(aboutLinks, {
        x: 18,
        duration: DUR, ease: EASE,
        immediateRender: false,
        scrollTrigger: st(aboutLinks),
        delay: 0.2,
      });
    }

    /* ── Share / forum heads ───────────────────────────────── */
    ['#share .section-head', '#forum .section-head'].forEach(sel => {
      const el = document.querySelector(sel);
      if (!el) return;
      gsap.from(el.children, {
        y: 12,
        duration: DUR, ease: EASE,
        stagger: 0.1,
        immediateRender: false,
        scrollTrigger: st(el),
      });
    });

    /* ── CSS .reveal cleanup ───────────────────────────────── */
    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = '';
      el.style.transform = '';
      el.classList.add('is-visible');
    });

    /* ── Safety net: after a short delay, force-show any element
       that GSAP somehow left at opacity:0 (e.g. animation killed
       mid-flight by a fast programmatic scroll). ───────────────── */
    setTimeout(() => {
      const watch = [
        '.hero-pill', '.hero-title', '.hero-lede', '.hero-actions', '.hero-meta',
        '.stat', '.evidence-card', '.paradigm-card--old', '.paradigm-card--new',
        '.paradigm-arrow', '#fig-microglia-state', '#why .prose > *',
        '.aim-card', '.about-card', '.about-links',
        '#share .section-head > *', '#forum .section-head > *',
      ];
      watch.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          const op = parseFloat(getComputedStyle(el).opacity);
          if (op < 0.99) {
            el.style.opacity = '1';
            el.style.transform = 'none';
          }
        });
      });
    }, 2500);
  });
})();
