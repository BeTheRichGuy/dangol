import { pairScore } from './pair-score';
import { chapterStartDates } from '@/lib/reading/chapter-dates';
import { ageAt, helpShare, traitFeatures } from '@/lib/reading/traits';
import { jieInstantMs, lunarAtCst } from '@/lib/saju/calendar';
import {
  branchGod,
  relationsAmong,
  shinsalOf,
  stageOf,
  tenGod,
  HIDDEN_STEMS,
  type PlacedChar,
  type PlacedPillar,
  type Relation,
  type Shinsal,
  type Stage,
  type TenGod,
  yearGanzhi,
} from '@/lib/saju/details';
import { godGroup, JIE_TABLE, jieIndex, pillarFromGanzhi, typeOfStem } from '@/lib/saju/tables';
import type { Branch, Chart, Element, GodGroup, Polarity, Stem, TypeKey } from '@/lib/saju/types';
import type { TraitStrength } from '@/lib/reading/traits-types';
import type { Locale } from '@/content/locale';
import type { ReunionIntake } from '@/lib/reunion/intake';
import { ROOMS, YEAR_ROOM_YEAR, type PairKind, type ProductKey } from './themes';
import type { XmasRelation } from '@/lib/xmas/relation';

export type PillarAt = 'year' | 'month' | 'day' | 'hour';

export type NatalCore = Pick<Chart, 'pillars' | 'dayMaster' | 'elements' | 'flags'>;

export function natalCore(ganzhi: { year: string; month: string; day: string; hour: string | null }, flags: Chart['flags']): NatalCore {
  const year = pillarFromGanzhi(ganzhi.year);
  const month = pillarFromGanzhi(ganzhi.month);
  const day = pillarFromGanzhi(ganzhi.day);
  const hour = ganzhi.hour ? pillarFromGanzhi(ganzhi.hour) : null;
  const elements: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const p of hour ? [year, month, day, hour] : [year, month, day]) {
    elements[p.stemElement] += 1;
    elements[p.branchElement] += 1;
  }
  return {
    pillars: { year, month, day, hour },
    dayMaster: { stem: day.stem, element: day.stemElement, polarity: day.stemPolarity, type: typeOfStem(day.stem) },
    elements,
    flags: { ...flags },
  };
}

export interface PillarInfo {
  at: PillarAt;
  ganzhi: string;
  stem: Stem;
  branch: Branch;
  stemElement: Element;
  branchElement: Element;
  polarity: Polarity;

  stemGod: TenGod | 'self';
  branchGod: TenGod;

  hidden: { stem: Stem; god: TenGod }[];

  stage: Stage;
}

export interface ChartBlock {
  pillars: PillarInfo[];
  dayMaster: { stem: Stem; element: Element; polarity: Polarity; type: TypeKey };

  elements: Record<Element, number>;

  godCounts: Record<GodGroup, number>;
  strength: TraitStrength;

  helpShare: number;
  dominant: GodGroup;

  palace: GodGroup;

  missing: Element[];

  season: 'spring' | 'summer' | 'autumn' | 'winter';

  relations: Relation[];
  shinsal: Shinsal[];
  flags: { timeUnknown: boolean; ziHourAmbiguous: boolean; altType: TypeKey | null; nearJieqiBoundary: boolean };
}

export interface LuckPillar {
  ganzhi: string;
  stemGod: TenGod;
  branchGod: TenGod;
  stage: Stage;

  relations: Relation[];

  shinsal: string[];
}

export interface LuckPeriod extends LuckPillar {

  number: number;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;

  startMonth: string | null;
}

export interface LuckBlock {
  forward: boolean;
  periods: LuckPeriod[];

  current: number | null;
}

export interface YearLuck extends LuckPillar {
  year: number;

  age: number;

  period: string | null;
}

export interface MonthLuck extends LuckPillar {

  month: string;

  term: { name: string; hanzi: string; date: string };
}

export interface CrossBlock {

  dayStems: {
    self: Stem;
    other: Stem;

    otherToSelf: TenGod;

    selfToOther: TenGod;
    flow: 'same' | 'self-feeds-other' | 'other-feeds-self' | 'self-checks-other' | 'other-checks-self';
    combine: boolean;
    clash: boolean;
  };

