import type { Beat } from '@/components/story/types';
import type { XmasChapter, XmasPlay } from '@/content/ko/xmas-paid';
import type { XmasRelation, XmasTier } from './relation';

export interface XmasWho {
  relation: XmasRelation | null;
  tier: XmasTier;
}

export function openBeats(c: XmasChapter, w: XmasWho | null): Beat[] {
  const stage = w?.relation?.stage ?? c.stageDefault;
  return [...c.open, ...(c.tier ? c.tier[w?.tier ?? 'none'] : []), ...(c.stage && stage ? c.stage[stage] : [])];
}

export function afterBeats(c: XmasChapter, w: XmasWho | null): Beat[] {
  return [...(c.after ?? []), ...(c.goal && w?.relation ? c.goal[w.relation.goal] : [])];
}

export function closeBeats(c: XmasChapter, w: XmasWho | null): Beat[] {
  const stage = w?.relation?.stage;
  return (stage && c.closeByStage?.[stage]) || c.close || [];
}

export function lateAfterBeats(c: XmasChapter, w: XmasWho | null): Beat[] {
  const stage = w?.relation?.stage;
  return (stage && c.afterByStage?.[stage]) || c.after || [];
}

export function chapterPlay(c: XmasChapter, w: XmasWho | null): XmasPlay | undefined {
  const r = w?.relation;
  const pair = r ? c.playByPair?.[`${r.stage}.${r.goal}`] : undefined;
  if (pair) return pair;
  return c.playByStage ? c.playByStage[r?.stage ?? 'talking'] : c.play;
}
