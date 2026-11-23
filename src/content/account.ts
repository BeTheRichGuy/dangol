import { ACCOUNT_EN } from './en/account';
import { ACCOUNT_JA } from './ja/account';
import { ACCOUNT_KO } from './ko/account';
import { localized } from './locale';

export const ACCOUNT = localized({ en: ACCOUNT_EN, ko: ACCOUNT_KO, ja: ACCOUNT_JA });
export type { AccountCopy } from './en/account';