  relations: Relation[];

  fills: { selfMissingOtherHas: Element[]; otherMissingSelfHas: Element[] };

  score: number;
}

export interface RoomPayload {
  room: ProductKey;
  locale: Locale;

  today: string;

  age: number;

  now: { term: string; termHanzi: string; yearGanzhi: string; monthGanzhi: string };
  self: ChartBlock;
  luck: LuckBlock | null;
  years: YearLuck[];
  months: MonthLuck[];
  partner: { kind: PairKind; age: number; chart: ChartBlock; luck: LuckBlock | null; years: YearLuck[]; cross: CrossBlock } | null;

  question: string;

  reunion?: ReunionIntake;

  edition?: 'xmas';

  xmas?: XmasRelation;

  quiz?: string;
}

const AT_ORDER: readonly PillarAt[] = ['year', 'month', 'day', 'hour'];
const ELEMENTS: readonly Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
const SEASON: Record<Branch, ChartBlock['season']> = {
  寅: 'spring', 卯: 'spring', 辰: 'spring',
  巳: 'summer', 午: 'summer', 未: 'summer',
  申: 'autumn', 酉: 'autumn', 戌: 'autumn',
  亥: 'winter', 子: 'winter', 丑: 'winter',
};

export function pillarsOf(chart: NatalCore): { at: PillarAt; stem: Stem; branch: Branch; ganzhi: string }[] {
  return AT_ORDER.flatMap((at) => {
    const p = chart.pillars[at];
    return p ? [{ at, stem: p.stem, branch: p.branch, ganzhi: p.ganzhi }] : [];
  });
}

export function charsOf(pillars: readonly PlacedPillar[], prefix = ''): PlacedChar[] {
  return pillars.flatMap((p) => [
    { at: prefix + p.at, char: p.stem },
    { at: prefix + p.at, char: p.branch },
  ]);
}

export function chartBlock(chart: NatalCore): ChartBlock {
  const me = chart.dayMaster.stem;
  const placed = pillarsOf(chart);
  const pillars: PillarInfo[] = placed.map(({ at, stem, branch, ganzhi }) => {
    const p = pillarFromGanzhi(ganzhi);
    return {
      at,
      ganzhi,
      stem,
      branch,
      stemElement: p.stemElement,
      branchElement: p.branchElement,
      polarity: p.stemPolarity,
      stemGod: at === 'day' ? 'self' : tenGod(me, stem),
      branchGod: branchGod(me, branch),
      hidden: HIDDEN_STEMS[branch].map((s) => ({ stem: s, god: tenGod(me, s) })),
      stage: stageOf(me, branch),
    };
  });

  const godCounts: Record<GodGroup, number> = { peer: 0, output: 0, wealth: 0, power: 0, resource: 0 };
  for (const p of pillars) {
    if (p.at !== 'day') godCounts[godGroup(chart.dayMaster.element, p.stemElement)] += 1;
    godCounts[godGroup(chart.dayMaster.element, p.branchElement)] += 1;
  }

  const features = traitFeatures(chart);
  return {
    pillars,
    dayMaster: { ...chart.dayMaster },
    elements: { ...chart.elements },
    godCounts,
    strength: features.strength,
    helpShare: Math.round(helpShare(chart) * 100) / 100,
    dominant: features.dominant,
    palace: features.palace,
    missing: ELEMENTS.filter((e) => chart.elements[e] === 0),
    season: SEASON[chart.pillars.month.branch],
    relations: relationsAmong(charsOf(placed)),
    shinsal: shinsalOf(placed),
    flags: { ...chart.flags },
  };
}

export function luckPillar(chart: NatalCore, ganzhi: string, at: string): LuckPillar {
  const me = chart.dayMaster.stem;
  const p = pillarFromGanzhi(ganzhi);
  const placed = pillarsOf(chart);
  const target: PlacedPillar = { at, stem: p.stem, branch: p.branch };
  return {
    ganzhi,
    stemGod: tenGod(me, p.stem),
    branchGod: branchGod(me, p.branch),
    stage: stageOf(me, p.branch),
    relations: relationsAmong([...charsOf(placed), ...charsOf([target])], at),
    shinsal: shinsalOf(placed, [target]).map((s) => s.name),
  };
}

