'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { CONTINUE as T, STICKY as S } from '@/content/continue';
import { ROOMS_COPY } from '@/content/rooms';
import { track } from '@/lib/analytics/track';
import { roomOffer } from '@/lib/rooms/offer';
import { ArrowRightIcon } from '../icons';
import type { TypeKey } from '@/lib/saju';
import { claimOnce, markContinue } from '../rooms/continue';
import { PriceDeal } from '../rooms/price-deal';
import { useRoomPrice } from '../rooms/use-room-price';
import { Bubble, Narration, Panel } from '../webtoon';
import './result.css';
import { artFor, framingProps, sideOf } from './art-plan';
import { OtherKeepers } from './other-keepers';
import { useOnEnter } from './use-in-view';

export function ContinuePitch({ type }: { type: TypeKey }) {
  const head = useRef<HTMLDivElement>(null);
  const offer = roomOffer('life');
  const { price, was, off } = useRoomPrice();

  useOnEnter(
    head,
    () => {
      if (claimOnce('continue_view')) track('continue_view', { room: 'life' });
    },
    { rootMargin: '0px 0px -35% 0px', orAbove: true },
  );

  return (
    <section aria-label={T.sectionLabel} data-sticky-hide>
      {}
      <div ref={head}>
        <Panel image={artFor('deeper', type) ?? undefined} {...framingProps('deeper')} className="wt-panel--gold">
          <Bubble side={sideOf('deeper', 'right')} tail="up" size="lg">
            <p>{T.lead}</p>
          </Bubble>
        </Panel>
      </div>

      <div className="mt-6 grid gap-3">
        <Narration serif className="rs-menu">
          <p className="rs-menu__lead">{T.questionsHeading}</p>
          <ul className="rs-menu__list">
            {T.questions.map((q) => (
              <li key={q}>
                <span className="rs-menu__line !mt-0 !text-ink">{q}</span>
              </li>
            ))}
          </ul>
        </Narration>

        <Narration serif className="rs-menu rs-offer">
          <p className="rs-menu__lead">{T.menuHeading}</p>
          <p className="rs-offer__legend">{T.legend}</p>
          <ol className="rs-menu__list">
            {offer.lines.map((l) => (
              <li key={l.n} className="rs-offer__item">
                <span className="rs-menu__title">
                  <span className="rs-offer__n" aria-hidden="true">
                    {String(l.n).padStart(2, '0')}
                  </span>
                  {l.title}
                </span>
                <span className="rs-menu__line">{l.answer ?? l.line}</span>
                <span className="rs-offer__tag" data-kind={l.free ?? 'new'}>
                  {T.tags[l.free ?? 'new']}
                </span>
              </li>
            ))}
          </ol>
          <p className="rs-offer__format">{T.format}</p>
        </Narration>

        {}
        <div className="mt-3 grid justify-items-stretch gap-2">
          <Link
            href="/room/life"
            className="dg-btn rs-cta rs-cta--deal"
            onClick={() => {
              markContinue('life', 'free_result', Date.now(), true);
              track('continue_click', { room: 'life' });
            }}
          >
            {}
            {was !== null ? <span className="rs-cta__tag">{ROOMS_COPY.first.tag}</span> : null}
            <span className="rs-cta__main">{T.ctaLabel}</span>
            <span className="rs-cta__price">
              <PriceDeal now={price} was={was} off={off} />
            </span>
            <span className="rs-cta__note">{S.note}</span>
            <span className="rs-cta__go" aria-hidden="true">
              <ArrowRightIcon size={22} />
            </span>
          </Link>
        </div>

      </div>

      {}
      <OtherKeepers />
    </section>
  );
}
