export type YulArt = 'reassure' | 'oho';

export const CARD_ART_FILES: Record<YulArt | 'sogeum' | 'brandOg' | 'backdoor', string> = {
  reassure: 'yul-reassure.jpg',
  oho: 'yul-oho.jpg',
  sogeum: 'sogeum-nap.jpg',
  brandOg: 'brand-og.jpg',
  backdoor: 'yul-backdoor.jpg',
};

export const CARD_ART_TOP: Record<YulArt, number> = { reassure: 440, oho: 350 };

const YANG_KEYS: ReadonlySet<string> = new Set(['pine', 'sun', 'mountain', 'blade', 'ocean']);

export function yulArtFor(typeKey: string | null): YulArt {
  return typeKey !== null && YANG_KEYS.has(typeKey) ? 'oho' : 'reassure';
}
