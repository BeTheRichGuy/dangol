import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_CLIENT_OFFERS, parseOffers } from '../src/components/rooms/use-offers';
import { saleBody } from '../src/components/rooms/toss-checkout';
import { CheckoutSheet } from '../src/components/rooms/checkout-sheet';
import { bundleLifePayload, bundlePayloads, parseBundlePending, pendingPicks, pendingRooms, pickPersonFor, pickReceiptFor, saveBundlePending } from '../src/components/bundle/bundle-store';
import { BUNDLE_COPY as BUNDLE_EN, type BundleCopy } from '../src/content/en/bundle';
import { BUNDLE_JA } from '../src/content/ja/bundle';
import { BUNDLE_KO } from '../src/content/ko/bundle';
import { ROOMS_COPY as ROOMS_EN } from '../src/content/en/rooms';
import { ROOMS_JA } from '../src/content/ja/rooms';
import { ROOMS_KO } from '../src/content/ko/rooms';
import { LOCALES, overlay, setActiveLocaleForTest, type Locale } from '../src/content/locale';
import { BUNDLE_ROOMS } from '../src/lib/payments/bundle';
import { BundlePrice } from '../src/components/bundle/bundle-line';
import { dealText, PriceDeal } from '../src/components/rooms/price-deal';
import { RoomCard } from '../src/components/rooms/room-cards';
import { bundlePercentOff, BUNDLE_PRICES } from '../src/lib/payments/bundle';
import { FIRST_PRICES, firstPercentOff, PICK_PRICES, pickListAmount, pickPercentOff } from '../src/lib/payments/offers';
import { percentOff, PRICES } from '../src/lib/payments/prices';
import { ROOM_KEYS, type ProductKey, type RoomKey } from '../src/lib/rooms/themes';
import { REUNION_PRICE_TEXT } from '../src/lib/reunion/product';
import type { Person } from '../src/lib/account/types';

afterEach(() => setActiveLocaleForTest('en'));

const BUNDLES: Record<Locale, BundleCopy> = { en: BUNDLE_EN, ko: BUNDLE_KO, ja: BUNDLE_JA };
const ROOMS_BY: Record<Locale, typeof ROOMS_EN> = { en: ROOMS_EN, ko: overlay(ROOMS_EN, ROOMS_KO), ja: overlay(ROOMS_EN, ROOMS_JA) };
const NOW = '2026-11-05T00:00:00Z';
const PICKS: ProductKey[] = ['life', 'match', 'reunion'];

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

