import { togetherMonths, type TogetherKind } from '@/lib/reading/fate-map';
import type { RoomPayload } from '@/lib/rooms/payload';
import { contactIsCut, lengthPlan, type LengthPlan, type ReunionIntake, type WantId } from './intake';

export type MonthKind = TogetherKind;

export const MONTH_KINDS: readonly MonthKind[] = ['both', 'one', 'care', 'even'];

export const READINESS_COUNT = 7;

export const DATE_CARD_COUNT = 5;

export const DONT_SEND_COUNT = 5;

export const ACTIONS_PER_KIND = 3;

export function seedOf(...parts: readonly string[]): number {
  let h = 0x811c9dc5;
  for (const ch of parts.join('|')) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function pickIndex(n: number, seed: number): number {
  return n > 0 ? seed % n : 0;
}

export function pickMany<T>(list: readonly T[], count: number, seed: number): T[] {
  const order = list.map((item, i) => ({ item, key: seedOf(String(seed), String(i)) }));
  order.sort((a, b) => a.key - b.key || 0);
  return order.slice(0, count).map((o) => o.item);
}

export interface WindowMonth {
  year: number;

  month: number;
  kind: MonthKind;

  action: number;
}

export function windowCalendar(payload: Pick<RoomPayload, 'self' | 'partner' | 'today'>): WindowMonth[] {
  if (!payload.partner) return [];
  return togetherMonths(payload.self, payload.partner.chart, payload.today).map((t, i) => ({
    year: t.year,
    month: t.month,
    kind: t.kind,
    action: (t.month + i) % ACTIONS_PER_KIND,
  }));
}

const KIND_RANK: Record<MonthKind, number> = { both: 0, one: 1, even: 2, care: 3 };

export function dateCards(calendar: readonly WindowMonth[]): WindowMonth[] {
  const ranked = calendar.map((m, i) => ({ m, i })).sort((a, b) => KIND_RANK[a.m.kind] - KIND_RANK[b.m.kind] || a.i - b.i);
  return ranked
    .slice(0, DATE_CARD_COUNT)
    .sort((a, b) => a.i - b.i)
    .map((r) => r.m);
}

export function firstOpenMonth(calendar: readonly WindowMonth[]): WindowMonth | null {
  return calendar.find((m) => m.kind === 'both') ?? calendar.find((m) => m.kind === 'one') ?? null;
}

export function songDates(calendar: readonly WindowMonth[]): WindowMonth[] {
  return dateCards(calendar)
    .filter((m) => m.kind === 'both' || m.kind === 'one')
    .slice(0, 3);
}

export interface KitPick {
  mode: 'kit' | 'waiting';

  plain: number;
  apology: number;
  news: number;

  dontSend: number[];
}

export function kitPick(payload: Pick<RoomPayload, 'self' | 'partner'>, intake: ReunionIntake, sizes: { plain: number; apology: number; news: number; dontSend: number }): KitPick {
  const stem = `${payload.self.dayMaster.stem}${payload.partner?.chart.dayMaster.stem ?? ''}`;
  const base = seedOf(stem, intake.since, intake.who, intake.contact, intake.reasons.join(','));
  return {
    mode: contactIsCut(intake) ? 'waiting' : 'kit',
    plain: pickIndex(sizes.plain, seedOf('plain', String(base))),
    apology: pickIndex(sizes.apology, seedOf('apology', String(base))),
    news: pickIndex(sizes.news, seedOf('news', String(base))),
    dontSend: pickMany(Array.from({ length: sizes.dontSend }, (_, i) => i), DONT_SEND_COUNT, base),
  };
}

export function songLineIndex(payload: Pick<RoomPayload, 'self' | 'partner'>, want: WantId): number {
  return pickIndex(3, seedOf('song', want, payload.self.dayMaster.stem, payload.partner?.chart.dayMaster.stem ?? ''));
}

export interface ReunionCardPlan {
  plan: LengthPlan;
  calendar: WindowMonth[];
  dates: WindowMonth[];
  open: WindowMonth | null;
  contactMode: KitPick['mode'];
}

export function reunionCardPlan(payload: RoomPayload): ReunionCardPlan | null {
  if (payload.room !== 'reunion' || !payload.reunion || !payload.partner) return null;
  const calendar = windowCalendar(payload);
  return {
    plan: lengthPlan(payload.reunion),
    calendar,
    dates: dateCards(calendar),
    open: firstOpenMonth(calendar),
    contactMode: contactIsCut(payload.reunion) ? 'waiting' : 'kit',
  };
}
