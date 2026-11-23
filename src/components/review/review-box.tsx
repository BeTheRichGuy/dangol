'use client';

import { useState, useSyncExternalStore } from 'react';
import { REVIEW } from '@/content/review';
import { addTokens, setServerBalance } from '@/lib/chat/wallet';
import Link from 'next/link';
import { REVIEW_BODY_MAX, REVIEW_STARS, cleanReviewBody, reviewLanterns, type ReviewCopy, type ReviewRoom } from '@/lib/reviews/review';
import { useMaybeAccount } from '../account/account-provider';
import { useLocale } from '../locale-provider';
import './review-box.css';

const KEY = (room: string, reading: string) => `dangol.review.v1.${room}.${reading}`;
const PREVIEW_LIST = 'dangol.preview.reviews.v1';
const SAVED_EVENT = 'dangol:review-saved';

function useReviewed(room: string, reading: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      window.addEventListener('storage', notify);
      window.addEventListener(SAVED_EVENT, notify);
      return () => {
        window.removeEventListener('storage', notify);
        window.removeEventListener(SAVED_EVENT, notify);
      };
    },
    () => {
      try {
        return window.localStorage.getItem(KEY(room, reading)) !== null;
      } catch {
        return false;
      }
    },
    () => false,
  );
}

function Star({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
      <path
        d="M12 2.8l2.78 5.63 6.22.9-4.5 4.38 1.06 6.2L12 17.0l-5.56 2.91 1.06-6.2L3 9.33l6.22-.9L12 2.8z"
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReviewBox({ room, reading, edition, copy }: { room: ReviewRoom; reading: string;  edition?: 'xmas';  copy?: Partial<ReviewCopy> }) {
  const locale = useLocale();
  const account = useMaybeAccount();
  const R = { ...REVIEW, ...copy };
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [phase, setPhase] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle');
  const [rewarded, setRewarded] = useState(false);
  const [needRating, setNeedRating] = useState(false);

  const reviewed = useReviewed(room, reading);

  const canReward = Boolean(account?.user);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (phase === 'sending') return;
    if (rating < 1) return setNeedRating(true);
    setNeedRating(false);
    setPhase('sending');
    const row = { room, locale, rating, body: cleanReviewBody(body), reading, ...(edition ? { edition } : {}) };
    let ok = false;
    let got = false;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = canReward && account ? await account.accessToken() : null;
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/reviews', { method: 'POST', headers, body: JSON.stringify(row) });
      if (res.ok) {
        const v = (await res.json().catch(() => ({}))) as { granted?: unknown; balance?: unknown };
        ok = true;
        got = typeof v.granted === 'number' && v.granted > 0;
        if (typeof v.balance === 'number') setServerBalance(v.balance);
      } else if (res.status === 503 && process.env.NODE_ENV !== 'production') {

        const list: unknown = JSON.parse(window.localStorage.getItem(PREVIEW_LIST) ?? '[]');
        window.localStorage.setItem(PREVIEW_LIST, JSON.stringify([...(Array.isArray(list) ? list : []), { ...row, at: new Date().toISOString() }]));
        if (canReward) {
          addTokens(reviewLanterns(room, edition));
          got = true;
        }
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) return setPhase('failed');
    setRewarded(got);
    try {
      window.localStorage.setItem(KEY(room, reading), String(rating));
      window.dispatchEvent(new Event(SAVED_EVENT));
    } catch {

    }
    setPhase('done');
  }

  if (phase === 'done' || reviewed) {
    return (
      <section className="rv-box rv-box--done" data-sticky-hide aria-live="polite">
        <p className="rv-thanks">{rewarded ? R.thanksReward : R.thanks}</p>
        {rewarded && R.chat ? (
          <Link className="rv-chat" href={R.chat.href}>
            {R.chat.label}
          </Link>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rv-box" data-sticky-hide aria-labelledby={`rv-${room}-title`}>
      <form onSubmit={submit} noValidate>
        <h2 id={`rv-${room}-title`} className="rv-title">
          {R.title}
        </h2>
        <p className="rv-note">{R.note}</p>
        {canReward ? <p className="rv-reward">{R.reward}</p> : R.rewardGuest ? <p className="rv-reward">{R.rewardGuest}</p> : null}
        <div className="rv-stars" role="radiogroup" aria-label={R.title}>
          {Array.from({ length: REVIEW_STARS }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={R.star(n)}
              className="rv-star"
              data-on={n <= rating ? '' : undefined}
              onClick={() => {
                setRating(n);
                setNeedRating(false);
              }}
            >
              <Star on={n <= rating} />
            </button>
          ))}
        </div>
        {needRating ? (
          <p className="rv-error" role="alert">
            {R.needRating}
          </p>
        ) : null}
        <label className="sr-only" htmlFor={`rv-${room}-body`}>
          {R.title}
        </label>
        <textarea
          id={`rv-${room}-body`}
          className="rv-text"
          rows={3}
          maxLength={REVIEW_BODY_MAX}
          placeholder={R.placeholder}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="rv-foot">
          <span className="rv-count" aria-hidden="true">
            {R.counter(body.length, REVIEW_BODY_MAX)}
          </span>
          <button type="submit" className="rv-send" disabled={phase === 'sending'}>
            {phase === 'sending' ? R.sending : R.submit}
          </button>
        </div>
        {phase === 'failed' ? (
          <p className="rv-error" role="alert">
            {R.failed}
          </p>
        ) : null}
      </form>
    </section>
  );
}
