import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { BundleBanner } from '../src/components/bundle/bundle-banner';
import { BundleLine } from '../src/components/bundle/bundle-line';
import { BundleTile } from '../src/components/bundle/bundle-tile';
import { BUNDLE_PAGE } from '../src/content/bundle';
import { BUNDLE_PROMO as EN, type BundlePromoCopy } from '../src/content/en/bundle-promo';
import { ROOMS_COPY as ROOMS_EN } from '../src/content/en/rooms';
import { BUNDLE_PROMO_JA } from '../src/content/ja/bundle-promo';
import { ROOMS_JA } from '../src/content/ja/rooms';
import { BUNDLE_PROMO_KO } from '../src/content/ko/bundle-promo';
import { ROOMS_KO } from '../src/content/ko/rooms';
import { LOCALES, overlay, setActiveLocaleForTest, type Locale } from '../src/content/locale';
import { BUNDLE_LANTERNS, BUNDLE_PRICES, BUNDLE_ROOMS } from '../src/lib/payments/bundle';
import { PRICES } from '../src/lib/payments/payments';
import { ROOMS } from '../src/lib/rooms/themes';

afterEach(() => setActiveLocaleForTest('en'));

const COPY: Record<Locale, BundlePromoCopy> = { en: EN, ko: BUNDLE_PROMO_KO, ja: BUNDLE_PROMO_JA };
const ROOMS_BY: Record<Locale, typeof ROOMS_EN> = { en: ROOMS_EN, ko: overlay(ROOMS_EN, ROOMS_KO), ja: overlay(ROOMS_EN, ROOMS_JA) };

function amountOf(text: string, locale: Locale): number {
  if (locale === 'en') {
    const m = /^\$(\d+)\.(\d{2})$/.exec(text);
    if (!m) throw new Error(`price format: ${text}`);
    return Number(m[1]) * 100 + Number(m[2]);
  }
  const m = (locale === 'ko' ? /^(\d{1,3}(?:,\d{3})*)원$/ : /^(\d{1,3}(?:,\d{3})*)円$/).exec(text);
  if (!m) throw new Error(`price format: ${text}`);
  return Number(m[1].replace(/,/g, ''));
}

function paths(v: unknown, at = ''): string[] {
  if (typeof v === 'function') return [`${at}()`];
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => paths(x, at ? `${at}.${k}` : k));
  return [at];
}

function lines(copy: BundlePromoCopy, locale: Locale): string[] {
  const rooms = ROOMS_BY[locale];
  const B = copy.banner;
  return [
    copy.name,
    copy.badge,
    copy.listSr,
    copy.bundleSr,
    copy.withLanterns(BUNDLE_LANTERNS),
    B.title,
    B.lanterns(BUNDLE_LANTERNS),
    B.roomsLabel,
    ...Object.values(copy.short),
    B.cta,
  ];
}

const textOf = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const BANNED_ALL = /cosmic|energy|universe|manifest|fyp|share for luck|에너지|우주|매니페스트|エネルギー|宇宙|マニフェスト/i;
const METAPHOR: Record<Locale, RegExp> = {
  en: /\b(?:salt|honey|candy|sweet)\b/i,
  ko: /사탕|꿀|소금/,
  ja: /塩|蜂蜜|はちみつ|飴|キャンディ/,
};
const GENDER: Record<Locale, RegExp> = {
  en: /\b(?:he|she|his|her|him|man|men|woman|women|guy|girl|male|female|boyfriend|girlfriend)\b/i,
  ko: /남자|여자|남성|여성|남친|여친/,
  ja: /男性|女性|彼女|彼氏|男の人|女の人/,
};

const PRESSURE = /%|％|퍼센트|percent|countdown|hurry|last chance|limited|today only|ends soon|left\b|남음|남았|마감|한정|오늘만|서두르|今だけ|残り|期間限定|締め切り|急いで|最後のチャンス/i;
const EMOJI = /\p{Extended_Pictographic}/u;
const HANGUL = /[가-힣]/;

