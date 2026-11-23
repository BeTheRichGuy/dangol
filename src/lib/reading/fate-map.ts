import { favorableElement } from '@/lib/ai/favorable';
import { relationsAmong, yearGanzhi, type TenGod } from '@/lib/saju/details';
import { pillarFromGanzhi } from '@/lib/saju/tables';
import type { Branch, Chart, Element, GodGroup } from '@/lib/saju/types';
import { ageAt } from './traits';
import { chartBlock, luckBlock, monthLucks, natalCore, yearLucks, type ChartBlock, type LuckBlock, type LuckPillar, type MonthLuck, type NatalCore, type YearLuck } from '@/lib/rooms/payload';

const CYCLE: readonly Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

const GROUP_OF: Record<TenGod, GodGroup> = {
  比肩: 'peer', 劫財: 'peer', 食神: 'output', 傷官: 'output', 偏財: 'wealth', 正財: 'wealth', 偏官: 'power', 正官: 'power', 偏印: 'resource', 正印: 'resource',
};

const at = (e: Element) => CYCLE.indexOf(e);
const feeds = (a: Element, b: Element) => CYCLE[(at(a) + 1) % 5] === b;
const checks = (a: Element, b: Element) => CYCLE[(at(a) + 2) % 5] === b;

export function elementFit(e: Element, favorable: Element): number {
  if (e === favorable) return 2;
  if (feeds(e, favorable)) return 1;
  if (feeds(favorable, e)) return 0;
  if (checks(favorable, e)) return -0.5;
  if (checks(e, favorable)) return -1.5;
  return 0;
}

function pillarFit(ganzhi: string, favorable: Element): number {
  const p = pillarFromGanzhi(ganzhi);
  return (elementFit(p.stemElement, favorable) + elementFit(p.branchElement, favorable)) / 2;
}

const CLASH: ReadonlySet<string> = new Set(['沖']);
const HARMONY: ReadonlySet<string> = new Set(['六合', '半合', '三合']);

function hasRel(p: LuckPillar, kinds: ReadonlySet<string>, seat: string): boolean {
  return p.relations.some((r) => kinds.has(r.kind) && r.at.includes(seat));
}

export type FlowLevel = 'high' | 'mid' | 'low';

export interface FlowPoint {
  number: number;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;

  startMonth: string | null;

  score: number;
  level: FlowLevel;

  group: GodGroup;
  current: boolean;
}

export type StageKey = 'early' | 'youth' | 'middle' | 'late';

export interface FlowStage {
  key: StageKey;
  fromAge: number;
  toAge: number;
  score: number;
  level: FlowLevel;

  current: boolean;
}

export interface FlowMap {
  points: FlowPoint[];
  stages: FlowStage[];

  best: FlowPoint;
  hardest: FlowPoint;

  age: number;
}

const STAGE_RANGE: ReadonlyArray<{ key: StageKey; from: number; to: number }> = [
  { key: 'early', from: 0, to: 19 },
  { key: 'youth', from: 20, to: 39 },
  { key: 'middle', from: 40, to: 59 },
  { key: 'late', from: 60, to: 99 },
];

export function levelOf(score: number): FlowLevel {
  return score >= 62 ? 'high' : score <= 42 ? 'low' : 'mid';
}

function periodScore(p: LuckPillar, favorable: Element): number {
  let raw = pillarFit(p.ganzhi, favorable);
  if (hasRel(p, CLASH, 'day')) raw -= 1;
  else if (hasRel(p, CLASH, 'month')) raw -= 0.5;
  if (hasRel(p, HARMONY, 'day')) raw += 0.5;
  return Math.max(8, Math.min(94, Math.round(50 + raw * 18)));
}

function stageScore(points: readonly FlowPoint[], from: number, to: number): number | null {
  let sum = 0;
  let weight = 0;
  for (const p of points) {
    const n = Math.min(p.endAge, to) - Math.max(p.startAge, from) + 1;
    if (n > 0) {
      sum += p.score * n;
      weight += n;
    }
  }
  return weight > 0 ? Math.round(sum / weight) : null;
}

