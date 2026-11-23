import { LIBRARY as EN } from './en/library';
import { CANDY_JA, SALT_JA } from './ja/library';
import { CANDY_KO, SALT_KO } from './ko/library';
import { localized } from './locale';
import { retext } from './translate';

export const LIBRARY = localized({
  en: EN,
  ko: retext(EN, { ...CANDY_KO, ...SALT_KO }),
  ja: retext(EN, { ...CANDY_JA, ...SALT_JA }),
});
