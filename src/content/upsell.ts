import { UPSELL as EN } from './en/upsell';
import { UPSELL_JA } from './ja/upsell';
import { UPSELL_KO } from './ko/upsell';
import { localized, overlay } from './locale';

export const UPSELL = localized({ en: EN, ko: overlay(EN, UPSELL_KO), ja: overlay(EN, UPSELL_JA) });
