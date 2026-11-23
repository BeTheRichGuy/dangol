import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setActiveLocaleForTest } from '../src/content/locale';
import { FATE_EN } from '../src/content/en/fate-map';
import { FATE_JA } from '../src/content/ja/fate-map';
import { FATE_KO } from '../src/content/ko/fate-map';
import { flowLines, partnerLines, yearsLines } from '../src/components/result/fate-lines';
import { LAMPS, IMG, LanternRiver, lampStates } from '../src/components/result/lantern-river';
import { LAMPS as BAND_LAMPS, BAND, LoveBand } from '../src/components/result/love-band';
import { MatchElements, MatchTogether } from '../src/components/result/match-cards';
import { LAMPS as WHEEL_LAMPS, WHEEL, YearHeat } from '../src/components/result/year-heat';
import { FreeYearList, MonthCalendar } from '../src/components/result/fate-visuals';
import { splitSentences } from '../src/components/result/webtoon-text';
import { chapterStartDates } from '../src/lib/reading/chapter-dates';
import { monthToneAll, monthYearTone } from '../src/lib/reading/fate-map';
import { FLOW_TURN_GAP, MAX_CRISIS_YEARS, PARTNER_TYPES, TURN_GAP, elementFit, elementPairs, fateMap, fateMapOf, flowTurn, keyMonths, levelOf, loveYears, monthCalendar, monthHeat, monthToneOf, openMonth, partnerType, togetherMonths, veiledMonths, type FlowMap, type FlowPoint, type KeyMonth, type KeyYear, type PartnerTypeKey, type YearKind } from '../src/lib/reading/fate-map';
import { buildRoomPayload, chartBlock, monthLucks } from '../src/lib/rooms/payload';
import { computeChart, type BirthInput } from '../src/lib/saju';
import type { Element, GodGroup } from '../src/lib/saju/types';

beforeAll(() => setActiveLocaleForTest('ko'));
afterAll(() => setActiveLocaleForTest('en'));