const me: Person = {
  id: 'p1',
  name: 'Mina',
  relation: 'self',
  date: '1995-03-14',
  time: '09:30',
  place: { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' },
  sex: 'female',
} as Person;
const other: Person = { ...me, id: 'p2', name: 'Jun', relation: 'friend', date: '1993-08-02', sex: 'male' } as Person;

describe.each(LOCALES)('화면의 값 %s', (locale) => {
  const R = BUNDLES[locale].pick;
  const rooms = ROOMS_BY[locale];

  it('첫 구매 값 글자는 서버 값(FIRST_PRICES)과 같고, 보통 값보다 싸며 절반쯤이다', () => {
    expect(amountOf(rooms.first.price, locale)).toBe(FIRST_PRICES[locale].amount);
    expect(amountOf(rooms.price, locale)).toBe(PRICES[locale].amount);
    expect(FIRST_PRICES[locale].amount).toBeLessThan(PRICES[locale].amount);
  });

  it('3개 고르기 값 글자는 서버 값(PICK_PRICES)과 같고, 취소선은 방 하나 값 × 3이다', () => {
    expect(amountOf(R.price, locale)).toBe(PICK_PRICES[locale].amount);
    expect(amountOf(R.list, locale)).toBe(pickListAmount(locale));
    expect(amountOf(R.list, locale)).toBeGreaterThan(amountOf(R.price, locale));
  });
});

describe('문구', () => {
  const EMOJI = /\p{Extended_Pictographic}/u;
  const BANNED = /cosmic|energy|universe|manifest|FYP|share for luck/i;
  const SWEET = /candy|honey|salt|사탕|꿀|소금|キャンディ|はちみつ|塩/i;
  const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힯]/;

  const ratesOf = (locale: Locale) => new Set([firstPercentOff(locale), bundlePercentOff(locale), pickPercentOff(locale)]);

  function pickLines(locale: Locale): string[] {
    const R = BUNDLES[locale].pick;
    const F = ROOMS_BY[locale].first;
    const P = ROOMS_BY[locale].percentOff;
    const both = [true, false] as const;
    return [
      R.name, R.tabAll, R.price, R.list, R.badge, R.cta,
      R.checkout.orderName, R.checkout.product, R.checkout.refundNotice, ...both.flatMap((a) => both.map((b) => R.checkout.after(a, b))),
      R.page.title, R.page.lead, R.page.listLabel, R.page.chooseHeading, R.page.chooseHint, R.page.loginLead, R.page.chosen(2, 6),
      ...both.flatMap((a) => both.flatMap((b) => R.page.steps(a, b))), R.page.partnerNote, R.page.reunionNote,
      R.page.dockPay(R.price), R.page.dockChoose(1), R.page.dockChoose(2), R.page.payNote,
      R.read.title, R.read.partnerLead, R.read.start, R.read.writingHeading, R.read.writingNote, R.read.allDone, R.read.reunionNote, R.read.reunionButton, R.read.reunionPaid,
      F.price, F.tag, F.wasSr, F.note(firstPercentOff(locale)), P(pickPercentOff(locale)),
    ];
  }

  function paths(v: unknown, at = ''): string[] {
    if (typeof v === 'function') return [`${at}()`];
    if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => paths(x, at ? `${at}.${k}` : k));
    return [at];
  }

  it('세 언어가 같은 모양이고 빈 곳이 없다', () => {
    for (const locale of LOCALES) {
      expect(paths(BUNDLES[locale].pick), locale).toEqual(paths(BUNDLE_EN.pick));
      expect(paths(ROOMS_BY[locale].first), locale).toEqual(paths(ROOMS_EN.first));
      for (const t of pickLines(locale)) expect(t.trim(), locale).not.toBe('');
    }
  });

  it.each(LOCALES)('%s: 금지 어휘·사탕/꿀/소금 비유·이모지가 없고, 영어·일본어에는 한글이 없다. 할인율은 계산한 값뿐이다', (locale) => {
    const rates = ratesOf(locale);
    for (const t of pickLines(locale)) {
      expect(t, t).not.toMatch(BANNED);
      expect(t, t).not.toMatch(SWEET);

      for (const m of t.matchAll(/(\d+)\s*[%％]/g)) expect(rates.has(Number(m[1])), `${t} -> ${m[1]}`).toBe(true);
      expect(EMOJI.test(t), t).toBe(false);
      if (locale !== 'ko') expect(t, t).not.toMatch(HANGUL);
      if (locale === 'en') expect(t, t).not.toMatch(/[—–]/);
    }
  });

  it.each(LOCALES)('%s: 3개 고르기에는 등불이 없다고 밝힌다(등불은 5개 방 묶음에만)', (locale) => {
    const R = BUNDLES[locale].pick;
    const none = /not included|들어 있지 않|つきません/;
    expect(R.page.payNote).toMatch(none);
    expect(R.checkout.refundNotice).toMatch(none);

    expect(pickLines(locale).join(' ')).not.toMatch(/15|bonus|보너스|おまけ/i);
  });
});

describe('서버 답 읽기(parseOffers)', () => {
  it('first 를 읽는다. 답을 못 받았거나 모양이 틀리면 첫 구매 값(누구에게나 2,490원)이 기본이다', () => {
    expect(parseOffers({ first: true })).toEqual({ first: true, loaded: true });

    expect(parseOffers({ first: false })).toEqual({ first: false, loaded: true });

    expect(parseOffers(null)).toEqual({ first: true, loaded: true });
    expect(parseOffers({})).toEqual({ first: false, loaded: true });
    expect(DEFAULT_CLIENT_OFFERS).toEqual({ first: true, loaded: false });
  });
});

