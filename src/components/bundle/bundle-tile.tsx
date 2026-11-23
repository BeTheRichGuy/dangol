'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { BUNDLE_PROMO as T } from '@/content/bundle-promo';
import { BUNDLE_LANTERNS } from '@/lib/payments/bundle';
import { ChevronRightIcon } from '../icons';
import { LanternIcon } from '../play/play-icons';
import { BundlePrice, trackBundleClick, useBundleView } from './bundle-line';
import '../account/account.css';
import './bundle-promo.css';

export function BundleTile() {
  const ref = useRef<HTMLAnchorElement>(null);
  useBundleView(ref, 'home');

  return (
    <div className="bb-tile-slot">
      <Link ref={ref} href="/bundle" className="ac-tile bb-tile" onClick={() => trackBundleClick('home')}>
        <span className="ac-tile__glyph" aria-hidden="true">
          五
        </span>
        <span className="bb-badge">{T.badge}</span>
        <span className="ac-tile__label">{T.name}</span>
        <BundlePrice className="bb-price--tile" />
        <span className="bb-tile__lanterns">
          <LanternIcon className="bb-lamp" />
          {T.withLanterns(BUNDLE_LANTERNS)}
        </span>
        <ChevronRightIcon size={18} className="ac-tile__go" />
      </Link>
    </div>
  );
}
