import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Round 2 regression tests: colour contrast, heading order, accessible names,
// non-blocking fonts, lazy Plotly/Firebase, crawlable data.html link, cache headers.

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://flair-ad.netlify.app';
const AXE_SRC = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// The axe tests scroll tall pages and visit every data panel, so they need more than the 30 s default.
test.describe.configure({ timeout: 90_000 });

// Checks that only read files or raw HTTP responses do not depend on the viewport: run them once.
const once = (testInfo) => test.skip(testInfo.project.name !== 'desktop', 'viewport independent, runs once');

// ---------- WCAG contrast helpers ----------

function luminance(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function token(name) {
  const m = read('css/tokens.css').match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  return m && m[1];
}
function sourceFiles(dir) {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sourceFiles(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

// ---------- axe helpers ----------

async function axeViolations(page, rules) {
  if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ content: AXE_SRC });
  const found = await page.evaluate(async (ruleIds) => {
    const res = await window.axe.run(document, {
      runOnly: { type: 'rule', values: ruleIds },
      rules: Object.fromEntries(ruleIds.map((id) => [id, { enabled: true }])),
    });
    return res.violations.flatMap((v) => v.nodes.map((n) => {
      const check = [...n.any, ...n.all, ...n.none][0] || {};
      return `${v.id}: ${n.target.join(' ')} | ${(check.message || '').replace(/\s+/g, ' ').slice(0, 200)}`;
    }));
  }, rules);
  return found;
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const total = document.documentElement.scrollHeight;
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < total; y += step) { window.scrollTo(0, y); await sleep(110); }
    window.scrollTo(0, total);
    await sleep(300);
    window.scrollTo(0, 0);
    await sleep(150);
  });
  await page.waitForTimeout(500);
}

// ---------- Firestore SDK stub (the forum and survey talk to Firebase) ----------

const FB_APP = 'window.firebase = { apps: [], initializeApp(cfg) { this.apps.push(cfg); return {}; } };';
const FB_STORE = `(() => {
  const log = (window.__fs = window.__fs || { writes: [] });
  const posts = [{ id: 'post-1', name: 'Test reader', comment: 'A stubbed forum post', upvotes: 3, downvotes: 1 }];
  const stamp = { toDate: () => new Date(Date.now() - 3600e3), toMillis: () => Date.now() - 3600e3 };
  const db = {
    collection: (col) => ({
      orderBy: () => ({ limit: () => ({ onSnapshot: (ok) => {
        setTimeout(() => ok({ docs: posts.map((p) => ({ id: p.id, data: () => ({ ...p, timestamp: stamp }) })) }), 0);
        return () => {};
      } }) }),
      add: async (doc) => { log.writes.push({ op: 'add', col, doc }); return { id: 'new' }; },
      doc: (id) => ({ update: async (patch) => { log.writes.push({ op: 'update', col, id, patch }); } }),
    }),
  };
  firebase.firestore = () => db;
  firebase.firestore.FieldValue = { serverTimestamp: () => ({ $: 'serverTimestamp' }), increment: (n) => ({ $: 'increment', n }) };
})();`;

async function stubFirebase(page) {
  const requested = [];
  await page.route(/firebasejs\/10\.7\.1\/firebase-app-compat\.js/, (route) => {
    requested.push('app');
    return route.fulfill({ contentType: 'text/javascript', body: FB_APP });
  });
  await page.route(/firebasejs\/10\.7\.1\/firebase-firestore-compat\.js/, (route) => {
    requested.push('firestore');
    return route.fulfill({ contentType: 'text/javascript', body: FB_STORE });
  });
  return requested;
}

