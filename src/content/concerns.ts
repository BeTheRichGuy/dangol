import { CONCERNS as EN } from './en/concerns';
import { CONCERNS_KO } from './ko/concerns';
import { CONCERNS_JA } from './ja/concerns';
import { localized } from './locale';

export const CONCERNS = localized({ en: EN, ko: CONCERNS_KO, ja: CONCERNS_JA });
export { CONCERN_ORDER } from './en/concerns';
export type { ConcernKey, ConcernCopy } from './en/concerns';
