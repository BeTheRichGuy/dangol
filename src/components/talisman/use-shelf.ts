'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { LEDGER_KEY, POUCH_EVENT, POUCH_KEY, giveGift, parseLedger, parsePouch } from '@/lib/talisman/shelf';
import type { GiftPlan, TalismanGift, TalismanId } from '@/lib/talisman';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(POUCH_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(POUCH_EVENT, onChange);
  };
}

function reader(key: string): () => string | null {
  return () => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };
}
const readPouch = reader(POUCH_KEY);
const readLedger = reader(LEDGER_KEY);

export function useShelf(): TalismanId[] {
  const raw = useSyncExternalStore(subscribe, readPouch, () => null);
  return useMemo(() => parsePouch(raw), [raw]);
}

export function useGiven(key: string): TalismanGift | null {
  const raw = useSyncExternalStore(subscribe, readLedger, () => null);
  return useMemo(() => parseLedger(raw)[key] ?? null, [raw, key]);
}

export function receiveGift(plan: GiftPlan): void {
  try {
    if (giveGift(window.localStorage, plan)) window.dispatchEvent(new Event(POUCH_EVENT));
  } catch {

  }
}