export function flowMap(luck: LuckBlock | null, favorable: Element, age: number): FlowMap | null {
  if (!luck || luck.periods.length === 0) return null;
  const points: FlowPoint[] = luck.periods.map((p) => {
    const score = periodScore(p, favorable);
    return {
      number: p.number,
      startAge: p.startAge,
      endAge: p.endAge,
      startYear: p.startYear,
      endYear: p.endYear,
      startMonth: p.startMonth,
      score,
      level: levelOf(score),
      group: GROUP_OF[p.stemGod],
      current: luck.current === p.number,
    };
  });
  const stages: FlowStage[] = [];
  for (const s of STAGE_RANGE) {
    const score = stageScore(points, s.from, s.to);
    if (score !== null) stages.push({ key: s.key, fromAge: s.from, toAge: s.to, score, level: levelOf(score), current: age >= s.from && age <= s.to });
  }
  const best = points.reduce((top, p) => (p.score > top.score ? p : top), points[0]);
  const hardest = points.reduce((low, p) => (p.score < low.score ? p : low), points[0]);
  return { points, stages, best, hardest, age };
}

export type FlowDirection = 'up' | 'down' | 'same';

export const FLOW_TURN_GAP = 8;

export interface FlowTurn {

  now: FlowPoint;

  next: FlowPoint | null;

  dir: FlowDirection;

  start: { year: number; month: number | null } | null;
}

export function flowTurn(flow: FlowMap, startDates: readonly string[] | null): FlowTurn | null {
  const i = flow.points.findIndex((p) => p.current);
  if (i < 0) return null;
  const now = flow.points[i];
  const next = flow.points[i + 1] ?? null;
  const gap = next ? next.score - now.score : 0;
  const dir: FlowDirection = gap >= FLOW_TURN_GAP ? 'up' : gap <= -FLOW_TURN_GAP ? 'down' : 'same';
  let start: FlowTurn['start'] = null;
  if (next) {
    const m = /^(\d{4})-(\d{2})-/.exec(startDates?.[i + 1] ?? '');
    start = m ? { year: Number(m[1]), month: Number(m[2]) } : { year: next.startYear, month: null };
  }
  return { now, next, dir, start };
}

export interface NextChapter {

  point: FlowPoint;

  year: number;
  month: number | null;

  dir: FlowDirection | null;
}

export function nextChapter(flow: FlowMap): NextChapter | null {
  const i = flow.points.findIndex((p) => p.current);
  const next = flow.points[i + 1];
  if (!next) return null;
  const now = i >= 0 ? flow.points[i] : null;
  const gap = now ? next.score - now.score : 0;
  const dir: FlowDirection | null = !now ? null : gap >= FLOW_TURN_GAP ? 'up' : gap <= -FLOW_TURN_GAP ? 'down' : 'same';
  const m = next.startMonth;
  return { point: next, year: m ? Number(m.slice(0, 4)) : next.startYear, month: m ? Number(m.slice(5, 7)) : null, dir };
}

export type YearKind = 'crisis' | 'chance' | 'shift' | 'flow';

export interface KeyYear {
  year: number;
  age: number;
  kind: YearKind;

  group: GodGroup;

  clash: 'day' | 'month' | null;

  harmony: boolean;

  shift: boolean;
}

export const MAX_CRISIS_YEARS = 3;

export function keyYears(years: readonly YearLuck[], luck: LuckBlock | null, favorable: Element, from: number, count = 5): KeyYear[] {
  const starts = new Set(luck?.periods.map((p) => p.startYear) ?? []);
  const rows = years
    .filter((y) => y.year >= from)
    .slice(0, count)
    .map((y) => {
      const clash = hasRel(y, CLASH, 'day') ? 'day' : hasRel(y, CLASH, 'month') ? 'month' : null;
      const harmony = hasRel(y, HARMONY, 'day') || hasRel(y, HARMONY, 'month');
      const fit = pillarFit(y.ganzhi, favorable);
      const shift = starts.has(y.year);
      const kind: YearKind = clash || fit <= -1 ? 'crisis' : shift ? 'shift' : harmony || fit >= 1.5 ? 'chance' : 'flow';

      const weight = clash === 'day' ? 10 : clash === 'month' ? 9 : -fit;
      return { row: { year: y.year, age: y.age, kind, group: GROUP_OF[y.stemGod], clash, harmony, shift } as KeyYear, weight };
    });
  const heavy = rows.filter((r) => r.row.kind === 'crisis').sort((a, b) => b.weight - a.weight);
  for (const r of heavy.slice(MAX_CRISIS_YEARS)) r.row.kind = r.row.shift ? 'shift' : r.row.harmony ? 'chance' : 'flow';
  return rows.map((r) => r.row);
}

export type MonthTone = 'clashDay' | 'clashMonth' | 'harmonyDay' | 'harmonyMonth';

export type YearMonthTone = 'clashYear' | 'harmonyYear';
export type KeyMonthTone = MonthTone | YearMonthTone;

export interface KeyMonth {
  year: number;

  month: number;

  tone: KeyMonthTone;

  good: boolean;

  both?: true;
}

