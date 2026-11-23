import { GROUND_Y, PILLAR_W, PLAYER_X, WORLD_H, type Flap } from '@/lib/chat/flap';

export type Grid = string[][];

export const PAL: Record<string, string> = {
  o: '#3b2a30',
  w: '#fffaf0',
  s: '#ecdcc6',
  S: '#d3bea2',
  r: '#d6402f',
  R: '#8e2420',
  y: '#f4c75a',
  Y: '#c28a2c',
  l: '#fff3b8',
  k: '#2a1a20',
  p: '#f4a3b0',
  n: '#e57a8b',
  v: '#ece6ff',
  V: '#bdb2ec',
  W: '#8f83cc',
  z: '#d9d3ff',
  m: '#6faa5c',
  u: '#a8743c',
  U: '#6e4724',
};

export const blank = (w: number, h: number): Grid => Array.from({ length: h }, () => Array<string>(w).fill('.'));

function set(g: Grid, x: number, y: number, c: string): void {
  const rx = Math.round(x);
  const ry = Math.round(y);
  if (ry >= 0 && ry < g.length && rx >= 0 && rx < g[0].length) g[ry][rx] = c;
}

function rect(g: Grid, x: number, y: number, w: number, h: number, c: string): void {
  for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) set(g, x + i, y + j, c);
}

function ellipse(g: Grid, cx: number, cy: number, rx: number, ry: number, c: string): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      const dx = (x - cx) / (rx + 0.35);
      const dy = (y - cy) / (ry + 0.35);
      if (dx * dx + dy * dy <= 1) set(g, x, y, c);
    }
  }
}

function line(g: Grid, x0: number, y0: number, x1: number, y1: number, c: string, thick = 1): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const xe = Math.round(x1);
  const ye = Math.round(y1);
  const dx = Math.abs(xe - x);
  const dy = -Math.abs(ye - y);
  const sx = x < xe ? 1 : -1;
  const sy = y < ye ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    set(g, x, y, c);
    if (thick > 1) set(g, x + 1, y, c);
    if (x === xe && y === ye) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function outline(g: Grid, c = 'o'): void {
  const h = g.length;
  const w = g[0].length;
  const hits: Array<[number, number]> = [];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (g[y][x] !== '.') continue;
      const near = [g[y - 1]?.[x], g[y + 1]?.[x], g[y][x - 1], g[y][x + 1]];
      if (near.some((n) => n !== undefined && n !== '.' && n !== c)) hits.push([x, y]);
    }
  }
  for (const [x, y] of hits) g[y][x] = c;
}

function squeezeX(g: Grid, newW: number): Grid {
  const w = g[0].length;
  const out = blank(w, g.length);
  const off = Math.floor((w - newW) / 2);
  for (let x = 0; x < newW; x += 1) {
    const src = Math.min(w - 1, Math.floor(((x + 0.5) / newW) * w));
    for (let y = 0; y < g.length; y += 1) out[y][off + x] = g[y][src];
  }
  return out;
}

function place(g: Grid, rows: string[], x0: number, y0: number): void {
  rows.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && set(g, x0 + i, y0 + j, ch)));
}

export const CAT_W = 32;
export const CAT_H = 29;

export const CAT_CY = 14;
export type CatPose = 'idle' | 'flap' | 'glide' | 'fall' | 'dead';
export const CAT_FRAMES: Record<CatPose, number> = { idle: 2, flap: 4, glide: 4, fall: 1, dead: 1 };

