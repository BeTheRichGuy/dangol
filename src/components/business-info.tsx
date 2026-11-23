'use client';

import { useLocale } from '@/components/locale-provider';
import { activeLocale } from '@/content/locale';
import { businessRows, ftcUrl } from '@/content/business';
import { UI } from '@/content/ui';

export function BusinessInfo({ className = '' }: { className?: string }) {
  useLocale();
  const B = UI.common.business;
  const rows = businessRows(activeLocale());
  return (
    <div className={`text-[0.75rem] leading-relaxed text-ink-soft ${className}`}>
      <p>
        {rows.map((r, i) => (
          <span key={r.field}>
            {i > 0 ? <span aria-hidden="true"> · </span> : null}
            {B.labels[r.field]}
            {B.colon}
            {r.field === 'phone' ? (
              <a href={`tel:${r.value}`} className="underline-offset-2 hover:underline">
                {r.value}
              </a>
            ) : (
              r.value
            )}
          </span>
        ))}
      </p>
      <p>
        <a href={ftcUrl()} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {B.verify}
        </a>
      </p>
    </div>
  );
}
