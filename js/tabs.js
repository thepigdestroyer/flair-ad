/* ============================================================
   FLAIR-AD · tabs.js
   Tab-rail switching for data.html
   ============================================================ */

(function () {
  'use strict';

  const tabs = Array.from(document.querySelectorAll('.tab[data-panel]'));
  const sel  = document.getElementById('tab-mobile');
  if (!tabs.length) return;

  function switchTo(name) {
    tabs.forEach(t => {
      const active = t.dataset.panel === name;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    document.querySelectorAll('.panel').forEach(p => {
      if (p.id === 'panel-' + name) p.removeAttribute('hidden');
      else p.setAttribute('hidden', '');
    });

    if (sel) sel.value = name;
    history.replaceState(null, '', '#' + name);

    // Chart files use IntersectionObserver (lazyBuild) which may not re-fire
    // after display:none is removed. Force builds on any empty chart containers
    // in the newly visible panel by re-applying lazyBuild.
    requestAnimationFrame(() => {
      const panel = document.getElementById('panel-' + name);
      if (!panel || !window.FLAIR?.chartUtil) return;
      panel.querySelectorAll('.chart-container').forEach(el => {
        if (!el.querySelector('svg')) {
          // Re-trigger lazyBuild with the current width
          const w = el.getBoundingClientRect().width;
          if (w > 0) {
            const event = new CustomEvent('flair:buildempty', { detail: { el, width: w } });
            el.dispatchEvent(event);
          }
        }
      });
    });
  }

  tabs.forEach(t => t.addEventListener('click', () => switchTo(t.dataset.panel)));
  if (sel) sel.addEventListener('change', () => switchTo(sel.value));

  // Honour URL hash on load
  const h = location.hash.slice(1);
  if (h && tabs.some(t => t.dataset.panel === h)) switchTo(h);
})();
