import { afterEach, describe, expect, it } from 'vitest';
import { joinSentences, splitSentences } from '@/components/result/webtoon-text';
import { ENGINE_COPY } from '@/content/engine';
import { LIBRARY as EN_LIBRARY } from '@/content/en/library';
import { TRAITS as EN_TRAITS } from '@/content/en/traits';
import { TYPE_PROFILES as EN_TYPES } from '@/content/en/types';
import { UI as EN_UI } from '@/content/en/ui';
import { LIBRARY } from '@/content/library';
import { dateLocale, LOCALES, overlay, setActiveLocaleForTest, type Locale } from '@/content/locale';
import { TRAITS } from '@/content/traits';
import { TYPE_PROFILES } from '@/content/types';
import { UI } from '@/content/ui';
import { WEBTOON } from '@/content/webtoon';
import { buildReading } from '@/lib/reading';
import { buildTraits } from '@/lib/reading/traits';
import { computeChart } from '@/lib/saju';

afterEach(() => setActiveLocaleForTest('en'));

function shape(v: unknown): unknown {
  if (typeof v === 'string') return 'string';
  if (typeof v === 'function') return 'fn';
  if (Array.isArray(v)) return v.map(shape);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, shape((v as Record<string, unknown>)[k])]));
  }
  return typeof v;
}

function ids(v: unknown, out: string[] = []): string[] {
  if (Array.isArray(v)) v.forEach((x) => ids(x, out));
  else if (v && typeof v === 'object') {
    const r = v as Record<string, unknown>;
    if (typeof r.id === 'string') out.push(r.id);
    else Object.values(r).forEach((x) => ids(x, out));
  }
  return out;
}

function texts(v: unknown, out: Record<string, string> = {}): Record<string, string> {
  if (Array.isArray(v)) v.forEach((x) => texts(x, out));
  else if (v && typeof v === 'object') {
    const r = v as Record<string, unknown>;
    if (typeof r.id === 'string') {
      for (const k of ['text', 'situation', 'action']) if (typeof r[k] === 'string') out[`${r.id}.${k}`] = r[k] as string;
    } else Object.values(r).forEach((x) => texts(x, out));
  }
  return out;
}

function plain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'function' ? 'fn' : x))) as T;
}

const OTHER: Locale[] = LOCALES.filter((l) => l !== 'en');

describe('언어 묶음의 모양', () => {
  it.each(OTHER)('%s: UI 는 영어와 같은 키와 같은 종류의 값', (locale) => {
    setActiveLocaleForTest(locale);
    expect(shape(plain(UI))).toEqual(shape(plain(EN_UI)));
  });

  it.each(OTHER)('%s: 사탕·소금·hit 문장은 id 와 순서가 영어와 같다(같은 사람은 언어를 바꿔도 같은 문장)', (locale) => {
    setActiveLocaleForTest(locale);
    expect(ids(plain(LIBRARY))).toEqual(ids(EN_LIBRARY));
    expect(ids(plain(TRAITS))).toEqual(ids(EN_TRAITS));
  });

  it.each(OTHER)('%s: 문장 풀이 빠짐없이 번역됐다(영어 그대로 남은 문장이 없다)', (locale) => {
    setActiveLocaleForTest(locale);
    const en = { ...texts(EN_LIBRARY), ...texts({ t: EN_TRAITS }) };
    const local = { ...texts(plain(LIBRARY)), ...texts({ t: plain(TRAITS) }) };
    const same = Object.keys(en).filter((k) => local[k] === en[k]);
    expect(same).toEqual([]);
    for (const type of Object.keys(EN_TYPES) as (keyof typeof EN_TYPES)[]) {
      expect(TYPE_PROFILES[type].identity).not.toBe(EN_TYPES[type].identity);
      expect(TYPE_PROFILES[type].hanzi).toBe(EN_TYPES[type].hanzi);
    }
  });

  it('영어는 원본 그대로', () => {
    setActiveLocaleForTest('en');
    expect(UI.home.cta).toBe(EN_UI.home.cta);
    expect(TYPE_PROFILES.pine.name).toBe('Pine');
  });

  it('overlay 는 빠진 칸을 영어로 채운다', () => {
    const base = { a: 'A', b: { c: 'C', d: 'D' }, list: ['x', 'y'] };
    expect(overlay(base, { b: { c: '씨' } })).toEqual({ a: 'A', b: { c: '씨', d: 'D' }, list: ['x', 'y'] });
    expect(overlay(base, undefined)).toEqual(base);
  });
});

