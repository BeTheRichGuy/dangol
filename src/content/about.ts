import { ABOUT_MEDIA as EN } from './en/about';
import { ABOUT_MEDIA_KO } from './ko/about';
import { ABOUT_MEDIA_JA } from './ja/about';
import { localized } from './locale';

export const ABOUT_MEDIA = localized<{ readonly portraitAlt: string }>({ en: EN, ko: ABOUT_MEDIA_KO, ja: ABOUT_MEDIA_JA });
