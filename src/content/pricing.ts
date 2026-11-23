import type { LegalSection } from './en/legal';
import type { RoomsCopy } from './en/rooms';
import { ROOM_KEYS, ROOMS } from '@/lib/rooms/themes';

export interface RoomPriceWords {
  heading: (title: string, keeper: string) => string;
  covers: (titles: readonly string[]) => string;
  price: (price: string) => string;
}

export function roomPriceSections(copy: RoomsCopy, words: RoomPriceWords): LegalSection[] {
  return ROOM_KEYS.map((key) => {
    const room = copy.rooms[key];
    return {
      heading: words.heading(room.title, copy.keepers[ROOMS[key].keeper].name),
      body: [room.line, room.gain, words.covers(room.contents.map((c) => c.title)), words.price(copy.price)],
    };
  });
}
