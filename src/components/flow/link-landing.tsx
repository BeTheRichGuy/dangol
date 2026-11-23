'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isLocale } from '@/content/locale';
import { TYPE_PROFILES } from '@/content/types';
import { track } from '@/lib/analytics/track';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

const SOCIAL_DOMAINS: readonly (readonly [string, string])[] = [
  ['instagram.com', 'instagram'],
  ['tiktok.com', 'tiktok'],
  ['youtube.com', 'youtube'],
  ['youtu.be', 'youtube'],
  ['x.com', 'x'],
  ['twitter.com', 'x'],
  ['t.co', 'x'],
];

export function socialReferrer(referrer: string, ownHost = ''): string | null {
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host || host === ownHost.toLowerCase()) return null;
  for (const [domain, name] of SOCIAL_DOMAINS) {

    if (host === domain || host.endsWith(`.${domain}`)) return name;
  }
  return null;
}

export function homeTarget(search: string, referrer = '', ownHost = ''): string {
  const q = new URLSearchParams(search);
  const source = q.get('utm_source')?.trim();
  const social = source ? null : socialReferrer(referrer, ownHost);
  const out = new URLSearchParams();
  const l = q.get('l');
  if (isLocale(l)) out.set('l', l);
  const t = q.get('t');
  if (t && Object.hasOwn(TYPE_PROFILES, t)) out.set('t', t);
  for (const key of UTM_KEYS) {
    const value = q.get(key)?.trim();
    if (value) out.set(key, value.slice(0, 100));
  }
  if (social) {
    out.set('utm_source', social);
    out.set('utm_medium', 'referral');
  }
  const query = out.toString();
  return query ? `/home?${query}` : '/home';
}

let entered = false;

export function LinkLanding() {
  const router = useRouter();

  useEffect(() => {
    const first = !entered;
    entered = true;
    if (first) track('landing_view');
    router.replace(homeTarget(window.location.search, first ? document.referrer : '', window.location.hostname));
  }, [router]);
  return null;
}
