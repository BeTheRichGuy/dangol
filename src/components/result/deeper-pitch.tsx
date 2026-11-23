'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RESULT_UI, type ChapterWhen } from '@/content/result-ui';
import { ROOMS_COPY } from '@/content/rooms';
import type { ChapterInfo } from '@/lib/reading/traits-types';
import { ROOMS, ROOM_KEYS } from '@/lib/rooms/themes';
import type { TypeKey } from '@/lib/saju';
import { SealStamp } from '../seal';
import { useReducedMotion } from '../use-reduced-motion';
import { Bubble, Narration, Panel, WritingBubble, type BubbleSide } from '../webtoon';
import './result.css';
import { artFor, framingProps, sideOf } from './art-plan';
import { balloonsMax } from './balloons';
import { dealText } from '../rooms/price-deal';
import { useRoomPrice } from '../rooms/use-room-price';
import { useOnEnter } from './use-in-view';

const D = RESULT_UI.deeper;

const WRITING_MS = 600;

interface Slot {
  key: string;
  node: ReactNode;
}

export function DeeperPitch({
  chapter,
  when,
  mapOpen,
  name,
  type,
}: {

  chapter: ChapterInfo | null;

  when: ChapterWhen | null;

  mapOpen: boolean;
  name: string;

  type: TypeKey;
}) {
  const reduced = useReducedMotion();
  const head = useRef<HTMLDivElement>(null);

  const [started, setStarted] = useState(false);

  const [step, setStep] = useState(0);

  const bridge = chapter
    ? D.bridge(chapter, name, when, chapter.next?.title ?? null)
    : mapOpen
      ? D.bridgeGeneric
      : D.bridgeNoSex;

  const sideAt = (i: number, start: BubbleSide = 'left'): BubbleSide =>
    (i % 2 === 0) === (start === 'left') ? 'left' : 'right';

  const yulLines = [...balloonsMax(bridge), D.want];
  const { price, was } = useRoomPrice();
  const priceLines = balloonsMax(D.honest(price));

  const slots: Slot[] = [
    {
      key: 'yul',
      node: (
        <div className="grid gap-3">
          {yulLines.map((text, i) => (
            <Bubble key={i} side={sideAt(i)} tail="none">
              <p>{text}</p>
            </Bubble>
          ))}
        </div>
      ),
    },
    {
      key: 'menu',
      node: (
        <Narration serif className="rs-menu">
          <p className="rs-menu__lead">{D.menuHeading}</p>
          <ul className="rs-menu__list">
            {ROOM_KEYS.map((key) => {
              const room = ROOMS_COPY.rooms[key];
              return (
                <li key={key}>
                  <Link href={`/room/${key}`} className="rs-menu__room">
                    <span className="rs-menu__title">{room.title}</span>
                    <span className="rs-menu__line">
                      {ROOMS_COPY.keepers[ROOMS[key].keeper].name} · {room.line}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Narration>
      ),
    },
    {
      key: 'price',
      node: (
        <div className="grid gap-3">
          {priceLines.map((text, i) => (
            <Bubble key={i} side={sideAt(i, 'right')} tail="none" className={i === 0 ? '!pr-14' : undefined}>
              {i === 0 ? <SealStamp size={44} className="rs-stamp" /> : null}
              <p>{dealText(text, price, price, was)}</p>
            </Bubble>
          ))}
        </div>
      ),
    },
  ];
  const total = slots.length;
  const shown = reduced ? total : step;
  const finished = shown >= total;

  const writing = started && step < total;
  useEffect(() => {
    if (!started || step >= total) return;
    const t = window.setTimeout(() => setStep((n) => n + 1), WRITING_MS);
    return () => window.clearTimeout(t);
  }, [started, step, total]);

  useOnEnter(head, () => setStarted(true), { rootMargin: '0px 0px -35% 0px', orAbove: true });

  return (
    <section aria-label={RESULT_UI.deeper.sectionLabel}>
      {}
      <div ref={head}>
        {}
        <Panel image={artFor('deeper', type) ?? undefined} {...framingProps('deeper')} className="wt-panel--gold">
          <Bubble side={sideOf('deeper', 'right')} tail="up" size="lg">
            <p>{D.lead}</p>
          </Bubble>
        </Panel>
      </div>

      {}
      <div className="mt-6 grid gap-3">
        {slots.map((slot, i) => {
          const isShown = i < shown;
          const isWriting = !reduced && writing && i === step;
          return (
            <div key={slot.key} className="relative">
              <div className={isShown ? 'wt-pop' : 'rs-hidden'} aria-hidden={!isShown} inert={!isShown}>
                {slot.node}
              </div>
              {isWriting ? (
                <div className={`absolute top-0 ${sideAt(i) === 'left' ? 'left-0' : 'right-0'}`}>
                  <WritingBubble side={sideAt(i)} />
                </div>
              ) : null}
            </div>
          );
        })}

        {}
        <div className={`mt-3 grid justify-items-stretch gap-2 text-center ${finished ? 'wt-pop' : 'rs-hidden'}`} inert={!finished}>
          <Link href="/home#rooms" className="dg-btn dg-btn--glow rs-cta">
            {D.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
