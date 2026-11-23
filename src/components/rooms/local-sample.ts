'use client';

import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

export function readLocalSample(): boolean {
  try {
    const host = window.location.hostname;
    const local = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    return local && new URLSearchParams(window.location.search).has('sample');
  } catch {
    return false;
  }
}

export function useLocalSample(): boolean {
  return useSyncExternalStore(noopSubscribe, readLocalSample, () => false);
}
