/* ============================================================
   FLAIR-AD · figures/pipeline.js
   snRNA-seq + GWAS analysis pipeline schematic
   ============================================================ */
(function () {
  'use strict';

  /* ── Pipeline definitions ────────────────────────────────── */
  const PIPELINES = [
    {
      label: 'snRNA-seq reanalysis',
      color: null, // will use focal
      steps: [
        { text: 'Mathys 2019', sub: 'raw counts · Synapse' },
        { text: 'QC filters', sub: '≥500 genes · <10% mt' },
        { text: 'Pseudobulk', sub: 'decoupler · per-sample' },
        { text: 'DESeq2', sub: 'age, sex, PMI covariates' },
        { text: '26 DEGs', sub: 'FDR < 0.05', terminal: true },
      ],
    },
    {
      label: 'GWAS annotation',
      color: null, // will use ink2
      steps: [
        { text: 'Jansen 2019', sub: 'N = 455,258' },
        { text: 'Lead SNPs', sub: 'p < 5×10⁻⁸' },
        { text: 'bedtools', sub: 'ENCODE cCREs + ATAC' },
        { text: 'GENCODE v44', sub: 'nearest gene' },
        { text: '29 loci', sub: '<span data-linked-loci>19</span> microglial', terminal: true },
      ],
    },
    {
      label: 'Prime Editing → CETCh-seq',
      color: null, // will use focal
      steps: [
        { text: 'PRIDICT 2.0', sub: 'pegRNA design' },
        { text: 'PE3 edit', sub: 'FLAG at IRF1 C-term' },
        { text: 'Genotype QC', sub: 'Sanger + NGS' },
        { text: 'Anti-FLAG ChIP', sub: 'baseline + DAM' },
        { text: 'IRF1 map', sub: 'peaks ∩ GWAS loci', terminal: true },
      ],
    },
  ];

  function build(el, width) {
    const P = window.FLAIR?.chartUtil?.PALETTE || {};
    const focal  = P.focal  || '#c2185b';
    const ink    = P.ink    || '#0a2540';
    const ink2   = P.ink2   || '#425466';
    const ink3   = P.ink3   || '#5f6f82';
    const paper2 = P.paper2 || '#f6f8fb';
    const paper3 = P.paper3 || '#eef2f7';

    const pipelineColors = [focal, ink2, focal];

    el.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'pipeline-wrap';
    wrapper.setAttribute('role', 'img');
    wrapper.setAttribute('aria-label', 'Analysis pipeline: snRNA-seq reanalysis, GWAS annotation, and Prime Editing to CETCh-seq');

    PIPELINES.forEach((pipeline, pi) => {
      const color = pipelineColors[pi];
      const row = document.createElement('div');
      row.className = 'pipeline-row';

      // Row label
      const label = document.createElement('div');
      label.className = 'pipeline-label';
      label.style.color = color;
      label.textContent = pipeline.label;
      row.appendChild(label);

      // Steps
      const stepsDiv = document.createElement('div');
      stepsDiv.className = 'pipeline-steps';

      pipeline.steps.forEach((step, si) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'pipeline-step' + (step.terminal ? ' pipeline-step--terminal' : '');
        stepEl.style.borderColor = step.terminal ? color : 'transparent';
        stepEl.style.setProperty('--step-color', color);
        stepEl.style.opacity = '0';
        stepEl.style.transform = 'translateX(-10px)';

        stepEl.innerHTML = `
          <span class="pipeline-step-text">${step.text}</span>
          <span class="pipeline-step-sub">${step.sub}</span>`;

        stepsDiv.appendChild(stepEl);

        // Arrow between steps
        if (si < pipeline.steps.length - 1) {
          const arrow = document.createElement('span');
          arrow.className = 'pipeline-arrow';
          arrow.setAttribute('aria-hidden', 'true');
          arrow.innerHTML = `<svg viewBox="0 0 20 12" width="16" height="10" fill="none"
              stroke="${step.terminal ? color : ink3}" stroke-width="1.5">
            <line x1="1" y1="6" x2="15" y2="6"/>
            <polyline points="11,2 17,6 11,10" stroke-linejoin="round"/>
          </svg>`;
          stepsDiv.appendChild(arrow);
        }
      });

      row.appendChild(stepsDiv);
      wrapper.appendChild(row);

      // GSAP stagger
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        const steps = row.querySelectorAll('.pipeline-step');
        gsap.to(steps, {
          opacity: 1, x: 0, duration: 0.45,
          stagger: 0.07,
          ease: 'power2.out',
          scrollTrigger: { trigger: wrapper, start: 'top 80%', once: true },
          delay: pi * 0.15,
        });
      } else {
        row.querySelectorAll('.pipeline-step').forEach(s => {
          s.style.opacity = '1'; s.style.transform = 'none';
        });
      }
    });

    el.appendChild(wrapper);

    window.FLAIR?.lociSummary?.().then(s => {
      el.querySelectorAll('[data-linked-loci]').forEach(n => { n.textContent = s.linked; });
    }).catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('fig-pipeline');
    if (!el) return;

    const util = window.FLAIR?.chartUtil;
    if (util) {
      util.lazyBuild(el, (w) => {
        build(el, w);
        util.observeResize(el, nw => build(el, nw));
      });
      el.addEventListener('flair:buildempty', e => {
        if (!el.querySelector('.pipeline-wrap')) {
          build(el, e.detail.width);
        }
      });
    } else {
      build(el, el.offsetWidth || 700);
    }
  });
})();
