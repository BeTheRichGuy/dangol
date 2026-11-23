import { godGroup, isClash, isSixHarmony, isWonjin, pillarFromGanzhi } from '@/lib/saju/tables';
import type { Chart, GodGroup, SeasonWindow } from '@/lib/saju/types';
import type { SaltLevel } from './types';
import {
  monthClashReason,
  monthHarmonyReason,
  monthStemReason,
  monthWonjinReason,
  sharpOutputReason,
  sharpPolarityReason,
  yearClashReason,
} from './phrases';

export interface SaltScore {
  monthGod: GodGroup;
  score: number;
  level: SaltLevel;
  reasons: string[];
}

export function monthGodOf(chart: Chart, season: SeasonWindow): GodGroup {
  return godGroup(chart.pillars.day.stemElement, pillarFromGanzhi(season.monthGanzhi).stemElement);
}

export function levelOf(score: number): SaltLevel {
  if (score <= 0) return 'pinch';
  if (score < 2) return 'spoonful';
  return 'handful';
}

export function scoreSalt(chart: Chart, season: SeasonWindow): SaltScore {
  const day = chart.pillars.day;
  const month = pillarFromGanzhi(season.monthGanzhi);
  const year = pillarFromGanzhi(season.yearGanzhi);

  const monthGod = monthGodOf(chart, season);
  const samePolarity = month.stemPolarity === day.stemPolarity;
  const reasons: string[] = [monthStemReason(month.stem, day.stem, monthGod)];
  let score = 0;

  if (isClash(month.branch, day.branch)) {
    score += 2;
    reasons.push(monthClashReason(month.branch, day.branch));
  }
  if (isWonjin(month.branch, day.branch)) {
    score += 2;
    reasons.push(monthWonjinReason(month.branch, day.branch));
  }
  if (monthGod === 'power') {
    score += 1;
    if (samePolarity) {
      score += 0.5;
      reasons.push(sharpPolarityReason());
    }
  }
  if (monthGod === 'output' && !samePolarity) {
    score += 1;
    reasons.push(sharpOutputReason());
  }
  if (isClash(year.branch, day.branch)) {
    score += 1;
    reasons.push(yearClashReason(year.branch, day.branch));
  }
  if (isSixHarmony(month.branch, day.branch)) {
    score -= 1;
    reasons.push(monthHarmonyReason(month.branch, day.branch));
  }
  if (monthGod === 'resource') {
    score -= 0.5;
  }

  return { monthGod, score, level: levelOf(score), reasons };
}
