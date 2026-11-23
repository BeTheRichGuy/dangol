import type { Locale } from '@/content/locale';
import { percentOff } from '../payments/prices';

export const XMAS_ROOM = 'xmas' as const;

export const XMAS_OFFER_MS = 4 * 60 * 60 * 1000;

export const XMAS_DEAL: Record<Locale, { amount: number; text: string }> = {
  ko: { amount: 4900, text: '4,900원' },
  en: { amount: 999, text: '$9.99' },
  ja: { amount: 1500, text: '1,500円' },
};

export const XMAS_LIST: Record<Locale, { amount: number; text: string }> = {
  ko: { amount: 26000, text: '26,000원' },
  en: { amount: 1999, text: '$19.99' },
  ja: { amount: 2900, text: '2,900円' },
};

export const XMAS_RIVAL: Partial<Record<Locale, { amount: number; text: string }>> = {
  ko: { amount: 29700, text: '29,700원' },
};

export function xmasFraction(locale: Locale): number | null {
  const rival = XMAS_RIVAL[locale];
  if (!rival) return null;
  const n = Math.floor(rival.amount / XMAS_DEAL[locale].amount);
  return n >= 3 ? n : null;
}

export function xmasOff(locale: Locale): number {
  return percentOff(XMAS_LIST[locale].amount, XMAS_DEAL[locale].amount);
}
