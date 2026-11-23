'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import { FATE as F } from '@/content/fate-map';
import type { HeatLevel, HeatMonth } from '@/lib/reading/fate-map';
import { VerdictLegend, VerdictMark } from './verdict-mark';
import './result.css';

export const WHEEL = { w: 1254, h: 1254 } as const;

export const LAMPS = [
  { x: 627, y: 215, r: 92 },
  { x: 888, y: 282, r: 92 },
  { x: 1061, y: 462, r: 92 },
  { x: 1090, y: 700, r: 92 },
  { x: 989, y: 905, r: 92 },
  { x: 826, y: 1025, r: 92 },
  { x: 627, y: 1090, r: 92 },
  { x: 428, y: 1025, r: 92 },
  { x: 262, y: 905, r: 92 },
  { x: 163, y: 700, r: 92 },
  { x: 193, y: 462, r: 92 },
  { x: 365, y: 282, r: 92 },
] as const;

const NUMERAL_PULL = 0.26;
const CENTER = { x: WHEEL.w / 2, y: WHEEL.h / 2 } as const;

const OUTWARD = LAMPS.map((l) => {
  const dx = l.x - CENTER.x;
  const dy = l.y - CENTER.y;
  const d = Math.hypot(dx, dy) || 1;
  return { x: dx / d, y: dy / d };
});

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;

export function HeatGlyph({ level }: { level: HeatLevel }) {
  return (
    <svg className="rs-hw__glyph" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      {level === 'blaze' ? (
        <>
          <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="6" cy="6" r="3" fill="currentColor" />
        </>
      ) : level === 'warm' ? (
        <circle cx="6" cy="6" r="3.6" fill="currentColor" />
      ) : level === 'calm' ? (
        <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      ) : (
        <path d="M6 1.4 10.6 6 6 10.6 1.4 6Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function TurnMark({ turn }: { turn: 'rise' | 'fall' }) {
  return (
    <svg className="rs-hw__turn" data-turn={turn} width="9" height="9" viewBox="0 0 9 9" aria-hidden="true" focusable="false">
      <path d={turn === 'rise' ? 'M4.5 1 8.2 7.6H0.8Z' : 'M4.5 8 0.8 1.4H8.2Z'} fill="currentColor" />
    </svg>
  );
}

export function YearHeat({ heat }: { heat: readonly HeatMonth[] }) {
  const H = F.paid.heat;
  const C = F.paid.calendar;
  const months = heat.slice(0, LAMPS.length);

  const start = Math.max(0, months.findIndex((m) => m.turn === 'rise') >= 0 ? months.findIndex((m) => m.turn === 'rise') : months.findIndex((m) => m.level === 'blaze'));
  const [sel, setSel] = useState(start);
  const at = Math.min(sel, months.length - 1);
  const cur = months[at];
  if (!cur) return null;
  const turnWord = cur.turn ? H.turn[cur.turn] : null;

  return (
    <div className="rs-hw">
      <div className="rs-hw__scene">
        <Image src="/media/fate/year-wheel-v1.jpg" alt="" fill sizes="(max-width: 480px) 90vw, 420px" className="rs-hw__img" />
        {months.map((m, i) => (
          <button
            key={m.month}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="rs-hw__lamp"
            data-level={m.level}
            data-selected={i === at ? '' : undefined}
            onClick={() => setSel(i)}
            style={{ '--x': pct(LAMPS[i].x, WHEEL.w), '--y': pct(LAMPS[i].y, WHEEL.h), '--r': pct(LAMPS[i].r, WHEEL.w), '--d': `${(i * 0.37).toFixed(2)}s` } as CSSProperties}
          >
            <span className="rs-hw__shade" />
            <span className="rs-hw__glow" />
            <span className="rs-hw__ring" />
            {m.level === 'blaze' || m.level === 'cool' ? <VerdictMark verdict={m.level === 'blaze' ? 'good' : 'bad'} at={OUTWARD[i]} /> : null}
          </button>
        ))}
        {}
        {months.map((m, i) => {
          const nx = LAMPS[i].x + (CENTER.x - LAMPS[i].x) * NUMERAL_PULL;
          const ny = LAMPS[i].y + (CENTER.y - LAMPS[i].y) * NUMERAL_PULL;
          return (
            <span key={`n${m.month}`} className="rs-hw__num" data-selected={i === at ? '' : undefined} aria-hidden="true" style={{ left: pct(nx, WHEEL.w), top: pct(ny, WHEEL.h) }}>
              {m.turn ? <TurnMark turn={m.turn} /> : null}
              {m.month}
            </span>
          );
        })}
        {}
        <div className="rs-hw__center" data-level={cur.level} aria-hidden="true">
          <span className="rs-hw__big">{C.short(cur.month)}</span>
          <span className="rs-hw__word">{H.level[cur.level]}</span>
          {turnWord ? (
            <span className="rs-hw__turnword" data-turn={cur.turn ?? undefined}>
              <TurnMark turn={cur.turn ?? 'rise'} />
              {turnWord}
            </span>
          ) : null}
        </div>
      </div>

      <VerdictLegend />

      <ul className="rs-hw__chips" aria-label={H.head}>
        {months.map((m, i) => (
          <li key={m.month}>
            <button
              type="button"
              className="rs-hw__chip"
              data-level={m.level}
              aria-pressed={i === at}
              aria-label={`${C.label(m.year, m.month)}, ${H.level[m.level]}${m.turn ? `, ${H.turn[m.turn]}` : ''}`}
              onClick={() => setSel(i)}
            >
              <span className="rs-hw__chip-mo" aria-hidden="true">
                {m.turn ? <TurnMark turn={m.turn} /> : null}
                {C.short(m.month)}
              </span>
              <HeatGlyph level={m.level} />
            </button>
          </li>
        ))}
      </ul>

      <p className="rs-hw__detail" data-level={cur.level} aria-live="polite">
        <b>{C.label(cur.year, cur.month)}</b> <em>{H.level[cur.level]}</em> {H.line[cur.level]}
        {cur.turn ? <span className="rs-hw__extra"> {H.turnLine[cur.turn]}</span> : null}
        {cur.lichun ? <span className="rs-hw__extra"> {H.lichun}</span> : null}
        {}
        {cur.tone ? <span className="rs-hw__tone">{H.tone[cur.tone]}</span> : null}
        <span className="rs-hw__prep">
          <b>{H.prepLabel}</b> {cur.tone ? F.months.prep[cur.tone] : H.prep[cur.level]}
        </span>
      </p>
    </div>
  );
}
