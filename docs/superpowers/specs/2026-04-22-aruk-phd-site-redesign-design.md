# ARUK PhD Website — Redesign Spec

Date: 2026-04-22
Author: Mrinal Joshi (with Claude)
Status: Approved

## Context

Static pitch site for an Alzheimer's Research UK PhD scholarship on microglial
enhancers and IRF1 in Alzheimer's. Two pages: a public narrative (`index.html`)
and a scientist-facing data explorer (`scientist.html`). Vanilla HTML/CSS/JS
with D3, Scrollama, Flubber, and Firebase (Firestore) for a feedback survey and
a small community forum.

The current build is functional on desktop but buggy on mobile: `100vh` traps,
hard-coded `420px` SVG heights, sticky + `55vh` scrollytelling blocks that
leave no room for step text on narrow screens, D3 charts using a `668px`
fallback width when `clientWidth` returns 0. Overall aesthetic (GitHub-dark
with teal/orange) reads as "dashboard", not "scholarship pitch".

The redesign keeps every current feature but shifts the visual direction to a
print-editorial style and restructures the scrollytelling so it degrades
gracefully on mobile.

## Goals

1. Replace the dark-editorial theme with a print-editorial (cream + coral)
   palette that reads as a science magazine essay.
2. Remove every mobile layout bug: no horizontal overflow, no trapped pin
   sections, no 0-width charts.
3. Keep every functional feature (two pages, all charts, all scrollytelling
   beats, all Firebase wiring, the community forum, the survey).
4. Make the site Playwright-verifiable: a single script runs mobile/tablet/
   desktop and fails on overflow, console errors, broken charts, or missing
   scrollytelling state.

## Non-goals

- Not rewriting any D3 chart logic from scratch (only adjusting resize and
  responsive behaviour).
- Not introducing a build step, bundler, framework, or npm dependency for the
  site itself (Playwright is a dev-only dep).
- Not changing Firebase project config or data schemas.
- Not adding new content sections beyond what exists.

## Visual direction

**Theme:** Print-editorial (cream paper background, serif display type, drop
caps on chapter openers).

**Palette (tokens):**

```
--c-paper:    #f5f1e8
--c-paper-2:  #ece6d5
--c-ink:      #1a1a1a
--c-ink-2:    #4a4a4a
--c-ink-3:    #8a8a82
--c-rule:     rgba(26,26,26,0.12)
--c-coral:    #b04a3e   (primary accent)
--c-coral-2:  #8e3a31   (coral pressed)
--c-coral-wash: rgba(176,74,62,0.08)
--c-sage:     #607d5a   (secondary chart accent only)
```

Contrast: coral/cream = 4.9:1 (WCAG AA body, AAA large); ink/cream = 16:1
(AAA).

**Typography:**

- Display + headings: `Fraunces` (Google Fonts, variable, opsz 144 at hero,
  opsz 48 at h2/h3).
- Body + UI: `Inter` (variable).
- Mono for gene symbols and loci: `ui-monospace`, `'JetBrains Mono'`, Menlo.
- Drop caps: hero lede and chapter openers only. Not every paragraph.

**Spacing (8-pt rhythm):** tokens `--s-1` (4px) through `--s-9` (96px); prose
column capped at `66ch` (~680px); full-bleed sections at `1040px`.

**Motion:** `--dur-1` 150ms (hover), `--dur-2` 260ms (cards/reveals), `--dur-3`
500ms (scrollytelling). Easing `cubic-bezier(.2,.6,.2,1)`. All animations
respect `prefers-reduced-motion: reduce`.

## Architecture

Static site, zero build step. CDN dependencies stay on CDN (D3 v7, Scrollama
3.2, Flubber 0.4, Firebase 10.7 compat, Google Fonts).

### File layout

```
ARUK_PhD_Website/
├─ index.html
├─ scientist.html
├─ css/
│   ├─ tokens.css          design tokens only
│   ├─ base.css            reset, typography, prose, links
│   ├─ components.css      nav, hero, cards, pills, charts, forms, forum, tabs
│   ├─ scrollytelling.css  desktop pin + mobile swipe-rail
│   └─ pages.css           page-specific overrides
├─ js/
│   ├─ main.js             entry, nav, smooth scroll
│   ├─ scrolly.js          desktop pin + mobile swipe driver
│   ├─ charts.js           D3 charts with ResizeObserver debounce
│   ├─ brain-svg.js        unchanged
│   ├─ prequel-svg.js      unchanged
│   ├─ community.js        forum + survey, unchanged wiring
│   └─ util.js             shared debounce, viewport helpers
├─ data/                   unchanged (gwas_loci, degs_table2, ewce_scores, qc_stats)
├─ images/                 unchanged
├─ assets/                 unchanged
└─ tests/
    ├─ playwright.config.js
    └─ site.spec.js
```

### Page structure — `index.html`

1. Header (sticky, backdrop-blur) — wordmark + `Story · Scientist · Forum`.
2. Hero — Fraunces display h1 + drop-cap lede. Sized with `dvh` not `vh`.
3. Paradigm shift — two-column editorial: amyloid era vs. microglia era.
4. Prequel primer — 5-slide scrollytelling (S3 hybrid).
5. Evidence 1 · GWAS — Manhattan + 3 steps (S3 hybrid).
6. Evidence 2 · Single-cell — brain-map + 3 steps (S3 hybrid).
7. Evidence 3 · Differential expression — volcano + 3 steps (S3 hybrid).
8. Evidence 4 · EWCE — bar chart + 2 steps (S3 hybrid).
9. The bottleneck — static prose with pull-quote.
10. The solution — static 3-step diagram (Prime editing + CETCh-seq).
11. Aims — 4 aim cards, progress pills.
12. Closing + evidence pillars + FAQ (accordion).
13. Share your thoughts — Firestore survey form.
14. Community forum — Firestore posts + voting + composer.
15. Footer.

