'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useReducedMotion } from '@/components/use-reduced-motion';
import { glyphLayout, glyphTimeline, landStartMs, landTimeline, landTransform, type LandTimeline } from './logic';
import { useSeen } from './use-seen';
import './mystic.css';

export interface GlyphRiseProps {
  glyphs: string[];

  onDone?: () => void;
  tone?: 'night' | 'paper';
  layout?: 'auto' | 'row' | 'pillars';

  veil?: boolean;
  className?: string;

  landOnto?: (index: number) => Element | null;

  onLand?: () => void;

  start?: boolean;
}

type Phase = 'rise' | 'land' | 'landed';

function glyphPx(el: Element): number {
  const fs = parseFloat(getComputedStyle(el).fontSize);
  if (!Number.isFinite(fs)) return NaN;
  if (typeof SVGGraphicsElement !== 'undefined' && el instanceof SVGGraphicsElement) {
    const ctm = el.getScreenCTM();
    return ctm ? fs * Math.hypot(ctm.a, ctm.b) : NaN;
  }
  return fs;
}

function center(el: Element): { cx: number; cy: number } {
  const r = el.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}

function flyGlyphs(from: (HTMLElement | null)[], to: (index: number) => Element | null, plan: LandTimeline) {
  from.forEach((el, i) => {
    if (!el) return;
    const delay = plan.delays[i] ?? 0;
    const target = to(i);
    const move = target ? landTransform({ ...center(el), size: glyphPx(el) }, { ...center(target), size: glyphPx(target) }) : null;
    if (typeof el.animate !== 'function') {
      el.style.opacity = '0';
      return;
    }
    if (move) {
      el.animate(
        [
          { transform: 'translate(0px, 0px) scale(1)' },
          { transform: `translate(${move.dx.toFixed(1)}px, ${move.dy.toFixed(1)}px) scale(${move.scale.toFixed(3)})` },
        ],
        { duration: plan.flightMs, delay, easing: 'cubic-bezier(0.32, 0.08, 0.24, 1)', fill: 'forwards' },
      );
    }

    el.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: plan.fadeMs,
      delay: delay + plan.flightMs - plan.fadeMs,
      easing: 'ease-in',
      fill: 'forwards',
    });
  });
}

export function GlyphRise({ glyphs, onDone, tone = 'night', layout = 'auto', veil = true, className, landOnto, onLand, start }: GlyphRiseProps) {
  const reduced = useReducedMotion();
  const [ref, ownSeen] = useSeen<HTMLDivElement>({ threshold: 0.3 });
  const seen = ownSeen || start === true;
  const timeline = glyphTimeline(glyphs.length, reduced);
  const shape = glyphLayout(glyphs.length, layout);
  const landing = Boolean(landOnto) && !reduced;
  const [phase, setPhase] = useState<Phase>('rise');
  const els = useRef<(HTMLElement | null)[]>([]);

  const doneRef = useRef(onDone);
  const landRef = useRef(onLand);
  const ontoRef = useRef(landOnto);
  useEffect(() => {
    doneRef.current = onDone;
    landRef.current = onLand;
    ontoRef.current = landOnto;
  });

  const doneAt = timeline.doneAt;
  const count = glyphs.length;
  const group = shape.kind === 'pillars' ? 2 : 1;
  useEffect(() => {
    if (!seen) return;
    if (!landing) {
      const t = window.setTimeout(() => doneRef.current?.(), doneAt);
      return () => window.clearTimeout(t);
    }
    const plan = landTimeline(count, group);
    const startAt = landStartMs(count);
    const t1 = window.setTimeout(() => {
      flyGlyphs(els.current.slice(0, count), (i) => ontoRef.current?.(i) ?? null, plan);
      setPhase('land');
      landRef.current?.();
    }, startAt);
    const t2 = window.setTimeout(() => {
      setPhase('landed');
      doneRef.current?.();
    }, startAt + plan.totalMs);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [seen, landing, doneAt, count, group]);

  const reducedLand = Boolean(landOnto) && reduced;
  useEffect(() => {
    if (!seen || !reducedLand) return;
    const t = window.setTimeout(() => landRef.current?.(), 0);
    return () => window.clearTimeout(t);
  }, [seen, reducedLand]);

  const cls = ['mx-glyphs', className].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={cls}
      data-run={seen ? 'true' : 'false'}
      data-tone={tone}
      data-layout={shape.kind}
      data-veil={veil ? undefined : 'false'}
      data-phase={phase}
      style={{ '--mx-cols': shape.columns, '--mx-rise': `${timeline.riseMs}ms` } as CSSProperties}
      role="group"
      aria-label={glyphs.join(' ')}
    >
      {glyphs.map((g, i) => (
        <span
          key={`${i}:${g}`}
          ref={(el) => {
            els.current[i] = el;
          }}
          className="mx-glyph"
          style={{ '--mx-delay': `${timeline.delays[i]}ms` } as CSSProperties}
        >
          <span className="mx-glyph-halo" aria-hidden="true">
            {g}
          </span>
          <span className="mx-glyph-ch" aria-hidden="true">
            {g}
          </span>
        </span>
      ))}
    </div>
  );
}

