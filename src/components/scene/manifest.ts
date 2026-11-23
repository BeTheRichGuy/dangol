import { REUNION_ART_DIR, REUNION_ART_READY, REUNION_STAND } from '@/lib/reunion/art';
import type { ProductKey } from '@/lib/rooms/themes';

export type SceneId = 'listen';

export type ReactionId = 'talk';
export type ClipId = SceneId | ReactionId;

export const SCENE_IDS: readonly SceneId[] = ['listen'];
export const REACTION_IDS: readonly ReactionId[] = ['talk'];

export const CLIP_DIR = '/media/clips';

export const ENTER = { poster: `${CLIP_DIR}/enter-v2.jpg` } as const;

export const ENTER_FRAME = {
  width: 716,
  height: 1284,
  position: { x: 0.5, y: 0.7 },
  door: {
    x: 0.512,

    h: 0.08,

    y: [
      [0, 0.389],
      [1, 0.389],
      [2, 0.395],
      [3, 0.405],
      [4, 0.419],
      [4.5, 0.428],
      [5.04, 0.434],
    ] as readonly (readonly [number, number])[],
  },
} as const;

export const REACTION_MOUTH_OPENS_MS = 650;
export const REACTION_RELEASE_MS = 400;

export const CLIPS: Record<ClipId, { mp4: boolean; jpg: boolean; file: string }> = {

  listen: { mp4: false, jpg: true, file: 'yul-listen-v2' },

  talk: { mp4: false, jpg: false, file: 'yul-talk' },
};

export const FALLBACK: Record<SceneId, readonly SceneId[]> = {
  listen: [],
};

export interface Framing {

  position: string;

  zoom: number;
}

export const CLIP_FRAMING: Framing = { position: '50% 18%', zoom: 1 };

export const LAST_STILL: { src: string; framing: Framing } = {
  src: `${CLIP_DIR}/yul-master-v2.jpg`,
  framing: CLIP_FRAMING,
};

export const ROOM_ART: Record<ProductKey, { file: string; ready: boolean; stand: string | null }> = {
  life: { file: '/media/rooms/life.jpg', ready: false, stand: '/media/webtoon/yul-laugh-sleeve-v3.jpg' },
  decades: { file: '/media/rooms/decades.jpg', ready: false, stand: '/media/webtoon/year-portrait.jpg' },
  love: { file: '/media/rooms/love.jpg', ready: false, stand: '/media/webtoon/love-portrait.jpg' },
  match: { file: '/media/rooms/match.jpg', ready: true, stand: '/media/webtoon/muk-cover.jpg' },

  year: { file: '/media/rooms/year.jpg', ready: true, stand: '/media/webtoon/year-hello.jpg' },

  reunion: { file: `${REUNION_ART_DIR}/reunion-cover.jpg`, ready: REUNION_ART_READY, stand: `${REUNION_ART_DIR}/${REUNION_STAND.portrait}.jpg` },
};

export function roomArtSrc(room: ProductKey): string | null {
  const art = ROOM_ART[room];
  return art.ready ? art.file : art.stand;
}

export const FREE_CARD_ART = '/media/rooms/free-v2.jpg';
