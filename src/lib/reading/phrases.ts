import type { GodGroup } from '@/lib/saju/types';
import { ENGINE_COPY } from '@/content/engine';

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in vars ? vars[key] : whole));
}

export const NOT_CURSE = ENGINE_COPY.notCurse;

export function monthStemReason(monthStem: string, dayStem: string, god: GodGroup): string {
  return fill(ENGINE_COPY.monthStem, {
    monthStem,
    dayStem,
    label: ENGINE_COPY.godLabel[god],
    gloss: ENGINE_COPY.godGloss[god],
  });
}

export function sharpPolarityReason(): string {
  return ENGINE_COPY.sharpPolarity;
}

export function sharpOutputReason(): string {
  return ENGINE_COPY.sharpOutput;
}

export function monthClashReason(monthBranch: string, dayBranch: string): string {
  return fill(ENGINE_COPY.monthClash, { monthBranch, dayBranch });
}

export function monthWonjinReason(monthBranch: string, dayBranch: string): string {
  return fill(ENGINE_COPY.monthWonjin, { monthBranch, dayBranch });
}

export function monthHarmonyReason(monthBranch: string, dayBranch: string): string {
  return fill(ENGINE_COPY.monthHarmony, { monthBranch, dayBranch });
}

export function yearClashReason(yearBranch: string, dayBranch: string): string {
  return fill(ENGINE_COPY.yearClash, { yearBranch, dayBranch });
}

function withArticle(name: string): string {
  const local = termName(name);
  if (local !== name) return local;
  return ENGINE_COPY.articleTermStarts.some((start) => name.startsWith(start)) ? `the ${name}` : name;
}

function termName(name: string): string {
  return ENGINE_COPY.termNames[name] ?? name;
}

export function notCursePhrase(): string {
  return ENGINE_COPY.notCurse;
}

export function nextTermPhrase(nextName: string, endIso: string, locale = 'en-US'): string {
  const end = new Date(endIso);
  if (Number.isNaN(end.getTime())) return withArticle(nextName);
  const day = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(end);
  return fill(ENGINE_COPY.nextTerm, { term: withArticle(nextName), day });
}

export function whenPhrase(
  name: string,
  nextName: string,
  endIso: string,
  locale: string,
): string {
  const end = new Date(endIso);
  const day = end.getUTCDate();
  const part = ENGINE_COPY.parts[day <= 10 ? 'early' : day <= 20 ? 'mid' : 'late'];
  const month = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(end);
  return fill(ENGINE_COPY.when, { part, month, name: termName(name), next: withArticle(nextName) });
}
