import { CHAT_EN } from './en/chat';
import { CHAT_JA } from './ja/chat';
import { CHAT_KO } from './ko/chat';
import { localized } from './locale';

export const CHAT = localized({ en: CHAT_EN, ko: CHAT_KO, ja: CHAT_JA });
export type { ChatCopy } from './en/chat';
