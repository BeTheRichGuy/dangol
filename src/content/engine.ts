import { ENGINE_COPY as EN } from './en/engine';
import { ENGINE_JA } from './ja/engine';
import { ENGINE_KO } from './ko/engine';
import { localized, overlay } from './locale';

export const ENGINE_COPY = localized({ en: EN, ko: overlay(EN, ENGINE_KO), ja: overlay(EN, ENGINE_JA) });
