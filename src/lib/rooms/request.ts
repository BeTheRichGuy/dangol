import { isLocale } from '@/content/locale';
import { yearGanzhi } from '@/lib/saju/details';
import { BRANCHES, JIE_TABLE, STEMS } from '@/lib/saju/tables';
import type { Chart, TypeKey } from '@/lib/saju/types';
import {
  chartBlock,
  crossBlock,
  isXmasEdition,
  luckPillar,
  monthLucks,
  natalCore,
  periodAt,
  roomSpan,
  type ChartBlock,
  type LuckBlock,
  type LuckPeriod,
  type MonthLuck,
  type NatalCore,
  type RoomPayload,
  type YearLuck,
} from './payload';
import { parseIntake } from '@/lib/reunion/intake';
import { parseXmasRelation, type XmasRelation } from '@/lib/xmas/relation';
import { parseQuizAnswers, quizRelation } from '@/lib/xmas/quiz';

function sameRelation(a: XmasRelation, b: XmasRelation): boolean {
  return a.stage === b.stage && a.goal === b.goal && a.contact === b.contact;
}
import { ROOMS, isPairKind, isProductKey } from './themes';

export const QUESTION_LIMIT = 300;

export type ParsedRoomRequest = { ok: true; payload: RoomPayload } | { ok: false; error: 'invalid_body' };

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

export function cleanQuestion(q: string): string {
  return q.replace(CONTROL, '').trim().slice(0, QUESTION_LIMIT);
}

class Invalid extends Error {}

function check(cond: unknown): asserts cond {
  if (!cond) throw new Invalid();
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function int(v: unknown, min: number, max: number): number {
  check(typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max);
  return v;
}

const TYPES: readonly TypeKey[] = ['pine', 'vine', 'sun', 'candle', 'mountain', 'field', 'blade', 'jewel', 'ocean', 'rain'];
const AT_ORDER = ['year', 'month', 'day', 'hour'] as const;

export function sexagenaryIndex(g: unknown): number {
  if (typeof g !== 'string' || g.length !== 2) return -1;
  for (let i = 0; i < 60; i += 1) if (STEMS[i % 10] + BRANCHES[i % 12] === g) return i;
  return -1;
}

function ganzhi(v: unknown): string {
  check(sexagenaryIndex(v) >= 0);
  return v as string;
}

function project(value: unknown, shape: unknown): unknown {
  if (Array.isArray(shape)) {
    if (!Array.isArray(value) || value.length !== shape.length) return value;
    return shape.map((s, i) => project(value[i], s));
  }
  if (isRecord(shape)) {
    if (!isRecord(value)) return value;
    return Object.fromEntries(Object.keys(shape).map((k) => [k, project(value[k], shape[k])]));
  }
  return value;
}

function same(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => same(x, b[i]));
  }
  if (isRecord(a) || isRecord(b)) {
    if (!isRecord(a) || !isRecord(b)) return false;
    const keys = Object.keys(b);
    return Object.keys(a).length === keys.length && keys.every((k) => k in a && same(a[k], b[k]));
  }
  return Object.is(a, b);
}

function matches<T>(sent: unknown, canonical: T): T {
  check(same(project(sent, canonical), canonical));
  return canonical;
}

function parseFlags(v: unknown, hasHour: boolean): Chart['flags'] {
  check(isRecord(v));
  const { timeUnknown, ziHourAmbiguous, altType, nearJieqiBoundary } = v;
  check(timeUnknown === !hasHour);
  check(typeof ziHourAmbiguous === 'boolean' && typeof nearJieqiBoundary === 'boolean');
  check(altType === null || (typeof altType === 'string' && (TYPES as readonly string[]).includes(altType)));

  check(!ziHourAmbiguous || hasHour);
  check(altType === null || ziHourAmbiguous);
  check(!nearJieqiBoundary || !hasHour);
  return { timeUnknown, ziHourAmbiguous, altType: altType as TypeKey | null, nearJieqiBoundary };
}

