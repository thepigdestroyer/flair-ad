import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ORIGIN = 'https://flair-ad.netlify.app';
const ROOT = path.resolve(__dirname, '..');
const KEY = 'b3e3066c7789b0706e31f432ae6f20bf';
const PAGES = [
  { file: '/', canonical: `${ORIGIN}/` },
  { file: '/data.html', canonical: `${ORIGIN}/data.html` },
];

for (const pg of PAGES) {
  test.describe(`SEO head ${pg.file}`, () => {
    test('head, canonical, social tags, JSON-LD, one h1', async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      const resp = await page.goto(pg.file, { waitUntil: 'domcontentloaded' });
      expect(resp.status()).toBe(200);
      await page.waitForLoadState('load').catch(() => {});

      const title = await page.title();
      expect(title.length).toBeLessThanOrEqual(60);
      const meta = (sel) => page.locator(sel).first().getAttribute('content');
      const desc = await meta('meta[name="description"]');
      expect(desc.length).toBeGreaterThanOrEqual(140);
      expect(desc.length).toBeLessThanOrEqual(160);
      expect(await page.locator('html').getAttribute('lang')).toBe('en-GB');
      expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(pg.canonical);
      expect(await page.locator('h1').count()).toBe(1);

      expect(await meta('meta[property="og:url"]')).toBe(pg.canonical);
      expect(await meta('meta[property="og:title"]')).toBe(title);
      expect(await meta('meta[property="og:description"]')).toBe(desc);
      expect(await meta('meta[property="og:image"]')).toBe(`${ORIGIN}/og.png`);
      expect(await meta('meta[property="og:image:width"]')).toBe('1200');
      expect(await meta('meta[property="og:image:height"]')).toBe('630');
      expect(await meta('meta[property="og:locale"]')).toBe('en_GB');
      expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
      expect(await meta('meta[name="twitter:image"]')).toBe(`${ORIGIN}/og.png`);
      expect(await page.locator('link[rel="apple-touch-icon"]').count()).toBe(1);

      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(blocks.length).toBeGreaterThan(0);
      const nodes = blocks.flatMap((b) => JSON.parse(b)['@graph']);
      const types = nodes.map((n) => n['@type']);
      expect(types).toContain('WebPage');
      if (pg.file === '/') {
        expect(types).toContain('WebSite');
        expect(types).toContain('CreativeWork');
        const work = nodes.find((n) => n['@type'] === 'CreativeWork');
        expect(work.author['@id']).toBe('https://mrinal.is-a.dev/#person');
        expect(work.inLanguage).toBe('en-GB');
      } else {
        expect(types).toContain('BreadcrumbList');
      }

      await expect(page.locator('footer a[rel="author"][href="https://mrinal.is-a.dev/"]').first()).toBeVisible();
      expect(errors).toEqual([]);
    });
  });
}

test('robots, sitemap, IndexNow key, icons and OG image exist and agree', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  const sm = await (await request.get('/sitemap.xml')).text();
  for (const pg of PAGES) expect(sm).toContain(`<loc>${pg.canonical}</loc>`);
  expect((sm.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) || []).length).toBe(PAGES.length);
  expect((await (await request.get(`/${KEY}.txt`)).text()).trim()).toBe(KEY);
  for (const f of ['/og.png', '/apple-touch-icon.png', '/favicon.ico', '/favicon.svg']) {
    expect((await request.get(f)).status(), f).toBe(200);
  }
  const png = fs.readFileSync(path.join(ROOT, 'og.png'));
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

test('unknown paths return the styled 404', async ({ request }) => {
  const r = await request.get('/definitely-not-a-page');
  expect(r.status()).toBe(404);
  expect(await r.text()).toContain('Page not found');
});

const EXPANSION = "Flag-tag Linear-Amplification IRF-binding in Alzheimer's Disease";

test.describe('Content consistency', () => {
  test('acronym expansion and deRoute link (unchanged) are consistent on both pages', async ({ page }) => {
    for (const file of ['/', '/data.html']) {
      await page.goto(file, { waitUntil: 'domcontentloaded' });
      const html = await page.content();
      expect(html).not.toContain('Functional Landscape');
      expect(html).not.toContain('deroute.is-an.ai');
      expect(await page.locator('.footer-brand p').innerText()).toContain(EXPANSION);
      expect(await page.locator('.footer-more a[href="https://drouter-demo.vercel.app/"]').count()).toBe(1);
    }
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const ld = await page.locator('script[type="application/ld+json"]').first().innerText();
    expect(ld).toContain(EXPANSION);
  });

  test('data page timeline matches the home page Gantt', async ({ page }) => {
    await page.goto('/data.html', { waitUntil: 'load' });
    await expect(page.locator('[data-aims-span]')).toHaveText('2026 Q4 → 2030 Q3');
    const ranges = await page.locator('[data-aim-range]').allInnerTexts();
    expect(ranges).toEqual([
      '2026 Q4 → 2027 Q3', '2027 Q4 → 2028 Q3', '2028 Q4 → 2029 Q3', '2029 Q4 → 2030 Q3',
    ]);
  });

  test('microglial loci count is computed from the JSON', async ({ page }) => {
    await page.goto('/data.html', { waitUntil: 'load' });
    const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/gwas_loci.json'), 'utf8'));
    const linked = rows.filter((d) => d.linked);
    const genes = new Set(linked.map((d) => d.nearestGene)).size;
    await expect(page.locator('.stat-num[data-linked-loci]')).toHaveText(String(linked.length));
    await expect(page.locator('[data-linked-genes]')).toHaveText(String(genes));
    expect(linked.length).toBe(19);
    expect(genes).toBe(16);
    expect(await page.content()).not.toContain('~17');
  });
});
