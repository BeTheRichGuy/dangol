'use client';

import type { CSSProperties } from 'react';
import type { Chart } from '@/lib/saju';
import { useSeen } from '../webtoon/use-seen';

export interface PairStrandsCopy {
  me: string;
  other: string;
  labels: readonly string[];
  unknown: string;
}

function Row({ who, chart, copy }: { who: string; chart: Chart; copy: PairStrandsCopy }) {
  const p = chart.pillars;
  return (
    <div className="xr-pair__row">
      <span className="xr-pair__who">{who}</span>
      <ol>
        {[p.year, p.month, p.day, p.hour].map((x, i) => (
          <li key={i} data-day={i === 2 ? '' : undefined} data-empty={x ? undefined : ''}>
            <b>{x ? `${x.stem}${x.branch}` : '··'}</b>
            <small>{x ? copy.labels[i] : copy.unknown}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function XmasPairStrands({ me, other, copy }: { me: Chart; other: Chart; copy: PairStrandsCopy }) {
  const [ref, seen] = useSeen<HTMLDivElement>({ threshold: 0.45 });
  return (
    <div ref={ref} className="xr-pair__strands" data-seen={seen ? '' : undefined}>
      <Row who={copy.me} chart={me} copy={copy} />
      {}
      <svg className="xr-pair__thread" viewBox="0 0 100 28" aria-hidden="true">
        <path d="M68.5 0 C 58 6, 79 9, 68.5 14 C 58 19, 79 22, 68.5 28" pathLength={1} />
        <circle cx="68.5" cy="14" r="1.5" style={{ '--d': '900ms' } as CSSProperties} />
      </svg>
      <Row who={copy.other} chart={other} copy={copy} />
    </div>
  );
}
