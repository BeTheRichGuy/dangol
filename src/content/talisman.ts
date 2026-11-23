import { TALISMAN_EN } from './en/talisman';
import { TALISMAN_JA } from './ja/talisman';
import { TALISMAN_KO } from './ko/talisman';
import { localized } from './locale';

export const TALISMAN = localized({ en: TALISMAN_EN, ko: TALISMAN_KO, ja: TALISMAN_JA });
export type { TalismanCopy } from './en/talisman';