export const isYearTone = (m: Pick<KeyMonth, 'tone'>): boolean => m.tone === 'clashYear' || m.tone === 'harmonyYear';

export function monthYearTone(m: Pick<MonthLuck, 'month' | 'ganzhi'>): YearMonthTone | null {
  const year = Number(m.month.slice(0, 4));
  const month = Number(m.month.slice(5, 7));
  const yearBranch = yearGanzhi(month === 1 ? year - 1 : year).slice(1, 2) as Branch;
  return yearMonthTone(yearBranch, m.ganzhi.slice(1, 2) as Branch);
}

export function yearMonthTone(yearBranch: Branch, monthBranch: Branch): YearMonthTone | null {
  const kinds = relationsAmong([
    { at: 'yearLuck', char: yearBranch },
    { at: 'monthLuck', char: monthBranch },
  ]).map((r) => r.kind);
  if (kinds.includes('沖')) return 'clashYear';
  if (kinds.includes('六合') || kinds.includes('半合')) return 'harmonyYear';
  return null;
}

export const KEY_MONTH_YEARS = 2;

export function monthToneOf(m: LuckPillar): MonthTone | null {
  const caution: MonthTone | null = hasRel(m, CLASH, 'day') ? 'clashDay' : hasRel(m, CLASH, 'month') ? 'clashMonth' : null;
  const good: MonthTone | null = hasRel(m, HARMONY, 'day') ? 'harmonyDay' : hasRel(m, HARMONY, 'month') ? 'harmonyMonth' : null;
  return caution && good ? (good.endsWith('Day') && !caution.endsWith('Day') ? good : caution) : (caution ?? good);
}

export function monthToneAll(m: MonthLuck): KeyMonthTone | null {
  return monthToneOf(m) ?? monthYearTone(m);
}

export function keyMonths(chart: NatalCore, nowIso: string, years: readonly number[]): KeyMonth[] {
  const nowYear = Number(nowIso.slice(0, 4));
  const nowMonth = Number(nowIso.slice(5, 7));
  const out: KeyMonth[] = [];
  for (const year of years) {
    const start = year === nowYear ? nowMonth : year > nowYear ? 1 : 13;
    if (start > 12) continue;
    for (const m of monthLucks(chart, year, start, 13 - start)) {
      const month = Number(m.month.slice(5, 7));
      const natal = monthToneOf(m);
      const yr = monthYearTone(m);
      const tone: KeyMonthTone | null = natal ?? yr;
      if (!tone) continue;
      const good = tone.startsWith('harmony');
      out.push({ year, month, tone, good, ...(natal && yr && natal.startsWith('harmony') === yr.startsWith('harmony') ? { both: true as const } : {}) });
    }
  }
  return out;
}

export function openMonth(months: readonly KeyMonth[], year: number, yearIndex: number): KeyMonth | null {
  const mine = months.filter((m) => m.year === year);
  const wantGood = yearIndex % 2 === 0;
  return mine.find((m) => m.good === wantGood) ?? mine[0] ?? null;
}

export function veiledMonths(months: readonly KeyMonth[], year: number, shown: KeyMonth | null, max = 3): KeyMonth[] {
  return months.filter((m) => m.year === year && m !== shown).slice(0, max);
}

export function monthsOfYear(months: readonly KeyMonth[], year: number): KeyMonth[] {
  return months.filter((m) => m.year === year);
}

export function yearFocusMonth(kind: YearKind, rows: readonly KeyMonth[]): KeyMonth | null {
  if (rows.length === 0) return null;
  const wantGood = kind === 'chance' || kind === 'shift' ? true : kind === 'crisis' ? false : null;
  const best = (xs: readonly KeyMonth[]) => xs.find((m) => m.both) ?? xs.find(isYearTone) ?? xs[0];
  const pool = wantGood === null ? rows : rows.filter((m) => m.good === wantGood);
  return best(pool.length > 0 ? pool : rows);
}

export function recurringMonths(months: readonly KeyMonth[]): KeyMonth[] {
  const seen = new Map<number, KeyMonth>();
  for (const m of months) if (!isYearTone(m) && !seen.has(m.month)) seen.set(m.month, m);
  return [...seen.values()].sort((a, b) => a.month - b.month);
}

export interface MeetWindows {
  work: KeyMonth | null;
  close: KeyMonth | null;
}
export function meetWindows(months: readonly KeyMonth[]): MeetWindows {
  return { work: months.find((m) => m.tone === 'harmonyMonth') ?? null, close: months.find((m) => m.tone === 'harmonyDay') ?? null };
}

