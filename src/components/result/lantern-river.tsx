'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import { FATE as F } from '@/content/fate-map';
import type { FlowLevel, FlowMap, FlowPoint } from '@/lib/reading/fate-map';
import { VerdictLegend, VerdictMark } from './verdict-mark';
import './result.css';

export const IMG = { w: 1024, h: 1536 } as const;

export const LAMPS = [
  { x: 890, y: 1112, r: 190 },
  { x: 186, y: 930, r: 190 },
  { x: 818, y: 738, r: 130 },
  { x: 305, y: 625, r: 105 },
  { x: 712, y: 553, r: 70 },
  { x: 424, y: 490, r: 58 },
  { x: 656, y: 456, r: 44 },
  { x: 514, y: 410, r: 38 },
] as const;

export type LampState = 'past' | 'now' | 'next';

export function lampStates(points: readonly FlowPoint[]): LampState[] {
  const now = points.find((p) => p.current)?.number ?? 0;
  return points.map((p) => (p.current ? 'now' : p.number < now ? 'past' : 'next'));
}

function LampGlyph({ state, level }: { state: LampState; level: FlowLevel }) {
  return (
    <svg className="rs-lr__glyph" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      {state === 'past' ? (
        <circle cx="6" cy="6" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      ) : level === 'high' ? (
        <circle cx="6" cy="6" r="4.5" fill="currentColor" />
      ) : level === 'low' ? (
        <path d="M6 1.2 10.8 6 6 10.8 1.2 6Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      ) : (
        <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  );
}

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;

export function LanternRiver({ flow }: { flow: FlowMap }) {
  const L = F.paid.lantern;
  const points = flow.points.slice(0, LAMPS.length);
  const states = lampStates(points);
  const nowAt = states.indexOf('now');
  const [sel, setSel] = useState(nowAt >= 0 ? nowAt : 0);
  const at = Math.min(sel, points.length - 1);
  const cur = points[at];
  if (!cur) return null;
  const curState = states[at];
  const tag = curState === 'past' ? L.tag.past : curState === 'now' ? L.tag.now : F.levelWord[cur.level];

  return (
    <div className="rs-lr">
      <div className="rs-lr__scene">
        <Image src="/media/fate/night-river-v1.jpg" alt="" fill sizes="(max-width: 480px) 90vw, 420px" className="rs-lr__img" />
        {points.map((p, i) => (
          <button
            key={p.number}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="rs-lr__lamp"
            data-state={states[i]}
            data-level={p.level}
            data-selected={i === at ? '' : undefined}
            onClick={() => setSel(i)}
            style={
              {
                '--x': pct(LAMPS[i].x, IMG.w),
                '--y': pct(LAMPS[i].y, IMG.h),
                '--r': pct(LAMPS[i].r, IMG.w),
                '--d': `${(i * 0.55).toFixed(2)}s`,
              } as CSSProperties
            }
          >
            <span className="rs-lr__shade" />
            <span className="rs-lr__glow" />
            <span className="rs-lr__ring" />
            {states[i] !== 'past' && p.level !== 'mid' ? <VerdictMark verdict={p.level === 'high' ? 'good' : 'bad'} at={{ x: 0.72, y: 0.72 }} /> : null}
            {states[i] === 'now' ? <span className="rs-lr__here">{F.drawers.flow.here}</span> : null}
          </button>
        ))}
      </div>
      <VerdictLegend />

      <ul className="rs-lr__chips" aria-label={L.head}>
        {points.map((p, i) => (
          <li key={p.number}>
            <button
              type="button"
              className="rs-lr__chip"
              data-state={states[i]}
              data-level={p.level}
              aria-pressed={i === at}
              aria-label={`${L.title(p.number, p.startAge, p.endAge)}, ${states[i] === 'past' ? L.tag.past : states[i] === 'now' ? L.tag.now : F.levelWord[p.level]}`}
              onClick={() => setSel(i)}
            >
              <LampGlyph state={states[i]} level={p.level} />
              <span className="rs-lr__chip-ages" aria-hidden="true">
                {L.ages(p.startAge, p.endAge)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className="rs-lr__detail" data-state={curState} data-level={cur.level} aria-live="polite">
        <b>{L.title(cur.number, cur.startAge, cur.endAge)}</b> <em>{tag}</em>{' '}
        <span className="rs-lr__years">{L.years(cur.startYear, cur.endYear)}</span> {L.line(cur.group, cur.level, curState)}{' '}
        {}
        <span className="rs-lr__opens">{L.opens(cur.startMonth ? Number(cur.startMonth.slice(0, 4)) : cur.startYear, cur.startMonth ? Number(cur.startMonth.slice(5, 7)) : null, curState)}</span>
        {curState !== 'past' ? (
          <span className="rs-lr__prep">
            <b>{L.prepLabel}</b> {L.prep[cur.level]}
          </span>
        ) : null}
      </p>
    </div>
  );
}
