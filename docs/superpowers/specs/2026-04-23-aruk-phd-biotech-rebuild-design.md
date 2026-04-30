# ARUK PhD Website — Biotech-Modern Rebuild

Date: 2026-04-23
Author: Mrinal Joshi (with Claude)
Status: Approved in brainstorming
Supersedes: `2026-04-22-aruk-phd-site-redesign-design.md` (print-editorial attempt — scrapped)

## Context

Static pitch site for an Alzheimer's Research UK PhD scholarship on microglial
enhancers and IRF1 in Alzheimer's disease. Audience: ARUK reviewers, broader
scientific community, lab collaborators. Candidate: Mrinal Joshi, UK DRI at
Imperial.

The previous print-editorial attempt was scrapped — it looked like "a science
magazine" rather than "a researcher doing serious modern work". This rebuild
starts from zero: new HTML, new CSS, new JS, new chart implementations. Only
the data JSON files and the Playwright test harness carry over.

## Direction

**Biotech modern**, neuro-magenta accent. Reference points:

- Recursion.com — light dominant, clinical-modern
- Insitro — bold accent on white
- Stripe Atlas / Stripe Press product pages — typography + pill buttons
- Linear.app docs — tight sans-serif, generous whitespace
- Observable Framework — dashboard chart treatment

Feels like "a premium biotech company or a Stripe product page" — not a blog,
not a PDF, not a magazine.

## Goals

1. A site that reads as sleek, modern, and serious to a 2026 funding-reviewer
   audience — visually distinctive without being gimmicky.
2. Two pages, each focused: a pitch at `/`, a data explorer at `/data`.
3. Pure-vector visual identity — D3 charts, SVG generative art, no
   photography.
4. Playwright-verified: no horizontal overflow, no console errors, charts
   render ≥ 100 px wide, hero fits one viewport, every internal link resolves.
5. Scrollytelling as polish only — stat counter-ups, one chart that builds in
   beats, section-entry fades. No sticky graphics, no scroll-jacking.

## Non-goals

- No microscopy photos, no stock imagery.
- No framework, bundler, or npm run-time dependency (Playwright stays
  dev-only).
- No changes to Firebase config / collection names / data schemas.
- No new content: every chart is built from the existing JSON in `data/`; the
  narrative uses the copy already in the application draft.

## Visual system

### Colours (design tokens)

```
--c-ink:         #0a2540   // primary text + headings
--c-ink-2:       #425466   // body copy
--c-ink-3:       #6a7a8c   // muted captions, metadata
--c-paper:       #ffffff   // page background
--c-paper-2:     #f6f8fb   // alt sections, cards
--c-paper-3:     #eef2f7   // chart backgrounds, rule backgrounds
--c-rule:        rgba(10,37,64,0.08)
--c-rule-strong: rgba(10,37,64,0.18)

--c-accent:      #c2185b   // neuro magenta · primary action + focal chart
--c-accent-2:    #e91e63   // hover / highlight
--c-accent-3:    #ff5a8a   // gradient mid-stop
--c-accent-wash: rgba(194,24,91,0.08)
--c-accent-wash-2: rgba(194,24,91,0.16)

// Chart semantic roles
--c-chart-focal:   var(--c-accent)           // microglia, up-regulated, selected
--c-chart-context: #a0b3c7                    // other cell types, other loci
--c-chart-up:      var(--c-accent)
--c-chart-down:    #3a6f7f                    // sage-teal (secondary only)
--c-chart-microglia: var(--c-accent)
--c-chart-neuron:    #9c7a3f
--c-chart-astro:     #3a6f7f
--c-chart-oligo:     #7a6b8e
--c-chart-opc:       #a85c6e
```

