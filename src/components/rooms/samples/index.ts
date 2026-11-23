import type { Locale } from '@/content/locale';
import type { RoomKey } from '@/lib/rooms/themes';

export const SAMPLE_ROOMS: readonly RoomKey[] = [];

export async function loadSample(_room: RoomKey, _locale: Locale): Promise<string | null> {
  return null;
}
