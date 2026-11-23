'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ROOMS_COPY } from '@/content/rooms';
import { TALISMAN } from '@/content/talisman';
import type { GiftPlan, TalismanGift as Gift } from '@/lib/talisman';
import { talismanImageUrl } from '@/lib/talisman/art';
import type { Keeper } from '@/lib/rooms/themes';
import { useLocale } from '../locale-provider';
import { TalismanSheet } from './talisman-sheet';
import { receiveGift, useGiven } from './use-shelf';
import './talisman.css';

export function TalismanGift({ keeper, plan, className = '' }: { keeper: Keeper; plan: GiftPlan | null; className?: string }) {
  useLocale();
  const C = TALISMAN.gift;
  const [open, setOpen] = useState<Gift | null>(null);
  const key = plan?.key ?? '';
  const given = useGiven(key);

  useEffect(() => {
    if (plan) receiveGift(plan);
  }, [plan]);

  if (!given) return null;
  const item = TALISMAN.items[given.id];
  return (
    <section aria-labelledby="tl-gift-title" className={`tl-gift ${className}`.trim()} data-sticky-hide>
      <p className="tl-gift__eyebrow">{C.eyebrow(ROOMS_COPY.keepers[keeper].name)}</p>
      <h2 id="tl-gift-title" className="tl-gift__title">
        {C.title(1)}
      </h2>
      <ul className="tl-gift__row">
        <li className="tl-gift__item" data-kind={given.reason}>
          <button type="button" className="tl-icon" onClick={() => setOpen(given)} aria-label={`${C.look}: ${item.name}`}>
            <Image src={talismanImageUrl(given.id, { width: 192 })} alt="" width={192} height={288} unoptimized loading="lazy" />
          </button>
          <span className="tl-gift__name">{item.name}</span>
        </li>
      </ul>
      <p className="tl-gift__tap">{C.tap}</p>
      <p className="tl-gift__lead">{C.lead}</p>
      {open ? <TalismanSheet id={open.id} reason={C.reason[open.reason]} onClose={() => setOpen(null)} /> : null}
    </section>
  );
}
