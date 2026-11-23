import type { CardLocale } from './params';

export function breakJa(text: string): string {
  const comma = text.indexOf('、');
  if (comma > 0 && comma < text.length - 1) return `${text.slice(0, comma + 1)}\n${text.slice(comma + 1)}`;
  const mid = text.length / 2;
  let best = -1;
  for (let i = 1; i < text.length - 1; i += 1) if (text[i] === 'て' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best > 0 ? `${text.slice(0, best + 1)}\n${text.slice(best + 1)}` : text;
}

export function monthToneSize(locale: CardLocale, text: string): number {
  const longest = Math.max(...text.split('\n').map((line) => [...line].length));
  if (locale === 'ja') return Math.max(38, Math.min(50, Math.floor(840 / longest)));
  if (locale === 'en') return longest > 70 ? 44 : longest > 60 ? 47 : 50;
  return longest > 34 ? 44 : 50;
}

export function monthSentence(locale: CardLocale, tone: string): string {
  if (locale === 'ja') return `${breakJa(tone)}。`;
  const text = locale === 'en' ? tone.charAt(0).toUpperCase() + tone.slice(1) : tone;
  return `${text}.`;
}
