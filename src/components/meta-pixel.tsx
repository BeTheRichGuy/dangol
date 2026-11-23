'use client';

import { useEffect } from 'react';
import { readUtm } from './utm-capture';
import { fbcFromClickId, isMetaArrival, metaCookieIds } from '@/lib/analytics/meta';

const KEY = 'dangol.meta.v1';
const FBC_MAX_AGE = 90 * 24 * 60 * 60;

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void; push?: unknown };

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

function localHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.localhost');
}

function startPixel(id: string) {
  if (window.fbq) return;
  const q: unknown[] = [];
  const fbq: Fbq = (...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else q.push(args);
  };
  fbq.queue = q;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  window.fbq = fbq;
  window._fbq = fbq;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  fbq('set', 'autoConfig', false, id);
  fbq('init', id);
  fbq('track', 'PageView');
}

export function metaIdsForConfirm(): { fbp?: string; fbc?: string } {
  if (typeof document === 'undefined') return {};
  try {
    return metaCookieIds(document.cookie);
  } catch {
    return {};
  }
}

export function MetaPixel() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (!id || !/^\d{6,20}$/.test(id) || localHost(window.location.hostname)) return;
    let on = false;
    try {
      on = window.sessionStorage.getItem(KEY) === '1' || isMetaArrival(window.location.search, readUtm()?.utm_source);
      if (on) window.sessionStorage.setItem(KEY, '1');
    } catch {
      on = isMetaArrival(window.location.search);
    }
    if (!on) return;

    const fbc = fbcFromClickId(new URLSearchParams(window.location.search).get('fbclid'), Date.now());
    if (fbc) document.cookie = `_fbc=${fbc}; Max-Age=${FBC_MAX_AGE}; Path=/; SameSite=Lax; Secure`;
    startPixel(id);
  }, []);
  return null;
}