export function luckBlock(chart: Chart, nowIso: string): LuckBlock | null {
  const yun = chart.daYun;
  if (!yun || yun.list.length === 0) return null;
  const starts = chapterStartDates(chart);
  const today = nowIso.slice(0, 10);
  const age = ageAt(chart.input.date, nowIso);
  let current: number | null = null;
  yun.list.forEach((cycle, i) => {
    const started = starts ? starts[i] <= today : cycle.startAge <= age;
    if (started) current = i + 1;
  });
  return {
    forward: yun.forward,
    current,
    periods: yun.list.map((cycle, i) => ({
      ...luckPillar(chart, cycle.ganzhi, 'daeyun'),
      number: i + 1,
      startAge: cycle.startAge,
      endAge: cycle.startAge + 9,
      startYear: cycle.startYear,
      endYear: cycle.startYear + 9,
      startMonth: starts ? starts[i].slice(0, 7) : null,
    })),
  };
}

export function periodAt(luck: LuckBlock | null, year: number): string | null {
  if (!luck) return null;
  const hit = luck.periods.filter((p) => p.startYear <= year).pop();
  return hit ? hit.ganzhi : null;
}

export function yearLucks(chart: Chart, luck: LuckBlock | null, from: number, to: number): YearLuck[] {
  const birthYear = Number(chart.input.date.slice(0, 4));
  const out: YearLuck[] = [];
  for (let year = from; year <= to; year += 1) {
    out.push({ ...luckPillar(chart, yearGanzhi(year), 'yearLuck'), year, age: year - birthYear, period: periodAt(luck, year) });
  }
  return out;
}

export function monthLucks(chart: NatalCore, startYear: number, startMonth: number, count: number): MonthLuck[] {
  const out: MonthLuck[] = [];
  for (let i = 0; i < count; i += 1) {
    const y = startYear + Math.floor((startMonth - 1 + i) / 12);
    const m = ((startMonth - 1 + i) % 12) + 1;
    const lunar = lunarAtCst(Date.UTC(y, m - 1, 20));
    const jie = lunar.getPrevJie();
    if (!jie) continue;
    const info = JIE_TABLE[jieIndex(jie.getName())];
    const date = new Date(jieInstantMs(jie) + 8 * 3600_000).toISOString().slice(0, 10);
    const month = `${y}-${String(m).padStart(2, '0')}`;
    out.push({
      ...luckPillar(chart, lunar.getMonthInGanZhiExact(), 'monthLuck'),
      month,
      term: { name: info.name, hanzi: info.hanzi, date },
    });
  }
  return out;
}

const FEEDS: Record<Element, Element> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const CHECKS: Record<Element, Element> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

function crossParts(self: NatalCore, other: NatalCore): Omit<CrossBlock, 'score'> {
  const a = self.dayMaster;
  const b = other.dayMaster;
  const flow: CrossBlock['dayStems']['flow'] =
    a.element === b.element
      ? 'same'
      : FEEDS[a.element] === b.element
        ? 'self-feeds-other'
        : FEEDS[b.element] === a.element
          ? 'other-feeds-self'
          : CHECKS[a.element] === b.element
            ? 'self-checks-other'
            : 'other-checks-self';
  const selfChars = charsOf(pillarsOf(self), 'self.');
  const otherChars = charsOf(pillarsOf(other), 'other.');
  const relations = relationsAmong([...selfChars, ...otherChars]).filter(
    (r) => r.at.some((x) => x.startsWith('self.')) && r.at.some((x) => x.startsWith('other.')),
  );
  const dayPair = relationsAmong([
    { at: 'self.day', char: a.stem },
    { at: 'other.day', char: b.stem },
  ]);
  return {
    dayStems: {
      self: a.stem,
      other: b.stem,
      otherToSelf: tenGod(a.stem, b.stem),
      selfToOther: tenGod(b.stem, a.stem),
      flow,
      combine: dayPair.some((r) => r.kind === '天干合'),
      clash: dayPair.some((r) => r.kind === '天干沖'),
    },
    relations,
    fills: {
      selfMissingOtherHas: ELEMENTS.filter((e) => self.elements[e] === 0 && other.elements[e] > 0),
      otherMissingSelfHas: ELEMENTS.filter((e) => other.elements[e] === 0 && self.elements[e] > 0),
    },
  };
}

