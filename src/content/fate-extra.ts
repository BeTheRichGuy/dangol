import { FATE_EXTRA_EN } from './en/fate-extra';
import { FATE_EXTRA_JA } from './ja/fate-extra';
import { FATE_EXTRA_KO } from './ko/fate-extra';
import { localized } from './locale';

export const FATE_X = localized({ en: FATE_EXTRA_EN, ko: FATE_EXTRA_KO, ja: FATE_EXTRA_JA });
export type { FateExtra } from './ko/fate-extra';
