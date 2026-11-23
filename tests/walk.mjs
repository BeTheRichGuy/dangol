import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.WALK_BASE ?? 'http://localhost:3000';
const OUT = path.join(ROOT, 'tests', 'shots', 'walk');
mkdirSync(OUT, { recursive: true });

const PAGES = ['/', '/home', '/reading', '/room/life', '/room/match', '/room/life/read?sample', '/pricing', '/privacy', '/terms', '/refund', '/about', '/type', '/archive'];
const VIEWS = { mobile: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };
const LOCALES = ['ko', 'en', 'ja'];

const problems = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const [view, viewport] of Object.entries(VIEWS)) {
    for (const locale of LOCALES) {
      const context = await browser.newContext({ viewport, locale: locale === 'ko' ? 'ko-KR' : locale === 'ja' ? 'ja-JP' : 'en-US' });
      await context.addInitScript((l) => {
        try {
          window.localStorage.setItem('dangol.locale.v1', l);
        } catch {}
      }, locale);

      await context.route('**/api/events', (route) => route.fulfill({ status: 204, body: '' }));
      const page = await context.newPage();
      let at = '';
      page.on('console', (m) => {
        if (m.type() === 'error') problems.push({ at, view, locale, kind: 'console', text: m.text().slice(0, 300) });
      });
      page.on('pageerror', (e) => problems.push({ at, view, locale, kind: 'pageerror', text: String(e.message).slice(0, 300) }));
      for (const p of PAGES) {
        at = p;
        try {
          await page.goto(BASE + p, { waitUntil: 'load', timeout: 60_000 });
          await page.waitForTimeout(2500);
          const r = await page.evaluate(() => {
            const doc = document.documentElement;
            const overflow = doc.scrollWidth - doc.clientWidth;
            const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src).map((i) => i.src.slice(0, 120));
            const text = document.body.innerText;
            const leaks = (text.match(/\bundefined\b|\bNaN\b|\[object [A-Za-z]+\]|\{\w+\}/g) ?? []).slice(0, 5);
            return { overflow, broken, leaks, h: doc.scrollHeight };
          });
          if (r.overflow > 1) problems.push({ at: p, view, locale, kind: 'h-scroll', text: `${r.overflow}px` });
          if (r.broken.length) problems.push({ at: p, view, locale, kind: 'broken-img', text: r.broken.join(' ') });
          if (r.leaks.length) problems.push({ at: p, view, locale, kind: 'leak', text: r.leaks.join(' ') });
          if (locale === 'ko' || p === '/') {
            const name = `${view}-${locale}-${p.replace(/[/?]+/g, '_').replace(/^_|_$/g, '') || 'root'}.png`;
            await page.screenshot({ path: path.join(OUT, name), fullPage: false });
          }
        } catch (e) {
          problems.push({ at: p, view, locale, kind: 'load', text: String(e.message).slice(0, 200) });
        }
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}
writeFileSync(path.join(OUT, 'problems.json'), JSON.stringify(problems, null, 2));
console.log(`문제 ${problems.length}개`);
for (const p of problems) console.log(`- [${p.view}/${p.locale}] ${p.at} ${p.kind}: ${p.text}`);
