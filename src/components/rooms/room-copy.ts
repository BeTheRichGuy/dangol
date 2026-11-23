import { ROOMS_COPY, type RoomCopy } from '@/content/rooms';
import type { ProductKey } from '@/lib/rooms/themes';

export function roomCopy(room: ProductKey): RoomCopy {
  return room === 'reunion' ? ROOMS_COPY.reunion : ROOMS_COPY.rooms[room];
}
