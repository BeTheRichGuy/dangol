import { UI as EN } from './en/ui';
import { TYPE_PROFILES as TYPES_EN } from './en/types';
import { UI_JA } from './ja/ui';
import { TYPES_JA } from './ja/types';
import { UI_KO } from './ko/ui';
import { TYPES_KO } from './ko/types';
import { isLocale, overlay, type Locale } from './locale';

export const OG_IMAGE = '/api/card?og=1&v=2';

export const LANG_ALTERNATES = { en: '/', ko: '/ko', ja: '/ja', 'x-default': '/' } as const;

const META = { en: EN.meta, ko: overlay(EN.meta, UI_KO.meta), ja: overlay(EN.meta, UI_JA.meta) } as const;
const TYPES = { en: TYPES_EN, ko: overlay(TYPES_EN, TYPES_KO), ja: overlay(TYPES_EN, TYPES_JA) } as const;

export function metaLocale(raw: unknown): Locale {
  return isLocale(raw) ? raw : 'en';
}

export function metaFor(locale: Locale) {
  return META[locale];
}

export function typesFor(locale: Locale) {
  return TYPES[locale];
}