async function openPanel(page, name) {
  if (await page.locator('#tab-mobile').isVisible()) await page.selectOption('#tab-mobile', name);
  else await page.click(`#tab-${name}`);
  await expect(page.locator(`#panel-${name}`)).toBeVisible();
  await page.locator(`#panel-${name}`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  if (name === 'methods') {
    // GSAP fades the pipeline steps in from opacity 0; wait until none is part-way through
    await page.waitForFunction(() => [...document.querySelectorAll('.pipeline-step')].every((s) => getComputedStyle(s).opacity === '1'), null, { timeout: 10000 });
  }
}

const PANELS = ['overview', 'gwas', 'snrnaseq', 'ewce', 'aims', 'methods'];

// ======================================================================
// 1. Colour contrast
// ======================================================================

test.describe('colour contrast', () => {
  test('--c-ink-3 meets 4.5:1 on every surface it is used on, and the old grey is gone', async ({}, testInfo) => {
    once(testInfo);
    const ink3 = token('--c-ink-3');
    for (const surface of ['--c-paper', '--c-paper-2', '--c-paper-3']) {
      expect(ratio(ink3, token(surface)), `${ink3} on ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
    const stale = [...sourceFiles('css'), ...sourceFiles('js')].filter((f) => /6a7a8c/i.test(read(f)));
    expect(stale, 'files still using the old #6a7a8c').toEqual([]);
  });

  test('home page has no colour contrast failures (axe)', async ({ page }) => {
    await stubFirebase(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'load' });
    await scrollThrough(page);
    await expect(page.locator('.forum-post').first()).toBeVisible();
    expect(await axeViolations(page, ['color-contrast'])).toEqual([]);
  });

  test('every data page panel has no colour contrast failures (axe)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/data.html', { waitUntil: 'load' });
    const failures = [];
    for (const name of PANELS) {
      await openPanel(page, name);
      failures.push(...(await axeViolations(page, ['color-contrast'])).map((f) => `[${name}] ${f}`));
    }
    expect(failures).toEqual([]);
  });
});

// ======================================================================
// 2. Heading order
// ======================================================================

test.describe('heading order', () => {
  test('home page headings never skip a level (axe)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await scrollThrough(page);
    expect(await axeViolations(page, ['heading-order'])).toEqual([]);
    // the two comparison figures use h3 under the section h2; the footer columns are h2
    expect(await page.locator('#fig-chip-compare h3.chip-compare-title').count()).toBe(2);
    expect(await page.locator('#fig-tipseq h3.tipseq-title').count()).toBe(2);
    expect(await page.locator('footer h2.footer-heading').count()).toBe(3);
    expect(await page.locator('footer h4').count()).toBe(0);
  });

  test('every data page panel keeps headings in order (axe)', async ({ page }) => {
    await page.goto('/data.html', { waitUntil: 'load' });
    const failures = [];
    for (const name of PANELS) {
      await openPanel(page, name);
      failures.push(...(await axeViolations(page, ['heading-order'])).map((f) => `[${name}] ${f}`));
    }
    expect(failures).toEqual([]);
    expect(await page.locator('footer h2.footer-heading').count()).toBe(3);
  });

  test('re-levelled headings look exactly as they did as h4s', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'load' });
    await scrollThrough(page);
    const look = (sel) => page.locator(sel).first().evaluate((el) => {
      const s = getComputedStyle(el);
      const fs = parseFloat(s.fontSize);
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const round = (n) => Math.round(n * 1000) / 1000;
      return {
        rem: round(fs / root), weight: s.fontWeight, lineHeight: round(parseFloat(s.lineHeight) / fs),
        tracking: round(parseFloat(s.letterSpacing) / fs), transform: s.textTransform,
        marginTop: s.marginTop, marginBottom: s.marginBottom, family: s.fontFamily.split(',')[0], wrap: s.textWrap,
      };
    });
    // These values were measured on the h4 versions; the selectors do not depend on the tag name.
    expect(await look('footer .footer-col > :first-child')).toEqual({
      rem: 0.72, weight: '600', lineHeight: 1.1, tracking: 0.14, transform: 'uppercase',
      marginTop: '0px', marginBottom: '12px', family: 'Inter', wrap: 'balance',
    });
    expect(await look('#fig-chip-compare .chip-compare-title')).toEqual({
      rem: 1.25, weight: '700', lineHeight: 1.25, tracking: -0.022, transform: 'none',
      marginTop: '0px', marginBottom: '0px', family: '"Inter Tight"', wrap: 'balance',
    });
    expect(await look('#fig-tipseq .tipseq-title')).toEqual({
      rem: 1.25, weight: '700', lineHeight: 1.25, tracking: -0.01, transform: 'none',
      marginTop: '0px', marginBottom: '0px', family: '"Inter Tight"', wrap: 'balance',
    });
  });
});

// ======================================================================
// 3. Accessible names contain the visible text
// ======================================================================

test.describe('accessible names', () => {
  test('evidence cards and forum vote buttons name themselves from what is on screen (axe)', async ({ page }) => {
    await stubFirebase(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'load' });
    await scrollThrough(page);
    await expect(page.locator('.vote-btn').first()).toBeVisible();
    expect(await axeViolations(page, ['label-content-name-mismatch'])).toEqual([]);

    // cards take their name from their content, so there is no separate aria-label to drift
    for (const card of await page.locator('a.evidence-card').all()) {
      expect(await card.getAttribute('aria-label')).toBeNull();
    }
    // vote buttons say what they do and show the count that is on screen
    const up = page.locator('.vote-btn--up').first();
    const down = page.locator('.vote-btn--down').first();
    expect(await up.getAttribute('aria-label')).toBe('Upvote, 3');
    expect(await down.getAttribute('aria-label')).toBe('Downvote, 1');
  });

  test('on both pages every labelled link or button includes its visible text in its name', async ({ page }) => {
    await stubFirebase(page);
    const mismatches = [];
    for (const file of ['/', '/data.html']) {
      await page.goto(file, { waitUntil: 'load' });
      await scrollThrough(page);
      mismatches.push(...(await page.evaluate((f) => {
        const visibleText = (el) => {
          let out = '';
          const walk = (n) => {
            if (n.nodeType === 3) out += n.textContent;
            else if (n.nodeType === 1 && n.getAttribute('aria-hidden') !== 'true' && !/^(svg|style|script)$/i.test(n.tagName)) n.childNodes.forEach(walk);
          };
          walk(el);
          return out.replace(/\s+/g, ' ').trim().toLowerCase();
        };
        const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
        return [...document.querySelectorAll('a[aria-label], button[aria-label]')].flatMap((el) => {
          const text = norm(visibleText(el));
          const label = norm(el.getAttribute('aria-label'));
          return text && !label.includes(text) ? [`${f} ${el.tagName.toLowerCase()}.${el.className}: label "${el.getAttribute('aria-label')}" lacks "${text}"`] : [];
        });
      }, file)));
    }
    expect(mismatches).toEqual([]);
  });
});

// ======================================================================
// 4. Google Fonts CSS does not block painting
// ======================================================================

test.describe('fonts', () => {
  const URLS = { 'index.html': '/', 'data.html': '/data.html', '404.html': '/404.html' };
  for (const file of Object.keys(URLS)) {
    test(`${file}: font CSS is preloaded with a noscript fallback, not a blocking stylesheet`, async ({}, testInfo) => {
      once(testInfo);
      const html = read(file);
      const withoutNoscript = html.replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
      const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([a-z-]+)=("([^"]*)"|'([^']*)')/gi)].map((m) => [m[1].toLowerCase(), m[3] ?? m[4]]));
      const blocking = (withoutNoscript.match(/<link\b[^>]*>/g) || [])
        .filter((t) => { const a = attrs(t); return a.rel === 'stylesheet' && /fonts\.googleapis\.com/.test(a.href || ''); });
      expect(blocking, 'render-blocking Google Fonts stylesheet links').toEqual([]);

      const preload = withoutNoscript.match(/<link[^>]*rel=["']preload["'][^>]*>/g).find((t) => t.includes('fonts.googleapis.com/css2'));
      expect(preload, 'preload link for the font CSS').toBeTruthy();
      expect(preload).toMatch(/as=["']style["']/);
      expect(preload).toMatch(/onload=["']this\.onload=null;this\.rel='stylesheet'["']/);
      const url = preload.match(/href=["']([^"']+)["']/)[1];
      expect(url).toContain('display=swap');

      const noscript = html.match(/<noscript>\s*<link[^>]*>\s*<\/noscript>/g).find((t) => t.includes('fonts.googleapis.com'));
      expect(noscript, 'noscript fallback').toBeTruthy();
      expect(noscript).toContain(`href="${url}"`);
      expect(noscript).toMatch(/rel=["']stylesheet["']/);

      expect(html).toContain('<link rel="preconnect" href="https://fonts.googleapis.com"');
      expect(html).toMatch(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin/);
    });

    test(`${file}: the preloaded font CSS turns into a stylesheet once it arrives`, async ({ page }, testInfo) => {
      once(testInfo);
      await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: '.font-css-stub{color:red}' }));
      await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
      await page.goto(URLS[file], { waitUntil: 'load' });
      await expect.poll(() => page.evaluate(() => {
        const l = document.querySelector('link[href*="fonts.googleapis.com/css2"]');
        return l ? l.rel : null;
      })).toBe('stylesheet');
    });
  }
});

// ======================================================================
// 5. Plotly is not loaded; Firebase waits until it is needed
// ======================================================================

test.describe('lazy third-party scripts', () => {
  test('data page does not load Plotly (no chart uses it) and every chart still renders', async ({ page }) => {
    const requests = [];
    page.on('request', (r) => requests.push(r.url()));
    await page.goto('/data.html', { waitUntil: 'load' });
    await page.waitForTimeout(800);
    expect(requests.filter((u) => /plot\.ly|plotly/i.test(u))).toEqual([]);
    expect(await page.locator('script[src*="plot"]').count()).toBe(0);
    expect(await page.evaluate(() => typeof window.Plotly)).toBe('undefined');

    await expect(page.locator('#fig-convergence svg').first()).toBeVisible({ timeout: 15000 });
    await openPanel(page, 'gwas');
    await expect(page.locator('#chart-manhattan-full svg')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#loci-tbody tr').first()).toBeVisible();
    await openPanel(page, 'snrnaseq');
    for (const id of ['chart-volcano-full', 'chart-degbar', 'chart-qc', 'chart-deg-table']) {
      await expect(page.locator(`#${id} svg`).first(), id).toBeVisible({ timeout: 15000 });
    }
    await openPanel(page, 'ewce');
    await expect(page.locator('#chart-ewce-full svg')).toBeVisible({ timeout: 15000 });
    await openPanel(page, 'aims');
    await expect(page.locator('#fig-aims-gantt svg')).toBeVisible({ timeout: 15000 });
    await openPanel(page, 'methods');
    await expect(page.locator('#fig-pipeline > *').first()).toBeVisible({ timeout: 15000 });
  });

  test('home page does not fetch Firebase until the survey or forum is near the viewport', async ({ page }) => {
    const requested = await stubFirebase(page);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    expect(requested, 'Firebase SDK requested at load').toEqual([]);
    expect(await page.evaluate(() => typeof window.firebase)).toBe('undefined');
    expect(await page.locator('script[src*="firebasejs"]').count()).toBe(0);
    // the survey and the forum composer are still on the page, ready to type into
    await expect(page.locator('#share-form-inner')).toBeAttached();
    await expect(page.locator('#forum-comment')).toBeAttached();

    await page.locator('#share').scrollIntoViewIfNeeded();
    await expect.poll(() => requested.slice().sort().join(',')).toBe('app,firestore');
    await expect(page.locator('.forum-post')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('typing into the forum or survey loads Firebase even if the page was never scrolled there', async ({ page }) => {
    const requested = await stubFirebase(page);
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(600);
    expect(requested).toEqual([]);
    await page.locator('#forum-comment').dispatchEvent('focusin');
    await expect.poll(() => requested.length).toBe(2);
  });

  test('survey, posting and voting still work through the lazily loaded SDK', async ({ page }) => {
    await stubFirebase(page);
    await page.goto('/', { waitUntil: 'load' });
    await page.locator('#forum').scrollIntoViewIfNeeded();
    await expect(page.locator('.forum-post')).toHaveCount(1);
    await expect(page.locator('#forum-count')).toHaveText('1 community thought');
    const writes = () => page.evaluate(() => window.__fs.writes);

    // vote
    await page.locator('.vote-btn--up').first().click();
    await expect.poll(async () => (await writes()).length).toBe(1);
    expect((await writes())[0]).toMatchObject({ op: 'update', col: 'forum_posts', id: 'post-1', patch: { upvotes: { $: 'increment', n: 1 } } });
    await expect(page.locator('.vote-btn--up').first()).toHaveAttribute('aria-label', 'Upvote, 4');
    await expect(page.locator('.vote-btn--up').first()).toBeDisabled();

    // post
    await page.fill('#forum-name', 'Reviewer');
    await page.fill('#forum-comment', 'Looks promising.');
    await page.click('#forum-submit');
    await expect.poll(async () => (await writes()).length).toBe(2);
    expect((await writes())[1]).toMatchObject({ op: 'add', col: 'forum_posts', doc: { name: 'Reviewer', comment: 'Looks promising.', upvotes: 0, downvotes: 0 } });

    // survey
    await page.locator('#share').scrollIntoViewIfNeeded();
    await page.fill('#reflective-answer', 'The role of TREM2.');
    await page.check('input[name="q_nav"][value="easy"]');
    await page.check('input[name="q_section"][value="aims"]');
    await page.click('#share-submit');
    await expect(page.locator('#share-thankyou')).toBeVisible();
    const survey = (await writes())[2];
    expect(survey).toMatchObject({ op: 'add', col: 'feedback', doc: { reflective_answer: 'The role of TREM2.', q_nav: 'easy', q_section: 'aims', q_clarity: null } });
  });

  test('if Firebase cannot be loaded the forum says so instead of waiting forever', async ({ page }) => {
    await page.route(/firebasejs\/10\.7\.1\//, (route) => route.abort());
    await page.goto('/', { waitUntil: 'load' });
    await page.locator('#forum').scrollIntoViewIfNeeded();
    await expect(page.locator('#forum-feed')).toContainText('Could not load posts');
  });
});

// ======================================================================
// 6. data.html is linked from the home page HTML itself
// ======================================================================

test.describe('crawlable links', () => {
  const anchors = (html) => [...html.matchAll(/<a\b[^>]*?\bhref=("|')(.*?)\1/gi)].map((m) => m[2]);

  test('home page HTML (no JavaScript) links to the canonical data.html, including one absolute link', async ({ request }, testInfo) => {
    once(testInfo);
    const html = await (await request.get('/')).text();
    const hrefs = anchors(html);
    const resolved = hrefs.map((h) => { try { return new URL(h, `${ORIGIN}/`).href; } catch { return ''; } });
    expect(resolved).toContain(`${ORIGIN}/data.html`);
    // Netlify's Pretty URLs setting rewrites relative data.html links to /data in the served HTML;
    // an absolute link to the canonical URL is left alone, so the crawl always finds it.
    expect(hrefs).toContain(`${ORIGIN}/data.html`);
  });

  test('netlify.toml switches Pretty URLs off so links keep their .html', async ({}, testInfo) => {
    once(testInfo);
    const toml = read('netlify.toml');
    expect(toml).toMatch(/\[build\.processing\.html\]\s*[\r\n]+\s*pretty_urls\s*=\s*false/);
  });

  test('data page links back to the canonical home page URL, not index.html', async ({ request }, testInfo) => {
    once(testInfo);
    const hrefs = anchors(await (await request.get('/data.html')).text());
    expect(hrefs.filter((h) => /(^|\/)index\.html/.test(h))).toEqual([]);
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/#forum');
  });
});

// ======================================================================
// 7. Cache headers (Netlify _headers)
// ======================================================================

test.describe('cache headers', () => {
  test('static files cache for a day and must revalidate after that', async ({ request }, testInfo) => {
    once(testInfo);
    const files = ['/css/tokens.css', '/css/layout.css', '/js/main.js', '/js/charts/util.js', '/js/figures/aims-gantt.js',
      '/data/gwas_loci.json', '/data/qc_stats.json', '/og.png', '/apple-touch-icon.png', '/favicon.ico', '/favicon.svg'];
    for (const f of files) {
      const r = await request.get(f);
      expect(r.status(), f).toBe(200);
      expect(r.headers()['cache-control'], f).toBe('public, max-age=86400, must-revalidate');
    }
  });

  test('HTML and crawl files keep revalidating on every visit', async ({ request }, testInfo) => {
    once(testInfo);
    for (const f of ['/', '/index.html', '/data.html', '/404.html', '/robots.txt', '/sitemap.xml']) {
      const cc = (await request.get(f)).headers()['cache-control'] || '';
      expect(cc, f).toMatch(/max-age=0\b/);
      expect(cc, f).toContain('must-revalidate');
    }
  });

  test('every local CSS/JS URL is versioned (?v=) so a day of caching can never serve a changed file stale', async ({}, testInfo) => {
    once(testInfo);
    const refs = (file) => [...read(file).matchAll(/(?:href|src)="\/?((?:css|js)\/[^"]+)"/g)].map((m) => m[1]);
    for (const file of ['index.html', 'data.html', '404.html']) {
      expect(refs(file).filter((r) => !/\?v=\d+$/.test(r)), `unversioned assets in ${file}`).toEqual([]);
    }
    // shared files use one URL everywhere, so a visitor downloads each of them once
    const home = refs('index.html');
    for (const file of ['data.html', '404.html']) {
      for (const r of refs(file)) {
        const same = home.find((h) => h.split('?')[0] === r.split('?')[0]);
        if (same) expect(r, `${file} should use the same URL as index.html`).toBe(same);
      }
    }
  });
});
