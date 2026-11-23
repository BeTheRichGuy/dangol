import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: IconProps) {
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
      {...rest}
    >
      {children}
    </svg>
  );
}

export function PawIcon({ size = 24, line = false, ...rest }: IconProps & { line?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={line ? 'none' : 'currentColor'}
      stroke={line ? 'currentColor' : undefined}
      strokeWidth={line ? 1.75 : undefined}
      strokeLinejoin={line ? 'round' : undefined}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <ellipse cx="4.9" cy="10.4" rx="1.9" ry="2.5" transform="rotate(-18 4.9 10.4)" />
      <ellipse cx="9.2" cy="5.6" rx="2" ry="2.7" transform="rotate(-6 9.2 5.6)" />
      <ellipse cx="14.8" cy="5.6" rx="2" ry="2.7" transform="rotate(6 14.8 5.6)" />
      <ellipse cx="19.1" cy="10.4" rx="1.9" ry="2.5" transform="rotate(18 19.1 10.4)" />
      <path d="M12 12.2c-2.9 0-5.6 2.3-5.6 4.8 0 1.8 1.5 2.6 3.1 2.6 1 0 1.7-.5 2.5-.5s1.5.5 2.5.5c1.6 0 3.1-.8 3.1-2.6 0-2.5-2.7-4.8-5.6-4.8z" />
    </svg>
  );
}

export function CandyIcon({ size = 24, ...rest }: IconProps) {
  return (
    <Svg size={size} {...rest}>
      <g transform="rotate(-35 12 12)">
        <ellipse cx="12" cy="12" rx="4.7" ry="3.6" fill="currentColor" fillOpacity={0.16} />
        <path d="M10.6 8.7c1.5 2 1.5 4.6 0 6.6" />
        <path d="M7.3 12 3 8.8v6.4z" />
        <path d="m16.7 12 4.3-3.2v6.4z" />
      </g>
    </Svg>
  );
}

export function SaltDishIcon({ size = 24, filled = true, ...rest }: IconProps & { filled?: boolean }) {
  return (
    <Svg size={size} {...rest}>
      <path d="M3.2 12.6h17.6c0 3.7-3.9 6.2-8.8 6.2s-8.8-2.5-8.8-6.2z" fill="currentColor" fillOpacity={filled ? 0.12 : 0} />
      <path d="M8 18.8v1.4M16 18.8v1.4" />
      {filled ? (
        <>
          <path d="M7.6 12.6c.7-3.1 2.5-4.7 4.4-4.7s3.7 1.6 4.4 4.7" />
          <path d="M10.4 10.6h.01M13.6 10.2h.01M12 8.6h.01" strokeWidth={2.4} />
        </>
      ) : null}
    </Svg>
  );
}

export function HandIcon({ size = 24, ...rest }: IconProps) {
  return (
    <Svg size={size} {...rest}>
      <path d="M8.2 12.4V5.6a1.5 1.5 0 0 1 3 0V10" />
      <path d="M11.2 9.6V4.4a1.5 1.5 0 0 1 3 0v5.2" />
      <path d="M14.2 9.9V5.6a1.5 1.5 0 0 1 3 0v6.2" />
      <path d="M17.2 9.4a1.5 1.5 0 0 1 3 0v4.4c0 3.9-2.9 6.7-6.6 6.7h-1.2c-2.5 0-4.1-1-5.4-2.7l-3-3.7a1.6 1.6 0 0 1 2.4-2l1.8 1.8" />
    </Svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2.4} {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </Svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 15V3.5" />
      <path d="m7.5 7.5 4.5-4 4.5 4" />
      <path d="M5 11.5v6.2c0 .9.7 1.6 1.6 1.6h10.8c.9 0 1.6-.7 1.6-1.6v-6.2" />
    </Svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5V15" />
      <path d="m7.5 10.8 4.5 4.2 4.5-4.2" />
      <path d="M5 16.5v1.2c0 .9.7 1.6 1.6 1.6h10.8c.9 0 1.6-.7 1.6-1.6v-1.2" />
    </Svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 19V5.5" />
      <path d="m6.5 11 5.5-5.5 5.5 5.5" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Svg>
  );
}