describe('요청 본문(saleBody)', () => {
  const payload = bundleLifePayload(me, 'ko', NOW)!;
  it('방 하나는 그대로, 5개 방 묶음은 bundle, 3개 고르기는 pick(고른 3개)만 더한다', () => {
    expect(saleBody(payload, {})).toEqual(payload);
    expect(saleBody(payload, { bundle: true })).toEqual({ ...payload, bundle: true });
    expect(saleBody(payload, { pick: PICKS })).toEqual({ ...payload, pick: PICKS });

    expect('bundle' in saleBody(payload, { bundle: true, pick: PICKS })).toBe(false);
  });
});

describe('이 탭에 두는 값(3개 고르기)', () => {
  function roundTrip(v: object): ReturnType<typeof parseBundlePending> {
    const store = new Map<string, string>();
    const fake = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, x: string) => void store.set(k, x), removeItem: (k: string) => void store.delete(k) } as unknown as Storage;
    saveBundlePending(fake, { selfId: 'p1', receipt: null, lanterns: null, partnerId: null, kind: null, ...v });
    return parseBundlePending(fake.getItem('dangol.bundle.v1'));
  }

  it('pick 과 고른 3개가 함께 있어야 3개 고르기이고, 이 화면이 쓰는 방은 그중 다섯 방뿐이다(재회 사주는 정보를 입력해야 시작된다)', () => {
    const pick = roundTrip({ plan: 'pick', picks: ['life', 'match', 'reunion'] });
    expect(pick).toMatchObject({ plan: 'pick', picks: ['life', 'match', 'reunion'] });
    expect(pendingPicks(pick)).toEqual(['life', 'match', 'reunion']);
    expect(pendingRooms(pick)).toEqual(['life', 'match']);
    expect(pendingRooms(roundTrip({ plan: 'pick', picks: ['year', 'decades', 'love'] }))).toEqual(['decades', 'love', 'year']);
  });

  it('5개 방 묶음이거나, pick 인데 고른 것이 이상하면 다섯 방 모두', () => {
    expect(pendingRooms(roundTrip({}))).toEqual(BUNDLE_ROOMS);
    expect(pendingPicks(roundTrip({}))).toBeNull();
    for (const picks of [undefined, [], ['life'], ['life', 'love'], ['life', 'life', 'love'], ['life', 'love', 'x'], ['life', 'love', 'match', 'year']]) {
      const v = roundTrip({ plan: 'pick', picks });
      expect(pendingPicks(v)).toBeNull();
      expect(pendingRooms(v)).toEqual(BUNDLE_ROOMS);
    }
    expect(pendingRooms(null)).toEqual(BUNDLE_ROOMS);
  });

  it('영수증이 확인된 뒤에만 재회 사주를 묶음 영수증으로 시작한다(pickReceiptFor): 고르지 않았거나 영수증이 없으면 null', () => {
    const make = (v: object) => {
      const store = new Map<string, string>();
      const fake = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, x: string) => void store.set(k, x), removeItem: (k: string) => void store.delete(k) } as unknown as Storage;
      saveBundlePending(fake, { selfId: 'p1', receipt: null, lanterns: null, partnerId: null, kind: null, ...v });
      return fake;
    };
    expect(pickReceiptFor(make({ plan: 'pick', picks: ['life', 'match', 'reunion'], receipt: 'r.1' }), 'reunion')).toBe('r.1');
    expect(pickPersonFor(make({ plan: 'pick', picks: ['life', 'match', 'reunion'], receipt: 'r.1' }), 'reunion')).toBe('p1');
    expect(pickReceiptFor(make({ plan: 'pick', picks: ['life', 'match', 'reunion'], receipt: null }), 'reunion')).toBeNull();
    expect(pickReceiptFor(make({ plan: 'pick', picks: ['life', 'decades', 'love'], receipt: 'r.1' }), 'reunion')).toBeNull();
    expect(pickReceiptFor(make({ receipt: 'r.1' }), 'reunion')).toBeNull();
  });

  it('고른 방에 묵의 궁합이 없으면 상대 없이 풀이 묶음을 만들고, 있는데 상대가 없으면 만들지 않는다', () => {
    const rooms: RoomKey[] = ['life', 'love', 'year'];
    const built = bundlePayloads(me, null, null, 'ko', NOW, rooms)!;
    expect(Object.keys(built).sort()).toEqual([...rooms].sort());
    expect(bundlePayloads(me, null, null, 'ko', NOW, ['life', 'match'])).toBeNull();
    const withPair = bundlePayloads(me, other, 'friend', 'ko', NOW, ['life', 'match'])!;
    expect(Object.keys(withPair).sort()).toEqual(['life', 'match']);

    expect(Object.keys(bundlePayloads(me, other, 'friend', 'ko', NOW)!).sort()).toEqual([...ROOM_KEYS].sort());
  });
});

