'use client';

import Link from 'next/link';
import { ACCOUNT } from '@/content/account';
import { ChevronLeftIcon } from '../icons';
import { useLocale } from '../locale-provider';

export function BackToArchive() {
  useLocale();
  return (
    <Link href="/archive" className="dg-btn dg-btn--glass mt-10 w-full" data-sticky-hide>
      <ChevronLeftIcon size={18} />
      <span>{ACCOUNT.archive.backToList}</span>
    </Link>
  );
}
