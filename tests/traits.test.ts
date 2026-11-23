import { describe, expect, it, vi } from 'vitest';
import { computeChart } from '@/lib/saju';
import type { BirthInput, Branch, Chart, Element, GodGroup, Pillar, TypeKey } from '@/lib/saju';
import { BRANCHES, STEMS, isClash, pillarFromGanzhi, typeOfStem } from '@/lib/saju/tables';
import {
  STRENGTH_THRESHOLDS,
  ageAt,
  buildTraits,
  currentChapter,
  helpShare,
  runnerUpOf,
  strengthOf,
  traitFeatures,
} from '@/lib/reading/traits';
import { chapterStartDates } from '@/lib/reading/chapter-dates';
import type { TraitLibrary, TraitStrength } from '@/lib/reading/traits-types';
import { buildTraits as buildTraitsFromIndex, currentChapter as currentChapterFromIndex } from '@/lib/reading';
import { TRAITS } from '@/content/en/traits';

const SEOUL = { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' };
const GODS: GodGroup[] = ['peer', 'output', 'wealth', 'power', 'resource'];
const ELEMENTS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
const STRENGTHS: TraitStrength[] = ['strong', 'balanced', 'gentle'];
const TYPES: TypeKey[] = [
  'pine', 'vine', 'sun', 'candle', 'mountain', 'field', 'blade', 'jewel', 'ocean', 'rain',
];

interface Sizes {
  core: number;
  pattern: number;
  love: number;
  tension: number;
  missing: number;
}
const DEFAULT_SIZES: Sizes = { core: 3, pattern: 3, love: 3, tension: 5, missing: 2 };

function lines(prefix: string, n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: `${prefix}-${i}`, text: `Text ${prefix} ${i}.` }));
}

function makeLib(sizes: Sizes = DEFAULT_SIZES): TraitLibrary {
  return {
    core: Object.fromEntries(
      TYPES.map((t) => [
        t,
        Object.fromEntries(STRENGTHS.map((s) => [s, lines(`core-${t}-${s}`, sizes.core)])),
      ]),
    ),
    pattern: Object.fromEntries(GODS.map((g) => [g, lines(`pattern-${g}`, sizes.pattern)])),
    love: Object.fromEntries(GODS.map((g) => [g, lines(`love-${g}`, sizes.love)])),
    tension: lines('tension', sizes.tension),
    missing: Object.fromEntries(ELEMENTS.map((e) => [e, lines(`missing-${e}`, sizes.missing)])),
    chapters: Object.fromEntries(
      GODS.map((g) => [g, { title: `Title ${g}`, line: `Line ${g}.` }]),
    ),
  } as TraitLibrary;
}

const LIB = makeLib();

function makeLib10(): TraitLibrary {
  const base = makeLib();
  return {
    ...base,
    chapters10: Object.fromEntries(
      GODS.map((g) => [
        g,
        {
          same: { title: `Title ${g} same`, line: `Line ${g} same.` },
          other: { title: `Title ${g} other`, line: `Line ${g} other.` },
        },
      ]),
    ),
  } as TraitLibrary;
}

interface FakeOpts {
  year: string;
  month: string;
  day: string;
  hour?: string | null;
  date?: string;
  time?: string | null;
  daYun?: Chart['daYun'];
}

function fakeChart(o: FakeOpts): Chart {
  const year = pillarFromGanzhi(o.year);
  const month = pillarFromGanzhi(o.month);
  const day = pillarFromGanzhi(o.day);
  const hour: Pillar | null = o.hour ? pillarFromGanzhi(o.hour) : null;
  const elements: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const p of [year, month, day, hour]) {
    if (!p) continue;
    elements[p.stemElement] += 1;
    elements[p.branchElement] += 1;
  }
  return {
    input: {
      date: o.date ?? '1995-03-22',
      time: o.time === undefined ? (hour ? '10:00' : null) : o.time,
      place: SEOUL,
      sex: null,
    },
    pillars: { year, month, day, hour },
    dayMaster: {
      stem: day.stem,
      element: day.stemElement,
      polarity: day.stemPolarity,
      type: typeOfStem(day.stem),
    },
    elements,
    stemGods: { year: 'peer', month: 'peer', hour: null },
    daYun: o.daYun ?? null,
    flags: { timeUnknown: !hour, ziHourAmbiguous: false, altType: null, nearJieqiBoundary: false },
    meta: { utc: '1995-03-22T01:00:00.000Z', solarLocal: '1995-03-22 10:00', solarTime: 'mean', offsetMinutes: -32, ziSect: 2 },
  };
}

function realChart(date: string, time: string | null = '10:00', sex: BirthInput['sex'] = null): Chart {
  return computeChart({ date, time, place: SEOUL, sex });
}

const gz = (i: number) => STEMS[i % 10] + BRANCHES[i % 12];

function populationChart(y: number, m: number, d: number, h: number | null): Chart {
  const firstMonthStem = (((y % 10) % 5) * 2 + 2) % 10;
  const monthGz = STEMS[(firstMonthStem + m) % 10] + BRANCHES[(m + 2) % 12];
  const hourGz = h === null ? null : STEMS[(((d % 10) % 5) * 2 + h) % 10] + BRANCHES[h];
  return fakeChart({ year: gz(y), month: monthGz, day: gz(d), hour: hourGz });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as object)) deepFreeze(v);
  }
  return value;
}

