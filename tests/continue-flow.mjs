import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.CONTINUE_BASE ?? 'http://localhost:3140';
const OUT = path.join(ROOT, 'tests', 'shots', 'continue-flow');
const WIDTHS = [360, 390, 472, 1440];
mkdirSync(OUT, { recursive: true });
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) {
  console.error('이 스크립트는 이 컴퓨터의 개발 서버(localhost)에서만 돌린다.');
  process.exit(2);
}

const ANSWERS = {
  name: 'Mina',
  concern: null,
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
  question: '이직을 해야 할지 고민이에요',
};

const checks = [];
const check = (width, name, ok, detail = '') => {
  checks.push({ width, name, ok, detail });
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} [${width}] ${name}${detail ? `: ${detail}` : ''}`);
};
const overflowOf = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function context(browser, width, locale) {
  const ctx = await browser.newContext({ viewport: { width, height: 844 }, locale: locale === 'ko' ? 'ko-KR' : 'en-US' });
  await ctx.addInitScript((l) => {
    try {
      window.localStorage.setItem('dangol.locale.v1', l);
    } catch {}
  }, locale);
  await ctx.route('**/api/events', (route) => route.fulfill({ status: 204, body: '' }));
  await ctx.route('**/api/reading', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: { open: true, pay: 'test' } }) : route.fulfill({ status: 599, body: 'blocked' }),
  );
  return ctx;
}

async function seed(page) {
  await page.goto(`${BASE}/about`, { waitUntil: 'load' });
  await page.evaluate(([k, v]) => sessionStorage.setItem(k, JSON.stringify(v)), ['dangol.session.v1', ANSWERS]);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of WIDTHS) {

    const ctx = await context(browser, width, 'ko');
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)));
    await seed(page);
    await page.goto(`${BASE}/reading?step=result`, { waitUntil: 'load', timeout: 60_000 });
    await page.getByRole('heading', { name: '잠깐, 이건 놓치면 안 돼' }).waitFor({ timeout: 20_000 }).catch(() => {});
    check(width, '무료 결과 머리 한 줄', await page.getByText('율이 읽어 주는 내 사주 · 무료 체험').count() > 0);
    const chapter = page.locator('section[aria-labelledby="chapter-concern"]');
    await chapter.scrollIntoViewIfNeeded().catch(() => {});
    check(width, '2장 제목 잠깐, 이건 놓치면 안 돼', (await chapter.getByRole('heading', { name: '잠깐, 이건 놓치면 안 돼' }).count()) === 1);
    check(width, '예고편 카드 셋(시기·사람·빈자리)', (await chapter.locator('[data-teaser]').count()) === 3);
    check(width, '카드마다 잠깐… 한마디', (await chapter.getByText(/^잠깐…|^그런데…/).count()) >= 3);
    check(width, '잠금 상자 셋과 방으로 가는 버튼', (await chapter.locator('.rs-lock__btn').count()) === 3 && (await chapter.locator('.rs-lock__list li').count()) === 12);
    check(width, '가려진 뒷말(막대)이 있다', (await chapter.locator('.rs-blur').count()) === 3);
    check(width, '질문은 답하는 척하지 않고 한 줄만', (await chapter.getByText('적어 준 고민은 종합 풀이에서 이어서 짚을게.').count()) === 1);
    check(width, '옛 문구(안쪽 방에서 제대로 풀자)가 없다', (await page.getByText('안쪽 방에서 제대로 풀자').count()) === 0);
    await chapter.screenshot({ path: path.join(OUT, `w${width}-1-chapter2.png`) }).catch(() => {});

    const pitch = page.locator('section[aria-label="율의 종합 풀이 이어 읽기"]');
    await pitch.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const cta = pitch.getByRole('link', { name: /율의 종합 풀이 이어 읽기/ });
    check(width, '주 버튼 율의 종합 풀이 이어 읽기(값 두 줄)', (await cta.count()) === 1 && /4,900원/.test(await cta.innerText()) && /2,490원/.test(await cta.innerText()));
    check(width, '열두 절 목차', (await pitch.locator('ol.rs-menu__list > li').count()) === 12);
    check(width, '무료에서 본 것 표시(왜 그런지까지 5, 이어서 2, 새로 5)', (await pitch.locator('[data-kind="why"]').count()) === 5 && (await pitch.locator('[data-kind="more"]').count()) === 2 && (await pitch.locator('[data-kind="new"]').count()) === 5);
    check(width, '보조 네 방', (await pitch.locator('ul.rs-menu__list a.rs-menu__room').count()) === 4);
    check(width, '옛 문구(연의 방을 가리키던 두 문장)가 없다', (await page.getByText('몇 년도인지는 연이 알아').count()) === 0 && (await page.getByText('끌리는 방부터').count()) === 0);
    check(width, '결과 화면 가로 스크롤 없음', (await overflowOf(page)) <= 1, `${await overflowOf(page)}px`);
    await pitch.screenshot({ path: path.join(OUT, `w${width}-2-pitch.png`) }).catch(() => {});

    await cta.click();
    await page.waitForURL('**/room/life', { timeout: 20_000 });
    const box = page.locator('section[aria-labelledby="continue-title"]');
    await box.waitFor({ timeout: 20_000 }).catch(() => {});
    check(width, '확인 상자 율의 종합 풀이 · 2장부터', (await box.getByRole('heading', { name: '율의 종합 풀이 · 2장부터' }).count()) === 1);
    const text = (await box.innerText()).replace(/\s+/g, ' ');
    check(width, '4,900원 한 번·작성 2~5분·보관 조건·환불 조건', /4,900원, 한 번만/.test(text) && /2~5분/.test(text) && /보관함에 남고/.test(text) && /청약철회/.test(text));
    check(width, '방 웹툰과 긴 소개는 방 둘러보기로 묶이고 처음부터 펼쳐져 있다', (await page.locator('details.rm-browse[open]').count()) === 1);
    check(width, '열리는 목차도 처음부터 펼쳐져 있다', (await page.locator('details.rm-continue__opens[open]').count()) === 1);
    check(width, '목차는 열리는 목차 하나뿐이다(이 방에서 읽는 것이 따로 뜨지 않는다)', (await page.locator('ol.rm-contents').count()) === 1 && (await page.locator('#room-contents').count()) === 0 && (await page.getByText('이 방에서 읽는 것').count()) === 0);
    check(width, '입력을 다시 묻지 않는다(내 정보 줄이 있고 입력 칸이 없다)', (await page.getByText('Mina').count()) > 0 && (await page.locator('input[type="text"]').count()) <= 1);
    check(width, '결제 버튼(기존 결제 코드)', (await page.getByRole('button', { name: /결제하고 읽기/ }).count()) === 1);
    check(width, '이어 읽기 화면 가로 스크롤 없음', (await overflowOf(page)) <= 1, `${await overflowOf(page)}px`);
    await page.screenshot({ path: path.join(OUT, `w${width}-3-room.png`) });
    check(width, '콘솔 페이지 오류 없음', errors.length === 0, errors.join(' | '));
    await ctx.close();

    const direct = await context(browser, width, 'ko');
    const dp = await direct.newPage();
    await seed(dp);
    await dp.goto(`${BASE}/room/life`, { waitUntil: 'load', timeout: 60_000 });
    await dp.getByRole('button', { name: /결제하고 읽기/ }).waitFor({ timeout: 20_000 }).catch(() => {});
    check(width, '직접 들어오면 확인 상자·접힘이 없다(지금 화면 그대로)', (await dp.locator('section[aria-labelledby="continue-title"]').count()) === 0 && (await dp.locator('details.rm-browse').count()) === 0);
    await direct.close();

    const en = await context(browser, width, 'en');
    const ep = await en.newPage();
    await seed(ep);
    await ep.goto(`${BASE}/reading?step=result`, { waitUntil: 'load', timeout: 60_000 });
    await ep.waitForTimeout(3000);
    const enBody = await ep.locator('main').innerText();
    check(width, '영어 결과에는 한국어 2장·경계가 없다', !/잠깐, 이건 놓치면 안 돼|이어 읽기|무료 체험/.test(enBody));
    await en.close();
  }
} finally {
  await browser.close();
}
writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(checks, null, 2));
const bad = checks.filter((c) => !c.ok);
console.log(`\n확인 ${checks.length}개, 실패 ${bad.length}개`);
process.exit(bad.length ? 1 : 0);
