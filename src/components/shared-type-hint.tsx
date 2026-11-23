'use client';

import { useSearchParams } from 'next/navigation';
import { TYPE_PROFILES } from '@/content/types';
import { UI } from '@/content/ui';
import type { TypeKey } from '@/lib/saju/types';

export function SharedTypeHint() {
  const t = useSearchParams().get('t');
  if (!t || !Object.hasOwn(TYPE_PROFILES, t)) return null;
  const profile = TYPE_PROFILES[t as TypeKey];
  return (
    <p
      className="dg-glass dg-glass--strong home-rise mb-5 flex w-fit max-w-full items-center gap-3 px-3.5 py-2.5"
      style={{ '--i': 0, borderRadius: 'var(--r-md)' } as React.CSSProperties}
    >
      <span
        aria-hidden="true"
        className="t-hanja grid h-10 w-10 shrink-0 place-content-center rounded-full bg-paper text-[0.875rem] leading-none text-ink"
        style={{ border: `1.5px solid ${profile.accent}` }}
      >
        {profile.hanzi}
      </span>
      <span className="grid gap-0.5">
        <span className="text-[0.9375rem] font-semibold leading-tight text-ink">{UI.home.sharedHint.lead(profile.born)}</span>
        <span className="text-[0.875rem] leading-tight text-ink-soft">{UI.home.sharedHint.ask}</span>
      </span>
    </p>
  );
}
