'use client';

import { useLocale } from '@/components/locale-provider';
import Link from 'next/link';
import { UI } from '@/content/ui';
import { Logo } from '@/components/logo';
import { Stage } from '@/components/stage';

export function NotFoundContent() {
  useLocale();
  return (
    <Stage backdrop="/media/clips/enter-v2.jpg">
      <main id="main" className="relative z-10 flex min-h-dvh flex-col px-6 pb-[max(32px,var(--safe-bottom))] pt-[max(12px,var(--safe-top))]">
        <Logo className="-ml-1 self-start" />
        <div className="flex flex-1 flex-col justify-center gap-4 pb-16">
          <h1 className="t-display m-0 text-[3rem] leading-[1]">{UI.notFound.title}</h1>
          <p className="m-0 max-w-[26ch] text-[1.0625rem] leading-snug text-ink-soft">{UI.notFound.body}</p>
          <Link href="/" className="dg-btn dg-btn--primary mt-2 w-full">
            {UI.prose.backHome}
          </Link>
        </div>
      </main>
    </Stage>
  );
}