describe.each(LOCALES)('결제 창 %s', (locale) => {
  const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  const sheet = (props: Record<string, unknown>) => {
    setActiveLocaleForTest(locale);
    return renderToStaticMarkup(
      createElement(CheckoutSheet, { room: 'life', payload: bundleLifePayload(me, locale, NOW)!, readers: ['Mina'], token: async () => null, onPaid: () => {}, onClose: () => {}, toss: { beforeRedirect: () => {} }, ...props }),
    );
  };

  it('첫 구매 값: 합계에 보통 값을 취소선으로, 지금 값을 굵게. 이름표는 첫 구매. 버튼 글자도 첫 구매 값', () => {
    const R = ROOMS_BY[locale];
    const html = sheet({ first: true });
    expect(html).toContain(`<s class="rm-pay__was"><span class="sr-only">${R.first.wasSr} </span>${R.price}</s>`);
    expect(html).toContain(`<strong>${R.first.price}</strong>`);
    expect(text(html)).toContain(R.first.tag);
    expect(text(html)).not.toContain(R.launchBadge);
    expect(text(html)).toContain(R.checkout.pay(R.first.price));
  });

  it('보통 값: 취소선도 첫 구매 이름표도 없다', () => {
    const R = ROOMS_BY[locale];
    const html = sheet({});
    expect(html).not.toContain('rm-pay__was');
    expect(text(html)).toContain(R.launchBadge);
    expect(text(html)).toContain(R.checkout.pay(R.price));
  });

  it('재회 사주: 첫 구매 값이면 재회 보통 값을 취소선으로, 첫 구매 값을 굵게. 보통 값이면 재회 값 하나', () => {
    const R = ROOMS_BY[locale];
    const reunion = (props: Record<string, unknown>) => sheet({ room: 'reunion', ...props });
    const first = reunion({ first: true });
    expect(first).toContain(`<s class="rm-pay__was"><span class="sr-only">${R.first.wasSr} </span>${REUNION_PRICE_TEXT[locale]}</s>`);
    expect(first).toContain(`<strong>${R.first.price}</strong>`);
    expect(text(first)).toContain(R.checkout.pay(R.first.price));
    const regular = reunion({});
    expect(regular).not.toContain('rm-pay__was');
    expect(text(regular)).toContain(R.checkout.pay(REUNION_PRICE_TEXT[locale]));

    expect(text(regular)).not.toContain(R.launchBadge);
  });

  it('3개 고르기: 고른 상품들·3개 고르기 값, 등불 보너스 없음, 오픈 기념 이름표 없음', () => {
    const B = BUNDLES[locale];
    const R = ROOMS_BY[locale];
    const html = sheet({ pick: PICKS });
    const t = text(html);
    expect(t).toContain(B.pick.checkout.product);
    for (const r of PICKS) expect(t).toContain(r === 'reunion' ? R.reunion.title : R.rooms[r].title);
    expect(t).toContain(B.checkout.productLabel);
    expect(t).toContain(R.checkout.pay(B.pick.price));
    expect(t).toContain(B.pick.checkout.refundNotice);
    expect(t).toContain(B.pick.checkout.after(true, true));

    expect(t).not.toContain(B.checkout.lanternsLabel);
    expect(t).not.toContain(R.launchBadge);
    expect(html).not.toContain('rm-pay__game');
  });

  it('고른 3개에 묵의 궁합이 없거나 재회 사주가 없으면 결제 뒤 안내가 그것을 말하지 않는다', () => {
    const B = BUNDLES[locale];
    const t = text(sheet({ pick: ['life', 'decades', 'year'] }));
    expect(t).toContain(B.pick.checkout.after(false, false));
    expect(t).not.toContain(B.pick.checkout.after(true, false));
    expect(t).not.toContain(B.pick.checkout.after(false, true));
  });
});

