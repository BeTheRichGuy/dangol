'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import { FATE as F } from '@/content/fate-map';
import type { LoveYear, LoveYearKind } from '@/lib/reading/fate-map';
import { VerdictLegend, VerdictMark } from './verdict-mark';
import { HeatGlyph } from './year-heat';
import './result.css';

export const BAND = { w: 1536, h: 1024 } as const;

export const LAMPS = [
  { x: 137, y: 437, r: 86 },
  { x: 351, y: 456, r: 86 },
  { x: 562, y: 466, r: 86 },
  { x: 774, y: 470, r: 86 },
  { x: 986, y: 468, r: 86 },
  { x: 1195, y: 457, r: 86 },
  { x: 1401, y: 430, r: 86 },
] as const;

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;

const GLYPH: Record<LoveYearKind, 'blaze' | 'warm' | 'calm' | 'cool'> = { open: 'blaze', warm: 'warm', steady: 'calm', tender: 'cool' };

function StarMark() {
  return (
    <svg className="rs-lb__star" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M6 .9 7.6 4.3 11.2 4.7 8.5 7.2 9.3 10.8 6 9 2.7 10.8 3.5 7.2 .8 4.7 4.4 4.3Z" fill="currentColor" />
    </svg>
  );
}

export function LoveBand({ years }: { years: readonly LoveYear[] }) {
  const B = F.paid.band;
  const rows = years.slice(0, LAMPS.length);
  const bestAt = rows.findIndex((y) => y.best);
  const [sel, setSel] = useState(Math.max(0, bestAt));
  const at = Math.min(sel, rows.length - 1);
  const cur = rows[at];
  if (!cur) return null;

  return (
    <div className="rs-lb">
      <div className="rs-lb__scene">
        <Image src="/media/fate/love-band-v1.jpg" alt="" fill sizes="(max-width: 480px) 90vw, 420px" className="rs-lb__img" />
        {rows.map((y, i) => (
          <button
            key={y.year}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="rs-lb__lamp"
            data-kind={y.kind}
            data-selected={i === at ? '' : undefined}
            onClick={() => setSel(i)}
            style={{ '--x': pct(LAMPS[i].x, BAND.w), '--y': pct(LAMPS[i].y, BAND.h), '--r': pct(LAMPS[i].r, BAND.w), '--d': `${(i * 0.5).toFixed(2)}s` } as CSSProperties}
          >
            <span className="rs-lb__shade" />
            <span className="rs-lb__glow" />
            <span className="rs-lb__ring" />
            {}
            {y.kind === 'open' || y.kind === 'tender' || y.best ? <VerdictMark verdict={y.kind === 'tender' ? 'bad' : 'good'} at={{ x: 0, y: 1 }} /> : null}
            {y.best ? (
              <span className="rs-lb__best">
                <StarMark />
              </span>
            ) : null}
          </button>
        ))}
        {}
        <div className="rs-lb__center" data-kind={cur.kind} aria-hidden="true">
          <span className="rs-lb__big">{cur.year}</span>
          <span className="rs-lb__word">{B.level[cur.kind]}</span>
        </div>
      </div>

      <VerdictLegend />

      <ul className="rs-lb__chips" aria-label={B.head}>
        {rows.map((y, i) => (
          <li key={y.year}>
            <button
              type="button"
              className="rs-lb__chip"
              data-kind={y.kind}
              aria-pressed={i === at}
              aria-label={`${B.label(y.year, y.age)}, ${B.level[y.kind]}${y.best ? `, ${B.best}` : ''}`}
              onClick={() => setSel(i)}
            >
              <span className="rs-lb__chip-yr" aria-hidden="true">
                {y.year}
              </span>
              {y.best ? (
                <span className="rs-lb__chip-star" aria-hidden="true">
                  <StarMark />
                </span>
              ) : null}
              <HeatGlyph level={GLYPH[y.kind]} />
            </button>
          </li>
        ))}
      </ul>

      <p className="rs-lb__detail" data-kind={cur.kind} aria-live="polite">
        <b>{B.label(cur.year, cur.age)}</b> <em>{B.level[cur.kind]}</em>
        {cur.best ? <em className="rs-lb__bestword">{B.best}</em> : null} {B.line[cur.kind]}{' '}
        <span className="rs-lb__theme">
          {B.themeLabel}: {B.theme[cur.group]}
        </span>
        <span className="rs-lb__prep">
          <b>{B.prepLabel}</b> {B.prep[cur.kind]}
        </span>
      </p>
    </div>
  );
}
