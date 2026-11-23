'use client';

import Link from 'next/link';
import { useRef, useSyncExternalStore, type RefObject } from 'react';
import { BUNDLE_PAGE } from '@/content/bundle';
import { BUNDLE_PROMO as T } from '@/content/bundle-promo';
import { activeLocale } from '@/content/locale';
import { ROOMS_COPY } from '@/content/rooms';
import { track } from '@/lib/analytics/track';
import { BUNDLE_LANTERNS, bundlePercentOff } from '@/lib/payments/bundle';
import { pickPercentOff } from '@/lib/payments/offers';
import { ChevronRightIcon } from '../icons';
import { useOnEnter } from '../result/use-in-view';
import { claimOnce } from '../rooms/continue';
import { parseBundlePending, readBundleRaw, subscribeBundlePending } from './bundle-store';
import './bundle-promo.css';

export type BundleFrom = 'free_result' | 'home' | 'room' | 'paid';

export function useBundleView(ref: RefObject<Element | null>, from: BundleFrom): void {
  useOnEnter(ref, () => {
    if (claimOnce(`bundle_view:${from}`)) track('bundle_view', { from });
  });
}

export function trackBundleClick(from: BundleFrom, pick = false): void {
  track('bundle_click', { from, ...(pick ? { pick: 1 } : {}) });
}

export function BundlePrice({ className, list = T.prices.list, now = T.prices.bundle, off }: { className?: string; list?: string; now?: string; off?: number }) {
  const pct = off ?? bundlePercentOff(activeLocale());
  return (
    <span className={className ? `bb-price ${className}` : 'bb-price'}>
      <span className="sr-only">{T.listSr} </span>
      <s className="bb-price__list">{list}</s>
      <svg className="bb-price__arrow" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
        <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-only"> {T.bundleSr} </span>
      <strong className="bb-price__now">{now}</strong>
      {pct > 0 ? <span className="bb-price__off">{ROOMS_COPY.percentOff(pct)}</span> : null}
    </span>
  );
}

export function BundleLine({ from }: { from: 'room' | 'paid' }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useBundleView(ref, from);

  const bought = useSyncExternalStore(
    subscribeBundlePending,
    () => parseBundlePending(readBundleRaw(window.sessionStorage))?.receipt != null,
    () => false,
  );
  if (bought) return null;
  const PK = BUNDLE_PAGE.pick;
  return (
    <>
      <Link ref={ref} href="/bundle" className="bb-line" onClick={() => trackBundleClick(from)}>
        <span className="bb-line__top">
          <span className="bb-line__name">{T.name}</span>
          <BundlePrice className="bb-price--line" />
        </span>
        <span className="bb-line__lanterns">{T.withLanterns(BUNDLE_LANTERNS)}</span>
        <ChevronRightIcon size={18} className="bb-line__go" />
      </Link>
      <Link href="/bundle?plan=pick" className="bb-line" onClick={() => trackBundleClick(from, true)}>
        <span className="bb-line__top">
          <span className="bb-line__name">{PK.name}</span>
          <BundlePrice className="bb-price--line" list={PK.list} now={PK.price} off={pickPercentOff(activeLocale())} />
        </span>
        <ChevronRightIcon size={18} className="bb-line__go" />
      </Link>
    </>
  );
}
