import type { ReactNode } from 'react';
import { ROOMS_COPY } from '@/content/rooms';
import './price-deal.css';

export function PriceDeal({
  now,
  was,
  tag = false,
  stack = false,
  off = 0,
  wasSr = ROOMS_COPY.first.wasSr,
}: {
  now: string;
  was: string | null;
  tag?: boolean;
  stack?: boolean;
  off?: number;
  wasSr?: string;
}) {
  if (was === null) return <>{now}</>;
  return (
    <span className={stack ? 'rm-deal rm-deal--stack' : 'rm-deal'}>
      {tag ? <span className="rm-deal__tag">{ROOMS_COPY.first.tag}</span> : null}
      <s className="rm-deal__was">
        <span className="sr-only">{wasSr} </span>
        {was}
      </s>
      <span className="rm-deal__arrow" aria-hidden="true">
        →
      </span>
      <strong className="rm-deal__now">{now}</strong>
      {off > 0 ? <span className="rm-deal__off">{ROOMS_COPY.percentOff(off)}</span> : null}
    </span>
  );
}

export function dealText(text: string, find: string, now: string, was: string | null, wasSr?: string): ReactNode {
  const parts = text.split(find);
  if (parts.length === 1) return text;
  return parts.flatMap((part, i) => (i === 0 ? [part] : [<PriceDeal key={i} now={now} was={was} wasSr={wasSr} />, part]));
}
