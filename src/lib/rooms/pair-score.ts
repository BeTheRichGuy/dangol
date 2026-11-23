import type { CrossBlock } from './payload';

export const SCORE_MIN = 50;
export const SCORE_MAX = 98;
const BASE = 74;

const SOFT = 30;

const FLOW: Record<CrossBlock['dayStems']['flow'], number> = {
  same: 3,
  'self-feeds-other': 5,
  'other-feeds-self': 5,
  'self-checks-other': -2,
  'other-checks-self': -2,
};

const KIND: Record<string, number> = {
  天干合: 6,
  天干沖: -4,
  六合: 6,
  三合: 5,
  半合: 3,
  方合: 3,
  沖: -6,
  刑: -4,
  自刑: -1,
  破: -2,
  害: -3,
  怨嗔: -3,
  鬼門: -3,
};

const POSITION: Record<string, number> = { day: 2, month: 1.5, hour: 1, year: 0.75 };

function weight(at: string[]): number {

  return Math.max(...at.map((a) => POSITION[a.split('.')[1] ?? ''] ?? 1));
}

function rawScore(cross: Omit<CrossBlock, 'score'>): number {
  let s = BASE;
  s += FLOW[cross.dayStems.flow];
  if (cross.dayStems.combine) s += 10;
  if (cross.dayStems.clash) s -= 7;
  for (const r of cross.relations) s += (KIND[r.kind] ?? 0) * weight(r.at);

  const filled = cross.fills.selfMissingOtherHas.length + cross.fills.otherMissingSelfHas.length;
  s += Math.min(9, filled * 3);
  return s;
}

export function pairScore(cross: Omit<CrossBlock, 'score'>, reversed?: Omit<CrossBlock, 'score'>): number {
  const s = reversed ? (rawScore(cross) + rawScore(reversed)) / 2 : rawScore(cross);
  const room = SCORE_MAX - BASE;
  return Math.round(BASE + room * Math.tanh((s - BASE) / SOFT));
}
