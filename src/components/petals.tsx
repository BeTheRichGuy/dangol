import type { CSSProperties } from 'react';

type Petal = { x: string; y: string; s: number; dur: number; delay: number; sway: number; r: number; o: number };

const PETALS: Petal[] = [
  { x: '8%', y: '14%', s: 14, dur: 21, delay: -3, sway: 38, r: 20, o: 0.42 },
  { x: '22%', y: '62%', s: 10, dur: 26, delay: -14, sway: -30, r: 70, o: 0.32 },
  { x: '37%', y: '30%', s: 16, dur: 19, delay: -8, sway: 44, r: 140, o: 0.4 },
  { x: '52%', y: '78%', s: 10, dur: 28, delay: -20, sway: -36, r: 200, o: 0.3 },
  { x: '64%', y: '9%', s: 13, dur: 23, delay: -11, sway: 32, r: 300, o: 0.44 },
  { x: '76%', y: '48%', s: 16, dur: 18, delay: -5, sway: -46, r: 40, o: 0.38 },
  { x: '88%', y: '70%', s: 11, dur: 25, delay: -17, sway: 28, r: 110, o: 0.32 },
  { x: '95%', y: '26%', s: 15, dur: 22, delay: -9, sway: -34, r: 250, o: 0.4 },
];

export function Petals() {
  return (
    <div className="dg-fixed-layer dg-petals" aria-hidden="true">
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={
            {
              '--x': p.x,
              '--y': p.y,
              '--s': `${p.s}px`,
              '--dur': `${p.dur}s`,
              '--delay': `${p.delay}s`,
              '--sway': `${p.sway}px`,
              '--r': `${p.r}deg`,
              '--o': p.o,
            } as CSSProperties
          }
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 22.4C5.6 18.6 2.6 12.4 5.6 6.2c.9-1.9 2.9-2.9 4.2-2 .9.6 1.6 1.5 2.2 2.6.6-1.1 1.3-2 2.2-2.6 1.3-.9 3.3.1 4.2 2 3 6.2 0 12.4-6.4 16.2z" />
          </svg>
        </span>
      ))}
    </div>
  );
}
