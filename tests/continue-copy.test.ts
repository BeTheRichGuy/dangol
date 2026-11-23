import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { EMPTY_ANSWERS } from '../src/components/flow/answers';
import { ChapterConcern } from '../src/components/result/chapter-concern';
import { ContinuePitch } from '../src/components/result/continue-pitch';
import { OtherKeepers } from '../src/components/result/other-keepers';
import { buildResultModel } from '../src/components/result/result-data';
import { ContinueConfirm } from '../src/components/rooms/continue-confirm';
import { CONTINUE, FREE_RESULT, OTHER_KEEPERS, STICKY, gapLibraryFor, lifeOfferLine } from '../src/content/continue';
import { ROOMS_COPY as ROOMS_EN } from '../src/content/en/rooms';
import { CONTINUE_KO, LIFE_OFFER_KO } from '../src/content/ko/continue';
import { ROOMS_KO } from '../src/content/ko/rooms';
import { TEASERS_KO } from '../src/content/ko/teasers';
import { ROOMS_JA } from '../src/content/ja/rooms';
import { overlay, setActiveLocaleForTest, type Locale } from '../src/content/locale';
import { ROOMS_COPY } from '../src/content/rooms';
import { UI } from '../src/content/ui';
import { gapCard } from '../src/lib/reading/teasers';
import { roomOffer } from '../src/lib/rooms/offer';
import { computeChart } from '../src/lib/saju';
import type { GodGroup } from '../src/lib/saju/types';

afterEach(() => setActiveLocaleForTest('en'));

const GODS: GodGroup[] = ['peer', 'output', 'wealth', 'power', 'resource'];
const HANGUL = /[가-힣]/;
const BRACE = /[{}]/;
const BANNED: Record<'en' | 'ja', RegExp> = {
  en: /cosmic|energy|universe|manifest|FYP|destin|soulmate|guarantee|definitely|for sure|inevitabl|fated|meant to be|twin flame|karma|horoscope|zodiac|curse|vibes\b|death|dying|illness|disease|accident|pregnan|divorce|lottery|invest|crypto|\bsalt\b|\bhoney\b|\bcandy\b|—|–/i,
  ja: /エネルギー|宇宙|運命|必ず|絶対|確実|死ぬ|死亡|病気|事故|妊娠|離婚|宝くじ|投資|本音|スピリチュアル|塩|蜂蜜|はちみつ|飴|キャンディ/,
};
const PRESSURE = /countdown|hurry|last chance|limited time|today only|don't miss out|急いで|今だけ|残りわずか|最後のチャンス/i;
const GENDER: Record<'en' | 'ja', RegExp> = {
  en: /\b(he|she|his|her|him|man|men|woman|women|boyfriend|girlfriend|husband|wife|male|female|guy|girl)\b/i,
  ja: /(男性|女性|彼女|彼氏|彼|旦那|奥さん|夫|妻|男の人|女の人|男子|女子)/,
};
const EMOJI = /\p{Extended_Pictographic}/u;
const KO_TITLES = overlay(ROOMS_EN, ROOMS_KO).rooms.life.contents.map((c) => c.title);

const textOf = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

function withLocale<T>(locale: Locale, fn: () => T): T {
  setActiveLocaleForTest(locale);
  try {
    return fn();
  } finally {
    setActiveLocaleForTest('en');
  }
}

function lines(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (typeof v === 'function') return lines((v as (...a: unknown[]) => unknown)('PRICE', 'TYPE'));
  if (Array.isArray(v)) return v.flatMap(lines);
  if (v && typeof v === 'object') return Object.values(v).flatMap(lines);
  return [];
}

function paths(v: unknown, at = ''): string[] {
  if (typeof v === 'function') return [at + '()'];
  if (Array.isArray(v)) return [`${at}[${v.length}]`];
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => paths(x, at ? `${at}.${k}` : k));
  return [at];
}

