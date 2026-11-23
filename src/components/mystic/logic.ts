export const MAX_PARTICLES = 40;

export const DEFAULT_DENSITY = 0.7;

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function particleCount(density: number | undefined): number {
  const d = typeof density === 'number' && Number.isFinite(density) ? density : DEFAULT_DENSITY;
  return Math.round(Math.min(1, Math.max(0, d)) * MAX_PARTICLES);
}

export interface Particle {

  x: number;

  y: number;

  size: number;

  rise: number;

  sway: number;

  swayW: number;
  swayPhase: number;

  twinkleW: number;
  twinklePhase: number;

  peak: number;

  tone: 0 | 1;
}

function spawn(rng: () => number, y: number): Particle {
  const twinkleSeconds = 3 + rng() * 5;
  return {
    x: rng(),
    y,
    size: 0.5 + rng() * 0.5,
    rise: 0.012 + rng() * 0.018,
    sway: 4 + rng() * 10,
    swayW: (Math.PI * 2) / (12 + rng() * 28),
    swayPhase: rng() * Math.PI * 2,
    twinkleW: (Math.PI * 2) / twinkleSeconds,
    twinklePhase: rng() * Math.PI * 2,
    peak: 0.25 + rng() * 0.45,
    tone: rng() < 0.35 ? 1 : 0,
  };
}

export function createParticles(count: number, seed: number): Particle[] {
  const rng = mulberry32(seed);
  const n = Math.max(0, Math.min(MAX_PARTICLES, Math.floor(count)));
  return Array.from({ length: n }, () => spawn(rng, rng()));
}

export const TOP_EXIT = -0.06;
export const BOTTOM_ENTER = 1.06;

export function advance(p: Particle, dt: number, rng: () => number): Particle {
  const y = p.y - p.rise * dt;
  if (y < TOP_EXIT) return spawn(rng, BOTTOM_ENTER);
  return { ...p, y };
}

