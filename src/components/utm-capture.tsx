'use client';

import { useEffect } from 'react';

const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
export const UTM_STORAGE_KEY = 'dangol.utm.v1';

export function UtmCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const found: Record<string, string> = {};
      for (const key of KEYS) {
        const value = params.get(key);
        if (value) found[key] = value.slice(0, 100);
      }
      if (Object.keys(found).length > 0 && !window.sessionStorage.getItem(UTM_STORAGE_KEY)) {
        window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(found));
      }
    } catch {

    }
  }, []);
  return null;
}

export function readUtm(): Record<string, string> | undefined {
  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    const out: Record<string, string> = {};
    for (const key of KEYS) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === 'string') out[key] = value;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  } catch {
    return undefined;
  }
}
