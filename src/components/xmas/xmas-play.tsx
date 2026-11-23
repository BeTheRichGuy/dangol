'use client';

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';

export const HOLD_MS = 1200;

export const WIPE_DONE = 0.33;

const COLS = 12;
const ROWS = 7;

export function wipedRatio(cells: readonly boolean[]): number {
  return cells.filter(Boolean).length / cells.length;
}

export function touchedCells(x: number, y: number, r: number, w: number, h: number): number[] {
  const out: number[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cx = ((col + 0.5) / COLS) * w;
      const cy = ((row + 0.5) / ROWS) * h;
      if (Math.hypot(cx - x, cy - y) <= r) out.push(row * COLS + col);
    }
  }
  return out;
}

export function HoldToPull({ label, hint, skip, onDone }: { label: string; hint: string; skip: string; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const started = useRef<number | null>(null);
  const done = useRef(false);

  function paint(p: number) {
    root.current?.style.setProperty('--p', String(p));
  }
  function finish() {
    if (done.current) return;
    done.current = true;
    cancelAnimationFrame(raf.current);
    paint(1);
    onDone();
  }
  function start() {
    if (done.current || started.current !== null) return;
    started.current = performance.now();
    const tick = (now: number) => {

      const p = Math.min(1, Math.max(0, now - (started.current ?? now)) / HOLD_MS);
      paint(p);
      if (p >= 1) return finish();
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }
  function release() {
    if (done.current) return;
    started.current = null;
    cancelAnimationFrame(raf.current);
    paint(0);
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <div ref={root} className="xp-pull">
      <i className="xp-pull__thread" aria-hidden="true" />
      <button
        type="button"
        className="xp-pull__button"
        onPointerDown={start}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' ? start() : undefined)}
        onKeyUp={release}
      >
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" />
          <circle cx="50" cy="50" r="46" pathLength="1" />
        </svg>
        <span>{label}</span>
      </button>
      <p className="xp-pull__hint">{hint}</p>
      <button type="button" className="xp-skip" onClick={finish}>
        {skip}
      </button>
    </div>
  );
}

export function FrostWipe({ children, hint, skip, onClear, done = false }: { children: ReactNode; hint: string; skip: string; onClear?: () => void; done?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const cells = useRef<boolean[]>(new Array<boolean>(COLS * ROWS).fill(false));
  const down = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [clear, setClear] = useState(done);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const box = c.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(box.width * ratio);
    c.height = Math.round(box.height * ratio);
    const g = c.getContext('2d');
    if (!g) return;
    g.scale(ratio, ratio);
    const fog = g.createLinearGradient(0, 0, box.width, box.height);
    fog.addColorStop(0, '#dfe9f7');
    fog.addColorStop(0.5, '#f4f8ff');
    fog.addColorStop(1, '#cfdcf0');
    g.fillStyle = fog;
    g.fillRect(0, 0, box.width, box.height);

    for (let i = 0; i < 260; i += 1) {
      const x = ((i * 73) % 997) / 997;
      const y = ((i * 191) % 991) / 991;
      g.fillStyle = `rgba(255,255,255,${0.35 + ((i * 37) % 50) / 100})`;
      g.beginPath();
      g.arc(x * box.width, y * box.height, 0.6 + ((i * 13) % 20) / 10, 0, Math.PI * 2);
      g.fill();
    }
  }, []);

  const told = useRef(false);
  useEffect(() => {
    if (!clear || told.current) return;
    told.current = true;
    onClear?.();
  }, [clear, onClear]);

  function rub(e: PointerEvent<HTMLCanvasElement>) {
    const c = canvas.current;
    if (!c || clear || !down.current) return;
    const box = c.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;

    const r = Math.max(26, box.width * 0.11);

    const from = last.current ?? { x, y };
    last.current = { x, y };
    const g = c.getContext('2d');
    if (g) {
      g.globalCompositeOperation = 'destination-out';
      g.lineWidth = r * 2;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(from.x, from.y);
      g.lineTo(x, y);
      g.stroke();
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / (r / 2)));
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      for (const i of touchedCells(from.x + (x - from.x) * t, from.y + (y - from.y) * t, r, box.width, box.height)) cells.current[i] = true;
    }
    if (wipedRatio(cells.current) >= WIPE_DONE) setClear(true);
  }

  return (
    <div className="xp-frost" data-clear={clear ? '' : undefined}>
      <div className="xp-frost__under">{children}</div>
      <canvas
        ref={canvas}
        className="xp-frost__ice"
        aria-hidden="true"
        onPointerDown={(e) => {
          down.current = true;
          last.current = null;
          setTouched(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          rub(e);
        }}
        onPointerMove={rub}
        onPointerUp={() => (down.current = false)}
        onPointerCancel={() => (down.current = false)}
      />
      {clear ? null : (
        <>
          {touched ? null : (
            <p className="xp-frost__hint" aria-hidden="true">
              <i />
              {hint}
            </p>
          )}
          <button type="button" className="xp-skip xp-frost__skip" onClick={() => setClear(true)}>
            {skip}
          </button>
        </>
      )}
    </div>
  );
}
