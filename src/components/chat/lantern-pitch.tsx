'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { CHAT } from '@/content/chat';
import { ROOMS_COPY } from '@/content/rooms';
import { track } from '@/lib/analytics/track';
import { CHAT_CHARACTERS, type ChatKey } from '@/lib/chat/characters';
import { ChevronRightIcon } from '../icons';
import { LanternIcon } from '../play/play-icons';
import { PriceDeal } from '../rooms/price-deal';
import { useRoomPrice } from '../rooms/use-room-price';
import './chat.css';

export function LanternPitch({ who }: { who: ChatKey }) {
  const T = CHAT.room;
  const P = T.pitch;
  const { price, was, first } = useRoomPrice();
  const room = CHAT_CHARACTERS[who].room;
  const href = first ? `/room/${room}` : '/home#rooms';

  useEffect(() => {
    track('lantern_pitch', { act: 'view' });
  }, []);

  return (
    <div className="ch-gate ch-pitch" data-first={first || undefined}>
      <div className="ch-pitch__head">
        <LanternIcon className="ch-pitch__lamp" lit={0} />
        <span className="ch-pitch__out">{T.noTokens}</span>
      </div>
      {first ? <span className="ch-pitch__tag">{ROOMS_COPY.first.tag}</span> : null}
      <strong className="ch-pitch__title">{first ? P.firstTitle : P.moreTitle}</strong>
      <p className="ch-pitch__body">{first ? P.firstBody : P.moreBody}</p>
      <Link href={href} className="ch-pitch__cta" onClick={() => track('lantern_pitch', { act: 'click', first: first ? 1 : 0, room })}>
        <span className="ch-pitch__ctatext">{first ? P.firstCta : P.moreCta}</span>
        {first ? (
          <span className="ch-pitch__price">
            <PriceDeal now={price} was={was} stack />
          </span>
        ) : null}
        <ChevronRightIcon size={18} className="ch-pitch__arrow" />
      </Link>
      <p className="ch-pitch__tomorrow">{P.tomorrow}</p>
    </div>
  );
}
