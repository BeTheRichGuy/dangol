'use client';

import type { CSSProperties } from 'react';
import { VERDICT } from '@/content/verdict';
import { useLocale } from '../locale-provider';
import './result.css';

export type Verdict = 'good' | 'bad';

function Glyph({ verdict }: { verdict: Verdict }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {verdict === 'good' ? (
        <path d="M4.2 8.4 6.9 11 11.8 5.4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <path d="M8 3.6v5.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="8" cy="11.8" r="1.25" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

export function VerdictMark({ verdict, at }: { verdict: Verdict; at?: { x: number; y: number } }) {
  const style = at ? ({ '--ux': at.x.toFixed(3), '--uy': at.y.toFixed(3) } as CSSProperties) : undefined;
  return (
    <span className="rs-verdict" data-verdict={verdict} style={style} aria-hidden="true">
      <Glyph verdict={verdict} />
    </span>
  );
}

export function VerdictLegend() {
  useLocale();
  return (
    <ul className="rs-legend" aria-label={VERDICT.legend}>
      {(['good', 'bad'] as const).map((v) => (
        <li key={v} className="rs-legend__item">
          <VerdictMark verdict={v} />
          <span>{VERDICT[v]}</span>
        </li>
      ))}
    </ul>
  );
}
