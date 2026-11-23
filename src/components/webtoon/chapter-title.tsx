'use client';

import type { ReactNode } from 'react';
import { useSeen } from './use-seen';
import './webtoon.css';

export function ChapterTitle({ children, id, className = '' }: { children: ReactNode; id?: string; className?: string }) {
  const [ref, seen] = useSeen<HTMLDivElement>({ threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  return (
    <div ref={ref} className={`wt-chapter ${className}`} data-seen={seen}>
      <span className="wt-chapter__ornament" aria-hidden="true">
        <i />
      </span>
      <h2 id={id}>{children}</h2>
    </div>
  );
}
