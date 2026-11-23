'use client';

import { useSyncExternalStore } from 'react';
import { useReducedMotion } from '../use-reduced-motion';

function noopSubscribe(): () => void {
  return () => {};
}

function readSaveData(): boolean {
  try {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return conn?.saveData === true;
  } catch {
    return false;
  }
}

export function useVideoAllowed(): boolean {
  const reduced = useReducedMotion();
  const saveData = useSyncExternalStore(noopSubscribe, readSaveData, () => false);
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return hydrated && !reduced && !saveData;
}
