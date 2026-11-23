import type { Locale } from '@/content/locale';
import type { Currency } from '@/lib/payments/prices';

export const REUNION_PRICES: Record<Locale, { amount: number; currency: Currency }> = {
  ko: { amount: 4900, currency: 'KRW' },
  ja: { amount: 890, currency: 'JPY' },
  en: { amount: 629, currency: 'USD' },
};

export const REUNION_PRICE_TEXT: Record<Locale, string> = {
  ko: '4,900원',
  ja: '890円',
  en: '$6.29',
};

export const REUNION_GUIDE_NAME: Record<Locale, { name: string; hanja: string }> = {
  ko: { name: '여운', hanja: '韻' },
  ja: { name: 'ヨウン', hanja: '韻' },
  en: { name: 'Yeoun', hanja: '韻' },
};
