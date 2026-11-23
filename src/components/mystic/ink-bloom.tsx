'use client';

import { useState, type AnimationEvent, type ReactNode } from 'react';
import { useReducedMotion } from '@/components/use-reduced-motion';
import './mystic.css';

export function InkBloom({
  children,
  active,
  className,
  fit = 'tall',
  stain = true,
}: {
  children: ReactNode;
  active: boolean;
  className?: string;
  fit?: 'tall' | 'wide';
  stain?: boolean;
}) {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);

  if (!active && done) setDone(false);

  const state = !active ? 'idle' : done || reduced ? 'done' : 'run';

  const onEnd = (e: AnimationEvent<HTMLDivElement>) => {

    if (e.target !== e.currentTarget) return;

    if (e.animationName.startsWith('mx-ink-reveal') || e.animationName === 'mx-fade') setDone(true);
  };

  return (
    <div className={className ? `mx-ink ${className}` : 'mx-ink'} data-state={state} data-fit={fit === 'wide' ? 'wide' : undefined}>
      {state === 'run' && stain ? <span className="mx-ink-stain" aria-hidden="true" /> : null}
      <div className="mx-ink-body" inert={!active} onAnimationEnd={onEnd}>
        {children}
      </div>
    </div>
  );
}
