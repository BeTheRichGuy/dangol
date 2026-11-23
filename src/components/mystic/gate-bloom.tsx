'use client';

import { useEffect, useMemo, useRef, useState, type AnimationEvent, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useHydrated, useReducedMotion } from '@/components/use-reduced-motion';
import { gateDoneMs, gateOriginVars, type GateOrigin } from './logic';
import './mystic.css';

export function GateBloom({ open, onDone, origin }: { open: boolean; onDone?: () => void; origin?: GateOrigin }) {
  const hydrated = useHydrated();
  const reduced = useReducedMotion();

  const [shown, setShown] = useState(open);
  if (open && !shown) setShown(true);

  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  const ox = origin?.x;
  const oy = origin?.y;
  const oh = origin?.h;
  const vars = useMemo(() => gateOriginVars({ x: ox ?? '', y: oy ?? '', h: oh }) as CSSProperties, [ox, oy, oh]);

  const ms = gateDoneMs(reduced);
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => doneRef.current?.(), ms);
    return () => window.clearTimeout(t);
  }, [open, ms]);

  if (!shown || !hydrated) return null;

  const onEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.animationName === 'mx-gate-out' && !open) setShown(false);
  };

  return createPortal(
    <div className="mx-gate" data-state={open ? 'in' : 'out'} style={vars} aria-hidden="true" onAnimationEnd={onEnd}>
      <div className="mx-gate-wash" />
      <div className="mx-gate-glow" />
      <div className="mx-gate-slit" />
    </div>,
    document.body,
  );
}