### Page structure — `scientist.html`

1. Header (+ back-to-story).
2. Overview — 4 summary stats + rationale + refs.
3. GWAS — Manhattan + sortable loci table.
4. snRNA-seq — volcano + DEG table + QC panel + pseudoreplication scatter.
5. EWCE — heatmap + method notes.
6. Aims — status table + per-aim accordions + clearly-labelled placeholders.
7. Methods — prose.

Tabs render as a pill row on desktop; collapse to a `<select>` dropdown below
768px.

## Scrollytelling (S3 hybrid)

Each block declared once as:

```js
{
  id: 'gwas',
  title: 'How risk hides in the genome',
  chart: 'manhattan',
  steps: [
    { caption: '76 loci linked to late-onset Alzheimer's.', focus: { ... } },
    ...
  ]
}
```

`scrolly.js` inspects `matchMedia('(min-width: 900px)')`:

- **Desktop:** sticky graphic (`position: sticky; top: var(--nav-h); height:
  min(70dvh, 700px)`), prose steps stack beside. Scrollama triggers
  `chart.focus(stepIndex)`.
- **Mobile:** same steps rendered as a horizontal rail
  (`overflow-x: auto; scroll-snap-type: x mandatory`). Each step is a
  self-contained card with its own mini-chart + caption. Dots below the rail
  track active step via `IntersectionObserver`.

On viewport crossing the 900px threshold, debounced 200ms, the block
re-renders into the other mode and fires `scrolly:re-render` so D3 charts
re-measure.

## Charts

All D3 charts in `charts.js`:

- Wrap each chart container in a `ResizeObserver`, debounced 150ms.
- Use `viewBox` + `preserveAspectRatio="xMidYMid meet"` so SVGs scale without
  re-layout until container crosses a breakpoint.
- Lazy-render on first intersection with `rootMargin: '200px 0px'` — charts
  below the fold no longer render at page load.
- Mobile adaptations: Manhattan reduces chromosome ticks to every 5th below
  600px; volcano drops gene-label annotations below 600px (tap-to-see
  replacement).
- Colour rules: `--c-coral` for focal/selected/up-regulated,
  `--c-ink-3` for context/grey dots, `--c-sage` only when a second category is
  needed.

## Error handling

- Firestore unreachable: forum renders "Comments temporarily unavailable"
  notice; survey falls back to `localStorage` with retry on next load.
- Forum spam mitigation: client-side cooldown (one post per 30s per session),
  500-char cap, simple profanity filter.
- Voting: optimistic UI, rollback on Firestore write failure.
- Image `onerror`: swap to neutral placeholder block.
- `data/*.json` fetch failure: chart container falls back to a text headline
  stat instead of an empty SVG.

## Accessibility

- Scrollytelling steps remain in linear DOM order regardless of pin/swipe
  presentation.
- `prefers-reduced-motion: reduce` disables scroll-triggered chart
  transitions, Flubber morphs, and prequel SVG animation (replaced with static
  final-state frames).
- All focusable elements have a visible coral focus ring.
- Scientist tabs navigable with ← →.
- Every chart `<svg>` has an `aria-label` with its headline finding.
- Tables have `<caption>` and `<th scope>`.

## Testing

Playwright with three viewport profiles: iPhone 13 Pro (390×844), tablet
(768×1024), desktop (1440×900).

Per profile, per page:

1. No horizontal overflow (`scrollWidth <= clientWidth`).
2. No `console.error` during a full-page scroll.
3. Hero fits one viewport.
4. Every `svg` inside a `.chart` container renders at >100px width.
5. Scrollytelling in correct mode (sticky vs. rail) for the viewport.
6. Every internal link navigates without 404 or JS error.
7. Survey form fills + submits (Firestore mocked).
8. Full-page screenshot saved for visual diff.

Manual spot-check after Playwright: scroll feel, transitions on throttled CPU,
typography hierarchy readable at arm's length.

## Implementation checkpoints

Each checkpoint ends with a Playwright run that must pass before proceeding.

1. Test harness + Playwright config + smoke test against current site.
2. Design tokens (`tokens.css`) + base styles (`base.css`).
3. CSS split + re-wire `<link>` order in both HTML pages.
4. Header/nav + footer + page skeleton.
5. Hero restyle (both pages).
6. Static editorial sections restyle (paradigm, bottleneck, solution, aims,
   FAQ, closing, pillars).
7. Scrollytelling CSS + JS refactor (S3 hybrid, both modes).
8. Chart restyle + responsive/resize handling + lazy-load.
9. Scientist page tabs/sections restyle + mobile tab dropdown.
10. Forms (survey + forum) restyle and error-state polish.
11. Accessibility pass (reduced motion, focus rings, aria-labels).
12. Final Playwright run (all three viewports, both pages) + manual review.

## Out of scope / explicitly deferred

- Replacing Fraunces/Inter with any other font pairing.
- Adding new content sections (publications timeline, BlueSky feed, PDF
  download).
- Replacing the community forum with any alternative.
- Adding a build step / bundler.
- Visual-regression diffing in CI (screenshots saved manually for now).