export function catGrid(pose: CatPose, frame = 0): Grid {
  const g = blank(CAT_W, CAT_H);
  const f = frame % CAT_FRAMES[pose];
  const lift = pose === 'flap' ? [1, -1, -1, 0][f] : 0;
  const bodyY = CAT_CY + lift;
  const headY = bodyY - 2 + (pose === 'idle' ? 1 : 0);
  const sway = pose === 'glide' ? [0, 1, 0, -1][f] : pose === 'flap' ? [-1, -2, -1, 0][f] : 0;

  const up = pose === 'fall' ? 3 : 0;
  line(g, 5, bodyY + 2, 3, bodyY - 1 - up, 'w', 2);
  line(g, 3, bodyY - 1 - up, 3 + sway, bodyY - 6 - up, 'w', 2);
  set(g, 3 + sway, bodyY - 7 - up, 's');

  ellipse(g, 11, bodyY + 1, 8.5, pose === 'idle' && f === 1 ? 5.6 : 5, 'w');
  for (let x = 2; x <= 21; x += 1) for (let y = bodyY + 3; y <= bodyY + 8; y += 1) if (g[y]?.[x] === 'w') g[y][x] = 's';

  ellipse(g, 23, headY, 7, 6, 'o');
  ellipse(g, 23, headY, 6, 5, 'w');
  for (let x = 17; x <= 29; x += 1) if (g[headY + 4]?.[x] === 'w') g[headY + 4][x] = 's';

  place(g, ['.w.', 'www'], 17, headY - 7);
  place(g, ['.w.', 'www'], 27, headY - 7);
  set(g, 18, headY - 6, 'p');
  set(g, 28, headY - 6, 'p');

  rect(g, 21, headY - 10, 5, 4, 'r');
  rect(g, 21, headY - 10, 5, 1, 'R');
  rect(g, 21, headY - 7, 5, 1, 'R');
  set(g, 23, headY - 8, 'y');

  if (pose === 'fall') {
    set(g, 20, headY - 9, 'y');
    set(g, 19, headY - 11, 'y');
  } else {
    const t = pose === 'glide' ? [0, 1, 0, -1][f] : pose === 'flap' ? [-1, 0, 1, 0][f] : 0;
    set(g, 20, headY - 9, 'y');
    set(g, 19, headY - 8 + t, 'y');
  }

  const cy = bodyY + 7;
  const c = blank(CAT_W, CAT_H);
  const shape = {
    idle: [13, 4, 3.2],
    flap: [[14, 3, 2.4], [12, 5, 3.8], [13, 4.6, 3.4], [13, 4, 3.2]][f],
    glide: [13, 4, 3.2],
    fall: [12, 3.6, 3],
    dead: [10, 3, 2.6],
  }[pose] as number[];
  const [rx, ry, lump] = shape;
  ellipse(c, 16, cy, rx, ry, 'v');
  ellipse(c, 7, cy - 1, 4.5, lump, 'v');
  ellipse(c, 25, cy - 1, 4.5, lump, 'v');
  ellipse(c, 16, cy - 2.5, 5.5, lump + 0.4, 'v');
  for (let y = 0; y < CAT_H; y += 1) {
    for (let x = 0; x < CAT_W; x += 1) {
      if (c[y][x] === '.') continue;
      c[y][x] = y >= cy + 3 ? 'W' : y >= cy + 1 ? 'V' : 'v';
    }
  }
  for (let y = 1; y < CAT_H; y += 1) {
    for (let x = 0; x < CAT_W; x += 1) {
      if (c[y][x] !== '.' && g[y - 1][x] !== '.' && c[y - 1][x] === '.') c[y][x] = 'o';
    }
  }
  for (let y = 0; y < CAT_H; y += 1) for (let x = 0; x < CAT_W; x += 1) if (c[y][x] !== '.') g[y][x] = c[y][x];

  outline(g);

  if (pose === 'dead') {
    for (const [x, y] of [[24, headY - 1], [26, headY - 1], [25, headY], [24, headY + 1], [26, headY + 1]]) set(g, x, y, 'k');
  } else if (pose === 'fall') {
    for (const [x, y] of [[24, headY - 1], [25, headY], [24, headY + 1]]) set(g, x, y, 'k');
  } else if (pose === 'idle') {
    rect(g, 24, headY, 3, 1, 'k');
  } else {

    for (const [x, y] of [[24, headY], [25, headY - 1], [26, headY]]) set(g, x, y, 'k');
  }
  set(g, 29, headY + 1, 'n');
  set(g, 24, headY + 2, 'p');
  set(g, 27, headY + 2, 'p');

  if (pose === 'idle') {
    const zy = f === 0 ? 2 : 0;
    place(g, ['zzzz', '..z.', '.z..', 'zzzz'], 28, zy);
  }

  if (pose === 'flap') {
    const dots: Array<[number, number]>[] = [[], [[9, cy + 5], [23, cy + 5]], [[7, cy + 6], [25, cy + 6], [16, cy + 6]], [[6, cy + 7], [26, cy + 7]]];
    for (const [x, y] of dots[f]) set(g, x, y, f === 2 ? 'l' : 'y');
  }
  return g;
}

