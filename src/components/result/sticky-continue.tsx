'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { STICKY as S } from '@/content/continue';
import { ROOMS_COPY } from '@/content/rooms';
import { track } from '@/lib/analytics/track';
import { ArrowRightIcon } from '../icons';
import { PriceDeal } from '../rooms/price-deal';
import { useRoomPrice } from '../rooms/use-room-price';
import { markContinue } from '../rooms/continue';
import type { ProductKey } from '@/lib/rooms/themes';
import './result.css';

export function StickyContinue({
  startId,
  room = 'life',
  href = '/room/life',
  label,
  region,
  before,
  paidNote,
}: {
  startId: string;
  room?: ProductKey;
  href?: string;
  label?: string;
  region?: string;
  before?: () => void;

  paidNote?: string;
}) {
  const [passed, setPassed] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const start = document.getElementById(startId);
    if (!start) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      setPassed(start.getBoundingClientRect().top < 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [startId]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const seen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) seen.add(e.target);
        else seen.delete(e.target);
      }
      setBlocked(seen.size > 0);
    });
    const targets = document.querySelectorAll('[data-sticky-hide]');
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  const show = passed && !blocked;
  const { price, was, off } = useRoomPrice();
  return (
    <aside className="rs-sticky" data-show={show ? '' : undefined} aria-hidden={show ? undefined : true} aria-label={region ?? S.region}>
      <Link
        href={href}
        tabIndex={show ? 0 : -1}
        className="rs-sticky__btn"
        onClick={() => {

          before?.();
          markContinue(room, 'free_result', Date.now(), true);
          track('continue_click', { room, pos: 'sticky' });
        }}
      >
        {}
        {was !== null && paidNote === undefined ? <span className="rs-sticky__tag">{ROOMS_COPY.first.tag}</span> : null}
        <span className="rs-sticky__title">{label ?? S.label}</span>
        <span className="rs-sticky__price">{paidNote ?? <PriceDeal now={price} was={was} off={off} />}</span>
        <span className="rs-sticky__go" aria-hidden="true">
          <ArrowRightIcon size={22} />
        </span>
      </Link>
    </aside>
  );
}
