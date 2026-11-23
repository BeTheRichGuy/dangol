import type { Locale } from '@/content/locale';

export type Currency = 'KRW' | 'JPY' | 'USD';

export const PRICES: Record<Locale, { amount: number; currency: Currency }> = {
  ko: { amount: 4900, currency: 'KRW' },
  ja: { amount: 890, currency: 'JPY' },
  en: { amount: 629, currency: 'USD' },
};

export function percentOff(list: number, now: number): number {
  return list > 0 && now > 0 && now < list ? Math.floor(((list - now) * 100) / list) : 0;
}
