import Image from 'next/image';
import { useId } from 'react';
import type { ProductKey } from '@/lib/rooms/themes';
import { roomArtSrc } from '../scene/manifest';

const PALETTE: Record<ProductKey, { top: string; bottom: string; glow: string; glow2: string }> = {
  life: { top: '#1c1418', bottom: '#2b1d16', glow: '#f6c98b', glow2: '#d9a45c' },
  decades: { top: '#100f22', bottom: '#1d1938', glow: '#c9b6ff', glow2: '#f6c98b' },
  love: { top: '#1c0f16', bottom: '#331523', glow: '#f3a1b5', glow2: '#e0566b' },
  match: { top: '#141018', bottom: '#1a1f35', glow: '#f6c98b', glow2: '#bcd0e8' },
  year: { top: '#0b0b1d', bottom: '#1f1640', glow: '#a99bff', glow2: '#f6c98b' },

  reunion: { top: '#0b1224', bottom: '#1b2a38', glow: '#d4def5', glow2: '#8fa9bf' },
};

function stars(seed: number, n: number): { x: number; y: number; r: number; o: number }[] {
  let s = seed;
  const next = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  return Array.from({ length: n }, () => ({ x: next() * 400, y: next() * 300, r: 0.5 + next() * 1.3, o: 0.25 + next() * 0.6 }));
}

function Lantern({ x, y, s = 1, lit = false, color }: { x: number; y: number; s?: number; lit?: boolean; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {lit ? <circle r="26" fill={color} opacity="0.22" /> : null}
      <line x1="0" y1="-22" x2="0" y2="-12" stroke={color} strokeOpacity="0.5" strokeWidth="1" />
      <ellipse rx="8" ry="11" fill={color} opacity={lit ? 0.95 : 0.38} />
      <rect x="-4" y="-13" width="8" height="2.5" rx="1" fill={color} opacity="0.6" />
      <rect x="-4" y="10.5" width="8" height="2.5" rx="1" fill={color} opacity="0.6" />
    </g>
  );
}

function Placeholder({ room, glyph }: { room: ProductKey; glyph: string }) {
  const uid = useId().replace(/:/g, '');
  const p = PALETTE[room];
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="rm-art__svg" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.top} />
          <stop offset="1" stopColor={p.bottom} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.32" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-left`} cx="0.18" cy="0.5" r="0.6">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.4" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-right`} cx="0.82" cy="0.5" r="0.6">
          <stop offset="0" stopColor={p.glow2} stopOpacity="0.36" />
          <stop offset="1" stopColor={p.glow2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#${uid}-bg)`} />

      {room === 'match' ? (
        <>
          <rect width="400" height="500" fill={`url(#${uid}-left)`} />
          <rect width="400" height="500" fill={`url(#${uid}-right)`} />
          <line x1="200" y1="40" x2="200" y2="460" stroke="#fff6e6" strokeOpacity="0.12" strokeWidth="1" />
          <Lantern x={150} y={250} s={1.6} lit color={p.glow} />
          <Lantern x={250} y={250} s={1.6} lit color={p.glow2} />
        </>
      ) : (
        <rect width="400" height="500" fill={`url(#${uid}-glow)`} />
      )}

      {room === 'year' || room === 'decades'
        ? stars(room === 'year' ? 7 : 3, room === 'year' ? 70 : 34).map((st, i) => (
            <circle key={i} cx={st.x} cy={st.y} r={st.r} fill="#fff6e6" opacity={st.o * (room === 'year' ? 1 : 0.6)} />
          ))
        : null}

      {room === 'year'
        ? Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            return <Lantern key={i} x={200 + Math.cos(a) * 118} y={215 + Math.sin(a) * 92} s={0.9} lit={i === 0} color={p.glow2} />;
          })
        : null}

      {room === 'decades'
        ? Array.from({ length: 10 }, (_, i) => (
            <Lantern key={i} x={64 + i * 30} y={392 - i * 30 - Math.sin(i / 3) * 10} s={0.85} lit={i === 2} color={p.glow2} />
          ))
        : null}

      {room === 'love' ? (
        <>
          {[60, 104, 150].map((y, i) => (
            <path
              key={y}
              d={`M -10 ${y} Q 200 ${y + 70 - i * 12} 410 ${y - 8}`}
              fill="none"
              stroke={p.glow2}
              strokeOpacity="0.55"
              strokeWidth="1.2"
            />
          ))}
          {[
            [70, 92],
            [150, 116],
            [240, 116],
            [330, 92],
            [110, 150],
            [290, 150],
            [200, 178],
          ].map(([x, y], i) => (
            <Lantern key={i} x={x} y={y + 18} s={0.8} lit={i === 6} color={p.glow} />
          ))}
        </>
      ) : null}

      {room === 'life' ? (
        <>
          <Lantern x={120} y={150} s={1.2} lit color={p.glow} />
          <Lantern x={290} y={120} s={0.9} color={p.glow} />
        </>
      ) : null}

      <text
        x="200"
        y={room === 'year' ? 236 : room === 'match' ? 150 : 300}
        textAnchor="middle"
        dominantBaseline="middle"
        className="rm-art__glyph"
        fill="#fff6e6"
        fillOpacity={room === 'year' ? 0.22 : 0.16}
        fontSize={glyph.length > 1 ? 104 : 168}
      >
        {glyph}
      </text>
    </svg>
  );
}

export function RoomArt({ room, glyph, priority = false, sizes }: { room: ProductKey; glyph: string; priority?: boolean; sizes: string }) {
  const src = roomArtSrc(room);
  return (
    <div className="rm-art" data-room={room}>
      {src ? (
        <Image src={src} alt="" fill priority={priority} sizes={sizes} className="rm-art__img" />
      ) : (
        <Placeholder room={room} glyph={glyph} />
      )}
    </div>
  );
}