function parseChart(v: unknown): { block: ChartBlock; core: NatalCore } {
  check(isRecord(v) && Array.isArray(v.pillars) && (v.pillars.length === 3 || v.pillars.length === 4));
  const pillars = v.pillars as unknown[];
  const ganzhis = pillars.map((p, i) => {
    check(isRecord(p) && p.at === AT_ORDER[i]);
    return ganzhi(p.ganzhi);
  });
  const hasHour = ganzhis.length === 4;
  const flags = parseFlags(v.flags, hasHour);
  const core = natalCore({ year: ganzhis[0], month: ganzhis[1], day: ganzhis[2], hour: hasHour ? ganzhis[3] : null }, flags);
  check(flags.altType === null || flags.altType !== core.dayMaster.type);
  return { block: matches(v, chartBlock(core)), core };
}

function parseLuck(v: unknown, core: NatalCore, todayYear: number): LuckBlock | null {
  if (v === null || v === undefined) return null;
  check(isRecord(v) && typeof v.forward === 'boolean' && Array.isArray(v.periods));
  const forward = v.forward;
  const sent = v.periods as unknown[];
  check(sent.length >= 1 && sent.length <= 12);
  const step = forward ? 1 : 59;
  let prevIndex = sexagenaryIndex(core.pillars.month.ganzhi);
  const periods: LuckPeriod[] = sent.map((raw, i) => {
    check(isRecord(raw));
    const g = ganzhi(raw.ganzhi);
    const index = sexagenaryIndex(g);
    check(index === (prevIndex + step) % 60);
    prevIndex = index;
    const startAge = int(raw.startAge, 0, 150);
    const startYear = int(raw.startYear, 1800, 2300);
    const startMonth = raw.startMonth;
    check(startMonth === null || (typeof startMonth === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(startMonth)));
    if (typeof startMonth === 'string') check(Math.abs(Number(startMonth.slice(0, 4)) - startYear) <= 1);
    return {
      ...luckPillar(core, g, 'daeyun'),
      number: i + 1,
      startAge,
      endAge: startAge + 9,
      startYear,
      endYear: startYear + 9,
      startMonth,
    };
  });
  for (let i = 1; i < periods.length; i += 1) {
    check(periods[i].startAge === periods[i - 1].startAge + 10 && periods[i].startYear === periods[i - 1].startYear + 10);
  }
  const current = v.current === null ? null : int(v.current, 1, periods.length);

  if (current === null) check(periods[0].startYear >= todayYear - 1);
  else {
    check(periods[current - 1].startYear <= todayYear + 1);
    if (current < periods.length) check(periods[current].startYear >= todayYear - 1);
  }
  return matches(v, { forward, current, periods });
}

function parseYears(v: unknown, core: NatalCore, luck: LuckBlock | null, range: readonly [number, number]): { years: YearLuck[]; birthYear: number } {
  check(Array.isArray(v) && v.length === range[1] - range[0] + 1);
  let birthYear: number | null = null;
  const years = v.map((raw, i): YearLuck => {
    check(isRecord(raw));
    const year = range[0] + i;
    check(raw.year === year);
    const age = int(raw.age, -1, 160);
    birthYear ??= year - age;
    check(year - age === birthYear);
    return { ...luckPillar(core, yearGanzhi(year), 'yearLuck'), year, age, period: periodAt(luck, year) };
  });
  check(birthYear !== null);
  return { years: matches(v, years), birthYear };
}

function parseMonths(v: unknown, core: NatalCore, spec: { startYear: number; startMonth: number; count: number } | null): MonthLuck[] {
  if (!spec) {
    check(v === undefined || (Array.isArray(v) && v.length === 0));
    return [];
  }
  return matches(v, monthLucks(core, spec.startYear, spec.startMonth, spec.count));
}

