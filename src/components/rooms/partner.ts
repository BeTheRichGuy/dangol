'use client';

import { useSyncExternalStore } from 'react';
import { isPairKind, type PairKind } from '@/lib/rooms/themes';
import type { PlaceChoice } from '../flow/answers';

export interface Partner {
  name: string;

  date: string;

  time: string | null;
  place: PlaceChoice;

  sex: 'female' | 'male' | null;
  kind: PairKind;
}

const KEY = 'dangol.partner.v1';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

let cachedRaw: string | null | undefined;
let cached: Partner | null = null;
let memory: Partner | null | undefined;
const listeners = new Set<() => void>();

function parse(raw: string | null): Partner | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    const p = v.place as Record<string, unknown> | undefined;
    if (
      typeof v.date !== 'string' ||
      !DATE_RE.test(v.date) ||
      !(v.time === null || (typeof v.time === 'string' && TIME_RE.test(v.time))) ||
      !p ||
      typeof p.name !== 'string' ||
      typeof p.tz !== 'string' ||
      typeof p.lat !== 'number' ||
      typeof p.lng !== 'number' ||
      !isPairKind(v.kind)
    ) {
      return null;
    }
    return {
      name: typeof v.name === 'string' ? v.name.slice(0, 24) : '',
      date: v.date,
      time: v.time as string | null,
      place: {
        name: p.name,
        country: typeof p.country === 'string' ? p.country : '',
        lat: p.lat,
        lng: p.lng,
        tz: p.tz,
        label: typeof p.label === 'string' ? p.label : p.name,
      },
      sex: v.sex === 'female' || v.sex === 'male' ? v.sex : null,
      kind: v.kind,
    };
  } catch {
    return null;
  }
}

function getPartner(): Partner | null {
  if (memory !== undefined) return memory;
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return cached;
}

export function savePartner(p: Partner): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(p));
    memory = undefined;
  } catch {
    memory = p;
  }
  for (const l of listeners) l();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function usePartner(): Partner | null {
  return useSyncExternalStore(subscribe, getPartner, () => null);
}
