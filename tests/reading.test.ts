import { describe, expect, it, vi } from 'vitest';
import { computeChart, currentSeason } from '@/lib/saju';
import type { Branch, BirthInput, Chart, GodGroup } from '@/lib/saju';
import { BRANCHES, isClash, isSixHarmony, isWonjin } from '@/lib/saju/tables';
import { buildReading } from '@/lib/reading';
import type { CandyBook, Focus, ReadingLibrary, SaltLevel } from '@/lib/reading';
import { levelOf, scoreSalt } from '@/lib/reading/score';
import { hash32 } from '@/lib/reading/hash';

const SEOUL = { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' };
const GODS: GodGroup[] = ['peer', 'output', 'wealth', 'power', 'resource'];
const BOOKS: CandyBook[] = ['love', 'general'];
const LEVELS: SaltLevel[] = ['pinch', 'spoonful', 'handful'];
const NOW = '2026-10-15T00:00:00Z';

const FAKE: ReadingLibrary = {
  candy: Object.fromEntries(
    BOOKS.map((book) => [
      book,
      Object.fromEntries(
        GODS.map((god) => [
          god,
          [0, 1, 2, 3].map((i) => ({ id: `candy-${book}-${god}-${i}`, text: `Candy ${book} ${god} ${i}.` })),
        ]),
      ),
    ]),
  ),
  salt: Object.fromEntries(
    LEVELS.map((level) => [
      level,
      Object.fromEntries(
        GODS.map((god) => [
          god,
          [0, 1, 2].map((i) => ({
            id: `salt-${level}-${god}-${i}`,
            situation: `Situation ${level} ${god} ${i}.`,
            action: `Action ${level} ${god} ${i}.`,
          })),
        ]),
      ),
    ]),
  ),
} as ReadingLibrary;

function chartOf(date: string, time: string | null = '10:00', sex: BirthInput['sex'] = null): Chart {
  return computeChart({ date, time, place: SEOUL, sex });
}

function dateWithDayPillar(ganzhi: string): string {
  for (let i = 0; i < 60; i += 1) {
    const d = new Date(Date.UTC(2000, 0, 1 + i)).toISOString().slice(0, 10);
    if (chartOf(d).pillars.day.ganzhi === ganzhi) return d;
  }
  throw new Error(`no date with day pillar ${ganzhi}`);
}

describe('buildReading 기본', () => {
  const chart = chartOf('1990-05-15');
  const reading = buildReading(chart, 'love', NOW, FAKE);

  it('유형·초점·절기 구간을 그대로 싣는다', () => {
    expect(reading.type).toBe(chart.dayMaster.type);
    expect(reading.focus).toBe('love');
    expect(reading.season).toEqual(currentSeason(NOW));
    expect(GODS).toContain(reading.monthGod);
  });

  it('이번 절기월 천간(戊)이 일간에게 무엇인지로 monthGod을 정한다', () => {

    const expected: Record<string, GodGroup> = {
      wood: 'wealth', fire: 'output', earth: 'peer', metal: 'resource', water: 'power',
    };
    expect(reading.monthGod).toBe(expected[chart.dayMaster.element]);
  });

  it('사탕 문장은 책·monthGod 갈래에서, 소금 문장은 레벨·monthGod 갈래에서 고른다', () => {
    expect(reading.candy.id.startsWith(`candy-love-${reading.monthGod}-`)).toBe(true);
    expect(reading.candy.text).toContain('Candy love');
    expect(reading.salt.line.id.startsWith(`salt-${reading.salt.level}-${reading.monthGod}-`)).toBe(true);
    expect(reading.salt.line.situation).toContain(`Situation ${reading.salt.level}`);
    expect(reading.salt.line.action).toContain(`Action ${reading.salt.level}`);
  });

  it('소금의 when과 notCurse', () => {
    expect(reading.salt.line.when).toBe(
      'Now through early November, from Cold Dew to the Start of Winter',
    );
    expect(reading.salt.line.notCurse).toBe('Not a curse. Just weather.');
  });

  it('월 이름은 로캘을 따른다', () => {
    const fr = buildReading(chart, 'love', NOW, FAKE, { locale: 'fr-FR' });
    expect(fr.salt.line.when).toBe('Now through early novembre, from Cold Dew to the Start of Winter');
  });

  it('근거 문장이 있다', () => {
    expect(reading.reasons.length).toBeGreaterThan(0);
    expect(reading.reasons[0]).toContain('This month’s stem 戊');
  });
});

describe('초점에 따른 책', () => {
  const chart = chartOf('1990-05-15');
  it('love와 someone은 love 책, everything은 general 책', () => {
    const love = buildReading(chart, 'love', NOW, FAKE);
    const someone = buildReading(chart, 'someone', NOW, FAKE);
    const all = buildReading(chart, 'everything', NOW, FAKE);
    expect(love.candy.id).toContain('candy-love-');
    expect(someone.candy.id).toBe(love.candy.id);
    expect(all.candy.id).toContain('candy-general-');

    expect(all.salt).toEqual(love.salt);
  });

  it('고민(ConcernKey)을 받으면 focus 에 기록하고 연애 묶음은 love 책, 나머지는 general 책', () => {
    const love = buildReading(chart, 'love', NOW, FAKE);
    const all = buildReading(chart, 'everything', NOW, FAKE);
    for (const k of ['love', 'crush', 'ex', 'partner', 'marriage'] as const) {
      const r = buildReading(chart, k, NOW, FAKE);
      expect(r.focus).toBe(k);
      expect(r.candy).toEqual(love.candy);
      expect(r.salt).toEqual(love.salt);
    }
    for (const k of ['work', 'money', 'study', 'people', 'change', 'self'] as const) {
      const r = buildReading(chart, k, NOW, FAKE);
      expect(r.focus).toBe(k);
      expect(r.candy).toEqual(all.candy);
      expect(r.salt).toEqual(all.salt);
    }
  });
});

describe('결정론', () => {
  it('같은 입력이면 같은 리딩', () => {
    const a = buildReading(chartOf('1990-05-15'), 'love', NOW, FAKE);
    const b = buildReading(chartOf('1990-05-15'), 'love', NOW, FAKE);
    expect(a).toEqual(b);
  });

  it('지금 시각(시스템 시계)에 영향을 받지 않는다', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2001-01-01T00:00:00Z'));
      const a = buildReading(chartOf('1990-05-15'), 'love', NOW, FAKE);
      vi.setSystemTime(new Date('2040-01-01T00:00:00Z'));
      const b = buildReading(chartOf('1990-05-15'), 'love', NOW, FAKE);
      expect(a).toEqual(b);
    } finally {
      vi.useRealTimers();
    }
  });

  it('같은 절기월 안에서는 날짜가 달라도 같은 문장', () => {
    const chart = chartOf('1990-05-15');
    const early = buildReading(chart, 'love', '2026-10-09T00:00:00Z', FAKE);
    const late = buildReading(chart, 'love', '2026-11-06T00:00:00Z', FAKE);
    expect(early.season.monthGanzhi).toBe(late.season.monthGanzhi);
    expect(early.candy).toEqual(late.candy);
    expect(early.salt).toEqual(late.salt);
  });

  it('절기월이 바뀌면 풀이가 새로 만들어진다', () => {
    const chart = chartOf('1990-05-15');
    const a = buildReading(chart, 'love', '2026-10-15T00:00:00Z', FAKE);
    const b = buildReading(chart, 'love', '2026-11-15T00:00:00Z', FAKE);
    expect(a.season.name).not.toBe(b.season.name);
    expect(a.salt.line.when).not.toBe(b.salt.line.when);
  });

  it('이름이 아니라 생년월일시와 장소로 문장이 갈린다', () => {

    const ids = new Set<string>();
    for (let i = 0; i < 60; i += 1) {
      const d = new Date(Date.UTC(1985, 0, 1 + i * 7)).toISOString().slice(0, 10);
      const r = buildReading(chartOf(d), 'love', NOW, FAKE);
      ids.add(r.candy.id);
    }
    expect(ids.size).toBeGreaterThan(8);
  });

  it('해시는 환경과 상관없이 고정된 값을 낸다', () => {

    expect(hash32('')).toBe(2872998923);
    expect(hash32('dangol')).toBe(371784279);
    expect(hash32('a')).not.toBe(hash32('b'));
  });
});

