'use client';

import type { CSSProperties } from 'react';
import { UI } from '@/content/ui';
import type { Chart, Element } from '@/lib/saju';
import './webtoon.css';

export const ELEMENT_ORDER: readonly Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

export function orbSize(count: number): number {
  if (count <= 0) return 16;
  return Math.round(Math.min(62, 18 + 44 * Math.sqrt(Math.min(count, 5) / 5)));
}

export function ElementOrbs({ chart, lit = true }: { chart: Chart; lit?: boolean }) {
  const total = ELEMENT_ORDER.reduce((sum, e) => sum + chart.elements[e], 0);
  return (
    <ul className="wt-orbs" data-lit={lit} aria-label={UI.result.chart.elementsHeading}>
      {ELEMENT_ORDER.map((e, i) => {
        const n = chart.elements[e];
        const name = UI.elements[e].name;
        const style = { ['--i' as string]: i, ['--wt-orb-size' as string]: `${orbSize(n)}px`, ['--wt-orb-color' as string]: `var(--${e})` } as CSSProperties;
        return (
          <li key={e} aria-label={UI.result.chart.elementCount(name, n, total)}>
            <span className="wt-orb" style={style} data-on={n > 0 ? '' : undefined} data-off={n === 0 ? '' : undefined} aria-hidden="true" />
            <span className="wt-orbs__name" aria-hidden="true">
              <span className="t-hanja">{UI.elements[e].hanzi}</span>
              {name}
            </span>
            <span className="wt-orbs__count" aria-hidden="true">
              {n}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
