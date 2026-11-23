import type { TypeKey } from '@/lib/saju/types';
import type { PanelAspect } from '../webtoon';

export const WEBTOON_DIR = '/media/webtoon';

export type ArtSlot =
  | 'who'
  | 'type'
  | 'read'
  | 'hit1'
  | 'hit2'
  | 'hit3'
  | 'sleep'
  | 'concern'
  | 'candy'
  | 'hand'
  | 'salt'
  | 'bridge'
  | 'road'
  | 'deeper'
  | 'teaseTiming'
  | 'teasePeople'
  | 'teaseGap';

export const ART_SLOTS: readonly ArtSlot[] = [
  'who', 'type', 'read', 'hit1', 'hit2', 'hit3', 'sleep', 'concern', 'candy', 'hand', 'salt', 'bridge', 'road', 'deeper',
  'teaseTiming', 'teasePeople', 'teaseGap',
];

const FIXED: Record<Exclude<ArtSlot, 'type'>, string | null> = {
  who: 'yul-explain',

  read: 'yul-read-v2',
  hit1: 'yul-laugh-sleeve-v3',
  hit2: 'yul-tea-offer',

  hit3: 'yul-over-shoulder-v2',

  sleep: 'sogeum-sleep-v2',
  concern: 'yul-oho',

  candy: 'yul-candy-ease-v3',
  hand: 'yul-hand-wait-v2',
  salt: 'yul-serious-dim',

  bridge: 'yul-backdoor-v2',
  road: 'yul-balcony-back-v2',
  deeper: 'yul-door-hand-v2',

  teaseTiming: 'tease-timing-v3',
  teasePeople: 'tease-people-v3',

  teaseGap: 'tease-gap-v2',
};

export function artFor(slot: ArtSlot, type: TypeKey): string | null {
  if (slot === 'type') return `${WEBTOON_DIR}/emblem-${type}.jpg`;
  const name = FIXED[slot];
  return name ? `${WEBTOON_DIR}/${name}.jpg` : null;
}

export function artPlan(type: TypeKey): Record<ArtSlot, string | null> {
  const plan = {} as Record<ArtSlot, string | null>;
  for (const slot of ART_SLOTS) plan[slot] = artFor(slot, type);
  return plan;
}

export function duplicateArt(plan: Record<ArtSlot, string | null>): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const src of Object.values(plan)) {
    if (!src) continue;
    if (seen.has(src)) dup.add(src);
    seen.add(src);
  }
  return [...dup];
}

export const FORBIDDEN_ART = ['yul-portrait', 'yul-gate.webp', 'yul-gift', 'yul-greet', 'yul-scroll', 'sogeum.jpg', 'yul-master', 'yul-full', 'yul-gate-beckon'] as const;

export interface Framing {

  aspect?: PanelAspect;

  align?: 'full' | 'left' | 'right' | 'narrow';
  objectPosition: string;
  zoom?: { scale: number; origin: string };

  tailX?: number;

  overlap?: number;
}

export const ART_FRAMING: Partial<Record<ArtSlot, Framing>> = {

  who: { objectPosition: '50% 24%', tailX: 0.61 },
  type: { objectPosition: '50% 50%', align: 'right' },

  read: { aspect: 'strip', align: 'right', objectPosition: '50% 33%', zoom: { scale: 1.12, origin: '50% 0%' }, tailX: 0.47 },

  hit1: { align: 'left', objectPosition: '50% 30%', tailX: 0.47 },

  hit2: { aspect: 'square', align: 'right', objectPosition: '50% 50%' },

  hit3: { aspect: 'wide', objectPosition: '50% 50%' },
  sleep: { align: 'narrow', objectPosition: '50% 50%' },

  concern: { objectPosition: '50% 30%', tailX: 0.56 },

  candy: { aspect: 'square', align: 'right', objectPosition: '50% 60%', tailX: 0.49 },

  hand: { aspect: 'square', align: 'narrow', objectPosition: '50% 50%' },

  salt: { objectPosition: '50% 30%', tailX: 0.52 },

  bridge: { aspect: 'tall', objectPosition: '50% 50%', tailX: 0.5 },

  road: { aspect: 'wide', objectPosition: '50% 50%', tailX: 0.64, overlap: 8 },

  deeper: { aspect: 'square', objectPosition: '50% 50%', tailX: 0.73 },

  teaseTiming: { objectPosition: '50% 28%', tailX: 0.45 },

  teasePeople: { objectPosition: '50% 30%', tailX: 0.47 },

  teaseGap: { aspect: 'square', objectPosition: '50% 50%', tailX: 0.47 },
};

export type { PanelAspect };

export function aspectOf(slot: ArtSlot): PanelAspect {
  return ART_FRAMING[slot]?.aspect ?? 'portrait';
}

export function sideOf(slot: ArtSlot, fallback: 'left' | 'right' = 'left'): 'left' | 'right' {
  const x = ART_FRAMING[slot]?.tailX;
  if (x === undefined) return fallback;
  const frame = ART_FRAMING[slot];

  const scale = frame?.align === 'left' || frame?.align === 'right' ? 0.9 : frame?.align === 'narrow' ? 0.76 : 1;
  const start = frame?.align === 'right' ? 0.1 : frame?.align === 'narrow' ? 0.12 : 0;
  return start + x * scale < 0.5 ? 'left' : 'right';
}

export function framingProps(slot: ArtSlot) {
  const f = ART_FRAMING[slot];
  return {
    aspect: f?.aspect,
    align: f?.align,
    objectPosition: f?.objectPosition,
    zoom: f?.zoom,
    mouth: f?.tailX,
    overlap: f?.overlap,
  };
}