describe('소금 점수 (SPEC 4장, 2026-10-15 검토로 개정)', () => {
  const now = NOW;

  it('레벨 경계: <=0 pinch, 0 < s < 2 spoonful, >=2 handful', () => {
    expect(levelOf(-1.5)).toBe('pinch');
    expect(levelOf(-0.5)).toBe('pinch');
    expect(levelOf(0)).toBe('pinch');
    expect(levelOf(0.5)).toBe('spoonful');
    expect(levelOf(1)).toBe('spoonful');
    expect(levelOf(1.5)).toBe('spoonful');
    expect(levelOf(2)).toBe('handful');
    expect(levelOf(3.5)).toBe('handful');
    expect(levelOf(4.5)).toBe('handful');
  });

  it('이번 달 지지 충 +2, 편관 +1.5: 壬辰 일주는 handful', () => {
    const chart = chartOf(dateWithDayPillar('壬辰'));
    const r = buildReading(chart, 'love', now, FAKE);

    expect(r.monthGod).toBe('power');
    expect(r.salt.score).toBe(3.5);
    expect(r.salt.level).toBe('handful');
    expect(r.reasons).toContain('This month’s branch 戌 clashes with your day branch 辰.');
    expect(r.reasons).toContain('It shares your yin-yang polarity, which gives this theme more emphasis.');
  });

  it('충만 있으면 +2 handful: 甲辰 일주', () => {
    const chart = chartOf(dateWithDayPillar('甲辰'));
    const r = buildReading(chart, 'love', now, FAKE);
    expect(r.monthGod).toBe('wealth');
    expect(r.salt.score).toBe(2);
    expect(r.salt.level).toBe('handful');
  });

  it('원진만 있으면 +2 handful: 乙巳 일주는 戌과 원진', () => {
    const chart = chartOf(dateWithDayPillar('乙巳'));
    const r = buildReading(chart, 'love', now, FAKE);

    expect(r.monthGod).toBe('wealth');
    expect(r.salt.score).toBe(2);
    expect(r.salt.level).toBe('handful');
    expect(r.reasons).toContain('This month’s branch 戌 and your day branch 巳 form a traditionally tense pairing.');
    expect(r.reasons.some((t) => t.includes('clashes'))).toBe(false);
  });

  it('음양이 다른 power(정관)는 +1만: 癸亥 일주는 spoonful', () => {

    const chart = chartOf(dateWithDayPillar('癸亥'));
    const r = buildReading(chart, 'love', now, FAKE);
    expect(r.monthGod).toBe('power');

    expect(r.salt.score).toBe(1);
    expect(r.salt.level).toBe('spoonful');
    expect(r.reasons).not.toContain('It shares your yin-yang polarity, which gives this theme more emphasis.');
  });

  it('음양이 다른 output(상관) +1: 丁丑 일주는 spoonful', () => {
    const chart = chartOf(dateWithDayPillar('丁丑'));
    const r = buildReading(chart, 'love', now, FAKE);

    expect(r.monthGod).toBe('output');

    expect(r.salt.score).toBe(1);
    expect(r.salt.level).toBe('spoonful');
    expect(r.reasons).toContain(
      'Its yin-yang polarity is opposite to yours, so your words may come across more sharply than intended.',
    );
  });

  it('음양이 같은 output(식신)은 가산이 없다: 丙寅 일주는 pinch', () => {
    const chart = chartOf(dateWithDayPillar('丙寅'));
    const r = buildReading(chart, 'love', now, FAKE);
    expect(r.monthGod).toBe('output');
    expect(r.salt.score).toBe(0);
    expect(r.salt.level).toBe('pinch');
    expect(r.reasons.some((t) => t.includes('opposite to your polarity'))).toBe(false);
  });

  it('올해 지지 충 +1: 子 일지는 午년과 충 (spoonful)', () => {
    const chart = chartOf(dateWithDayPillar('丙子'));
    const r = buildReading(chart, 'love', now, FAKE);

    expect(r.salt.score).toBe(1);
    expect(r.salt.level).toBe('spoonful');
    expect(r.reasons).toContain('This year’s branch 午 clashes with your day branch 子.');
  });

  it('이번 달 지지 육합 -1: 卯 일지는 戌과 합', () => {
    const chart = chartOf(dateWithDayPillar('己卯'));
    const r = buildReading(chart, 'love', now, FAKE);
    expect(r.monthGod).toBe('peer');
    expect(r.salt.score).toBe(-1);
    expect(r.salt.level).toBe('pinch');
    expect(r.reasons.some((s) => s.includes('pairs with your day branch'))).toBe(true);
  });

  it('육합 -1과 상관 +1이 겹치면 0, pinch: 丁卯 일주', () => {
    const chart = chartOf(dateWithDayPillar('丁卯'));
    const r = buildReading(chart, 'love', now, FAKE);
    expect(r.salt.score).toBe(0);
    expect(r.salt.level).toBe('pinch');
  });

  it('이번 달 천간이 resource -0.5: 庚 일간에게 戊(土)는 resource', () => {
    const chart = chartOf(dateWithDayPillar('庚申'));
    const r = buildReading(chart, 'love', now, FAKE);
    expect(r.monthGod).toBe('resource');
    expect(r.salt.score).toBe(-0.5);
    expect(r.salt.level).toBe('pinch');
  });

  it('원진 여섯 쌍은 충·육합과 겹치지 않고 대칭이다', () => {
    const pairs: Array<[Branch, Branch]> = [];
    for (const a of BRANCHES) {
      for (const b of BRANCHES) {
        if (isWonjin(a, b)) {
          expect(isWonjin(b, a)).toBe(true);
          expect(isClash(a, b)).toBe(false);
          expect(isSixHarmony(a, b)).toBe(false);
          pairs.push([a, b]);
        }
      }
    }
    expect(pairs).toHaveLength(12);
    for (const [a, b] of [['子', '未'], ['丑', '午'], ['寅', '酉'], ['卯', '申'], ['辰', '亥'], ['巳', '戌']] as const) {
      expect(isWonjin(a, b)).toBe(true);
    }
  });

  it('scoreSalt는 buildReading과 같은 값을 낸다', () => {
    const chart = chartOf(dateWithDayPillar('壬辰'));
    const s = scoreSalt(chart, currentSeason(now));
    const r = buildReading(chart, 'love', now, FAKE);
    expect(s.score).toBe(r.salt.score);
    expect(s.level).toBe(r.salt.level);
  });
});