describe('traitFeatures: 손으로 계산한 차트', () => {
  it('2001-02-04 04:10 서울 辛巳 庚寅 戊戌 甲寅', () => {
    const chart = realChart('2001-02-04', '04:10');
    expect(chart.pillars.day.ganzhi).toBe('戊戌');

    expect(helpShare(chart)).toBe(0.25);
    expect(traitFeatures(chart)).toEqual({
      strength: 'gentle',

      dominant: 'power',
      palace: 'peer',

      missing: 'water',
      tension: false,
    });
  });

  it('일지 본기가 일간에게 무엇인가 (일간 甲 목)', () => {
    const expected: Record<string, GodGroup> = {
      甲子: 'resource',
      甲寅: 'peer',
      甲午: 'output',
      甲辰: 'wealth',
      甲申: 'power',
      甲戌: 'wealth',
    };
    for (const [day, palace] of Object.entries(expected)) {
      const chart = fakeChart({ year: '庚申', month: '丙子', day });
      expect(traitFeatures(chart).palace).toBe(palace);
    }
  });

  it('dominant: 가장 많은 갈래 (일간 甲 목, 월지도 한 글자로 센다), 동점이 아니면 많은 쪽이 이긴다', () => {

    expect(
      traitFeatures(fakeChart({ year: '戊辰', month: '戊辰', day: '甲子', hour: '甲子' })).dominant,
    ).toBe('wealth');

    expect(traitFeatures(fakeChart({ year: '庚申', month: '丙子', day: '甲申' })).dominant).toBe('power');
  });

  it('dominant 동점: 월지 본기의 갈래가 먼저, 그다음 월간의 갈래, 마지막에 power, wealth, output, resource, peer 순', () => {

    expect(traitFeatures(fakeChart({ year: '庚申', month: '戊辰', day: '甲子' })).dominant).toBe('wealth');

    expect(traitFeatures(fakeChart({ year: '戊辰', month: '丙午', day: '甲子' })).dominant).toBe('output');

    expect(traitFeatures(fakeChart({ year: '丙午', month: '壬子', day: '甲寅' })).dominant).toBe('resource');

    expect(
      traitFeatures(fakeChart({ year: '壬子', month: '乙卯', day: '甲子', hour: '乙酉' })).dominant,
    ).toBe('peer');

    expect(traitFeatures(fakeChart({ year: '庚申', month: '戊子', day: '甲辰' })).dominant).toBe('wealth');

    expect(traitFeatures(fakeChart({ year: '庚申', month: '丙寅', day: '甲子', hour: '戊辰' })).dominant).toBe('power');

    expect(
      traitFeatures(fakeChart({ year: '丙午', month: '戊辰', day: '甲寅', hour: '壬子' })).dominant,
    ).toBe('wealth');
  });

  it('runnerUpOf: 둘째로 많은 갈래. 시주가 있으면 두 글자 이상, 시주를 모르면 한 글자라도', () => {

    const a = fakeChart({ year: '庚申', month: '戊辰', day: '甲子', hour: '庚申' });
    expect(traitFeatures(a).dominant).toBe('power');
    expect(runnerUpOf(a)).toBe('wealth');

    const flat = fakeChart({ year: '乙午', month: '戊寅', day: '甲寅', hour: '庚子' });
    expect(traitFeatures(flat).dominant).toBe('peer');
    expect(runnerUpOf(flat)).toBeNull();

    expect(runnerUpOf(fakeChart({ year: '乙午', month: '戊寅', day: '甲寅' }))).toBe('wealth');

    const tie = fakeChart({ year: '庚申', month: '戊辰', day: '甲子', hour: '丙午' });

    expect(traitFeatures(tie).dominant).toBe('wealth');
    expect(runnerUpOf(tie)).toBe('power');
  });

  it('missing: 하나도 없는 오행. 여럿이면 일간이 극하는 것(wealth)부터, 없으면 null', () => {

    expect(
      traitFeatures(fakeChart({ year: '庚申', month: '壬子', day: '甲寅' })).missing,
    ).toBe('earth');

    expect(
      traitFeatures(fakeChart({ year: '戊辰', month: '甲寅', day: '甲寅' })).missing,
    ).toBe('metal');

    expect(
      traitFeatures(fakeChart({ year: '庚申', month: '戊辰', day: '甲寅' })).missing,
    ).toBe('fire');

    expect(
      traitFeatures(fakeChart({ year: '丙午', month: '壬子', day: '甲寅' })).missing,
    ).toBe('earth');

    expect(
      traitFeatures(fakeChart({ year: '辛巳', month: '甲子', day: '甲戌' })).missing,
    ).toBeNull();
  });

  it('missing: 시간을 모르면 여섯 글자로 센다', () => {
    const chart = fakeChart({ year: '辛巳', month: '庚寅', day: '戊戌', hour: null });

    expect(chart.elements.water).toBe(0);
    expect(traitFeatures(chart).missing).toBe('water');

    expect(chart.elements.wood).toBe(1);
  });

  it('tension: 일지가 월지나 연지와 충일 때만 (시지와의 충은 세지 않는다)', () => {
    const pairs: [Branch, Branch][] = [
      ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
    ];
    for (const [a, b] of pairs) {
      expect(isClash(a, b)).toBe(true);
      for (const [day, other] of [[a, b], [b, a]]) {

        const dayGz = `甲${day}`;
        const same = (stem: string) => `${stem}${day}`;

        expect(
          traitFeatures(fakeChart({ year: same('甲'), month: `丙${other}`, day: dayGz })).tension,
        ).toBe(true);

        expect(
          traitFeatures(fakeChart({ year: `甲${other}`, month: same('丙'), day: dayGz })).tension,
        ).toBe(true);

        expect(
          traitFeatures(fakeChart({ year: same('甲'), month: same('丙'), day: dayGz, hour: `丙${other}` })).tension,
        ).toBe(false);
      }
    }

    expect(traitFeatures(fakeChart({ year: '甲寅', month: '丙寅', day: '甲子' })).tension).toBe(false);
  });
});

describe('strength', () => {
  it('문턱 값 고정 (바꾸면 분포 테스트와 독립 기준 구현도 같이 본다)', () => {
    expect(STRENGTH_THRESHOLDS).toEqual({ gentleBelow: 0.28, strongFrom: 0.53 });
  });

  it('문턱은 실제로 나오는 비중 값에 딱 걸리지 않는다', () => {
    const { gentleBelow, strongFrom } = STRENGTH_THRESHOLDS;
    for (const total of [6, 8]) {
      for (let help = 0; help <= total; help += 1) {
        for (const bonus of [0, 0.5]) {
          const v = (help + bonus) / total;
          expect(Math.abs(v - gentleBelow)).toBeGreaterThan(0.01);
          expect(Math.abs(v - strongFrom)).toBeGreaterThan(0.01);
        }
      }
    }
  });

  it('strengthOf 경계 (시주 있음: 8, 시주 없음: 6)', () => {

    expect(strengthOf(2 / 8)).toBe('gentle');
    expect(strengthOf(2.5 / 8)).toBe('balanced');
    expect(strengthOf(4 / 8)).toBe('balanced');
    expect(strengthOf(4.5 / 8)).toBe('strong');
    expect(strengthOf(0)).toBe('gentle');
    expect(strengthOf(8.5 / 8)).toBe('strong');

    expect(strengthOf(1 / 6)).toBe('gentle');
    expect(strengthOf(2 / 6)).toBe('balanced');
    expect(strengthOf(3 / 6)).toBe('balanced');
    expect(strengthOf(3.5 / 6)).toBe('strong');
  });

  it('돕는 무게가 같으면 월지 본기가 돕는 쪽(득령)이 한 칸 위다', () => {

    const rooted = fakeChart({ year: '庚申', month: '丙子', day: '甲申', hour: '庚午' });
    expect(helpShare(rooted)).toBe(2.5 / 8);
    expect(traitFeatures(rooted).strength).toBe('balanced');

    const unrooted = fakeChart({ year: '壬申', month: '壬午', day: '甲申', hour: '庚午' });
    expect(helpShare(unrooted)).toBe(2 / 8);
    expect(traitFeatures(unrooted).strength).toBe('gentle');
  });

  it('전부 돕는 차트는 strong, 아무도 안 돕는 차트는 gentle', () => {

    const all = fakeChart({ year: '壬子', month: '乙卯', day: '甲寅', hour: '壬子' });
    expect(helpShare(all)).toBe(8.5 / 8);
    expect(traitFeatures(all).strength).toBe('strong');

    const none = fakeChart({ year: '庚申', month: '庚午', day: '甲申' });
    expect(helpShare(none)).toBe(0);
    expect(traitFeatures(none).strength).toBe('gentle');
  });

  it('시주가 없으면 전체 무게가 6이다', () => {

    const chart = fakeChart({ year: '壬申', month: '乙午', day: '甲申' });
    expect(helpShare(chart)).toBe(2 / 6);
    expect(traitFeatures(chart).strength).toBe('balanced');
  });
});

