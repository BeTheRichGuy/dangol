import {
  SCENE_IDS,
  CLIPS,
  CLIP_DIR,
  CLIP_FRAMING,
  FALLBACK,
  LAST_STILL,
  type Framing,
  type ReactionId,
  type SceneId,
} from './manifest';

export interface SceneStill {
  src: string;
  framing: Framing;
}

export interface SceneMedia {

  videos: string[];

  stills: SceneStill[];

  videoFraming: Framing;
}

function chain(id: SceneId): SceneId[] {
  return [id, ...FALLBACK[id]];
}

export function resolveScene(id: SceneId): SceneMedia {
  const ids = chain(id);
  const videos = ids.filter((s) => CLIPS[s].mp4).map((s) => `${CLIP_DIR}/${CLIPS[s].file}.mp4`);
  const stills: SceneStill[] = ids
    .filter((s) => CLIPS[s].jpg)
    .map((s) => ({ src: `${CLIP_DIR}/${CLIPS[s].file}.jpg`, framing: CLIP_FRAMING }));
  stills.push({ src: LAST_STILL.src, framing: LAST_STILL.framing });
  return { videos, stills, videoFraming: CLIP_FRAMING };
}

const CANON = (() => {
  const bySignature = new Map<string, SceneId>();
  const out = {} as Record<SceneId, SceneId>;
  for (const id of SCENE_IDS) {
    const m = resolveScene(id);
    const signature = m.videos[0] ?? m.stills[0].src;
    const first = bySignature.get(signature) ?? id;
    bySignature.set(signature, first);
    out[id] = first;
  }
  return out;
})();

export function canonicalScene(id: SceneId): SceneId {
  return CANON[id];
}

export function sceneStill(id: SceneId): string {
  return resolveScene(id).stills[0].src;
}

export function reactionVideo(id: ReactionId): string | null {
  return CLIPS[id].mp4 ? `${CLIP_DIR}/${CLIPS[id].file}.mp4` : null;
}
