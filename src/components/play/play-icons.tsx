import { useId } from 'react';

export function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
      <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2 0 3.7 1.1 5.4 3.1 1.7-2 3.4-3.1 5.4-3.1 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21Z" fill="currentColor" />
    </svg>
  );
}

export function LanternIcon({ className, lit = 1 }: { className?: string; lit?: number }) {
  const glow = Math.max(0, Math.min(1, lit));
  const id = useId().replace(/:/g, '');
  const body = 'M6.2 7.2C1.2 9.8 1.2 18.2 6.2 20.8h11.6c5-2.6 5-11 0-13.6z';
  return (
    <svg className={className} viewBox="0 0 24 32" width="1em" height="1.333em" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e4a38" />
          <stop offset="0.55" stopColor="#3f261b" />
          <stop offset="1" stopColor="#5b3a2a" />
        </linearGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a45" />
          <stop offset="0.5" stopColor="#ffd884" />
          <stop offset="1" stopColor="#ff9241" />
        </linearGradient>
        <radialGradient id={`${id}c`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fffdf0" />
          <stop offset="0.45" stopColor="#ffeeb4" />
          <stop offset="1" stopColor="#ffeeb4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M12 0.4V3.8" stroke="#d3a65a" strokeWidth="1.1" strokeLinecap="round" />
      <rect x="6.4" y="3.4" width="11.2" height="3.6" rx="1.5" fill="#8d3024" stroke="#e2b869" strokeWidth="0.7" />
      <path d="M8 4.6h5" stroke="#d8604f" strokeWidth="0.7" strokeLinecap="round" opacity="0.8" />
      <path d={body} fill={`url(#${id}d)`} />
      <path d={body} fill={`url(#${id}l)`} opacity={0.1 + 0.9 * glow} />
      <ellipse cx="12" cy="14" rx="6.4" ry="6.6" fill={`url(#${id}c)`} opacity={glow * 0.95} />
      <path d="M12 7.2v13.6M8.5 7.5C5.5 11 5.5 17 8.5 20.5M15.5 7.5c3 3.5 3 9.5 0 13" stroke="#b06f22" strokeWidth="0.65" fill="none" opacity="0.55" />
      <path d={body} fill="none" stroke="#7c4a1c" strokeWidth="0.6" opacity="0.7" />
      <path d="M5.3 10.6c-1 1.7-1.2 3.8-0.7 5.6" stroke="#fff4d6" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity={0.15 + 0.35 * glow} />
      <rect x="6.4" y="20.4" width="11.2" height="3" rx="1.4" fill="#8d3024" stroke="#e2b869" strokeWidth="0.7" />
      <circle cx="12" cy="25.7" r="2" fill="#d23b2f" stroke="#7a1d17" strokeWidth="0.55" />
      <circle cx="11.3" cy="25" r="0.6" fill="#ff8b7c" />
      <path d="M10.3 27.2 9.3 31.4M12 27.7v4.1M13.7 27.2l1 4.2" stroke="#d23b2f" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="12" cy="31.4" r="0.7" fill="#e2b869" />
    </svg>
  );
}

export function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
      <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
      <path d="M4 12 20 4l-5 16-3.4-6.6L4 12Z" fill="currentColor" />
    </svg>
  );
}
