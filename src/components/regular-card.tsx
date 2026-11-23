'use client';

import { useLocale } from '@/components/locale-provider';

import { UI } from '@/content/ui';
import { dateLocale } from '@/content/locale';
import { formatRegularNo, isFoundingRegular } from '@/lib/regular';
import { DateSeal } from './seal';

export function RegularCard({ regularNo, issuedIso }: { regularNo: number; issuedIso: string }) {
  useLocale();
  const issued = new Date(issuedIso);
  const month = new Intl.DateTimeFormat(dateLocale(), { month: 'short' }).format(issued);
  const day = String(issued.getDate());
  const year = String(issued.getFullYear());
  const founding = isFoundingRegular(regularNo);
  const shown = formatRegularNo(regularNo);

  return (
    <figure
      className="dg-hanji relative m-0 aspect-[1.62/1] overflow-hidden px-6 py-5"
      aria-label={UI.email.card.alt(shown)}
      style={{ outline: '1px solid var(--gold-line)', outlineOffset: '-9px' }}
    >
      <p className="m-0 font-display text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-ink-soft">
        {UI.email.card.brandline}
      </p>
      <div className="mt-1 flex flex-col items-start">
        <span className="font-display text-[1.125rem] font-medium italic text-ink-soft">{UI.email.card.label}</span>
        <span
          className="t-brush block text-[6.25rem] leading-[0.95]"
          style={{ color: founding ? 'var(--seal-ink)' : 'var(--ink)' }}
        >
          {shown}
        </span>
      </div>
      {founding ? (
        <p className="absolute bottom-4 left-6 m-0 text-[0.8125rem] font-medium text-ink-soft">{UI.email.card.founding}</p>
      ) : null}
      <DateSeal month={month} day={day} year={year} size={84} className="absolute bottom-3 right-5 -rotate-6" />
    </figure>
  );
}
