import { CONTINUE_EN, FREE_RESULT_EN, GAP_EN, LIFE_OFFER_EN, OTHER_KEEPERS_EN, STICKY_EN } from './en/continue';
import type { ContinueCopy, FreeResultCopy, GapLibrary, OfferAnswer, OtherKeepersCopy, StickyCopy } from './continue-copy';
import { CONTINUE_JA, FREE_RESULT_JA, GAP_JA, LIFE_OFFER_JA, OTHER_KEEPERS_JA, STICKY_JA } from './ja/continue';
import { CONTINUE_KO, LIFE_OFFER_KO } from './ko/continue';
import { FATE_KO } from './ko/fate-map';
import { PEOPLE_COPY_KO } from './ko/people';
import { OTHER_KEEPERS_KO } from './ko/room-pitch';
import { TEASER_COPY_KO } from './ko/teasers';
import { localized, type Locale } from './locale';

export type { ContinueCopy, FreeResultCopy, GapLibrary, OfferAnswer, OtherKeepersCopy, StickyCopy };

export const CONTINUE = localized<ContinueCopy>({ en: CONTINUE_EN, ko: CONTINUE_KO, ja: CONTINUE_JA });

export const OTHER_KEEPERS = localized<OtherKeepersCopy>({ en: OTHER_KEEPERS_EN, ko: OTHER_KEEPERS_KO, ja: OTHER_KEEPERS_JA });

export const STICKY = localized<StickyCopy>({ en: STICKY_EN, ko: FATE_KO.sticky, ja: STICKY_JA });

export const FREE_RESULT = localized<FreeResultCopy>({
  en: FREE_RESULT_EN,
  ko: { ...TEASER_COPY_KO, questionLine: PEOPLE_COPY_KO.questionLine },
  ja: FREE_RESULT_JA,
});

export function lifeOfferLine(locale: Locale, index: number, title: string): OfferAnswer | null {
  if (locale === 'ko') return LIFE_OFFER_KO[title] ?? null;
  return (locale === 'ja' ? LIFE_OFFER_JA : LIFE_OFFER_EN)[index] ?? null;
}

export function gapLibraryFor(locale: Locale): GapLibrary | null {
  return locale === 'ja' ? GAP_JA : locale === 'en' ? GAP_EN : null;
}
