import { BUNDLE_COPY as EN } from './en/bundle';
import { BUNDLE_JA } from './ja/bundle';
import { BUNDLE_KO } from './ko/bundle';
import { localized } from './locale';

export const BUNDLE_PAGE = localized({ en: EN, ko: BUNDLE_KO, ja: BUNDLE_JA });
export type { BundleCopy } from './en/bundle';
