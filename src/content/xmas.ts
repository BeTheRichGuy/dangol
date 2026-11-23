import type { Beat } from '@/components/story/types';
import type { XmasContact, XmasGoal, XmasStage } from '@/lib/xmas/relation';
import { XMAS_BANNER_EN } from './en/xmas-banner';
import { XMAS_EN, XMAS_ROW_EN } from './en/xmas';
import { XMAS_FLOW_EN } from './en/xmas-flow';
import { XMAS_ASK_EN, XMAS_DAYS_EN, XMAS_KEEP_EN, XMAS_MEET_EN, XMAS_PAID_EN, XMAS_PAIR_EN, XMAS_REVIEW_EN } from './en/xmas-paid';
import { XMAS_BANNER_JA } from './ja/xmas-banner';
import { XMAS_JA, XMAS_ROW_JA } from './ja/xmas';
import { XMAS_FLOW_JA } from './ja/xmas-flow';
import { XMAS_ASK_JA, XMAS_DAYS_JA, XMAS_KEEP_JA, XMAS_MEET_JA, XMAS_PAID_JA, XMAS_PAIR_JA, XMAS_REVIEW_JA } from './ja/xmas-paid';
import { XMAS_BANNER as XMAS_BANNER_KO } from './ko/xmas-banner';
import { XMAS as XMAS_KO, XMAS_ROW as XMAS_ROW_KO } from './ko/xmas';
import { XMAS_FLOW as XMAS_FLOW_KO } from './ko/xmas-flow';
import {
  XMAS_ASK as XMAS_ASK_KO,
  XMAS_DAYS as XMAS_DAYS_KO,
  XMAS_KEEP as XMAS_KEEP_KO,
  XMAS_MEET as XMAS_MEET_KO,
  XMAS_PAID as XMAS_PAID_KO,
  XMAS_PAIR as XMAS_PAIR_KO,
  XMAS_REVIEW as XMAS_REVIEW_KO,
  type XmasChapter,
  type XmasPlay,
} from './ko/xmas-paid';
import { localized, type Locale } from './locale';

export type Widen<T> = T extends Beat | XmasPlay | XmasChapter | XmasStage | XmasGoal | XmasContact
  ? T
  : T extends string
    ? string
    : T extends number
      ? number
      : T extends boolean
        ? boolean
        : T extends (...args: never[]) => unknown
          ? T
          : T extends (infer U)[]
            ? Widen<U>[]
            : T extends readonly (infer U)[]
              ? readonly Widen<U>[]
              : T extends object
                ? { readonly [K in keyof T]: Widen<T[K]> }
                : T;

export type XmasLandingCopy = Widen<typeof XMAS_KO>;
export type XmasRowCopy = Widen<typeof XMAS_ROW_KO>;
export type XmasFlowCopy = Widen<typeof XMAS_FLOW_KO>;
export type XmasPaidCopy = Widen<typeof XMAS_PAID_KO>;
export type XmasDaysCopy = Widen<typeof XMAS_DAYS_KO>;
export type XmasAskCopy = Widen<typeof XMAS_ASK_KO>;
export type XmasMeetCopy = typeof XMAS_MEET_KO;
export type XmasPairCopy = Widen<typeof XMAS_PAIR_KO>;
export type XmasReviewCopy = Widen<typeof XMAS_REVIEW_KO>;
export type XmasKeepCopy = Widen<typeof XMAS_KEEP_KO>;
export type XmasBannerCopy = Widen<typeof XMAS_BANNER_KO>;

export const XMAS_PAID_BY: Record<Locale, XmasPaidCopy> = { ko: XMAS_PAID_KO, en: XMAS_PAID_EN, ja: XMAS_PAID_JA };

export function xmasContents(locale: Locale): { title: string; line: string }[] {
  return XMAS_PAID_BY[locale].chapters.map((c) => ({ title: c.title, line: c.line }));
}

export const XMAS = localized<XmasLandingCopy>({ en: XMAS_EN, ko: XMAS_KO, ja: XMAS_JA });
export const XMAS_ROW = localized<XmasRowCopy>({ en: XMAS_ROW_EN, ko: XMAS_ROW_KO, ja: XMAS_ROW_JA });
export const XMAS_FLOW = localized<XmasFlowCopy>({ en: XMAS_FLOW_EN, ko: XMAS_FLOW_KO, ja: XMAS_FLOW_JA });
export const XMAS_PAID = localized<XmasPaidCopy>(XMAS_PAID_BY);
export const XMAS_DAYS = localized<XmasDaysCopy>({ en: XMAS_DAYS_EN, ko: XMAS_DAYS_KO, ja: XMAS_DAYS_JA });
export const XMAS_ASK = localized<XmasAskCopy>({ en: XMAS_ASK_EN, ko: XMAS_ASK_KO, ja: XMAS_ASK_JA });
export const XMAS_MEET = localized<XmasMeetCopy>({ en: XMAS_MEET_EN, ko: XMAS_MEET_KO, ja: XMAS_MEET_JA });
export const XMAS_PAIR = localized<XmasPairCopy>({ en: XMAS_PAIR_EN, ko: XMAS_PAIR_KO, ja: XMAS_PAIR_JA });
export const XMAS_REVIEW = localized<XmasReviewCopy>({ en: XMAS_REVIEW_EN, ko: XMAS_REVIEW_KO, ja: XMAS_REVIEW_JA });
export const XMAS_KEEP = localized<XmasKeepCopy>({ en: XMAS_KEEP_EN, ko: XMAS_KEEP_KO, ja: XMAS_KEEP_JA });
export const XMAS_BANNER = localized<XmasBannerCopy>({ en: XMAS_BANNER_EN, ko: XMAS_BANNER_KO, ja: XMAS_BANNER_JA });

export type { XmasChapter, XmasPlay } from './ko/xmas-paid';
