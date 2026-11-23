import { WEBTOON as EN } from './en/webtoon';
import { WEBTOON_JA } from './ja/webtoon';
import { WEBTOON_KO } from './ko/webtoon';
import { localized, overlay } from './locale';

export const WEBTOON = localized({ en: EN, ko: overlay(EN, WEBTOON_KO), ja: overlay(EN, WEBTOON_JA) });
