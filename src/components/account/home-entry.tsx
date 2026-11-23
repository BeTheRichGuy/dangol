'use client';

import Link from 'next/link';
import { ACCOUNT } from '@/content/account';
import { ROOMS_COPY } from '@/content/rooms';
import { UI } from '@/content/ui';
import { isContinueLocale } from '@/lib/rooms/continue-locales';
import { FollowButton } from '../flow/follow-button';
import { useLocale } from '../locale-provider';
import { useAccount } from './account-provider';
import { LoginPanel } from './login-panel';
import './account.css';

export function HomeEntry() {
  const A = ACCOUNT.login;
  const { mode, ready, user, people } = useAccount();
  const locale = useLocale();
  const self = people.find((p) => p.relation === 'self');

  if (mode === 'off') {
    return (
      <>
        <FollowButton />
        <p className="ac-soon ac-soon--home">{A.soon}</p>
        <div className="mt-1 text-center">
          <Link href="/home" className="dg-link t-small font-semibold text-ink">
            {ROOMS_COPY.home.heroLink}
          </Link>
        </div>
      </>
    );
  }

  if (ready && user) {
    return (
      <>
        <p className="ac-welcome">{A.welcome(self?.name ?? user.displayName ?? '')}</p>
        <Link href="/home" className="dg-btn dg-btn--primary w-full">
          {A.enter}
        </Link>
        <div className="mt-2.5">
          <FollowButton className="dg-btn dg-btn--glass w-full" />
        </div>
      </>
    );
  }

  if (isContinueLocale(locale)) {
    return (
      <>
        <FollowButton />
        <div className="mt-4">
          <LoginPanel next="/home" />
        </div>
        <p className="ac-free">{UI.home.keepLine}</p>
        <div className="mt-1 text-center">
          <Link href="/home#rooms" className="dg-link t-small font-semibold text-ink">
            {UI.home.topicsLink}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <LoginPanel next="/home" />
      <p className="ac-or" aria-hidden="true">
        <span>{A.or}</span>
      </p>
      <FollowButton className="dg-btn dg-btn--glass w-full" />
      <p className="ac-free">{A.freeLine}</p>
    </>
  );
}