const EL_ORDER: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

const REL: GodGroup[] = ['peer', 'output', 'wealth', 'power', 'resource'];
const relOf = (me: Element, other: Element): GodGroup =>
  REL[(EL_ORDER.indexOf(other) - EL_ORDER.indexOf(me) + 5) % 5];

function reference(chart: Chart) {
  const me = chart.dayMaster.element;
  const { year, month, day, hour } = chart.pillars;
  const stems = [year.stemElement, month.stemElement, ...(hour ? [hour.stemElement] : [])];
  const branches = [year.branchElement, month.branchElement, day.branchElement, ...(hour ? [hour.branchElement] : [])];
  const chars = [...stems, ...branches];

  const count: Record<GodGroup, number> = { peer: 0, output: 0, wealth: 0, power: 0, resource: 0 };
  for (const e of chars) count[relOf(me, e)] += 1;

  const monthBranchGod = relOf(me, month.branchElement);
  const monthStemGod = relOf(me, month.stemElement);
  const fixed: GodGroup[] = ['power', 'wealth', 'output', 'resource', 'peer'];
  const priority = (g: GodGroup) => (g === monthBranchGod ? -2 : g === monthStemGod ? -1 : fixed.indexOf(g));
  const dominant = fixed.reduce((a, b) => (count[b] > count[a] || (count[b] === count[a] && priority(b) < priority(a)) ? b : a));

  const helps = (e: Element) => relOf(me, e) === 'peer' || relOf(me, e) === 'resource';
  let help = 0;
  for (const e of stems) if (helps(e)) help += 1;
  for (const e of [year.branchElement, day.branchElement, ...(hour ? [hour.branchElement] : [])]) {
    if (helps(e)) help += 1;
  }
  if (helps(month.branchElement)) help += 2.5;
  const total = hour ? 8 : 6;
  const share = help / total;
  const strength: TraitStrength = share < 0.28 ? 'gentle' : share >= 0.53 ? 'strong' : 'balanced';

  const present = new Set(chars.concat(me));
  const absent = EL_ORDER.filter((e) => !present.has(e));
  const rank = (e: Element) => ['wealth', 'power', 'output', 'resource', 'peer'].indexOf(relOf(me, e));
  const missing = absent.length ? absent.reduce((a, b) => (rank(b) < rank(a) ? b : a)) : null;

  const clash = (a: Branch, b: Branch) => (BRANCHES.indexOf(a) - BRANCHES.indexOf(b) + 12) % 12 === 6;
  return {
    strength,
    dominant,
    palace: relOf(me, day.branchElement),
    missing,
    tension: clash(day.branch, month.branch) || clash(day.branch, year.branch),
  };
}

describe('traitFeatures: 독립 기준 구현과 일치', () => {
  it('연주 60 x 월 12 x 일주 60 x 시 12(+시간 모름) 조합 표본 전부', () => {
    let n = 0;

    for (let y = 0; y < 60; y += 1) {
      for (let m = 0; m < 12; m += 1) {
        for (let d = 0; d < 60; d += 1) {
          const h = (y * 7 + m * 5 + d) % 13;
          const chart = populationChart(y, m, d, h === 12 ? null : h);
          expect(traitFeatures(chart)).toEqual(reference(chart));
          n += 1;
        }
      }
    }
    expect(n).toBe(43200);
  });
});

function shareOf(counts: Record<TraitStrength, number>) {
  const n = counts.strong + counts.balanced + counts.gentle;
  return { strong: counts.strong / n, balanced: counts.balanced / n, gentle: counts.gentle / n, n };
}

describe('strength 분포 (대략 3 : 3 : 3)', () => {
  it('일주 60 x 연주 60 x 월 12 x 시 12 전수: 시주가 있으면 세 단계가 각각 1/3 안팎', () => {
    const counts: Record<TraitStrength, number> = { strong: 0, balanced: 0, gentle: 0 };
    const byDay = new Map<number, Record<TraitStrength, number>>();
    for (let y = 0; y < 60; y += 1) {
      for (let m = 0; m < 12; m += 1) {
        for (let d = 0; d < 60; d += 1) {
          for (let h = 0; h < 12; h += 1) {
            const s = traitFeatures(populationChart(y, m, d, h)).strength;
            counts[s] += 1;
            const row = byDay.get(d) ?? { strong: 0, balanced: 0, gentle: 0 };
            row[s] += 1;
            byDay.set(d, row);
          }
        }
      }
    }
    const share = shareOf(counts);
    expect(share.n).toBe(518_400);
    for (const s of STRENGTHS) {
      expect(share[s]).toBeGreaterThan(0.32);
      expect(share[s]).toBeLessThan(0.35);
    }

    expect(byDay.size).toBe(60);
    for (const [, row] of byDay) {
      const r = shareOf(row);
      for (const s of STRENGTHS) expect(r[s]).toBeGreaterThan(0.08);
    }
  });

  it('시간을 모르는 차트도 세 단계가 각각 25~40%', () => {
    const counts: Record<TraitStrength, number> = { strong: 0, balanced: 0, gentle: 0 };
    for (let y = 0; y < 60; y += 1) {
      for (let m = 0; m < 12; m += 1) {
        for (let d = 0; d < 60; d += 1) {
          counts[traitFeatures(populationChart(y, m, d, null)).strength] += 1;
        }
      }
    }
    const share = shareOf(counts);
    expect(share.n).toBe(43_200);
    for (const s of STRENGTHS) {
      expect(share[s]).toBeGreaterThan(0.25);
      expect(share[s]).toBeLessThan(0.4);
    }
  });

  it('진짜 엔진 차트 표본(1960~2009, 7일 간격으로 60갑자 일주가 거의 다 나온다)도 1/3 안팎', () => {
    const times = ['00:30', '02:10', '04:40', '06:20', '08:00', '10:30', '12:10', '14:50', '16:20', '18:00', '20:40', '22:10'];
    const counts: Record<TraitStrength, number> = { strong: 0, balanced: 0, gentle: 0 };
    const days = new Set<string>();
    let i = 0;
    for (let ms = Date.UTC(1960, 0, 1); ms < Date.UTC(2010, 0, 1); ms += 7 * 86_400_000) {
      const date = new Date(ms).toISOString().slice(0, 10);
      const chart = realChart(date, times[i % times.length]);
      counts[traitFeatures(chart).strength] += 1;
      days.add(chart.pillars.day.ganzhi);
      i += 1;
    }

    expect(days.size).toBeGreaterThanOrEqual(55);
    const share = shareOf(counts);
    expect(share.n).toBeGreaterThan(2500);
    for (const s of STRENGTHS) {
      expect(share[s]).toBeGreaterThan(0.29);
      expect(share[s]).toBeLessThan(0.38);
    }
  });
});

