'use client';

import { useSyncExternalStore } from 'react';
import type { ProductKey } from '@/lib/rooms/themes';
import { track } from '@/lib/analytics/track';

export type EntryFrom = 'free_result' | 'home';
export type Entry = EntryFrom | 'direct';

export interface ContinueMark {
  room: ProductKey;
  from: EntryFrom;

  at: number;

  payNow?: true;

  edition?: 'xmas';
}

const KEY = 'dangol.continue.v1';
const ONCE_PREFIX = 'dangol.once.v1.';

export const MARK_MAX_AGE_MS = 30 * 60 * 1000;

export function parseMark(raw: string | null, room: ProductKey, now: number): ContinueMark | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== 'object') return null;
    const m = v as Record<string, unknown>;
    if (m.room !== room) return null;
    if (m.from !== 'free_result' && m.from !== 'home') return null;
    if (typeof m.at !== 'number' || !Number.isFinite(m.at) || now - m.at > MARK_MAX_AGE_MS || m.at > now + 60_000) return null;
    return { room, from: m.from, at: m.at, ...(m.payNow === true ? { payNow: true as const } : {}), ...(m.edition === 'xmas' ? { edition: 'xmas' as const } : {}) };
  } catch {
    return null;
  }
}

export function markContinue(room: ProductKey, from: EntryFrom, now: number = Date.now(), payNow = false, edition?: 'xmas'): void {

  if (edition === 'xmas') track('xmas_cta');
  try {
    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({ room, from, at: now, ...(payNow ? { payNow: true as const } : {}), ...(edition ? { edition } : {}) } satisfies ContinueMark),
    );
  } catch {

  }
}

export function takePayNowEdition(room: ProductKey, now: number = Date.now()): { edition?: 'xmas' } | null {
  try {
    const mark = parseMark(window.sessionStorage.getItem(KEY), room, now);
    if (!mark?.payNow) return null;
    window.sessionStorage.setItem(KEY, JSON.stringify({ room: mark.room, from: mark.from, at: mark.at } satisfies ContinueMark));
    return mark.edition ? { edition: mark.edition } : {};
  } catch {
    return null;
  }
}

export function takePayNow(room: ProductKey, now: number = Date.now()): boolean {
  return takePayNowEdition(room, now) !== null;
}

export const XMAS_ROOM_PATH = '/room/love?xmas=1';
export function fromXmasUrl(search: string): boolean {
  return new URLSearchParams(search).get('xmas') === '1';
}

export function readContinue(room: ProductKey, now: number = Date.now()): ContinueMark | null {
  try {
    return parseMark(window.sessionStorage.getItem(KEY), room, now);
  } catch {
    return null;
  }
}

export function entryOf(room: ProductKey): Entry {
  return readContinue(room)?.from ?? 'direct';
}

export function clearContinue(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {

  }
}

export function claimOnce(name: string): boolean {
  try {
    const key = `${ONCE_PREFIX}${name}`;
    if (window.sessionStorage.getItem(key)) return false;
    window.sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return false;
  }
}

const noopSubscribe = () => () => {};

export function useEntry(room: ProductKey): Entry {
  return useSyncExternalStore(noopSubscribe, () => entryOf(room), () => 'direct');
}
