'use client';

import { useSyncExternalStore } from 'react';
import { cleanBalance } from './tokens';

const KEY = 'dangol.tokens.v1';
const listeners = new Set<() => void>();

function read(): number {
  try {
    return cleanBalance(JSON.parse(window.localStorage.getItem(KEY) ?? 'null')?.balance);
  } catch {
    return 0;
  }
}

function write(balance: number) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ balance: cleanBalance(balance) }));
  } catch {

  }
  for (const fn of listeners) fn();
}

export function getBalance(): number {
  return read();
}

export function addTokens(n: number): number {
  const next = cleanBalance(read() + n);
  write(next);
  return next;
}

export function spendTokens(n: number): boolean {
  const now = read();
  if (n <= 0 || now < n) return false;
  write(now - n);
  return true;
}

const BEST_KEY = 'dangol.flap.best.v1';

export function getBest(): number {
  try {
    const n = Number(window.localStorage.getItem(BEST_KEY));
    return Number.isFinite(n) ? Math.max(0, Math.min(9999, Math.floor(n))) : 0;
  } catch {
    return 0;
  }
}

export function saveBest(n: number): void {
  try {
    window.localStorage.setItem(BEST_KEY, String(Math.max(0, Math.min(9999, Math.floor(n)))));
  } catch {

  }
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) fn();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}

export function useBalance(): number {
  return useSyncExternalStore(subscribe, read, () => 0);
}

let serverBalance: number | null = null;

export function setServerBalance(n: number | null): void {
  serverBalance = n === null ? null : cleanBalance(n);
  for (const fn of listeners) fn();
}

export function useServerBalance(): number | null {
  return useSyncExternalStore(subscribe, () => serverBalance, () => null);
}

let serverChecked: boolean | null = null;

export function setServerChecked(v: boolean | null): void {
  serverChecked = v;
  for (const fn of listeners) fn();
}

export function useServerChecked(): boolean | null {
  return useSyncExternalStore(subscribe, () => serverChecked, () => null);
}
