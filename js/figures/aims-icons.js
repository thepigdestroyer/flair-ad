/* ============================================================
   FLAIR-AD · figures/aims-icons.js
   Mini SVG diagrams injected into each aim card
   Aligned with proposal: HCT116 → microglia → states → genetics
   ============================================================ */
(function () {
  'use strict';

  const AIM_SVGS = {
    // Aim 1: Tag IRF1 (and IRF8) in HCT116. Visual: petri dish with tagged
    // protein on chromatin, "HCT116" label.
    'aim-1': (focal, ink3, paper3) => `
      <svg viewBox="0 0 100 60" role="img"
           aria-label="Aim 1: insert FLAG tag at IRF1 in HCT116 cells via Prime Editing"
           style="width:100%;height:80px;display:block;overflow:visible">
        <!-- Cell-culture dish -->
        <ellipse cx="50" cy="36" rx="40" ry="14" fill="${paper3}" stroke="${ink3}" stroke-width="1" opacity="0.85"/>
        <ellipse cx="50" cy="33" rx="40" ry="13" fill="white" stroke="${ink3}" stroke-width="1"/>
        <!-- DNA arc inside dish -->
        <path d="M22,33 C30,26 40,38 50,30 C60,22 70,38 78,32"
              fill="none" stroke="${ink3}" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>
        <!-- IRF1 protein with FLAG tag (the tagged species) -->
        <ellipse cx="50" cy="29" rx="8" ry="5" fill="${focal}" opacity="0.9"/>
        <text x="50" y="31" text-anchor="middle" font-size="5"
              font-weight="700" fill="white" font-family="Inter,sans-serif">IRF1</text>
        <rect x="56" y="20" width="14" height="7" rx="2" fill="#8e0f45"/>
        <text x="63" y="26" text-anchor="middle" font-size="4.5" font-weight="800"
              fill="white" font-family="JetBrains Mono, monospace">FLAG</text>
        <line x1="55" y1="26" x2="58" y2="22" stroke="#8e0f45" stroke-width="1.2" stroke-linecap="round"/>
        <!-- Cell line label -->
        <text x="50" y="9" text-anchor="middle" font-size="7" font-weight="700"
              fill="${ink3}" font-family="Inter,sans-serif">HCT116 · proof-of-concept</text>
        <!-- Co-target chip — centered horizontally against the petri dish (cx=50) -->
        <rect x="26" y="48" width="48" height="9" rx="3" fill="${paper3}" stroke="${ink3}" stroke-width="0.8"/>
        <text x="50" y="54.5" text-anchor="middle" font-size="5.5" font-weight="700"
              fill="${ink3}" font-family="JetBrains Mono, monospace">+ IRF8 + CTCF</text>
      </svg>`,

    // Aim 2: Carry into microglia. Visual: HCT116 → BV2 (mouse) → iMG (human).
    'aim-2': (focal, ink3, paper3) => `
      <svg viewBox="0 0 100 60" role="img"
           aria-label="Aim 2: transfer the tagging recipe into BV2 mouse and iPSC-derived human microglia"
           style="width:100%;height:80px;display:block;overflow:visible">
        <!-- Three small dishes in a row with arrows -->
        ${[
          { cx: 18, label: 'HCT116',   sub: 'human ✓', dim: true,  col: ink3 },
          { cx: 50, label: 'BV2',      sub: 'mouse μG',           col: ink3 },
          { cx: 82, label: 'iMG',      sub: 'human μG',           col: focal },
        ].map(d => `
          <ellipse cx="${d.cx}" cy="32" rx="12" ry="5" fill="${paper3}" stroke="${ink3}" stroke-width="0.9"/>
          <ellipse cx="${d.cx}" cy="30" rx="12" ry="4.5" fill="white" stroke="${d.col}" stroke-width="1"/>
          <circle  cx="${d.cx - 3}" cy="29" r="2.2" fill="${d.col}" opacity="${d.dim ? 0.45 : 0.85}"/>
          <circle  cx="${d.cx + 3}" cy="30" r="1.8" fill="${d.col}" opacity="${d.dim ? 0.4 : 0.7}"/>
          <text x="${d.cx}" y="46" text-anchor="middle" font-size="7" font-weight="700"
                fill="${d.col}" font-family="Inter,sans-serif">${d.label}</text>
          <text x="${d.cx}" y="55" text-anchor="middle" font-size="6"
                fill="${ink3}" font-family="Inter,sans-serif">${d.sub}</text>
        `).join('')}
        <!-- Arrows between dishes — kept inside the 8-unit gap so heads don't poke into dish 2/3 -->
        ${[31, 63].map(ax => `
          <line x1="${ax}" y1="30" x2="${ax + 4}" y2="30"
                stroke="${focal}" stroke-width="1.2" stroke-linecap="round"/>
          <polygon points="${ax+4},28 ${ax+6},30 ${ax+4},32" fill="${focal}"/>
        `).join('')}
        <!-- Title -->
        <text x="50" y="9" text-anchor="middle" font-size="7" font-weight="700"
              fill="${ink3}" font-family="Inter,sans-serif">Carry the tagging into microglia</text>
        <!-- Method badge -->
        <text x="50" y="18" text-anchor="middle" font-size="6"
              fill="${focal}" font-family="var(--f-mono,monospace)">RNP nucleofection</text>
      </svg>`,

    // Aim 3: ChIP across 3 states. Visual: 3 mini-bars labelled gardener/alarm/DAM
    // with a "GWAS" star highlighting one focal peak.
    'aim-3': (focal, ink3, paper3) => `
      <svg viewBox="0 0 100 60" role="img"
           aria-label="Aim 3: map IRF1 binding across gardener, alarmed and disease-associated microglial states"
           style="width:100%;height:80px;display:block;overflow:visible">
        <!-- Title -->
        <text x="50" y="8" text-anchor="middle" font-size="7" font-weight="700"
              fill="${ink3}" font-family="Inter,sans-serif">IRF1 binding · 3 states</text>
        <!-- Three mini-pile-up tracks -->
        ${[
          { x: 6,  label: 'gardener', col: '#2f7d3f', heights: [3,5,4,3,4,3] },
          { x: 38, label: 'alarmed',  col: '#c87a1a', heights: [4,7,9,5,6,4] },
          { x: 70, label: 'DAM',      col: focal,     heights: [5,9,15,7,8,5] },
        ].map(t => `
          <g>
            ${t.heights.map((h, i) => `
              <rect x="${t.x + i * 4}" y="${36 - h}" width="3" height="${h}" rx="0.8"
                    fill="${t.col}" opacity="${i === 2 ? 0.95 : 0.55}"/>
            `).join('')}
            <line x1="${t.x}" y1="36" x2="${t.x + 24}" y2="36"
                  stroke="${ink3}" stroke-width="0.6" opacity="0.4"/>
            <text x="${t.x + 12}" y="46" text-anchor="middle" font-size="6.5"
                  font-weight="700" fill="${t.col}" font-family="Inter,sans-serif">${t.label}</text>
          </g>
        `).join('')}
        <!-- GWAS callout chip sitting directly on top of the DAM peak bar (peak top at y=21) -->
        <rect x="60" y="12" width="36" height="9" rx="2.5" fill="${focal}" opacity="0.95"/>
        <text x="78" y="18.5" text-anchor="middle" font-size="5.5" font-weight="700"
              fill="white" font-family="JetBrains Mono, monospace">★ GWAS hit</text>
      </svg>`,

    // Aim 4: SLDP heritability partition + SuSiE fine-mapping. Visual: stacked
    // heritability bar plus a small "credible variant" callout.
    'aim-4': (focal, ink3, paper3) => `
      <svg viewBox="0 0 100 60" role="img"
           aria-label="Aim 4: connect IRF1 binding maps to AD genetics via SLDP regression and SuSiE fine-mapping"
           style="width:100%;height:80px;display:block;overflow:visible">
        <!-- Title -->
        <text x="50" y="8" text-anchor="middle" font-size="7" font-weight="700"
              fill="${ink3}" font-family="Inter,sans-serif">AD heritability · explained by IRF1 sites</text>
        <!-- Stacked bars: AD heritability partition — IRF1 enhancers, other microglial enhancers, rest of genome -->
        <rect x="22" y="14" width="46" height="11" rx="2" fill="${focal}" opacity="0.92"/>
        <text font-size="5" font-weight="700" fill="${focal}" font-family="Inter,sans-serif">
          <tspan x="70" y="18.5">IRF1</tspan>
          <tspan x="70" y="23.5">enhancers</tspan>
        </text>
        <rect x="22" y="26" width="28" height="9"  rx="2" fill="${ink3}" opacity="0.4"/>
        <text font-size="4.5" fill="${ink3}" font-family="Inter,sans-serif">
          <tspan x="52" y="29.5">other microglial</tspan>
          <tspan x="52" y="33.5">enhancers</tspan>
        </text>
        <rect x="22" y="36" width="14" height="9"  rx="2" fill="${ink3}" opacity="0.2"/>
        <text x="38" y="42.5" font-size="5" fill="${ink3}" font-family="Inter,sans-serif">rest of genome</text>
        <!-- y-axis line -->
        <line x1="20" y1="13" x2="20" y2="46" stroke="${ink3}" stroke-width="0.7" opacity="0.5"/>
        <line x1="20" y1="46" x2="92" y2="46" stroke="${ink3}" stroke-width="0.7" opacity="0.5"/>
        <!-- Method tags -->
        <text x="22" y="54" font-size="5.5" font-weight="700"
              fill="${ink3}" font-family="JetBrains Mono, monospace">SLDP</text>
        <text x="44" y="54" font-size="5.5" font-weight="700"
              fill="${ink3}" font-family="JetBrains Mono, monospace">+ SuSiE</text>
        <text x="70" y="54" font-size="5.5"
              fill="${ink3}" font-family="Inter,sans-serif" font-style="italic">→ drug shortlist</text>
      </svg>`,
  };

  function injectIcon(card, svgFn) {
    const P = window.FLAIR?.chartUtil?.PALETTE || {};
    const focal  = P.focal  || '#c2185b';
    const ink3   = P.ink3   || '#6a7a8c';
    const paper3 = P.paper3 || '#eef2f7';

    const fig = document.createElement('figure');
    fig.className = 'aim-fig';
    fig.style.margin = '0 0 var(--s-4) 0';
    fig.innerHTML = svgFn(focal, ink3, paper3);
    card.prepend(fig);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.aim-card');
    cards.forEach((card, i) => {
      const key = `aim-${i + 1}`;
      if (AIM_SVGS[key]) injectIcon(card, AIM_SVGS[key]);
    });
  });
})();
