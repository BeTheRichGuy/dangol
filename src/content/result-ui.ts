import { RESULT_UI as EN } from './en/result-ui';
import { RESULT_UI_JA } from './ja/result-ui';
import { RESULT_UI_KO } from './ko/result-ui';
import { localized, overlay } from './locale';

export const RESULT_UI = localized({ en: EN, ko: overlay(EN, RESULT_UI_KO), ja: overlay(EN, RESULT_UI_JA) });
export type { ChapterWhen } from './en/result-ui';
