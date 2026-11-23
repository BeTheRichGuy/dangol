import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 3129;
const BASE = `http://localhost:${PORT}`;
const OUT = path.join(ROOT, 'tests', 'shots', 'smoke');
const NAME = 'Mina';
const DATE = '1998.03.21';
const DATE_ISO = '1998-03-21';

const checks = [];
const problems = [];
let n = 0;

function check(name, ok, detail = '') {
  checks.push({ name, ok, detail });
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`);
}

async function shot(page, name) {
  n += 1;
  const file = `${String(n).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(OUT, file), fullPage: false });
  const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
  if (overflow > 1) problems.push(`${file}: 가로로 ${overflow}px 넘친다`);
  console.log(`  ${file}`);
}

let server = null;
let dataDir = null;

async function startServer() {
  if (!existsSync(path.join(ROOT, '.next', 'BUILD_ID'))) throw new Error('.next 빌드가 없다. 먼저 npm run build');
  dataDir = mkdtempSync(path.join(tmpdir(), 'dangol-smoke-'));

  const env = { ...process.env, DANGOL_DATA_DIR: dataDir, NEXT_TELEMETRY_DISABLED: '1' };

  for (const k of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'ANTHROPIC_API_KEY', 'DANGOL_READINGS_OPEN']) env[k] = '';
  server = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', String(PORT)], {
    cwd: ROOT,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const log = [];
  server.stdout.on('data', (d) => log.push(String(d)));
  server.stderr.on('data', (d) => log.push(String(d)));
  for (let i = 0; i < 120; i += 1) {
    try {
      const r = await fetch(BASE);
      if (r.ok) return;
    } catch {

    }
    if (server.exitCode !== null) throw new Error(`서버가 먼저 끝났다\n${log.join('').slice(-1500)}`);
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('서버가 60초 안에 뜨지 않았다');
}

function stopServer() {
  if (server?.pid && server.exitCode === null) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    else server.kill('SIGTERM');
  }
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
}

const sent = [];

