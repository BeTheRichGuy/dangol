import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.CHECKOUT_BASE ?? 'http://localhost:3140';
const OUT = path.join(ROOT, 'tests', 'shots', 'checkout-widths');
const WIDTHS = [360, 390, 472, 1440];
const TOSS = process.env.CHECKOUT_TOSS === '1';
mkdirSync(OUT, { recursive: true });

if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) {
  console.error('이 스크립트는 이 컴퓨터의 개발 서버(localhost)에서만 돌린다.');
  process.exit(2);
}

const ANSWERS = {
  name: 'Mina',
  concern: 'ex',
  date: '1998-03-21',
  time: '09:30',
  timeAnswered: true,
  place: { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul', label: '서울, 대한민국' },
  sex: 'female',
  sexAnswered: true,
  sexChoice: 'female',
  nbChoice: null,
  midnight: null,
  regularNo: null,
  question: '',
};

const results = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, locale: 'ko-KR' });
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem('dangol.locale.v1', 'ko');
      } catch {}
    });
    await context.route('**/api/events', (route) => route.fulfill({ status: 204, body: '' }));

    if (!TOSS) {
      await context.route('**/api/reading', (route) =>
        route.request().method() === 'GET' ? route.fulfill({ json: { open: true, pay: 'test' } }) : route.fulfill({ status: 599, body: 'blocked' }),
      );
    }
    const page = await context.newPage();
    const row = { width, overflowRoom: null, overflowSheet: null, offscreen: [], toss: null, note: '' };
    try {
      await page.goto(`${BASE}/about`, { waitUntil: 'load' });
      await page.evaluate(([k, v]) => sessionStorage.setItem(k, JSON.stringify(v)), ['dangol.session.v1', ANSWERS]);
      await page.goto(`${BASE}/room/life`, { waitUntil: 'load', timeout: 60_000 });
      await page.waitForTimeout(2000);
      row.overflowRoom = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      await page.screenshot({ path: path.join(OUT, `w${width}-1-room.png`) });
      const buy = page.getByRole('button', { name: /결제하고 읽기/ }).first();
      await buy.scrollIntoViewIfNeeded({ timeout: 8000 });
      await buy.click();
      const dialog = page.locator('dialog.ac-sheet[open]');
      await dialog.waitFor({ state: 'visible', timeout: 8000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(OUT, `w${width}-2-sheet.png`) });
      const m = await page.evaluate(() => {
        const d = document.querySelector('dialog.ac-sheet[open]');
        const vw = window.innerWidth;
        const off = [];
        for (const el of d.querySelectorAll('button, a, input, dt, dd, p, h2')) {
          const r = el.getBoundingClientRect();
          if (r.width && (r.left < -1 || r.right > vw + 1)) off.push(`${el.tagName.toLowerCase()} ${(el.textContent || '').trim().slice(0, 24)} (${Math.round(r.left)}~${Math.round(r.right)})`);
        }
        return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, off };
      });
      row.overflowSheet = m.overflow;
      row.offscreen = m.off;
      if (TOSS) {
        await dialog.getByRole('checkbox').check();
        await dialog.getByRole('button', { name: /결제하기$/ }).click();
        await page.waitForTimeout(6000);
        const frames = page.frames().map((f) => f.url()).filter((u) => /tosspayments\.com/.test(u));
        row.toss = { pageUrl: page.url().slice(0, 80), tossFrames: frames.length, selfRedirect: /tosspayments\.com/.test(page.url()) };
        await page.screenshot({ path: path.join(OUT, `w${width}-3-toss.png`) });
      }
    } catch (e) {
      row.note = String(e.message).slice(0, 200);
    }
    results.push(row);
    await context.close();
  }
} finally {
  await browser.close();
}
writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 2));
let bad = 0;
for (const r of results) {
  const problem = r.note || (r.overflowRoom ?? 0) > 1 || (r.overflowSheet ?? 0) > 1 || r.offscreen.length > 0;
  if (problem) bad += 1;
  console.log(`${problem ? 'FAIL' : 'ok  '} ${r.width}px  방 가로넘침 ${r.overflowRoom} · 결제창 가로넘침 ${r.overflowSheet}${r.offscreen.length ? ` · 화면 밖 ${r.offscreen.join(', ')}` : ''}${r.toss ? ` · 토스 ${JSON.stringify(r.toss)}` : ''}${r.note ? ` · ${r.note}` : ''}`);
}
process.exit(bad ? 1 : 0);
