'use client';

import type { CSSProperties, ReactNode } from 'react';
import './webtoon.css';

export function Narration({
  children,
  side,
  voice,
  serif = false,
  className = '',
  style,
}: {
  children: ReactNode;

  side?: 'left' | 'right';

  voice?: 'stage';

  serif?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`wt-narration ${className}`} data-side={side} data-voice={voice} data-serif={serif ? '' : undefined} style={style}>
      {children}
    </div>
  );
}
