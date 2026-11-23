export const MAX_TOKENS_PER_PLAY = 3;

export const SCORE_CUTS = [18, 45, 80] as const;

export const CHAT_COST = 1;

export const CHECKIN_REWARD = 1;

export const WALLET_MAX = 99;

export function tokensForScore(score: number): number {
  let n = 0;
  for (const cut of SCORE_CUTS) if (score >= cut) n += 1;
  return Math.min(n, MAX_TOKENS_PER_PLAY);
}

export interface Gauge {

  tokens: number;

  fill: number;

  full: boolean;
}

export function gaugeOf(score: number): Gauge {
  const tokens = tokensForScore(score);
  if (tokens >= MAX_TOKENS_PER_PLAY) return { tokens, fill: 1, full: true };
  const from = tokens === 0 ? 0 : SCORE_CUTS[tokens - 1];
  const to = SCORE_CUTS[tokens];
  return { tokens, fill: Math.max(0, Math.min(1, (score - from) / (to - from))), full: false };
}

export function cleanBalance(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : 0;
  return Math.max(0, Math.min(WALLET_MAX, n));
}
