import type { Locale } from '@/content/locale';
import { birthInputOf } from '@/lib/account/person';
import type { Person } from '@/lib/account/types';
import { BUNDLE_ROOMS } from '@/lib/payments/bundle';
import { parsePicks } from '@/lib/payments/offers';
import { buildRoomPayload, type RoomPayload } from '@/lib/rooms/payload';
import { isPairKind, isRoomKey, ROOMS, type PairKind, type ProductKey, type RoomKey } from '@/lib/rooms/themes';
import { computeChart } from '@/lib/saju';

export interface BundlePending {

  selfId: string;

  receipt: string | null;

  lanterns: 'arrived' | 'late' | null;

  partnerId: string | null;
  kind: PairKind | null;

  plan?: 'all' | 'pick';

  picks?: ProductKey[] | null;
}

export function pendingPicks(p: Pick<BundlePending, 'plan' | 'picks'> | null): readonly ProductKey[] | null {
  return p?.plan === 'pick' && p.picks && p.picks.length === 3 ? p.picks : null;
}

export function pendingRooms(p: Pick<BundlePending, 'plan' | 'picks'> | null): readonly RoomKey[] {
  const picks = pendingPicks(p);
  return picks ? picks.filter(isRoomKey) : BUNDLE_ROOMS;
}

export function pickReceiptFor(store: Storage, room: ProductKey): string | null {
  try {
    const p = parseBundlePending(readBundleRaw(store));
    return p?.receipt && pendingPicks(p)?.includes(room) ? p.receipt : null;
  } catch {
    return null;
  }
}

export function pickPersonFor(store: Storage, room: ProductKey): string | null {
  try {
    const p = parseBundlePending(readBundleRaw(store));
    return p?.receipt && pendingPicks(p)?.includes(room) ? p.selfId : null;
  } catch {
    return null;
  }
}

const KEY = 'dangol.bundle.v1';
const listeners = new Set<() => void>();

export function subscribeBundlePending(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function readBundleRaw(store: Storage): string | null {
  try {
    return store.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveBundlePending(store: Storage, v: BundlePending): void {
  try {
    store.setItem(KEY, JSON.stringify(v));
  } catch {

  }
  for (const fn of listeners) fn();
}

export function clearBundlePending(store: Storage): void {
  try {
    store.removeItem(KEY);
  } catch {

  }
  for (const fn of listeners) fn();
}

export function parseBundlePending(raw: string | null): BundlePending | null {
  try {
    const v = JSON.parse(raw ?? 'null') as Partial<BundlePending> | null;
    if (!v || typeof v !== 'object') return null;
    if (typeof v.selfId !== 'string' || !v.selfId || v.selfId.length > 80) return null;
    if (v.receipt !== null && typeof v.receipt !== 'string') return null;
    const lanterns = v.lanterns ?? null;
    if (lanterns !== null && lanterns !== 'arrived' && lanterns !== 'late') return null;
    const partnerId = v.partnerId ?? null;
    if (partnerId !== null && (typeof partnerId !== 'string' || !partnerId || partnerId.length > 80)) return null;
    const kind = v.kind ?? null;
    if (kind !== null && !isPairKind(kind)) return null;

    const picks = v.plan === 'pick' ? parsePicks((v as { picks?: unknown }).picks) : null;
    return { selfId: v.selfId, receipt: v.receipt ?? null, lanterns, partnerId, kind, ...(picks ? { plan: 'pick' as const, picks } : {}) };
  } catch {
    return null;
  }
}

export function bundleLifePayload(self: Person, locale: Locale, nowIso: string): RoomPayload | null {
  if (!self.sex) return null;
  try {
    return buildRoomPayload({ room: 'life', locale, chart: computeChart(birthInputOf(self)), nowIso, question: '', partner: null });
  } catch {
    return null;
  }
}

export function bundlePayloads(
  self: Person,
  partner: Person | null,
  kind: PairKind | null,
  locale: Locale,
  nowIso: string,
  rooms: readonly RoomKey[] = BUNDLE_ROOMS,
): Record<RoomKey, RoomPayload> | null {
  if (!self.sex) return null;
  try {
    const chart = computeChart(birthInputOf(self));
    const other = partner && kind ? { chart: computeChart(birthInputOf(partner)), kind } : null;
    const out = {} as Record<RoomKey, RoomPayload>;
    for (const room of rooms) {
      if (ROOMS[room].needsPartner && !other) return null;
      out[room] = buildRoomPayload({ room, locale, chart, nowIso, question: '', partner: ROOMS[room].needsPartner ? other : null });
    }
    return out;
  } catch {
    return null;
  }
}
