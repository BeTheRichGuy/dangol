import { REACTION_MOUTH_OPENS_MS } from './manifest';

export type BeatStage = 'gap' | 'dots' | 'typing' | 'done';

export interface ReactionClipInput {

  hasReaction: boolean;

  skipped: boolean;

  beat: number;
  stage: BeatStage;

  dotsMs: number;
}

export interface ReactionClipState {

  on: boolean;

  delayMs: number;

  release: boolean;
}

export function reactionClip(i: ReactionClipInput): ReactionClipState {

  const on = i.hasReaction && !i.skipped && (i.beat > 0 || i.stage === 'dots' || i.stage === 'typing' || i.stage === 'done');

  const release = on && (i.beat > 0 || i.stage === 'done');
  const delayMs = Math.max(0, Math.round(i.dotsMs - REACTION_MOUTH_OPENS_MS));
  return { on, delayMs, release };
}
