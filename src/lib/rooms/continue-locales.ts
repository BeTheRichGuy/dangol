import type { Locale } from '@/content/locale';

export const CONTINUE_LOCALES: readonly Locale[] = ['ko', 'en', 'ja'];

export const FATE_LOCALES: readonly Locale[] = ['ko', 'en', 'ja'];

export function hasFateMap(locale: Locale): boolean {
  return FATE_LOCALES.includes(locale);
}

export function isContinueLocale(locale: Locale): boolean {
  return CONTINUE_LOCALES.includes(locale);
}
