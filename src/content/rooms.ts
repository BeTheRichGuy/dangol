import { ROOMS_COPY as EN } from './en/rooms';
import { ROOMS_JA } from './ja/rooms';
import { ROOMS_KO } from './ko/rooms';
import { localized, overlay } from './locale';

export const ROOMS_COPY = localized({ en: EN, ko: overlay(EN, ROOMS_KO), ja: overlay(EN, ROOMS_JA) });
export type { RoomsCopy, RoomCopy, RoomLine, StoryBeat } from './en/rooms';
