import { describe, expect, it } from 'vitest';
import {
  FLAP_V,
  GAP_MIN,
  GRAVITY,
  GROUND_Y,
  HIT_HALF_H,
  MAX_SHIFT,
  PILLAR_W,
  PLAYER_X,
  RISE,
  WORLD_H,
  createFlap,
  gapAt,
  step,
  type Flap,
  type FlapEvent,
} from '@/lib/chat/flap';
import { MAX_TOKENS_PER_PLAY, SCORE_CUTS, WALLET_MAX, cleanBalance, gaugeOf, tokensForScore } from '@/lib/chat/tokens';

const DT = 1 / 60;
const WIDTH = 228;

function emptyFlap(): Flap {
  const r = createFlap(1, WIDTH);
  r.nextX = 1e9;
  return r;
}

function advance(run: Flap, seconds: number, flapAt: number[] = []): FlapEvent[] {
  const events: FlapEvent[] = [];
  const taps = new Set(flapAt.map((s) => Math.round(s / DT)));
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i += 1) events.push(...step(run, DT, taps.has(i)));
  return events;
}

function botFlaps(run: Flap): boolean {
  const next = run.pillars.find((p) => p.x + PILLAR_W > PLAYER_X - 9);
  const target = next ? next.gapY + RISE / 2 : GROUND_Y / 2;
  return run.y > target;
}

function botRun(seed: number, seconds: number): { run: Flap; at: Record<number, number> } {
  const run = createFlap(seed, WIDTH);
  const at: Record<number, number> = {};
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n && run.alive; i += 1) {
    step(run, DT, botFlaps(run));
    for (const cut of SCORE_CUTS) if (run.score >= cut && at[cut] === undefined) at[cut] = run.t;
  }
  return { run, at };
}

describe('날기: 움직임', () => {
  it('같은 시드면 같은 기둥이 나온다', () => {
    const a = createFlap(7, WIDTH);
    const b = createFlap(7, WIDTH);
    advance(a, 10, [0.1]);
    advance(b, 10, [0.1]);
    expect(a.pillars).toEqual(b.pillars);
    expect(a.bells).toEqual(b.bells);
    expect(createFlap(8, WIDTH).rng).not.toBe(a.rng);
  });

  it('한 번 터치하면 상수대로 떠올랐다가 다시 내려온다', () => {
    const r = emptyFlap();
    const y0 = r.y;
    const ev = [...step(r, DT, true)];
    let apex = r.y;
    for (let i = 0; i < 120; i += 1) {
      ev.push(...step(r, DT, false));
      apex = Math.min(apex, r.y);
    }
    expect(y0 - apex).toBeGreaterThan(RISE - 3);
    expect(y0 - apex).toBeLessThan(RISE + 1);
    expect(ev.filter((e) => e === 'flap')).toHaveLength(1);
    expect(FLAP_V).toBeLessThan(0);
    expect(GRAVITY).toBeGreaterThan(0);
  });

  it('아무것도 안 하면 곧 구름바다에 닿고, 이미 시작할 때 가운데에서 출발한다', () => {
    const r = createFlap(1, WIDTH);
    expect(r.y).toBe(GROUND_Y / 2);
    const ev = advance(r, 2);
    expect(ev).toContain('fall');
    expect(r.alive).toBe(false);
    expect(r.cause).toBe('fall');
  });

  it('하늘 끝에서는 더 올라가지 않고, 그래도 죽지 않는다', () => {
    const r = emptyFlap();
    advance(r, 3, Array.from({ length: 60 }, (_, i) => i * 0.05));
    expect(r.alive).toBe(true);
    expect(r.y).toBeGreaterThanOrEqual(HIT_HALF_H);
  });
});

describe('날기: 끝나는 경우와 점수', () => {
  it('기둥에 부딪히면 끝난다', () => {
    const r = emptyFlap();
    r.pillars.push({ x: PLAYER_X - 4, gapY: 20, gapH: 30 });
    const ev = step(r, DT, false);
    expect(ev).toContain('hit');
    expect(r.alive).toBe(false);
    expect(r.cause).toBe('hit');
  });

  it('틈 한가운데로 지나가면 기둥 옆을 그대로 지난다', () => {
    const r = emptyFlap();
    r.y = 50;
    r.pillars.push({ x: PLAYER_X - 4, gapY: 50, gapH: 44 });

    advance(r, 0.05);
    expect(r.alive).toBe(true);
  });

  it('방울을 먹으면 점수가 오르고, 같은 방울로 두 번 오르지 않는다', () => {
    const r = emptyFlap();
    r.bells.push({ x: PLAYER_X, y: r.y, taken: false });
    const ev = step(r, DT, false);
    expect(ev).toContain('bell');
    expect(r.score).toBe(1);
    step(r, DT, false);
    expect(r.bells).toHaveLength(0);
    expect(r.score).toBe(1);
  });

  it('끝난 뒤에는 점수가 그대로이고 소금은 구름바다 위에서 멈춘다', () => {
    const r = emptyFlap();
    r.pillars.push({ x: PLAYER_X, gapY: 20, gapH: 30 });
    step(r, DT, false);
    const score = r.score;
    advance(r, 1.5, [0.1]);
    expect(r.score).toBe(score);
    expect(r.deadT).toBeGreaterThan(1);
    expect(r.y).toBeLessThanOrEqual(GROUND_Y);
    expect(r.y).toBeLessThan(WORLD_H);
  });
});