describe('소금 레벨 분포 (60갑자 일지 균등 가정)', () => {

  const charts: Chart[] = [];
  for (let i = 0; i < 60; i += 1) {
    const d = new Date(Date.UTC(2000, 0, 1 + i)).toISOString().slice(0, 10);
    charts.push(chartOf(d));
  }
  const dayAt = (year: number, month: number) => new Date(Date.UTC(year, month, 15)).toISOString();
  const sixMonths = [dayAt(2026, 9), dayAt(2026, 10), dayAt(2026, 11), dayAt(2027, 0), dayAt(2027, 1), dayAt(2027, 2)];
  const year2027 = Array.from({ length: 12 }, (_, m) => dayAt(2027, m));

  function tally(nows: string[]) {
    const byMonth = new Map<string, Record<SaltLevel, number>>();
    const byGod = new Map<GodGroup, number>();
    for (const now of nows) {
      const season = currentSeason(now);
      const row = byMonth.get(season.monthGanzhi) ?? { pinch: 0, spoonful: 0, handful: 0 };
      for (const chart of charts) {
        const s = scoreSalt(chart, season);
        row[s.level] += 1;
        if (s.level === 'handful') byGod.set(s.monthGod, (byGod.get(s.monthGod) ?? 0) + 1);
      }
      byMonth.set(season.monthGanzhi, row);
    }
    return { byMonth, byGod };
  }

  it('여섯 절기월 모두 handful이 10~25%이고 전체는 pinch > spoonful > handful', () => {
    const { byMonth } = tally(sixMonths);
    expect(byMonth.size).toBe(6);
    const total: Record<SaltLevel, number> = { pinch: 0, spoonful: 0, handful: 0 };
    for (const [, row] of byMonth) {
      const n = row.pinch + row.spoonful + row.handful;
      expect(row.handful / n).toBeGreaterThanOrEqual(0.1);
      expect(row.handful / n).toBeLessThanOrEqual(0.25);
      for (const l of LEVELS) total[l] += row[l];
    }
    const n = total.pinch + total.spoonful + total.handful;
    expect(total.handful / n).toBeGreaterThanOrEqual(0.1);
    expect(total.handful / n).toBeLessThanOrEqual(0.25);
    expect(total.pinch).toBeGreaterThan(total.spoonful);
    expect(total.spoonful).toBeGreaterThan(total.handful);
  });

  it('2027년 열두 달 어느 달에도 handful이 10~25%이고, 다섯 갈래 모두 handful이 나온다', () => {
    const { byMonth, byGod } = tally(year2027);
    expect(byMonth.size).toBe(12);
    for (const [, row] of byMonth) {
      const n = row.pinch + row.spoonful + row.handful;
      expect(row.handful / n).toBeGreaterThanOrEqual(0.1);
      expect(row.handful / n).toBeLessThanOrEqual(0.25);
    }
    for (const god of GODS) expect(byGod.get(god) ?? 0).toBeGreaterThan(0);
  });
});

