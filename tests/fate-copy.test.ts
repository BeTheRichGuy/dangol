import { afterEach, describe, expect, it } from 'vitest';
import { flowLines, partnerLines, yearsLines } from '../src/components/result/fate-lines';
import { splitSentences } from '../src/components/result/webtoon-text';
import { FATE } from '../src/content/fate-map';
import { FATE_EN } from '../src/content/en/fate-map';
import { FATE_JA } from '../src/content/ja/fate-map';
import { FATE_KO } from '../src/content/ko/fate-map';
import { setActiveLocaleForTest, type Locale } from '../src/content/locale';
import { PARTNER_TYPES, fateMapOf, type KeyYear, type MonthTone, type YearKind } from '../src/lib/reading/fate-map';
import { computeChart, type BirthInput } from '../src/lib/saju';
import type { Element, GodGroup } from '../src/lib/saju/types';

const TOKYO = { name: 'Tokyo', country: 'JP', lat: 35.6762, lng: 139.6503, tz: 'Asia/Tokyo' };
const NOW = '2026-11-01T03:00:00.000Z';
const input: BirthInput = { date: '2001-02-28', time: '18:00', place: TOKYO, sex: 'female' };
const GODS: GodGroup[] = ['peer', 'output', 'wealth', 'power', 'resource'];
const ELS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
const KINDS: YearKind[] = ['crisis', 'chance', 'shift', 'flow'];
const MONTH_TONES: MonthTone[] = ['clashDay', 'clashMonth', 'harmonyDay', 'harmonyMonth'];

const HANGUL = /[가-힣]/;
const BRACE = /[{}]/;
const BANNED: Record<'en' | 'ja', RegExp> = {
  en: /cosmic|energy|universe|manifest|FYP|destin|soulmate|guarantee|definitely|for sure|inevitabl|fated|meant to be|twin flame|karma|horoscope|zodiac|curse|vibes\b|death|dying|illness|disease|accident|pregnan|divorce|lottery|invest|crypto|\bsalt\b|\bhoney\b|\bcandy\b|—|–/i,
  ja: /エネルギー|宇宙|運命|必ず|絶対|確実|死ぬ|死亡|病気|事故|妊娠|離婚|宝くじ|投資|本音|スピリチュアル|塩|蜂蜜|はちみつ|飴|キャンディ/,
};
const GENDER: Record<'en' | 'ja', RegExp> = {
  en: /\b(he|she|his|her|him|man|men|woman|women|boyfriend|girlfriend|husband|wife|male|female|guy|girl)\b/i,
  ja: /(男性|女性|彼女|彼氏|彼|旦那|奥さん|夫|妻|男の人|女の人|男子|女子)/,
};
const COPY = { en: FATE_EN, ja: FATE_JA } as const;

const keyYear = (kind: YearKind, group: GodGroup, extra: Partial<KeyYear> = {}): KeyYear => ({ year: 2027, age: 26, kind, group, clash: null, harmony: false, shift: kind === 'shift', ...extra });

