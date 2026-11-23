'use client';

import { useLocale } from '@/components/locale-provider';
import Link from 'next/link';
import { UI } from '@/content/ui';
import { BusinessInfo } from './business-info';

export function SiteFooter({
  className = '',
  center = true,
  disclosure = true,
}: {
  className?: string;
  center?: boolean;

  disclosure?: boolean;
}) {
  useLocale();
  return (
    <footer className={`${center ? 'text-center' : ''} ${className}`}>
      {disclosure && UI.common.disclosure ? <p className="t-small text-ink-soft">{UI.common.disclosure}</p> : null}
      <nav
        aria-label={UI.common.siteNav}
        className={`mt-1 flex flex-wrap items-center gap-x-2 ${center ? 'justify-center' : ''}`}
      >
        <Link href="/about" className="dg-link t-small text-ink">
          {UI.common.links.about}
        </Link>
        <Link href="/pricing" className="dg-link t-small text-ink">
          {UI.common.links.pricing}
        </Link>
        <Link href="/privacy" className="dg-link t-small text-ink">
          {UI.common.links.privacy}
        </Link>
        <Link href="/terms" className="dg-link t-small text-ink">
          {UI.common.links.terms}
        </Link>
        <Link href="/refund" className="dg-link t-small text-ink">
          {UI.common.links.refund}
        </Link>
      </nav>
      <BusinessInfo className="mt-2" />
    </footer>
  );
}