export type HeatLevel = 'blaze' | 'warm' | 'calm' | 'cool';

export interface HeatMonth {
  year: number;

  month: number;
  level: HeatLevel;

  tone: KeyMonthTone | null;

  lichun: boolean;

  turn: 'rise' | 'fall' | null;
}

export const TURN_GAP = 14;

function monthScore(m: MonthLuck, favorable: Element): number {
  let raw = pillarFit(m.ganzhi, favorable);
  if (hasRel(m, CLASH, 'day')) raw -= 1;
  else if (hasRel(m, CLASH, 'month')) raw -= 0.5;
  if (hasRel(m, HARMONY, 'day')) raw += 0.7;
  else if (hasRel(m, HARMONY, 'month')) raw += 0.35;
  const yr = monthYearTone(m);
  if (yr === 'harmonyYear') raw += 0.35;
  else if (yr === 'clashYear') raw -= 0.5;
  return Math.max(8, Math.min(94, Math.round(50 + raw * 18)));
}

export function monthHeat(months: readonly MonthLuck[], favorable: Element): HeatMonth[] {
  const rows = months.slice(0, 12).map((m) => ({ m, score: monthScore(m, favorable) }));
  if (rows.length === 0) return [];
  const rank = rows.map((_, i) => i).sort((a, b) => rows[b].score - rows[a].score || a - b);
  const steps: HeatLevel[] = ['blaze', 'warm', 'calm', 'cool'];
  const per = Math.ceil(rows.length / 4);
  const level = new Map(rank.map((idx, order) => [idx, steps[Math.min(3, Math.floor(order / per))]]));
  let rise = -1;
  let fall = -1;
  for (let i = 1; i < rows.length; i += 1) {
    const d = rows[i].score - rows[i - 1].score;
    if (d >= TURN_GAP && (rise < 0 || d > rows[rise].score - rows[rise - 1].score)) rise = i;
    if (d <= -TURN_GAP && (fall < 0 || d < rows[fall].score - rows[fall - 1].score)) fall = i;
  }
  return rows.map(({ m }, i) => ({
    year: Number(m.month.slice(0, 4)),
    month: Number(m.month.slice(5, 7)),
    level: level.get(i) ?? 'calm',
    tone: monthToneAll(m),
    lichun: m.term.hanzi === '立春',
    turn: i === rise ? 'rise' : i === fall ? 'fall' : null,
  }));
}

export type LoveYearKind = 'open' | 'warm' | 'steady' | 'tender';

export interface LoveYear {
  year: number;
  age: number;
  kind: LoveYearKind;

  group: GodGroup;

  best: boolean;
}

export function loveYears(years: readonly YearLuck[]): LoveYear[] {
  const rows = years.slice(0, 7).map((y) => {
    const tone = monthToneOf(y);
    const kind: LoveYearKind = tone === 'harmonyDay' ? 'open' : tone === 'harmonyMonth' ? 'warm' : tone === null ? 'steady' : 'tender';
    return { year: y.year, age: y.age, kind, group: GROUP_OF[y.stemGod], best: false };
  });
  const best = rows.find((r) => r.kind === 'open') ?? rows.find((r) => r.kind === 'warm');
  if (best) best.best = true;
  return rows;
}

const ELEMENT_ORDER: readonly Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

export type ElementLink = 'overlap' | 'meFills' | 'youFills' | 'none';

export interface ElementPair {
  element: Element;
  me: number;
  you: number;
  link: ElementLink;
}

export const OVERLAP_MIN = 2;

export function elementPairs(me: ChartBlock, you: ChartBlock): ElementPair[] {
  return ELEMENT_ORDER.map((element) => {
    const a = me.elements[element];
    const b = you.elements[element];
    const link: ElementLink = a >= OVERLAP_MIN && b >= OVERLAP_MIN ? 'overlap' : b === 0 && a >= 1 ? 'meFills' : a === 0 && b >= 1 ? 'youFills' : 'none';
    return { element, me: a, you: b, link };
  });
}

export type TogetherKind = 'both' | 'one' | 'care' | 'even';

export interface TogetherMonth {
  year: number;

  month: number;

  me: MonthTone | null;
  you: MonthTone | null;
  kind: TogetherKind;
}

export function coreOfBlock(c: ChartBlock): NatalCore {
  const g = (at: string) => c.pillars.find((p) => p.at === at)?.ganzhi ?? null;
  return natalCore({ year: g('year') ?? '', month: g('month') ?? '', day: g('day') ?? '', hour: g('hour') }, c.flags);
}

