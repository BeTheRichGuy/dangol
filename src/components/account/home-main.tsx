'use client';

import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { ACCOUNT } from '@/content/account';
import { methodOf } from '@/lib/account/config';
import { BUNDLES_ON } from '@/lib/payments/bundle';
import { BundleTile } from '../bundle/bundle-tile';
import { CheckinCard } from '../chat/checkin-card';
import { useLocale } from '../locale-provider';
import { FREE_CARD_ART } from '../scene/manifest';
import { SharedTypeHint } from '../shared-type-hint';
import { SiteFooter } from '../site-footer';
import { XmasHomeBanner } from '../xmas/xmas-home-banner';
import { useAccount } from './account-provider';
import { FreeCard, HomeTabs, HomeTop, RoomPoster, usePosterItems } from './home-parts';
import './account.css';

export function HomeMain() {
  useLocale();
  const H = ACCOUNT.home;
  const router = useRouter();
  const { ready, user, people, signOut } = useAccount();
  const self = people.find((p) => p.relation === 'self');
  const name = self?.name ?? user?.displayName ?? '';
  const method = methodOf(user?.provider ?? null);
  const posters = usePosterItems();

  return (
    <main id="top" className="rs-night ac-home hm">
      <HomeTop />

      {}
      <h1 className="sr-only">{H.greeting(user ? name : '')}</h1>

      {}
      <Suspense fallback={null}>
        <div className="hm-pad">
          <SharedTypeHint />
        </div>
      </Suspense>

      <div className="hm-pad hm-page-head">
        <p className="hm-eyebrow">{H.roomsEyebrow}</p>
        <h2 className="hm-h2">{H.roomsHeading}</h2>
      </div>

      {}
      <XmasHomeBanner />

      <section className="hm-pad">
        <FreeCard art={FREE_CARD_ART} />
      </section>

      {}
      <div className="hm-pad hm-checkin">
        <CheckinCard />
      </div>

      {BUNDLES_ON ? <BundleTile /> : null}

      <ul id="rooms" className="hm-pad hm-grid" aria-label={H.roomsEyebrow}>
        {posters.map((it, i) => (
          <li key={it.key} className="hm-grid__item">
            <p className="hm-grid__q">{it.question}</p>
            <RoomPoster item={it} index={i} />
          </li>
        ))}
      </ul>

      <div className="hm-pad ac-foot">
        {ready && user ? (
          <p className="ac-foot__who">
            <span>{method ? H.signedInWith(ACCOUNT.login.methodNames[method]) : ''}</span>
            <button
              type="button"
              className="ac-foot__out"
              onClick={() => {
                void signOut().then(() => router.push('/'));
              }}
            >
              {ACCOUNT.login.signOut}
            </button>
          </p>
        ) : null}
        <SiteFooter className="mt-4" />
      </div>

      <HomeTabs active="home" />
    </main>
  );
}
