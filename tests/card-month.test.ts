import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { breakJa, monthSentence, monthToneSize } from '../src/app/api/card/month';
import { CARD_WIDTHS, parseCardMonth, parseCardParams } from '../src/app/api/card/params';
import { FATE_EN } from '../src/content/en/fate-map';
import { FATE_JA } from '../src/content/ja/fate-map';
import { FATE_KO } from '../src/content/ko/fate-map';
import { TYPE_PROFILES } from '../src/content/en/types';
import { cardMonthOf, cardPath, SharePanel } from '../src/components/result/share-panel';
import { setActiveLocaleForTest } from '../src/content/locale';
import { pickGoodMonth, type KeyMonth } from '../src/lib/reading/fate-map';

const q = (s: string) => new URLSearchParams(s);
const km = (year: number, month: number, good: boolean): KeyMonth => ({ year, month, tone: good ? 'harmonyDay' : 'clashDay', good });

describe('내 좋은 달 카드 요청(gm·gy·gs)', () => {
  it('달이 1~12 정수일 때만 받고, 아니면 버려서 유형 카드로 돌아간다', () => {
    expect(parseCardMonth(q('gm=12'))).toEqual({ month: 12, year: null, seat: 'day' });
    expect(parseCardMonth(q('gm=1&gy=2027&gs=month'))).toEqual({ month: 1, year: 2027, seat: 'month' });
    for (const bad of ['', '0', '13', '-1', '1.5', 'abc', '012', '1e1', ' ']) expect(parseCardMonth(q(`gm=${bad}`)), bad).toBeNull();
    expect(parseCardMonth(q(''))).toBeNull();
  });

  it('해는 2000~2100 네 자리만, 자리는 month 만 월지로 보고 나머지는 day 로 읽는다', () => {
    expect(parseCardMonth(q('gm=5&gy=1999'))?.year).toBeNull();
    expect(parseCardMonth(q('gm=5&gy=2101'))?.year).toBeNull();
    expect(parseCardMonth(q('gm=5&gy=26'))?.year).toBeNull();
    expect(parseCardMonth(q('gm=5&gy=2026'))?.year).toBe(2026);
    expect(parseCardMonth(q('gm=5&gs=junk'))?.seat).toBe('day');
    expect(parseCardMonth(q('gm=5&gs=day'))?.seat).toBe('day');
  });

  it('유형·번호·가로 변형과 함께 와도 서로 영향을 주지 않는다', () => {
    const p = parseCardParams(q('t=candle&no=317&gm=9&gy=2027&l=ko&og=1'), TYPE_PROFILES);
    expect(p.type?.key).toBe('candle');
    expect(p.regularNo).toBe(317);
    expect(p.og).toBe(true);
    expect(p.month).toEqual({ month: 9, year: 2027, seat: 'day' });

    expect(parseCardParams(q('t=candle'), TYPE_PROFILES).month).toBeNull();
  });

  it('개인을 가리는 값(이름·생년월일)은 받지 않는다: 달·해·자리뿐이다', () => {
    const p = parseCardParams(q('gm=3&gy=2027&name=Koto&birth=1995-03-14&date=1995-03-14'), TYPE_PROFILES);
    expect(Object.keys(p).sort()).toEqual(['month', 'og', 'regularNo', 'type', 'width']);
    expect(JSON.stringify(p)).not.toMatch(/Koto|1995/);
  });
});

describe('카드 문장', () => {
  it('영어는 대문자로 시작해 마침표로, 한국어는 마침표로, 일본어는 。로 끝난다', () => {
    expect(monthSentence('en', 'it tends to be easy')).toBe('It tends to be easy.');
    expect(monthSentence('ko', '손잡을 일이 생기기 쉬워')).toBe('손잡을 일이 생기기 쉬워.');
    expect(monthSentence('ja', '手を取り合いやすい')).toMatch(/。$/);
  });

  it('일본어는 낱말 중간에서 줄을 나누지 않는다: 좋은 달 문구 두 가지가 모두 두 줄로 자연스럽게 나뉜다', () => {
    expect(breakJa(FATE_JA.months.tone.harmonyDay)).toBe('身近な人と気持ちを合わせて\n手を取り合いやすい');
    expect(breakJa(FATE_JA.months.tone.harmonyMonth)).toBe('職場や集まりで、\nいい人と仕事が一か所に集まりやすい');

    expect(breakJa('やさしい')).toBe('やさしい');

    for (const tone of [FATE_JA.months.tone.harmonyDay, FATE_JA.months.tone.harmonyMonth]) expect(monthSentence('ja', tone).split('\n').length).toBeLessThanOrEqual(2);
  });

  it('글자 크기는 문장이 두 줄 안에 들어가게 정한다: 일본어는 가장 긴 줄이 888px 안에 들고, 크기는 38~50px 이다', () => {
    for (const tone of [FATE_JA.months.tone.harmonyDay, FATE_JA.months.tone.harmonyMonth]) {
      const text = monthSentence('ja', tone);
      const size = monthToneSize('ja', text);
      const longest = Math.max(...text.split('\n').map((l) => [...l].length));
      expect(size).toBeGreaterThanOrEqual(38);
      expect(size).toBeLessThanOrEqual(50);
      expect(longest * size, `${text}`).toBeLessThanOrEqual(888);
      expect(text.split('\n').length).toBeLessThanOrEqual(2);
    }

    expect(monthToneSize('en', 'Short.')).toBe(50);
    expect(monthToneSize('en', 'x'.repeat(85))).toBe(44);
    expect(monthToneSize('ko', '가'.repeat(20))).toBe(50);
    expect(monthToneSize('ko', '가'.repeat(40))).toBe(44);

    for (const F of [FATE_EN, FATE_KO]) for (const tone of [F.months.tone.harmonyDay, F.months.tone.harmonyMonth]) {
      const size = monthToneSize(F === FATE_EN ? 'en' : 'ko', monthSentence(F === FATE_EN ? 'en' : 'ko', tone));
      expect([44, 47, 50]).toContain(size);
    }
  });

  it('세 언어 모두 좋은 달 문구 두 가지가 있고, 영어·일본어에는 한글이 없다', () => {
    for (const F of [FATE_KO, FATE_EN, FATE_JA]) {
      expect(F.months.tone.harmonyDay.length).toBeGreaterThan(5);
      expect(F.months.tone.harmonyMonth.length).toBeGreaterThan(5);
    }
    for (const F of [FATE_EN, FATE_JA]) expect(`${F.months.tone.harmonyDay}${F.months.tone.harmonyMonth}`).not.toMatch(/[가-힣]/);
  });
});

