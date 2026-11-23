'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { UI } from '@/content/ui';
import { PawIcon } from '../icons';
import { GateBloom } from '../mystic';
import { gateOrigin } from '../scene/door';
import { markGateArrival } from './gate';

type Origin = { x: string; y: string; h: string };

function measureDoor(): Origin | null {
  const media = document.querySelector<HTMLElement>('[data-intro-media]');
  if (!media) return null;
  const r = media.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return null;
  const video = media.querySelector('video');
  return gateOrigin({ left: r.left, top: r.top, width: r.width, height: r.height }, video?.currentTime ?? 0);
}

export function FollowButton({ className = 'dg-btn dg-btn--primary w-full' }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState<Origin | undefined>(undefined);
  const went = useRef(false);

  useEffect(() => {
    const reset = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      went.current = false;
      setOpen(false);
    };
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  useLayoutEffect(
    () => () => {
      went.current = false;
      setOpen(false);
    },
    [],
  );

  return (
    <>
      <Link
        href="/reading"
        className={className}
        aria-busy={open || undefined}
        onClick={(e) => {

          if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          setOrigin(measureDoor() ?? undefined);
          setOpen(true);
        }}
      >
        <PawIcon size={22} line />
        {UI.landing.cta}
      </Link>
      {}
      <span role="status" className="sr-only">
        {open ? UI.landing.opening : ''}
      </span>
      <GateBloom
        open={open}
        origin={origin}
        onDone={() => {
          if (went.current) return;
          went.current = true;
          markGateArrival(origin);
          router.push('/reading');
        }}
      />
    </>
  );
}
