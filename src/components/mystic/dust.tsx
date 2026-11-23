'use client';

import { useEffect, useId, useRef } from 'react';
import { useReducedMotion } from '@/components/use-reduced-motion';
import {
  MAX_PARTICLES,
  advance,
  createBudget,
  createParticles,
  hashSeed,
  mulberry32,
  particleAlpha,
  particleCount,
  particleSway,
} from './logic';
import './mystic.css';

const budget = createBudget(MAX_PARTICLES);

const FALLBACK = { glow: '#f6c98b', deep: '#d9a45c', paper: '#fbf6ee' } as const;

const MIN_FRAME_MS = 12;

const STATIC_DIM = 0.75;

type Rgb = readonly [number, number, number];

function parseHex(value: string): Rgb | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function token(cs: CSSStyleDeclaration, name: string, fallback: string): Rgb {
  return parseHex(cs.getPropertyValue(name)) ?? (parseHex(fallback) as Rgb);
}

function rgba(c: Rgb, a: number): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

function makeSprite(halo: Rgb, core: Rgb, px: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = px;
  c.height = px;
  const g = c.getContext('2d');
  if (g) {
    const r = px / 2;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, rgba(core, 1));
    grad.addColorStop(0.14, rgba(halo, 0.95));
    grad.addColorStop(0.42, rgba(halo, 0.26));
    grad.addColorStop(1, rgba(halo, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, px, px);
  }
  return c;
}

export function MysticDust({ density, className }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const seed = hashSeed(useId());
  const count = particleCount(density);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || count === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const granted = budget.take(count);
    if (granted === 0) return;

    let particles = createParticles(granted, seed);
    const rng = mulberry32(seed ^ 0x9e3779b9);
    const cs = getComputedStyle(canvas);
    const glow = token(cs, '--glow', FALLBACK.glow);
    const deep = token(cs, '--glow-deep', FALLBACK.deep);
    const paper = token(cs, '--paper', FALLBACK.paper);

    let w = 0;
    let h = 0;
    let dpr = 1;
    let sprites: [HTMLCanvasElement, HTMLCanvasElement] | null = null;
    let t = 0;
    let last = 0;
    let raf = 0;
    let tabVisible = document.visibilityState !== 'hidden';
    let onscreen = true;

    const draw = (dim: number) => {
      if (!sprites || w === 0 || h === 0) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        const a = particleAlpha(p, t) * dim;
        if (a < 0.01) continue;
        const d = 10 + 12 * p.size;
        ctx.globalAlpha = a;
        ctx.drawImage(sprites[p.tone], p.x * w + particleSway(p, t) - d / 2, p.y * h - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(0, Math.round(rect.width));
      h = Math.max(0, Math.round(rect.height));
      if (nextDpr !== dpr || !sprites) {
        dpr = nextDpr;
        const px = Math.round(64 * dpr);
        sprites = [makeSprite(glow, paper, px), makeSprite(deep, paper, px)];
      }
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(reduced ? STATIC_DIM : 1);
    };

    const tick = (now: number) => {
      raf = 0;
      if (last === 0) last = now;
      const elapsed = now - last;
      if (elapsed < MIN_FRAME_MS) {
        raf = requestAnimationFrame(tick);
        return;
      }
      last = now;

      const dt = Math.min(elapsed, 64) / 1000;
      t += dt;
      particles = particles.map((p) => advance(p, dt, rng));
      draw(1);
      raf = requestAnimationFrame(tick);
    };

    const sync = () => {
      const run = !reduced && tabVisible && onscreen;
      if (run && !raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onVisibility = () => {
      tabVisible = document.visibilityState !== 'hidden';
      sync();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      if (!e) return;
      onscreen = e.isIntersecting;
      sync();
    });
    io.observe(canvas);
    document.addEventListener('visibilitychange', onVisibility);

    resize();
    sync();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      budget.give(granted);
    };
  }, [count, reduced, seed]);

  return <canvas ref={ref} className={className ? `mx-dust ${className}` : 'mx-dust'} aria-hidden="true" />;
}