describe('카드에 올릴 좋은 달', () => {
  it('앞으로 다가오는 좋은 달 가운데 가장 이른 달을 고른다(조심할 달은 올리지 않는다)', () => {
    expect(pickGoodMonth([km(2026, 11, false), km(2026, 12, true), km(2027, 3, true)])).toEqual(km(2026, 12, true));
    expect(pickGoodMonth([km(2027, 9, false), km(2027, 10, true)])).toEqual(km(2027, 10, true));
  });

  it('좋은 달이 없으면 null(카드를 만들지 않는다)', () => {
    expect(pickGoodMonth([km(2026, 11, false)])).toBeNull();
    expect(pickGoodMonth([])).toBeNull();
    expect(pickGoodMonth(undefined)).toBeNull();
  });
});

describe('공유 패널의 좋은 달 카드', () => {
  beforeAll(() => setActiveLocaleForTest('ko'));
  afterAll(() => setActiveLocaleForTest('en'));

  it('카드 주소: 달·해만, 월지 자리일 때만 gs=month 가 붙고, 유형 카드 주소는 그대로다', () => {
    expect(cardPath('candle', { no: 317, locale: 'ko' })).toBe('/api/card?t=candle&no=317&l=ko');
    expect(cardPath('candle', { locale: 'ko', month: { month: 9, year: 2027, seat: 'day' } })).toBe('/api/card?t=candle&gm=9&gy=2027&l=ko');
    expect(cardPath('candle', { width: 544, locale: 'ja', month: { month: 11, year: 2026, seat: 'month' } })).toBe('/api/card?t=candle&w=544&gm=11&gy=2026&gs=month&l=ja');
    expect(CARD_WIDTHS).toContain(544);
  });

  it('만든 주소는 카드 요청 해석기가 그대로 읽는다(주소 ↔ 해석이 어긋나지 않는다)', () => {
    for (const seat of ['day', 'month'] as const) {
      const url = new URL(cardPath('candle', { no: 317, width: 544, locale: 'en', month: { month: 4, year: 2027, seat } }), 'https://x.app');
      const p = parseCardParams(url.searchParams, TYPE_PROFILES);
      expect(p.month).toEqual({ month: 4, year: 2027, seat });
      expect(p.type?.key).toBe('candle');
      expect(p.regularNo).toBe(317);
      expect(p.width).toBe(544);
    }
  });

  it('주소에 이름·생년월일 같은 개인 값이 들어가지 않는다: 허용된 이름(t·no·w·gm·gy·gs·l)뿐', () => {
    const url = new URL(cardPath('candle', { no: 317, width: 544, locale: 'ko', month: { month: 4, year: 2027, seat: 'month' } }), 'https://x.app');
    expect([...url.searchParams.keys()].sort()).toEqual(['gm', 'gs', 'gy', 'l', 'no', 't', 'w']);
  });

  it('좋은 달이 일의 자리(어울림 월지)이면 month, 아니면 day 자리로 올린다', () => {
    expect(cardMonthOf({ year: 2027, month: 9, tone: 'harmonyMonth', good: true })).toEqual({ month: 9, year: 2027, seat: 'month' });
    expect(cardMonthOf({ year: 2027, month: 3, tone: 'harmonyDay', good: true })).toEqual({ month: 3, year: 2027, seat: 'day' });
  });

  it('좋은 달이 있으면 카드 고르기 탭 둘(내 유형·내 좋은 달)이 나오고 유형이 먼저 골라져 있다', () => {
    const html = renderToStaticMarkup(createElement(SharePanel, { profile: TYPE_PROFILES.candle, regularNo: null, goodMonth: km(2026, 11, true) }));
    expect(html).toContain('role="tablist"');
    expect(html.match(/role="tab"/g)).toHaveLength(2);
    expect(html).toContain('내 유형');
    expect(html).toContain('내 좋은 달');

    expect(html).not.toContain('gm=');
    expect(html).toMatch(/id="rs-card-tab-type"[^>]*aria-selected="true"/);
    expect(html).toMatch(/id="rs-card-tab-month"[^>]*aria-selected="false"/);

    expect(html).toMatch(/id="rs-card-tab-month"[^>]*tabindex="-1"/);
  });

  it('좋은 달이 없으면 탭 없이 유형 카드 하나뿐이다', () => {
    const html = renderToStaticMarkup(createElement(SharePanel, { profile: TYPE_PROFILES.candle, regularNo: null }));
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain('tabpanel');
    expect(html).toContain('/api/card?t=candle');
  });
});
