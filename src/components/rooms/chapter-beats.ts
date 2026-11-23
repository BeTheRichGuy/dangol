export interface ChapterSay {
  text: string | null;

  writing: boolean;
}

export function readingWaiting(phase: string, chapterCount: number): boolean {
  return phase === 'waiting' || phase === 'idle' || (phase === 'streaming' && chapterCount === 0);
}

export interface FixedSays {
  first: string;
  second: string | null;
  third: string | null;
}

export function placeChapterBeats(beats: readonly string[], writing: boolean, fixed?: FixedSays): [ChapterSay, ChapterSay, ChapterSay] {

  const have = fixed ? Math.max(beats.length, fixed.second ? 2 : 1) : beats.length;
  const at = (i: number): ChapterSay => {
    if (fixed && i === 0) return { text: fixed.first, writing: false };
    if (fixed && i === 1 && fixed.second) return { text: fixed.second, writing: false };
    if (fixed && i === 2 && fixed.third) return { text: fixed.third, writing: false };
    const text = i < 2 ? (beats[i] ?? null) : beats.length > 2 ? beats.slice(2).join(' ') : null;
    return { text, writing: writing && text === null && i === have };
  };
  return [at(0), at(1), at(2)];
}
