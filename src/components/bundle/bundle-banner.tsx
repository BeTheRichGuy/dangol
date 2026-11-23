'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { BUNDLE_PROMO as T } from '@/content/bundle-promo';
import { BUNDLE_LANTERNS } from '@/lib/payments/bundle';
import { LanternIcon } from '../play/play-icons';
import { BundleFaces } from './bundle-faces';
import { BundlePrice, trackBundleClick, useBundleView } from './bundle-line';
import '../result/result.css';
import './bundle-promo.css';

export function BundleBanner() {
  const ref = useRef<HTMLElement>(null);
  useBundleView(ref, 'free_result');
  const B = T.banner;
  return (
    <section ref={ref} aria-label={T.name} className="bb-banner">
      <p className="bb-badge">{T.badge}</p>
      <h3 className="bb-banner__title">{B.title}</h3>
      <p className="bb-banner__price">
        <BundlePrice className="bb-price--big" />
      </p>
      <p className="bb-banner__lanterns">
        <LanternIcon className="bb-lamp" />
        {B.lanterns(BUNDLE_LANTERNS)}
      </p>
      <BundleFaces />
      <Link href="/bundle" className="dg-btn dg-btn--glow rs-cta bb-banner__cta" onClick={() => trackBundleClick('free_result')}>
        {B.cta}
      </Link>
    </section>
  );
}