export function togetherMonths(me: ChartBlock, you: ChartBlock, todayIso: string, count = 12): TogetherMonth[] {
  const year = Number(todayIso.slice(0, 4));
  const month = Number(todayIso.slice(5, 7));
  const mine = monthLucks(coreOfBlock(me), year, month, count);
  const yours = monthLucks(coreOfBlock(you), year, month, count);
  return mine.map((m, i) => {
    const a = monthToneOf(m);
    const b = monthToneOf(yours[i]);
    const goodA = a?.startsWith('harmony') ?? false;
    const goodB = b?.startsWith('harmony') ?? false;
    const badA = a !== null && !goodA;
    const badB = b !== null && !goodB;
    const kind: TogetherKind = goodA && goodB ? 'both' : goodA || goodB ? 'one' : badA && badB ? 'care' : 'even';
    return { year: Number(m.month.slice(0, 4)), month: Number(m.month.slice(5, 7)), me: a, you: b, kind };
  });
}

export type CalendarKind = 'good' | 'caution' | 'even';

export interface CalendarMonth {
  year: number;

  month: number;

  tone: KeyMonthTone | null;
  kind: CalendarKind;
}

export function monthCalendar(months: readonly MonthLuck[]): CalendarMonth[] {
  return months.map((m) => {
    const tone = monthToneAll(m);
    return { year: Number(m.month.slice(0, 4)), month: Number(m.month.slice(5, 7)), tone, kind: tone === null ? 'even' : tone.startsWith('harmony') ? 'good' : 'caution' };
  });
}

export function pickGoodMonth(months: readonly KeyMonth[] | undefined): KeyMonth | null {

  return months?.find((m) => m.good && !isYearTone(m)) ?? null;
}

export interface PartnerTraits {

  vibe: GodGroup;

  temper: Element;

  meet: GodGroup;
}

export function partnerTraits(c: ChartBlock): PartnerTraits {
  const day = c.pillars.find((p) => p.at === 'day');
  const month = c.pillars.find((p) => p.at === 'month');
  return {
    vibe: c.palace,
    temper: day?.branchElement ?? c.dayMaster.element,
    meet: month ? GROUP_OF[month.branchGod] : c.palace,
  };
}

export type PartnerTone = 'bright' | 'quiet';

export type PartnerTypeKey =
  | 'resource-bright'
  | 'resource-quiet'
  | 'power-bright'
  | 'power-quiet'
  | 'output-bright'
  | 'output-quiet'
  | 'peer'
  | 'wealth';

export const PARTNER_TYPES: readonly PartnerTypeKey[] = [
  'resource-bright', 'resource-quiet', 'power-bright', 'power-quiet', 'output-bright', 'output-quiet', 'peer', 'wealth',
];

const BRIGHT_BRANCHES: ReadonlySet<string> = new Set(['寅', '卯', '巳', '午', '辰', '戌']);

export function partnerTone(c: ChartBlock): PartnerTone {
  const day = c.pillars.find((p) => p.at === 'day');
  return day && BRIGHT_BRANCHES.has(day.branch) ? 'bright' : 'quiet';
}

export function partnerType(c: ChartBlock): PartnerTypeKey {
  const { vibe } = partnerTraits(c);
  if (vibe === 'peer' || vibe === 'wealth') return vibe;
  return `${vibe}-${partnerTone(c)}` as PartnerTypeKey;
}

export interface FateMap {

  favorable: Element;
  flow: FlowMap | null;
  years: KeyYear[];
  partner: PartnerTraits;

  partnerKind: PartnerTypeKey;

  months?: KeyMonth[];
}

export function fateMap(self: ChartBlock, luck: LuckBlock | null, years: readonly YearLuck[], age: number, thisYear: number, today?: string): FateMap {
  const favorable = favorableElement(self.dayMaster.element, self.strength, self.elements);
  const key = keyYears(years, luck, favorable, thisYear);
  return {
    favorable,
    flow: flowMap(luck, favorable, age),
    years: key,
    partner: partnerTraits(self),
    partnerKind: partnerType(self),
    ...(today ? { months: keyMonths(coreOfBlock(self), today, key.map((y) => y.year)) } : {}),
  };
}

export function fateMapOf(chart: Chart, nowIso: string): FateMap {
  const thisYear = Number(nowIso.slice(0, 4));
  const luck = luckBlock(chart, nowIso);
  const map = fateMap(chartBlock(chart), luck, yearLucks(chart, luck, thisYear, thisYear + 4), ageAt(chart.input.date, nowIso), thisYear);
  return { ...map, months: keyMonths(chart, nowIso, map.years.slice(0, KEY_MONTH_YEARS).map((y) => y.year)) };
}