function smoothstep(a: number, b: number, v: number): number {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function edgeFade(y: number): number {
  return smoothstep(1.05, 0.9, y) * smoothstep(-0.03, 0.2, y);
}

export function particleAlpha(p: Particle, tSec: number): number {
  const breathe = 0.775 + 0.225 * Math.sin(tSec * p.twinkleW + p.twinklePhase);
  return Math.min(1, Math.max(0, p.peak * breathe * edgeFade(p.y)));
}

export function particleSway(p: Particle, tSec: number): number {
  return Math.sin(tSec * p.swayW + p.swayPhase) * p.sway;
}

export interface Budget {
  take(n: number): number;
  give(n: number): void;
  readonly left: number;
}

export function createBudget(max: number = MAX_PARTICLES): Budget {
  let used = 0;
  return {
    take(n) {
      const want = Math.max(0, Math.floor(n));
      const got = Math.min(want, max - used);
      used += got;
      return got;
    },
    give(n) {
      used = Math.max(0, used - Math.max(0, Math.floor(n)));
    },
    get left() {
      return max - used;
    },
  };
}

export const GLYPH_TIMING = {

  leadMs: 240,

  stepMs: 300,

  riseMs: 700,

  holdMs: 500,
} as const;

export interface GlyphTimeline {

  delays: number[];
  riseMs: number;

  doneAt: number;
}

export const GLYPH_REDUCED = { riseMs: 200, doneAt: 600 } as const;

export function glyphTimeline(count: number, reduced: boolean): GlyphTimeline {
  const n = Math.max(0, Math.floor(count));
  if (reduced) return { delays: Array.from({ length: n }, () => 0), riseMs: GLYPH_REDUCED.riseMs, doneAt: GLYPH_REDUCED.doneAt };
  const { leadMs, stepMs, riseMs, holdMs } = GLYPH_TIMING;
  const delays = Array.from({ length: n }, (_, i) => leadMs + i * stepMs);
  const lastEnd = n === 0 ? leadMs : delays[n - 1] + riseMs;
  return { delays, riseMs, doneAt: lastEnd + holdMs };
}

function whole(n: number): number {
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export const LAND_TIMING = {

  holdMs: 260,
  flightMs: 620,
  fadeMs: 280,
  staggerMs: 90,

  lanternLeadMs: 360,
} as const;

export interface LandTimeline {

  delays: number[];
  flightMs: number;
  fadeMs: number;

  totalMs: number;
}

export function landTimeline(count: number, group = 2): LandTimeline {
  const n = whole(count);
  const g = Math.max(1, whole(group));
  const { flightMs, fadeMs, staggerMs } = LAND_TIMING;
  const delays = Array.from({ length: n }, (_, i) => Math.floor(i / g) * staggerMs);
  const last = n === 0 ? 0 : delays[n - 1];
  return { delays, flightMs, fadeMs, totalMs: last + flightMs };
}

export function lanternArrive(): { delayMs: number; stepMs: number } {
  const { flightMs, lanternLeadMs, staggerMs } = LAND_TIMING;
  return { delayMs: Math.max(0, flightMs - lanternLeadMs), stepMs: staggerMs };
}

export function landStartMs(count: number): number {
  const { leadMs, stepMs, riseMs } = GLYPH_TIMING;
  const n = whole(count);
  const lastEnd = n === 0 ? leadMs : leadMs + (n - 1) * stepMs + riseMs;
  return lastEnd + LAND_TIMING.holdMs;
}

export function landTransform(
  from: { cx: number; cy: number; size: number },
  to: { cx: number; cy: number; size: number },
): { dx: number; dy: number; scale: number } | null {
  const ok = [from.cx, from.cy, from.size, to.cx, to.cy, to.size].every((v) => Number.isFinite(v));
  if (!ok || from.size <= 0 || to.size <= 0) return null;
  const scale = Math.min(3, Math.max(0.2, to.size / from.size));
  return { dx: to.cx - from.cx, dy: to.cy - from.cy, scale };
}

export type GlyphLayoutKind = 'pillars' | 'row';

export interface GlyphLayout {
  kind: GlyphLayoutKind;

  columns: number;
}

export function glyphLayout(count: number, mode: 'auto' | 'row' | 'pillars' = 'auto'): GlyphLayout {
  const n = Math.max(0, Math.floor(count));
  const even = n % 2 === 0 && n >= 2;
  const pillars = mode === 'pillars' ? even : mode === 'auto' ? even && n >= 4 && n <= 8 : false;
  return pillars ? { kind: 'pillars', columns: n / 2 } : { kind: 'row', columns: n };
}

export interface WordToken {
  text: string;

  word: boolean;

  index: number;
}

export function splitWords(text: string): WordToken[] {
  const parts = text.split(/(\s+)/).filter((s) => s.length > 0);
  let w = 0;
  return parts.map((s) => {
    const isWord = !/^\s+$/.test(s);
    return { text: s, word: isWord, index: isWord ? w++ : -1 };
  });
}

export const REVEAL = { stepMs: 40, maxSpreadMs: 900, wordMs: 640, blurMinMs: 560, blurMaxMs: 1200 } as const;

export function wordDelays(wordCount: number, baseDelayMs = 0): number[] {
  const n = Math.max(0, Math.floor(wordCount));
  const base = Math.max(0, baseDelayMs);
  if (n === 0) return [];
  const step = Math.min(REVEAL.stepMs, REVEAL.maxSpreadMs / Math.max(1, n - 1));
  return Array.from({ length: n }, (_, i) => Math.round(base + i * step));
}

export function revealBlurMs(wordCount: number): number {
  const n = whole(wordCount);
  const spread = n <= 1 ? 0 : Math.min(REVEAL.maxSpreadMs, (n - 1) * REVEAL.stepMs);
  return Math.min(REVEAL.blurMaxMs, Math.max(REVEAL.blurMinMs, spread + 420));
}

export interface InkBlotSpec {
  seed: number;

  rMin: number;

  rMax: number;

  fingers: number;

  droplets: number;
}

export interface InkBlot {

  d: string;
  droplets: { cx: number; cy: number; r: number }[];

  minR: number;
  maxR: number;
}

const BLOT_POINTS = 112;

const r1 = (n: number) => Math.round(n * 10) / 10;

export function inkBlot(spec: InkBlotSpec): InkBlot {
  const rng = mulberry32(spec.seed);

  const harmonics = [
    [2, 0.12],
    [3, 0.1],
    [4, 0.08],
    [5, 0.065],
    [7, 0.05],
    [10, 0.04],
    [14, 0.03],
    [19, 0.022],
    [26, 0.016],
    [34, 0.011],
  ].map(([k, a]) => ({ k, a: a * (0.7 + rng() * 0.6), phase: rng() * Math.PI * 2 }));
  const fingers = Array.from({ length: Math.max(0, Math.floor(spec.fingers)) }, () => ({
    at: rng() * Math.PI * 2,
    width: 0.1 + rng() * 0.12,
    amp: 0.28 + rng() * 0.3,
  }));

  const raw: number[] = [];
  for (let j = 0; j < BLOT_POINTS; j++) {
    const th = (j / BLOT_POINTS) * Math.PI * 2;
    let v = 1;
    for (const h of harmonics) v += h.a * Math.sin(h.k * th + h.phase);
    for (const f of fingers) {

      let dth = th - f.at;
      dth = Math.atan2(Math.sin(dth), Math.cos(dth));
      v += f.amp * Math.exp(-(dth * dth) / (2 * f.width * f.width));
    }
    raw.push(v);
  }
  const lo = Math.min(...raw);
  const hi = Math.max(...raw);
  const span = hi - lo || 1;
  const radii = raw.map((v) => spec.rMin + ((v - lo) / span) * (spec.rMax - spec.rMin));

  const pts = radii.map((r, j) => {
    const th = (j / BLOT_POINTS) * Math.PI * 2;
    return [50 + r * Math.cos(th), 50 + r * Math.sin(th)] as const;
  });

  const mid = (a: readonly [number, number], b: readonly [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as const;
  const start = mid(pts[BLOT_POINTS - 1], pts[0]);
  let d = `M${r1(start[0])},${r1(start[1])}`;
  for (let j = 0; j < BLOT_POINTS; j++) {
    const c = pts[j];
    const e = mid(pts[j], pts[(j + 1) % BLOT_POINTS]);
    d += `Q${r1(c[0])},${r1(c[1])} ${r1(e[0])},${r1(e[1])}`;
  }
  d += 'Z';

  const drops: InkBlot['droplets'] = [];
  for (let i = 0; i < Math.max(0, Math.floor(spec.droplets)); i++) {
    const th = rng() * Math.PI * 2;
    const r = 0.7 + rng() * 1.5;

    const lowD = spec.rMax + 1.5 + r;
    const highD = Math.max(lowD, 48.5 - r);
    const dist = lowD + rng() * (highD - lowD);
    drops.push({ cx: r1(50 + dist * Math.cos(th)), cy: r1(50 + dist * Math.sin(th)), r: r1(r) });
  }

  return { d, droplets: drops, minR: Math.min(...radii), maxR: Math.max(...radii) };
}

export function inkBlotSvg(spec: InkBlotSpec): string {
  const b = inkBlot(spec);
  const drops = b.droplets.map((c) => `<circle cx='${c.cx}' cy='${c.cy}' r='${c.r}'/>`).join('');
  const rim = (width: number, alpha: number) =>
    `<use href='#b' fill='none' stroke='#000' stroke-opacity='${alpha}' stroke-width='${width}' stroke-linejoin='round'/>`;
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'>` +
    `<defs><path id='b' d='${b.d}'/></defs>` +
    rim(8, 0.07) +
    rim(5.6, 0.12) +
    rim(3.6, 0.2) +
    rim(2, 0.32) +
    `<use href='#b' fill='#000'/>` +
    `<g fill='#000'>${drops}</g></svg>`
  );
}

export function inkRingSvg(spec: InkBlotSpec): string {
  const b = inkBlot(spec);
  const line = (width: number, alpha: number) =>
    `<use href='#b' fill='none' stroke='#000' stroke-opacity='${alpha}' stroke-width='${width}' stroke-linejoin='round'/>`;
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'>` +
    `<defs><path id='b' d='${b.d}'/></defs>` +
    line(9, 0.1) +
    line(6, 0.18) +
    line(3.6, 0.32) +
    line(1.8, 0.5) +
    line(0.8, 0.7) +
    `</svg>`
  );
}

function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${svg.replace(/%/g, '%25').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23')}`;
}

export function inkBlotDataUri(spec: InkBlotSpec): string {
  return svgDataUri(inkBlotSvg(spec));
}

export function inkRingDataUri(spec: InkBlotSpec): string {
  return svgDataUri(inkRingSvg(spec));
}

export const INK_BLOTS: readonly InkBlotSpec[] = [
  { seed: 7, rMin: 22, rMax: 33, fingers: 4, droplets: 7 },
  { seed: 41, rMin: 20, rMax: 31, fingers: 3, droplets: 6 },
  { seed: 113, rMin: 20, rMax: 31, fingers: 3, droplets: 6 },
];

export function inkBlotCssBlock(): string {
  const blots = INK_BLOTS.map((b, i) => `  --mx-blot-${i + 1}: url("${inkBlotDataUri(b)}");`);
  const rings = INK_BLOTS.map((b, i) => `  --mx-ring-${i + 1}: url("${inkRingDataUri(b)}");`);
  return [...blots, ...rings].join('\n');
}

export const GATE_MS = 600;

export const GATE_REDUCED_MS = 220;

export const GATE_OUT_MS = 450;

export function gateDoneMs(reduced: boolean): number {
  return reduced ? GATE_REDUCED_MS : GATE_MS;
}

export interface GateOrigin {
  x: string;
  y: string;

  h?: string;
}

const LENGTH_OK = /^[-+0-9a-z.%(), *\/]+$/i;

function lengthOr(v: string | undefined, fallback: string): string {
  if (typeof v !== 'string') return fallback;
  const t = v.trim();
  return t.length > 0 && t.length <= 120 && LENGTH_OK.test(t) ? t : fallback;
}

export function gateOriginVars(origin?: GateOrigin): Record<'--gate-x' | '--gate-y', string> & { '--gate-door-h'?: string } {
  const vars: Record<'--gate-x' | '--gate-y', string> & { '--gate-door-h'?: string } = {
    '--gate-x': lengthOr(origin?.x, '50%'),
    '--gate-y': lengthOr(origin?.y, '50%'),
  };
  if (origin?.h !== undefined) {
    const h = lengthOr(origin.h, '');
    if (h) vars['--gate-door-h'] = h;
  }
  return vars;
}
