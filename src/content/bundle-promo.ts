import { BUNDLE_PROMO as EN } from './en/bundle-promo';
import { BUNDLE_PROMO_JA } from './ja/bundle-promo';
import { BUNDLE_PROMO_KO } from './ko/bundle-promo';
import { localized, overlay } from './locale';

export const BUNDLE_PROMO = localized({ en: EN, ko: overlay(EN, BUNDLE_PROMO_KO), ja: overlay(EN, BUNDLE_PROMO_JA) });
export type { BundlePromoCopy } from './en/bundle-promo';