describe.each(['en', 'ja'] as const)('이어 읽기 문구 %s', (lang) => {
  const gender = GENDER[lang];
  const all = () =>
    withLocale(lang, () => [
      ...lines(CONTINUE),
      ...lines(STICKY),
      ...lines(FREE_RESULT),
      ...lines({ ...OTHER_KEEPERS, keepers: OTHER_KEEPERS.keepers.map((k) => k.line) }),
      UI.home.keepLine,
      UI.home.topicsLink,
      UI.reading.form.previewLine,
      UI.reading.form.questionHint,
      ...lines(UI.reading.form.guided),
      ...lines(UI.reading.intro.hook),
      UI.result.freeBadge,
      ...GODS.flatMap((g) => [0, 1].map((n) => gapLibraryFor(lang)!.gap({ group: g, count: n }))).flatMap((t) => [t.lead, t.body]),
      ...GODS.flatMap((g) => gapLibraryFor(lang)!.lockGap[g].items),
      ...Array.from({ length: 12 }, (_, i) => lifeOfferLine(lang, i, '')!.answer),
    ]);

  it('한국어와 같은 모양이다(빠진 문구가 없다)', () => {
    const ko = paths(CONTINUE_KO);
    const mine = withLocale(lang, () => paths(CONTINUE));
    for (const p of mine) expect(ko, p).toContain(p);

    for (const need of ['sectionLabel', 'lead', 'questionsHeading', 'menuHeading', 'tags.why', 'tags.more', 'tags.new', 'legend', 'format', 'ctaLabel', 'confirm.title', 'confirm.lead', 'confirm.opensToggle', 'confirm.price()', 'confirm.period', 'confirm.keepSignedIn', 'confirm.refund', 'confirm.browse', 'failure.title', 'failure.body', 'failure.backToFree', 'failure.retry', 'readHead.title', 'readHead.seen()']) {
      expect(mine, need).toContain(need);
    }
    expect(withLocale(lang, () => CONTINUE.questions)).toHaveLength(3);
  });

  it('모든 문구가 비어 있지 않고, 남은 {자리표시자}·한글이 없다', () => {
    const texts = all();
    expect(texts.length).toBeGreaterThan(70);
    for (const t of texts) {
      expect(t.trim(), 'empty').not.toBe('');
      expect(t.replace(/\{blur\}/g, ''), t).not.toMatch(BRACE);
      expect(t, t).not.toMatch(HANGUL);
    }
  });

  it('금지 어휘·소금/꿀/사탕 비유·성별 낱말·압박 표현·이모지가 없다', () => {
    for (const t of all()) {
      expect(t, t).not.toMatch(BANNED[lang]);
      expect(t, t).not.toMatch(gender);
      expect(t, t).not.toMatch(PRESSURE);
      expect(EMOJI.test(t), t).toBe(false);
    }
  });

  it('가격은 이 언어의 방 가격과 같고, 목차 줄 수와 형식 설명이 맞는다', () => {
    withLocale(lang, () => {
      const price = ROOMS_COPY.price;
      expect(price).toBe(lang === 'en' ? '$6.29' : '890円');
      expect(CONTINUE.confirm.price(price)).toContain(price);
      expect(CONTINUE.format).toMatch(/36/);
      expect(CONTINUE.format).toMatch(/12/);
      expect(STICKY.note).toMatch(/12/);
    });
  });

  it('율 방 열두 절 모두 얻는 답이 있고, 무료에서 본 것과의 관계가 한국어와 같다', () => {
    const koKinds = KO_TITLES.map((t) => LIFE_OFFER_KO[t].free ?? 'new');
    withLocale(lang, () => {
      const lines12 = roomOffer('life').lines;
      expect(lines12).toHaveLength(12);
      for (const l of lines12) expect(l.answer?.length ?? 0, l.title).toBeGreaterThan(8);
      expect(lines12.map((l) => l.free ?? 'new')).toEqual(koKinds);

      expect(roomOffer('love').lines.every((l) => l.answer === null && l.free === null)).toBe(true);
    });
  });

  it('빈자리 카드: 겉글자 0개·1개의 첫말이 다르고, 가려질 자리 {blur} 가 정확히 한 번 있다', () => {
    const lib = gapLibraryFor(lang)!;
    for (const g of GODS) {
      const none = lib.gap({ group: g, count: 0 });
      const one = lib.gap({ group: g, count: 1 });
      expect(none.lead, g).not.toBe(one.lead);
      for (const t of [none, one]) {
        expect(t.body.match(/\{blur\}/g), g).toHaveLength(1);
        expect(t.hidden).toBe(2);
      }
      expect(none.evidence).toContain('0');
      expect(one.evidence).toContain('1');

      expect(lib.lockGap[g].sections).toEqual(TEASERS_KO.lockGap[g].sections);
      const titles = (lang === 'en' ? ROOMS_EN : overlay(ROOMS_EN, ROOMS_JA)).rooms.life.contents.map((c) => c.title);
      expect(lib.lockGap[g].items).toEqual(lib.lockGap[g].sections.map((n) => titles[n - 1]));
      expect(lib.lockGap[g].room).toBe('life');
    }
  });
});