async function newPage(browser, { locale = 'en', openRooms = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await context.addInitScript((l) => {
    try {
      if (!localStorage.getItem('dangol.locale.v1')) localStorage.setItem('dangol.locale.v1', l);
    } catch {

    }
  }, locale);
  if (openRooms) {
    await context.route('**/api/reading', (route) =>
      route.request().method() === 'GET' ? route.fulfill({ json: { open: true } }) : route.fulfill({ status: 599, body: 'blocked in smoke' }),
    );
  }
  const page = await context.newPage();
  page.on('console', (m) => {

    if (m.type() === 'error' && !page.url().includes('/does-not-exist')) problems.push(`콘솔 오류 (${page.url()}): ${m.text().slice(0, 200)}`);
  });
  page.on('pageerror', (e) => problems.push(`페이지 오류 (${page.url()}): ${String(e).slice(0, 200)}`));
  page.on('requestfailed', (r) => {
    const why = r.failure()?.errorText ?? '';
    if (!/ERR_ABORTED/.test(why)) problems.push(`실패한 요청: ${r.url()} ${why}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().includes('/does-not-exist') && r.status() !== 599) problems.push(`응답 ${r.status()}: ${r.url()}`);
  });
  page.on('request', (r) => {
    if (r.url().startsWith(BASE)) sent.push({ url: r.url(), body: r.postData() ?? '' });
  });
  return { context, page };
}

async function fillCity(page, city) {
  const box = page.getByRole('combobox').first();
  await box.click();
  await box.fill(city);
  const option = page.getByRole('option').first();
  await option.waitFor({ timeout: 10_000 });
  await option.click();
}

async function fillReadingForm(page) {
  await page.getByLabel('What should I call you?').fill(NAME);
  await page.getByLabel('Date of birth').fill(DATE);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Time of birth').fill('14:30');
  await fillCity(page, 'Los Angeles');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Woman' }).click();
}

async function waitResult(page) {
  await page.waitForURL(/step=result/, { timeout: 30_000 });
  await page.getByText('Who you are').first().waitFor({ timeout: 15_000 });
}

async function homeInLanguages(browser) {
  console.log('첫 화면 세 언어');
  for (const [locale, first] of [
    ['en', 'google'],
    ['ko', 'kakao'],
    ['ja', 'line'],
  ]) {
    const { context, page } = await newPage(browser, { locale });
    await page.goto(`${BASE}/`, { waitUntil: 'load' });

    await page.locator('.hm-pill').click();
    await page.locator('.ac-method').first().waitFor({ timeout: 10_000 });
    await page.waitForTimeout(800);
    const methods = await page.locator('.ac-method, .ac-icon').evaluateAll((els) => els.map((e) => e.getAttribute('data-method')));
    check(`home-${locale}-login-order`, methods[0] === first && methods.length === 5, methods.join(', '));
    check(`home-${locale}-follow`, (await page.locator('a[href="/reading"]').count()) > 0, '무료 풀이 시작 링크');
    await shot(page, `home-${locale}`);
    await context.close();
  }
}

async function staticPages(browser) {
  console.log('정적 페이지');
  const { context, page } = await newPage(browser);
  for (const p of ['/about', '/pricing', '/privacy', '/terms', '/refund', '/wont-read', '/type', '/home']) {
    const res = await page.goto(`${BASE}${p}`, { waitUntil: 'load' });
    check(`page${p.replace('/', '-')}`, res?.status() === 200, `상태 ${res?.status()}`);
    await page.waitForTimeout(500);
    await shot(page, `page${p.replace('/', '-')}`);
  }
  const privacy = await (await fetch(`${BASE}/privacy`)).text();
  check('privacy-mentions-accounts', privacy.includes('Saved people and readings') && privacy.includes('Signing in'), '개인정보처리방침의 로그인·저장 절');
  const res = await page.goto(`${BASE}/does-not-exist`, { waitUntil: 'load' });
  check('page-404', res?.status() === 404, `상태 ${res?.status()}`);
  await context.close();
}

async function closedRooms(browser) {
  console.log('방 다섯(닫힘), 예약 창');
  const { context, page } = await newPage(browser);
  for (const room of ['life', 'decades', 'love', 'match', 'year']) {
    await page.goto(`${BASE}/room/${room}`, { waitUntil: 'load' });
    const dock = page.locator('.rm-dock__btn');
    await dock.waitFor({ timeout: 10_000 });
    check(`room-${room}-closed-reserve`, /Reserve at/.test((await dock.textContent()) ?? ''), (await dock.textContent()) ?? '');
  }
  await page.locator('.rm-dock__btn').click();
  const sheet = page.locator('dialog.dg-sheet[open]');
  await sheet.waitFor({ timeout: 5000 });
  await page.waitForTimeout(400);
  const colors = await sheet.evaluate((d) => {
    const h = d.querySelector('h2');
    return { heading: h ? getComputedStyle(h).color : null, bg: getComputedStyle(d).backgroundColor };
  });

  check('reserve-sheet-text-visible', !!colors.heading && !/255, 246, 230/.test(colors.heading), `제목 ${colors.heading}, 바탕 ${colors.bg}`);
  await shot(page, 'room-year-reserve-sheet');
  await context.close();
}

async function sampleReading(browser) {

  console.log('견본 풀이(결제 뒤 풀이 화면, 다섯 방)');

  for (const [room, chapters] of [['love', 8], ['life', 12], ['decades', 7], ['match', 8], ['year', 6]]) {
    const { context, page } = await newPage(browser, { locale: 'ko' });
    await page.goto(`${BASE}/room/${room}?sample`, { waitUntil: 'load' });
    await page.getByRole('button', { name: '견본 보기' }).click();
    await page.waitForURL(new RegExp(`/room/${room}/read\\?sample`), { timeout: 10_000 });
    await page.locator('.rm-done').waitFor({ timeout: 60_000 });
    await page.waitForTimeout(600);
    const parts = await page.locator('.rm-chapter').count();
    const panels = await page.locator('.rm-chapter .wt-panel').count();
    const bubbles = await page.locator('.rm-chapter .wt-bubble').count();
    check(`sample-${room}-ko-chapters`, parts === chapters, `절 ${parts}개`);
    check(`sample-${room}-ko-panels`, panels === chapters * 3, `칸 ${panels}개, 말풍선 ${bubbles}개`);
    const title = (await page.locator('#read-title').textContent()) ?? '';

    const h1s = await page.locator('h1:visible').allTextContents();
    check(`sample-${room}-one-h1`, h1s.length === 1, h1s.join(' | '));
    check(`sample-${room}-ko-heading`, /[가-힣]/.test(title), title);
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, `read-${room}-top`);
    await page.locator('#room-part-3').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await shot(page, `read-${room}-part3`);
    await context.close();
  }
}

async function freeReadingSignedOut(browser) {
  console.log('무료 첫 풀이(로그인 없이)');
  const { context, page } = await newPage(browser);
  sent.length = 0;
  await page.goto(`${BASE}/reading`, { waitUntil: 'load' });
  await page.getByRole('button', { name: 'Let’s begin' }).click();
  await page.getByLabel('Date of birth').waitFor({ timeout: 10_000 });
  await shot(page, 'free-form-1');
  await fillReadingForm(page);
  check('free-form-no-save-box', (await page.locator('.rf-save').count()) === 0, '로그인 전에는 저장 체크가 없다');
  await shot(page, 'free-form-3');
  await page.getByRole('button', { name: 'Read my chart' }).click();
  await waitResult(page);
  await page.waitForTimeout(1500);
  await shot(page, 'free-result');
  const leaked = sent.filter((r) => r.url.includes(DATE_ISO) || r.url.includes(NAME) || r.body.includes(DATE_ISO) || r.body.includes(NAME));
  check('free-nothing-personal-sent', leaked.length === 0, leaked.map((r) => r.url).join(', ') || `요청 ${sent.length}건 검사`);
  await context.close();
}

async function addPerson(page, { relation, name, date, time, city, gender }) {
  await page.getByRole('button', { name: relation, exact: true }).click();
  await page.getByLabel('Name or nickname').fill(name);
  await page.getByLabel('Birthday').fill(date);

  if (time) await page.getByLabel(/^Birth time/).fill(time);
  else await page.locator('.rf-check input[type="checkbox"]').first().check();
  await fillCity(page, city);
  await page.getByRole('button', { name: gender, exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
}

async function signedInFlow(browser) {
  console.log('미리보기 로그인 → 사람 → 무료 풀이 → 보관함 → 궁합 → 로그아웃');
  const { context, page } = await newPage(browser, { openRooms: true });

  await page.goto(`${BASE}/room/life`, { waitUntil: 'load' });
  const dock = page.locator('.rm-dock__btn');
  await dock.waitFor({ timeout: 10_000 });
  check('room-signed-out-dock', (await dock.textContent()) === 'Add my birth details', (await dock.textContent()) ?? '');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const sheet = page.locator('dialog.ac-sheet[open]');
  await sheet.waitFor({ timeout: 5000 });
  await page.waitForTimeout(400);
  const color = await sheet.locator('h2').evaluate((h) => getComputedStyle(h).color);
  check('login-sheet-text-visible', !/255, 246, 230/.test(color), color);
  await shot(page, 'login-sheet');
  await page.keyboard.press('Escape');

  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.locator('.hm-pill').click();
  await page.locator('.ac-method[data-method="google"]').click();
  await page.waitForURL(/\/home$/, { timeout: 10_000 });
  await page.locator('.hm-tabs').waitFor({ timeout: 10_000 });
  await page.locator('.hm-pill').waitFor({ state: 'detached', timeout: 10_000 });
  check('home-tabs', (await page.locator('.hm-tabs a[href="/people"], .hm-tabs a[href="/archive"]').count()) === 2, '아래 탭의 나(내 사람들)·보관함');
  await shot(page, 'home-signed-in');

  await page.goto(`${BASE}/people`, { waitUntil: 'load' });
  await page.getByRole('button', { name: 'Add me first' }).click();
  await addPerson(page, { relation: 'Me', name: NAME, date: DATE, time: '14:30', city: 'Los Angeles', gender: 'Woman' });
  await page.getByRole('button', { name: 'Add someone' }).click();
  await addPerson(page, { relation: 'Partner', name: 'Jun', date: '1996.01.02', time: null, city: 'Seoul', gender: 'Skip' });
  await page.locator('.ac-person').nth(1).waitFor({ timeout: 5000 });
  const people = await page.locator('.ac-person__name').allTextContents();
  check('people-saved', people.join(',') === `${NAME},Jun`, people.join(', '));
  await shot(page, 'people');

  await page.goto(`${BASE}/reading?step=form`, { waitUntil: 'load' });
  await page.getByRole('button', { name: NAME, exact: true }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  const city = await page.getByRole('combobox').first().inputValue();
  check('form-chip-fills-city', /Los Angeles/.test(city), `도시 칸: ${city}`);
  await page.getByRole('button', { name: 'Next' }).click();
  check('form-known-person-no-save-box', (await page.locator('.rf-save').count()) === 0, '이미 저장된 사람이면 저장 체크를 숨긴다');
  await page.getByRole('button', { name: 'Read my chart' }).click();
  await waitResult(page);
  await page.waitForTimeout(1500);
  await page.goto(`${BASE}/archive`, { waitUntil: 'load' });
  await page.locator('.ac-reading').first().waitFor({ timeout: 10_000 });
  check('archive-has-free', (await page.locator('.ac-reading').count()) === 1, `${await page.locator('.ac-reading__kind').first().textContent()}`);
  for (const v of ['By person', 'By room', 'All']) await page.getByRole('button', { name: v, exact: true }).click();
  await shot(page, 'archive');
  await page.locator('.ac-reading__open').first().click();
  await page.getByText('Who you are').first().waitFor({ timeout: 15_000 });
  check('archive-reopen-free', page.url().includes('/archive?r='), page.url());
  await page.waitForTimeout(1200);
  await shot(page, 'archive-open');

  await page.goto(`${BASE}/room/match`, { waitUntil: 'load' });
  await page.locator('.ac-pick__person').first().waitFor({ timeout: 10_000 });
  await page.locator('.ac-pick__person').nth(1).click();
  const lanterns = await page.locator('.ac-pick__person').evaluateAll((els) => els.map((e) => e.getAttribute('data-lantern')));
  const kind = await page.locator('.ac-pick__kind [aria-pressed="true"]').textContent();
  const dock2 = await page.locator('.rm-dock__btn').textContent();
  check('match-two-lanterns', lanterns.join(',') === 'gold,silver' && kind === 'Partner' && dock2 === 'Read it now', `${lanterns.join(',')} / 사이 ${kind} / ${dock2}`);
  await page.locator('.ac-pick').scrollIntoViewIfNeeded();
  await shot(page, 'match-picker');

  await page.goto(`${BASE}/home`, { waitUntil: 'load' });
  await page.getByRole('button', { name: '한국어' }).click();
  await page.getByText('내 사람들').first().waitFor({ timeout: 5000 });
  check('home-ko-still-signed-in', (await page.locator('.ac-tiles:not(.ac-tiles--play) .ac-tile').count()) === 2, '언어를 바꿔도 두 칸');
  await page.getByRole('button', { name: 'English' }).click();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 10_000 });
  await page.locator('.ac-method').first().waitFor({ timeout: 5000 });
  check('signed-out-home-login', true, '첫 화면에 로그인 창');
  await context.close();
}

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  await startServer();
  console.log('서버 준비됨');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const run of [homeInLanguages, staticPages, closedRooms, sampleReading, freeReadingSignedOut, signedInFlow]) {
      try {
        await run(browser);
      } catch (e) {
        problems.push(`스크립트 오류 (${run.name}): ${String(e?.message ?? e).split('\n')[0]}`);
        console.log(`  스크립트 오류: ${String(e?.message ?? e).split('\n')[0]}`);
      }
    }
  } finally {
    await browser.close();
  }
  const failed = checks.filter((c) => !c.ok);
  writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ checks, problems }, null, 2));
  console.log(`\n점검 ${checks.length - failed.length}/${checks.length} ok, 문제 ${problems.length}개`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exitCode = failed.length || problems.length ? 1 : 0;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(stopServer);