const BELL_ROWS = ['...YY...', '..yllY..', '.yllyyY.', '.yllyyY.', '.yyyyyY.', 'yyyyyyyY', 'YYYYYYYY', '...YY...'];
export const BELL_FRAMES = 6;
const BELL_WIDTHS = [8, 7, 5, 3, 5, 7];

export function bellGrid(frame: number): Grid {
  const g = blank(10, 10);
  place(g, BELL_ROWS, 1, 1);
  const f = squeezeX(g, BELL_WIDTHS[frame % BELL_FRAMES] + 2);
  const out = blank(10, 10);
  place(out, f.map((r) => r.join('')), 0, 0);
  outline(out);
  return out;
}

function noise(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function cloudGrid(w: number, h: number, seed: number): Grid {
  const g = blank(w, h);
  const bumps = Math.max(2, Math.floor(w / 9));
  for (let i = 0; i < bumps; i += 1) {
    const cx = (w / bumps) * (i + 0.5);
    const r = h * (0.3 + noise(seed + i) * 0.25);
    ellipse(g, cx, h - r - 1, w / bumps / 1.4, r, 'w');
  }
  rect(g, 1, h - 3, w - 2, 2, 'w');
  for (let x = 0; x < w; x += 1) for (let y = h - 3; y < h; y += 1) if (g[y][x] === 'w') g[y][x] = 's';
  return g;
}

function shrineGrid(): Grid {
  const w = 160;
  const h = 56;
  const g = blank(w, h);
  const hall = (x: number, bw: number, bh: number, tiers: number) => {
    rect(g, x, h - bh, bw, bh, 'U');
    for (let t = 0; t < tiers; t += 1) {
      const ty = h - bh - 5 - t * 7;
      const tw = bw + 8 - t * 6;
      rect(g, x + (bw - tw) / 2, ty, tw, 4, 'U');
      set(g, x + (bw - tw) / 2 - 1, ty - 1, 'U');
      set(g, x + (bw + tw) / 2, ty - 1, 'U');
    }
    for (let i = 0; i < bw - 4; i += 6) rect(g, x + 3 + i, h - bh + 4, 3, 4, 'y');
  };
  hall(14, 34, 18, 2);
  hall(78, 26, 12, 3);
  hall(124, 22, 14, 1);

  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) if (g[y][x] === 'U') g[y][x] = 'S';
  return g;
}

export interface Sprites {
  cat: { [P in CatPose]: HTMLCanvasElement[] };
  bell: HTMLCanvasElement[];
  clouds: HTMLCanvasElement[];
  shrine: HTMLCanvasElement;
}