describe.each(['en', 'ja'] as const)('이어 읽기 화면 %s', (lang) => {
  it('결과 끝 경계: 한글 없이 그려지고, 열두 줄 목차·알약·주 버튼·다른 캐릭터 소개가 있다', () => {
    withLocale(lang, () => {
      const html = renderToStaticMarkup(createElement(ContinuePitch, { type: 'candle' as never }));
      const text = textOf(html);
      expect(text).not.toMatch(HANGUL);
      expect(text).not.toMatch(BRACE);
      expect(html.match(/rs-offer__item/g)).toHaveLength(12);
      expect(html.match(/rs-offer__tag/g)).toHaveLength(12);
      expect(text).toContain(CONTINUE.ctaLabel);

      expect(text).toContain(ROOMS_COPY.first.price);
      expect(html).toContain('href="/room/life"');
      expect(html.match(/rs-others__face/g)).toHaveLength(3);
      expect(html.match(/href="\/home#rooms"/g)).toHaveLength(1);
      expect(html).not.toContain('▒');
    });
  });

  it('다른 캐릭터 소개: 이름은 이 언어의 방 이름, 짧고, 버튼 하나', () => {
    withLocale(lang, () => {

      const full = renderToStaticMarkup(createElement(OtherKeepers));
      expect(textOf(full)).not.toMatch(HANGUL);
      const html = full;
      expect(html).not.toContain('bb-banner');
      const text = textOf(html);
      for (const k of ['mansin', 'yeon', 'u12'] as const) expect(text).toContain(ROOMS_COPY.keepers[k].name);
      expect(html.match(/<a /g)).toHaveLength(1);
      expect(text).toContain(OTHER_KEEPERS.cta);
      expect(text).not.toMatch(HANGUL);
      expect(text.length).toBeLessThan(lang === 'en' ? 330 : 200);
    });
  });

  it('율 방 확인 상자: 가격·열두 줄 목차·무료 결과로 돌아가는 길', () => {
    withLocale(lang, () => {
      const html = renderToStaticMarkup(createElement(ContinueConfirm));
      const text = textOf(html);
      expect(text).not.toMatch(HANGUL);
      expect(text).toContain(ROOMS_COPY.first.price);
      expect(text).toContain(CONTINUE.confirm.title);
      expect(html.match(/rm-contents__num/g)).toHaveLength(12);
      expect(html).toContain('href="/reading?step=result"');
      expect(text).toContain(CONTINUE.confirm.refund);
    });
  });
});

describe('무료 결과 2장 예고편', () => {
  const base = { ...EMPTY_ANSWERS, time: '09:30', timeAnswered: true, place: { name: 'Seoul', label: 'Seoul, KR', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' } };
  const NOW = '2026-11-02T03:00:00.000Z';
  const dates = Array.from({ length: 240 }, (_, d) => new Date(Date.UTC(1975, 0, 1) + d * 53 * 86400_000).toISOString().slice(0, 10));
  const modelOf = (date: string) => buildResultModel({ ...base, date }, NOW);

  it.each(['en', 'ja'] as const)('%s: 빈자리 카드 하나만 만들고 시기·사람 카드는 만들지 않는다', (lang) => {
    withLocale(lang, () => {
      let withGap = 0;
      for (const date of dates) {
        const m = modelOf(date);
        expect(m, date).not.toBeNull();
        expect(m!.people).toBeNull();
        expect(m!.teasers).not.toBeNull();
        expect(m!.teasers!.length).toBeLessThanOrEqual(1);
        const gap = m!.teasers![0];
        if (gap) {
          withGap += 1;
          expect(gap.kind).toBe('gap');
          expect(gap.lead).not.toMatch(HANGUL);
          expect(gap.body).not.toMatch(HANGUL);

          expect(gapCard(m!.chart, gapLibraryFor(lang)!)).toEqual(gap);
        }

        expect(m!.fate).not.toBeNull();
      }
      expect(withGap).toBeGreaterThan(20);
    });
  });

  it('한국어는 지금 그대로: 시기 → (사람) → 빈자리 카드와 곁에 둘 사람 미리보기', () => {
    withLocale('ko', () => {
      const m = modelOf('1997-09-12');
      expect(m!.people).not.toBeNull();
      expect(m!.teasers!.map((c) => c.kind)[0]).toBe('timing');
      expect(m!.teasers!.map((c) => c.kind)).toContain('people');
    });
  });

  it.each(['en', 'ja'] as const)('%s: 2장은 쓴 고민을 받았다는 한 줄만 그려진다(한글 없음). 좋은 소식 칸과 빈자리 카드(잠깐, 이건 놓치면 안 돼)는 없다', (lang) => {
    withLocale(lang, () => {
      const m = modelOf(dates.find((d) => modelOf(d)?.teasers?.[0]) ?? dates[0])!;
      for (const teasers of [m.teasers, []]) {
        const html = renderToStaticMarkup(
          createElement(ChapterConcern, { concern: m.concern, concernLine: m.concernLine, question: 'Should I move?', teasers, reading: m.reading, type: m.profile.key }),
        );
        const text = textOf(html);
        expect(text).not.toMatch(HANGUL);
        expect(text).not.toMatch(BRACE);
        expect(text).toContain(FREE_RESULT.questionLine);

        expect(html).not.toContain('data-teaser');
        expect(html).not.toContain('rs-blur');
        expect(html).not.toContain('wt-mood-sweet');
        expect(html).not.toContain(UI.result.candy.title);
        expect(html).not.toContain('<h2');
      }

      const empty = renderToStaticMarkup(createElement(ChapterConcern, { concern: m.concern, concernLine: m.concernLine, question: '', teasers: m.teasers, reading: m.reading, type: m.profile.key }));
      expect(empty).toBe('');
    });
  });

  it('차트 계산은 언어와 무관하다(같은 입력이면 같은 카드 종류)', () => {
    const chart = computeChart({ date: '1990-05-05', time: '10:00', place: { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' }, sex: 'female' });
    const a = gapCard(chart, gapLibraryFor('en')!);
    const b = gapCard(chart, gapLibraryFor('ja')!);
    expect(a?.id).toBe(b?.id);
  });
});