describe('같은 입력, 언어만 다른 리딩', () => {
  const input = {
    date: '1998-03-21',
    time: '13:20',
    place: { name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' },
    sex: 'female' as const,
  };
  const now = '2026-10-20T00:00:00.000Z';

  it.each(OTHER)('%s: 사탕·소금 id 와 hit id 가 영어와 같고, 소금의 언제는 그 언어의 절기 이름으로', (locale) => {
    const chart = computeChart(input);
    setActiveLocaleForTest('en');
    const enReading = buildReading(chart, 'everything', now, LIBRARY, { locale: dateLocale() });
    const enTraits = buildTraits(chart, TRAITS);
    setActiveLocaleForTest(locale);
    const reading = buildReading(chart, 'everything', now, LIBRARY, { locale: dateLocale() });
    const traits = buildTraits(chart, TRAITS);
    expect(reading.candy.id).toBe(enReading.candy.id);
    expect(reading.salt.line.id).toBe(enReading.salt.line.id);
    expect(reading.candy.text).not.toBe(enReading.candy.text);
    expect(ids(traits)).toEqual(ids(enTraits));
    expect(reading.salt.line.when).not.toMatch(/[A-Za-z]{3,}/);
    expect(reading.salt.line.when).not.toBe(enReading.salt.line.when);
    expect(ENGINE_COPY.termNames['Start of Winter']).toBeTruthy();
  });

  it('날짜 로캘은 고른 언어를 따른다', () => {
    setActiveLocaleForTest('ko');
    expect(dateLocale()).toBe('ko-KR');
    setActiveLocaleForTest('ja');
    expect(dateLocale()).toBe('ja-JP');
  });
});

describe('한국어·일본어 문장과 말풍선', () => {
  it('한국어는 문장 부호 뒤 한글에서, 일본어는 。！？ 뒤에서 끊고, 문장 가운데 인용에서는 끊지 않는다', () => {
    expect(splitSentences('용케 찾아왔네. 난 율이야. “진짜 괜찮아?” 한마디면 녹을 텐데.')).toEqual([
      '용케 찾아왔네.',
      '난 율이야.',
      '“진짜 괜찮아?” 한마디면 녹을 텐데.',
    ]);
    expect(splitSentences('よく来たね。ユルだよ。「本当に大丈夫？」のひとことで、すぐとけちゃう。')).toEqual([
      'よく来たね。',
      'ユルだよ。',
      '「本当に大丈夫？」のひとことで、すぐとけちゃう。',
    ]);
    expect(splitSentences('もっと知りたい？ 一緒に視てあげる。')).toEqual(['もっと知りたい？', '一緒に視てあげる。']);

    expect(joinSentences(['木の気が多いね。', 'ひとつ終わる前に次を始める。'])).toBe('木の気が多いね。ひとつ終わる前に次を始める。');
    expect(joinSentences(['목 기운이 많네.', '서랍에 하나쯤 있을걸.'])).toBe('목 기운이 많네. 서랍에 하나쯤 있을걸.');
  });

  it.each(OTHER)('%s: 화면 문구와 문장 풀에 em/en 대시가 없고, 사탕·소금 판정은 두 문장 이하', (locale) => {
    setActiveLocaleForTest(locale);
    const all = JSON.stringify([plain(UI), plain(LIBRARY), plain(TRAITS), plain(WEBTOON), plain(TYPE_PROFILES)]);
    expect(all).not.toMatch(/[–—]/);
    const lib = plain(LIBRARY);
    const candy = Object.values(lib.candy).flatMap((byGroup) => Object.values(byGroup).flat());
    const salt = Object.values(lib.salt).flatMap((byGroup) => Object.values(byGroup).flat());
    const tooLong = [
      ...candy.map((c) => [c.id, c.text] as const),
      ...salt.flatMap((s) => [[s.id, s.situation] as const, [s.id, s.action] as const]),
    ].filter(([, text]) => splitSentences(text).length > 2);
    expect(tooLong).toEqual([]);
  });
});