describe('SPEC 8장 (7) 소금 레벨이 결정론적이고 세 레벨이 모두 나올 수 있다', () => {

  const results: Array<{ level: SaltLevel; score: number; id: string }> = [];
  for (let i = 0; i < 60; i += 1) {
    const d = new Date(Date.UTC(1980, 0, 1 + i * 17)).toISOString().slice(0, 10);
    const chart = chartOf(d);
    for (let month = 0; month < 12; month += 1) {
      const now = new Date(Date.UTC(2026, month, 15)).toISOString();
      const r = buildReading(chart, 'love', now, FAKE);
      results.push({ level: r.salt.level, score: r.salt.score, id: r.salt.line.id });
    }
  }

  it('같은 입력을 두 번 돌리면 레벨·점수·문장이 같다', () => {
    for (let i = 0; i < 60; i += 1) {
      const d = new Date(Date.UTC(1980, 0, 1 + i * 17)).toISOString().slice(0, 10);
      const chart = chartOf(d);
      for (let month = 0; month < 12; month += 1) {
        const now = new Date(Date.UTC(2026, month, 15)).toISOString();
        const a = buildReading(chart, 'love', now, FAKE);
        const b = buildReading(chart, 'love', now, FAKE);
        expect(b.salt).toEqual(a.salt);
      }
    }
  });

  it('pinch, spoonful, handful이 모두 나온다', () => {
    const seen = new Set(results.map((r) => r.level));
    expect([...seen].sort()).toEqual(['handful', 'pinch', 'spoonful']);
  });

  it('레벨은 점수 구간과 일치한다', () => {
    for (const r of results) {
      expect(r.level).toBe(levelOf(r.score));
    }
  });

  it('handful은 10~25%이고 pinch가 가장 흔하다', () => {
    const count = (l: SaltLevel) => results.filter((r) => r.level === l).length;
    const handfulShare = count('handful') / results.length;
    expect(handfulShare).toBeGreaterThanOrEqual(0.1);
    expect(handfulShare).toBeLessThanOrEqual(0.25);
    expect(count('pinch')).toBeGreaterThan(count('spoonful'));
    expect(count('spoonful')).toBeGreaterThan(count('handful'));
  });

  it('소금 문장 id는 레벨과 일치한다', () => {
    for (const r of results) {
      expect(r.id.startsWith(`salt-${r.level}-`)).toBe(true);
    }
  });
});

