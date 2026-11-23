'use client';

import { useEffect, useState } from 'react';
import { XMAS } from '@/content/xmas';
import type { Locale } from '@/content/locale';
import { useLocale } from '../locale-provider';

const MIN = 100;
const asked = new Map<Locale, Promise<number | null>>();

function viewers(locale: Locale): Promise<number | null> {
  let p = asked.get(locale);
  if (!p) {
    p = fetch(`/api/xmas/viewers?locale=${locale}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ count?: unknown }>) : null))
      .then((v) => (v && typeof v.count === 'number' ? v.count : null))
      .catch(() => null);
    asked.set(locale, p);
  }
  return p;
}

export function XmasViewers({ className }: { className?: string }) {
  const locale = useLocale();
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    void viewers(locale).then((n) => {
      if (live) setCount(n);
    });
    return () => {
      live = false;
    };
  }, [locale]);
  if (count === null || count < MIN) return null;
  return <p className={className}>{XMAS.cta.viewers.replace('{n}', count.toLocaleString(locale))}</p>;
}