function everyLine(F: typeof FATE_KO): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string') out.push(v);
    else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x);
  };
  walk(F.stageLabel);
  walk(F.stageAges);
  walk(F.levelWord);
  walk(F.kindTag);
  for (const kind of KINDS)
    for (const group of GODS)
      for (const clash of [null, 'day', 'month'] as const)
        for (const harmony of [true, false]) {
          const y = keyYear(kind, group, { clash, harmony });
          out.push(F.yearTitle(y), F.yearTip(y));
        }
  out.push(F.yearLabel(2026, 2026), F.yearLabel(2027, 2026), F.yearLabel(2031, 2026));
  walk(F.partner.keys);
  for (const g of GODS) out.push(F.partner.vibe(g), F.partner.meet(g));
  for (const e of ELS) out.push(F.partner.temper(e));
  walk(F.partner.types);
  walk(F.partner.typeKeys);
  out.push(F.partner.alt('Sample'));
  const T = F.talk;
  out.push(T.years.lead('Koto'), T.years.lead(''), T.years.more(3), T.years.label(2026, 2026), T.years.label(2027, 2026), T.years.label(2030, 2026));
  out.push(T.flow.lead, T.flow.next, T.flow.more, T.partner.lead, T.partner.more);
  for (const g of GODS) {
    out.push(T.partner.vibe(g));
    for (const lv of ['high', 'mid', 'low'] as const) out.push(T.flow.now(g, lv));
  }
  for (const kind of KINDS) for (const g of GODS) out.push(T.years.says(T.years.label(2027, 2026), F.yearTitle(keyYear(kind, g))), T.years.says(T.years.label(2030, 2026), F.yearTitle(keyYear(kind, g))));

  walk(F.months.tag);
  walk(F.months.tone);
  for (let m = 1; m <= 12; m += 1) {
    out.push(F.months.at(m));
    for (const tone of MONTH_TONES) for (const y of [2026, 2027, 2030]) out.push(T.years.month(T.years.label(y, 2026), m, tone));
  }
  const D = F.drawers;
  out.push(D.lead, D.hiddenSr, D.years.head('Koto'), D.years.head(''), D.years.sub, D.years.more(3));
  out.push(D.flow.head('Koto'), D.flow.head(''), D.flow.sub, D.flow.locked, D.flow.here, D.flow.more);
  out.push(D.partner.head('Koto'), D.partner.head(''), D.partner.sub, D.partner.more);
  const P = F.paid;
  out.push(P.eyebrow, P.intro, P.years.head, P.years.sub, P.years.tipLabel, P.flow.head, P.flow.sub, P.flow.here, P.flow.best(14, 23, 2012, 2021), P.flow.hardest(24, 33, 2022, 2031), P.flow.even, P.partner.head, P.partner.sub);
  return out;
}

function shapeOf(v: unknown, path = ''): string[] {
  if (typeof v === 'function') return [path + '()'];
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => shapeOf(x, path ? `${path}.${k}` : k));
  return [path];
}

afterEach(() => setActiveLocaleForTest('en'));

