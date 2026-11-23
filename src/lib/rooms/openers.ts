import { OPENERS_EN, type RoomOpeners } from '@/content/en/openers';
import { OPENERS_JA } from '@/content/ja/openers';
import { OPENERS_KO } from '@/content/ko/openers';
import type { Locale } from '@/content/locale';
import type { ChapterRoom } from './themes';

export const OPENERS: Record<Locale, Record<ChapterRoom, RoomOpeners>> = { en: OPENERS_EN, ko: OPENERS_KO, ja: OPENERS_JA };

export interface FixedLines {
  first: string;

  third: string | null;
}

export function fixedLines(room: ChapterRoom, locale: Locale, index: number): FixedLines {
  const o = OPENERS[locale][room];
  return { first: o.lines[index] ?? '', third: index === 0 ? o.third : null };
}

const PHRASE_MAX: Record<Locale, number> = { ko: 24, ja: 24, en: 40 };

export function introSecond(room: ChapterRoom, locale: Locale, hasConcern: boolean, modelText: string | null): string | null {
  const o = OPENERS[locale][room];
  if (!hasConcern) return o.second;
  if (modelText === null) return null;
  const text = modelText.trim();
  const [head, tail] = o.secondConcern.split('{concern}');
  if (!text.startsWith(head) || !text.endsWith(tail) || text.length < head.length + tail.length + 1) return o.second;
  let phrase = text.slice(head.length, text.length - tail.length).trim();

  if (locale === 'ko') phrase = phrase.replace(/s*(고민|걱정)$/, '').trim();
  if (phrase.length < 1 || phrase.length > PHRASE_MAX[locale]) return o.second;
  return head + phrase + tail;
}
