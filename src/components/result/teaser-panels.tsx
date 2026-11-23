'use client';

import Link from 'next/link';
import { Fragment } from 'react';
import { RevealText } from '@/components/mystic';
import { FREE_RESULT } from '@/content/continue';
import { TEASER_COPY_KO as T } from '@/content/ko/teasers';
import { ROOMS_COPY } from '@/content/rooms';
import { track } from '@/lib/analytics/track';
import type { TeaserCard } from '@/lib/reading/teasers';
import { ROOMS } from '@/lib/rooms/themes';
import type { TypeKey } from '@/lib/saju';
import { CheckIcon, LockIcon } from '../icons';
import { markContinue } from '../rooms/continue';
import { PriceDeal } from '../rooms/price-deal';
import { useRoomPrice } from '../rooms/use-room-price';
import { Bubble, Narration, Panel } from '../webtoon';
import './result.css';
import { artFor, framingProps, sideOf, type ArtSlot } from './art-plan';
import { DustWhenSeen } from './scenes';

export type TeaserSlot = Extract<ArtSlot, 'teaseTiming' | 'teasePeople' | 'teaseGap'>;

export const TEASER_SLOT: Record<TeaserCard['kind'], TeaserSlot> = { timing: 'teaseTiming', people: 'teasePeople', gap: 'teaseGap' };

function Hidden({ n }: { n: number }) {
  const bars = Array.from({ length: n }, (_, i) => '▒'.repeat([4, 6, 3, 5][i % 4])).join(' ');
  return (
    <>
      <span className="rs-blur" aria-hidden="true">
        {' '}
        {bars}
      </span>
      <span className="sr-only"> {FREE_RESULT.hiddenSr}</span>
    </>
  );
}

export function Para({ text, hidden, tail }: { text: string; hidden: number; tail: boolean }) {
  const parts = text.split('{blur}');
  return (
    <p>
      {parts.map((seg, i) => (
        <Fragment key={i}>
          {seg}
          {i < parts.length - 1 ? <Hidden n={hidden} /> : null}
        </Fragment>
      ))}
      {parts.length === 1 && tail && hidden > 0 ? <Hidden n={hidden} /> : null}
    </p>
  );
}

export function LockBox({ card }: { card: TeaserCard }) {
  const { lock } = card;
  const { price, was } = useRoomPrice();
  const room = ROOMS_COPY.rooms[lock.room];
  return (
    <Narration serif className="rs-lock">
      <p className="rs-lock__head">
        <LockIcon size={18} /> {T.lockHeading}
      </p>
      <p className="rs-lock__room">{T.roomOf(lock.sections, room.title)}</p>
      <ul className="rs-lock__list">
        {lock.items.map((item) => (
          <li key={item}>
            <CheckIcon size={16} /> <span>{item}</span>
          </li>
        ))}
      </ul>
      <Link
        href={`/room/${lock.room}`}
        className="dg-btn dg-btn--paper rs-lock__btn"
        data-room={lock.room}
        onClick={() => {

          markContinue(lock.room, 'free_result');
          track('room_click', { room: lock.room, pos: 'result_teaser' });
        }}
      >
        <span className="rs-lock__main">
          {ROOMS_COPY.keepers[ROOMS[lock.room].keeper].name} · {room.title} {T.openSuffix}
        </span>
        <span className="rs-lock__price">
          <PriceDeal now={price} was={was} />
        </span>
      </Link>
    </Narration>
  );
}

export function TeaserCardView({ card, type, withLock = true }: { card: TeaserCard; type: TypeKey; withLock?: boolean }) {
  const slot = TEASER_SLOT[card.kind];
  const first = sideOf(slot);
  const paragraphs = card.body.split('\n\n');
  return (
    <div data-teaser={card.kind} className="grid gap-3">
      <Panel
        image={artFor(slot, type) ?? undefined}
        {...framingProps(slot)}
        bloom
        layer={<DustWhenSeen density={0.5} />}
        className={card.kind === 'people' ? 'wt-mood-warn' : 'wt-mood-tease'}
        dim={card.kind === 'people'}
      >
        <Bubble side={first} tail="up" size="lg">
          <p className="rs-teaser__lead">
            <RevealText text={card.lead} />
          </p>
        </Bubble>
        {paragraphs.map((p, i) => (
          <Bubble key={p} side={first} tail="none">
            <Para text={p} hidden={card.hidden} tail={i === paragraphs.length - 1} />
          </Bubble>
        ))}
      </Panel>
      {}
      {withLock ? <LockBox card={card} /> : null}
    </div>
  );
}
