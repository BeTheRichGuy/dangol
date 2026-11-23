import type { Locale } from '@/content/locale';
import { PRODUCT_KEYS, type ProductKey } from '../rooms/themes';
import { percentOff, PRICES, type Currency } from './prices';

export function firstPriceOn(env: { DANGOL_FIRST_PRICE?: string }): boolean {
  return env.DANGOL_FIRST_PRICE === 'on';
}

export const PICK_ROOM = 'pick' as const;

export const PICK_COUNT = 3;

export interface OfferPrice {
  amount: number;
  currency: Currency;
}

export const FIRST_PRICES: Record<Locale, OfferPrice> = {
  ko: { amount: 2490, currency: 'KRW' },
  ja: { amount: 280, currency: 'JPY' },
  en: { amount: 199, currency: 'USD' },
};

export const PICK_PRICES: Record<Locale, OfferPrice> = {
  ko: { amount: 7000, currency: 'KRW' },
  ja: { amount: 780, currency: 'JPY' },
  en: { amount: 560, currency: 'USD' },
};

export function pickListAmount(locale: Locale): number {
  return PRICES[locale].amount * PICK_COUNT;
}

export function firstPercentOff(locale: Locale): number {
  return percentOff(PRICES[locale].amount, FIRST_PRICES[locale].amount);
}

export function pickPercentOff(locale: Locale): number {
  return percentOff(pickListAmount(locale), PICK_PRICES[locale].amount);
}

export function parsePicks(v: unknown): ProductKey[] | null {
  if (!Array.isArray(v) || v.length !== PICK_COUNT) return null;
  const set = new Set<unknown>(v);
  if (set.size !== PICK_COUNT) return null;
  const sorted = PRODUCT_KEYS.filter((k) => set.has(k));
  return sorted.length === PICK_COUNT ? [...sorted] : null;
}

export interface Holdings {
  rooms: readonly string[];
}

export interface Offers {

  first: boolean;
}

export const NO_OFFERS: Offers = { first: false };

export const FIRST_ONLY: Offers = { first: true };

export function offersFor(h: Holdings | null): Offers {
  if (!h) return FIRST_ONLY;
  return { first: h.rooms.length === 0 };
}