export function crossBlock(self: NatalCore, other: NatalCore): CrossBlock {
  const parts = crossParts(self, other);
  return { ...parts, score: pairScore(parts, crossParts(other, self)) };
}

export interface PayloadInput {
  room: ProductKey;
  locale: Locale;
  chart: Chart;
  nowIso: string;
  question?: string;
  partner?: { chart: Chart; kind: PairKind } | null;

  reunion?: ReunionIntake;

  edition?: 'xmas';

  xmas?: XmasRelation;
  quiz?: string;
}

export function roomSpan(
  room: ProductKey,
  thisYear: number,
  thisMonth: number,
  luck: LuckBlock | null,
): { years: [number, number]; months: { startYear: number; startMonth: number; count: number } | null } {
  switch (room) {
    case 'life':

      return { years: [thisYear, thisYear + 4], months: null };
    case 'match':
    case 'reunion':

      return { years: [thisYear, thisYear + 2], months: null };
    case 'decades': {

      const cur = luck && luck.current ? luck.periods[luck.current - 1] : null;
      const span = cur ?? luck?.periods[0] ?? null;
      return { years: span ? [span.startYear, span.endYear] : [thisYear, thisYear + 9], months: null };
    }
    case 'love':
      return { years: [thisYear, thisYear + 6], months: { startYear: thisYear, startMonth: thisMonth, count: 12 } };
    case 'year':
      return { years: [YEAR_ROOM_YEAR - 1, YEAR_ROOM_YEAR + 1], months: { startYear: YEAR_ROOM_YEAR, startMonth: 1, count: 13 } };
  }
}

export function buildRoomPayload(input: PayloadInput): RoomPayload {
  const { room, chart, nowIso } = input;
  const thisYear = Number(nowIso.slice(0, 4));
  const thisMonth = Number(nowIso.slice(5, 7));
  const luck = luckBlock(chart, nowIso);
  const span = roomSpan(room, thisYear, thisMonth, luck);
  const years: YearLuck[] = yearLucks(chart, luck, span.years[0], span.years[1]);
  const months: MonthLuck[] = span.months ? monthLucks(chart, span.months.startYear, span.months.startMonth, span.months.count) : [];

  const season = lunarAtCst(Date.parse(nowIso));
  const prev = season.getPrevJie();
  const term = prev ? JIE_TABLE[jieIndex(prev.getName())] : null;

  const xmas = isXmasEdition(room, input.locale, input.edition);
  let partner: RoomPayload['partner'] = null;

  if ((ROOMS[room].needsPartner || xmas) && input.partner) {
    const other = input.partner.chart;
    const otherLuck = luckBlock(other, nowIso);
    partner = {
      kind: input.partner.kind,
      age: ageAt(other.input.date, nowIso),
      chart: chartBlock(other),
      luck: otherLuck,
      years: yearLucks(other, otherLuck, thisYear, thisYear + 2),
      cross: crossBlock(chart, other),
    };
  }

  return {
    room,
    locale: input.locale,
    today: nowIso.slice(0, 10),
    age: ageAt(chart.input.date, nowIso),
    now: {
      term: term?.name ?? '',
      termHanzi: term?.hanzi ?? '',
      yearGanzhi: season.getYearInGanZhiExact(),
      monthGanzhi: season.getMonthInGanZhiExact(),
    },
    self: chartBlock(chart),
    luck,
    years,
    months,
    partner,
    question: (input.question ?? '').trim().slice(0, 300),
    ...(room === 'reunion' && input.reunion ? { reunion: input.reunion } : {}),
    ...(xmas ? { edition: 'xmas' as const } : {}),
    ...(xmas && input.xmas ? { xmas: input.xmas } : {}),
    ...(xmas && input.quiz ? { quiz: input.quiz } : {}),
  };
}

export function isXmasEdition(room: ProductKey, _locale: Locale, edition: unknown): boolean {
  return edition === 'xmas' && room === 'love';
}

export function xmasChapters(p: { edition?: 'xmas'; locale: Locale }): boolean {
  return p.edition === 'xmas';
}