describe('할인율 표시(할인되는 것은 모두 할인율을 적는다)', () => {
  it('percentOff: 정수 나눗셈으로 내림한다(부풀리지 않는다). 할인이 아니면 0', () => {
    expect(percentOff(4900, 2490)).toBe(49);
    expect(percentOff(390, 199)).toBe(48);
    expect(percentOff(2750, 1100)).toBe(60);
    expect(percentOff(100, 100)).toBe(0);
    expect(percentOff(100, 150)).toBe(0);
    expect(percentOff(0, 0)).toBe(0);
    expect(percentOff(100, 0)).toBe(0);
  });

  it('실제 값에서 나온 비율: 첫 구매 49·48·49, 5개 방 묶음 59·59·60, 3개 고르기 52·52·52', () => {
    expect(['ko', 'en', 'ja'].map((l) => firstPercentOff(l as Locale))).toEqual([49, 68, 68]);
    expect(['ko', 'en', 'ja'].map((l) => bundlePercentOff(l as Locale))).toEqual([59, 74, 75]);
    expect(['ko', 'en', 'ja'].map((l) => pickPercentOff(l as Locale))).toEqual([52, 70, 70]);

    for (const l of LOCALES) expect(bundlePercentOff(l)).toBe(percentOff(BUNDLE_PRICES[l].list, BUNDLE_PRICES[l].amount));
    for (const l of LOCALES) expect(pickPercentOff(l)).toBe(percentOff(PRICES[l].amount * 3, PICK_PRICES[l].amount));
  });

  it.each(LOCALES)('%s: 이름표 글자', (locale) => {
    const t = ROOMS_BY[locale].percentOff(49);
    expect(t).toBe({ en: '49% off', ko: '49% 할인', ja: '49%オフ' }[locale]);
  });

  const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

  it.each(LOCALES)('%s: 묶음 가격 표기(배너·타일·한 줄 카드)는 5개 방 묶음 할인율을, 3개 고르기는 3개 고르기의 할인율을 이름표로 단다', (locale) => {
    setActiveLocaleForTest(locale);
    const full = renderToStaticMarkup(createElement(BundlePrice, {}));
    expect(full).toContain(`<span class="bb-price__off">${ROOMS_BY[locale].percentOff(bundlePercentOff(locale))}</span>`);
    const pick = renderToStaticMarkup(createElement(BundlePrice, { off: pickPercentOff(locale) }));
    expect(pick).toContain(ROOMS_BY[locale].percentOff(pickPercentOff(locale)));

    expect(renderToStaticMarkup(createElement(BundlePrice, { off: 0 }))).not.toContain('bb-price__off');
  });

  it.each(LOCALES)('%s: 결제 창 합계에 취소선·지금 값·할인율(첫 구매, 5개 방 묶음, 3개 고르기). 보통 값 결제에는 없다', (locale) => {
    setActiveLocaleForTest(locale);
    const render = (props: Record<string, unknown>) =>
      renderToStaticMarkup(
        createElement(CheckoutSheet, { room: 'life', payload: bundleLifePayload(me, locale, NOW)!, readers: ['Mina'], token: async () => null, onPaid: () => {}, onClose: () => {}, toss: { beforeRedirect: () => {} }, ...props }),
      );
    const R = ROOMS_BY[locale];
    const first = render({ first: true });
    expect(first).toContain(`<span class="rm-pay__off">${R.percentOff(firstPercentOff(locale))}</span>`);
    const bundle = render({ bundle: true });
    expect(bundle).toContain(`<span class="rm-pay__off">${R.percentOff(bundlePercentOff(locale))}</span>`);
    expect(text(bundle)).toContain(BUNDLES[locale].listPrice);
    const pick = render({ pick: PICKS });
    expect(pick).toContain(`<span class="rm-pay__off">${R.percentOff(pickPercentOff(locale))}</span>`);
    expect(text(pick)).toContain(BUNDLES[locale].pick.list);
    expect(render({})).not.toContain('rm-pay__off');
  });
});

