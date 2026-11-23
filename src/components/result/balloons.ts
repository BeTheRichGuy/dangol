import { joinSentences, splitSentences } from './webtoon-text';

export const MAX_SENTENCES = 2;

const INTERJECTION_MAX = 8;

function groupSentences(sentences: string[], max: number): string[][] {
  const n = sentences.length;
  if (n <= max) return [sentences];
  const groups = Math.ceil(n / max);
  const len = sentences.map((s) => s.length);

  const best: { sizes: number[] | null; score: number } = { sizes: null, score: Infinity };
  const sizes: number[] = [];
  function walk(at: number, left: number) {
    if (left === 0) {
      if (at !== n) return;
      let from = 0;
      let longest = 0;
      for (const size of sizes) {
        longest = Math.max(longest, len.slice(from, from + size).reduce((a, b) => a + b, 0));
        from += size;
      }
      if (longest < best.score) {
        best.score = longest;
        best.sizes = [...sizes];
      }
      return;
    }
    for (let size = 1; size <= max && at + size <= n; size += 1) {
      sizes.push(size);
      walk(at + size, left - 1);
      sizes.pop();
    }
  }
  walk(0, groups);
  const picked: number[] = best.sizes ?? sentences.map(() => 1);
  const out: string[][] = [];
  let from = 0;
  for (const size of picked) {
    out.push(sentences.slice(from, from + size));
    from += size;
  }
  return out;
}

export function balloonsMax(text: string, max: number = MAX_SENTENCES): string[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return text.trim() ? [text.trim()] : [];
  const out: string[] = [];
  let rest = sentences;
  if (rest.length >= 3 && rest[0].length <= INTERJECTION_MAX) {
    out.push(rest[0]);
    rest = rest.slice(1);
  }
  for (const group of groupSentences(rest, Math.max(1, max))) out.push(joinSentences(group));
  return out;
}

export function isInterjection(text: string): boolean {
  return text.length <= INTERJECTION_MAX;
}

export const SHORT_OPENER_MAX = 22;

export function isShortOpener(text: string): boolean {
  return text.length <= SHORT_OPENER_MAX;
}

export function sentenceCount(text: string): number {
  return splitSentences(text).length;
}

export const FIRST_BUBBLE_MS = 100;
const NEXT_BUBBLE_GAP_MS = 650;

export function bubbleDelay(index: number): number {
  return FIRST_BUBBLE_MS + Math.max(0, index) * NEXT_BUBBLE_GAP_MS;
}
