import type { AuthMethod } from '@/lib/account/config';

function Kakao({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 3.2c-5.25 0-9.5 3.32-9.5 7.42 0 2.65 1.77 4.97 4.44 6.28l-.9 3.3c-.08.29.25.52.5.35l3.93-2.6c.5.06 1 .09 1.53.09 5.25 0 9.5-3.32 9.5-7.42S17.25 3.2 12 3.2z"
      />
    </svg>
  );
}

function Naver({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M14.6 12.55 9.15 4.75H4.75v14.5h4.65v-7.8l5.45 7.8h4.4V4.75H14.6z" />
    </svg>
  );
}

function Google({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function Line({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 3.3c-5.25 0-9.5 3.42-9.5 7.63 0 3.78 3.36 6.94 7.9 7.54.31.07.73.2.83.47.1.24.07.61.03.85l-.13.8c-.04.24-.19.93.82.5s5.43-3.2 7.4-5.48c1.37-1.5 2.15-3.02 2.15-4.68 0-4.21-4.25-7.63-9.5-7.63z"
      />
      <text x="12" y="12.9" textAnchor="middle" fontSize="4.6" fontWeight="800" fontFamily="Arial, sans-serif" fill="#06C755">
        LINE
      </text>
    </svg>
  );
}

function Email({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  );
}

export function BrandMark({ method, size = 20 }: { method: AuthMethod; size?: number }) {
  if (method === 'kakao') return <Kakao size={size} />;
  if (method === 'naver') return <Naver size={size} />;
  if (method === 'google') return <Google size={size} />;
  if (method === 'line') return <Line size={size} />;
  return <Email size={size} />;
}
