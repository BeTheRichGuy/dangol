import { FATE_EN } from './en/fate-map';
import { FATE_JA } from './ja/fate-map';
import { FATE_KO } from './ko/fate-map';
import { localized } from './locale';

export const FATE = localized({ en: FATE_EN, ko: FATE_KO, ja: FATE_JA });
export type { FateCopy } from './ko/fate-map';
