export const ROOM_KEYS = ['life', 'decades', 'love', 'match', 'year'] as const;
export type RoomKey = (typeof ROOM_KEYS)[number];

export const REUNION_ROOM = 'reunion' as const;

export type ProductKey = RoomKey | typeof REUNION_ROOM;
export const PRODUCT_KEYS: readonly ProductKey[] = [...ROOM_KEYS, REUNION_ROOM];

export const CHAPTER_ROOMS = ['life', 'decades', 'love', 'match', 'year', REUNION_ROOM] as const;
export type ChapterRoom = (typeof CHAPTER_ROOMS)[number];

export function usesChapters(room: ProductKey): room is ChapterRoom {
  return (CHAPTER_ROOMS as readonly string[]).includes(room);
}

export type Keeper = 'yul' | 'mansin' | 'yeon' | 'muk' | 'u12';

export interface RoomSpec {
  key: ProductKey;
  keeper: Keeper;

  needsPartner: boolean;

  needsLuck: boolean;
}

export const ROOMS: Record<ProductKey, RoomSpec> = {
  life: { key: 'life', keeper: 'yul', needsPartner: false, needsLuck: true },
  decades: { key: 'decades', keeper: 'mansin', needsPartner: false, needsLuck: true },
  love: { key: 'love', keeper: 'yeon', needsPartner: false, needsLuck: true },
  match: { key: 'match', keeper: 'muk', needsPartner: true, needsLuck: true },
  year: { key: 'year', keeper: 'mansin', needsPartner: false, needsLuck: true },

  reunion: { key: 'reunion', keeper: 'u12', needsPartner: true, needsLuck: true },
};

export const YEAR_ROOM_YEAR = 2027;

export const PAIR_KINDS = ['lover', 'crush', 'friend', 'coworker', 'family', 'other'] as const;
export type PairKind = (typeof PAIR_KINDS)[number];

export const CHOOSABLE_PAIR_KINDS = ['lover', 'crush'] as const satisfies readonly PairKind[];

export function isRoomKey(v: unknown): v is RoomKey {
  return typeof v === 'string' && (ROOM_KEYS as readonly string[]).includes(v);
}

export function isProductKey(v: unknown): v is ProductKey {
  return typeof v === 'string' && (PRODUCT_KEYS as readonly string[]).includes(v);
}

export function isPairKind(v: unknown): v is PairKind {
  return typeof v === 'string' && (PAIR_KINDS as readonly string[]).includes(v);
}
