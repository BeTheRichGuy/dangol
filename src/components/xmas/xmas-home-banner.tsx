'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { XMAS_BANNER as T } from '@/content/xmas';
import { track } from '@/lib/analytics/track';
import { XMAS_OPEN } from '@/lib/xmas/open';
import { daysToClose } from '@/lib/xmas/season';
import { useLocale } from '../locale-provider';
import './xmas-home-banner.css';

const IMAGE = '/media/xmas/home-banner.jpg';
const noop = () => () => {};

function useClosed(): boolean | undefined {
  return useSyncExternalStore(noop, () => daysToClose(Date.now()) === 0, () => undefined);
}

export function XmasHomeBanner() {
  const locale = useLocale();
  const closed = useClosed();
  if (!XMAS_OPEN || closed !== false) return null;

  return (
    <section className="xb-slot">
      <Link href="/xmas" className="xb" lang={locale} aria-label={T.label} onClick={() => track('home_banner', { act: 'click' })}>
        <Image src={IMAGE} alt="" fill priority sizes="(min-width: 480px) 448px, calc(100vw - 32px)" className="xb__art" />
        <span className="xb__snow" aria-hidden="true" />
        <span className="xb__shade" aria-hidden="true" />
        <span className="xb__ribbon" aria-hidden="true">
          {T.ribbon}
        </span>
        <span className="xb__copy" aria-hidden="true">
          <span className="xb__over">{T.over}</span>
          <span className="xb__title">
            {T.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
          <span className="xb__quote">“ {T.quote} ”</span>
        </span>
      </Link>
    </section>
  );
}
