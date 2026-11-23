import type { BirthInput } from '@/lib/saju';
import type { PersonSnapshot, ReadingDraft, Relation } from './types';

const KEY = 'dangol.claim.v1';

const MAX = 6;

export interface GuestClaim {

  key: string;
  draft: ReadingDraft;
}

function read(store: Storage): GuestClaim[] {
  try {
    const v = JSON.parse(store.getItem(KEY) ?? '[]') as unknown;
    return Array.isArray(v) ? v.filter((c): c is GuestClaim => !!c && typeof c === 'object' && typeof (c as GuestClaim).key === 'string' && !!(c as GuestClaim).draft && typeof (c as GuestClaim).draft.body === 'string') : [];
  } catch {
    return [];
  }
}

function write(store: Storage, list: readonly GuestClaim[]): void {
  try {
    if (list.length) store.setItem(KEY, JSON.stringify(list.slice(-MAX)));
    else store.removeItem(KEY);
  } catch {

  }
}

export function addClaim(store: Storage, claim: GuestClaim): void {
  write(store, [...read(store).filter((c) => c.key !== claim.key), claim]);
}

export function takeClaims(store: Storage): GuestClaim[] {
  const list = read(store);
  if (list.length) write(store, []);
  return list;
}

export function putBack(store: Storage, failed: readonly GuestClaim[]): void {
  if (failed.length) write(store, [...read(store), ...failed]);
}

export function hasClaims(store: Storage): boolean {
  return read(store).length > 0;
}

export function guestSnapshot(name: string, input: BirthInput, relation: Relation): PersonSnapshot {
  const { place } = input;
  return {
    id: null,
    name,
    relation,
    date: input.date,
    time: input.time,
    place: { name: place.name, country: place.country, lat: place.lat, lng: place.lng, tz: place.tz, label: place.name },
    sex: input.sex,
  };
}
