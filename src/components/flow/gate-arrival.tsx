'use client';

import { useEffect, type AnimationEvent, type CSSProperties } from 'react';
import { useReducedMotion } from '../use-reduced-motion';
import { clearGateArrival, useGateArrival } from './gate';

const SAFETY_MS = 1800;

export function GateArrival() {
  const origin = useGateArrival();
  const reduced = useReducedMotion();
  const arrived = origin !== null;

  useEffect(() => {
    if (!arrived) return;
    const t = window.setTimeout(clearGateArrival, SAFETY_MS);
    return () => window.clearTimeout(t);
  }, [arrived]);

  if (!origin) return null;

  const onEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.animationName === (reduced ? 'arrive-veil' : 'arrive-light')) clearGateArrival();
  };

  const style = { '--gate-x': origin.x, '--gate-y': origin.y } as CSSProperties;
  return <div aria-hidden="true" className="dg-arrive" style={style} onAnimationEnd={onEnd} />;
}
