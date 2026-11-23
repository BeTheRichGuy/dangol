'use client';

import { useEffect } from 'react';

interface Sentinel {
  release(): Promise<void>;
}
interface NavigatorLike {
  wakeLock?: { request(type: 'screen'): Promise<Sentinel> };
}
interface DocumentLike {
  visibilityState: string;
  addEventListener(type: 'visibilitychange', fn: () => void): void;
  removeEventListener(type: 'visibilitychange', fn: () => void): void;
}

export function keepAwake(nav: NavigatorLike, doc: DocumentLike): () => void {
  let sentinel: Sentinel | null = null;
  let stopped = false;

  const acquire = async () => {
    if (stopped || sentinel || !nav.wakeLock || doc.visibilityState !== 'visible') return;
    try {
      const s = await nav.wakeLock.request('screen');
      if (stopped) {
        void s.release().catch(() => undefined);
        return;
      }
      sentinel = s;
    } catch {

    }
  };
  const onVisibility = () => {

    if (doc.visibilityState !== 'visible') sentinel = null;
    else void acquire();
  };

  doc.addEventListener('visibilitychange', onVisibility);
  void acquire();
  return () => {
    stopped = true;
    doc.removeEventListener('visibilitychange', onVisibility);
    const s = sentinel;
    sentinel = null;
    if (s) void s.release().catch(() => undefined);
  };
}

export function useKeepAwake(active: boolean) {
  useEffect(() => {
    if (!active) return;
    return keepAwake(navigator as unknown as NavigatorLike, document);
  }, [active]);
}
