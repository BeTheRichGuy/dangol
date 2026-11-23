import { isConcernKey } from '@/lib/reading/concerns';
import { hash32 } from '@/lib/reading/hash';
import type { ConcernKey } from '@/lib/reading/types';
import type { RoomKey } from '@/lib/rooms/themes';
import type { Element, GodGroup } from '@/lib/saju/types';

export const ELEMENT_IDS = ['wood', 'fire', 'earth', 'metal', 'water'] as const satisfies readonly Element[];
export const AREA_IDS = ['love', 'wealth', 'work', 'study', 'bond', 'mind'] as const;
export type AreaId = (typeof AREA_IDS)[number];
export type TalismanId = Element | AreaId;

export const TALISMAN_IDS: readonly TalismanId[] = [...ELEMENT_IDS, ...AREA_IDS];

export function isTalismanId(v: unknown): v is TalismanId {
  return typeof v === 'string' && (TALISMAN_IDS as readonly string[]).includes(v);
}

export function isElementTalisman(id: TalismanId): id is Element {
  return (ELEMENT_IDS as readonly string[]).includes(id);
}

export const GLYPH: Record<TalismanId, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
  love: '愛', wealth: '財', work: '業', study: '學', bond: '緣', mind: '心',
};

export type TalismanReason = 'missing' | 'weakest' | 'asked' | 'gap';

export interface TalismanGift {
  id: TalismanId;
  reason: TalismanReason;
}

export interface TalismanChart {
  elements: Readonly<Record<Element, number>>;
  godCounts: Readonly<Record<GodGroup, number>>;

  pillars?: unknown;
}

export interface TalismanInput {
  chart: TalismanChart;

  concern?: string | null;

  room?: RoomKey | null;

  question?: string | null;
}

const ASKED_BY_CONCERN: Record<ConcernKey, AreaId> = {
  love: 'love', crush: 'love', ex: 'love', partner: 'love', marriage: 'love',
  work: 'work', money: 'wealth', study: 'study', people: 'bond', change: 'mind', self: 'mind',
};

const ASKED_BY_ROOM: Partial<Record<RoomKey, AreaId>> = { love: 'love', match: 'bond' };

const GAP_AREA: ReadonlyArray<readonly [GodGroup, AreaId]> = [
  ['wealth', 'wealth'], ['power', 'work'], ['resource', 'study'], ['peer', 'bond'], ['output', 'mind'],
];

export function talismansFor(input: TalismanInput): TalismanGift[] {
  const { chart } = input;
  const gifts: TalismanGift[] = [];

  const missing = ELEMENT_IDS.filter((e) => chart.elements[e] === 0);
  if (missing.length > 0) {
    for (const id of missing) gifts.push({ id, reason: 'missing' });
  } else {
    const weakest = ELEMENT_IDS.reduce((low, e) => (chart.elements[e] < chart.elements[low] ? e : low), ELEMENT_IDS[0]);
    gifts.push({ id: weakest, reason: 'weakest' });
  }

  const asked = new Set<AreaId>();
  if (isConcernKey(input.concern)) asked.add(ASKED_BY_CONCERN[input.concern]);
  const byRoom = input.room ? ASKED_BY_ROOM[input.room] : undefined;
  if (byRoom) asked.add(byRoom);
  const gaps = new Set<AreaId>(GAP_AREA.filter(([god]) => chart.godCounts[god] === 0).map(([, area]) => area));

  for (const id of AREA_IDS) if (asked.has(id)) gifts.push({ id, reason: 'asked' });
  for (const id of AREA_IDS) if (!asked.has(id) && gaps.has(id)) gifts.push({ id, reason: 'gap' });
  return gifts;
}

export interface GiftPlan {
  key: string;
  candidates: TalismanGift[];
}

export function giftPlan(input: TalismanInput): GiftPlan {

  const ask = (input.concern ?? input.question ?? '').trim().slice(0, 300);
  const sign = JSON.stringify([input.chart.pillars ?? input.chart.elements, ask]);
  return { key: `${input.room ?? 'free'}:${hash32(sign).toString(36)}`, candidates: talismansFor(input) };
}

export function pickGift(candidates: readonly TalismanGift[], owned: readonly TalismanId[]): TalismanGift | null {
  return candidates.find((g) => !owned.includes(g.id)) ?? null;
}
