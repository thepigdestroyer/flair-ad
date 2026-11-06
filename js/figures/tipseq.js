/* ============================================================
   FLAIR-AD · figures/tipseq.js
   TIP-seq vs CETCh-seq side-by-side explainer.
   Lay framing: the lab already runs TIP-seq, this PhD adds the
   antibody-independent CETCh-seq pipeline as the missing piece.
   ============================================================ */
(function () {
  'use strict';

  function build(container) {
    const P = window.FLAIR?.chartUtil?.PALETTE || {};
    const focal     = P.focal     || '#c2185b';
    const focalDeep = P.focalDeep || '#8e0f45';
    const ink       = P.ink       || '#0a2540';
    const ink2      = P.ink2      || '#425466';
    const ink3      = P.ink3      || '#5f6f82';
    const paper     = P.paper     || '#ffffff';
    const paper2    = P.paper2    || '#f6f8fb';
    const paper3    = P.paper3    || '#eef2f7';
    const lab       = '#3a6f7f';   // teal for TIP-seq panel
    const labDeep   = '#1f4a57';

    // ── Panel art ──
    function tipseqArt(W, H) {
      let s = '';
      const cy = H * 0.55;
      // DNA strands
      s += `<path d="M 18,${cy-14} C 50,${cy-22} 90,${cy-6} 130,${cy-14}
                    C 170,${cy-22} 210,${cy-6} ${W-18},${cy-14}"
                  fill="none" stroke="${ink3}" stroke-width="1.5" opacity="0.5"/>`;
      s += `<path d="M 18,${cy+6}  C 50,${cy-2}  90,${cy+14} 130,${cy+6}
                    C 170,${cy-2} 210,${cy+14} ${W-18},${cy+6}"
                  fill="none" stroke="${ink3}" stroke-width="1.5" opacity="0.5"/>`;
      [40, 70, 100, 130, 160, 190, 220, 250].filter(x => x < W - 20).forEach(x => {
        s += `<line x1="${x}" y1="${cy-12}" x2="${x}" y2="${cy+4}"
                    stroke="${ink3}" stroke-width="0.9" opacity="0.32"/>`;
      });
      // Generic protein blob on DNA
      const px = W * 0.40, py = cy - 22;
      s += `<ellipse cx="${px}" cy="${py}" rx="20" ry="14"
                     fill="${lab}" opacity="0.85"/>`;
      s += `<text x="${px}" y="${py + 4}" text-anchor="middle" font-size="9"
                  font-weight="700" fill="${paper}" font-family="Inter,sans-serif">TF</text>`;

      // Antibody Y stuck on the protein
      const ax = px, ay = py - 30;
      s += `<g transform="translate(${ax},${ay})" stroke-linecap="round">
              <line x1="0" y1="20" x2="0" y2="32" stroke="${ink2}" stroke-width="2.2"/>
              <line x1="0" y1="20" x2="-12" y2="6" stroke="${ink2}" stroke-width="2.2"/>
              <line x1="0" y1="20" x2="12"  y2="6" stroke="${ink2}" stroke-width="2.2"/>
              <circle cx="-12" cy="6" r="3.5" fill="${ink2}"/>
              <circle cx="12"  cy="6" r="3.5" fill="${ink2}"/>
            </g>`;
      // Tn5 transposase tethered to antibody (a small box at top of antibody stem)
      s += `<rect x="${ax - 10}" y="${ay - 12}" width="20" height="14" rx="3"
                  fill="${labDeep}" opacity="0.95"/>`;
      s += `<text x="${ax}" y="${ay - 2}" text-anchor="middle" font-size="8"
                  font-weight="800" fill="${paper}" font-family="JetBrains Mono, monospace">Tn5</text>`;

      // Tagmentation cuts: little scissor bursts on the DNA on either side of TF
      [px - 28, px + 28].forEach(cx2 => {
        s += `<g stroke="${focal}" stroke-width="1.8" stroke-linecap="round" opacity="0.85">
                <line x1="${cx2 - 4}" y1="${cy - 18}" x2="${cx2 + 4}" y2="${cy - 6}"/>
                <line x1="${cx2 + 4}" y1="${cy - 18}" x2="${cx2 - 4}" y2="${cy - 6}"/>
              </g>`;
      });
      s += `<text x="${px}" y="${cy + 30}" text-anchor="middle" font-size="9"
                  fill="${labDeep}" font-family="Inter,sans-serif" font-weight="600">Tn5 cuts &amp; tags DNA at the binding site</text>`;
      return s;
    }

    function cetchArt(W, H) {
      let s = '';
      const cy = H * 0.55;
      // DNA strands
      s += `<path d="M 18,${cy-14} C 50,${cy-22} 90,${cy-6} 130,${cy-14}
                    C 170,${cy-22} 210,${cy-6} ${W-18},${cy-14}"
                  fill="none" stroke="${ink3}" stroke-width="1.5" opacity="0.5"/>`;
      s += `<path d="M 18,${cy+6}  C 50,${cy-2}  90,${cy+14} 130,${cy+6}
                    C 170,${cy-2} 210,${cy+14} ${W-18},${cy+6}"
                  fill="none" stroke="${ink3}" stroke-width="1.5" opacity="0.5"/>`;
      [40, 70, 100, 130, 160, 190, 220, 250].filter(x => x < W - 20).forEach(x => {
        s += `<line x1="${x}" y1="${cy-12}" x2="${x}" y2="${cy+4}"
                    stroke="${ink3}" stroke-width="0.9" opacity="0.32"/>`;
      });
      // IRF1 protein with FLAG tag attached
      const px = W * 0.40, py = cy - 22;
      s += `<ellipse cx="${px}" cy="${py}" rx="22" ry="16" fill="${focal}" opacity="0.9"/>`;
      s += `<text x="${px}" y="${py + 4}" text-anchor="middle" font-size="10"
                  font-weight="700" fill="${paper}" font-family="Inter,sans-serif">IRF1</text>`;
      s += `<rect x="${px + 16}" y="${py - 22}" width="32" height="14" rx="4"
                  fill="${focalDeep}" opacity="0.95"/>`;
      s += `<text x="${px + 32}" y="${py - 12}" text-anchor="middle" font-size="9"
                  font-weight="800" fill="${paper}" font-family="JetBrains Mono, monospace">FLAG</text>`;
      s += `<line x1="${px + 14}" y1="${py - 8}" x2="${px + 19}" y2="${py - 16}"
                  stroke="${focalDeep}" stroke-width="1.8" stroke-linecap="round"/>`;
      // Anti-FLAG antibody binding the FLAG tag
      const ax = px + 36, ay = py - 50;
      s += `<g transform="translate(${ax},${ay})" stroke-linecap="round">
              <line x1="0" y1="20" x2="0" y2="40" stroke="${focal}" stroke-width="2.4"/>
              <line x1="0" y1="20" x2="-13" y2="3" stroke="${focal}" stroke-width="2.4"/>
              <line x1="0" y1="20" x2="13"  y2="3" stroke="${focal}" stroke-width="2.4"/>
              <circle cx="-13" cy="3" r="4" fill="${focal}"/>
              <circle cx="13"  cy="3" r="4" fill="${focal}"/>
            </g>`;
      s += `<text x="${ax + 22}" y="${ay + 10}" font-size="9"
                  font-weight="700" fill="${focal}" font-family="Inter,sans-serif">anti-FLAG</text>`;
      // Green check
      s += `<g transform="translate(${ax + 30},${ay + 26})">
              <circle cx="0" cy="0" r="9" fill="${focal}"/>
              <polyline points="-4,1 -1,4 4,-3" fill="none" stroke="${paper}"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </g>`;
      s += `<text x="${px}" y="${cy + 30}" text-anchor="middle" font-size="9"
                  fill="${focalDeep}" font-family="Inter,sans-serif" font-weight="600">FLAG tag = perfect grip, every time</text>`;
      return s;
    }

    function legendDot(col, label) {
      return `<span class="tipseq-dot" style="background:${col}"></span><span>${label}</span>`;
    }

    const artW = 320, artH = 180;
    const html = `
      <div class="tipseq-wrap">
        <article class="tipseq-col tipseq-col--lab">
          <span class="tipseq-tag">In the lab already · TIP-seq</span>
          <h3 class="tipseq-title">Read the genome where the antibody can grip.</h3>
          <p class="tipseq-body">
            The Skene Lab uses <strong>TIP-seq</strong> &mdash; a method that
            tethers a tiny molecular cutter (<span class="mono">Tn5</span>) to
            an antibody. When the antibody finds its target on DNA, the cutter
            chops just there. We sequence the chopped fragments to find every
            place the protein was sitting. Fast, sensitive, &mdash; and used
            here every week.
          </p>
          <svg class="tipseq-art" viewBox="0 0 ${artW} ${artH}" role="img"
               aria-label="TIP-seq schematic: antibody-tethered Tn5 transposase cuts and tags DNA at the protein's binding site">
            ${tipseqArt(artW, artH)}
          </svg>
          <p class="tipseq-foot">
            Works for ~80% of proteins of interest.
          </p>
        </article>

        <div class="tipseq-bridge" aria-hidden="true">
          <div class="tipseq-bridge-pill">+</div>
          <span>The PhD adds<br>the missing 20%</span>
        </div>

        <article class="tipseq-col tipseq-col--phd">
          <span class="tipseq-tag tipseq-tag--phd">This PhD adds · CETCh-seq + Prime Editing</span>
          <h3 class="tipseq-title">For proteins like IRF1 where antibodies aren't specific enough.</h3>
          <p class="tipseq-body">
            We attach a tiny molecular barcode (<span class="mono">FLAG</span>)
            to a single IRF family member using <strong>Prime Editing</strong>
            &mdash; the most precise gene-editing tool available. Now an
            off-the-shelf anti-FLAG antibody pulls down only the tagged
            protein. Specificity stops being the bottleneck.
          </p>
          <svg class="tipseq-art" viewBox="0 0 ${artW} ${artH}" role="img"
               aria-label="CETCh-seq schematic: prime-editing-installed FLAG tag on IRF1, recognised by a universal anti-FLAG antibody">
            ${cetchArt(artW, artH)}
          </svg>
          <p class="tipseq-foot">
            Validated for 208 proteins (Partridge 2020). Now adapted for human microglia.
          </p>
        </article>
      </div>

      <div class="tipseq-legend" aria-hidden="true">
        ${legendDot(lab, 'lab\'s existing TIP-seq pipeline')}
        ${legendDot(focal, 'PhD\'s new CETCh-seq + Prime Editing pipeline')}
      </div>`;

    container.innerHTML = html;

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.registerPlugin(ScrollTrigger);
      const cols = container.querySelectorAll('.tipseq-col, .tipseq-bridge');
      gsap.from(cols, {
        y: 18, duration: 0.55, ease: 'power2.out',
        stagger: 0.12,
        immediateRender: false,
        scrollTrigger: { trigger: container, start: 'top 80%', once: true },
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('fig-tipseq');
    if (!el) return;
    build(el);
    if (window.FLAIR?.chartUtil?.observeResize) {
      window.FLAIR.chartUtil.observeResize(el, () => build(el));
    }
  });
})();