describe('buildTraits', () => {
  const chart = realChart('1990-05-15', '10:00');

  it('hit 3개: core, pattern, love 순서이고 각각 맞는 풀에서 고른다', () => {
    const t = buildTraits(chart, LIB);
    const f = t.features;
    expect(f).toEqual(traitFeatures(chart));
    expect(t.hits).toHaveLength(3);
    expect(t.hits.map((h) => h.kind)).toEqual(['core', 'pattern', f.tension ? 'tension' : 'love']);
    expect(t.hits[0].id.startsWith(`core-${chart.dayMaster.type}-${f.strength}-`)).toBe(true);
    expect(t.hits[1].id.startsWith(`pattern-${f.dominant}-`)).toBe(true);
    expect(t.hits[2].id.startsWith(f.tension ? 'tension-' : `love-${f.palace}-`)).toBe(true);

    for (const h of t.hits) expect(h.text).toBe(`Text ${h.id.replace(/-(\d+)$/, ' $1')}.`);
  });

  it('일지가 충이면 세 번째 hit이 love 대신 tension, 아니면 love', () => {

    const clash = fakeChart({ year: '甲寅', month: '丙午', day: '甲子' });
    const calm = fakeChart({ year: '甲寅', month: '丙寅', day: '甲子' });
    const a = buildTraits(clash, LIB);
    expect(a.features.tension).toBe(true);
    expect(a.hits[2].kind).toBe('tension');
    expect(a.hits[2].id.startsWith('tension-')).toBe(true);
    const b = buildTraits(calm, LIB);
    expect(b.features.tension).toBe(false);
    expect(b.hits[2].kind).toBe('love');
    expect(b.hits[2].id.startsWith('love-resource-')).toBe(true);
  });

  it('보너스는 없는 오행이 있을 때만 그 오행의 문장 하나', () => {
    const lacking = realChart('2001-02-04', '04:10');
    const t = buildTraits(lacking, LIB);
    expect(t.features.missing).toBe('water');
    expect(t.bonus?.kind).toBe('missing');
    expect(t.bonus?.id.startsWith('missing-water-')).toBe(true);

    const full = fakeChart({ year: '辛巳', month: '甲子', day: '甲戌' });
    expect(traitFeatures(full).missing).toBeNull();
    expect(buildTraits(full, LIB).bonus).toBeNull();
  });

  it('보너스 풀이 비어 있으면 오류 없이 null, 필수 풀이 비면 RangeError', () => {
    const lacking = realChart('2001-02-04', '04:10');
    const noBonus: TraitLibrary = { ...LIB, missing: { ...LIB.missing, water: [] } };
    const t = buildTraits(lacking, noBonus);
    expect(t.bonus).toBeNull();
    expect(t.hits).toHaveLength(3);

    const f = traitFeatures(lacking);
    const noCore: TraitLibrary = {
      ...LIB,
      core: { ...LIB.core, [lacking.dayMaster.type]: { ...LIB.core[lacking.dayMaster.type], [f.strength]: [] } },
    };
    expect(() => buildTraits(lacking, noCore)).toThrow(RangeError);
    expect(() => buildTraits(lacking, { ...LIB, pattern: { ...LIB.pattern, [f.dominant]: [] } })).toThrow(RangeError);
    expect(() => buildTraits(lacking, { ...LIB, love: { ...LIB.love, [f.palace]: [] } })).toThrow(RangeError);

    const clash = fakeChart({ year: '甲寅', month: '丙午', day: '甲子' });
    expect(() => buildTraits(clash, { ...LIB, tension: [] })).toThrow(RangeError);
  });

  it('결정론: 같은 입력은 같은 결과, 복사한 차트도 같고, 얼려 둔 차트를 건드리지 않으며 Date.now를 부르지 않는다', () => {
    const spy = vi.spyOn(Date, 'now');
    try {
      const a = buildTraits(chart, LIB);
      expect(buildTraits(chart, LIB)).toEqual(a);
      expect(buildTraits(structuredClone(chart), LIB)).toEqual(a);
      expect(buildTraits(deepFreeze(structuredClone(chart)), deepFreeze(makeLib()))).toEqual(a);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('고정 표본(골든): 시드 방식이 바뀌면 이미 결과를 본 사람의 hit가 바뀐다', () => {
    const picks = (c: Chart) => {
      const t = buildTraits(c, LIB);
      return { ids: t.hits.map((h) => h.id), bonus: t.bonus?.id ?? null };
    };
    expect(picks(realChart('1990-05-15', '10:00'))).toEqual({
      ids: ['core-blade-balanced-0', 'pattern-power-1', 'love-resource-0'],
      bonus: 'missing-wood-1',
    });
    expect(picks(realChart('2001-02-04', '04:10'))).toEqual({
      ids: ['core-mountain-gentle-2', 'pattern-power-2', 'love-peer-1'],
      bonus: 'missing-water-0',
    });

    expect(picks(realChart('1993-11-02', null))).toEqual({
      ids: ['core-candle-gentle-0', 'pattern-output-0', 'love-power-1'],
      bonus: 'missing-wood-1',
    });

    expect(picks(realChart('1985-08-21', '15:45'))).toEqual({
      ids: ['core-ocean-balanced-0', 'pattern-resource-1', 'love-power-2'],
      bonus: 'missing-fire-0',
    });

    expect(picks(realChart('2004-12-25', '06:40'))).toEqual({
      ids: ['core-mountain-gentle-1', 'pattern-power-0', 'tension-3'],
      bonus: null,
    });

    expect(picks(realChart('1996-04-12', '09:30'))).toEqual({
      ids: ['core-field-strong-0', 'pattern-peer-2', 'love-power-0'],
      bonus: 'missing-metal-0',
    });
  });

  it('성별을 나중에 골라도 같은 사람은 같은 hit', () => {
    const none = buildTraits(realChart('1993-11-02', '07:30', null), LIB);
    const female = buildTraits(realChart('1993-11-02', '07:30', 'female'), LIB);
    const male = buildTraits(realChart('1993-11-02', '07:30', 'male'), LIB);
    expect(female).toEqual(none);
    expect(male).toEqual(none);
  });

  it('시간을 모르는 차트도 hit 3개 (시주 없음)', () => {
    const unknown = realChart('1990-05-15', null);
    expect(unknown.pillars.hour).toBeNull();
    const t = buildTraits(unknown, LIB);
    expect(t.hits).toHaveLength(3);
    expect(t.features).toEqual(traitFeatures(unknown));

    expect(t.hits[0].id.startsWith(`core-${unknown.dayMaster.type}-${t.features.strength}-`)).toBe(true);
  });

  it('생년월일·시간·출생지에 따라 문장이 달라지고 풀의 문장이 골고루 나온다', () => {
    const seen = {
      core: new Set<string>(),
      pattern: new Map<GodGroup, Set<string>>(),
      love: new Map<GodGroup, Set<string>>(),
      tension: new Set<string>(),
      missing: new Set<string>(),
    };
    let i = 0;
    for (let ms = Date.UTC(1970, 0, 1); ms < Date.UTC(2005, 0, 1); ms += 13 * 86_400_000) {
      const chart = realChart(new Date(ms).toISOString().slice(0, 10), i % 5 === 0 ? null : '10:00');
      const t = buildTraits(chart, LIB);
      const [core, pattern, third] = t.hits;
      seen.core.add(core.id);

      const patternGroup = /^pattern-([a-z]+)-/.exec(pattern.id)![1] as GodGroup;
      const p = seen.pattern.get(patternGroup) ?? new Set<string>();
      p.add(pattern.id);
      seen.pattern.set(patternGroup, p);
      if (third.kind === 'love') {
        const l = seen.love.get(t.features.palace) ?? new Set<string>();
        l.add(third.id);
        seen.love.set(t.features.palace, l);
      } else {
        seen.tension.add(third.id);
      }
      if (t.bonus) seen.missing.add(t.bonus.id);
      i += 1;
    }
    for (const g of GODS) {
      expect(seen.pattern.get(g)?.size).toBe(DEFAULT_SIZES.pattern);
      expect(seen.love.get(g)?.size).toBe(DEFAULT_SIZES.love);
    }
    expect(seen.tension.size).toBe(DEFAULT_SIZES.tension);

    expect(seen.core.size).toBeGreaterThan(60);

    expect(seen.missing.size).toBeGreaterThanOrEqual(8);
  });

  it('같은 사람이라도 출생지가 다르면 시드가 달라진다 (같은 특징이어도 문장이 갈릴 수 있다)', () => {
    const base = realChart('1990-05-15', '10:00');
    const other = { ...base, input: { ...base.input, place: { ...base.input.place, name: 'Busan' } } };

    const big = makeLib({ core: 40, pattern: 40, love: 40, tension: 40, missing: 40 });
    const a = buildTraits(base, big);
    const b = buildTraits(other, big);
    expect(b.features).toEqual(a.features);
    expect(b.hits.map((h) => h.id)).not.toEqual(a.hits.map((h) => h.id));
  });
});

describe('dominant 분포 (월령 동점 처리)', () => {
  it('일주 60 x 연주 60 x 월 12 x 시 12 전수: 다섯 갈래가 각각 10~30%이고 한 갈래로 쏠리지 않는다', () => {
    const counts: Record<GodGroup, number> = { peer: 0, output: 0, wealth: 0, power: 0, resource: 0 };
    let n = 0;
    for (let y = 0; y < 60; y += 1) {
      for (let m = 0; m < 12; m += 1) {
        for (let d = 0; d < 60; d += 1) {
          for (const h of [0, 3, 6, 9]) {
            counts[traitFeatures(populationChart(y, m, d, h)).dominant] += 1;
            n += 1;
          }
        }
      }
    }
    for (const g of GODS) {
      expect(counts[g] / n, g).toBeGreaterThan(0.1);
      expect(counts[g] / n, g).toBeLessThan(0.3);
    }

    const shares = GODS.map((g) => counts[g] / n);
    expect(Math.max(...shares) - Math.min(...shares)).toBeLessThan(0.03);
  });

  it('시간을 모르는 차트도 다섯 갈래가 각각 10~30%', () => {
    const counts: Record<GodGroup, number> = { peer: 0, output: 0, wealth: 0, power: 0, resource: 0 };
    let n = 0;
    for (let y = 0; y < 60; y += 1) {
      for (let m = 0; m < 12; m += 1) {
        for (let d = 0; d < 60; d += 1) {
          counts[traitFeatures(populationChart(y, m, d, null)).dominant] += 1;
          n += 1;
        }
      }
    }
    for (const g of GODS) {
      expect(counts[g] / n, g).toBeGreaterThan(0.1);
      expect(counts[g] / n, g).toBeLessThan(0.3);
    }
  });

  it('동점에서는 월령(월지 본기)의 갈래가 이긴다: 己 일간의 酉월 (P06 己巳일 癸酉월)', () => {

    const chart = fakeChart({ year: '癸亥', month: '辛酉', day: '己巳' });
    const f = traitFeatures(chart);
    expect(f.dominant).toBe('output');

    expect(traitFeatures(fakeChart({ year: '癸亥', month: '癸酉', day: '己巳' })).dominant).toBe('wealth');
  });
});

describe('H2(숨은 패턴)와 H3(연애)가 같은 이야기를 되풀이하지 않는다', () => {

  const groupOf = (id: string) => /^(?:pattern|love)-([a-z]+)-/.exec(id)![1] as GodGroup;

  it('dominant와 palace가 같으면 H2는 둘째로 많은 갈래의 풀에서 고른다', () => {

    const chart = fakeChart({ year: '庚申', month: '壬子', day: '甲子' });
    const f = traitFeatures(chart);
    expect(f.dominant).toBe('resource');
    expect(f.palace).toBe('resource');
    expect(f.tension).toBe(false);
    expect(runnerUpOf(chart)).toBe('power');
    const t = buildTraits(chart, LIB);
    expect(groupOf(t.hits[1].id)).toBe('power');
    expect(t.hits[2].id.startsWith('love-resource-')).toBe(true);

    expect(t.features.dominant).toBe('resource');
  });

  it('시주가 있는데 둘째 갈래가 모두 한 글자뿐이면 H2는 dominant 풀 그대로다 (드문 경우)', () => {

    const chart = fakeChart({ year: '乙午', month: '戊寅', day: '甲寅', hour: '庚子' });
    const f = traitFeatures(chart);
    expect(f.dominant).toBe('peer');
    expect(f.palace).toBe('peer');
    expect(f.tension).toBe(false);
    expect(runnerUpOf(chart)).toBeNull();
    const t = buildTraits(chart, LIB);
    expect(groupOf(t.hits[1].id)).toBe('peer');
    expect(groupOf(t.hits[2].id)).toBe('peer');
  });

  it('시주를 모르면 한 글자짜리 둘째 갈래라도 H2를 거기서 고른다 (시간을 모르는 사람의 4분의 1이 같은 갈래를 두 번 듣지 않게)', () => {

    const chart = fakeChart({ year: '乙丑', month: '丙寅', day: '甲寅' });
    expect(traitFeatures(chart).dominant).toBe('peer');
    expect(traitFeatures(chart).palace).toBe('peer');
    expect(runnerUpOf(chart)).toBe('output');
    const t = buildTraits(chart, LIB);
    expect(groupOf(t.hits[1].id)).toBe('output');
    expect(groupOf(t.hits[2].id)).toBe('peer');
  });

  it('일지가 충이면 H3가 tension이라 H2는 그대로 dominant 풀이다', () => {

    const chart = fakeChart({ year: '壬子', month: '壬午', day: '甲子' });
    const f = traitFeatures(chart);
    expect(f.tension).toBe(true);
    const t = buildTraits(chart, LIB);
    expect(t.hits[2].kind).toBe('tension');
    expect(groupOf(t.hits[1].id)).toBe(f.dominant);
  });

  it('H3가 love이고 둘째 갈래가 있는 모든 차트에서 H2와 H3의 풀 갈래가 다르다 (전수)', () => {
    let n = 0;
    let same = 0;
    let sameWithRunnerUp = 0;
    for (let y = 0; y < 60; y += 1) {
      for (let m = 0; m < 12; m += 1) {
        for (let d = 0; d < 60; d += 1) {
          const h = (y * 7 + m * 5 + d) % 13;
          const chart = populationChart(y, m, d, h === 12 ? null : h);
          const t = buildTraits(chart, LIB);
          if (t.hits[2].kind !== 'love') continue;
          n += 1;
          if (groupOf(t.hits[1].id) === groupOf(t.hits[2].id)) {
            same += 1;
            if (runnerUpOf(chart)) sameWithRunnerUp += 1;
          }
        }
      }
    }
    expect(n).toBeGreaterThan(30_000);

    expect(sameWithRunnerUp).toBe(0);

    expect(same / n).toBeLessThan(0.07);
  });
});

describe('ageAt (만 나이)', () => {
  it('생일 전날은 한 살 적고 생일 당일에 한 살 늘어난다', () => {
    expect(ageAt('2000-06-15', '2015-06-14T23:59:59Z')).toBe(14);
    expect(ageAt('2000-06-15', '2015-06-15T00:00:00Z')).toBe(15);
    expect(ageAt('2000-06-15', '2016-01-01T00:00:00Z')).toBe(15);
  });

  it('2월 29일생은 평년에 3월 1일에 한 살을 더한다', () => {
    expect(ageAt('2000-02-29', '2015-02-28T12:00:00Z')).toBe(14);
    expect(ageAt('2000-02-29', '2015-03-01T00:00:00Z')).toBe(15);
    expect(ageAt('2000-02-29', '2016-02-29T00:00:00Z')).toBe(16);
  });

  it('태어나기 전이거나 갓난아기면 0 이하', () => {
    expect(ageAt('2000-06-15', '2000-06-15T00:00:00Z')).toBe(0);
    expect(ageAt('2000-06-15', '2000-06-14T00:00:00Z')).toBe(-1);
  });

  it('ISO가 아니면 RangeError', () => {
    expect(() => ageAt('2000-06-15', 'not a date')).toThrow(RangeError);
  });
});

const CYCLES = ['辛卯', '壬辰', '癸巳', '甲午', '乙未', '丙申', '丁酉', '戊戌'];
const CYCLE_GROUPS: GodGroup[] = ['output', 'wealth', 'wealth', 'power', 'power', 'resource', 'resource', 'peer'];

function chapterChart(): Chart {
  return fakeChart({
    year: '庚辰',
    month: '壬午',
    day: '戊戌',
    date: '2000-06-15',
    daYun: {
      forward: true,
      startAge: 5,
      list: CYCLES.map((ganzhi, i) => ({ startAge: 5 + i * 10, startYear: 2005 + i * 10, ganzhi })),
    },
  });
}

describe('currentChapter', () => {
  const chart = chapterChart();

  const lib = LIB;

  it('대운이 없으면(성별 미선택) null', () => {
    expect(currentChapter(fakeChart({ year: '庚辰', month: '壬午', day: '戊戌' }), '2026-10-15T00:00:00Z', lib)).toBeNull();
    expect(currentChapter(realChart('2001-02-04', '04:10'), '2026-10-15T00:00:00Z', lib)).toBeNull();
  });

  it('대운 목록이 비어 있어도 null', () => {
    const empty = fakeChart({ year: '庚辰', month: '壬午', day: '戊戌', daYun: { forward: true, startAge: 5, list: [] } });
    expect(currentChapter(empty, '2026-10-15T00:00:00Z', lib)).toBeNull();
  });

  it('첫 대운이 시작하기 전이면 index 0에 beforeStart', () => {
    for (const now of ['2000-06-15T00:00:00Z', '2005-06-14T23:59:59Z']) {
      const c = currentChapter(chart, now, lib);
      expect(c?.index).toBe(0);
      expect(c?.beforeStart).toBe(true);
      expect(c?.startAge).toBe(5);
      expect(c?.ganzhi).toBe('辛卯');
      expect(c?.next).toEqual({ title: 'Title wealth', startAge: 15 });
    }

    expect(currentChapter(chart, '1999-01-01T00:00:00Z', lib)?.beforeStart).toBe(true);
  });

  it('만 5세 생일에 첫 장이 열리고 beforeStart는 없다', () => {
    const c = currentChapter(chart, '2005-06-15T00:00:00Z', lib);
    expect(c?.index).toBe(0);
    expect(c && 'beforeStart' in c).toBe(false);
  });

  it('장의 모든 필드: 만 나이로 현재 장을 찾고, 장마다 열 해', () => {
    for (let i = 0; i < CYCLES.length; i += 1) {
      const startAge = 5 + i * 10;
      const cases = [
        `${2000 + startAge}-06-15T00:00:00Z`,
        `${2000 + startAge + 10}-06-14T00:00:00Z`,
      ];
      for (const now of cases) {
        const c = currentChapter(chart, now, lib);
        expect(c).toMatchObject({
          index: i,
          total: 8,
          startAge,
          endAge: startAge + 9,
          startYear: 2005 + i * 10,
          endYear: 2005 + i * 10 + 9,
          ganzhi: CYCLES[i],
          group: CYCLE_GROUPS[i],
          title: `Title ${CYCLE_GROUPS[i]}`,
          line: `Line ${CYCLE_GROUPS[i]}.`,
        });
        expect(c?.beforeStart).toBeUndefined();
        if (i < CYCLES.length - 1) {
          expect(c?.next).toEqual({ title: `Title ${CYCLE_GROUPS[i + 1]}`, startAge: startAge + 10 });
        } else {
          expect(c?.next).toBeNull();
        }
      }
    }
  });

  it('장 경계: 만 14세 마지막 날은 첫 장, 만 15세 생일은 둘째 장', () => {
    expect(currentChapter(chart, '2015-06-14T00:00:00Z', lib)?.index).toBe(0);
    expect(currentChapter(chart, '2015-06-15T00:00:00Z', lib)?.index).toBe(1);
  });

  it('마지막 장이 끝난 뒤에도 마지막 장을 돌려주고 next는 null', () => {
    const c = currentChapter(chart, '2100-01-01T00:00:00Z', lib);
    expect(c?.index).toBe(7);
    expect(c?.next).toBeNull();
    expect(c?.startAge).toBe(75);
  });

  it('진짜 엔진 차트: 2001-02-04 04:10 서울 여성, 2026-10-15 현재 만 25세 = 둘째 장 壬辰', () => {
    const real = realChart('2001-02-04', '04:10', 'female');
    expect(real.daYun?.startAge).toBe(9);
    const c = currentChapter(real, '2026-10-15T00:00:00Z', lib);
    expect(c).toMatchObject({
      index: 1,
      total: 8,
      startAge: 19,
      endAge: 28,
      ganzhi: '壬辰',
      group: 'wealth',
      title: 'Title wealth',
    });
    expect(c?.endYear).toBe((c?.startYear ?? 0) + 9);
    expect(c?.next).toEqual({ title: 'Title wealth', startAge: 29 });

    const maleChart = realChart('2001-02-04', '04:10', 'male');
    expect(maleChart.daYun?.startAge).toBe(0);
    const male = currentChapter(maleChart, '2026-10-15T00:00:00Z', lib);
    expect(male).toMatchObject({ index: 2, ganzhi: '丁亥', group: 'resource', startAge: 20, endAge: 29 });
    expect(male?.beforeStart).toBeUndefined();
  });

  it('진짜 엔진 차트: 성별을 고르기 전에는 null, 고르면 장이 나온다', () => {
    expect(currentChapter(realChart('1993-11-02', '07:30', null), '2026-10-15T00:00:00Z', lib)).toBeNull();
    const c = currentChapter(realChart('1993-11-02', '07:30', 'male'), '2026-10-15T00:00:00Z', lib);
    expect(c).not.toBeNull();
    expect(c && c.index >= 0 && c.index < c.total).toBe(true);
  });

  it('대운 천간의 십신 갈래는 독립 기준과 같다 (진짜 차트 표본)', () => {
    let seed = 20261015;
    const rand = (n: number) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed % n;
    };
    for (let i = 0; i < 60; i += 1) {
      const date = new Date(Date.UTC(1950 + rand(60), rand(12), 1 + rand(28))).toISOString().slice(0, 10);
      const real = realChart(date, '12:00', rand(2) === 0 ? 'female' : 'male');
      const yun = real.daYun;
      expect(yun).not.toBeNull();
      const me = real.dayMaster.element;
      const starts = chapterStartDates(real);
      expect(starts).not.toBeNull();
      for (const [k, cycle] of (yun?.list ?? []).entries()) {

        const c = currentChapter(real, `${starts![k]}T12:00:00Z`, lib);
        expect(c?.index).toBe(k);
        const stemElement = pillarFromGanzhi(cycle.ganzhi).stemElement;
        expect(c?.group).toBe(relOf(me, stemElement));
      }
    }
  });

  it('chapterStartDates: 진짜 차트의 장 시작일은 목록과 같은 순서, 10년 간격, 대운 시작 연도와 같은 해', () => {
    for (const [date, time, sex] of [
      ['2001-02-04', '04:10', 'female'],
      ['2001-02-04', '04:10', 'male'],
      ['1984-02-29', '13:05', 'female'],
      ['1969-07-20', null, 'male'],
    ] as const) {
      const real = realChart(date, time, sex);
      const starts = chapterStartDates(real)!;
      expect(starts).toHaveLength(real.daYun!.list.length);
      starts.forEach((d, i) => {
        expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Number(d.slice(0, 4)), `${date} ${sex} ${i}`).toBe(real.daYun!.list[i].startYear);

        if (i > 0) expect(d.slice(5) === starts[0].slice(5) || starts[0].slice(5) === '02-29').toBe(true);
        if (i > 0) expect(d > starts[i - 1]).toBe(true);
      });

      expect(starts[0] > date).toBe(true);
    }
  });

  it('chapterStartDates: 대운이 없거나 성별 없는 손으로 만든 차트는 null (그러면 만 나이로 비교한다)', () => {
    expect(chapterStartDates(realChart('2001-02-04', '04:10', null))).toBeNull();
    expect(chapterStartDates(chapterChart())).toBeNull();
  });

  it('회귀(P04): 2003-01-17 시드니 여성은 3번째 장이 2026-10-20에 열린다. 10월 15일에는 아직 2번째 장이다', () => {
    const sydney = { name: 'Sydney', country: 'AU', lat: -33.87, lng: 151.21, tz: 'Australia/Sydney' };
    const p04 = computeChart({ date: '2003-01-17', time: null, place: sydney, sex: 'female' });
    expect(chapterStartDates(p04)![2]).toBe('2026-10-20');

    expect(ageAt('2003-01-17', '2026-10-15T00:00:00Z')).toBe(23);
    expect(p04.daYun!.list[2].startAge).toBe(23);
    const before = currentChapter(p04, '2026-10-15T00:00:00Z', lib)!;
    expect(before.index).toBe(1);
    expect(before.beforeStart).toBeUndefined();
    expect(currentChapter(p04, '2026-10-19T23:59:59Z', lib)!.index).toBe(1);
    const after = currentChapter(p04, '2026-10-20T00:00:00Z', lib)!;
    expect(after.index).toBe(2);
    expect(after.startAge).toBe(23);
    expect(after.startYear).toBe(2026);
  });

  it('회귀(P03): 1995-12-02 런던 여성은 4번째 장이 2027-08-14에 열린다. 2026-12-10에는 아직 3번째 장이다', () => {
    const london = { name: 'London', country: 'GB', lat: 51.5, lng: -0.12, tz: 'Europe/London' };
    const p03 = computeChart({ date: '1995-12-02', time: null, place: london, sex: 'female' });
    expect(chapterStartDates(p03)![3]).toBe('2027-08-14');

    expect(ageAt('1995-12-02', '2026-12-10T00:00:00Z')).toBe(31);
    expect(p03.daYun!.list[3].startAge).toBe(31);
    const c = currentChapter(p03, '2026-12-10T00:00:00Z', lib)!;
    expect(c.index).toBe(2);
    expect(c.endYear).toBeGreaterThanOrEqual(2026);
    expect(c.startYear).toBeLessThanOrEqual(2026);
    expect(currentChapter(p03, '2027-08-13T12:00:00Z', lib)!.index).toBe(2);
    const next = currentChapter(p03, '2027-08-14T00:00:00Z', lib)!;
    expect(next.index).toBe(3);
    expect(next.startYear).toBe(2027);
  });

  it('beforeStart도 시작일로 판정한다: 첫 장이 열리는 날 전날까지', () => {
    const sydney = { name: 'Sydney', country: 'AU', lat: -33.87, lng: 151.21, tz: 'Australia/Sydney' };
    const p = computeChart({ date: '2003-01-17', time: null, place: sydney, sex: 'female' });
    const first = chapterStartDates(p)![0];
    expect(first).toBe('2006-10-20');
    const early = currentChapter(p, '2006-06-01T00:00:00Z', lib)!;
    expect(early.index).toBe(0);
    expect(early.beforeStart).toBe(true);
    expect(currentChapter(p, '2006-10-19T00:00:00Z', lib)!.beforeStart).toBe(true);
    expect(currentChapter(p, '2006-10-20T00:00:00Z', lib)!.beforeStart).toBeUndefined();
  });

  it('진짜 차트 표본: 현재 장은 늘 시작일이 지났고 다음 장은 아직 안 열렸다 (장이 일찍 바뀌지 않는다)', () => {
    let early = 0;
    let n = 0;
    for (let ms = Date.UTC(1950, 0, 1); ms < Date.UTC(2010, 0, 1); ms += 37 * 86_400_000) {
      const date = new Date(ms).toISOString().slice(0, 10);
      const real = realChart(date, '09:30', n % 2 ? 'male' : 'female');
      const starts = chapterStartDates(real)!;
      for (const now of ['2026-10-15T00:00:00Z', '2026-12-10T00:00:00Z', '2027-08-14T00:00:00Z']) {
        const c = currentChapter(real, now, lib)!;
        const today = now.slice(0, 10);
        if (!c.beforeStart) expect(starts[c.index] <= today, `${date} ${now}`).toBe(true);
        if (c.index + 1 < starts.length) expect(starts[c.index + 1] > today, `${date} ${now}`).toBe(true);

        const age = ageAt(date, now);
        let oldIndex = 0;
        real.daYun!.list.forEach((cy, i) => {
          if (cy.startAge <= age) oldIndex = i;
        });
        if (oldIndex !== c.index) early += 1;
        n += 1;
      }
    }

    expect(early).toBeGreaterThan(0);
    expect(early / n).toBeLessThan(0.15);
  });

  it('음양까지 나눈 10종 제목(chapters10)이 있으면 그것을 쓰고, 대운 천간이 일간과 음양이 같은지 samePolarity로 알려 준다', () => {
    const lib10 = makeLib10();

    const c0 = currentChapter(chapterChart(), '2005-06-15T00:00:00Z', lib10)!;
    expect(c0.ganzhi).toBe('辛卯');
    expect(c0.group).toBe('output');
    expect(c0.samePolarity).toBe(false);
    expect(c0.title).toBe('Title output other');
    expect(c0.line).toBe('Line output other.');

    expect(c0.next).toEqual({ title: 'Title wealth same', startAge: 15 });
    const c2 = currentChapter(chapterChart(), '2025-06-15T00:00:00Z', lib10)!;
    expect(c2.ganzhi).toBe('癸巳');
    expect(c2.samePolarity).toBe(false);
    expect(c2.title).toBe('Title wealth other');

    const c3 = currentChapter(chapterChart(), '2035-06-15T00:00:00Z', lib10)!;
    expect(c3.ganzhi).toBe('甲午');
    expect(c3.samePolarity).toBe(true);
    expect(c3.title).toBe('Title power same');
  });

  it('chapters10이 없으면(또는 그 칸이 비면) 갈래별 chapters로 돌아가고, samePolarity는 그래도 알려 준다', () => {
    const c = currentChapter(chapterChart(), '2025-06-15T00:00:00Z', LIB)!;
    expect(c.title).toBe('Title wealth');
    expect(c.samePolarity).toBe(false);
    const partial = { ...makeLib10(), chapters10: { ...makeLib10().chapters10!, wealth: undefined } } as unknown as TraitLibrary;
    expect(currentChapter(chapterChart(), '2025-06-15T00:00:00Z', partial)!.title).toBe('Title wealth');
  });

  it('진짜 문장 라이브러리: 이웃한 두 장의 제목은 절대 같지 않다 (이어지는 천간은 음양이 번갈아 온다)', () => {
    let n = 0;
    for (let ms = Date.UTC(1940, 0, 1); ms < Date.UTC(2015, 0, 1); ms += 29 * 86_400_000) {
      const date = new Date(ms).toISOString().slice(0, 10);
      const real = realChart(date, '09:30', n % 2 ? 'male' : 'female');
      const list = real.daYun!.list;
      for (let k = 0; k + 1 < list.length; k += 1) {
        const starts = chapterStartDates(real)!;
        const a = currentChapter(real, `${starts[k]}T12:00:00Z`, TRAITS)!;
        expect(a.next, `${date} ${k}`).not.toBeNull();
        expect(a.next!.title, `${date} ${k}`).not.toBe(a.title);
        expect(a.title).toMatch(/^The Chapter of /);
      }
      n += 1;
    }
    expect(n).toBeGreaterThan(900);
  });

  it('잘못된 지금이면 RangeError, 라이브러리에 갈래 문구가 없어도 RangeError', () => {
    expect(() => currentChapter(chart, 'tomorrow', lib)).toThrow(RangeError);
    const broken = { ...lib, chapters: { ...lib.chapters, power: undefined } } as unknown as TraitLibrary;

    expect(() => currentChapter(chart, '2035-06-15T00:00:00Z', broken)).toThrow(RangeError);
    expect(() => currentChapter(chart, '2025-06-15T00:00:00Z', broken)).toThrow(RangeError);
  });

  it('순수함: 얼린 차트를 건드리지 않고 Date.now를 부르지 않는다', () => {
    const spy = vi.spyOn(Date, 'now');
    try {
      const frozen = deepFreeze(chapterChart());
      const a = currentChapter(frozen, '2026-10-15T00:00:00Z', deepFreeze(makeLib()));
      expect(currentChapter(chapterChart(), '2026-10-15T00:00:00Z', lib)).toEqual(a);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('index 재수출', () => {
  it('@/lib/reading에서 buildTraits와 currentChapter를 쓸 수 있다', () => {
    expect(buildTraitsFromIndex).toBe(buildTraits);
    expect(currentChapterFromIndex).toBe(currentChapter);
  });
});
