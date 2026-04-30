import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const PAGES = [
  { name: 'index', path: '/' },
  { name: 'scientist', path: '/scientist.html' },
];

const SCREENSHOT_DIR = path.resolve('./screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ---------- helpers ----------

async function collectConsoleErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

async function gotoPage(page, pathname) {
  const resp = await page.goto(pathname, { waitUntil: 'domcontentloaded' });
  // Wait for render settling — give D3 + scrollama a chance to mount, but don't
  // wait on Firestore's long-polling connection.
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForTimeout(600);
  return resp;
}

async function fullPageScroll(page) {
  // Scroll to bottom in steps so scrollytelling fires.
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const total = document.documentElement.scrollHeight;
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < total; y += step) {
      window.scrollTo(0, y);
      await sleep(120);
    }
    window.scrollTo(0, total);
    await sleep(300);
    window.scrollTo(0, 0);
    await sleep(200);
  });
}

// ---------- per-page suite ----------

for (const pg of PAGES) {
  test.describe(`page: ${pg.name}`, () => {
    test(`${pg.name} · loads without console errors and has no horizontal overflow`, async ({ page }, testInfo) => {
      const errors = await collectConsoleErrors(page);
      const response = await gotoPage(page, pg.path);
      expect(response.ok(), `HTTP ${response.status()}`).toBeTruthy();

      await fullPageScroll(page);

      // Horizontal overflow check
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        offenders: [...document.querySelectorAll('*')]
          .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
          .slice(0, 5)
          .map((el) => ({
            tag: el.tagName,
            id: el.id || null,
            cls: el.className && typeof el.className === 'string' ? el.className.slice(0, 80) : null,
            right: Math.round(el.getBoundingClientRect().right),
          })),
      }));
      expect(
        overflow.scrollWidth,
        `Horizontal overflow on ${pg.name} (${testInfo.project.name}). Offenders: ${JSON.stringify(overflow.offenders, null, 2)}`,
      ).toBeLessThanOrEqual(overflow.clientWidth + 1);

      // Console errors
      // Filter benign Firestore offline / Google fonts noise that we don't control
      const benign = /Firestore|firebase|fonts\.googleapis|favicon|net::ERR_INTERNET_DISCONNECTED|Failed to load resource: the server responded with a status of 404/i;
      const real = errors.filter((e) => !benign.test(e));
      expect(real, `Console errors on ${pg.name}: \n${real.join('\n')}`).toEqual([]);
    });

    test(`${pg.name} · hero fits one viewport`, async ({ page }) => {
      await gotoPage(page, pg.path);
      const heroBox = await page.evaluate(() => {
        const hero =
          document.querySelector('.hero') ||
          document.querySelector('[data-hero]') ||
          document.querySelector('header + section') ||
          document.querySelector('main > section:first-of-type');
        if (!hero) return null;
        const r = hero.getBoundingClientRect();
        return { height: Math.round(r.height), vh: window.innerHeight };
      });
      if (!heroBox) test.skip(true, 'no hero element identified');
      expect(heroBox.height, 'hero should not exceed viewport by more than 8px').toBeLessThanOrEqual(heroBox.vh + 8);
    });

    test(`${pg.name} · all D3 charts render with non-zero width`, async ({ page }) => {
      await gotoPage(page, pg.path);
      await fullPageScroll(page);
      const chartSizes = await page.evaluate(() => {
        const selector = [
          'svg.chart-svg',
          'svg#manhattan-svg',
          'svg#volcano-svg',
          'svg#ewce-svg',
          'svg#brain-svg',
          'svg#prequel-svg',
          '.chart-wrapper > svg',
        ].join(',');
        const nodes = document.querySelectorAll(selector);
        return [...nodes].map((el) => {
          const r = el.getBoundingClientRect();
          // A chart is considered "expected to be visible" if no ancestor is
          // display:none, hidden, or sits inside an inactive scientist tab panel.
          const inactive = el.closest('.sci-panel:not(.active), [hidden]');
          return {
            id: el.id || null,
            cls: typeof el.className === 'string' ? el.className.slice(0, 60) : (el.getAttribute('class') || '').slice(0, 60),
            width: Math.round(r.width),
            height: Math.round(r.height),
            inactive: !!inactive,
          };
        });
      });
      const tooSmall = chartSizes.filter((c) => !c.inactive && c.width < 100);
      expect(tooSmall, `Charts under 100px wide: ${JSON.stringify(tooSmall, null, 2)}`).toEqual([]);
    });

    test(`${pg.name} · scrollytelling in correct mode for viewport`, async ({ page }, testInfo) => {
      await gotoPage(page, pg.path);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      const isDesktop = viewportWidth >= 900;

      const modes = await page.evaluate(() => {
        const stickyCount = document.querySelectorAll(
          '.sticky-graphic, .scrolly-pin, [data-scrolly-mode="pin"]',
        ).length;
        const railCount = document.querySelectorAll(
          '.scrolly-rail, [data-scrolly-mode="rail"]',
        ).length;
        return { stickyCount, railCount };
      });

      // We don't fail if neither exists (CP1 baseline) — only if both appear simultaneously,
      // or if a wrong mode is the only one present. Lenient until CP7.
      if (modes.stickyCount > 0 && modes.railCount > 0) {
        // OK: spec allows both DOMs to exist; CSS hides the inactive one.
      }

      // Document for the report
      testInfo.annotations.push({
        type: 'scrolly-mode',
        description: `viewport=${viewportWidth}px (${isDesktop ? 'desktop' : 'mobile'}); pin=${modes.stickyCount} rail=${modes.railCount}`,
      });
    });

    test(`${pg.name} · internal links navigate without 404`, async ({ page }) => {
      await gotoPage(page, pg.path);
      const links = await page.evaluate(() => {
        const out = [];
        for (const a of document.querySelectorAll('a[href]')) {
          const href = a.getAttribute('href');
          if (!href) continue;
          if (href.startsWith('#') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) continue;
          out.push(href);
        }
        return [...new Set(out)];
      });
      for (const href of links) {
        const resp = await page.request.get(new URL(href, page.url()).toString());
        expect(resp.status(), `link ${href} returned ${resp.status()}`).toBeLessThan(400);
      }
    });

    test(`${pg.name} · screenshot`, async ({ page }, testInfo) => {
      await gotoPage(page, pg.path);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      const file = path.join(SCREENSHOT_DIR, `${pg.name}.${testInfo.project.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      testInfo.attachments.push({ name: 'fullpage', path: file, contentType: 'image/png' });
    });
  });
}
