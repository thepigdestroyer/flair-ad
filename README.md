# FLAIR-AD — Public Site

**F**lag-tag **L**inear-**A**mplification **IR**F-binding in **A**lzheimer's **D**isease

A public-facing companion site for a proposed 4-year PhD at the **UK Dementia Research Institute at Imperial College London** (Skene Lab). The project maps where IRF1 — a candidate master-regulator transcription factor — binds across microglial states, and connects those binding sites to Alzheimer's genetic risk.

**Live site → [flair-ad.netlify.app](https://flair-ad.netlify.app)**

---

## Pages

| File | Audience | Purpose |
|------|----------|---------|
| `index.html` | General public | Plain-language story of the science |
| `data.html` | Scientists / collaborators | Evidence dashboard with interactive charts |
| `404.html` | Anyone on a bad URL | Styled not-found page (Netlify serves it with a 404 status) |

Crawl and sharing files at the root: `robots.txt`, `sitemap.xml`, the IndexNow key file (`<key>.txt`), `og.png` (1200x630 social card), `apple-touch-icon.png`, `favicon.ico`, `favicon.svg`. Canonical URLs are `https://flair-ad.netlify.app/` and `https://flair-ad.netlify.app/data.html`; keep the sitemap in step with them.

### `index.html` — public page covers

- What microglia are and the three cell states (Gardener · Alarmed · Disease-associated / DAM)
- Why IRF1 is a candidate master regulator upstream of AD risk genes (ApoE4, TREM2, …)
- The antibody specificity problem and how CETCh-seq (FLAG-tagging via Prime Editing) solves it
- How TIP-seq maps chromatin-bound proteins without PCR bias
- The four research aims and timeline
- Why this work belongs in the Skene Lab

### `data.html` — scientist view covers

- EWCE enrichment showing microglial specificity of AD genetic risk
- Manhattan plot of Bellenguez 2022 GWAS loci
- Quality-control statistics
- Differential expression volcano

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| HTML/CSS/JS | Vanilla — no framework, no build step |
| Charts | D3.js (EWCE bar, Manhattan, volcano, QC gauges) |
| Figures | Custom SVG (IIFEs injected on `DOMContentLoaded`) |
| Animations | GSAP + ScrollTrigger |
| Community | Firebase Firestore (forum + survey) |
| Hosting | Netlify (manual deploys, see Deployment) |
| Tests | Playwright |

---

## Repository structure

```
├── index.html                  Public site
├── data.html                   Scientist view
│
├── css/
│   ├── tokens.css              Design tokens (colour, spacing, type scale)
│   ├── base.css                Resets and body defaults
│   ├── layout.css              Page shell, nav, footer, section rhythm
│   ├── components.css          Cards, pills, buttons, stat bar, explainers
│   ├── charts.css              Figure containers and chart-specific styles
│   ├── scrollytelling.css      Scroll-driven animation styles
│   └── data-page.css           data.html–specific overrides
│
├── js/
│   ├── main.js                 Page bootstrap (counters, tabs, nav toggle)
│   ├── community.js            Firebase forum integration
│   ├── scrollytelling.js       Scroll-driven section logic
│   ├── tabs.js                 Tab component
│   ├── counters.js             Animated stat counters
│   ├── hero-halo.js            Hero background animation
│   │
│   ├── figures/                SVG figures — one IIFE per figure
│   │   ├── microglia-state.js  Three-state cell diagram (Alarmed ← Gardener → DAM)
│   │   ├── microglia-primer.js Brain-zoom / microglia anatomy animation
│   │   ├── irf1-hub.js         Hub-and-spoke: IRF1 → enhancers → AD risk genes
│   │   ├── causal-chain.js     SNP → enhancer → gene expression → cell state chain
│   │   ├── convergence.js      Evidence convergence panel
│   │   ├── chip-compare.js     ChIP-seq antibody problem vs CETCh-seq solution
│   │   ├── cetseq-flow.js      CETCh-seq workflow diagram
│   │   ├── tipseq.js           TIP-seq explainer panels
│   │   ├── tipseq-flow.js      Five-step TIP-seq workflow
│   │   ├── aims-gantt.js       Four-aim Gantt timeline
│   │   ├── aims-icons.js       Per-aim SVG mini-icons
│   │   └── pipeline.js         Lab pipeline overview
│   │
│   └── charts/                 D3 charts (data.html only)
│       ├── util.js             Shared palette and resize observer
│       ├── ewce.js             EWCE cell-type enrichment bar chart
│       ├── manhattan.js        GWAS Manhattan plot
│       ├── volcano.js          DEG volcano plot
│       ├── qc.js               QC gauge charts
│       ├── cell-types.js       Cell-type panel
│       └── data-page.js        data.html bootstrap
│
├── data/                       JSON consumed by D3 charts
│   ├── ewce_scores.json
│   ├── gwas_loci.json
│   ├── degs_table2.json
│   └── qc_stats.json
│
└── tests/                      Playwright visual tests
    ├── site.spec.js
    ├── playwright.config.js
    └── package.json
```

---

## Running locally

Any static file server works — no build step required.

**Option A — npx serve**
```bash
npx serve .
# → http://localhost:3000
```

**Option B — Python**
```bash
python -m http.server 5173
# → http://localhost:5173
```

**Option C — VS Code Live Server**  
Right-click `index.html` → *Open with Live Server*

> **Note:** the community forum (`js/community.js`) talks to Firebase. It will work read-only without credentials. A `firebase.json` config is intentionally excluded from this repo — contact the maintainer if you need write access for local testing.

---

## Running tests

`tests/serve.mjs` is a static server that mimics Netlify (unknown paths return `404.html` with status 404). `seo.spec.js` checks titles, descriptions, canonicals, Open Graph, JSON-LD, robots, sitemap, the IndexNow key and the 404.

```bash
node tests/serve.mjs &        # http://127.0.0.1:8000
cd tests
npm install
npx playwright install --with-deps chromium
npm test
```

---

## Deployment

The Netlify site (`flair-ad`, team "ARUK PhD Website") is **not** connected to this repo, so a push does not deploy. Deploy by hand: zip the site files, which are `index.html`, `data.html`, `404.html`, `robots.txt`, `sitemap.xml`, the IndexNow key `.txt`, `og.png`, `apple-touch-icon.png`, `favicon.ico`, `favicon.svg`, `css/`, `js/` and `data/` (for example `git archive --format=zip -o site.zip HEAD index.html data.html 404.html robots.txt sitemap.xml b3e3066c7789b0706e31f432ae6f20bf.txt og.png apple-touch-icon.png favicon.ico favicon.svg css js data`) and drop it on the project's Deploys page, or use `netlify deploy --prod`. There is no build step.

---

## Design system

The site uses a small set of CSS custom properties defined in `css/tokens.css`:

| Token | Value | Use |
|-------|-------|-----|
| `--c-accent` / `--c-focal` | `#c2185b` | Pink accent — headings, GWAS highlights, IRF1 |
| `--c-ink` | `#0a2540` | Near-black body text |
| `--c-paper` | `#ffffff` | Page background |
| `--c-paper-2` | `#f6f8fb` | Alternate section background |
| `--f-display` | Inter Tight | Display headings |
| `--f-body` | Inter | Body copy |
| `--f-mono` | JetBrains Mono | Gene names, code labels |

---

*UK Dementia Research Institute · Imperial College London · Skene Lab*
