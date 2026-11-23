'use client';

import Link from 'next/link';
import { CONTINUE as T } from '@/content/continue';
import { roomOffer } from '@/lib/rooms/offer';
import { dealText } from './price-deal';
import { useRoomPrice } from './use-room-price';
import './rooms.css';

export const FREE_RESULT_HREF = '/reading?step=result';

export function ContinueConfirm() {
  const offer = roomOffer('life');
  const { price, was } = useRoomPrice();
  return (
    <section aria-labelledby="continue-title" className="rm-section rm-continue">
      <h2 id="continue-title" className="rm-section__title">
        {T.confirm.title}
      </h2>
      <p className="rm-continue__lead">{T.confirm.lead}</p>
      <ul className="rm-continue__facts">
        <li>{dealText(T.confirm.price(price), price, price, was)}</li>
        <li>{T.confirm.period}</li>
        <li>{T.confirm.keepSignedIn}</li>
        <li>{T.confirm.refund}</li>
      </ul>
      <details className="rm-continue__opens" open>
        <summary>{T.confirm.opensToggle}</summary>
        <ol className="rm-contents">
          {offer.lines.map((l) => (
            <li key={l.n}>
              <span className="rm-contents__num" aria-hidden="true">
                {String(l.n).padStart(2, '0')}
              </span>
              <span className="rm-contents__text">
                <span className="rm-contents__title">{l.title}</span>
                <span className="rm-contents__line">{l.answer ?? l.line}</span>
                <span className="rm-continue__tag" data-kind={l.free ?? 'new'}>
                  {T.tags[l.free ?? 'new']}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </details>
      <p className="rm-continue__back">
        <Link href={FREE_RESULT_HREF} className="dg-link">
          {T.failure.backToFree}
        </Link>
      </p>
    </section>
  );
}

export function ContinueFailure({ onRetry }: { onRetry: () => void }) {
  return (
    <section aria-labelledby="continue-fail" className="rm-section rm-continue rm-continue--fail" role="alert">
      <h2 id="continue-fail" className="rm-section__title">
        {T.failure.title}
      </h2>
      <p className="rm-continue__lead">{T.failure.body}</p>
      <div className="rm-continue__actions">
        <Link href={FREE_RESULT_HREF} className="dg-btn dg-btn--quiet">
          {T.failure.backToFree}
        </Link>
        <button type="button" className="dg-btn dg-btn--seal" onClick={onRetry}>
          {T.failure.retry}
        </button>
      </div>
    </section>
  );
}