describe('안전', () => {
  const FORBIDDEN = /cosmic|energy|universe|manifest|FYP|share for luck/i;

  it('엔진이 만드는 문장(when, notCurse, reasons)에 금지 어휘나 이모지가 없다', () => {
    const focuses: Focus[] = ['love', 'someone', 'everything'];
    for (let i = 0; i < 40; i += 1) {
      const d = new Date(Date.UTC(1983, 0, 1 + i * 23)).toISOString().slice(0, 10);
      for (let month = 0; month < 12; month += 1) {
        const now = new Date(Date.UTC(2026, month, 15)).toISOString();
        const r = buildReading(chartOf(d), focuses[i % 3], now, FAKE);
        const texts = [r.salt.line.when, r.salt.line.notCurse, ...r.reasons];
        for (const t of texts) {
          expect(t).not.toMatch(FORBIDDEN);
          expect(t).not.toMatch(/\p{Extended_Pictographic}/u);
        }
      }
    }
  });

  it('라이브러리에 해당 갈래 문장이 없으면 RangeError', () => {
    const empty = {
      candy: { love: { peer: [], output: [], wealth: [], power: [], resource: [] }, general: FAKE.candy.general },
      salt: FAKE.salt,
    } as ReadingLibrary;
    expect(() => buildReading(chartOf('1990-05-15'), 'love', NOW, empty)).toThrow(RangeError);
  });
});