describe.each(['en', 'ja'] as const)('앞날 지도 문구 %s', (lang) => {
  const F = COPY[lang];
  const lines = everyLine(F);
  const gender = GENDER[lang];

  it('한국어와 같은 모양이다(빠진 문구가 없다)', () => {
    expect(shapeOf(F).sort()).toEqual(shapeOf(FATE_KO).sort());
  });

  it('모든 문구가 비어 있지 않고, 남은 {자리표시자}·한글이 없다', () => {
    expect(lines.length).toBeGreaterThan(300);
    for (const l of lines) {
      expect(l.trim(), 'empty').not.toBe('');
      expect(l, l).not.toMatch(BRACE);
      expect(l, l).not.toMatch(HANGUL);
    }

    expect(JSON.stringify(F.paid)).not.toMatch(HANGUL);
    expect(JSON.stringify(F.drawers)).not.toMatch(HANGUL);
  });

  it('금지 어휘·소금/꿀/사탕 비유·사건 예언·확정 표현이 없다', () => {
    for (const l of lines) expect(l, l).not.toMatch(BANNED[lang]);
  });

  it('성별 낱말은 그림 모습 고르기 단추 두 개에만 있다', () => {
    for (const l of lines) {
      if (l === F.partner.faces.f || l === F.partner.faces.m) continue;
      expect(l, l).not.toMatch(gender);
    }
    expect(F.partner.faces.f).not.toBe(F.partner.faces.m);
  });

  it('얼굴 인상 여덟 가지가 모두 있고 이름이 서로 다르다', () => {
    expect(Object.keys(F.partner.types).sort()).toEqual([...PARTNER_TYPES].sort());
    const names = Object.values(F.partner.types).map((t) => t.name);
    expect(new Set(names).size).toBe(8);
    for (const t of Object.values(F.partner.types)) for (const s of [t.name, t.who, t.look, t.ease, t.care]) expect(s.length).toBeGreaterThanOrEqual(2);
  });

  it('이름이 있을 때와 없을 때의 머리말이 다르다', () => {
    expect(F.drawers.years.head('Koto')).toContain('Koto');
    expect(F.drawers.years.head('  ')).not.toContain('{');
    expect(F.drawers.years.head('  ')).not.toBe(F.drawers.years.head('Koto'));
  });

  it('해 이름표는 올해·내년·그 밖의 해가 서로 다르고 해가 들어간다', () => {
    const a = F.yearLabel(2026, 2026);
    const b = F.yearLabel(2027, 2026);
    const c = F.yearLabel(2030, 2026);
    expect(new Set([a, b, c]).size).toBe(3);
    expect(c).toContain('2030');
    expect(F.talk.years.label(2030, 2026)).toContain('2030');
  });

  it('달 문구: 이름표에 달이 들어가고 말로 하는 문장은 해 이름·달·한 줄이 모두 들어간다', () => {
    setActiveLocaleForTest(lang as Locale);
    expect(F.months.at(6)).toMatch(lang === 'en' ? /^Around June$/ : /^6月ごろ$/);
    expect(F.months.at(6)).not.toBe(F.months.at(7));
    const say = F.talk.years.month(F.talk.years.label(2027, 2026), 6, 'clashDay');
    expect(say).toContain(F.months.tone.clashDay);
    expect(say).toContain(lang === 'en' ? 'Next year' : '来年');
    expect(say).toContain(lang === 'en' ? 'June' : '6月');

    expect(new Set(Object.values(F.months.tone)).size).toBe(6);
    expect(F.months.tag.caution).not.toBe(F.months.tag.good);
  });

  it('달 줄이 들어간 율의 말풍선도 말풍선마다 두 문장 이하다', () => {
    setActiveLocaleForTest(lang as Locale);
    const map = fateMapOf(computeChart(input), NOW);
    expect(map.months!.length).toBeGreaterThan(0);
    const all = yearsLines(map.years, 2026, 2, 'Koto', map.months);
    expect(all.join(' ')).toContain(F.months.tone[map.months![0].tone]);
    for (const l of all) {
      expect(splitSentences(l).length, l).toBeLessThanOrEqual(2);
      expect(l, l).not.toMatch(HANGUL);
      expect(l, l).not.toMatch(BRACE);
    }
  });

  it('시기별 흐름은 다음 장이 열리는 때와 방향을 말하지 않고 안쪽 방으로 넘긴다', () => {
    setActiveLocaleForTest(lang as Locale);
    const chart = computeChart(input);
    const flow = fateMapOf(chart, NOW).flow!;
    const lines = flowLines(flow, chart);
    expect(lines).toContain(F.talk.flow.next);
    expect(lines).toContain(F.talk.flow.more);

    expect(lines.join(' ')).not.toMatch(/\d/);
  });

  it('율의 말풍선은 말풍선마다 두 문장 이하이고, 같은 입력이면 같은 말이다', () => {
    setActiveLocaleForTest(lang as Locale);
    const chart = computeChart(input);
    const map = fateMapOf(chart, NOW);
    expect(map.flow).not.toBeNull();
    const all = [...yearsLines(map.years, 2026, 2, 'Koto'), ...flowLines(map.flow!, chart), ...partnerLines(map.partner)];
    expect(all.length).toBeGreaterThanOrEqual(6);
    for (const l of all) {
      expect(splitSentences(l).length, l).toBeLessThanOrEqual(2);
      expect(l, l).not.toMatch(HANGUL);
      expect(l, l).not.toMatch(BRACE);
    }
    expect(flowLines(map.flow!, chart)).toEqual(flowLines(map.flow!, chart));

    const years = yearsLines(map.years, 2026, 2, 'Koto', map.months).join(' ');
    expect(years).toContain(F.talk.years.more(map.years.length - 2));
  });

  it('언어를 바꾸면 FATE 가 그 언어의 문구를 돌려준다', () => {
    setActiveLocaleForTest(lang as Locale);
    expect(FATE.talk.flow.lead).toBe(F.talk.flow.lead);
    setActiveLocaleForTest('ko');
    expect(FATE.talk.flow.lead).toBe(FATE_KO.talk.flow.lead);
  });
});
