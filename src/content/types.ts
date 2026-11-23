import { TYPE_PROFILES as EN } from './en/types';
import { TYPES_JA } from './ja/types';
import { TYPES_KO } from './ko/types';
import { localized, overlay } from './locale';

export const TYPE_PROFILES = localized({ en: EN, ko: overlay(EN, TYPES_KO), ja: overlay(EN, TYPES_JA) });