describe('첫사주 한정 가격 표기(첫사주 한정! 4,900원 → 2,490원)', () => {
  it.each(LOCALES)('%s: 이름표·취소선(보통 값)·화살표·지금 값, 스크린리더용 말', (locale) => {
    setActiveLocaleForTest(locale);
    const R = ROOMS_BY[locale];
    const html = renderToStaticMarkup(createElement(PriceDeal, { now: R.first.price, was: R.price, tag: true }));
    expect(html).toContain(`<span class="rm-deal__tag">${R.first.tag}</span>`);
    expect(html).toContain(`<s class="rm-deal__was"><span class="sr-only">${R.first.wasSr} </span>${R.price}</s>`);
    expect(html).toContain(`<strong class="rm-deal__now">${R.first.price}</strong>`);

    expect(renderToStaticMarkup(createElement(PriceDeal, { now: R.first.price, was: R.price }))).not.toContain('rm-deal__tag');
    expect(renderToStaticMarkup(createElement(PriceDeal, { now: R.price, was: null }))).toBe(R.price);
  });

  it('이름표 문구: 첫사주 한정! / First reading only! / 初回限定!', () => {
    expect(ROOMS_BY.ko.first.tag).toBe('첫사주 한정!');
    expect(ROOMS_BY.en.first.tag).toBe('First reading only!');
    expect(ROOMS_BY.ja.first.tag).toBe('初回限定!');
  });

  it('dealText: 글 속 값을 취소선 → 지금 값으로 바꾸고, 값이 없으면 글 그대로, was 가 없으면 값만', () => {
    const t = renderToStaticMarkup(createElement('p', null, dealText('첫사주 한정, 2,490원(49% 할인)이에요.', '2,490원', '2,490원', '4,900원')));
    expect(t).toContain('<s class="rm-deal__was">');
    expect(t).toContain('4,900원');
    expect(t.replace(/<[^>]+>/g, '')).toContain('2,490원');
    expect(dealText('가격 없음', '2,490원', '2,490원', '4,900원')).toBe('가격 없음');
    expect(renderToStaticMarkup(createElement('p', null, dealText('값 2,490원 끝', '2,490원', '4,900원', null)))).toBe('<p>값 4,900원 끝</p>');
  });

  it.each(LOCALES)('%s: 방 카드에는 값을 그리지 않는다(값은 방 안에서 결제 버튼을 누를 때 결제 창에만)', (locale) => {
    setActiveLocaleForTest(locale);
    const R = ROOMS_BY[locale];
    const html = renderToStaticMarkup(createElement(RoomCard, { room: 'life', index: 0, total: 5 }));
    for (const v of [R.price, R.first.price, R.first.tag]) expect(html).not.toContain(v);
    expect(html).not.toContain('rm-price');
  });
});
