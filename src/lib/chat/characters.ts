import type { Keeper, RoomKey } from '@/lib/rooms/themes';

export const CHAT_KEYS = ['yul', 'yeon', 'yeoun', 'muk', 'mansin'] as const;
export type ChatKey = (typeof CHAT_KEYS)[number];

export interface ChatCharacter {
  key: ChatKey;

  keeper: Keeper;

  room: RoomKey;

  art: string;
}

export const CHAT_CHARACTERS: Record<ChatKey, ChatCharacter> = {
  yul: { key: 'yul', keeper: 'yul', room: 'life', art: '/media/chat/yul.jpg' },
  yeon: { key: 'yeon', keeper: 'yeon', room: 'love', art: '/media/chat/yeon.jpg' },

  yeoun: { key: 'yeoun', keeper: 'u12', room: 'life', art: '/media/chat/reunion.jpg' },
  muk: { key: 'muk', keeper: 'muk', room: 'life', art: '/media/chat/muk.jpg' },
  mansin: { key: 'mansin', keeper: 'mansin', room: 'year', art: '/media/chat/mansin.jpg' },
};

export function isChatKey(v: unknown): v is ChatKey {
  return typeof v === 'string' && (CHAT_KEYS as readonly string[]).includes(v);
}

export const HISTORY_MAX = 10;
export const MESSAGE_MAX = 300;

export interface ChatLine {
  role: 'reader' | 'character';
  text: string;
}
