import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let ffmpegShimDir = null;
function prepareFfmpeg() {
  try {
    const browsers = JSON.parse(readFileSync(path.join(ROOT, 'node_modules', 'playwright-core', 'browsers.json'), 'utf8')).browsers;
    const wanted = browsers.find((b) => b.name === 'ffmpeg')?.revision;
    const cache =
      process.env.PLAYWRIGHT_BROWSERS_PATH ||
      (process.platform === 'darwin' ? path.join(homedir(), 'Library', 'Caches', 'ms-playwright') : path.join(homedir(), '.cache', 'ms-playwright'));
    if (!wanted) return false;
    if (existsSync(path.join(cache, `ffmpeg-${wanted}`, 'INSTALLATION_COMPLETE'))) return true;
    const exe = process.platform === 'darwin' ? 'ffmpeg-mac' : process.platform === 'linux' ? 'ffmpeg-linux' : null;
    const system = (process.env.PATH ?? '')
      .split(path.delimiter)
      .map((d) => path.join(d, 'ffmpeg'))
      .find((f) => existsSync(f));
    if (!exe || !system) return false;
    ffmpegShimDir = mkdtempSync(path.join(tmpdir(), 'dangol-pw-'));
    const dir = path.join(ffmpegShimDir, `ffmpeg-${wanted}`);
    mkdirSync(dir);
    symlinkSync(system, path.join(dir, exe));
    writeFileSync(path.join(dir, 'INSTALLATION_COMPLETE'), '');
    writeFileSync(path.join(dir, 'DEPENDENCIES_VALIDATED'), '');
    process.env.PLAYWRIGHT_BROWSERS_PATH = ffmpegShimDir;
    return true;
  } catch {
    return false;
  }
}
const FFMPEG_OK = prepareFfmpeg();
const { chromium } = await import('playwright-core');

const PORT = 3123;

const EXTERNAL_BASE = (process.env.SHOTS_BASE_URL ?? '').replace(/\/+$/, '');
const BASE = EXTERNAL_BASE || `http://localhost:${PORT}`;
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };
const SE = { width: 375, height: 667 };
const LANDSCAPE = { width: 844, height: 390 };

const ANDROID = { width: 360, height: 640 };
const KEYBOARD = { width: 360, height: 330 };
const VIEWPORTS = { mobile: MOBILE, desktop: DESKTOP, se: SE, landscape: LANDSCAPE, android: ANDROID, keyboard: KEYBOARD };

const tag = (process.argv[2] ?? 'v1').trim();
if (!/^[A-Za-z0-9._-]+$/.test(tag)) {
  console.error(`태그는 영문·숫자·.-_ 만 쓸 수 있다: "${tag}"`);
  process.exit(1);
}
const OUT = path.join(ROOT, 'tests', 'shots', tag);

const FAKE = {
  name: 'Mina',
  month: 'March',
  day: '21',
  year: '1998',
  iso: '1998-03-21',
  hour: '2',
  minute: '30',
  period: 'PM',
  city: 'Los Angeles',
  label: 'Los Angeles, US',
  tz: 'America/Los_Angeles',
  concern: 'Someone I like',
  concernTitle: 'About the one you like',
  email: 'shots@example.com',
};

const FAKE2 = {
  name: '',
  month: 'November',
  day: '2',
  year: '1995',
  iso: '1995-11-02',
  city: 'Seoul',
  label: 'Seoul, KR',
  tz: 'Asia/Seoul',
  concern: 'Work & career',
  concernTitle: 'About your work',
};

const FAKE3 = {
  name: 'Jess',
  month: 'July',
  day: '9',
  year: '1992',
  iso: '1992-07-09',
  hour: '8',
  minute: '10',
  period: 'AM',
  city: 'London',
  label: 'London, GB',
  tz: 'Europe/London',
  concern: 'An ex',
  concernTitle: 'About your ex',
};

const SEEDED = {
  name: 'Rin',
  date: '1992-08-17',
  time: '21:10',
  place: { name: 'London', country: 'GB', lat: 51.5072, lng: -0.1276, tz: 'Europe/London', label: 'London, GB' },
};

const report = {
  tag,
  createdAt: new Date().toISOString(),
  baseUrl: BASE,
  viewports: VIEWPORTS,
  shots: [],
  consoleErrors: [],
  pageErrors: [],
  failedRequests: [],
  privacyLeaks: [],
  checks: [],
  serverRequests: 0,
  steps: [],
  turns: [],
  waitlistSources: [],
  media: {},
  panels: [],
  video: null,
  problems: [],
  summary: {},
};

let counter = 0;
let currentLabel = 'start';

function problem(text) {
  report.problems.push(text);
  console.log(`  ! ${text}`);
}

let server = null;
let dataDir = null;
const serverLog = [];

async function waitForServer(timeoutMs = 60_000) {
  const start = Date.now();
  let lastError = '';
  while (Date.now() - start < timeoutMs) {
    if (server && server.exitCode !== null) {
      throw new Error(`서버가 먼저 종료됐다 (exit ${server.exitCode}).\n${serverLog.join('').slice(-1500)}`);
    }
    try {
      const res = await fetch(`${BASE}/about`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return;
      lastError = `HTTP ${res.status}`;
    } catch (e) {
      lastError = String(e?.message ?? e);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`서버가 ${timeoutMs}ms 안에 뜨지 않았다: ${lastError}\n${serverLog.join('').slice(-1500)}`);
}

async function portInUse() {
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(1500) });
    return true;
  } catch {
    return false;
  }
}

async function startServer() {
  if (EXTERNAL_BASE) {

    await waitForServer(30_000);
    return;
  }
  if (!existsSync(path.join(ROOT, '.next', 'BUILD_ID'))) {
    throw new Error('.next 빌드가 없다. 먼저 npm run build 를 실행한다.');
  }
  if (await portInUse()) {
    throw new Error(`포트 ${PORT} 가 이미 쓰이고 있다. 그 서버를 끄고 다시 실행한다.`);
  }
  dataDir = mkdtempSync(path.join(tmpdir(), 'dangol-shots-'));

  const win = process.platform === 'win32';
  server = spawn(
    win ? process.execPath : 'npx',
    win ? [path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', String(PORT)] : ['next', 'start', '-p', String(PORT)],
    {
      cwd: ROOT,
      env: { ...process.env, DANGOL_DATA_DIR: dataDir, NEXT_TELEMETRY_DISABLED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: !win,
    },
  );
  server.stdout.on('data', (d) => serverLog.push(String(d)));
  server.stderr.on('data', (d) => serverLog.push(String(d)));
  await waitForServer();
}

function stopServer() {
  if (ffmpegShimDir) {
    try {
      rmSync(ffmpegShimDir, { recursive: true, force: true });
    } catch {

    }
  }
  if (server && server.exitCode === null && server.pid) {
    try {
      if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
      else process.kill(-server.pid, 'SIGTERM');
    } catch {

    }
  }
  if (dataDir) {
    try {
      rmSync(dataDir, { recursive: true, force: true });
    } catch {

    }
  }
}

const EXPECTED_404 = '/no-such-page';

const FORBIDDEN = [FAKE.name, FAKE.iso, FAKE.year, '14:30', FAKE.city, 'Los%20Angeles', 'Los+Angeles', FAKE.tz, FAKE2.iso, FAKE2.year, FAKE2.city, FAKE2.tz, FAKE3.name, FAKE3.iso, '08:10', SEEDED.name, SEEDED.date, '1992', SEEDED.time, SEEDED.place.name, SEEDED.place.tz];

const OLD_ART = /yul-portrait|yul-gate\.webp|yul-gift|sogeum\.jpg|intro-poster|\/intro\.mp4|yul-greet|yul-scroll|yul-gate-beckon|\/clips\/(greet|scroll|gift|listen)\.(mp4|jpg)/;

function noteMedia(urlStr) {
  let u;
  try {
    u = new URL(urlStr);
  } catch {
    return;
  }
  if (u.origin !== BASE) return;
  let key = null;
  if (u.pathname === '/_next/image') key = u.searchParams.get('url');
  else if (u.pathname.startsWith('/media/')) key = u.pathname;
  else if (u.pathname === '/api/card') key = '/api/card';
  if (key) report.media[key] = (report.media[key] ?? 0) + 1;
}

function checkOutgoing(req) {
  noteMedia(req.url());
  const url = new URL(req.url());
  if (url.origin !== BASE) return;
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/media/')) return;
  report.serverRequests += 1;
  if (url.pathname === '/api/waitlist' && req.method() === 'POST') {

    try {
      const body = JSON.parse(req.postData() ?? '{}');
      report.waitlistSources.push(String(body.source ?? ''));
    } catch {
      report.waitlistSources.push('(unparsable)');
    }
  }
  const haystack = `${url.pathname}${url.search} ${req.postData() ?? ''}`;
  const decoded = (() => {
    try {
      return decodeURIComponent(haystack);
    } catch {
      return haystack;
    }
  })();
  const hit = FORBIDDEN.filter((f) => haystack.includes(f) || decoded.includes(f));
  if (hit.length) {
    report.privacyLeaks.push({ at: currentLabel, method: req.method(), path: url.pathname + url.search, matched: hit });
  }
}

function watch(page, viewportName) {
  page.on('request', checkOutgoing);
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    if (page.url().includes(EXPECTED_404) && msg.text().includes('404')) return;
    report.consoleErrors.push({ at: currentLabel, viewport: viewportName, text: msg.text().slice(0, 500), url: page.url() });
  });
  page.on('pageerror', (err) => {
    report.pageErrors.push({ at: currentLabel, viewport: viewportName, text: String(err?.message ?? err).slice(0, 500), url: page.url() });
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      if (res.status() === 404 && new URL(res.url()).pathname === EXPECTED_404) return;
      report.failedRequests.push({ at: currentLabel, status: res.status(), url: res.url() });
    }
  });
  page.on('requestfailed', (req) => {
    const reason = req.failure()?.errorText ?? 'failed';

    if (reason.includes('ERR_ABORTED') && (req.resourceType() === 'media' || req.resourceType() === 'image')) return;
    report.failedRequests.push({ at: currentLabel, status: 0, reason, url: req.url() });
  });
}

async function settleDialogue(page) {
  await page
    .waitForFunction(
      () => [...document.querySelectorAll('.dg-chat .invisible')].every((el) => el.textContent === ''),
      null,
      { timeout: 6000 },
    )
    .catch(() => {});
}

async function ready(page) {
  await settleDialogue(page);
  await page.waitForFunction(() => !document.querySelector('main [inert]'), null, { timeout: 8000 }).catch(() => {});
}

async function settle(page, ms = 600) {
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page
    .evaluate(() =>
      Promise.all(
        [...document.images]
          .filter((img) => !img.complete)
          .map((img) => new Promise((resolve) => { img.addEventListener('load', resolve, { once: true }); img.addEventListener('error', resolve, { once: true }); setTimeout(resolve, 4000); })),
      ),
    )
    .catch(() => {});
  await page.waitForTimeout(ms);
}

function check(name, ok, detail, { soft = false } = {}) {
  report.checks.push({ name, ok, soft, detail });
  console.log(`  ${ok ? 'ok ' : soft ? 'info' : 'FAIL'} ${name}: ${detail}`);
  if (!ok && !soft) report.problems.push(`점검 실패 ${name}: ${detail}`);
}

function decodePng(buf) {
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 6;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.subarray(pos + 4, pos + 8).toString('latin1');
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x += 1) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += Math.floor((a + b) / 2);
      else if (filter === 4) {
        const pa = Math.abs(b - c);
        const pb = Math.abs(a - c);
        const pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[y * stride + x] = v & 255;
    }
  }
  return { width, height, at: (x, y) => [out[y * stride + x * bpp], out[y * stride + x * bpp + 1], out[y * stride + x * bpp + 2]] };
}

async function checkSolidButton(page, name, locator, expectedRgb, tolerance = 5) {
  const box = await locator.first().boundingBox();
  if (!box) return check(name, false, '버튼 위치를 못 찾았다');
  const dpr = await page.evaluate(() => window.devicePixelRatio);
  const png = decodePng(await page.screenshot());

  const pts = [
    [10, 10], [box.width - 10, 10], [box.width * 0.35, 8], [box.width - 10, box.height - 10],
    [box.width * 0.2, box.height / 2], [box.width * 0.8, box.height / 2], [box.width / 2, 7], [box.width * 0.65, box.height - 7],
  ];
  const worst = pts
    .map(([dx, dy]) => png.at(Math.round((box.x + dx) * dpr), Math.round((box.y + dy) * dpr)))
    .map((rgb) => ({ rgb, dist: Math.max(...rgb.map((v, i) => Math.abs(v - expectedRgb[i]))) }))
    .sort((a, b) => b.dist - a.dist)[0];
  check(name, worst.dist <= tolerance, `가장 먼 픽셀 rgb(${worst.rgb.join(',')}) 기대 rgb(${expectedRgb.join(',')}) 차이 ${worst.dist}`);
}

const JADE_RGB = [47, 125, 109];