describe('날기: 기둥이 공정하다', () => {
  it('틈은 늘 화면 안에 있고, 이웃한 틈은 닿을 만큼만 벌어지고, 점점 좁아지되 하한이 있다', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const r = createFlap(seed, WIDTH);
      let prev: number | undefined;
      const seen = new Set<number>();
      for (let i = 0; i < 60 * 120; i += 1) {
        step(r, DT, botFlaps(r));
        for (const p of r.pillars) {
          const key = Math.round(p.x + r.dist);
          if (seen.has(key)) continue;
          seen.add(key);
          expect(p.gapY - p.gapH / 2).toBeGreaterThan(0);
          expect(p.gapY + p.gapH / 2).toBeLessThan(GROUND_Y);
          expect(p.gapH).toBeGreaterThanOrEqual(GAP_MIN);
          if (prev !== undefined) expect(Math.abs(p.gapY - prev)).toBeLessThanOrEqual(MAX_SHIFT + 1e-6);
          prev = p.gapY;
        }
        if (!r.alive) break;
      }
    }
    expect(gapAt(1000)).toBe(GAP_MIN);
    expect(gapAt(0)).toBeGreaterThan(GAP_MIN);
  });

  it('단순한 봇은 40개의 길을 90초씩 날아도 한 번도 죽지 않는다', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const { run } = botRun(seed, 90);
      expect(run.alive, `seed ${seed} 에서 ${run.t.toFixed(1)}초에 ${run.cause}`).toBe(true);
    }
  });

  it('봇은 첫 등불을 10초쯤, 셋째 등불을 40초쯤에 켠다(사람은 그 두 배쯤)', () => {
    const firsts: number[] = [];
    const thirds: number[] = [];
    for (let seed = 1; seed <= 20; seed += 1) {
      const { at } = botRun(seed, 120);
      firsts.push(at[SCORE_CUTS[0]]);
      thirds.push(at[SCORE_CUTS[2]]);
    }
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(firsts.every((t) => t !== undefined)).toBe(true);
    expect(mean(firsts)).toBeGreaterThan(7);
    expect(mean(firsts)).toBeLessThan(15);
    expect(thirds.every((t) => t !== undefined)).toBe(true);
    expect(mean(thirds)).toBeGreaterThan(30);
    expect(mean(thirds)).toBeLessThan(55);
  });
});

describe('등불 컷', () => {
  it('컷은 오름차순이고 한 판에 3개를 넘지 않는다', () => {
    expect([...SCORE_CUTS]).toEqual([...SCORE_CUTS].sort((a, b) => a - b));
    expect(SCORE_CUTS).toHaveLength(MAX_TOKENS_PER_PLAY);
    expect(tokensForScore(1_000_000)).toBe(3);
    expect(tokensForScore(0)).toBe(0);
  });

  it('컷에서 정확히 등불이 늘어난다', () => {
    for (const [i, cut] of SCORE_CUTS.entries()) {
      expect(tokensForScore(cut - 1)).toBe(i);
      expect(tokensForScore(cut)).toBe(i + 1);
    }
  });

  it('게이지: 앞 컷에서 다음 컷까지 차오르고, 셋이 다 차면 full', () => {
    expect(gaugeOf(0)).toEqual({ tokens: 0, fill: 0, full: false });
    expect(gaugeOf(SCORE_CUTS[0] / 2)).toMatchObject({ tokens: 0, fill: 0.5 });
    expect(gaugeOf(SCORE_CUTS[0])).toMatchObject({ tokens: 1, fill: 0 });
    const mid = (SCORE_CUTS[1] + SCORE_CUTS[2]) / 2;
    expect(gaugeOf(mid)).toMatchObject({ tokens: 2, fill: 0.5 });
    expect(gaugeOf(SCORE_CUTS[2])).toEqual({ tokens: 3, fill: 1, full: true });
  });

  it('지갑 값은 0 이상 한도 이하의 정수로 고른다', () => {
    expect(cleanBalance(-3)).toBe(0);
    expect(cleanBalance(2.9)).toBe(2);
    expect(cleanBalance('7')).toBe(0);
    expect(cleanBalance(Number.NaN)).toBe(0);
    expect(cleanBalance(10_000)).toBe(WALLET_MAX);
  });
});
