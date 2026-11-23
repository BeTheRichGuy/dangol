'use client';

import type { CSSProperties } from 'react';
import { XMAS_PAIR } from '@/content/xmas';
import { useSeen } from '../webtoon/use-seen';

export function XmasPairCard({ score }: { score: number }) {
  const [ref, seen] = useSeen<HTMLElement>({ threshold: 0.35 });
  return (
    <section ref={ref} className="xq-scores" data-seen={seen} aria-label={XMAS_PAIR.title}>
      <h3>{XMAS_PAIR.title}</h3>
      <ol>
        <li style={{ '--v': score / 100, '--i': 0 } as CSSProperties} data-main="">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="44" />
            <circle cx="50" cy="50" r="44" pathLength="1" />
          </svg>
          <b>{score}</b>
          <span>{XMAS_PAIR.title}</span>
        </li>
      </ol>
      <p className="xq-cardnote">{XMAS_PAIR.note}</p>
    </section>
  );
}
