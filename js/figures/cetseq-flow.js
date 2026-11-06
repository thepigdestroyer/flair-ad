/* ============================================================
   FLAIR-AD · figures/cetseq-flow.js
   CETCh-seq experimental workflow diagram
   ============================================================ */
(function () {
  'use strict';

  const STEPS = [
    {
      id: 'problem',
      fail: true,
      icon: 'antibody',
      title: 'Standard ChIP-seq',
      sub: 'Anti-IRF1 antibodies cross-react across the IRF family',
    },
    {
      id: 'pegrna',
      icon: 'pegrna',
      title: '1 · Design pegRNA',
      sub: 'PRIDICT 2.0 · 3×FLAG at IRF1 C-term',
    },
    {
      id: 'edit',
      icon: 'edit',
      title: '2 · Prime Edit',
      sub: 'PE3 electroporation · iPSC microglia',
    },
    {
      id: 'verify',
      icon: 'verify',
      title: '3 · Verify edit',
      sub: 'Sanger + NGS · FACS sort clonal lines',
    },
    {
      id: 'chip',
      icon: 'chip',
      title: '4 · CETCh-seq',
      sub: 'Anti-FLAG ChIP · baseline + LPS/IFNγ',
    },
    {
      id: 'map',
      icon: 'map',
      title: '5 · Binding map',
      sub: 'IRF1 peaks ∩ 29 GWAS loci',
    },
  ];

  /* ── SVG icon paths ──────────────────────────────────────── */
  function iconPath(id) {
    // All icons drawn in a 32×32 coordinate space
    const icons = {
      antibody: `
        <line x1="4" y1="4" x2="28" y2="28" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="28" y1="4" x2="4" y2="28" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="16" cy="16" r="11" fill="none" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5"/>`,
      pegrna: `
        <path d="M4,20 C8,14 12,26 16,20 C20,14 24,26 28,20" fill="none" stroke-width="2" stroke-linecap="round"/>
        <path d="M4,12 C8,6 12,18 16,12 C20,6 24,18 28,12" fill="none" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        <rect x="22" y="4" width="8" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
        <text x="26" y="9" font-size="5" font-weight="700" fill="white" text-anchor="middle">F</text>`,
      edit: `
        <path d="M6,24 L10,20 L22,8 L26,12 L14,24 Z" fill="none" stroke-width="2" stroke-linejoin="round"/>
        <path d="M22,8 L26,4 L28,6 L24,10" fill="none" stroke-width="2" stroke-linejoin="round"/>
        <line x1="6" y1="28" x2="26" y2="28" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
        <circle cx="24" cy="9" r="3" fill="currentColor" opacity="0.15"/>`,
      verify: `
        <circle cx="16" cy="16" r="11" fill="none" stroke-width="1.5"/>
        <polyline points="10,16 14,21 23,11" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
      chip: `
        <path d="M8,8 L8,24 L24,24 L24,8 Z" fill="none" stroke-width="1.5"/>
        <line x1="12" y1="4" x2="12" y2="8" stroke-width="2" stroke-linecap="round"/>
        <line x1="16" y1="4" x2="16" y2="8" stroke-width="2" stroke-linecap="round"/>
        <line x1="20" y1="4" x2="20" y2="8" stroke-width="2" stroke-linecap="round"/>
        <line x1="4" y1="12" x2="8" y2="12" stroke-width="2" stroke-linecap="round"/>
        <line x1="4" y1="16" x2="8" y2="16" stroke-width="2" stroke-linecap="round"/>
        <line x1="4" y1="20" x2="8" y2="20" stroke-width="2" stroke-linecap="round"/>
        <line x1="24" y1="12" x2="28" y2="12" stroke-width="2" stroke-linecap="round"/>
        <line x1="24" y1="16" x2="28" y2="16" stroke-width="2" stroke-linecap="round"/>
        <line x1="24" y1="20" x2="28" y2="20" stroke-width="2" stroke-linecap="round"/>
        <circle cx="16" cy="16" r="4" fill="currentColor" opacity="0.85"/>`,
      map: `
        <rect x="4" y="18" width="5" height="10" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="11" y="12" width="5" height="16" rx="1" fill="currentColor" opacity="0.6"/>
        <rect x="18" y="6" width="5" height="22" rx="1" fill="currentColor" opacity="0.9"/>
        <line x1="4" y1="28" x2="28" y2="28" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
        <line x1="2" y1="4" x2="2" y2="28" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>`,
    };
    return icons[id] || '';
  }

  /* ── Build ───────────────────────────────────────────────── */
  function build(container) {
    const P = window.FLAIR?.chartUtil?.PALETTE || {};
    const focal     = P.focal     || '#c2185b';
    const focalDeep = P.focalDeep || '#8e0f45';
    const ink       = P.ink       || '#0a2540';
    const ink2      = P.ink2      || '#425466';
    const ink3      = P.ink3      || '#5f6f82';
    const paper2    = P.paper2    || '#f6f8fb';
    const paper3    = P.paper3    || '#eef2f7';
    const faint     = P.faint     || '#cad5e1';

    container.innerHTML = '';

    const isMobile = container.offsetWidth < 600;
    const n = STEPS.length;

    // Build as HTML+CSS flex layout rather than raw SVG for responsiveness
    const wrap = document.createElement('div');
    wrap.className = 'cetseq-wrap';
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', 'CETCh-seq experimental workflow: problem, design, edit, verify, ChIP-seq, binding map');

    STEPS.forEach((step, i) => {
      const isFail = step.fail;

      const card = document.createElement('div');
      card.className = 'cetseq-step' + (isFail ? ' cetseq-step--fail' : '') + (i === n - 1 ? ' cetseq-step--output' : '');

      const iconColor = isFail ? faint : (i === n - 1 ? focalDeep : focal);

      card.innerHTML = `
        <div class="cetseq-icon" style="color:${iconColor}">
          <svg viewBox="0 0 32 32" width="36" height="36" fill="none"
               stroke="${iconColor}" stroke-width="2" aria-hidden="true">
            ${iconPath(step.icon)}
          </svg>
        </div>
        <div class="cetseq-text">
          <span class="cetseq-title">${step.title}</span>
          <span class="cetseq-sub">${step.sub}</span>
        </div>`;

      wrap.appendChild(card);

      // Arrow between steps (not after last)
      if (i < n - 1) {
        const arr = document.createElement('div');
        arr.className = 'cetseq-arrow' + (isFail ? ' cetseq-arrow--dash' : '');
        arr.setAttribute('aria-hidden', 'true');
        arr.innerHTML = `<svg viewBox="0 0 32 16" width="28" height="14" fill="none" stroke="${isFail ? faint : focal}" stroke-width="1.5">
          <line x1="2" y1="8" x2="26" y2="8" stroke-dasharray="${isFail ? '4,3' : 'none'}"/>
          <polyline points="20,3 28,8 20,13" stroke-linejoin="round"/>
        </svg>`;
        wrap.appendChild(arr);
      }
    });

    container.appendChild(wrap);

    // GSAP scroll-triggered stagger reveal — slide-only so cards stay
    // visible if the scrollTrigger never fires.
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.registerPlugin(ScrollTrigger);
      const cards = wrap.querySelectorAll('.cetseq-step');
      gsap.from(cards, {
        y: 18,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: container,
          start: 'top 82%',
          once: true,
        },
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('fig-cetseq');
    if (!el) return;
    build(el);
    if (window.FLAIR?.chartUtil?.observeResize) {
      window.FLAIR.chartUtil.observeResize(el, () => build(el));
    }
  });
})();
