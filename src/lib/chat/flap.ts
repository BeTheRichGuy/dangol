export const WORLD_H = 120;

export const GROUND_Y = 106;

export const PLAYER_X = 44;

export const HIT_HALF_W = 9;
export const HIT_HALF_H = 6;

export const GRAVITY = 520;

export const FLAP_V = -165;
export const FALL_MAX = 230;

export const RISE = (FLAP_V * FLAP_V) / (2 * GRAVITY);

export const SPEED_START = 66;
export const SPEED_MAX = 92;

export const SPEED_GAIN = 0.35;

export const PILLAR_W = 20;
export const GAP_START = 54;
export const GAP_MIN = 44;

export const GAP_SHRINK = 0.2;

const GAP_EDGE = 12;

export const MAX_SHIFT = 30;

export const SPACING_S = 1.3;

const BELLS_PER_GAP = 3;
const BELL_STEP = 16;

export interface Pillar {

  x: number;

  gapY: number;
  gapH: number;
}
export interface Bell {
  x: number;
  y: number;
  taken: boolean;
}

export type Cause = 'hit' | 'fall';
export type FlapEvent = 'flap' | 'bell' | 'hit' | 'fall';

export interface Flap {

  w: number;
  rng: number;
  t: number;
  speed: number;

  dist: number;

  y: number;
  vy: number;

  flapT: number;
  pillars: Pillar[];
  bells: Bell[];

  nextX: number;
  lastGapY: number;
  score: number;
  alive: boolean;
  cause: Cause | null;

  deadT: number;
}

function rand(run: Flap): number {
  run.rng = (run.rng + 0x6d2b79f5) | 0;
  let t = run.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function createFlap(seed: number, width: number): Flap {
  return {
    w: width,
    rng: seed | 0,
    t: 0,
    speed: SPEED_START,
    dist: 0,
    y: GROUND_Y / 2,
    vy: 0,
    flapT: 9,
    pillars: [],
    bells: [],

    nextX: PLAYER_X + 130,
    lastGapY: GROUND_Y / 2,
    score: 0,
    alive: true,
    cause: null,
    deadT: 0,
  };
}

export function gapAt(t: number): number {
  return Math.max(GAP_MIN, GAP_START - GAP_SHRINK * t);
}

function spawn(run: Flap): void {
  while (run.nextX < run.w + 40) {
    const gapH = gapAt(run.t);
    const lo = gapH / 2 + GAP_EDGE;
    const hi = GROUND_Y - gapH / 2 - GAP_EDGE;
    const gapY = Math.min(hi, Math.max(lo, run.lastGapY + (rand(run) * 2 - 1) * MAX_SHIFT));
    run.lastGapY = gapY;
    const x = run.nextX;
    run.pillars.push({ x, gapY, gapH });
    const cx = x + PILLAR_W / 2;
    for (let i = 0; i < BELLS_PER_GAP; i += 1) {
      run.bells.push({ x: cx + (i - (BELLS_PER_GAP - 1) / 2) * BELL_STEP, y: gapY, taken: false });
    }
    run.nextX = x + run.speed * SPACING_S + PILLAR_W;
  }
}

export function step(run: Flap, dt: number, flap: boolean): FlapEvent[] {
  const ev: FlapEvent[] = [];
  if (!run.alive) {
    run.deadT += dt;
    run.vy = Math.min(FALL_MAX, run.vy + GRAVITY * dt);
    run.y = Math.min(GROUND_Y - 3, run.y + run.vy * dt);
    return ev;
  }

  run.t += dt;
  run.flapT += dt;
  run.speed = Math.min(SPEED_MAX, SPEED_START + SPEED_GAIN * run.t);
  const dx = run.speed * dt;
  run.dist += dx;
  for (const p of run.pillars) p.x -= dx;
  for (const b of run.bells) b.x -= dx;
  run.nextX -= dx;
  run.pillars = run.pillars.filter((p) => p.x + PILLAR_W + 20 > 0);
  run.bells = run.bells.filter((b) => b.x + 10 > 0 && !b.taken);
  spawn(run);

  if (flap) {
    run.vy = FLAP_V;
    run.flapT = 0;
    ev.push('flap');
  }
  run.vy = Math.min(FALL_MAX, run.vy + GRAVITY * dt);
  run.y += run.vy * dt;

  if (run.y - HIT_HALF_H < 0) {
    run.y = HIT_HALF_H;
    run.vy = Math.max(0, run.vy);
  }

  for (const b of run.bells) {
    if (b.taken) continue;
    if (Math.abs(b.x - PLAYER_X) < HIT_HALF_W + 3 && Math.abs(b.y - run.y) < HIT_HALF_H + 4) {
      b.taken = true;
      run.score += 1;
      ev.push('bell');
    }
  }

  const left = PLAYER_X - HIT_HALF_W;
  const right = PLAYER_X + HIT_HALF_W;
  for (const p of run.pillars) {
    if (right > p.x && left < p.x + PILLAR_W) {
      if (run.y - HIT_HALF_H < p.gapY - p.gapH / 2 || run.y + HIT_HALF_H > p.gapY + p.gapH / 2) {
        run.alive = false;
        run.cause = 'hit';
        run.vy = Math.max(run.vy, 0);
        ev.push('hit');
        return ev;
      }
    }
  }

  if (run.y + HIT_HALF_H >= GROUND_Y) {
    run.alive = false;
    run.cause = 'fall';
    run.y = GROUND_Y - HIT_HALF_H;
    run.vy = 0;
    ev.push('fall');
  }
  return ev;
}