describe.each(LOCALES)('묶음 가격 글자 %s', (locale) => {
  const P = COPY[locale].prices;
  const price = BUNDLE_PRICES[locale];

  it('묶음 값과 취소선 값이 BUNDLE_PRICES 와 같은 숫자다', () => {
    expect(amountOf(P.bundle, locale)).toBe(price.amount);
    expect(amountOf(P.list, locale)).toBe(price.list);
    expect(price.amount).toBeLessThan(price.list);
  });

  it('취소선은 다섯 방을 따로 살 때의 실제 합이다(방 하나 가격 × 다섯 방)', () => {
    expect(BUNDLE_ROOMS).toHaveLength(5);
    expect(price.currency).toBe(PRICES[locale].currency);
    expect(price.list).toBe(PRICES[locale].amount * BUNDLE_ROOMS.length);

    expect(amountOf(ROOMS_BY[locale].price, locale)).toBe(PRICES[locale].amount);
  });

  it('다섯 방마다 짧은 이름이 하나씩 있고 비어 있지 않다', () => {
    expect(Object.keys(COPY[locale].short).sort()).toEqual([...BUNDLE_ROOMS].sort());
    for (const room of BUNDLE_ROOMS) expect(COPY[locale].short[room].trim().length, room).toBeGreaterThan(0);
  });
});

describe('묶음 홍보 문구', () => {
  it('세 언어가 같은 모양이고 빈 곳이 없다', () => {
    const en = paths(EN);
    for (const locale of LOCALES) {
      expect(paths(COPY[locale]), locale).toEqual(en);
      for (const t of lines(COPY[locale], locale)) expect(t.trim(), locale).not.toBe('');
    }
  });

  it.each(LOCALES)('%s: 금지 어휘·비유·성별 낱말·재촉·이모지가 없다(문구 안에 % 도 없다)', (locale) => {
    for (const t of lines(COPY[locale], locale)) {
      expect(t, t).not.toMatch(BANNED_ALL);
      expect(t, t).not.toMatch(METAPHOR[locale]);
      expect(t, t).not.toMatch(GENDER[locale]);
      expect(t, t).not.toMatch(PRESSURE);
      expect(EMOJI.test(t), t).toBe(false);
      if (locale !== 'ko') expect(t, t).not.toMatch(HANGUL);
      if (locale === 'en') expect(t, t).not.toMatch(/[—–]/);
    }
  });
});

describe.each(LOCALES)('묶음 홍보 화면 %s', (locale) => {
  const T = COPY[locale];
  const rooms = ROOMS_BY[locale];
  const render = (el: Parameters<typeof renderToStaticMarkup>[0]) => {
    setActiveLocaleForTest(locale);
    return renderToStaticMarkup(el);
  };
  const strike = `<s class="bb-price__list">${T.prices.list}</s>`;

  it('무료 결과 배너: 구역 이름, 오픈 기념, 취소선 → 묶음 가격, 등불, 다섯 방, /bundle 버튼 하나', () => {
    const html = render(createElement(BundleBanner));
    const text = textOf(html);
    expect(html).toMatch(new RegExp(`^<section aria-label="${T.name}" class="bb-banner"`));
    expect(html).toContain(strike);
    expect(html).toContain(`<strong class="bb-price__now">${T.prices.bundle}</strong>`);

    expect(html).toContain(`<span class="sr-only">${T.listSr} </span>`);
    expect(text).toContain(T.badge);
    expect(text).toContain(T.banner.lanterns(BUNDLE_LANTERNS));

    expect(html.match(/bb-faces__img/g)).toHaveLength(5);
    for (const room of BUNDLE_ROOMS) expect(text, room).toContain(T.short[room]);
    expect(html).not.toContain('bb-rooms');
    expect(text).not.toContain(rooms.rooms.life.title);
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toContain('href="/bundle"');
    expect(text).toContain(T.banner.cta);
    if (locale !== 'ko') expect(text).not.toMatch(HANGUL);
  });

  it('나의 신당 타일: 오픈 기념, 이름, 취소선 → 묶음 가격, 등불 수, /bundle', () => {
    const html = render(createElement(BundleTile));
    const text = textOf(html);
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toContain('href="/bundle"');
    expect(html).toContain(strike);
    for (const t of [T.badge, T.name, T.prices.bundle, T.withLanterns(BUNDLE_LANTERNS)]) expect(text).toContain(t);
  });

  it('방 화면 한 줄 카드: 5개 방 묶음(이름, 취소선 → 묶음 가격, 등불 수, /bundle)과 그 아래 3개 고르기(/bundle?plan=pick) 두 줄', () => {
    for (const from of ['room', 'paid'] as const) {
      const html = render(createElement(BundleLine, { from }));
      const text = textOf(html);
      expect(html.match(/<a /g)).toHaveLength(2);
      expect(html).toContain('href="/bundle"');
      expect(html).toContain('href="/bundle?plan=pick"');
      expect(html).toContain(strike);
      for (const t of [T.name, T.prices.bundle, T.withLanterns(BUNDLE_LANTERNS), BUNDLE_PAGE.pick.name, BUNDLE_PAGE.pick.price]) expect(text).toContain(t);
    }
  });
});