function parseNow(v: unknown, todayYear: number): RoomPayload['now'] {
  check(isRecord(v));
  const { term, termHanzi, yearGanzhi: y, monthGanzhi: m } = v;
  check(typeof term === 'string' && typeof termHanzi === 'string');
  check((term === '' && termHanzi === '') || JIE_TABLE.some((j) => j.name === term && j.hanzi === termHanzi));

  check(ganzhi(y) === yearGanzhi(todayYear) || y === yearGanzhi(todayYear - 1));
  return { term, termHanzi, yearGanzhi: y as string, monthGanzhi: ganzhi(m) };
}

function parseToday(v: unknown): string {
  check(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v));
  const ms = Date.parse(`${v}T00:00:00Z`);
  check(Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === v);
  int(Number(v.slice(0, 4)), 1900, 2200);
  return v;
}

function checkAge(age: number, todayYear: number, birthYear: number) {
  check(age === todayYear - birthYear || age === todayYear - birthYear - 1);
}

export function parseRoomRequest(body: unknown): ParsedRoomRequest {
  try {
    check(isRecord(body));
    const { room, locale } = body;
    check(isProductKey(room) && isLocale(locale));
    const spec = ROOMS[room];
    const today = parseToday(body.today);
    const todayYear = Number(today.slice(0, 4));
    const todayMonth = Number(today.slice(5, 7));

    const self = parseChart(body.self);
    const luck = parseLuck(body.luck, self.core, todayYear);
    check(!spec.needsLuck || luck !== null);
    const span = roomSpan(room, todayYear, todayMonth, luck);
    const years = parseYears(body.years, self.core, luck, span.years);
    const months = parseMonths(body.months, self.core, span.months);
    const age = int(body.age, 0, 150);
    checkAge(age, todayYear, years.birthYear);

    const intake = room === 'reunion' ? parseIntake(body.reunion) : null;
    check(room !== 'reunion' || intake !== null);
    check(room === 'reunion' || body.reunion === undefined);

    const xmas = body.edition !== undefined;
    check(!xmas || isXmasEdition(room, locale, body.edition));

    const relation = xmas ? parseXmasRelation(body.xmas) : null;
    check(!xmas || relation !== null);
    check(xmas || body.xmas === undefined);

    const quiz = xmas && body.quiz !== undefined ? parseQuizAnswers(body.quiz) : null;
    check(body.quiz === undefined || quiz !== null);
    check(!quiz || (relation !== null && sameRelation(quizRelation(quiz), relation)));

    let partner: RoomPayload['partner'] = null;

    const xmasPartner = xmas && body.partner !== undefined && body.partner !== null;
    if (spec.needsPartner || xmasPartner) {
      const p = body.partner;

      check(isRecord(p) && (room !== 'reunion' || p.kind === 'lover') && (!xmasPartner || p.kind === 'crush') && isPairKind(p.kind));
      const other = parseChart(p.chart);
      const otherLuck = parseLuck(p.luck, other.core, todayYear);
      const otherYears = parseYears(p.years, other.core, otherLuck, [todayYear, todayYear + 2]);
      const otherAge = int(p.age, 0, 150);
      checkAge(otherAge, todayYear, otherYears.birthYear);
      partner = {
        kind: p.kind,
        age: otherAge,
        chart: other.block,
        luck: otherLuck,
        years: otherYears.years,
        cross: matches(p.cross, crossBlock(self.core, other.core)),
      };
    }

    return {
      ok: true,
      payload: {
        room,
        locale,
        today,
        age,
        now: parseNow(body.now, todayYear),
        self: self.block,
        luck,
        years: years.years,
        months,
        partner,
        question: typeof body.question === 'string' ? cleanQuestion(body.question) : '',
        ...(intake ? { reunion: intake } : {}),
        ...(xmas ? { edition: 'xmas' as const } : {}),
        ...(relation ? { xmas: relation } : {}),
        ...(quiz ? { quiz } : {}),
      },
    };
  } catch (error) {
    if (error instanceof Invalid) return { ok: false, error: 'invalid_body' };
    throw error;
  }
}
