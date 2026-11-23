import { TRAITS as EN } from './en/traits';
import { TRAITS_JA, TRAIT_TEXTS_JA } from './ja/traits';
import { TRAITS_KO, TRAIT_TEXTS_KO } from './ko/traits';
import { localized, overlay } from './locale';
import { retext } from './translate';

export const TRAITS = localized({
  en: EN,
  ko: overlay(retext(EN, TRAIT_TEXTS_KO), TRAITS_KO),
  ja: overlay(retext(EN, TRAIT_TEXTS_JA), TRAITS_JA),
});
