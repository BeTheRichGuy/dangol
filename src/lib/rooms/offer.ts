import { lifeOfferLine } from '@/content/continue';
import { activeLocale } from '@/content/locale';
import { ROOMS_COPY } from '@/content/rooms';
import { ROOM_KEYS, type RoomKey } from './themes';

export type FreeSeen = 'why' | 'more' | null;

export interface OfferLine {

  n: number;
  title: string;
  line: string;

  answer: string | null;

  free: FreeSeen;
}

export interface RoomOffer {
  key: RoomKey;
  title: string;

  question: string;
  price: string;
  lines: OfferLine[];
}

function extra(key: RoomKey, index: number, title: string): { answer: string | null; free: FreeSeen } {
  const hit = key === 'life' ? lifeOfferLine(activeLocale(), index, title) : null;
  return { answer: hit?.answer ?? null, free: hit?.free ?? null };
}

export function roomOffer(key: RoomKey): RoomOffer {
  const room = ROOMS_COPY.rooms[key];
  return {
    key,
    title: room.title,
    question: room.question,
    price: ROOMS_COPY.price,
    lines: room.contents.map((c, i) => ({ n: i + 1, title: c.title, line: c.line, ...extra(key, i, c.title) })),
  };
}

export function otherRoomKeys(current: RoomKey): RoomKey[] {
  return ROOM_KEYS.filter((k) => k !== current);
}
