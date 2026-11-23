'use client';

import { useId } from 'react';
import { UI } from '@/content/ui';

export function SealStamp({ size = 68, className = '' }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={UI.result.locked.sealLabel}
      style={{ mixBlendMode: 'multiply' }}
    >
      <defs>
        <filter id={`${id}-rough`} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <mask id={`${id}-carve`}>
          <rect width="64" height="64" fill="#fff" />
          <rect x="8.5" y="8.5" width="47" height="47" rx="4" fill="none" stroke="#000" strokeWidth="1.7" />
          <text
            x="32"
            y="45.5"
            textAnchor="middle"
            fontSize="35"
            fontWeight="600"
            fill="#000"
            style={{ fontFamily: 'var(--font-hanja)' }}
          >
            封
          </text>
        </mask>
      </defs>
      <g filter={`url(#${id}-rough)`}>
        <rect x="3" y="3" width="58" height="58" rx="9" fill="var(--seal)" mask={`url(#${id}-carve)`} />
      </g>
    </svg>
  );
}

export function DateSeal({
  month,
  day,
  year,
  size = 78,
  className = '',
}: {
  month: string;
  day: string;
  year: string;
  size?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${UI.email.card.stampAlt}: ${month} ${day}, ${year}`}
      style={{ mixBlendMode: 'multiply' }}
    >
      <defs>
        <filter id={`${id}-rough`} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <mask id={`${id}-carve`}>
          <rect width="80" height="80" fill="#fff" />
          <circle cx="40" cy="40" r="32.5" fill="none" stroke="#000" strokeWidth="1.6" />
          <text x="40" y="27.5" textAnchor="middle" fontSize="12.5" fontWeight="600" fill="#000" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.18em', fontVariantNumeric: 'lining-nums' }}>
            {month.toUpperCase()}
          </text>
          <text x="40" y="51" textAnchor="middle" fontSize="29" fontWeight="600" fill="#000" style={{ fontFamily: 'var(--font-display)', fontVariantNumeric: 'lining-nums' }}>
            {day}
          </text>
          <text x="40" y="64.5" textAnchor="middle" fontSize="11" fontWeight="600" fill="#000" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.12em', fontVariantNumeric: 'lining-nums' }}>
            {year}
          </text>
        </mask>
      </defs>
      <g filter={`url(#${id}-rough)`}>
        <circle cx="40" cy="40" r="37" fill="var(--seal)" mask={`url(#${id}-carve)`} />
      </g>
    </svg>
  );
}