async function inspect(page, expectedWidth) {
  return page.evaluate((expected) => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
    const wide = [];
    if (scrollWidth > expected + 1) {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > expected + 1) {
          wide.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''} right=${Math.round(r.right)}`);
          if (wide.length >= 6) break;
        }
      }
    }
    const broken = [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0 && (img.currentSrc || img.src))
      .map((img) => img.currentSrc || img.src);
    return {
      innerWidth: window.innerWidth,
      clientWidth: doc.clientWidth,
      scrollWidth,
      horizontalScroll: scrollWidth > expected + 1,
      wideElements: wide,
      brokenImages: broken,
      textLength: (body.innerText ?? '').trim().length,

      badText: ((body.innerText ?? '').match(/\bundefined\b|\bNaN\b|\[object |\{(?:name|city|concern|born|hanzi)\}/g) ?? []).slice(0, 3),
      scrollY: Math.round(window.scrollY),
      pageHeight: doc.scrollHeight,
    };
  }, expectedWidth);
}

async function shot(page, name, { viewportName = 'mobile', fullPage = false, wait = 600, dialogue = true, element = null } = {}) {
  currentLabel = name;
  if (dialogue) await ready(page);
  await settle(page, wait);
  counter += 1;
  const file = `${String(counter).padStart(2, '0')}-${name}.png`;
  const width = (VIEWPORTS[viewportName] ?? MOBILE).width;
  const info = await inspect(page, width);

  if (element) {

    await page.evaluate(() => document.querySelector('.skip-link')?.style.setProperty('visibility', 'hidden'));
    await element.screenshot({ path: path.join(OUT, file) });
    await page.evaluate(() => document.querySelector('.skip-link')?.style.removeProperty('visibility'));
  } else await page.screenshot({ path: path.join(OUT, file), fullPage });
  const entry = { index: counter, name, file, url: new URL(page.url()).pathname + new URL(page.url()).search, viewport: viewportName, fullPage, ...info };
  report.shots.push(entry);
  const flags = [];
  if (info.horizontalScroll) flags.push(`가로 스크롤 ${info.scrollWidth}>${width} [${info.wideElements.join(' | ')}]`);
  if (info.brokenImages.length) flags.push(`깨진 이미지 ${info.brokenImages.join(', ')}`);
  if (info.textLength < 20) flags.push(`빈 화면 의심 (글자 ${info.textLength}자)`);
  if (info.badText.length) flags.push(`새어 나온 글자 ${info.badText.join(', ')}`);
  console.log(`  ${file}${flags.length ? '  <-- ' + flags.join('; ') : ''}`);
  for (const f of flags) report.problems.push(`${file}: ${f}`);
  return entry;
}

function step(label) {
  currentLabel = label;
  report.steps.push(label);
}

async function scrollToY(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
}

async function scrollToElement(page, locator, offset = 12) {
  await locator.first().evaluate((el, off) => {
    const top = el.getBoundingClientRect().top + window.scrollY - off;
    window.scrollTo({ top, behavior: 'instant' });
  }, offset);
}

async function newMobile(browser, extra = {}, viewportName = 'mobile') {
  const context = await browser.newContext({
    viewport: VIEWPORTS[viewportName],
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    ...extra,
  });
  const page = await context.newPage();
  watch(page, viewportName);
  return { context, page };
}

async function fillDate(page, data = FAKE) {
  await page.getByLabel('Month', { exact: true }).selectOption({ label: data.month });
  await page.getByLabel('Day', { exact: true }).fill(data.day);
  await page.getByLabel('Year', { exact: true }).fill(data.year);
}

async function fillTime(page, { hour, minute, period }) {
  await page.getByLabel('Hour', { exact: true }).fill(hour);
  await page.getByLabel('Minute', { exact: true }).fill(minute);
  await page.getByRole('radio', { name: period, exact: true }).click();
}

const THATS_ME = /^That.s me$/;
const NOT_QUITE = /^Not quite$/;

const REACTION_YES = /^(I know\.|Told you\.|Mm-hm\.)/;

const REACTION_NO = /^(Fair\.|Not quite, then\.|Okay\. I missed)/;

async function actionable(page, locator, timeout = 15_000) {
  await locator.first().waitFor({ state: 'visible', timeout });
  const handle = await locator.first().elementHandle();
  await page.waitForFunction((el) => el.isConnected && !el.closest('[inert]'), handle, { timeout, polling: 'raf' });
}

async function talkTurn(page, from, act, { prefix = '', capture = true, dotsShot = false, reaction = true, expectDots = true, shotName = from, vp = 'mobile', pacing = false } = {}) {
  currentLabel = `${prefix}${from}-turn`;
  const rec = { step: `${prefix}${from}`, startedAt: Date.now(), dots: false, reaction: null };
  await act();
  if (pacing && expectDots) {

    await page.waitForTimeout(600);
    const a = await answerAreaState(page);
    check(`answer-area-collapses-${from}`, a.open === 'false' && a.height <= 24, `답 영역 data-open=${a.open}, 높이 ${a.height}px (화면 아래와의 간격 ${a.bottomGap}px)`);
    await checkNoClippedBubbles(page, `no-clipped-bubbles-${from}`);
  }
  if (expectDots) {
    rec.dots = await page
      .waitForSelector('.dg-dots', { state: 'attached', timeout: 4000 })
      .then(() => true)
      .catch(() => false);
    if (rec.dots && dotsShot && capture) await shot(page, `${prefix}reading-${shotName}-writing`, { viewportName: vp, dialogue: false, wait: 0 });
  } else {
    await page.waitForTimeout(350);
    rec.dots = (await page.locator('.dg-dots').count()) > 0;
  }
  if (reaction) {
    const id = `r:${from}`;
    const typed = await page
      .waitForFunction(
        (msgId) => {
          const el = document.querySelector(`.dg-msg[data-id="${msgId}"]`);
          if (!el || el.querySelector('.dg-dots')) return false;
          return [...el.querySelectorAll('.invisible')].every((n) => n.textContent === '');
        },
        id,
        { timeout: 7000, polling: 'raf' },
      )
      .then(() => true)
      .catch(() => false);
    if (typed) {
      const typedAt = Date.now();
      rec.reaction = await page.evaluate((msgId) => {
        const el = document.querySelector(`.dg-msg[data-id="${msgId}"] .sr-only`);
        return (el?.textContent ?? '').replace(/^Yul:\s*/, '').trim();
      }, id);
      if (capture) await shot(page, `${prefix}reading-${shotName}-reaction`, { viewportName: vp, dialogue: false, wait: 0 });
      if (pacing && expectDots) {

        const next = await page
          .waitForFunction(() => document.querySelector('.dg-chat .dg-msg:last-child')?.dataset.id?.startsWith('q:') === true, null, { timeout: 5000, polling: 'raf' })
          .then(() => Date.now() - typedAt)
          .catch(() => -1);
        rec.listenMs = next;
        const expect = Math.round(Math.min(2400, Math.max(1100, 500 + 28 * (rec.reaction ?? '').length)));
        check(`turn-has-listening-pause-${from}`, next >= 900 && next <= expect + 700, `반응이 끝난 뒤 ${next}ms 쉬고 다음 질문(기대 약 ${expect}ms, 반응 ${(rec.reaction ?? '').length}자)`);
      }
    }
  }
  rec.ms = Date.now() - rec.startedAt;
  report.turns.push(rec);
  const label = `${prefix}${from}`;
  if (reaction) {
    check(`reaction-${label}`, !!rec.reaction && rec.reaction.length >= 8 && !/undefined|\{|\}/.test(rec.reaction), `"${(rec.reaction ?? '').slice(0, 70)}"`);
  }
  if (expectDots) check(`dots-${label}`, rec.dots, rec.dots ? '붓 점이 떴다' : '붓 점이 안 떴다');
  else check(`no-dots-${label}`, !rec.dots, rec.dots ? '동작 줄이기인데 점이 떴다' : '점 없이 바로');
  return rec;
}

async function checkChatBelowFace(page, name, ratio = 0.48, soft = false) {
  const r = await page.evaluate(() => {
    const chat = document.querySelector('.dg-chat');
    const box = chat?.getBoundingClientRect();
    const visible = [...document.querySelectorAll('.dg-msg')].filter((el) => {
      const st = getComputedStyle(el);
      return st.visibility !== 'hidden' && parseFloat(st.opacity) > 0.15 && el.getBoundingClientRect().bottom > (box?.top ?? 0) + 20;
    });
    const top = visible.length && box ? Math.max(box.top, Math.min(...visible.map((el) => el.getBoundingClientRect().top))) : null;
    return { H: window.innerHeight, chatTop: box?.top ?? null, top, n: visible.length };
  });
  const limit = r.H * ratio - 8;
  const ok = r.chatTop === null || (r.chatTop >= limit && (r.top === null || r.top >= limit));
  check(name, ok, `대화 창 윗변 y=${r.chatTop === null ? '-' : Math.round(r.chatTop)}px, 보이는 말풍선 ${r.n}개의 맨 위 y=${r.top === null ? '-' : Math.round(r.top)}px (얼굴 경계 ${Math.round(r.H * ratio)}px)`, { soft });
}

async function checkNoClippedBubbles(page, name) {
  const r = await page.evaluate(() => {
    const chat = document.querySelector('.dg-chat');
    const box = chat?.getBoundingClientRect();
    if (!box) return { n: 0, clipped: [] };
    const shown = [...document.querySelectorAll('.dg-msg')].filter((el) => parseFloat(getComputedStyle(el).opacity) > 0.15);

    const clipped = shown
      .filter((el) => el.getBoundingClientRect().top < box.top - 1 + (el.dataset.first ? 20 : 0))
      .map((el) => el.dataset.id);
    const tags = shown.filter((el) => el.querySelector('.dg-nametag')).length;
    const folded = shown.filter((el) => el.dataset.age === '2' && el.dataset.who === 'yul').map((el) => Math.round(el.getBoundingClientRect().height));
    return { n: shown.length, clipped, tags, folded };
  });
  check(name, r.clipped.length === 0 && (r.tags ?? 0) <= 1, `보이는 말풍선 ${r.n}개, 잘린 것 ${r.clipped.length}개${r.clipped.length ? ` (${r.clipped.join(', ')})` : ''}, 이름표 ${r.tags}개, 접힌 율 말풍선 높이 ${(r.folded ?? []).join('/') || '-'}`);
}

async function answerAreaState(page) {
  return page.evaluate(() => {
    const a = document.querySelector('.dg-answer');
    const r = a?.getBoundingClientRect();
    return { open: a?.getAttribute('data-open'), height: r ? Math.round(r.height) : -1, bottomGap: r ? Math.round(window.innerHeight - r.bottom) : -1 };
  });
}

async function checkPaperButtonContrast(page, name) {
  const r = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.dg-btn--paper')].find((e) => e.getBoundingClientRect().height > 0);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const nums = (c) => (c.match(/[\d.]+/g) ?? []).map(Number);
    const [br, bg, bb, ba = 1] = nums(cs.borderTopColor);
    const [fr, fg, fb] = nums(cs.backgroundColor);
    const border = [ba * br + (1 - ba) * fr, ba * bg + (1 - ba) * fg, ba * bb + (1 - ba) * fb];
    const lin = (v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
    const a = lum(border);
    const b = lum([251, 246, 238]);
    return { ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), border: cs.borderTopColor, width: cs.borderTopWidth };
  });
  check(name, !!r && r.ratio >= 3, r ? `테두리 ${r.border} (${r.width}) 대 종이색 ${r.ratio.toFixed(2)}:1 (기준 3:1)` : '.dg-btn--paper 가 보이지 않았다');
}

async function checkLinkTargets(page, name) {
  const r = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.dg-link')].filter((e) => {
      const b = e.getBoundingClientRect();
      return b.width > 0 && b.height > 0 && !e.closest('[inert]');
    });
    const small = links.filter((e) => {
      const b = e.getBoundingClientRect();
      return b.width < 43.5 || b.height < 43.5;
    });
    return { n: links.length, small: small.map((e) => `${(e.textContent ?? '').trim().slice(0, 20)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`) };
  });
  check(name, r.n > 0 && r.small.length === 0, `링크 ${r.n}개, 44px 미만 ${r.small.length}개${r.small.length ? ` (${r.small.join(', ')})` : ''}`);
}

async function pickCity(page, { capture, city = FAKE.city, label = 'Los Angeles, US' }) {
  const input = page.getByRole('combobox', { name: 'City of birth' });
  await input.click();
  await input.pressSequentially(city, { delay: 25 });
  const option = page.getByRole('option', { name: label, exact: true }).first();
  await option.waitFor({ state: 'visible', timeout: 15_000 });
  if (capture) await capture();
  await option.click();
}

async function captureHome(browser) {
  step('home');
  const { context, page } = await newMobile(browser);
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await shot(page, 'home-video-start', { dialogue: false, wait: 200 });
  const ended = await page
    .waitForFunction(() => document.querySelector('main video')?.ended === true, null, { timeout: 20_000, polling: 250 })
    .then(() => true)
    .catch(() => false);
  const video = await page.evaluate(() => {
    const v = document.querySelector('main video');
    return v ? { ended: v.ended, loop: v.loop, paused: v.paused, t: Number(v.currentTime.toFixed(2)), d: Number(v.duration.toFixed(2)) } : null;
  });
  check(
    'home-video-plays-once-and-holds',
    !!video && ended && video.loop === false && video.t >= video.d - 0.3,
    video ? `loop=${video.loop}, 끝남=${video.ended}, ${video.t}/${video.d}초 (끝 프레임에서 멈춘다)` : '영상이 없다',
  );
  await page.waitForTimeout(600);
  await shot(page, 'home', { dialogue: false, wait: 400 });
  {

    const login = await page.evaluate(() => [...document.querySelectorAll('.ac-method')].map((b) => b.getAttribute('data-method')));
    check('home-login-first', login[0] === 'google', `맨 위 로그인 단추: ${login.join(', ') || '없음'}`);
  }
  {

    const petals = await page.evaluate(() => ({ petals: document.querySelectorAll('.petal').length, bloom: document.querySelectorAll('.dg-bloom').length }));
    check('home-has-petals-and-bloom', petals.petals > 0 && petals.bloom > 0, `꽃잎 ${petals.petals}개, 번짐 층 ${petals.bloom}개`);
  }
  {

    const imgs = await page.evaluate(() => [...document.querySelectorAll('main img')].map((i) => decodeURIComponent(i.currentSrc || i.src)));
    check('home-only-the-stairs-picture', imgs.length >= 1 && imgs.every((u) => /enter\.jpg/.test(u)), `main 안의 그림 ${imgs.length}개: ${imgs.map((u) => u.replace(/^.*url=/, '').slice(0, 40)).join(', ')}`);
  }

  await page.getByRole('link', { name: 'Start my free reading' }).click();
  await page.waitForTimeout(260);
  const gate = await page.evaluate(() => !!document.querySelector('.mx-gate .mx-gate-wash'));
  const gateOrigin = await page.evaluate(() => {
    const el = document.querySelector('.mx-gate');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { x: parseFloat(cs.getPropertyValue('--gate-x')), y: parseFloat(cs.getPropertyValue('--gate-y')), h: window.innerHeight, w: window.innerWidth };
  });
  await shot(page, 'home-gate-bloom', { dialogue: false, wait: 0 });
  check('home-gate-bloom-appears', gate, gate ? '문빛 번짐(.mx-gate)이 화면을 덮는다' : '번짐 층이 없다');

  check(
    'home-gate-bloom-starts-at-the-door',
    !!gateOrigin && gateOrigin.y / gateOrigin.h >= 0 && gateOrigin.y / gateOrigin.h < 0.34 && Math.abs(gateOrigin.x / gateOrigin.w - 0.5) < 0.12,
    gateOrigin ? `시작 자리 x=${Math.round(gateOrigin.x)}px (${Math.round((gateOrigin.x / gateOrigin.w) * 100)}%), y=${Math.round(gateOrigin.y)}px (${Math.round((gateOrigin.y / gateOrigin.h) * 100)}%)` : '문빛 층을 못 찾았다',
  );
  await page.waitForURL(/\/reading/, { timeout: 8000 });
  const arrive = await page.evaluate(() => !!document.querySelector('.dg-arrive'));
  await shot(page, 'reading-arrive', { dialogue: false, wait: 0 });
  check('reading-arrives-in-the-gold', arrive, arrive ? '/reading 이 같은 금빛(.dg-arrive)에서 걷히며 시작한다' : '도착 베일이 없다(하드 컷)');
  await context.close();

  const shared = await newMobile(browser);
  await shared.page.goto(`${BASE}/?t=candle`, { waitUntil: 'load' });
  await shared.page.waitForTimeout(1200);
  await shot(shared.page, 'home-shared-link', { dialogue: false, wait: 800 });
  await shared.context.close();

  const desktop = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1, locale: 'en-US' });
  const dpage = await desktop.newPage();
  watch(dpage, 'desktop');
  await dpage.goto(`${BASE}/`, { waitUntil: 'load' });
  await dpage.waitForTimeout(1800);
  await shot(dpage, 'home-desktop', { viewportName: 'desktop', dialogue: false, wait: 800 });
  await desktop.close();
}

const GENDER_WORDS = /\b(wom[ae]n|m[ae]n|male|female|girl|boy)\b/i;

async function checkConcernStep(page, name) {
  const measure = () =>
    page.evaluate(() => {
      const H = window.innerHeight;
      const chips = [...document.querySelectorAll('.dg-concerns__chips button')];
      const out = chips.filter((c) => {
        const b = c.getBoundingClientRect();
        return b.top < 0 || b.bottom > H + 0.5 || b.width < 40;
      });
      const labels = [...document.querySelectorAll('.dg-concerns__label')].map((e) => (e.textContent ?? '').trim());
      const q = [...document.querySelectorAll('.dg-msg[data-id^="q:"]')].at(-1);
      const qb = q?.getBoundingClientRect();
      const doc = document.documentElement;
      return { n: chips.length, out: out.map((c) => (c.textContent ?? '').trim()), labels, qTop: qb ? Math.round(qb.top) : null, scroll: doc.scrollHeight - H };
    });
  const good = (r) => r.n === 11 && r.out.length === 0 && r.labels.join('|').toLowerCase() === 'love|life' && r.qTop !== null && r.qTop >= 0 && r.scroll <= 1;

  let r = await measure();
  for (let i = 0; i < 10 && !good(r); i += 1) {
    await page.waitForTimeout(300);
    r = await measure();
  }
  check(name, good(r), `칩 ${r.n}개(화면 밖 ${r.out.length}개${r.out.length ? ': ' + r.out.join(', ') : ''}), 묶음 [${r.labels.join(', ')}], 질문 윗변 y=${r.qTop}px, 스크롤 여지 ${r.scroll}px`);
}

async function runReading(page, cfg) {
  const { data, prefix = '', capture = true, main = false, pause = 0, reduced = false, viaHome = false } = cfg;
  const S = (name, opts) => (capture ? shot(page, `${prefix}${name}`, opts) : null);
  const beat = (ms = pause) => (ms ? page.waitForTimeout(ms) : null);
  const turn = (from, act, extra = {}) => talkTurn(page, from, act, { prefix, capture, expectDots: !reduced, ...extra });
  const Continue = page.getByRole('button', { name: 'Continue' });

  if (viaHome) {
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await page.waitForTimeout(pause ? 3200 : 800);
    await page.getByRole('link', { name: 'Start my free reading' }).click();
    await page.waitForURL(/\/reading/, { timeout: 8000 });
  } else {
    await page.goto(`${BASE}/reading`, { waitUntil: 'load' });
  }
  const hi = page.getByRole('button', { name: 'Hi, Yul' });
  await actionable(page, hi);
  await S('reading-greeting');
  if (main) {
    const petals = await page.evaluate(() => ({ petals: document.querySelectorAll('.petal').length, bloom: document.querySelectorAll('.dg-bloom').length }));
    check('reading-has-no-petals-or-pink-bloom', petals.petals === 0 && petals.bloom === 0, `대화 화면의 꽃잎 ${petals.petals}개, 분홍 번짐 층 ${petals.bloom}개`);
    await checkSolidButton(page, 'greeting-button-solid', hi, JADE_RGB);
    await checkChatBelowFace(page, 'chat-below-face-greeting');
  }
  await beat(1400);
  await turn('greeting', () => hi.click(), { reaction: false });

  const nameInput = page.getByLabel('Name or nickname');
  await actionable(page, nameInput);
  if (cfg.name) await nameInput.pressSequentially(cfg.name, { delay: pause ? 110 : 0 });
  await S('reading-name');
  if (main) await checkChatBelowFace(page, 'chat-below-face-name');
  await beat();
  const nameTurn = await turn('name', () => Continue.click(), { dotsShot: true, pacing: main });

  const concernBtn = page.getByRole('button', { name: data.concern, exact: true });
  await actionable(page, concernBtn);
  if (main) report.nameTurnMs = Date.now() - nameTurn.startedAt;
  await S('reading-concern');
  await checkConcernStep(page, `concern-chips-fit${prefix ? '-' + prefix.replace(/-$/, '') : ''}`);
  await beat();
  await turn('concern', () => concernBtn.click(), { pacing: main, shotName: 'concern' });

  const month = page.getByLabel('Month', { exact: true });
  await actionable(page, month);
  await fillDate(page, data);
  await S('reading-date');
  if (main) {

    await checkSolidButton(page, 'date-continue-solid', Continue, JADE_RGB);
    await checkChatBelowFace(page, 'chat-below-face-date');
  }
  await beat();
  await turn('date', () => Continue.click(), { dotsShot: true, pacing: main });

  const hour = page.getByLabel('Hour', { exact: true });
  await actionable(page, hour);
  if (cfg.time) await fillTime(page, cfg.time);
  await S('reading-time');
  if (main) await checkLinkTargets(page, 'link-targets-time');
  await beat();
  if (main && cfg.time) {
    const t0 = Date.now();
    await Continue.click();
    await page.waitForSelector('.dg-dots', { state: 'attached', timeout: 4000 }).catch(() => {});
    await page.touchscreen.tap(195, 130);
    await actionable(page, page.getByRole('combobox', { name: 'City of birth' }));
    const ms = Date.now() - t0;
    check('tap-skips-the-wait', ms < 1000 && ms < report.nameTurnMs, `탭으로 건너뛴 전환 ${ms}ms (건너뛰지 않은 이름 단계 전환 ${report.nameTurnMs}ms)`);
    check('turn-has-pacing', report.nameTurnMs >= 1200, `건너뛰지 않은 전환 ${report.nameTurnMs}ms (쓰는 중 점과 타자가 연출된다)`);
  } else {
    const submit = cfg.time ? Continue : page.getByRole('button', { name: /^I don.t know$/ });
    await turn('time', () => submit.click(), { shotName: 'time' });
  }

  const combo = page.getByRole('combobox', { name: 'City of birth' });
  await actionable(page, combo);
  await S('reading-place');
  await beat();
  await turn(
    'place',
    () =>
      pickCity(page, {
        city: data.city,
        label: data.label,
        capture: main ? () => shot(page, 'reading-place-list', { wait: 300, dialogue: false }) : null,
      }),
    { dotsShot: false },
  );

  const sexBtn = page.getByRole('button', { name: cfg.sex, exact: true });
  await actionable(page, sexBtn);
  await S('reading-sex');
  {
    const names = await page.evaluate(() => [...document.querySelectorAll('.dg-answer button')].map((b) => (b.textContent ?? '').trim()).filter(Boolean));
    check(`sex-has-four-ways${prefix ? '-' + prefix.replace(/-$/, '') : ''}`, ['Woman', 'Man', 'Non-binary', 'Skip'].every((n) => names.includes(n)), `성별 답 ${names.join(' / ')}`);
  }
  if (main) {
    await checkChatBelowFace(page, 'chat-below-face-sex');
    await checkLinkTargets(page, 'link-targets-sex');
  }
  await beat();
  const nonBinary = cfg.sex === 'Non-binary';
  const sexTurn = await turn('sex', () => sexBtn.click(), { reaction: !nonBinary });
  if (cfg.sex === 'Skip') {
    check(`sex-skip-reaction${prefix ? '-' + prefix.replace(/-$/, '') : ''}`, /ten-year chapters closed/i.test(sexTurn.reaction ?? ''), `"${(sexTurn.reaction ?? '').slice(0, 70)}"`);
  }
  if (nonBinary) {
    const nbBtn = page.getByRole('button', { name: cfg.nb, exact: true });
    await actionable(page, nbBtn);
    await S('reading-nb');
    const labels = await page.evaluate(() => [...document.querySelectorAll('.dg-answer button')].map((b) => (b.textContent ?? '').trim()).filter(Boolean));
    check('nb-asks-yin-yang-without-gender-words', ['Yang reading', 'Yin reading', 'Skip the chapters'].every((n) => labels.includes(n)), `음양 질문 답 ${labels.join(' / ')}`);
    {

      const hint = await page.locator('.dg-answer').innerText();
      check('nb-has-a-hint-line', /Not sure\? Either is fine\./.test(hint), `답 영역 "${hint.replace(/\s+/g, ' ').slice(-110)}"`);
    }
    const chatText = await page.locator('.dg-chat').innerText();

    const yulText = await page.evaluate(() => [...document.querySelectorAll('.dg-msg[data-who="yul"]')].map((e) => e.textContent ?? '').join(' '));
    check('nb-question-has-no-gender-words', !GENDER_WORDS.test(yulText.replace(/Non-binary/g, '')), `"${yulText.replace(/\s+/g, ' ').slice(-120)}" (대화 창 ${chatText.length}자)`);
    await beat();
    await turn('nb', () => nbBtn.click(), { reaction: true });
  }

  await page.waitForURL(/step=ritual/, { timeout: 15_000 });
  if (main) {

    await page.evaluate(() => {
      window.__wash = null;
      new MutationObserver(() => {
        if (!window.__wash && document.querySelector('.dg-wash--in')) window.__wash = { search: location.search };
      }).observe(document.body, { childList: true, subtree: true });
    });
  }
  const glyphs = page.locator('.dg-ritual-glyphs .mx-glyph');
  const glyphSeen = await glyphs.first().waitFor({ state: 'attached', timeout: 14_000 }).then(() => true).catch(() => false);
  if (!glyphSeen) {
    problem(`${prefix}ritual 글자(.dg-ritual-glyphs .mx-glyph)가 14초 안에 나타나지 않았다`);
    return;
  }
  if (cfg.glyphs) {
    const n = await glyphs.count();
    check(`ritual-glyph-count${prefix ? '-' + prefix.replace(/-$/, '') : ''}`, n === cfg.glyphs, `의식에 한자 ${n}개(기대 ${cfg.glyphs})`);
  }
  {
    const paper = await page.evaluate(() => document.querySelectorAll('.dg-slip, .ritual-char, [class*="slip"]').length);
    check(`ritual-has-no-paper-slip${prefix ? '-' + prefix.replace(/-$/, '') : ''}`, paper === 0, paper === 0 ? '종이 쪽지 상자가 없다' : `종이 쪽지 요소 ${paper}개`);
  }
  await page.waitForTimeout(reduced ? 150 : 1100);
  await S('reading-ritual-rising', { wait: 0, dialogue: false });

  await page
    .waitForFunction(
      () => {
        const g = [...document.querySelectorAll('.dg-ritual-glyphs .mx-glyph')];
        const last = g.at(-1);
        return g.length > 0 && getComputedStyle(last).opacity === '1' && g.every((el) => parseFloat(getComputedStyle(el).opacity) > 0.97);
      },
      null,
      { timeout: 8000, polling: 80 },
    )
    .catch(() => {});
  await S('reading-ritual-full', { wait: 0, dialogue: false });
  if (main) {

    await page.waitForURL(/step=result/, { timeout: 12_000 }).catch(() => {});
    const wash = await page.evaluate(() => window.__wash ?? null);
    check('ritual-wash-before-result', !!wash && /step=ritual/.test(wash.search), wash ? `번짐이 뜬 때의 주소 ${wash.search}` : '결과로 넘어갈 때까지 금빛 번짐이 뜨지 않았다');
  }
}

const CHAPTER_HEADLINE = /^You.re in chapter \d+: The Chapter of [A-Z][a-z]+(?: (?:and )?[A-Z][a-z]+)*\.$/;
const CHAPTER_BEFORE = /^Your first chapter hasn.t opened yet\.$/;
const CHAPTER_DETAIL = /^(It opened (in [A-Z][a-z]+ \d{4}, )?when you were \d+, and runs ten years\.|At age \d+, it begins: The Chapter of [A-Z][a-z]+(?: (?:and )?[A-Z][a-z]+)*\.)$/;

async function hitTexts(page) {
  return page.locator('[id$="-hit-0"], [id$="-hit-1"], [id$="-hit-2"]').allTextContents();
}

async function answerHits(page, answers, { pause = 0, onEach = null } = {}) {
  for (let i = 0; i < answers.length; i += 1) {
    const btn = page.getByRole('button', { name: answers[i] === 'yes' ? THATS_ME : NOT_QUITE });
    await btn.first().waitFor({ state: 'visible', timeout: 8000 });
    if (pause) await page.waitForTimeout(pause);
    await btn.first().click();
    if (onEach) await onEach(i);
  }
}

async function readChapterHeadline(page) {
  const line = page.getByText(/^You.re in chapter \d+:|^Your first chapter hasn/).first();
  await line.waitFor({ state: 'visible', timeout: 8000 });
  return ((await line.textContent()) ?? '').replace(/\s+/g, ' ').trim();
}

async function readChapterDetail(page) {
  const line = page.getByText(/^It opened (in [A-Z][a-z]+ \d{4}, )?when you were|^At age \d+, it begins/).first();
  await line.waitFor({ state: 'visible', timeout: 8000 });
  return ((await line.textContent()) ?? '').replace(/\s+/g, ' ').trim();
}

async function checkChapterNextLine(page, name) {
  const text = await page.getByRole('region', { name: 'Your life map' }).innerText();
  const current = text.match(/chapter \d+: (The Chapter of [A-Z][a-z]+(?: (?:and )?[A-Z][a-z]+)*)/)?.[1];
  const next = text.match(/Next chapter\s+(.+)/)?.[1]?.trim();
  const ok = !current || !next || !next.startsWith(current) || /again/.test(next);
  check(name, ok, `지금 "${current ?? '-'}", 다음 "${(next ?? '-').slice(0, 60)}"`);
}

async function waitResult(page) {
  await page.waitForURL(/step=result/, { timeout: 25_000 });
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForSelector('.dg-wash--out', { state: 'detached', timeout: 6000 }).catch(() => {});
}

async function revealPanel(page, panel, { holdMs = 1500 } = {}) {
  await panel.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const h = window.innerHeight;
    const top = r.height > h - 80 ? window.scrollY + r.top - 16 : window.scrollY + r.top - (h - r.height) / 2;
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  });
  await page.waitForFunction((el) => el.getAttribute('data-seen') === 'true', await panel.elementHandle(), { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(holdMs);
}

async function panelPass(page, prefix, { holdMs = 1500 } = {}) {
  const taken = [];
  for (let guard = 0; guard < 40; guard += 1) {
    const panel = page.locator('.wt-panel:not([data-shot])').first();
    if ((await panel.count()) === 0) break;
    const mark = String(taken.length + 1);
    const info = await panel.evaluate((el, id) => {
      el.setAttribute('data-shot', id);
      const frame = el.querySelector('.wt-panel__art') ?? el.querySelector('.wt-panel__frame');
      const fb = frame?.getBoundingClientRect();
      const ratio = fb && fb.height > 0 ? Number((fb.width / fb.height).toFixed(2)) : null;
      const img = el.querySelector('.wt-panel__art img');
      if (img) {
        const u = new URL(img.currentSrc || img.src, location.href);
        const p = u.pathname === '/_next/image' ? decodeURIComponent(u.searchParams.get('url') ?? '') : u.pathname;
        return { label: p.split('/').pop().replace(/\.\w+$/, ''), src: p, ratio, aspect: el.getAttribute('data-aspect') ?? 'portrait' };
      }
      if (el.querySelector('.rs-lantern-scene')) return { label: 'lanterns', src: null, ratio, aspect: 'scene' };
      if (el.querySelector('.wt-orbs')) return { label: 'orbs', src: null, ratio, aspect: 'scene' };
      if (el.classList.contains('rs-hand')) return { label: 'hand', src: null, ratio, aspect: 'plain' };
      return { label: 'plain', src: null, ratio, aspect: 'plain' };
    }, mark);
    await revealPanel(page, page.locator(`.wt-panel[data-shot="${mark}"]`), { holdMs });

    await revealPanel(page, page.locator(`.wt-panel[data-shot="${mark}"]`), { holdMs: 300 });
    const n = String(taken.length + 1).padStart(2, '0');
    await shot(page, `${prefix}p${n}-${info.label}`, { dialogue: false, wait: 0 });
    taken.push({ index: taken.length + 1, ...info });
  }

  await page.evaluate(() => document.querySelectorAll('.wt-panel[data-shot]').forEach((el) => el.removeAttribute('data-shot')));
  report.panels.push({ prefix, panels: taken });
  return taken;
}

async function imageAudit(page, name, expectPanelArt = null) {
  const r = await page.evaluate(() => {
    const decode = (img) => {
      const u = new URL(img.currentSrc || img.src, location.href);
      return u.pathname === '/_next/image' ? decodeURIComponent(u.searchParams.get('url') ?? '') : u.pathname + (u.pathname === '/api/card' ? '' : '');
    };
    return [...document.images].map((img) => ({ src: decode(img), ok: img.complete && img.naturalWidth > 0, panel: !!img.closest('.wt-panel'), lazyPending: !img.complete && img.loading === 'lazy' }));
  });
  const panel = r.filter((i) => i.panel);
  const counts = {};
  for (const i of panel) counts[i.src] = (counts[i.src] ?? 0) + 1;
  const dup = Object.entries(counts).filter(([, n]) => n > 1).map(([src]) => src);
  const old = r.filter((i) => OLD_ART.test(i.src)).map((i) => i.src);
  const broken = r.filter((i) => !i.ok && !i.lazyPending).map((i) => i.src);
  check(`${name}-panel-art-not-repeated`, dup.length === 0, dup.length ? `두 번 쓰인 칸 그림: ${dup.join(', ')}` : `칸 그림 ${panel.length}장 모두 다르다`);
  check(`${name}-no-old-art`, old.length === 0, old.length ? `옛 그림: ${old.join(', ')}` : '옛 그림 없음');
  check(`${name}-no-broken-images`, broken.length === 0, broken.length ? `깨진 그림: ${broken.join(', ')}` : '깨진 그림 없음');
  if (expectPanelArt !== null) check(`${name}-panel-art-count`, panel.length === expectPanelArt, `칸 그림 ${panel.length}장(기대 ${expectPanelArt}장)`, { soft: true });
  return { panel: panel.map((i) => i.src), all: r.map((i) => i.src) };
}

async function checkPanelRhythm(page, name, taken) {
  const art = taken.filter((t) => t.src);
  const aspects = art.map((t) => t.aspect);
  let run = 0;
  let worst = 0;
  for (const a of aspects) {
    run = a === 'tall' ? run + 1 : 0;
    worst = Math.max(worst, run);
  }
  const kinds = new Set(aspects);
  check(`${name}-no-three-tall-panels-in-a-row`, worst < 3, `그림 칸 비율 ${art.map((t) => `${t.label}=${t.aspect}(${t.ratio})`).join(', ')}`);
  check(`${name}-panel-shapes-vary`, kinds.size >= 4, `그림 칸 모양 ${kinds.size}종: ${[...kinds].join(', ')}`);
}

async function checkBubbleCraft(page, name) {
  const r = await page.evaluate(() => {
    const bubbles = [...document.querySelectorAll('.wt-bubble')].filter((b) => !b.closest('[inert]') && !b.closest('.rs-hidden'));
    const empty = bubbles.filter((b) => (b.innerText ?? '').replace(/\s+/g, '').length === 0 && !b.querySelector('.wt-dots, svg, img')).length;
    const labels = document.querySelectorAll('.wt-bubble .wt-bubble__label').length;
    const mouthed = document.querySelectorAll('.wt-bubble[data-mouth]').length;
    const long = bubbles
      .map((b) => (b.innerText ?? '').replace(/\s+/g, ' ').trim())
      .filter((t) => (t.match(/[.!?…]["”’']?(\s|$)/g) ?? []).length > 3)
      .map((t) => t.slice(0, 60));
    return { n: bubbles.length, empty, labels, mouthed, long };
  });
  check(`${name}-no-empty-bubbles`, r.empty === 0, `말풍선 ${r.n}개 중 빈 것 ${r.empty}개`);
  check(`${name}-no-sans-label-inside-bubble`, r.labels === 0, `말풍선 안 산세리프 꼬리표 ${r.labels}개`);
  check(`${name}-bubble-tails-point-at-mouths`, r.mouthed > 0, `입 위치를 가리키는 꼬리 ${r.mouthed}개`);
  check(`${name}-bubbles-are-short`, r.long.length === 0, r.long.length ? `문장 4개 이상 말풍선: ${r.long.join(' | ')}` : '말풍선은 모두 3문장 이하', { soft: true });
}

async function checkWebtoonStructure(page, prefix, { chapterTitle, lanterns, h1 }) {
  const h2 = await page.locator('main h2').allTextContents();
  check(`${prefix}chapter-titles`, JSON.stringify(h2.map((t) => t.trim()).slice(0, 3)) === JSON.stringify(['Who you are', chapterTitle, 'Your road']), `장 제목 ${JSON.stringify(h2.map((t) => t.trim()))}`);
  const h1Text = ((await page.getByRole('heading', { level: 1 }).first().textContent()) ?? '').trim();
  check(`${prefix}h1-names-the-type`, h1.test(h1Text), `"${h1Text}"`);
  const lanternCount = await page.locator('.wt-lantern').count();
  check(`${prefix}lanterns-drawn-in-code`, lanternCount === lanterns, `등롱 기둥 ${lanternCount}개(기대 ${lanterns})`);
  const orbs = await page.locator('.wt-orbs li').count();
  check(`${prefix}five-orbs`, orbs === 5, `오행 구슬 ${orbs}개`);
  const hanja = (await page.locator('.wt-lantern').first().textContent()) ?? '';
  check(`${prefix}hanzi-are-text-not-pictures`, /[一-鿿]/.test(hanja), `등롱 안 글자 "${hanja.replace(/\s+/g, ' ').slice(0, 24)}"`);
  const paper = await page.evaluate(() => document.querySelectorAll('.dg-slip, .ritual-char').length);
  check(`${prefix}no-paper-slip`, paper === 0, paper === 0 ? '글자가 든 종이 쪽지가 없다' : `종이 쪽지 ${paper}개`);
}

async function captureResultMain(page) {
  await waitResult(page);
  step('result');
  await scrollToY(page, 0);
  await shot(page, 'result-top', { dialogue: false, wait: 1200 });
  await checkWebtoonStructure(page, '', { chapterTitle: FAKE.concernTitle, lanterns: 4, h1: /you.re [\w-]+-born\.$/i });

  step('result-panels');
  const taken = await panelPass(page, 'result-');
  check('result-panel-order', taken.length >= 13, `칸 ${taken.length}개: ${taken.map((t) => t.label).join(' > ')}`);
  {

    const labels = taken.map((t) => t.label);
    const at = (l) => labels.indexOf(l);
    const ordered = [at('yul-explain'), at('lanterns'), at('orbs'), at('yul-read'), at('yul-oho'), at('yul-candy-ease'), at('yul-backdoor'), at('yul-balcony-back'), at('yul-door-hand')].every((v, i, a) => v >= 0 && (i === 0 || v > a[i - 1]));
    check('result-panel-order-follows-the-route', ordered, labels.join(' > '));
    check('result-ends-at-the-inner-door', labels.at(-1) === 'yul-door-hand', `마지막 칸 ${labels.at(-1)}`);
  }
  await imageAudit(page, 'result');
  await checkPanelRhythm(page, 'result', taken);
  await checkBubbleCraft(page, 'result');

  step('result-chart');

  const showChart = page.getByRole('button', { name: 'Show the chart' });
  await scrollToElement(page, showChart, 360);
  await showChart.click();
  await shot(page, 'result-chart-open', { dialogue: false, wait: 700 });

  step('what-i-see');
  const wisHeading = page.getByRole('heading', { name: 'What I see' });
  await scrollToElement(page, wisHeading, 24);
  const sawDots = await page.waitForSelector('.wt-dots', { state: 'attached', timeout: 3000 }).then(() => true).catch(() => false);
  if (sawDots) await shot(page, 'result-whatisee-writing', { dialogue: false, wait: 0 });
  await page.getByRole('button', { name: THATS_ME }).first().waitFor({ state: 'visible', timeout: 8000 });
  await shot(page, 'result-whatisee-before', { dialogue: false, wait: 700 });
  await checkPaperButtonContrast(page, 'paper-button-border-contrast');
  const before = await hitTexts(page);
  check('what-i-see-first-bubble-before-answer', before.length === 1 && before[0].length > 20, `답하기 전 말풍선 ${before.length}개: "${(before[0] ?? '').slice(0, 60)}"`);

  const region = page.getByRole('region', { name: 'What I see' });
  await answerHits(page, ['yes', 'no', 'yes'], {
    onEach: async (i) => {

      await page.waitForTimeout(1700);
      if (i < 2) {
        const li = region.locator('ol > li').nth(i + 1);
        await li.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});
        await revealPanel(page, li.locator('.wt-panel').first(), { holdMs: 600 });
        await shot(page, `result-whatisee-hit${i + 2}`, { dialogue: false, wait: 0 });
      }
    },
  });
  await page.getByText(REACTION_YES).first().waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(900);
  const hits = await hitTexts(page);
  check('what-i-see-three-hits', hits.length === 3 && hits.every((h) => h.length >= 20 && h.length <= 200), `말풍선 ${hits.length}개, 글자 수 ${hits.map((h) => h.length).join('/')}`);
  const reactionText = await page.getByText(REACTION_YES).first().textContent();
  check('what-i-see-reaction-mostly-yes', REACTION_YES.test(reactionText ?? ''), `"${(reactionText ?? '').slice(0, 60)}"`);
  await shot(page, 'result-whatisee-after', { dialogue: false, wait: 700 });
  await shot(page, 'result-whatisee-full', { dialogue: false, wait: 200, element: region });
  {

    const arts = await region.locator('.wt-panel').evaluateAll((els) => els.map((e) => (e.querySelector('.wt-panel__art img') ? 'art' : 'plain')));
    check('what-i-see-panels-all-art', JSON.stringify(arts) === JSON.stringify(['art', 'art', 'art']), `칸 ${arts.join(', ')}`);
  }

  await page.reload({ waitUntil: 'load' });
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForSelector('.dg-wash--out', { state: 'detached', timeout: 6000 }).catch(() => {});
  await scrollToElement(page, wisHeading, 24);
  await page.getByText(REACTION_YES).first().waitFor({ state: 'visible', timeout: 10_000 });
  const restored = await hitTexts(page);
  const answeredBubbles = await page.getByText(/^(Your answer: )?(That.s me|Not quite)$/).count();
  check('what-i-see-restored-after-reload', JSON.stringify(restored) === JSON.stringify(hits) && answeredBubbles >= 3, `같은 말풍선 ${JSON.stringify(restored) === JSON.stringify(hits)}, 복원된 답 ${answeredBubbles}개`);
  await scrollToElement(page, wisHeading, 24);
  await shot(page, 'result-whatisee-restored', { dialogue: false, wait: 800 });

  step('concern-candy-salt');
  {
    const bubbles = await page.locator('section[aria-labelledby="chapter-concern"] .wt-panel').first().locator('.wt-bubble').count();
    check('concern-line-is-balloons-of-three-or-fewer', bubbles >= 1 && bubbles <= 3, `고민 풀이 말풍선 ${bubbles}개`);
  }
  const hand = page.getByRole('button', { name: 'Hold out your hand' });
  await scrollToElement(page, hand, 300);
  await shot(page, 'result-hand', { dialogue: false, wait: 800 });
  await hand.click();
  const saltPanel = page.locator('.wt-panel').filter({ hasText: /Not a curse/ });
  await saltPanel.waitFor({ state: 'visible', timeout: 8000 });
  await page.waitForTimeout(900);
  await revealPanel(page, saltPanel.first(), { holdMs: 1200 });
  await shot(page, 'result-salt', { dialogue: false, wait: 0 });
  check('salt-says-weather-not-curse', (await saltPanel.first().innerText()).includes('Just weather'), '소금 칸 끝에 "Not a curse. Just weather."');
  const why = page.getByRole('button', { name: 'Why this much caution?' });
  if (await why.count()) {
    await why.click();
    await shot(page, 'result-salt-why', { dialogue: false, wait: 500 });
  }
  await imageAudit(page, 'result-after-salt');

  step('chapters');
  const lifeMap = page.getByRole('heading', { name: 'Your life map' });
  await scrollToElement(page, lifeMap, 16);
  const headline = await readChapterHeadline(page);
  await shot(page, 'result-chapter-with-sex', { dialogue: false, wait: 700 });
  check('chapter-headline-from-engine', CHAPTER_HEADLINE.test(headline) || CHAPTER_BEFORE.test(headline), `"${headline.slice(0, 100)}"`);
  const detail = await readChapterDetail(page);
  check('chapter-detail-no-age-year-overlap', CHAPTER_DETAIL.test(detail) && !/age \d+.\d+/.test(detail) && !/\d{4}.\d{4}/.test(detail), `"${detail.slice(0, 110)}"`);
  const chapterText = await page.getByRole('region', { name: 'Your life map' }).innerText();
  const titles = chapterText.match(/The Chapter of [A-Z][a-z]+(?: (?:and )?[A-Z][a-z]+)*/g) ?? [];
  await checkChapterNextLine(page, 'chapter-next-line-with-sex');
  check('chapter-shows-only-current-and-next-titles', titles.length <= 2, `장 제목 ${titles.length}개 보임: ${titles.join(', ')}`);
  check('chapter-strip-labelled', (await page.getByRole('img', { name: /ten-year chapters/ }).count()) === 1, '띠에 스크린리더용 설명이 하나 있다');
  check('chapter-text-has-no-gender-words', !GENDER_WORDS.test(chapterText), '10년 장 칸에 성별 단어가 없다');

  step('deeper');
  const pitch = page.getByRole('region', { name: 'More of your reading' });
  await scrollToElement(page, pitch, 0);
  await shot(page, 'result-deeper-top', { dialogue: false, wait: 900 });
  const reserve = page.getByRole('link', { name: 'Explore the rooms' });
  await reserve.waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForFunction(() => !document.querySelector('[aria-label="More of your reading"] .rs-hidden'), null, { timeout: 15_000 }).catch(() => {});
  await scrollToElement(page, pitch.locator('.rs-menu'), 120);
  await shot(page, 'result-deeper-full', { dialogue: false, wait: 600 });
  await scrollToElement(page, reserve, 440);
  await shot(page, 'result-deeper-cta', { dialogue: false, wait: 600 });
  {
    const text = (await pitch.innerText()).replace(/\s+/g, ' ');
    const bubbles = await pitch.locator('.wt-bubble').count();

    const order = await pitch.evaluate((el) =>
      [...el.querySelectorAll(':scope > div:nth-of-type(2) > div.relative > div:first-child')].map((n) => (n.querySelector('.rs-menu') ? 'menu' : n.querySelector('.wt-bubble') ? 'bubbles' : 'other')),
    );
    const textBubbles = await pitch.locator('.rs-menu').count();
    const outside = bubbles - 1;
    check('pitch-is-a-conversation', bubbles >= 3 && bubbles <= 6 && (await pitch.locator('h3').count()) === 0 && textBubbles === 1 && order.join('>') === 'bubbles>menu>bubbles', `말풍선 ${bubbles}개(칸 밖 ${outside}개), 상품 목록 상자 ${textBubbles}개, 박자 ${order.join('>')}, 상품 제목(h3) ${await pitch.locator('h3').count()}개`);
    check('pitch-calls-the-person-by-chapter', /peeked ahead/i.test(text) && /Chapter of/.test(text), '그 사람의 장을 부르는 다리 말풍선이 있다');
    check('pitch-honest-about-not-open', /isn.t open yet/i.test(text) && /\$3\.90/.test(text), '열리지 않은 방 안내와 방 가격($3.90)을 말풍선 안에서 밝힌다');
    const pressure = text.match(/hurry|limited time|last chance|only \d+ left|expires|ends (today|soon)|\b\d{1,2}:\d{2}:\d{2}\b|% off|discount/i);
    check('pitch-no-pressure', !pressure, pressure ? `압박 표현: ${pressure[0]}` : '타이머·할인·놓친다는 말 없음');

    const box = await reserve.boundingBox();
    check('pitch-cta-is-visible', !!box && box.width > 0, `버튼 x=${Math.round(box?.x ?? 0)}~${Math.round((box?.x ?? 0) + (box?.width ?? 0))} (폭 ${MOBILE.width})`);
  }

  {
    const rooms = pitch.locator('.rs-menu__room');
    check('pitch-has-five-room-links', (await rooms.count()) === 5, '다섯 방으로 이어지는 링크가 있다');
    check('pitch-cta-opens-rooms', (await reserve.getAttribute('href')) === '/home#rooms', '방 목록으로 이어진다');
  }

  const shareHeading = page.getByRole('heading', { name: 'Take it with you.' });
  await scrollToElement(page, shareHeading, 16);
  await page
    .waitForFunction(() => [...document.images].some((i) => i.src.includes('/api/card') && i.complete && i.naturalWidth > 0), null, { timeout: 20_000 })
    .catch(() => problem('공유 카드 이미지가 20초 안에 그려지지 않았다'));
  await shot(page, 'result-share', { dialogue: false, wait: 700 });
  {

    const thumb = page.locator('.rs-card__thumb');
    const before = await thumb.boundingBox();
    const expandedBefore = await thumb.getAttribute('aria-expanded');
    check('share-card-starts-as-a-small-thumbnail', expandedBefore === 'false' && !!before && before.width <= 100, `접힌 썸네일 ${Math.round(before?.width ?? 0)}x${Math.round(before?.height ?? 0)}px, aria-expanded=${expandedBefore}`);
    await thumb.click();
    await page.waitForTimeout(700);
    const after = await thumb.boundingBox();
    const expandedAfter = await thumb.getAttribute('aria-expanded');
    check('share-card-expands-on-tap', expandedAfter === 'true' && !!after && !!before && after.height > before.height * 2, `펼친 카드 ${Math.round(after?.width ?? 0)}x${Math.round(after?.height ?? 0)}px, aria-expanded=${expandedAfter}`);
    await shot(page, 'result-share-open', { dialogue: false, wait: 300 });
    await thumb.click();
    await page.waitForTimeout(500);
  }
  await scrollToY(page, await page.evaluate(() => document.documentElement.scrollHeight));
  await shot(page, 'result-footer', { dialogue: false, wait: 500 });
  await checkLinkTargets(page, 'link-targets-result');
  await imageAudit(page, 'result-end');

  await checkResultTextRules(page, 'result');

  step('email-modal');
  await scrollToElement(page, reserve, 440);
  await reserve.click();
  await page.getByRole('dialog').waitFor();
  await shot(page, 'email-modal', { dialogue: false, wait: 700 });
  {
    const dialogText = (await page.getByRole('dialog').innerText()).replace(/\s+/g, ' ');
    check('email-modal-names-the-product', /Save my seat: The Full Reading/.test(dialogText) && /isn.t open yet/i.test(dialogText) && /\$14\.99/.test(dialogText), `"${dialogText.slice(0, 120)}"`);
  }

  await page.getByRole('button', { name: 'Become a regular', exact: true }).click();
  await shot(page, 'email-modal-error', { dialogue: false, wait: 400 });

  await page.getByLabel('Email').fill(FAKE.email);
  await page.getByRole('checkbox').check();
  await shot(page, 'email-modal-filled', { dialogue: false, wait: 300 });
  await page.getByRole('button', { name: 'Become a regular', exact: true }).click();
  await page.getByRole('heading', { name: 'Welcome, regular.' }).waitFor({ timeout: 15_000 });
  await shot(page, 'email-modal-success', { dialogue: false, wait: 1200 });
  check('email-source-result:full', report.waitlistSources.at(-1) === 'result:full', `대기자 명단에 간 source = ${report.waitlistSources.at(-1) ?? '(없음)'}`);

  await page.getByRole('button', { name: 'Done' }).click();
  await page.waitForTimeout(400);
  await scrollToElement(page, page.getByRole('heading', { name: 'Take it with you.' }), 16);
  await page
    .waitForFunction(() => [...document.images].some((i) => i.src.includes('/api/card') && i.src.includes('no=') && i.complete && i.naturalWidth > 0), null, { timeout: 20_000 })
    .catch(() => problem('번호가 든 공유 카드 이미지가 20초 안에 그려지지 않았다'));
  await shot(page, 'result-share-with-number', { dialogue: false, wait: 700 });

  await scrollToElement(page, pitch.getByRole('button', { name: /Who.s coming up the stairs/ }), 200);
  await pitch.getByRole('button', { name: /Who.s coming up the stairs/ }).click();
  await page.getByRole('dialog').waitFor();
  await shot(page, 'email-modal-from-single', { dialogue: false, wait: 500 });
  {
    const dialogText = (await page.getByRole('dialog').innerText()).replace(/\s+/g, ' ');
    check('email-modal-names-the-single-product', /Save my seat: Who.s coming up the stairs/.test(dialogText) && /\$7\.99/.test(dialogText), `"${dialogText.slice(0, 120)}"`);
  }
  {

    await page.route('**/api/waitlist', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'not_open' }) }),
    );
    const dlg = page.getByRole('dialog');
    const labelAtSubmit = currentLabel;
    await dlg.getByLabel('Email').fill(FAKE.email);
    await dlg.getByRole('checkbox').check();
    await dlg.getByRole('button', { name: 'Become a regular', exact: true }).click();
    await dlg.getByText(/Reservations open soon/).waitFor({ timeout: 8000 }).catch(() => problem('503 not_open 인데 율의 한 줄이 안 보인다'));
    await shot(page, 'email-modal-not-open', { dialogue: false, wait: 600 });
    const notOpenText = (await dlg.innerText()).replace(/\s+/g, ' ');
    check('email-not-open-no-fake-success', !/Welcome, regular/.test(notOpenText) && /Reservations open soon/.test(notOpenText) && !notOpenText.includes(FAKE.email), `"${notOpenText.slice(0, 120)}"`);
    await page.unroute('**/api/waitlist');

    report.failedRequests = report.failedRequests.filter((e) => !(e.at === labelAtSubmit && e.status === 503 && /\/api\/waitlist$/.test(e.url)));
    report.consoleErrors = report.consoleErrors.filter((e) => !(e.at === labelAtSubmit && /status of 503/.test(e.text) && /\/reading/.test(e.url)));
  }
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).first().click();
  await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => problem('낱개 상품에서 연 이메일 모달이 닫히지 않았다'));
  {

    await page.route('**/api/waitlist', (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ open: false }) })
        : route.continue(),
    );
    const again = page.getByRole('button', { name: /Who.s coming up the stairs/ });
    await scrollToElement(page, again, 200);
    await again.click();
    const dlg = page.getByRole('dialog');
    await dlg.getByText(/Reservations open soon/).waitFor({ timeout: 8000 }).catch(() => problem('open:false 인데 모달이 곧바로 닫혀 있다고 말하지 않는다'));
    await shot(page, 'email-modal-closed-upfront', { dialogue: false, wait: 500 });
    check('email-closed-upfront-has-no-email-box', (await dlg.getByLabel('Email').count()) === 0, `이메일 칸 ${await dlg.getByLabel('Email').count()}개(0이어야 한다)`);
    await dlg.getByRole('button', { name: 'Close' }).first().click();
    await dlg.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => problem('open:false 모달이 닫히지 않았다'));
    await page.unroute('**/api/waitlist');
  }

  const finalUrl = page.url();
  const leaked = [FAKE.name, FAKE.year, FAKE.city.replace(' ', '%20'), FAKE.city.replace(' ', '+'), FAKE.email].filter((s) => finalUrl.includes(s));
  if (leaked.length) problem(`주소에 개인정보가 보인다: ${finalUrl}`);
  report.finalUrl = finalUrl;
}

async function captureReading(browser) {
  step('reading');
  const { context, page } = await newMobile(browser);
  await runReading(page, {
    data: FAKE,
    name: FAKE.name,
    time: { hour: FAKE.hour, minute: FAKE.minute, period: FAKE.period },
    sex: 'Woman',
    glyphs: 8,
    main: true,
  });
  await captureResultMain(page);
  await context.close();
}

async function checkResultTextRules(page, name) {
  const r = await page.evaluate(() => {
    const visible = (el) => !el.closest('[inert]') && !el.closest('.rs-hidden');
    const bubbles = [...document.querySelectorAll('main .wt-bubble')].filter(visible).map((b) => (b.innerText ?? '').replace(/\s+/g, ' ').trim());
    const text = (document.querySelector('main')?.innerText ?? '').replace(/\s+/g, ' ');
    return { bubbles, text };
  });
  const banned = r.text.match(/\b(cosmic|energy|universe|manifest|FYP|soulmate|destined|guaranteed)\b|share for luck|you will marry|lottery/i);
  check(`${name}-no-banned-words`, !banned, banned ? `금지 표현: ${banned[0]}` : '금지 어휘·확정 예언 표현 없음');
  const emoji = r.text.match(/\p{Extended_Pictographic}/u);
  check(`${name}-no-emoji`, !emoji, emoji ? `이모지 ${emoji[0]}` : '이모지 없음');
  const gender = r.bubbles.filter((b) => GENDER_WORDS.test(b.replace(/Non-binary/g, ''))).map((b) => b.slice(0, 60));
  check(`${name}-yul-has-no-gender-words`, gender.length === 0, gender.length ? `성별 단어가 든 말풍선: ${gender.join(' | ')}` : `율의 말풍선 ${r.bubbles.length}개에 성별 단어 없음`);
  check(`${name}-no-unfilled-slots`, !/[{}]|\bundefined\b|\bNaN\b/.test(r.text), '채워지지 않은 {자리}·undefined 없음');
  const filler = r.text.match(/\b(Oho|Mm-hm|Mm)\b/g) ?? [];
  check(`${name}-filler-words-at-most-three`, filler.length <= 3, `추임새 ${filler.length}번(${filler.join(', ') || '-'})`);
}

async function captureReadingJess(browser) {
  step('reading-jess');
  const { context, page } = await newMobile(browser);
  const P = 'jess-';
  await runReading(page, { data: FAKE3, name: FAKE3.name, time: { hour: FAKE3.hour, minute: FAKE3.minute, period: FAKE3.period }, sex: 'Woman', glyphs: 8, prefix: P });
  await waitResult(page);
  step('jess-result');
  await scrollToY(page, 0);
  await shot(page, `${P}result-top`, { dialogue: false, wait: 1200 });
  await checkWebtoonStructure(page, P, { chapterTitle: FAKE3.concernTitle, lanterns: 4, h1: /you.re [\w-]+-born\.$/i });
  const taken = await panelPass(page, `${P}result-`, { holdMs: 1200 });
  await imageAudit(page, 'jess-result');
  await checkPanelRhythm(page, 'jess-result', taken);
  await checkBubbleCraft(page, 'jess-result');
  {
    const f = page.locator('section[aria-labelledby="chapter-concern"] .wt-panel').first();
    const text = ((await f.innerText()) ?? '').replace(/\s+/g, ' ');
    report.jessConcernLine = text;

    const spoken = text.replace(/Yul:\s*/g, '').trim();
    const firstSentence = spoken.match(/^[^.?!]*[.?!]/)?.[0] ?? '';
    check('jess-ex-line-teases-then-reassures', /\?/.test(spoken.slice(0, 90)) || /^Let me guess\./.test(spoken), `"${spoken.slice(0, 120)}" (첫 문장 "${firstSentence}")`);
    check('jess-ex-line-has-no-open-slot', !/[{}]/.test(text), '풀이에 {next} 같은 빈 자리가 없다');
  }

  await scrollToElement(page, page.getByRole('heading', { name: 'What I see' }), 24);
  await answerHits(page, ['no', 'yes', 'yes'], { onEach: async () => { await page.waitForTimeout(1500); } });
  await page.waitForTimeout(1800);
  await shot(page, `${P}whatisee-after`, { dialogue: false, wait: 500, element: page.getByRole('region', { name: 'What I see' }) });

  const hand = page.getByRole('button', { name: 'Hold out your hand' });
  await scrollToElement(page, hand, 300);
  await hand.click();
  const saltPanel = page.locator('.wt-panel').filter({ hasText: /Not a curse/ });
  await saltPanel.waitFor({ state: 'visible', timeout: 8000 });
  await revealPanel(page, saltPanel.first(), { holdMs: 1500 });
  await shot(page, `${P}salt`, { dialogue: false, wait: 0 });

  await scrollToElement(page, page.getByRole('heading', { name: 'Your life map' }), 16);
  await shot(page, `${P}chapters`, { dialogue: false, wait: 800 });
  const pitch = page.getByRole('region', { name: 'More of your reading' });
  await scrollToElement(page, pitch, 0);
  await page.getByRole('link', { name: 'Explore the rooms' }).waitFor({ state: 'visible', timeout: 15_000 });
  await shot(page, `${P}deeper-top`, { dialogue: false, wait: 600 });
  await checkResultTextRules(page, 'jess-result');
  await context.close();
}

async function captureReducedMotionNonBinary(browser) {
  step('reduced-motion-nonbinary');
  const { context, page } = await newMobile(browser, { reducedMotion: 'reduce' });
  const P = 'rm-';
  await runReading(page, { data: FAKE2, name: '', time: null, sex: 'Non-binary', nb: 'Yin reading', glyphs: 6, prefix: P, reduced: true });

  await waitResult(page);
  step('rm-result');
  await scrollToY(page, 0);
  await shot(page, `${P}result-top`, { dialogue: false, wait: 800 });
  await checkWebtoonStructure(page, 'rm-', { chapterTitle: FAKE2.concernTitle, lanterns: 3, h1: /you.re [\w-]+-born\.$/i });
  {

    const bubble = ((await page.locator('.wt-panel').first().locator('.wt-bubble').first().innerText()) ?? '').replace(/\s+/g, ' ');
    check('rm-intro-without-name', !/[{}]|undefined/.test(bubble) && /read you/i.test(bubble), `"${bubble.slice(0, 80)}"`);
  }
  await panelPass(page, `${P}result-`, { holdMs: 500 });
  await imageAudit(page, 'rm-result');

  const showChart = page.getByRole('button', { name: 'Show the chart' });
  await scrollToElement(page, showChart, 360);
  await showChart.click();
  await shot(page, `${P}result-chart-open`, { dialogue: false, wait: 500 });
  check('rm-three-pillars-notice', (await page.getByText(/Three pillars/).count()) > 0, '시간을 모르면 세 기둥 안내가 보인다');

  const wisHeading = page.getByRole('heading', { name: 'What I see' });
  await scrollToElement(page, wisHeading, 24);
  await page.getByRole('button', { name: NOT_QUITE }).first().waitFor({ state: 'visible', timeout: 5000 });
  check('rm-what-i-see-no-dots', (await page.locator('.wt-dots').count()) === 0, '동작 줄이기: 쓰는 중 표시 없음');
  await shot(page, `${P}whatisee-before`, { dialogue: false, wait: 400 });
  await answerHits(page, ['no', 'no', 'no']);
  await page.getByText(REACTION_NO).first().waitFor({ state: 'visible', timeout: 8000 });
  const noText = await page.getByText(REACTION_NO).first().textContent();
  check('rm-what-i-see-reaction-mostly-no', REACTION_NO.test(noText ?? ''), `"${(noText ?? '').slice(0, 70)}"`);
  await shot(page, `${P}whatisee-mostly-no`, { dialogue: false, wait: 500, element: page.getByRole('region', { name: 'What I see' }) });
  {

    const wis = (await page.getByRole('region', { name: 'What I see' }).innerText()).replace(/\s+/g, ' ');
    check('rm-mostly-no-has-no-upsell', !/full reading|\$\d|reserve|email/i.test(wis), '그렇지 않다 반응에 판매·가격·예약 말이 없다');
    check('rm-mostly-no-offers-time-fix', /birth time/i.test(wis) && (await page.getByRole('button', { name: 'Add my birth time' }).count()) === 1, '시간을 몰랐으면 시간 고치기 링크가 있다');

    if (/Let me try one more/.test(wis)) {
      check('rm-bonus-try-has-answers', (await page.getByRole('button', { name: NOT_QUITE }).count()) === 1, "'하나 더' 보너스에도 That’s me / Not quite 가 있다");
    } else {
      check('rm-bonus-absent-when-no-element-is-missing', (await page.getByRole('button', { name: NOT_QUITE }).count()) === 0, '빈 오행이 없는 차트: 보너스 없이 끝난다(답 칩이 남지 않는다)');
    }
  }

  const hand = page.getByRole('button', { name: 'Hold out your hand' });
  await scrollToElement(page, hand, 300);
  await hand.click();
  const saltPanel = page.locator('.wt-panel').filter({ hasText: /Not a curse/ });
  await saltPanel.waitFor({ state: 'visible', timeout: 8000 });
  await revealPanel(page, saltPanel.first(), { holdMs: 500 });
  await shot(page, `${P}salt`, { dialogue: false, wait: 0 });

  step('rm-chapters');
  const lifeMap = page.getByRole('heading', { name: 'Your life map' });
  await scrollToElement(page, lifeMap, 16);
  const headline = await readChapterHeadline(page);
  check('rm-chapter-open-after-yin', CHAPTER_HEADLINE.test(headline) || CHAPTER_BEFORE.test(headline), `"${headline.slice(0, 100)}"`);
  await shot(page, `${P}chapter-open`, { dialogue: false, wait: 500 });
  await checkChapterNextLine(page, 'rm-chapter-next-line');
  const chapterText = await page.getByRole('region', { name: 'Your life map' }).innerText();
  check('rm-chapter-text-has-no-gender-words', !GENDER_WORDS.test(chapterText), '10년 장 칸에 성별 단어가 없다');
  {
    const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem('dangol.session.v1') ?? '{}'));
    check('rm-yin-maps-to-female-rule', stored.sexChoice === 'nonbinary' && stored.nbChoice === 'yin' && stored.sex === 'female', `저장된 답: sexChoice=${stored.sexChoice}, nbChoice=${stored.nbChoice}, 엔진 규칙 sex=${stored.sex}`);
  }

  const pitch = page.getByRole('region', { name: 'More of your reading' });
  await scrollToElement(page, pitch, 0);
  await shot(page, `${P}deeper-top`, { dialogue: false, wait: 600 });

  const rmTurns = report.turns.filter((t) => t.step.startsWith(P));
  check('rm-no-dots-anywhere', rmTurns.length > 0 && rmTurns.every((t) => !t.dots), `동작 줄이기 전환 ${rmTurns.length}번 모두 점 없음`);
  await context.close();
}

const SEED_KEY = 'dangol.session.v1';

async function openResultWith(page, overrides = {}) {
  const answers = {
    name: SEEDED.name,
    concern: 'ex',
    date: SEEDED.date,
    time: SEEDED.time,
    timeAnswered: true,
    place: SEEDED.place,
    sex: null,
    sexAnswered: true,
    sexChoice: 'skip',
    nbChoice: null,
    midnight: null,
    regularNo: null,
    ...overrides,
  };
  await page.goto(`${BASE}/about`, { waitUntil: 'load' });
  await page.evaluate(([key, value]) => sessionStorage.setItem(key, JSON.stringify(value)), [SEED_KEY, answers]);
  await page.goto(`${BASE}/reading?step=result`, { waitUntil: 'load' });
  await waitResult(page);
}

async function captureSupplement(browser) {
  step('supplement');
  const { context, page } = await newMobile(browser);
  await openResultWith(page);
  const lifeMap = page.getByRole('heading', { name: 'Your life map' });
  await scrollToElement(page, lifeMap, 16);
  await page.getByText('I need one more thing to open your life map.').waitFor({ state: 'visible', timeout: 5000 });
  await shot(page, 'supplement-closed', { dialogue: false, wait: 800 });
  const region = page.getByRole('region', { name: 'Your life map' });
  const names = await region.getByRole('button').allTextContents();
  check('supplement-offers-woman-man-nonbinary', ['Woman', 'Man', 'Non-binary'].every((n) => names.map((x) => x.trim()).includes(n)), `칩 ${names.map((x) => x.trim()).join(' / ')}`);
  const closedText = await region.innerText();
  check('supplement-why-has-no-woman-or-man', !/woman or man|man or woman/i.test(closedText), `"${closedText.replace(/\s+/g, ' ').slice(0, 100)}"`);
  const candyBefore = await page.locator('section[aria-labelledby="candy-title"], .wt-panel:has(.wt-bubble__title)').first().innerText().catch(() => '');
  await region.getByRole('button', { name: 'Non-binary', exact: true }).click();
  await page.getByRole('button', { name: 'Yang reading', exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  await shot(page, 'supplement-nb-ask', { dialogue: false, wait: 600 });
  const askText = await region.innerText();
  check('supplement-nb-has-a-hint-line', /Not sure\? Either is fine\./.test(askText), '성별 보충 칸의 양/음 버튼 아래에 기준 한 줄이 있다');
  check('supplement-nb-question-has-no-gender-words', !GENDER_WORDS.test(askText.replace(/Non-binary/g, '')) && /Yin reading/.test(askText), `"${askText.replace(/\s+/g, ' ').slice(0, 110)}"`);
  await region.getByRole('button', { name: 'Yang reading', exact: true }).click();
  const headline = await readChapterHeadline(page);
  check('supplement-chapter-opens-after-yang', CHAPTER_HEADLINE.test(headline) || CHAPTER_BEFORE.test(headline), `"${headline.slice(0, 100)}"`);
  await scrollToElement(page, lifeMap, 16);
  await shot(page, 'supplement-opened', { dialogue: false, wait: 700 });
  const stored = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? '{}'), SEED_KEY);
  check('supplement-yang-maps-to-male-rule', stored.sexChoice === 'nonbinary' && stored.nbChoice === 'yang' && stored.sex === 'male', `저장된 답: sexChoice=${stored.sexChoice}, nbChoice=${stored.nbChoice}, 엔진 규칙 sex=${stored.sex}`);
  const candyAfter = await page.locator('section[aria-labelledby="candy-title"], .wt-panel:has(.wt-bubble__title)').first().innerText().catch(() => '');
  check('supplement-candy-unchanged', candyBefore === candyAfter, '성별을 골라 다시 계산해도 사탕 문장은 그대로');
  await context.close();
}

const CONCERN_TITLES = {
  love: 'About your love life',
  crush: 'About the one you like',
  ex: 'About your ex',
  partner: 'About your relationship',
  marriage: 'About marriage',
  work: 'About your work',
  money: 'About money',
  study: 'About your studies',
  people: 'About friends and family',
  change: 'About the big change',
  self: 'About the real you',
};

async function captureConcerns(browser) {
  step('concerns');
  const { context, page } = await newMobile(browser);
  const KEEP = new Set(['love', 'ex', 'work', 'self']);
  for (const [key, title] of Object.entries(CONCERN_TITLES)) {
    currentLabel = `concern-${key}`;
    await openResultWith(page, { concern: key, sex: 'female', sexChoice: 'female' });
    const h2 = await page.locator('main h2').allTextContents();
    check(`concern-${key}-chapter-title`, h2.map((t) => t.trim()).includes(title), `2장 제목 "${title}" (${h2.map((t) => t.trim()).join(' | ')})`);
    const section = page.locator('section[aria-labelledby="chapter-concern"]');
    const panel = section.locator('.wt-panel').first();
    await revealPanel(page, panel, { holdMs: 2200 });
    const text = (await panel.innerText()).replace(/\s+/g, ' ');
    check(`concern-${key}-has-reading`, text.length > 60 && !/[{}]|undefined/.test(text), `"${text.slice(0, 90)}"`);
    if (KEEP.has(key)) await shot(page, `concern-${key}`, { dialogue: false, wait: 0 });
  }
  await context.close();
}

async function smoothScrollToElement(page, locator, offset = 16, ms = 1100) {
  const y = await locator.first().evaluate((el, off) => Math.max(0, el.getBoundingClientRect().top + window.scrollY - off), offset);
  await page.evaluate(
    ({ y, ms }) =>
      new Promise((resolve) => {
        const y0 = window.scrollY;
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / ms);
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          window.scrollTo(0, y0 + (y - y0) * e);
          if (p < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      }),
    { y, ms },
  );
}

async function smoothToPanel(page, panel, ms = 1100) {
  const off = await panel.evaluate((el) => {
    const h = window.innerHeight;
    const r = el.getBoundingClientRect();
    return r.height > h - 80 ? 16 : (h - r.height) / 2;
  });
  await smoothScrollToElement(page, panel, off, ms);
}

async function captureFlowVideo(browser) {
  step('flow-video');
  if (!FFMPEG_OK) {
    problem('flow.webm 을 못 만든다: playwright 용 ffmpeg 도, PATH 의 ffmpeg 도 없다. 사람이 npx playwright install ffmpeg 를 실행한 뒤 다시 돌린다.');
    return;
  }
  const videoDir = mkdtempSync(path.join(tmpdir(), 'dangol-video-'));
  const context = await browser.newContext({
    viewport: MOBILE,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    recordVideo: { dir: videoDir, size: MOBILE },
  });
  const page = await context.newPage();
  watch(page, 'mobile');
  const startedAt = Date.now();
  try {
    await runReading(page, {
      data: FAKE,
      name: FAKE.name,
      time: { hour: FAKE.hour, minute: FAKE.minute, period: FAKE.period },
      sex: 'Woman',
      glyphs: 8,
      prefix: 'video-',
      capture: false,
      pause: 800,
      viaHome: true,
    });
    await waitResult(page);
    await page.waitForTimeout(1800);

    const panelOf = (art) => page.locator('.wt-panel', { has: page.locator(`img[src*="${art}"]`) }).first();

    await smoothToPanel(page, panelOf('yul-explain'), 600);
    await page.waitForTimeout(1600);
    await smoothToPanel(page, page.locator('.wt-panel', { has: page.locator('img[src*="emblem-"]') }).first(), 1300);
    await page.waitForTimeout(1800);
    await smoothToPanel(page, page.locator('.wt-panel:has(.rs-lantern-scene)').first(), 1300);
    await page.waitForTimeout(4600);
    await smoothToPanel(page, page.locator('.wt-panel:has(.wt-orbs)').first(), 1200);
    await page.waitForTimeout(2200);
    await smoothToPanel(page, panelOf('yul-read'), 1200);
    await page.waitForTimeout(2600);
    const wisHeading = page.getByRole('heading', { name: 'What I see' });
    await smoothScrollToElement(page, wisHeading, 24, 1500);
    await page.getByRole('button', { name: THATS_ME }).first().waitFor({ state: 'visible', timeout: 8000 });
    await answerHits(page, ['yes', 'yes', 'no'], { pause: 1500 });
    await page.getByText(REACTION_YES).first().waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(2200);
    await smoothToPanel(page, panelOf('sogeum-sleep'), 1200);
    await page.waitForTimeout(1800);

    await smoothToPanel(page, panelOf('yul-oho'), 1300);
    await page.waitForTimeout(3600);
    await smoothToPanel(page, panelOf('yul-candy-ease'), 1200);
    await page.waitForTimeout(2400);
    const hand = page.getByRole('button', { name: 'Hold out your hand' });
    await smoothScrollToElement(page, hand, 300, 1200);
    await page.waitForTimeout(1200);
    await hand.click();
    await page.waitForTimeout(3000);

    await smoothScrollToElement(page, page.getByRole('heading', { name: 'Your road' }), 16, 1400);
    await page.waitForTimeout(1800);
    await smoothToPanel(page, panelOf('yul-balcony-back'), 1300);
    await page.waitForTimeout(3000);
    const pitch = page.getByRole('region', { name: 'More of your reading' });
    await smoothScrollToElement(page, pitch, 0, 1400);
    await page.waitForTimeout(4600);
    await smoothScrollToElement(page, pitch.locator('.rs-menu'), 140, 1200);
    await page.waitForTimeout(2200);
    await smoothScrollToElement(page, page.getByRole('link', { name: 'Explore the rooms' }), 440, 1200);
    await page.waitForTimeout(2600);
  } finally {
    const video = page.video();
    await context.close();
    if (video) {
      try {
        await video.saveAs(path.join(OUT, 'flow.webm'));
        const bytes = statSync(path.join(OUT, 'flow.webm')).size;
        report.video = { file: 'flow.webm', bytes, wallSeconds: Math.round((Date.now() - startedAt) / 1000), size: `${MOBILE.width}x${MOBILE.height}` };
        console.log(`  flow.webm  ${Math.round(bytes / 1024)}KB, 약 ${report.video.wallSeconds}초`);
      } catch (e) {
        problem(`flow.webm 을 저장하지 못했다: ${String(e?.message ?? e).slice(0, 200)}`);
      }
    }
    rmSync(videoDir, { recursive: true, force: true });
  }
}

async function captureDesktop(browser) {
  step('desktop');
  const desktop = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'America/New_York' });
  const page = await desktop.newPage();
  watch(page, 'desktop');
  await page.goto(`${BASE}/reading`, { waitUntil: 'load' });
  const hi = page.getByRole('button', { name: 'Hi, Yul' });
  await actionable(page, hi);
  await shot(page, 'desktop-reading-greeting', { viewportName: 'desktop', dialogue: false, wait: 700 });
  await hi.click();
  const nameInput = page.getByLabel('Name or nickname');
  await actionable(page, nameInput);
  await nameInput.fill(FAKE.name);
  await page.getByRole('button', { name: 'Continue' }).click();
  await actionable(page, page.getByRole('button', { name: FAKE.concern, exact: true }));
  await shot(page, 'desktop-reading-concern', { viewportName: 'desktop', dialogue: false, wait: 500 });

  await openResultWith(page, { concern: 'crush', sex: 'female', sexChoice: 'female' });
  await shot(page, 'desktop-result-top', { viewportName: 'desktop', dialogue: false, wait: 1200 });
  const panel = page.locator('.wt-panel:has(.rs-lantern-scene)').first();
  await revealPanel(page, panel, { holdMs: 4200 });
  await shot(page, 'desktop-result-lanterns', { viewportName: 'desktop', dialogue: false, wait: 0 });
  await scrollToY(page, 2400);
  await page.waitForTimeout(1600);
  await shot(page, 'desktop-result-mid', { viewportName: 'desktop', dialogue: false, wait: 0 });
  await desktop.close();
}

async function captureType(browser) {
  step('type');

  {
    const { context, page } = await newMobile(browser);
    await page.goto(`${BASE}/type`, { waitUntil: 'load' });
    await page.getByLabel('Month', { exact: true }).waitFor();
    await ready(page);
    await shot(page, 'type-date');
    await fillDate(page);
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByRole('button', { name: 'Not sure' }).waitFor();
    await ready(page);
    await shot(page, 'type-midnight');
    await page.getByRole('button', { name: 'Not sure' }).click();

    await page.waitForURL(/step=result/);
    await page.getByRole('heading', { level: 1 }).waitFor();
    await scrollToY(page, 0);
    await shot(page, 'type-result', { dialogue: false, wait: 900 });
    await scrollToY(page, 520);
    await shot(page, 'type-result-lower', { dialogue: false, wait: 600 });

    await page.getByRole('button', { name: 'Get your regular number' }).click();
    await page.getByRole('dialog').waitFor();
    await shot(page, 'type-email-modal', { dialogue: false, wait: 700 });
    await context.close();
  }

  {
    const { context, page } = await newMobile(browser);
    await page.goto(`${BASE}/type`, { waitUntil: 'load' });
    await page.getByLabel('Month', { exact: true }).waitFor();
    await ready(page);
    await fillDate(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Yes', exact: true }).waitFor();
    await ready(page);
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    await page.getByLabel('Hour', { exact: true }).waitFor();
    await ready(page);
    await fillTime(page, { hour: '11', minute: '30', period: 'PM' });
    await shot(page, 'type-yes-time');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('combobox', { name: 'City of birth' }).waitFor();
    await ready(page);
    await pickCity(page, { capture: null });
    await page.waitForURL(/step=result/);
    await page.getByRole('heading', { level: 1 }).waitFor();
    await scrollToY(page, 0);
    await shot(page, 'type-yes-result', { dialogue: false, wait: 900 });
    await context.close();
  }
}

async function captureSmallScreens(browser) {
  step('small-screens');

  {
    const { context, page } = await newMobile(browser, {}, 'se');
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await shot(page, 'se-home', { viewportName: 'se', dialogue: false, wait: 800 });
    await page.goto(`${BASE}/reading`, { waitUntil: 'load' });
    const hi = page.getByRole('button', { name: 'Hi, Yul' });
    await actionable(page, hi);
    await shot(page, 'se-greeting', { viewportName: 'se' });
    await talkTurn(page, 'greeting', () => hi.click(), { prefix: 'se-', capture: false, reaction: false });
    const nameInput = page.getByLabel('Name or nickname');
    await actionable(page, nameInput);
    await talkTurn(page, 'name', () => page.getByRole('button', { name: 'Continue' }).click(), { prefix: 'se-', capture: false });
    const chip = page.getByRole('button', { name: 'My love life', exact: true });
    await actionable(page, chip);
    await shot(page, 'se-concern', { viewportName: 'se' });
    await checkConcernStep(page, 'concern-chips-fit-se');
    await talkTurn(page, 'concern', () => chip.click(), { prefix: 'se-', vp: 'se', shotName: 'concern' });
    await actionable(page, page.getByLabel('Month', { exact: true }));
    await shot(page, 'se-date', { viewportName: 'se' });
    await checkChatBelowFace(page, 'chat-below-face-se-date', 0.48, true);
    await context.close();
  }

  {
    const { context, page } = await newMobile(browser, {}, 'android');
    const P = 'a360-';
    await page.goto(`${BASE}/reading`, { waitUntil: 'load' });
    const hi = page.getByRole('button', { name: 'Hi, Yul' });
    await actionable(page, hi);
    await shot(page, `${P}greeting`, { viewportName: 'android' });
    await talkTurn(page, 'greeting', () => hi.click(), { prefix: P, capture: false, reaction: false });
    const nameInput = page.getByLabel('Name or nickname');
    await actionable(page, nameInput);
    await nameInput.pressSequentially('Mina', { delay: 0 });
    await talkTurn(page, 'name', () => page.getByRole('button', { name: 'Continue' }).click(), { prefix: P, capture: false });
    const chip = page.getByRole('button', { name: 'My love life', exact: true });
    await actionable(page, chip);
    await shot(page, `${P}concern`, { viewportName: 'android' });
    await checkConcernStep(page, 'concern-chips-fit-a360');

    await checkChatBelowFace(page, 'chat-below-face-a360-concern', 0.28);
    await talkTurn(page, 'concern', () => chip.click(), { prefix: P, vp: 'android', shotName: 'concern' });
    await actionable(page, page.getByLabel('Month', { exact: true }));
    await fillDate(page, FAKE);
    await shot(page, `${P}date`, { viewportName: 'android' });
    await checkChatBelowFace(page, 'chat-below-face-a360-date', 0.48, true);
    await talkTurn(page, 'date', () => page.getByRole('button', { name: 'Continue' }).click(), { prefix: P, capture: false });
    await actionable(page, page.getByLabel('Hour', { exact: true }));
    await talkTurn(page, 'time', () => page.getByRole('button', { name: /^I don.t know$/ }).click(), { prefix: P, capture: false });
    await actionable(page, page.getByRole('combobox', { name: 'City of birth' }));
    await talkTurn(page, 'place', () => pickCity(page, { city: FAKE.city, label: FAKE.label, capture: null }), { prefix: P, capture: false, dotsShot: false });
    const nb = page.getByRole('button', { name: 'Non-binary', exact: true });
    await actionable(page, nb);
    await shot(page, `${P}sex`, { viewportName: 'android' });
    await talkTurn(page, 'sex', () => nb.click(), { prefix: P, capture: false, reaction: false });
    const yang = page.getByRole('button', { name: 'Yang reading', exact: true });
    await actionable(page, yang);
    await page.waitForTimeout(700);
    await shot(page, `${P}nb`, { viewportName: 'android' });
    const q = await page.evaluate(() => {
      const chat = document.querySelector('.dg-chat')?.getBoundingClientRect();
      const el = [...document.querySelectorAll('.dg-msg[data-id="q:nb"]')].at(-1);
      if (!el || !chat) return { found: false };
      const st = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return { found: true, gone: el.hasAttribute('data-clip') || el.dataset.age === 'gone', opacity: parseFloat(st.opacity), top: Math.round(b.top), chatTop: Math.round(chat.top), bottom: Math.round(b.bottom) };
    });
    check('nb-question-stays-visible-a360', q.found && !q.gone && q.opacity > 0.9 && q.bottom > q.chatTop + 20, `q:nb 말풍선 ${JSON.stringify(q)}`);
    await checkChatBelowFace(page, 'chat-below-face-a360-nb', 0.48, true);
    await context.close();
  }

  {
    const { context, page } = await newMobile(browser, {}, 'keyboard');
    await page.goto(`${BASE}/reading`, { waitUntil: 'load' });
    const hi = page.getByRole('button', { name: 'Hi, Yul' });
    await actionable(page, hi);
    await talkTurn(page, 'greeting', () => hi.click(), { prefix: 'kbd-', capture: false, reaction: false });
    const nameInput = page.getByLabel('Name or nickname');
    await actionable(page, nameInput);
    await nameInput.pressSequentially('Mina', { delay: 0 });
    await page.waitForTimeout(500);
    await shot(page, 'kbd-name', { viewportName: 'keyboard' });
    const lay = await page.evaluate(() => {
      const chat = document.querySelector('.dg-chat')?.getBoundingClientRect();
      const answer = document.querySelector('.dg-answer')?.getBoundingClientRect();
      return { W: window.innerWidth, H: window.innerHeight, chatW: chat ? Math.round(chat.width) : 0, answerW: answer ? Math.round(answer.width) : 0 };
    });
    check('keyboard-open-stays-portrait-layout', lay.chatW >= lay.W * 0.8 && lay.answerW >= lay.W * 0.9, `키보드 높이 ${lay.W}x${lay.H}: 대화 창 폭 ${lay.chatW}px, 답 영역 폭 ${lay.answerW}px (가로 배치면 폭이 절반 아래로 줄어든다)`);
    await context.close();
  }

  {
    const { context, page } = await newMobile(browser, {}, 'landscape');
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    await shot(page, 'landscape-home', { viewportName: 'landscape', dialogue: false, wait: 600 });
    await page.goto(`${BASE}/reading`, { waitUntil: 'load' });
    const hi = page.getByRole('button', { name: 'Hi, Yul' });
    await actionable(page, hi);
    await shot(page, 'landscape-greeting', { viewportName: 'landscape' });
    await talkTurn(page, 'greeting', () => hi.click(), { prefix: 'landscape-', capture: false, reaction: false });
    await actionable(page, page.getByLabel('Name or nickname'));
    await shot(page, 'landscape-name', { viewportName: 'landscape' });
    await context.close();
  }
}

function imageSize(body) {
  if (body.length > 24 && body.subarray(1, 4).toString() === 'PNG') {
    return { kind: 'png', width: body.readUInt32BE(16), height: body.readUInt32BE(20) };
  }
  if (body.length > 4 && body[0] === 0xff && body[1] === 0xd8) {
    let i = 2;
    while (i + 9 < body.length) {
      if (body[i] !== 0xff) { i += 1; continue; }
      const marker = body[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = body.readUInt16BE(i + 2);

      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { kind: 'jpeg', height: body.readUInt16BE(i + 5), width: body.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    return { kind: 'jpeg', width: 0, height: 0 };
  }
  return { kind: 'unknown', width: 0, height: 0 };
}

async function saveBinary(name, urlPath, ctx, expected = { width: 1080, height: 1920 }) {
  currentLabel = name;
  const res = await ctx.request.get(`${BASE}${urlPath}`);
  const body = await res.body();
  counter += 1;
  const { kind, width, height } = imageSize(body);
  const ext = kind === 'jpeg' ? 'jpg' : 'png';
  const file = `${String(counter).padStart(2, '0')}-${name}.${ext}`;
  writeFileSync(path.join(OUT, file), body);
  const isImage = kind === 'png' || kind === 'jpeg';
  const entry = {
    index: counter,
    name,
    file,
    url: urlPath,
    viewport: 'image',
    status: res.status(),
    contentType: res.headers()['content-type'],
    bytes: body.length,
    width,
    height,
    horizontalScroll: false,
  };
  report.shots.push(entry);
  const bad = res.status() !== 200 || !isImage || width !== expected.width || height !== expected.height;
  console.log(`  ${file}  ${res.status()} ${width}x${height} ${Math.round(body.length / 1024)}KB${bad ? '  <-- 이상' : ''}`);
  if (bad) problem(`${file}: 카드 이미지 이상 (status ${res.status()}, ${width}x${height}, 기대 ${expected.width}x${expected.height})`);
}

async function captureCardsAndStatic(browser) {
  step('card');
  const { context, page } = await newMobile(browser);
  await saveBinary('api-card-candle-5', '/api/card?t=candle&no=5', context);
  await saveBinary('api-card-ocean-317', '/api/card?t=ocean&no=317', context);
  await saveBinary('api-card-default', '/api/card', context);

  const OG = { width: 1200, height: 630 };
  await saveBinary('api-card-og-candle', '/api/card?t=candle&og=1', context, OG);
  await saveBinary('api-card-og-default', '/api/card?og=1', context, OG);

  await saveBinary('api-card-mountain', '/api/card?t=mountain', context);

  for (const t of ['pine', 'vine', 'sun', 'blade', 'jewel', 'field', 'rain']) {
    await saveBinary(`api-card-${t}`, `/api/card?t=${t}&no=${100 + t.length}`, context);
  }

  await saveBinary('api-card-thumb-candle', '/api/card?t=candle&w=544', context, { width: 544, height: 967 });

  step('static');
  for (const [name, route] of [
    ['about', '/about'],
    ['wont-read', '/wont-read'],
    ['privacy', '/privacy'],
    ['terms', '/terms'],
    ['refund', '/refund'],
    ['pricing', '/pricing'],
  ]) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'load' });
    await page.getByRole('heading', { level: 1 }).waitFor();
    await shot(page, name, { dialogue: false, wait: 700 });
    if (name === 'about' || name === 'wont-read') {
      await shot(page, `${name}-full`, { dialogue: false, fullPage: true, wait: 300 });
    }
  }

  step('not-found');
  const res = await page.goto(`${BASE}${EXPECTED_404}`, { waitUntil: 'load' });
  report.notFoundStatus = res?.status() ?? 0;
  if (report.notFoundStatus !== 404) problem(`없는 주소의 상태 코드가 404 가 아니다: ${report.notFoundStatus}`);
  await shot(page, 'not-found', { dialogue: false, wait: 500 });
  await context.close();
}

let browser = null;
let crashed = false;

async function main() {
  if (existsSync(OUT)) {
    for (const f of readdirSync(OUT)) rmSync(path.join(OUT, f), { recursive: true, force: true });
  }
  mkdirSync(OUT, { recursive: true });

  console.log(`서버 시작: next start -p ${PORT}`);
  await startServer();
  console.log('서버 준비됨. Chrome 실행.');
  browser = await chromium.launch({ channel: 'chrome', headless: true });

  const only = (process.env.SHOTS_ONLY ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  const run = (name) => only.length === 0 || only.includes(name);

  if (run('home')) {
    console.log('첫 화면 (enter.mp4 -> Follow Sogeum -> 문빛)');
    await captureHome(browser);
  }
  if (run('reading')) {
    console.log('(A) /reading 대화 -> 의식 -> 웹툰 결과 -> What I see -> 소금 -> 10년 장 -> 더 깊이 -> 이메일');
    await captureReading(browser);
  }
  if (run('jess')) {
    console.log('(C) /reading Jess, 1992-07-09 08:10, London, Woman, 고민 ex');
    await captureReadingJess(browser);
  }
  if (run('reduced')) {
    console.log('(B) /reading 동작 줄이기 + Non-binary -> Yin + 시간 모름');
    await captureReducedMotionNonBinary(browser);
  }
  if (run('supplement')) {
    console.log('성별 보충(결과에서 Non-binary -> Yang)');
    await captureSupplement(browser);
  }
  if (run('concerns')) {
    console.log('고민 11종');
    await captureConcerns(browser);
  }
  if (run('type')) {
    console.log('/type');
    await captureType(browser);
  }
  if (run('small')) {
    console.log('작은 폰과 가로 화면');
    await captureSmallScreens(browser);
  }
  if (run('desktop')) {
    console.log('데스크톱');
    await captureDesktop(browser);
  }
  if (run('video')) {
    console.log('흐름 영상 녹화 (flow.webm)');
    await captureFlowVideo(browser);
  }
  if (run('cards')) {
    console.log('카드와 정적 페이지');
    await captureCardsAndStatic(browser);
  }

  const requested = Object.keys(report.media);
  const old = requested.filter((m) => OLD_ART.test(m));
  check('no-old-art-requested-anywhere', old.length === 0, old.length ? `옛 그림 요청: ${old.join(', ')}` : `요청한 그림·영상 ${requested.length}종 중 옛 그림 없음`);
}

try {
  await main();
} catch (e) {
  crashed = true;
  report.crash = String(e?.stack ?? e).slice(0, 2000);
  console.error(`\n스크립트 오류 (${currentLabel} 단계):\n${report.crash}`);
} finally {
  if (browser) await browser.close().catch(() => {});
  stopServer();

  const horizontal = report.shots.filter((s) => s.horizontalScroll).map((s) => s.file);
  report.summary = {
    shots: report.shots.length,
    horizontalScroll: horizontal,
    consoleErrors: report.consoleErrors.length,
    pageErrors: report.pageErrors.length,
    failedRequests: report.failedRequests.length,
    privacyLeaks: report.privacyLeaks.length,
    checks: `${report.checks.filter((c) => c.ok).length}/${report.checks.length} ok`,
    softChecks: report.checks.filter((c) => !c.ok && c.soft).length,
    serverRequests: report.serverRequests,
    turns: report.turns.length,
    mediaRequested: Object.keys(report.media).length,
    video: report.video ? `${report.video.file} ${Math.round(report.video.bytes / 1024)}KB` : 'none',
    problems: report.problems.length,
    crashed,
    ok:
      !crashed &&
      horizontal.length === 0 &&
      report.consoleErrors.length === 0 &&
      report.pageErrors.length === 0 &&
      report.failedRequests.length === 0 &&
      report.privacyLeaks.length === 0 &&
      report.video !== null &&
      report.problems.length === 0,
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  console.log(`\n${report.summary.ok ? '이상 없음' : '확인할 것 있음'}: 사진 ${report.summary.shots}장, 점검 ${report.summary.checks}, 콘솔 에러 ${report.consoleErrors.length}, 페이지 오류 ${report.pageErrors.length}, 실패한 요청 ${report.failedRequests.length}, 가로 스크롤 ${horizontal.length}, 입력값이 나간 요청 ${report.privacyLeaks.length} (서버 요청 ${report.serverRequests}건 검사)`);
  console.log(`출력: ${path.relative(ROOT, OUT)}/ (report.json 포함)`);
  process.exitCode = report.summary.ok ? 0 : 1;
}
