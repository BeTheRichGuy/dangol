'use client';

import { useSyncExternalStore } from 'react';

export interface GateArrivalOrigin {
  x: string;
  y: string;
}

const DEFAULT_ORIGIN: GateArrivalOrigin = { x: '50%', y: '50%' };

const LENGTH_OK = /^-?\d+(\.\d+)?(px|%)$/;

let arrived = false;
let arrivedAt = 0;
let arrivedOrigin: GateArrivalOrigin = DEFAULT_ORIGIN;

const EXPIRE_MS = 10_000;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

export function markGateArrival(origin?: { x: string; y: string }): void {
  arrived = true;
  arrivedAt = performance.now();
  arrivedOrigin =
    origin && LENGTH_OK.test(origin.x) && LENGTH_OK.test(origin.y) ? { x: origin.x, y: origin.y } : DEFAULT_ORIGIN;
  emit();
}

export function clearGateArrival(): void {
  if (!arrived) return;
  arrived = false;
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function peekGateArrival(): GateArrivalOrigin | null {
  return arrived && performance.now() - arrivedAt < EXPIRE_MS ? arrivedOrigin : null;
}

export function useGateArrival(): GateArrivalOrigin | null {
  return useSyncExternalStore(subscribe, peekGateArrival, () => null);
}
