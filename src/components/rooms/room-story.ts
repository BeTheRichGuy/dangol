import type { RoomLine, StoryBeat } from '@/content/rooms';
import { REUNION_ART, reunionArtSrc } from '@/lib/reunion/art';
import type { ProductKey } from '@/lib/rooms/themes';
import type { PanelAspect } from '../webtoon';
import type { WebtoonBeat } from './reading-blocks';

export const STORY_DIR = '/media/webtoon';

export interface StoryPanel {

  file: string;

  aspect?: PanelAspect;

  align?: 'full' | 'left' | 'right' | 'narrow';
  objectPosition: string;
  zoom?: { scale: number; origin: string };

  mouth?: number;

  alt?: string;

  src?: string;
}

export const ROOM_STORY: Record<ProductKey, readonly StoryPanel[]> = {

  life: [
    { file: 'yul-inner-door', objectPosition: '50% 22%', mouth: 0.56 },
    { file: 'yul-laugh', aspect: 'square', align: 'left', objectPosition: '50% 22%', mouth: 0.5 },
    { file: 'yul-tea-offer', aspect: 'square', align: 'right', objectPosition: '50% 50%' },
    { file: 'yul-read-v2', aspect: 'strip', objectPosition: '50% 33%', zoom: { scale: 1.12, origin: '50% 0%' }, mouth: 0.47 },
    { file: 'sogeum-sleep-v2', align: 'narrow', objectPosition: '50% 50%' },
    { file: 'yul-serious', aspect: 'square', align: 'left', objectPosition: '50% 22%', mouth: 0.5 },
    { file: 'yul-hand-wait-v2', aspect: 'square', objectPosition: '50% 50%' },
  ],

  decades: [
    { file: 'year-eyes', aspect: 'wide', objectPosition: '50% 50%', mouth: 0.52 },
    { file: 'year-rice-top', aspect: 'square', align: 'right', objectPosition: '50% 50%' },
    { file: 'year-nap-v2', align: 'narrow', objectPosition: '50% 45%' },
    { file: 'year-stars-empty', aspect: 'wide', objectPosition: '50% 50%' },
  ],

  love: [
    { file: 'love-room-wide', aspect: 'wide', objectPosition: '50% 50%' },
    { file: 'love-hello', align: 'left', objectPosition: '50% 25%', mouth: 0.46 },
    { file: 'love-nap-v2', align: 'narrow', objectPosition: '50% 50%' },
    { file: 'love-knot-hands', aspect: 'square', align: 'right', objectPosition: '50% 50%' },
    { file: 'love-eyes-thread', aspect: 'strip', objectPosition: '50% 45%', mouth: 0.55 },
    { file: 'love-window-ots', aspect: 'wide', objectPosition: '50% 50%', mouth: 0.38 },
    { file: 'love-pull-low', align: 'right', objectPosition: '50% 20%', mouth: 0.5 },
    { file: 'love-smile-side', aspect: 'square', objectPosition: '50% 35%', mouth: 0.47 },
  ],

  match: [
    { file: 'muk-room-1', aspect: 'wide', objectPosition: '50% 40%' },
    { file: 'muk-room-2', objectPosition: '50% 35%', mouth: 0.55 },
    { file: 'muk-room-3', aspect: 'square', align: 'left', objectPosition: '50% 40%', mouth: 0.36 },
    { file: 'muk-room-4', aspect: 'square', align: 'right', objectPosition: '50% 30%', mouth: 0.66 },
    { file: 'muk-room-5', aspect: 'strip', objectPosition: '50% 30%' },
    { file: 'sogeum-sleep-v2', align: 'narrow', objectPosition: '50% 50%' },
    { file: 'muk-room-7', aspect: 'square', objectPosition: '50% 30%', mouth: 0.64 },
    { file: 'muk-room-8', objectPosition: '50% 30%', mouth: 0.58 },
  ],

  year: [
    { file: 'year-garden-welcome', aspect: 'tall', objectPosition: '50% 50%', mouth: 0.44 },
    { file: 'year-garden-stones', aspect: 'wide', objectPosition: '50% 50%' },
    { file: 'year-garden-rest', objectPosition: '50% 30%', mouth: 0.64 },
  ],

  reunion: [
    reunionPanel('story-1', 'wide', '50% 50%'),
    reunionPanel('story-2', undefined, '50% 25%'),
    reunionPanel('story-3', 'square', '50% 50%', 'narrow'),
    reunionPanel('story-4', 'wide', '50% 45%'),
    reunionPanel('story-5', 'square', '50% 40%'),
    reunionPanel('story-6', undefined, '50% 25%'),
    reunionPanel('story-7', undefined, '50% 35%'),
  ],
};

function reunionPanel(name: string, aspect: StoryPanel['aspect'], objectPosition: string, align?: StoryPanel['align']): StoryPanel {
  return { file: name, src: reunionArtSrc(name), aspect, align, objectPosition, alt: REUNION_ART[name].scene };
}

export function storySrc(panel: StoryPanel): string {
  return panel.src ?? `${STORY_DIR}/${panel.file}.jpg`;
}

export interface PanelSay {
  stage: string | null;
  lines: readonly RoomLine[];
  writing: boolean;
}

export function speakingPanels(story: readonly StoryBeat[]): number[] {
  return story.flatMap((b, i) => (b.lines.length > 0 ? [i] : []));
}

export function placeBeats(story: readonly StoryBeat[], beats: readonly WebtoonBeat[], writing: boolean): PanelSay[] {
  const out: PanelSay[] = story.map((b) => ({ stage: b.stage, lines: b.lines, writing: false }));
  const speaking = speakingPanels(story);
  if (speaking.length === 0 || (beats.length === 0 && !writing)) return out;
  beats.forEach((beat, k) => {
    const at = speaking[Math.min(k, speaking.length - 1)];
    const lines = beat.map((l) => ({ text: l.text }));
    out[at] = { ...out[at], lines: k < speaking.length ? lines : [...out[at].lines, ...lines] };
  });
  if (writing) {
    speaking.slice(beats.length).forEach((at, k) => {
      out[at] = { ...out[at], lines: [], writing: k === 0 };
    });
  }
  return out;
}
