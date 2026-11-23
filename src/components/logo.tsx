'use client';

import { useLocale } from '@/components/locale-provider';
import Link from 'next/link';
import { UI } from '@/content/ui';

export function Logo({ className = '', tone = 'ink' }: { className?: string; tone?: 'ink' | 'ivory' }) {
  useLocale();
  const color =
    tone === 'ivory'
      ? 'text-[color:var(--ivory)] [text-shadow:0_0_10px_rgba(var(--night-rgb),0.85)]'
      : 'text-ink [text-shadow:0_0_10px_rgba(var(--paper-rgb),0.9)]';
  return (
    <Link
      href="/"
      aria-label={UI.brand.homeLabel}
      className={`inline-flex min-h-11 items-center gap-2.5 ${color} ${className}`}
    >
      <span className="font-display text-[0.8125rem] font-semibold uppercase tracking-[0.34em]">
        {UI.brand.name}
      </span>
      <span aria-hidden="true" className="t-brush text-[1.5rem] leading-none">
        {UI.brand.hangul}
      </span>
    </Link>
  );
}
