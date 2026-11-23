import { computeChart } from '@/lib/saju';
import type { SavedReading } from '@/lib/account/types';
import { chartBlock } from '@/lib/rooms/payload';
import { isRoomKey } from '@/lib/rooms/themes';
import { TALISMAN_IDS, giftPlan, isTalismanId, pickGift, type GiftPlan, type TalismanGift, type TalismanId, type TalismanReason } from './index';

export const POUCH_KEY = 'dangol.talismans.v1';
export const LEDGER_KEY = 'dangol.talismans.given.v1';

export const POUCH_EVENT = 'dangol:talismans';

const LEDGER_MAX = 200;

export function sortedIds(ids: Iterable<unknown>): TalismanId[] {
  const have = new Set<string>();
  for (const id of ids) if (isTalismanId(id)) have.add(id);
  return TALISMAN_IDS.filter((id) => have.has(id));
}

export function parsePouch(raw: string | null): TalismanId[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as unknown;
    return Array.isArray(list) ? sortedIds(list) : [];
  } catch {
    return [];
  }
}

export function addToPouch(storage: Pick<Storage, 'getItem' | 'setItem'>, ids: readonly TalismanId[]): TalismanId[] {
  let have: TalismanId[] = [];
  try {
    have = parsePouch(storage.getItem(POUCH_KEY));
  } catch {
    return [];
  }
  const next = sortedIds([...have, ...ids]);
  if (next.length === have.length) return have;
  try {
    storage.setItem(POUCH_KEY, JSON.stringify(next));
  } catch {
    return have;
  }
  return next;
}

const REASONS: readonly TalismanReason[] = ['missing', 'weakest', 'asked', 'gap'];

export function parseLedger(raw: string | null): Record<string, TalismanGift> {
  const out: Record<string, TalismanGift> = {};
  if (!raw) return out;
  try {
    const map = JSON.parse(raw) as unknown;
    if (!map || typeof map !== 'object' || Array.isArray(map)) return out;
    for (const [key, v] of Object.entries(map)) {
      const g = v as { id?: unknown; reason?: unknown } | null;
      if (g && isTalismanId(g.id) && REASONS.includes(g.reason as TalismanReason)) out[key] = { id: g.id, reason: g.reason as TalismanReason };
    }
  } catch {

  }
  return out;
}

export function giveGift(storage: Pick<Storage, 'getItem' | 'setItem'>, plan: GiftPlan): TalismanGift | null {
  let ledger: Record<string, TalismanGift>;
  let owned: TalismanId[];
  try {
    ledger = parseLedger(storage.getItem(LEDGER_KEY));
    owned = parsePouch(storage.getItem(POUCH_KEY));
  } catch {
    return null;
  }
  const given = ledger[plan.key];
  if (given) return given;
  const pick = pickGift(plan.candidates, owned);
  if (!pick) return null;
  const next = { ...ledger, [plan.key]: pick };
  const keys = Object.keys(next);
  for (const old of keys.slice(0, Math.max(0, keys.length - LEDGER_MAX))) delete next[old];
  try {
    storage.setItem(LEDGER_KEY, JSON.stringify(next));
  } catch {
    return null;
  }
  addToPouch(storage, [pick.id]);
  return pick;
}

export function giftPlanOfReading(r: Pick<SavedReading, 'kind' | 'people' | 'concern'> & { question?: string }): GiftPlan | null {
  const p = r.people[0];
  if (!p) return null;
  try {
    const chart = computeChart({
      date: p.date,
      time: p.time,
      place: { name: p.place.name, country: p.place.country, lat: p.place.lat, lng: p.place.lng, tz: p.place.tz },
      sex: p.sex,
    });
    const free = r.kind === 'free';
    return giftPlan({
      chart: chartBlock(chart),
      concern: free ? r.concern : null,
      room: !free && isRoomKey(r.kind) ? r.kind : null,
      question: free ? null : (r.question ?? null),
    });
  } catch {
    return null;
  }
}