function toCanvas(g: Grid, tint?: (c: string) => string): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = g[0].length;
  cv.height = g.length;
  const ctx = cv.getContext('2d')!;
  for (let y = 0; y < g.length; y += 1) {
    for (let x = 0; x < g[0].length; x += 1) {
      const ch = g[y][x];
      if (ch === '.') continue;
      const col = PAL[ch];
      if (!col) continue;
      ctx.fillStyle = tint ? tint(col) : col;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return cv;
}

export function makeSprites(): Sprites {
  const poses = (Object.keys(CAT_FRAMES) as CatPose[]).map((p) => [p, Array.from({ length: CAT_FRAMES[p] }, (_, i) => toCanvas(catGrid(p, i)))] as const);
  return {
    cat: Object.fromEntries(poses) as Sprites['cat'],
    bell: Array.from({ length: BELL_FRAMES }, (_, i) => toCanvas(bellGrid(i))),
    clouds: [toCanvas(cloudGrid(34, 12, 3), dim), toCanvas(cloudGrid(46, 14, 9), dim), toCanvas(cloudGrid(26, 10, 17), dim)],
    shrine: toCanvas(shrineGrid(), (c) => (c === PAL.S ? '#2a2352' : c)),
  };
}

function dim(c: string): string {
  if (c === PAL.w) return '#7a68b0';
  if (c === PAL.s) return '#5a4a92';
  return c;
}

const SKY_BANDS = ['#0e1030', '#141641', '#1c1b52', '#2a2160', '#3d2a6c', '#5c3772', '#84486f', '#b5606a'];

const skyCache = new Map<number, HTMLCanvasElement>();
function sky(w: number): HTMLCanvasElement {
  const hit = skyCache.get(w);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = WORLD_H;
  const ctx = cv.getContext('2d')!;
  const bandH = Math.ceil(GROUND_Y / SKY_BANDS.length);
  for (let i = 0; i < SKY_BANDS.length; i += 1) {
    ctx.fillStyle = SKY_BANDS[i];
    ctx.fillRect(0, i * bandH, w, bandH + 1);
    if (i > 0) {
      ctx.fillStyle = SKY_BANDS[i - 1];
      for (let x = 0; x < w; x += 2) ctx.fillRect(x + ((i * 2) % 4 === 0 ? 0 : 1), i * bandH, 1, 1);
      for (let x = 1; x < w; x += 4) ctx.fillRect(x, i * bandH + 1, 1, 1);
    }
  }
  ctx.fillStyle = SKY_BANDS[SKY_BANDS.length - 1];
  ctx.fillRect(0, GROUND_Y, w, WORLD_H - GROUND_Y);
  skyCache.set(w, cv);
  return cv;
}

function wrapX(x: number, period: number): number {
  return ((x % period) + period) % period;
}

export interface Dust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

function sea(ctx: CanvasRenderingContext2D, w: number, scroll: number, base: number, amp: number, fill: string, hi: string, seed: number): void {
  for (let x = 0; x < w; x += 1) {
    const u = x + scroll;
    const top = Math.round(base + amp * (Math.sin(u * 0.13 + seed) + 0.6 * Math.sin(u * 0.31 + seed * 1.7)));
    ctx.fillStyle = fill;
    ctx.fillRect(x, top, 1, WORLD_H - top);
    ctx.fillStyle = hi;
    ctx.fillRect(x, top, 1, 1);
  }
}

function drawPillar(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number, capAtBottom: boolean): void {
  const bx = x + 2;
  const bw = PILLAR_W - 4;
  const h = bottom - top;
  ctx.fillStyle = PAL.o;
  ctx.fillRect(bx - 1, top, bw + 2, h);
  ctx.fillStyle = '#9aa0ad';
  ctx.fillRect(bx, top, bw, h);
  ctx.fillStyle = '#c6cbd6';
  ctx.fillRect(bx, top, 3, h);
  ctx.fillStyle = '#666b79';
  ctx.fillRect(bx + bw - 4, top, 4, h);

  const capH = 8;
  const capY = capAtBottom ? bottom - capH : top;
  const edge = capAtBottom ? capY : capY + capH;
  for (let k = 1; k < 12; k += 1) {
    const sy = capAtBottom ? edge - k * 13 : edge + k * 13 - 1;
    if (sy < top || sy > bottom - 1) continue;
    ctx.fillStyle = '#666b79';
    ctx.fillRect(bx, sy, bw, 1);
    ctx.fillStyle = '#b4bac6';
    ctx.fillRect(bx, sy + 1, bw - 4, 1);
    if (k % 2 === 1) {
      ctx.fillStyle = PAL.m;
      ctx.fillRect(bx + 5 + (k % 3) * 2, sy + 2, 3, 1);
      ctx.fillRect(bx + 6 + (k % 3) * 2, sy + 3, 1, 1);
    }
  }

  ctx.fillStyle = PAL.o;
  ctx.fillRect(x - 1, capY - 1, PILLAR_W + 2, capH + 2);
  ctx.fillStyle = PAL.r;
  ctx.fillRect(x, capY, PILLAR_W, capH);
  ctx.fillStyle = '#ff7a5a';
  ctx.fillRect(x + 1, capY + 1, 4, 1);
  ctx.fillStyle = PAL.y;
  ctx.fillRect(x, capY + 3, PILLAR_W, 1);
  ctx.fillStyle = PAL.R;
  ctx.fillRect(x, capY + capH - 2, PILLAR_W, 2);
}

export function drawScene(ctx: CanvasRenderingContext2D, S: Sprites, run: Flap, clock: number, dust: readonly Dust[], started: boolean): void {
  const w = run.w;

  const dist = started ? run.dist : clock * 14;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sky(w), 0, 0);

  for (let i = 0; i < 26; i += 1) {
    const x = Math.floor(noise(i + 1) * w);
    const y = Math.floor(noise(i + 40) * 48);
    if (Math.sin(clock * 2.4 + i * 1.7) > -0.2) {
      ctx.fillStyle = i % 5 === 0 ? '#fff3b8' : '#b9b4e8';
      ctx.fillRect(x, y, 1, 1);
      if (i % 7 === 0) {
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
    }
  }

  ctx.fillStyle = '#fff4d0';
  const mx = w - 38;
  for (let y = -7; y <= 7; y += 1) {
    const half = Math.round(Math.sqrt(49 - y * y));
    ctx.fillRect(mx - half, 22 + y, half * 2 + 1, 1);
  }
  ctx.fillStyle = '#ecdcb0';
  for (const [x, y] of [[-3, -3], [-2, -3], [2, 1], [3, 1], [3, 2], [-1, 3]]) ctx.fillRect(mx + x, 22 + y, 1, 1);

  const far = [[10, 18, 0], [70, 30, 1], [130, 14, 2], [190, 34, 0]];
  const farPeriod = Math.max(w + 60, 260);
  for (const [cx, cy, k] of far) {
    const x = wrapX(cx - dist * 0.08, farPeriod) - 40;
    ctx.drawImage(S.clouds[k], Math.round(x), cy);
  }

  const sw = S.shrine.width;
  for (let x = -wrapX(dist * 0.2, sw); x < w; x += sw) ctx.drawImage(S.shrine, Math.round(x), GROUND_Y - S.shrine.height + 6);

  ctx.globalAlpha = 0.5;
  const spacing = 112;
  for (let x = -wrapX(dist * 0.4, spacing) + 30; x < w + spacing; x += spacing) {
    const px = Math.round(x);
    ctx.fillStyle = '#3a2418';
    ctx.fillRect(px, GROUND_Y - 38, 2, 38);
    ctx.fillRect(px - 4, GROUND_Y - 38, 10, 2);
    ctx.fillStyle = Math.sin(clock * 5 + px) > 0 ? '#f4a23a' : '#e88a2c';
    ctx.fillRect(px - 3, GROUND_Y - 35, 8, 11);
    ctx.fillStyle = '#ffd88a';
    ctx.fillRect(px - 1, GROUND_Y - 33, 4, 7);
    ctx.fillStyle = '#d6402f';
    ctx.fillRect(px - 3, GROUND_Y - 36, 8, 1);
    ctx.fillRect(px - 3, GROUND_Y - 24, 8, 1);
  }
  ctx.globalAlpha = 1;

  sea(ctx, w, dist * 0.3, GROUND_Y - 1, 2, '#5a4a92', '#7a68b0', 0.4);
  for (const p of run.pillars) {
    const px = Math.round(p.x);
    if (px > w + 2 || px + PILLAR_W < -2) continue;
    drawPillar(ctx, px, -2, Math.round(p.gapY - p.gapH / 2), true);
    drawPillar(ctx, px, Math.round(p.gapY + p.gapH / 2), WORLD_H, false);
  }
  sea(ctx, w, dist * 0.6, GROUND_Y + 4, 2.4, '#8b7cc4', '#a99ce0', 2.1);

  for (const b of run.bells) {
    if (b.taken) continue;
    const f = Math.floor(clock * 9 + b.x * 0.05) % BELL_FRAMES;
    const bob = Math.round(Math.sin(clock * 4 + b.x * 0.1));
    ctx.drawImage(S.bell[f], Math.round(b.x - 5), Math.round(b.y - 5 + bob));
  }

  let sprite: HTMLCanvasElement;
  let y = run.y;
  if (!started) {
    sprite = S.cat.idle[Math.floor(clock * 1.6) % CAT_FRAMES.idle];
    y += Math.round(Math.sin(clock * 2.2) * 2);
  } else if (!run.alive) sprite = S.cat.dead[0];
  else if (run.flapT < 0.24) sprite = S.cat.flap[Math.min(3, Math.floor(run.flapT / 0.06))];
  else if (run.vy > 110) sprite = S.cat.fall[0];
  else sprite = S.cat.glide[Math.floor(clock * 6) % CAT_FRAMES.glide];
  ctx.drawImage(sprite, PLAYER_X - 16, Math.round(y) - CAT_CY);

  sea(ctx, w, dist * 1.0, GROUND_Y + 10, 1.8, '#d9d0f5', '#fffaf0', 4.2);

  for (const d of dust) {
    const a = 1 - d.life / d.max;
    ctx.fillStyle = `rgba(255, 244, 220, ${(a * 0.85).toFixed(2)})`;
    const s = a > 0.5 ? 2 : 1;
    ctx.fillRect(Math.round(d.x), Math.round(d.y), s, s);
  }
}
