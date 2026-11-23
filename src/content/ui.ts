import { UI as EN } from './en/ui';
import { UI_JA } from './ja/ui';
import { UI_KO } from './ko/ui';
import { localized, overlay } from './locale';

export const UI = localized({ en: EN, ko: overlay(EN, UI_KO), ja: overlay(EN, UI_JA) });
export type { UiCopy } from './en/ui';