Contrast: magenta (#c2185b) on white is 6.3:1 — WCAG AA body, AA+ large;
ink (#0a2540) on white is 14.8:1 (AAA everywhere). Body copy uses ink, not
magenta, so there is no AA risk on running text. Magenta is used for
buttons, link underlines, and chart focal points only.

### Gradient mesh

One primary gradient, used in the hero halo and the full-bleed "about" section
break:

```
conic-gradient(from 300deg, #ffcce5, #ff66a3, #c2185b, #ffcce5);
filter: blur(80px);
opacity: 0.4;
```

### Typography

- Display + headings: `Inter Tight` (variable), weights 500–700, tracking
  `-0.032em` on h1 / `-0.022em` on h2.
- Body + UI: `Inter` (variable), weights 400–600.
- Numbers + gene symbols + loci: `JetBrains Mono`, weight 400–500.
- No serif. No drop caps.

Type scale:

```
h1 (hero):   clamp(2.5rem, 4vw + 1rem, 4rem)  weight 700  line 1.02
h2:          clamp(1.75rem, 2vw + 1rem, 2.5rem) weight 600  line 1.1
h3:          1.25rem  weight 600
body:        1rem  line 1.55
caption:     0.875rem  line 1.5
meta:        0.75rem  weight 500  letter 0.02em
mono-data:   0.875rem  JetBrains Mono
```

### Spacing + layout

- 4-point base, tokens `--s-0` (2px) through `--s-10` (128px).
- `--prose` = 62ch.
- `--bleed` = 1120px.
- `--nav-h` = 64px (sticky, backdrop-blur).
- Radii: `--r-1` 4px, `--r-2` 8px, `--r-3` 14px, `--r-4` 20px, `--r-full` 9999px.
- Shadows: warm-neutral, stacked (`0 1px 2px + 0 4px 14px + 0 12px 32px`).

### Motion

- `--dur-1` 150ms hover, `--dur-2` 260ms card lift / tab switch, `--dur-3`
  500ms chart draw-ins.
- Easing `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Respects `prefers-reduced-motion: reduce` — all transitions become instant,
  scroll-triggered animations render in their final state immediately.

### Generative art

Replaces microscopy photos. Rendered inline as SVGs:

- **Hero halo** — conic gradient mesh, blurred, behind the headline.
- **Brain cell-types diagram** — five circles sized by DEG count, magenta for
  microglia, grey for the others. Clean Recursion/Insitro style.
- **Concept web** — redrawn from scratch as a horizontal process flow
  (12 nodes, two rows, curved arrows, icons are pure-SVG glyphs).
- **Paradigm-shift visual** — two cards (amyloid era, microglia era) with
  inline generative SVG symbols (a crossed amyloid fibril vs. a blooming
  microglia star).
- **Section dividers** — thin ruled horizontal SVG with a single magenta dot
  marking the position.

## Architecture

Static site, zero build step. CDN dependencies stay on CDN (D3 v7, Firebase
10.7 compat, Google Fonts).

### File layout

```
ARUK_PhD_Website/
├─ index.html                  pitch page
├─ data.html                   data explorer
├─ css/
│   ├─ tokens.css              design tokens
│   ├─ base.css                reset, typography, prose, links
│   ├─ layout.css              nav, footer, page shell, section rhythm
│   ├─ components.css          cards, pills, buttons, tabs, forum, survey
│   ├─ charts.css              chart containers, legends, tooltips
│   └─ scrollytelling.css      reveal-on-intersection + counter-ups
├─ js/
│   ├─ main.js                 entry, nav, smooth scroll, reveal observer
│   ├─ counters.js             stat counter-ups
│   ├─ charts/
│   │   ├─ manhattan.js        built-in-beats GWAS plot
│   │   ├─ volcano.js
│   │   ├─ ewce.js
│   │   ├─ cell-types.js       brain cell-type bars/circles
│   │   ├─ qc.js               scientist-only QC plots
│   │   └─ util.js             ResizeObserver debounce, palette helpers
│   ├─ community.js            forum + survey (Firestore wiring, restyled UI)
│   └─ hero-halo.js            animated gradient mesh in hero
├─ data/                        unchanged (gwas_loci, degs_table2, ewce_scores, qc_stats)
├─ assets/                      unchanged (wordmark SVGs if any)
├─ tests/                       Playwright harness (retained, updated selectors)
└─ docs/                        specs + design notes
```

The previous site's `css/`, `js/*.js` scripts, `index.html`, and
`scientist.html` are **archived** into `archive/2026-04-22-print-editorial/`
before the rebuild begins. Nothing from the old site is loaded.

### Page structure — `index.html` (pitch)

1. **Nav** — `FLAIR-AD` mono wordmark, links: `Data`, `Forum`, `Share thoughts`.
2. **Hero** — gradient-mesh halo + Inter Tight h1 with magenta-gradient
   "immune cells" span + lede + magenta pill CTA to `#evidence` + ghost button
   to `/data`. Single viewport tall (`100dvh`).
3. **Stat bar** — 4 big counter-up numbers: `29 loci`, `26 DEGs`,
   `96% microglia`, `4.1σ EWCE`. Each animates once on first visibility.
4. **Evidence · three-in-a-row cards** — 3 coloured cards:
   - Card 1 — GWAS map (full Manhattan mini inside)
   - Card 2 — Cell-type circles (DEG distribution)
   - Card 3 — EWCE enrichment bars
   Each card is clickable → `/data` deep-link.
5. **The paradigm shift** — two-column: amyloid era (greyed) vs microglia era
   (magenta-accented), with inline generative SVG symbols.
6. **Why it still matters** — prose section: the antibody gap, the
   experimental idea, in plain language.
7. **The proposal · four aims** — 4 cards in a 2×2 grid, each with progress
   pill, timeline badge, one-line description.
8. **Who is running this** — single card with the candidate's headshot-less
   identity card (name, role, one-line bio), plus a short list of publications
   / pre-prints / notebooks.
9. **Share your thoughts** — Firestore-backed survey (5 short questions).
10. **Community forum** — Firestore posts + voting + composer.
11. **Footer** — wordmark, ©, ARUK acknowledgement, contact email, GitHub link.

### Page structure — `data.html` (explorer)

1. **Nav** — same.
2. **Page header** — "Data explorer" + one-line scope.
3. **Tab pill bar** — `Overview · GWAS · snRNA-seq · EWCE · Aims · Methods`.
   Sticky below nav. Below 768 px collapses to a `<select>` dropdown (same
   pattern as before, reimplemented cleanly).
4. **Overview panel** — large stat grid, scientific rationale, key refs.
5. **GWAS panel** — full Manhattan plot + sortable/filterable loci table.
6. **snRNA-seq panel** — volcano + DEG table + QC bar + pseudoreplication
   scatter.
7. **EWCE panel** — heatmap + method notes + refs.
8. **Aims panel** — status table + per-aim detail accordions + clearly-labelled
   placeholder cards for upcoming data.
9. **Methods panel** — long-form methods prose + code-block snippets for the
   analysis pipeline.

## Scrollytelling · what "yes with constraints" means

Three and only three effects:

1. **Counter-ups.** Any `.counter[data-target]` element counts `0 → data-target`
   once, on first intersection, 1200 ms duration, `easeOutQuart`. No second
   firing.
2. **Chart build-in beats.** The GWAS Manhattan and the Volcano animate a
   short draw-in (axis → dots → focal dots → labels, ~900 ms total) the first
   time the chart enters the viewport. If the intersection never fires (e.g.
   anchor-link jump skipping past it, or reduced-motion preference), the
   chart builds in its final state instead — never an empty SVG.
3. **Section reveal.** Every `.reveal` element starts at `opacity: 0;
   translateY(12px)` and settles to `opacity: 1; translateY(0)` over 400 ms
   when it intersects.

All three are skipped entirely if `prefers-reduced-motion: reduce` is set —
elements render in their final state at page load.

**No sticky graphics. No scroll-jacking. No pinned panels with text scrolling
beside.**

## Charts

All charts in `js/charts/` share a single lifecycle:

```js
function build{Chart}(container, data) {
  const svg  = d3.select(container).append('svg');
  const draw = (width) => { ...render full chart... };
  const ro   = new ResizeObserver(debounce(entries => {
    draw(entries[0].contentRect.width);
  }, 150));
  ro.observe(container);
  return { redraw: draw, destroy: () => ro.disconnect() };
}
```

- Every chart uses `viewBox` + `preserveAspectRatio="xMidYMid meet"` so CSS
  can size them without re-layout.
- Every chart is built lazily on first `IntersectionObserver` intersection
  (`rootMargin: '200px 0px'`).
- Colour rules: focal = `var(--c-accent)` (magenta); context = `#a0b3c7`;
  categorical = the `--c-chart-*` tokens.
- Mobile rules: below 600 px, Manhattan drops chromosome tick labels to every
  5th; Volcano hides inline gene labels and replaces them with tap-dots.

## Error handling

- Firestore unreachable → forum shows a dimmed "Comments unavailable" notice;
  survey falls back to `localStorage` and retries next load.
- Forum post rate-limit: one per 30 s per session; 500-char cap; simple
  profanity screen (client-side).
- D3 data fetch fail → chart container shows a short text fallback quoting
  the headline statistic (e.g. "29 loci · see Jansen et al. 2019") instead of
  an empty SVG.
- Image / asset onerror → swap to neutral placeholder block (no broken-image
  icon). (Not expected to fire — no raster assets in this rebuild.)

## Accessibility

- Every `<svg>` that encodes data has a `role="img"` + `aria-label` with the
  headline finding.
- All tabs keyboard-navigable with ← →, Home/End.
- Focus rings: 2 px magenta outline, 3 px offset, rounded 2 px.
- All scrollytelling effects disabled under `prefers-reduced-motion: reduce`.
- Colour-blind check: magenta + sage-teal dual-accent passes deuteranopia and
  protanopia simulations; red-green users can still distinguish them.
- All tables have `<caption>` and `<th scope>`.
- Targets ≥ 44×44 px on touch devices.

## Testing

Playwright, three viewport profiles (mobile 390×844, tablet 768×1024,
desktop 1440×900), both pages:

1. No horizontal overflow (`scrollWidth ≤ clientWidth + 1`).
2. No `console.error` during full-page scroll (Firestore/fonts noise
   filtered).
3. Hero fits one viewport on `index.html`.
4. Every chart SVG renders ≥ 100 px wide in its active panel/section.
5. Every internal link (`a[href^="/"]`, `a[href$=".html"]`, `a[href^="#"]`)
   resolves without 404.
6. Every tab on `/data` activates its panel; the mobile `<select>` mirror
   switches panels.
7. Survey form submits (Firestore mocked).
8. Full-page screenshot per viewport, saved for visual review.

## Implementation checkpoints

Each ends with a Playwright run that must pass before moving on.

1. **Archive old site** into `archive/2026-04-22-print-editorial/`.
   Scaffold empty new `index.html` / `data.html` / css / js directories.
2. **Tokens + base + layout.** `tokens.css`, `base.css`, `layout.css`
   (nav + footer + section rhythm).
3. **Hero + stat bar** with counter-ups and the gradient halo.
4. **Evidence-card trio** with the three mini-charts inside.
5. **Paradigm-shift section + Why it matters + Aims 2×2** (all static).
6. **Who + footer + contact.**
7. **Survey + forum restyle** (Firestore wiring retained, UI from scratch).
8. **Data explorer scaffold:** nav + tab bar + panels with placeholder
   content.
9. **Overview panel + GWAS panel + snRNA-seq panel** — full charts.
10. **EWCE + Aims + Methods panels.**
11. **Scrollytelling polish** (counter-ups, chart draw-ins, section fades).
12. **Accessibility pass + full Playwright sweep + manual review screenshots.**

## Out of scope

- Microscopy photos / stock imagery.
- A third page or blog.
- Server-side anything (everything stays static + Firebase compat SDK).
- Replacing Firestore with another backend.
- Internationalisation.