const SEOUL = { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' };
const NOW = '2026-10-30T03:00:00.000Z';
const ELEMENTS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
const GODS: GodGroup[] = ['peer', 'output', 'wealth', 'power', 'resource'];
const input = (date: string, time: string | null, sex: BirthInput['sex'] = 'female'): BirthInput => ({ date, time, place: SEOUL, sex });

const FORBIDDEN = /운명의|반드시|틀림없이|무조건|가장 크게|몇 년도|죽|사망|병에|질병|사고|임신|이혼|복권|투자|에너지|우주|남자|여자|남성|여성|속마음/;

function copyOf(): string[] {
  const out: string[] = [];
  const kinds: YearKind[] = ['crisis', 'chance', 'shift', 'flow'];
  for (const kind of kinds) {
    for (const group of GODS) {
      for (const clash of [null, 'day', 'month'] as const) {
        for (const harmony of [true, false]) {
          const y: KeyYear = { year: 2027, age: 30, kind, group, clash, harmony, shift: kind === 'shift' };
          out.push(FATE_KO.yearTitle(y), FATE_KO.yearTip(y));
        }
      }
    }
  }
  for (const g of GODS) out.push(FATE_KO.partner.vibe(g), FATE_KO.partner.meet(g));
  for (const e of ELEMENTS) out.push(FATE_KO.partner.temper(e));
  for (const t of Object.values(FATE_KO.partner.types)) out.push(t.name, t.who, t.look, t.ease, t.care);
  out.push(FATE_KO.partner.typeKeys.ease, FATE_KO.partner.typeKeys.care);
  out.push(...Object.values(FATE_KO.stageLabel), ...Object.values(FATE_KO.levelWord), ...Object.values(FATE_KO.kindTag));
  const walk = (v: unknown) => {
    if (typeof v === 'string') out.push(v);
    else if (typeof v === 'function') return;
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(FATE_KO.drawers);
  walk(FATE_KO.sticky);
  walk(FATE_KO.paid);
  out.push(FATE_KO.drawers.years.head('민지'), FATE_KO.drawers.years.head(''), FATE_KO.drawers.flow.head('민지'), FATE_KO.drawers.partner.head('민지'));
  out.push(FATE_KO.paid.flow.best(14, 23, 2012, 2021), FATE_KO.paid.flow.hardest(24, 33, 2022, 2031));
  out.push(FATE_KO.talk.flow.lead, FATE_KO.talk.flow.next, FATE_KO.talk.flow.more);
  out.push(FATE_KO.talk.years.lead('민지'), FATE_KO.talk.years.lead(''), FATE_KO.talk.years.more(3), FATE_KO.talk.partner.lead, FATE_KO.talk.partner.more);
  for (const kind of kinds) {
    for (const group of GODS) {
      for (const clash of [null, 'day', 'month'] as const) {
        const y: KeyYear = { year: 2027, age: 30, kind, group, clash, harmony: false, shift: kind === 'shift' };
        out.push(FATE_KO.talk.years.says('올해', FATE_KO.yearTitle(y)), FATE_KO.talk.years.says('2029년', FATE_KO.yearTitle(y)));
      }
    }
  }
  for (const g of GODS) {
    out.push(FATE_KO.talk.partner.vibe(g));
    for (const lv of ['high', 'mid', 'low'] as const) out.push(FATE_KO.talk.flow.now(g, lv));
  }
  return out;
}

describe('반가운 오행과의 어울림', () => {
  it('다섯 오행이 서로 다른 값 하나씩을 받는다', () => {
    for (const fav of ELEMENTS) {
      const fits = ELEMENTS.map((e) => elementFit(e, fav)).sort((a, b) => a - b);
      expect(fits).toEqual([-1.5, -0.5, 0, 1, 2]);
      expect(elementFit(fav, fav)).toBe(2);
    }
  });
  it('높낮이 단계', () => {
    expect(levelOf(62)).toBe('high');
    expect(levelOf(61)).toBe('mid');
    expect(levelOf(42)).toBe('low');
    expect(levelOf(43)).toBe('mid');
  });
});

describe('fateMapOf', () => {
  const chart = computeChart(input('1998-03-21', '09:30'));
  const map = fateMapOf(chart, NOW);

  it('올해부터 다섯 해, 해마다 하나씩이고 같은 입력이면 같다', () => {
    expect(map.years.map((y) => y.year)).toEqual([2026, 2027, 2028, 2029, 2030]);
    expect(fateMapOf(chart, NOW)).toEqual(map);
  });

  it('10년의 장마다 점 하나, 네 시기를 나이로 겹쳐 센다', () => {
    const flow = map.flow!;
    expect(flow.points.length).toBe(chart.daYun!.list.length);
    for (const p of flow.points) {
      expect(p.score).toBeGreaterThanOrEqual(8);
      expect(p.score).toBeLessThanOrEqual(94);
      expect(p.endAge - p.startAge).toBe(9);
      expect(p.level).toBe(levelOf(p.score));
    }
    expect(flow.points.filter((p) => p.current)).toHaveLength(1);
    expect(flow.stages.map((s) => s.key)).toEqual(['early', 'youth', 'middle', 'late']);
    expect(flow.stages.filter((s) => s.current)).toHaveLength(1);
    expect(flow.stages.find((s) => s.current)!.key).toBe('youth');
    expect(flow.best.score).toBeGreaterThanOrEqual(flow.hardest.score);
    expect(flow.age).toBe(28);
  });

  it('성별을 몰라 대운이 없으면 흐름은 null, 해마다와 인연 윤곽은 그대로 나온다', () => {
    const noSex = fateMapOf(computeChart(input('1998-03-21', '09:30', null)), NOW);
    expect(noSex.flow).toBeNull();
    expect(noSex.years).toHaveLength(5);
    expect(noSex.years.every((y) => y.kind !== 'shift')).toBe(true);
    expect(noSex.partner).toEqual(map.partner);
  });

  it('결제 뒤 풀이 묶음(life 방)에서 만든 값과 무료 화면의 값이 같다(달 줄은 무료 화면에만 더한다)', () => {
    for (const [date, time] of [['1998-03-21', '09:30'], ['1985-11-02', '22:10'], ['2003-07-15', null], ['1971-01-30', '05:45']] as const) {
      const c = computeChart(input(date, time));
      const p = buildRoomPayload({ room: 'life', locale: 'ko', chart: c, nowIso: NOW });
      const { months, ...free } = fateMapOf(c, NOW);
      expect(months).toBeDefined();
      expect(fateMap(p.self, p.luck, p.years, p.age, 2026)).toEqual(free);
    }
  });

  describe('열어 둔 해의 달', () => {
    const chart = computeChart(input('1998-03-21', '09:30'));

    it('앞 두 해의 눈에 띄는 달이 달 순서로, 한 달에 하나씩 모두 나온다', () => {
      const months = fateMapOf(chart, NOW).months!;
      const years = [...new Set(months.map((m) => m.year))];
      expect(years.every((y) => y === 2026 || y === 2027)).toBe(true);
      for (const y of years) {
        const mine = months.filter((m) => m.year === y);
        const nums = mine.map((m) => m.month);

        expect(nums).toEqual([...nums].sort((a, b) => a - b));
        expect(new Set(nums).size).toBe(nums.length);
        for (const m of mine) {
          expect(m.month).toBeGreaterThanOrEqual(1);
          expect(m.month).toBeLessThanOrEqual(12);
          expect(m.good).toBe(m.tone.startsWith('harmony'));
        }
      }

      expect(months.filter((m) => m.year === 2027).length).toBeGreaterThanOrEqual(2);
    });

    it('열지 않은 달들: 열어 둔 달을 뺀 나머지를 달 순서로 최대 3개(몇 월 무렵만 보이고 내용은 모자이크)', () => {
      const m = (year: number, month: number, good: boolean): KeyMonth => ({ year, month, tone: good ? 'harmonyDay' : 'clashDay', good });
      const list = [m(2027, 2, true), m(2027, 5, false), m(2027, 8, true), m(2027, 10, false), m(2027, 12, true), m(2028, 1, true)];
      const shown = openMonth(list, 2027, 1);
      expect(shown).toEqual(m(2027, 5, false));
      expect(veiledMonths(list, 2027, shown).map((x) => x.month)).toEqual([2, 8, 10]);
      expect(veiledMonths(list, 2027, shown, 10).map((x) => x.month)).toEqual([2, 8, 10, 12]);
      expect(veiledMonths(list, 2027, null).map((x) => x.month)).toEqual([2, 5, 8]);
      expect(veiledMonths(list, 2029, null)).toEqual([]);
    });

    it('열어 둘 달 하나: 올해는 좋은 달, 내년은 조심할 달을 먼저 고르고, 그 갈래가 없으면 있는 달, 달이 없으면 null', () => {
      const m = (year: number, month: number, good: boolean): KeyMonth => ({ year, month, tone: good ? 'harmonyDay' : 'clashDay', good });
      const both = [m(2026, 12, true), m(2027, 9, true), m(2027, 10, false)];
      expect(openMonth(both, 2026, 0)).toEqual(m(2026, 12, true));
      expect(openMonth(both, 2027, 1)).toEqual(m(2027, 10, false));
      expect(openMonth([m(2027, 9, true)], 2027, 1)).toEqual(m(2027, 9, true));
      expect(openMonth([m(2026, 12, false)], 2026, 0)).toEqual(m(2026, 12, false));
      expect(openMonth(both, 2028, 2)).toBeNull();

      const open = fateMapOf(chart, NOW).months!;
      const a = openMonth(open, 2026, 0);
      const b = openMonth(open, 2027, 1);
      if (a && b) expect(a.tone === b.tone && a.good === b.good).toBe(false);
    });

    it('올해는 지금 달부터만 보고, 지난 해는 보지 않으며, 같은 입력이면 같은 결과다', () => {
      const nowMonth = Number(NOW.slice(5, 7));
      expect(keyMonths(chart, NOW, [2026]).every((m) => m.month >= nowMonth)).toBe(true);
      expect(keyMonths(chart, NOW, [2025])).toEqual([]);
      expect(keyMonths(chart, NOW, [2026, 2027])).toEqual(keyMonths(chart, NOW, [2026, 2027]));
    });

    it('고른 달은 그달 간지가 정말 일지·월지와 부딪히거나 어울리는 달이다(그해 지지로 눈에 띄는 달은 그해 지지와, 2026-11-05)', () => {
      for (const m of keyMonths(chart, '2026-01-10T03:00:00.000Z', [2027])) {
        const row = monthLucks(chart, 2027, m.month, 1)[0];
        if (m.tone === 'clashYear' || m.tone === 'harmonyYear') {
          expect(monthYearTone(row), `${m.month}월`).toBe(m.tone);

          expect(monthToneOf(row)).toBeNull();
          continue;
        }
        const seat = m.tone.endsWith('Day') ? 'day' : 'month';
        const kinds = m.good ? ['六合', '半合', '三合'] : ['沖'];
        expect(row.relations.some((r) => kinds.includes(r.kind) && r.at.includes(seat))).toBe(true);
      }
    });

    it('달 문구는 확정 표현·사건 예언·성별 낱말 없이 쉬워로 끝나고, 말풍선은 2문장 이하다', () => {
      const tones = ['clashDay', 'clashMonth', 'harmonyDay', 'harmonyMonth'] as const;
      for (const tone of tones) {
        const line = FATE_KO.talk.years.month('내년', 6, tone);
        expect(line).not.toMatch(FORBIDDEN);
        expect(line).toMatch(/쉬워\.$/);
        expect(FATE_KO.months.tone[tone]).not.toMatch(FORBIDDEN);
        expect(FATE_KO.months.tone[tone]).not.toMatch(/사탕|꿀|소금/);
      }
      expect(FATE_KO.months.at(6)).toBe('6월 무렵');
      const months = fateMapOf(chart, NOW).months!;
      const lines = yearsLines(fateMapOf(chart, NOW).years, 2026, 2, '민지', months);
      expect(lines.join(' ')).toContain('월 무렵엔');
      for (const l of lines) expect(splitSentences(l).length).toBeLessThanOrEqual(2);

      expect(yearsLines(fateMapOf(chart, NOW).years, 2026, 2, '민지')).toEqual(yearsLines(fateMapOf(chart, NOW).years, 2026, 2, '민지', []));
    });

    it('앞으로 5년 목록: 올해·내년은 한 가지만 열리고 나머지 달은 몇 월 무렵만 보이며, 뒤 세 해는 전체가 모자이크다', () => {
      const map = fateMapOf(chart, NOW);
      const html = renderToStaticMarkup(createElement(FreeYearList, { years: map.years, thisYear: 2026, months: map.months!, open: 2 }));
      const rows = html.split('<li ').slice(1);
      expect(rows).toHaveLength(5);
      const text = (row: string) => row.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      for (const [i, row] of rows.slice(0, 2).entries()) {
        const y = map.years[i];
        const shown = openMonth(map.months!, y.year, i);
        const veiled = veiledMonths(map.months!, y.year, shown);

        if (shown) {
          expect(text(row)).toContain(FATE_KO.months.at(shown.month));
          expect(text(row)).toContain(FATE_KO.months.tone[shown.tone]);
        }

        for (const m of veiled) expect(text(row), `${y.year} ${m.month}월`).toContain(FATE_KO.months.at(m.month));
        expect((row.match(/rs-blur/g) ?? []).length).toBe(veiled.length);

        for (const m of veiled) for (const tag of Object.values(FATE_KO.months.tag)) expect(text(row)).not.toContain(`${FATE_KO.months.at(m.month)} ${tag}`);

        const sentences = Object.values(FATE_KO.months.tone).reduce((n, tone) => n + text(row).split(tone).length - 1, 0);
        expect(sentences, `${y.year}년 열린 문구 수`).toBe(shown ? 1 : 0);
      }

      for (const [k, row] of rows.slice(2).entries()) {
        const y = map.years[k + 2];
        expect(row).toContain('data-hidden');
        expect(text(row)).toContain(String(y.year));
        expect(text(row)).toContain(FATE_KO.kindTag[y.kind]);
        expect(text(row)).not.toContain(FATE_KO.yearTitle(y));
        expect(row).toContain('rs-blur');
        expect(row).not.toContain('rs-fate__mo');
        expect(text(row)).not.toMatch(/월 무렵/);
      }
    });
  });

  describe('고비인 해에는 해결법을 안쪽 풀이에서 알려 준다고 강하게 말한다', () => {
    const row = (year: number, kind: 'crisis' | 'chance' | 'shift' | 'flow') => ({ year, age: year - 1990, kind, group: 'peer' as const, clash: null, harmony: false, shift: false });
    const withCrisis = [row(2026, 'chance'), row(2027, 'flow'), row(2028, 'crisis'), row(2029, 'chance'), row(2030, 'crisis')];
    const noCrisis = [row(2026, 'chance'), row(2027, 'flow'), row(2028, 'shift'), row(2029, 'chance'), row(2030, 'flow')];

    it('해 줄마다: 고비인 해에만 해결법 한 줄이 붙는다(올해·내년이든 뒤 세 해든)', () => {
      const html = renderToStaticMarkup(createElement(FreeYearList, { years: withCrisis, thisYear: 2026, months: [], open: 2 }));
      expect((html.match(/rs-fate__fix/g) ?? []).length).toBe(2);
      for (const li of html.split('<li ').slice(1)) {
        const crisis = li.includes('data-kind="crisis"');
        expect(li.includes(FATE_KO.drawers.years.fix), li.slice(0, 40)).toBe(crisis);
      }

      expect(renderToStaticMarkup(createElement(FreeYearList, { years: noCrisis, thisYear: 2026, months: [], open: 2 }))).not.toContain('rs-fate__fix');
    });

    it('율 말풍선: 고비인 해가 있을 때만 해결법 말풍선이 하나 들어가고, 말풍선은 2문장 이하다', () => {
      const lines = yearsLines(withCrisis, 2026, 2, '미나');
      expect(lines.filter((l) => l.includes(FATE_KO.talk.years.fix))).toHaveLength(1);
      for (const l of lines) expect(splitSentences(l).length).toBeLessThanOrEqual(2);
      expect(yearsLines(noCrisis, 2026, 2, '미나').join(' ')).not.toContain(FATE_KO.talk.years.fix);
    });

    it('세 언어 모두 문구가 따로 있고, 영어·일본어에는 한글이 없으며 금지 낱말이 없다', () => {
      const all = [FATE_KO, FATE_EN, FATE_JA].map((F) => [F.talk.years.fix, F.drawers.years.fix]);
      for (const [talk, drawer] of all) {
        expect(talk.length).toBeGreaterThan(10);
        expect(drawer.length).toBeGreaterThan(10);
      }
      expect(new Set(all.flat()).size).toBe(6);
      for (const F of [FATE_EN, FATE_JA]) expect(`${F.talk.years.fix}${F.drawers.years.fix}`).not.toMatch(/[가-힣]/);
      for (const text of all.flat()) expect(text).not.toMatch(FORBIDDEN);

      expect(FATE_KO.talk.years.fix).toContain('해결법');
      expect(FATE_KO.drawers.years.fix).toContain('해결법');
    });
  });

  it('인연 윤곽은 일지·월지에서 나오고 다섯 갈래·다섯 오행 안에 있다', () => {
    expect(GODS).toContain(map.partner.vibe);
    expect(GODS).toContain(map.partner.meet);
    expect(ELEMENTS).toContain(map.partner.temper);
  });
});

describe('여러 사주에 걸쳐', () => {
  it('고비·기회·전환·변화가 모두 나오고, 어느 한쪽으로 쏠리지 않는다', () => {
    const count: Record<YearKind, number> = { crisis: 0, chance: 0, shift: 0, flow: 0 };
    let highs = 0;
    let lows = 0;
    let n = 0;
    for (let d = 0; d < 300; d += 1) {
      const date = new Date(Date.UTC(1965, 0, 1) + d * 43 * 86400_000).toISOString().slice(0, 10);
      for (const time of ['03:10', '13:40']) {
        const map = fateMapOf(computeChart(input(date, time, d % 2 ? 'male' : 'female')), NOW);
        n += 1;
        for (const y of map.years) count[y.kind] += 1;
        for (const p of map.flow?.points ?? []) {
          if (p.level === 'high') highs += 1;
          if (p.level === 'low') lows += 1;
        }

        expect(map.years.filter((y) => y.kind === 'crisis').length).toBeLessThanOrEqual(MAX_CRISIS_YEARS);
      }
    }
    const total = n * 5;
    for (const k of ['crisis', 'chance', 'shift', 'flow'] as const) expect(count[k], k).toBeGreaterThan(total * 0.04);
    expect(count.crisis).toBeLessThan(total * 0.6);
    expect(highs).toBeGreaterThan(200);
    expect(lows).toBeGreaterThan(200);
  });
});

describe('한국어 문구', () => {
  it('모든 문구가 비어 있지 않고 금지어·확정 표현이 없다', () => {
    const all = copyOf();
    expect(all.length).toBeGreaterThan(100);
    for (const text of all) {
      expect(text.trim().length).toBeGreaterThan(0);
      expect(text).not.toMatch(FORBIDDEN);
    }
  });

  it('해마다 제목은 일지·월지와 부딪히는 해를 가까운 자리·일터로 말한다', () => {
    const y: KeyYear = { year: 2028, age: 30, kind: 'crisis', group: 'wealth', clash: 'day', harmony: false, shift: false };
    expect(FATE_KO.yearTitle(y)).toContain('가까운 자리');
    expect(FATE_KO.yearTitle({ ...y, clash: 'month' })).toContain('일터');
    expect(FATE_KO.yearTitle({ ...y, clash: null, kind: 'shift' })).toContain('10년의 큰 흐름');
  });

  it('이름이 없어도 제목이 어색하지 않다', () => {
    expect(FATE_KO.drawers.years.head('')).toBe('내게 찾아올 고비와 기회');
    expect(FATE_KO.drawers.years.head('  ')).toBe('내게 찾아올 고비와 기회');
    expect(FATE_KO.drawers.years.head('민지')).toBe('민지님에게 찾아올 고비와 기회');
  });
});

describe('인연 유형(8유형)', () => {

  function oneChartPerDayPillar() {
    const seen = new Map<string, ReturnType<typeof computeChart>>();
    for (let d = 0; d < 80 && seen.size < 60; d += 1) {
      const date = new Date(Date.UTC(2000, 0, 1) + d * 86400_000).toISOString().slice(0, 10);
      const chart = computeChart(input(date, '12:00'));
      seen.set(chart.pillars.day.ganzhi, chart);
    }
    return [...seen.values()];
  }

  it('60개 일주가 여덟 유형에 정해진 몫으로 나뉜다(돌봄·책임·재주는 밝은·조용한 결 6개씩, 친구·살림꾼은 12개씩)', () => {
    const charts = oneChartPerDayPillar();
    expect(charts).toHaveLength(60);
    const count = Object.fromEntries(PARTNER_TYPES.map((k) => [k, 0])) as Record<PartnerTypeKey, number>;
    for (const c of charts) count[partnerType(chartBlock(c))] += 1;
    expect(count).toEqual({
      'resource-bright': 6, 'resource-quiet': 6, 'power-bright': 6, 'power-quiet': 6, 'output-bright': 6, 'output-quiet': 6, peer: 12, wealth: 12,
    });
  });

  it('같은 사주면 같은 유형이고, 시간·성별·올해와 무관하다', () => {
    const a = partnerType(chartBlock(computeChart(input('1998-03-21', '09:30', 'male'))));
    expect(partnerType(chartBlock(computeChart(input('1998-03-21', null, 'female'))))).toBe(a);
    expect(PARTNER_TYPES).toContain(a);
  });

  it('여덟 유형마다 이름과 설명이 있고, 그림은 두 모습(원본·흐림판) 모두 있다', () => {
    expect(Object.keys(FATE_KO.partner.types).sort()).toEqual([...PARTNER_TYPES].sort());
    const names = Object.values(FATE_KO.partner.types).map((t) => t.name);
    expect(new Set(names).size).toBe(PARTNER_TYPES.length);
    for (const key of PARTNER_TYPES) {
      for (const face of ['f', 'm']) {
        for (const blur of ['', '-blur']) {
          expect(existsSync(join(process.cwd(), 'public/media/partner', `${key}-${face}${blur}-v1.jpg`)), `${key}-${face}${blur}`).toBe(true);
        }
      }
    }
  });

  it('유형은 결제 뒤 묶음의 값과 무료 화면의 값에서 같다', () => {
    const chart = computeChart(input('1998-03-21', '09:30', 'female'));
    const free = fateMapOf(chart, NOW);
    expect(free.partnerKind).toBe(partnerType(chartBlock(chart)));
  });
});

describe('율의 말풍선(서랍 앞)', () => {
  const chart = computeChart(input('1998-03-21', '09:30', 'female'));
  const flow = fateMapOf(chart, NOW).flow!;

  it('지금의 장과 다음 장, 다음 장이 열리는 연·월을 말한다', () => {
    const turn = flowTurn(flow, chapterStartDates(chart))!;
    const i = flow.points.findIndex((p) => p.current);
    expect(turn.now).toBe(flow.points[i]);
    expect(turn.next).toBe(flow.points[i + 1]);

    expect(turn.start!.year).toBe(turn.next!.startYear);
    expect(turn.start!.month).toBeGreaterThanOrEqual(1);
    expect(turn.start!.month).toBeLessThanOrEqual(12);
    const gap = turn.next!.score - turn.now.score;
    expect(turn.dir).toBe(gap >= FLOW_TURN_GAP ? 'up' : gap <= -FLOW_TURN_GAP ? 'down' : 'same');
  });

  it('시작일을 못 구하면 연도만 말한다', () => {
    const turn = flowTurn(flow, null)!;
    expect(turn.start).toEqual({ year: turn.next!.startYear, month: null });
  });

  it('마지막 장이면 다음이 없고, 지금의 장이 없으면(첫 대운 전) 말하지 않는다', () => {
    const last = { ...flow, points: flow.points.map((p, i) => ({ ...p, current: i === flow.points.length - 1 })) };
    const tail = flowTurn(last, null)!;
    expect(tail.next).toBeNull();
    expect(tail.start).toBeNull();
    expect(tail.dir).toBe('same');
    const before = { ...flow, points: flow.points.map((p) => ({ ...p, current: false })) };
    expect(flowTurn(before, null)).toBeNull();
    expect(flowLines(before, chart)).toEqual([]);
  });

  it('높낮이 차이가 크면 올라가는·내려가는 쪽, 작으면 같은 쪽으로 말한다', () => {
    const pts = (a: number, b: number) => ({
      ...flow,
      points: [
        { ...flow.points[0], score: a, current: true },
        { ...flow.points[1], score: b, current: false },
      ],
    });
    expect(flowTurn(pts(50, 50 + FLOW_TURN_GAP), null)!.dir).toBe('up');
    expect(flowTurn(pts(50, 50 - FLOW_TURN_GAP), null)!.dir).toBe('down');
    expect(flowTurn(pts(50, 50 + FLOW_TURN_GAP - 1), null)!.dir).toBe('same');
  });

  it('율의 말은 인사 · 지금 · 다음 장 예고 · 이어 말함 순서이고, 다음 장이 열리는 때는 말하지 않으며, 말풍선마다 2문장 이하다', () => {
    const lines = flowLines(flow, chart);
    expect(lines.length).toBeGreaterThanOrEqual(4);
    expect(lines[0]).toBe(FATE_KO.talk.flow.lead);
    expect(lines.at(-1)).toBe(FATE_KO.talk.flow.more);
    expect(lines.some((l) => l.startsWith('지금은'))).toBe(true);

    expect(lines[2]).toBe(FATE_KO.talk.flow.next);
    expect(lines.some((l) => /\d{4}년/.test(l))).toBe(false);
    for (const l of lines) expect(splitSentences(l).length).toBeLessThanOrEqual(2);
    expect(flowLines(flow, chart)).toEqual(lines);
  });

  it('여러 사주에서도 말이 비지 않고, 가장 반가운 때·힘을 아낄 때의 나이는 말하지 않는다(그건 안쪽 방)', () => {
    for (const date of ['1984-02-11', '1991-07-30', '2001-12-05', '1973-09-14']) {
      const c = computeChart(input(date, '12:00', 'male'));
      const f = fateMapOf(c, NOW).flow!;
      const lines = flowLines(f, c);
      expect(lines.length).toBeGreaterThanOrEqual(3);
      for (const l of lines) {
        expect(l).not.toMatch(FORBIDDEN);
        expect(l).not.toMatch(/사탕|꿀|소금/);
      }
      const spoken = lines.join(' ');

      expect(spoken).not.toMatch(/\d+~\d+살/);
      expect(spoken).not.toContain('장은');
    }
  });

  it('올해와 내년 말풍선은 해마다 한 가지씩만 말하고 남은 일은 안쪽 방에서 알려 준다는 말로 끝난다', () => {
    const map = fateMapOf(chart, NOW);
    const years = map.years;

    const plain = yearsLines(years, 2026, 2, '미나');
    expect(plain[0]).toContain('미나');
    expect(plain.join(' ')).toContain('올해는');
    expect(plain.join(' ')).toContain('내년은');

    const lines = yearsLines(years, 2026, 2, '미나', map.months);
    const spoken = lines.join(' ');
    for (const [i, y] of [2026, 2027].entries()) {
      const mine = map.months!.filter((m) => m.year === y);
      const shown = openMonth(map.months!, y, i);
      const label = y === 2026 ? '올해' : '내년';
      const said = [...spoken.matchAll(new RegExp(`${label} (\\d+)월 무렵엔`, 'g'))];
      expect(said.length, label).toBe(shown ? 1 : 0);
      if (shown) expect(Number(said[0][1])).toBe(shown.month);
      for (const hidden of mine.filter((m) => m !== shown)) expect(spoken, `${label} ${hidden.month}월`).not.toContain(FATE_KO.talk.years.month(label, hidden.month, hidden.tone));
    }

    const openTitles = new Set(years.slice(0, 2).map((y) => FATE_KO.yearTitle(y)));
    for (const y of years.slice(2)) {
      const title = FATE_KO.yearTitle(y);
      if (!openTitles.has(title)) expect(spoken).not.toContain(title.replace(/\([^)]*\)/g, ''));
      expect(spoken).not.toContain(`${y.year}년`);
    }
    expect(lines.at(-1)).toBe(FATE_KO.talk.years.more(years.length - 2));
    expect(spoken).not.toMatch(/\(|\)/);
    for (const l of lines) expect(splitSentences(l).length).toBeLessThanOrEqual(2);
    expect(yearsLines([], 2026, 2, '미나')).toEqual([]);
  });

  it('해마다 제목은 모두 한 해로 끝나서 말풍선에 "~한 해야"로 이어진다', () => {
    for (const kind of ['crisis', 'chance', 'shift', 'flow'] as YearKind[]) {
      for (const group of GODS) {
        for (const clash of [null, 'day', 'month'] as const) {
          for (const harmony of [true, false]) {
            const title = FATE_KO.yearTitle({ year: 2027, age: 30, kind, group, clash, harmony, shift: kind === 'shift' });
            expect(title.endsWith('해'), title).toBe(true);
          }
        }
      }
    }
  });

  it('인연 말풍선은 곁에 있을 때의 분위기만 말하고 닿는 자리·기질은 안쪽 방에 남긴다', () => {
    const partner = fateMapOf(chart, NOW).partner;
    const lines = partnerLines(partner);
    const spoken = lines.join(' ');
    expect(spoken).toContain(FATE_KO.partner.vibe(partner.vibe));
    expect(spoken).not.toContain(FATE_KO.partner.meet(partner.meet));
    expect(spoken).not.toContain(FATE_KO.partner.temper(partner.temper));
    expect(lines.at(-1)).toBe(FATE_KO.talk.partner.more);
    for (const l of lines) {
      expect(splitSentences(l).length).toBeLessThanOrEqual(2);
      expect(l).not.toMatch(FORBIDDEN);
    }
  });
});

describe('결제 뒤 카드 자리(rooms/fate-cards.tsx)', async () => {
  const { FATE_CARDS, FATE_PLACE, fateAfter, hasFateInline } = await import('../src/components/rooms/fate-cards');
  const { ROOMS_COPY: ROOMS_EN } = await import('../src/content/en/rooms');
  it('율 방은 12절 흐름 안의 6·7·8절 끝에 카드가 하나씩 앉고(마지막 한마디 12절은 그대로 끝)', () => {
    expect(fateAfter('life', 6)).toEqual(['years']);
    expect(fateAfter('life', 7)).toEqual(['flow']);
    expect(fateAfter('life', 8)).toEqual(['partner']);

    expect(fateAfter('life', 11)).toEqual(['country']);
    for (const n of [1, 2, 3, 4, 5, 9, 10, 12]) expect(fateAfter('life', n), `${n}절`).toEqual([]);
    expect(hasFateInline('life')).toBe(true);
  });
  it('만신 10년은 1절 끝에 시기별 흐름, 4절 끝에 앞으로 5년이 앉고, 연은 2절 끝에 곁에 닿을 인연이 앉는다', () => {
    expect(fateAfter('decades', 1)).toEqual(['flow']);
    expect(fateAfter('decades', 4)).toEqual(['years']);

    expect(fateAfter('decades', 6)).toEqual(['lantern']);
    for (const n of [2, 3, 5, 7]) expect(fateAfter('decades', n), `10년 ${n}절`).toEqual([]);
    for (const room of ['life', 'love', 'match', 'year'] as const) for (let n = 1; n <= 12; n += 1) expect(fateAfter(room, n), `${room} ${n}절`).not.toContain('lantern');
    expect(fateAfter('love', 2)).toEqual(['partner']);

    expect(fateAfter('love', 5)).toEqual(['band']);
    expect(fateAfter('love', 6)).toEqual(['calendar']);
    for (const n of [1, 3, 4, 7, 8]) expect(fateAfter('love', n), `연 ${n}절`).toEqual([]);

    expect(fateAfter('year', 5)).toEqual(['heat']);
    for (const n of [1, 2, 3, 4, 6]) expect(fateAfter('year', n), `2027 ${n}절`).toEqual([]);

    expect(fateAfter('match', 1)).toEqual(['pairType']);
    expect(fateAfter('match', 2)).toEqual(['pairLines']);
    expect(fateAfter('match', 4)).toEqual(['elements']);
    expect(fateAfter('match', 5)).toEqual(['pairYears']);
    expect(fateAfter('match', 7)).toEqual(['together', 'country']);
    for (const n of [3, 6, 8]) expect(fateAfter('match', n), `궁합 ${n}절`).toEqual([]);
    for (const room of ['life', 'decades', 'love'] as const) for (let n = 1; n <= 12; n += 1) for (const part of ['heat', 'elements', 'together'] as const) expect(fateAfter(room, n), `${room} ${n}절`).not.toContain(part);
    for (const room of ['life', 'decades', 'match', 'year'] as const) for (let n = 1; n <= 12; n += 1) expect(fateAfter(room, n), `${room} ${n}절`).not.toContain('calendar');
    expect(hasFateInline('decades')).toBe(true);
    expect(hasFateInline('love')).toBe(true);

    for (const room of ['match', 'year'] as const) expect(hasFateInline(room), room).toBe(true);
  });
  it('방이 여는 카드는 모두 자리가 있고, 열지 않는 카드에는 자리가 없으며, 자리는 마지막 절(마지막 말)이 아니다', () => {
    for (const room of ['life', 'decades', 'love', 'match', 'year'] as const) {
      const sections = ROOMS_EN.rooms[room].contents.length;
      for (const part of ['years', 'flow', 'partner', 'calendar', 'lantern', 'heat', 'band', 'elements', 'together', 'pairType', 'pairLines', 'pairYears', 'country'] as const) {
        const n = FATE_PLACE[room][part];
        expect(n !== undefined, `${room}.${part}`).toBe(FATE_CARDS[room][part]);
        if (n !== undefined) {
          expect(n, `${room}.${part}`).toBeGreaterThanOrEqual(1);
          expect(n, `${room}.${part}`).toBeLessThan(sections);
        }
      }
    }
  });
  it('사라진 안내 문구 세 개는 내용 파일에 없다', () => {
    const all = JSON.stringify(FATE_KO.paid) + JSON.stringify(FATE_KO.partner);
    expect(all).not.toContain('간단한 셈');
    expect(all).not.toContain('실제 인물이 아니라');
    expect(all).not.toContain('만날 사람을 정하는 게 아니라');
  });
});

describe('연 방의 열두 달 달력', () => {
  const chart = computeChart(input('1998-03-21', '09:30', 'female'));
  const payload = buildRoomPayload({ room: 'love', locale: 'ko', chart, nowIso: NOW });
  const cal = monthCalendar(payload.months);

  it('이번 달부터 열두 달이 달 순서 그대로 한 칸씩이고, 같은 입력이면 같은 결과다', () => {
    expect(cal).toHaveLength(12);
    expect(cal[0]).toMatchObject({ year: 2026, month: 10 });
    expect(cal[11]).toMatchObject({ year: 2027, month: 9 });
    for (let i = 1; i < cal.length; i += 1) {
      const prev = cal[i - 1];
      expect(cal[i].year * 12 + cal[i].month, `${i}번째`).toBe(prev.year * 12 + prev.month + 1);
    }
    expect(monthCalendar(payload.months)).toEqual(cal);
    expect(monthCalendar([])).toEqual([]);
  });

  it('갈래는 어울림·부딪힘 규칙에서 나오고(둘 다 아니면 고른 달), 무료 화면의 달(keyMonths)과 어긋나지 않는다', () => {
    for (const c of cal) {
      expect(c.kind, `${c.year}-${c.month}`).toBe(c.tone === null ? 'even' : c.tone.startsWith('harmony') ? 'good' : 'caution');
    }
    const key = keyMonths(chart, NOW, [2026, 2027]);
    for (const k of key) {
      const same = cal.find((c) => c.year === k.year && c.month === k.month);
      if (!same) continue;
      expect(same.tone, `${k.year}-${k.month}`).toBe(k.tone);
    }

    for (const c of cal) if (c.kind === 'even') expect(key.some((k) => k.year === c.year && k.month === c.month)).toBe(false);

    expect(new Set(cal.map((c) => c.kind)).size).toBeGreaterThanOrEqual(2);
  });

  it('화면: 열두 칸이 단추이고, 처음에는 가장 이른 좋은 달이 골라져 있으며, 해는 첫 칸과 1월에만 적힌다', () => {
    const html = renderToStaticMarkup(createElement(MonthCalendar, { cal }));
    expect((html.match(/<button/g) ?? []).length).toBe(12);
    const firstGood = cal.findIndex((c) => c.kind === 'good');
    const pressed = [...html.matchAll(/aria-pressed="(true|false)"/g)].map((m) => m[1] === 'true');
    expect(pressed.filter(Boolean)).toHaveLength(1);
    expect(pressed.indexOf(true)).toBe(firstGood >= 0 ? firstGood : 0);

    const years = [...html.matchAll(/rs-cal__yr" aria-hidden="true">([^<]*)</g)].map((m) => m[1]);
    expect(years).toHaveLength(12);
    expect(years.filter(Boolean)).toEqual(['2026', '2027']);

    for (const kind of ['good', 'caution', 'even'] as const) if (cal.some((c) => c.kind === kind)) expect(html).toContain(`data-kind="${kind}"`);
    expect((html.match(/rs-cal__glyph/g) ?? []).length).toBe(12);
    expect(html).toContain(FATE_KO.paid.calendar.label(2026, 10));

    const cur = cal[firstGood >= 0 ? firstGood : 0];
    expect(html).toContain(FATE_KO.paid.calendar.detail[cur.tone ?? 'even']);
  });

  it('단추 이름은 연·월과 갈래를 읽어 주고, 점수 숫자는 없다', () => {
    const html = renderToStaticMarkup(createElement(MonthCalendar, { cal }));
    expect(html).toContain('aria-label="2026년 10월, ');
    expect(html).not.toMatch(/\d+점|%/);
  });

  it('세 언어 문구: 갈래 이름표 셋과 문구 다섯이 따로 있고 영어·일본어에는 한글이 없으며, 한국어는 금지 낱말과 비유가 없다', () => {
    const tones = ['clashDay', 'clashMonth', 'harmonyDay', 'harmonyMonth', 'even'] as const;
    for (const F of [FATE_KO, FATE_EN, FATE_JA]) {
      const C = F.paid.calendar;
      for (const k of ['good', 'caution', 'even'] as const) expect(C.tag[k].length).toBeGreaterThan(1);
      for (const t of tones) expect(C.detail[t].length).toBeGreaterThan(15);
      expect(new Set(tones.map((t) => C.detail[t])).size).toBe(5);
      expect(C.head.length).toBeGreaterThan(5);
      expect(C.sub.length).toBeGreaterThan(20);
    }
    for (const F of [FATE_EN, FATE_JA]) expect(JSON.stringify(F.paid.calendar)).not.toMatch(/[가-힣]/);
    const ko = JSON.stringify(FATE_KO.paid.calendar);
    expect(ko).not.toMatch(FORBIDDEN);
    expect(ko).not.toMatch(/사탕|꿀|소금/);

    for (const t of ['clashDay', 'clashMonth', 'harmonyDay', 'harmonyMonth'] as const) expect(FATE_KO.paid.calendar.detail[t]).toMatch(/쉬운 달이에요/);
    expect(ko).not.toMatch(/미루|그때까지|그 달까지/);

    expect(FATE_KO.paid.calendar.short(6)).toBe('6월');
    expect(FATE_JA.paid.calendar.short(6)).toBe('6月');
    expect(FATE_EN.paid.calendar.short(6)).toBe('Jun');
    expect(FATE_EN.paid.calendar.label(2027, 6)).toBe('June 2027');
    expect(FATE_KO.paid.calendar.label(2027, 6)).toBe('2027년 6월');
    expect(FATE_JA.paid.calendar.label(2027, 6)).toBe('2027年6月');
  });
});

describe('만신 10년 방의 밤 강 여덟 등불', () => {
  const pt = (number: number, level: 'high' | 'mid' | 'low', current = false): FlowPoint => ({
    number, startAge: number * 10 - 5, endAge: number * 10 + 4, startYear: 1990 + number * 10 - 5, endYear: 1990 + number * 10 + 4, startMonth: null, score: 50, level, group: 'peer', current,
  });
  const levels = ['high', 'mid', 'low', 'high', 'mid', 'low', 'high', 'mid'] as const;
  const flowAt = (nowNo: number | null): FlowMap => {
    const points = levels.map((l, i) => pt(i + 1, l, i + 1 === nowNo));
    return { points, stages: [], best: points[0], hardest: points[2], age: 28 };
  };

  it('등불 자리는 여덟 개이고 모두 그림 안에 있으며, 가까운 것(아래)에서 먼 것(위)으로 이어진다', () => {
    expect(LAMPS).toHaveLength(8);
    for (const l of LAMPS) {
      expect(l.x - l.r / 2).toBeGreaterThanOrEqual(0);
      expect(l.x + l.r / 2).toBeLessThanOrEqual(IMG.w);
      expect(l.y).toBeGreaterThan(0);
      expect(l.y).toBeLessThan(IMG.h);
    }

    for (let i = 1; i < LAMPS.length; i += 1) {
      expect(LAMPS[i].y, `${i + 1}번째`).toBeLessThan(LAMPS[i - 1].y);
      expect(LAMPS[i].r, `${i + 1}번째`).toBeLessThanOrEqual(LAMPS[i - 1].r);
    }

    expect(existsSync(join(__dirname, '../public/media/fate/night-river-v1.jpg'))).toBe(true);
  });

  it('등불 상태: 지금 장 앞은 지나온 장, 지금 장은 하나, 뒤는 앞으로 올 장(지금 장이 없으면 모두 앞으로 올 장)', () => {
    expect(lampStates(flowAt(3).points)).toEqual(['past', 'past', 'now', 'next', 'next', 'next', 'next', 'next']);
    expect(lampStates(flowAt(1).points)).toEqual(['now', 'next', 'next', 'next', 'next', 'next', 'next', 'next']);
    expect(lampStates(flowAt(8).points)).toEqual(['past', 'past', 'past', 'past', 'past', 'past', 'past', 'now']);
    expect(lampStates(flowAt(null).points)).toEqual(Array(8).fill('next'));
  });

  it('화면: 장 칩 여덟이 단추이고 지금 장이 골라져 있으며, 등불 여덟이 있고 지금 장에만 지금 여기 표시가 있다', () => {
    const html = renderToStaticMarkup(createElement(LanternRiver, { flow: flowAt(3) }));
    expect((html.match(/rs-lr__chip"/g) ?? []).length).toBe(8);
    expect((html.match(/class="rs-lr__lamp"/g) ?? []).length).toBe(8);
    expect(html).toContain('night-river-v1');
    const pressed = [...html.matchAll(/aria-pressed="(true|false)"/g)].map((m) => m[1] === 'true');
    expect(pressed.indexOf(true)).toBe(2);
    expect(pressed.filter(Boolean)).toHaveLength(1);
    expect((html.match(/rs-lr__here/g) ?? []).length).toBe(1);
    expect(html).toContain(FATE_KO.drawers.flow.here);

    expect((html.match(/aria-hidden="true" class="rs-lr__lamp"|class="rs-lr__lamp"[^>]*aria-hidden="true"/g) ?? []).length).toBe(8);

    expect(html).toContain(FATE_KO.paid.lantern.title(3, 25, 34));
    expect(html).toContain(FATE_KO.paid.lantern.tag.now);

    expect(html).not.toMatch(/\d+점|score/);
  });

  it('칩 이름은 장 번호·나이와 상태를 읽어 준다(지나온 장·지금 장·반가운 정도)', () => {
    const html = renderToStaticMarkup(createElement(LanternRiver, { flow: flowAt(3) }));
    expect(html).toContain(`aria-label="${FATE_KO.paid.lantern.title(1, 5, 14)}, ${FATE_KO.paid.lantern.tag.past}"`);
    expect(html).toContain(`aria-label="${FATE_KO.paid.lantern.title(3, 25, 34)}, ${FATE_KO.paid.lantern.tag.now}"`);
    expect(html).toContain(`aria-label="${FATE_KO.paid.lantern.title(4, 35, 44)}, ${FATE_KO.levelWord.high}"`);
  });

  it('세 언어 문구: 따로 쓰였고, 영어·일본어에는 한글이 없으며, 한국어는 금지 낱말·비유가 없고 겁주지 않는다', () => {
    const states = ['past', 'now', 'next'] as const;
    const lvls = ['high', 'mid', 'low'] as const;
    const groups = ['peer', 'output', 'wealth', 'power', 'resource'] as const;
    for (const F of [FATE_KO, FATE_EN, FATE_JA]) {
      const L = F.paid.lantern;
      expect(L.head.length).toBeGreaterThan(5);
      expect(L.sub.length).toBeGreaterThan(30);
      expect(L.title(2, 15, 24)).toMatch(/2/);
      expect(L.title(2, 15, 24)).toMatch(/15/);
      expect(L.title(2, 15, 24)).toMatch(/24/);
      expect(L.years(2019, 2028)).toMatch(/2019/);
      for (const g of groups) for (const lv of lvls) for (const st of states) {
        const line = L.line(g, lv, st);
        expect(line.length, `${g} ${lv} ${st}`).toBeGreaterThan(15);
        expect(line, line).not.toMatch(/\{\w+\}/);
      }
    }
    for (const F of [FATE_EN, FATE_JA]) {
      const L = F.paid.lantern;
      expect(JSON.stringify([L.head, L.sub, L.tag, L.title(1, 1, 1), L.ages(1, 1), ...groups.flatMap((g) => lvls.flatMap((lv) => states.map((st) => L.line(g, lv, st))))])).not.toMatch(/[가-힣]/);
    }
    const ko = JSON.stringify([FATE_KO.paid.lantern.head, FATE_KO.paid.lantern.sub, FATE_KO.paid.lantern.tag, ...groups.flatMap((g) => lvls.flatMap((lv) => states.map((st) => FATE_KO.paid.lantern.line(g, lv, st))))]);
    expect(ko).not.toMatch(FORBIDDEN);
    expect(ko).not.toMatch(/사탕|꿀|소금/);

    expect(FATE_KO.paid.lantern.line('power', 'low', 'next')).toMatch(/천천히/);

    expect(FATE_KO.paid.lantern.ages(25, 34)).toBe('25~34살');
    expect(FATE_JA.paid.lantern.ages(25, 34)).toBe('25〜34歳');
    expect(FATE_EN.paid.lantern.title(3, 25, 34)).toBe('Chapter 3 · ages 25 to 34');
  });
});

describe('2027 방의 열두 등불 달 온도·연 방의 일곱 해 띠·해와 달 방의 오행과 같이 맞는 달', () => {
  const chartA = computeChart(input('1998-03-21', '09:30', 'female'));
  const chartB = computeChart(input('1995-06-02', '14:00', 'male'));
  const yearP = buildRoomPayload({ room: 'year', locale: 'ko', chart: chartA, nowIso: NOW });
  const loveP = buildRoomPayload({ room: 'love', locale: 'ko', chart: chartA, nowIso: NOW });
  const matchP = buildRoomPayload({ room: 'match', locale: 'ko', chart: chartA, nowIso: NOW, partner: { chart: chartB, kind: 'lover' } });
  const fav = fateMap(yearP.self, yearP.luck, yearP.years, yearP.age, 2026).favorable;
  const heat = monthHeat(yearP.months, fav);

  it('달 온도: 앞 열두 달(2027년 1~12월)이 달 순서 그대로이고, 환한·따뜻한·잔잔한·낮은 달이 세 개씩이며, 같은 입력이면 같은 결과다', () => {
    expect(yearP.months).toHaveLength(13);
    expect(heat).toHaveLength(12);
    expect(heat.map((h) => h.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(new Set(heat.map((h) => h.year))).toEqual(new Set([2027]));
    for (const level of ['blaze', 'warm', 'calm', 'cool'] as const) expect(heat.filter((h) => h.level === level), level).toHaveLength(3);
    expect(monthHeat(yearP.months, fav)).toEqual(heat);
    expect(monthHeat([], fav)).toEqual([]);
  });

  it('입춘이 드는 달은 한 달뿐(2027년 2월)이고, 달의 모양(tone)은 연 방 달력과 같은 규칙이다(내 사주와 맺은 모양이 먼저, 없으면 그해 지지와 맺은 모양)', () => {
    expect(heat.filter((h) => h.lichun).map((h) => h.month)).toEqual([2]);
    for (const [i, h] of heat.entries()) expect(h.tone, `${h.month}월`).toBe(monthToneAll(yearP.months[i]));
  });

  it('전환 달: 오르는 달·내려앉는 달은 각각 하나 이하이고 1월은 전환 달이 될 수 없으며, 여러 사주에서 늘 보인다', () => {
    expect(heat.filter((h) => h.turn === 'rise').length).toBeLessThanOrEqual(1);
    expect(heat.filter((h) => h.turn === 'fall').length).toBeLessThanOrEqual(1);
    expect(heat[0].turn).toBeNull();
    expect(TURN_GAP).toBeGreaterThanOrEqual(10);
    let seen = 0;
    for (const d of ['1960-01-15', '1971-11-02', '1984-04-02', '1990-08-30', '2001-12-09', '2005-07-30']) {
      const c = computeChart(input(d, '09:30', 'female'));
      const p = buildRoomPayload({ room: 'year', locale: 'ko', chart: c, nowIso: NOW });
      const h = monthHeat(p.months, fateMap(p.self, p.luck, p.years, p.age, 2026).favorable);
      if (h.some((x) => x.turn === 'rise') && h.some((x) => x.turn === 'fall')) seen += 1;
    }
    expect(seen).toBeGreaterThanOrEqual(5);
  });

  it('달 온도 그림: 등불 열두 자리가 그림 안에서 시계 방향으로 이어지고(1월 = 12시 방향), 그림 파일이 있다', () => {
    expect(WHEEL_LAMPS).toHaveLength(12);
    expect(WHEEL_LAMPS[0].x).toBe(WHEEL.w / 2);
    expect(WHEEL_LAMPS[0].y).toBeLessThan(WHEEL.h / 2);
    expect(WHEEL_LAMPS[6].x).toBe(WHEEL.w / 2);
    expect(WHEEL_LAMPS[6].y).toBeGreaterThan(WHEEL.h / 2);

    for (let i = 1; i <= 5; i += 1) expect(WHEEL_LAMPS[i].x).toBeGreaterThan(WHEEL.w / 2);
    for (let i = 7; i <= 11; i += 1) expect(WHEEL_LAMPS[i].x).toBeLessThan(WHEEL.w / 2);
    for (const l of WHEEL_LAMPS) {
      expect(l.x).toBeGreaterThan(0);
      expect(l.x).toBeLessThan(WHEEL.w);
    }
    expect(existsSync(join(__dirname, '../public/media/fate/year-wheel-v1.jpg'))).toBe(true);
  });

  it('달 온도 화면: 칩 열두 개, 고른 달이 가운데 하늘에 뜨고, 전환 달 표시와 입춘 안내가 있고 점수 숫자는 없다', () => {
    const html = renderToStaticMarkup(createElement(YearHeat, { heat }));
    expect((html.match(/rs-hw__chip"/g) ?? []).length).toBe(12);
    expect((html.match(/class="rs-hw__lamp"/g) ?? []).length).toBe(12);
    const pressed = [...html.matchAll(/aria-pressed="(true|false)"/g)].map((m) => m[1] === 'true');
    expect(pressed.filter(Boolean)).toHaveLength(1);
    const first = heat.findIndex((h) => h.turn === 'rise');
    expect(pressed.indexOf(true)).toBe(first >= 0 ? first : Math.max(0, heat.findIndex((h) => h.level === 'blaze')));
    expect(html).toContain('rs-hw__center');
    expect(html).toContain('year-wheel-v1');
    expect(html).not.toMatch(/\d+점|score/);

    const rise = heat.find((h) => h.turn === 'rise');
    if (rise) expect(html).toContain(`${FATE_KO.paid.calendar.label(rise.year, rise.month)}, ${FATE_KO.paid.heat.level[rise.level]}, ${FATE_KO.paid.heat.turn.rise}`);
  });

  it('일곱 해 띠: 일곱 해가 그해부터 이어지고, 갈래는 일지·월지와의 합충에서 나오며, 가장 마음이 열리는 해는 많아야 하나다', () => {
    const years = loveYears(loveP.years);
    expect(years).toHaveLength(7);
    expect(years.map((y) => y.year)).toEqual([2026, 2027, 2028, 2029, 2030, 2031, 2032]);
    for (const [i, y] of years.entries()) {
      const tone = monthToneOf(loveP.years[i]);
      expect(y.kind, `${y.year}`).toBe(tone === 'harmonyDay' ? 'open' : tone === 'harmonyMonth' ? 'warm' : tone === null ? 'steady' : 'tender');
      expect(['peer', 'output', 'wealth', 'power', 'resource']).toContain(y.group);
    }
    const best = years.filter((y) => y.best);
    expect(best.length).toBeLessThanOrEqual(1);
    if (best[0]) {
      const firstOpen = years.find((y) => y.kind === 'open');
      expect(best[0]).toBe(firstOpen ?? years.find((y) => y.kind === 'warm'));
    } else {
      expect(years.every((y) => y.kind === 'steady' || y.kind === 'tender')).toBe(true);
    }
    expect(loveYears([])).toEqual([]);
    expect(loveYears(loveP.years)).toEqual(years);
  });

  it('일곱 해 띠 그림: 등불 일곱이 같은 간격으로 왼쪽에서 오른쪽으로 이어지고 그림 파일이 있다', () => {
    expect(BAND_LAMPS).toHaveLength(7);
    for (let i = 1; i < 7; i += 1) {
      expect(BAND_LAMPS[i].x).toBeGreaterThan(BAND_LAMPS[i - 1].x);
      expect(Math.abs(BAND_LAMPS[i].x - BAND_LAMPS[i - 1].x - (BAND_LAMPS[1].x - BAND_LAMPS[0].x))).toBeLessThan(20);
    }
    for (const l of BAND_LAMPS) {
      expect(l.x).toBeGreaterThan(0);
      expect(l.x).toBeLessThan(BAND.w);
    }
    expect(existsSync(join(__dirname, '../public/media/fate/love-band-v1.jpg'))).toBe(true);
  });

  it('일곱 해 띠 화면: 칩 일곱, 가장 마음이 열리는 해가 골라져 있고 별이 하나 붙으며 그해 살펴볼 주제가 나온다', () => {
    const years = loveYears(loveP.years);
    const html = renderToStaticMarkup(createElement(LoveBand, { years }));
    expect((html.match(/rs-lb__chip"/g) ?? []).length).toBe(7);
    const pressed = [...html.matchAll(/aria-pressed="(true|false)"/g)].map((m) => m[1] === 'true');
    expect(pressed.indexOf(true)).toBe(Math.max(0, years.findIndex((y) => y.best)));
    expect(html).toContain(FATE_KO.paid.band.themeLabel);
    expect((html.match(/rs-lb__best"/g) ?? []).length).toBe(years.some((y) => y.best) ? 1 : 0);
    expect(html).not.toMatch(/\d+점|score/);
  });

  it('둘의 오행: 나무·불·흙·쇠·물 순서로 두 사람의 글자 수를 견주고, 채워 줌은 사실표의 cross.fills 와 같다', () => {
    const pairs = elementPairs(matchP.self, matchP.partner!.chart);
    expect(pairs.map((p) => p.element)).toEqual(['wood', 'fire', 'earth', 'metal', 'water']);
    for (const p of pairs) {
      expect(p.me).toBe(matchP.self.elements[p.element]);
      expect(p.you).toBe(matchP.partner!.chart.elements[p.element]);
    }
    const fills = matchP.partner!.cross.fills;
    expect(pairs.filter((p) => p.link === 'youFills').map((p) => p.element).sort()).toEqual([...fills.selfMissingOtherHas].sort());
    expect(pairs.filter((p) => p.link === 'meFills').map((p) => p.element).sort()).toEqual([...fills.otherMissingSelfHas].sort());
    for (const p of pairs.filter((x) => x.link === 'overlap')) {
      expect(p.me).toBeGreaterThanOrEqual(2);
      expect(p.you).toBeGreaterThanOrEqual(2);
    }

    const swapped = elementPairs(matchP.partner!.chart, matchP.self);
    for (const [i, p] of pairs.entries()) {
      const flip = p.link === 'meFills' ? 'youFills' : p.link === 'youFills' ? 'meFills' : p.link;
      expect(swapped[i].link).toBe(flip);
    }
  });

  it('같이 맞는 달: 지금 달부터 열두 달이 달 순서 그대로이고, 갈래는 두 사람 각자의 합충에서 나온다', () => {
    const months = togetherMonths(matchP.self, matchP.partner!.chart, matchP.today);
    expect(months).toHaveLength(12);
    expect(months[0]).toMatchObject({ year: 2026, month: 10 });
    for (const m of months) {
      const goodA = m.me?.startsWith('harmony') ?? false;
      const goodB = m.you?.startsWith('harmony') ?? false;
      if (m.kind === 'both') expect(goodA && goodB).toBe(true);
      if (m.kind === 'one') expect(goodA !== goodB).toBe(true);
      if (m.kind === 'care') expect(goodA || goodB).toBe(false);
      if (m.kind === 'care') expect(m.me !== null && m.you !== null).toBe(true);
    }

    const swapped = togetherMonths(matchP.partner!.chart, matchP.self, matchP.today);
    expect(swapped.map((m) => m.kind)).toEqual(months.map((m) => m.kind));
    expect(togetherMonths(matchP.self, matchP.partner!.chart, matchP.today)).toEqual(months);
  });

  it('해와 달 두 카드 화면: 오행 노드 다섯과 달 칸 열둘이 단추이고, 점수·궁합 판정 낱말이 없다', () => {
    const pairs = elementPairs(matchP.self, matchP.partner!.chart);
    const html = renderToStaticMarkup(createElement(MatchElements, { pairs }));
    expect((html.match(/rs-mc__node"/g) ?? []).length).toBe(5);
    expect(html).toContain('木');
    expect(html).toContain('水');
    const months = togetherMonths(matchP.self, matchP.partner!.chart, matchP.today);
    const html2 = renderToStaticMarkup(createElement(MatchTogether, { months }));
    expect((html2.match(/rs-mt__cell"/g) ?? []).length).toBe(12);
    for (const h of [html, html2]) {
      expect(h).not.toMatch(/\d+점|score/);
      expect(h).not.toMatch(/찰떡|환상|최악|천생연분|안 맞/);
    }
  });

  it('세 언어 문구: 따로 쓰였고, 영어·일본어에는 한글이 없으며, 한국어는 금지 낱말이 없고 겁주지 않는다', () => {
    const heatLevels = ['blaze', 'warm', 'calm', 'cool'] as const;
    const kinds = ['open', 'warm', 'steady', 'tender'] as const;
    const links = ['overlap', 'meFills', 'youFills', 'none'] as const;
    const tk = ['both', 'one', 'care', 'even'] as const;
    const strings = (F: typeof FATE_KO) => [
      F.paid.heat.head, F.paid.heat.sub, F.paid.heat.lichun, ...heatLevels.flatMap((l) => [F.paid.heat.level[l], F.paid.heat.line[l]]), F.paid.heat.turn.rise, F.paid.heat.turn.fall, F.paid.heat.turnLine.rise, F.paid.heat.turnLine.fall,
      F.paid.band.head, F.paid.band.sub, F.paid.band.best, F.paid.band.themeLabel, F.paid.band.label(2027, 29), ...kinds.flatMap((k) => [F.paid.band.level[k], F.paid.band.line[k]]), ...Object.values(F.paid.band.theme),
      F.paid.match.elements.head, F.paid.match.elements.sub, F.paid.match.elements.me, F.paid.match.elements.you, ...Object.values(F.paid.match.elements.name), ...links.flatMap((k) => [F.paid.match.elements.link[k], F.paid.match.elements.line[k]]),
      F.paid.match.together.head, F.paid.match.together.sub, F.paid.match.together.summary.some, F.paid.match.together.summary.none, ...tk.flatMap((k) => [F.paid.match.together.kind[k], F.paid.match.together.line[k]]),
    ];
    const ko = strings(FATE_KO);
    for (const F of [FATE_KO, FATE_EN, FATE_JA]) {
      const list = strings(F);
      expect(list.every((t) => t.length > 0)).toBe(true);
      expect(list.join(' ')).not.toMatch(/\{(?!el\}|me\}|you\}|n\}|who\})\w+\}/);
    }
    for (const F of [FATE_EN, FATE_JA]) expect(strings(F).join(' ')).not.toMatch(/[가-힣]/);

    for (let i = 0; i < ko.length; i += 1) {
      const a = strings(FATE_EN)[i];
      const b = strings(FATE_JA)[i];
      if (ko[i].length > 12) {
        expect(a).not.toBe(ko[i]);
        expect(b).not.toBe(ko[i]);
      }
    }
    expect(ko.join(' ')).not.toMatch(FORBIDDEN);
    expect(ko.join(' ')).not.toMatch(/사탕|꿀|소금/);

    expect(ko.join(' ')).not.toMatch(/반드시|결혼한|헤어|이별|궁합이 (좋|나쁘)/);

    for (const F of [FATE_KO, FATE_EN, FATE_JA]) {
      for (const k of links) expect(F.paid.match.elements.line[k]).toMatch(/\{el\}/);
      expect(F.paid.match.together.line.one).toMatch(/\{who\}/);
      expect(F.paid.match.together.summary.some).toMatch(/\{n\}/);
    }
    expect(FATE_KO.paid.band.label(2027, 29)).toBe('2027년 · 29살');
    expect(FATE_JA.paid.band.label(2027, 29)).toBe('2027年・29歳');
    expect(FATE_EN.paid.band.label(2027, 29)).toBe('2027 · age 29');
  });
});
