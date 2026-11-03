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
