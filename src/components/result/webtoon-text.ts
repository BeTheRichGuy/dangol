import { CONCERNS, type ConcernKey } from '@/content/concerns';
import { WEBTOON } from '@/content/webtoon';
import { pickByHash } from '@/lib/reading/hash';
import type { Chart, Element } from '@/lib/saju';

export function seedOf(chart: Chart): string {
  const { date, time, place } = chart.input;
  return [date, time ?? 'unknown', place.name, place.country, 'webtoon'].join('|');
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in vars ? vars[key] : whole));
}

export function introLine(seed: string, name: string): string {
  const who = name.trim();
  return who
    ? fillTemplate(pickByHash(WEBTOON.intro, `${seed}|intro`), { name: who })
    : pickByHash(WEBTOON.introNoName, `${seed}|intro`);
}

export function pillarsLine(seed: string): string {
  return pickByHash(WEBTOON.pillarsLine, `${seed}|pillars`);
}

export function sogeumBreakLine(seed: string): string {
  return pickByHash(WEBTOON.sogeumBreak, `${seed}|sogeum`);
}

export function concernChapterTitle(concern: ConcernKey): string {
  return fillTemplate(WEBTOON.chapterConcern, { concern: CONCERNS[concern].title });
}

export function typeCaptionOf(born: string, hanzi: string): string {
  return fillTemplate(WEBTOON.typeCaption, { born, hanzi });
}

export interface ElementTalk {
  kind: 'dominant' | 'missing' | 'balanced';
  element: Element | null;
  text: string;
}

export function elementTalk(chart: Chart, missingFromTraits: Element | null | undefined, seed: string): ElementTalk[] {
  const dominant = dominantElement(chart, (tied) => pickByHash(tied, `${seed}|dominant-tie`));
  const missing = missingElement(chart, missingFromTraits);
  const out: ElementTalk[] = [];
  if (dominant) out.push({ kind: 'dominant', element: dominant, text: pickByHash(WEBTOON.elementsDominant[dominant], `${seed}|dominant|${dominant}`) });
  if (missing) out.push({ kind: 'missing', element: missing, text: pickByHash(WEBTOON.elementsMissing[missing], `${seed}|missing|${missing}`) });
  if (out.length === 0) out.push({ kind: 'balanced', element: null, text: pickByHash(WEBTOON.elementsBalanced, `${seed}|balanced`) });
  return out;
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?…]["”’)]?)\s+(?=[A-Z“"‘'(])|(?<=[.!?…])\s+(?=[가-힣])|(?<=[。！？])\s*(?=[^\s」』）)。！？、])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinSentences(sentences: readonly string[]): string {
  return sentences.reduce((out, s) => (out === '' ? s : /[。！？]$/.test(out) ? out + s : `${out} ${s}`), '');
}

function isQuestion(sentence: string): boolean {
  return /\?["”’)]?$/.test(sentence);
}

function charsOf(sentences: readonly string[]): number {
  return sentences.reduce((n, s) => n + s.length, 0) + Math.max(0, sentences.length - 1);
}

function partition(sentences: readonly string[], groups: number): string[] {
  const n = sentences.length;
  const m = Math.min(groups, n);
  if (m <= 1) return [joinSentences(sentences)];

  let best: { ends: number[]; most: number; spread: number } | null = null;
  const ends: number[] = [];
  const consider = () => {
    let from = 0;
    let most = 0;
    let longest = 0;
    let shortest = Infinity;
    for (const end of ends) {
      const chunk = sentences.slice(from, end);
      most = Math.max(most, chunk.length);
      const size = charsOf(chunk);
      longest = Math.max(longest, size);
      shortest = Math.min(shortest, size);
      from = end;
    }
    const spread = longest - shortest;
    if (!best || most < best.most || (most === best.most && spread < best.spread)) best = { ends: [...ends], most, spread };
  };
  const walk = (start: number, left: number) => {
    if (left === 1) {
      ends.push(n);
      consider();
      ends.pop();
      return;
    }
    for (let end = start + 1; end <= n - (left - 1); end += 1) {
      ends.push(end);
      walk(end, left - 1);
      ends.pop();
    }
  };
  walk(0, m);

  const chosen = best as { ends: number[] } | null;
  if (!chosen) return [joinSentences(sentences)];
  const out: string[] = [];
  let from = 0;
  for (const end of chosen.ends) {
    out.push(joinSentences(sentences.slice(from, end)));
    from = end;
  }
  return out;
}

function teaseLength(sentences: readonly string[], parts: number): number {
  if (parts < 3 || sentences.length < 3) return 0;
  const [first, second] = sentences;
  if (first.length <= 14 && !isQuestion(first) && isQuestion(second)) return 2;
  if (first.length <= 14 && isQuestion(first) && isQuestion(second) && sentences.length >= 4) return 2;
  if (isQuestion(first)) return 1;
  if (first.length <= 8) return 1;
  return 0;
}

export function balloonsOf(text: string, parts = 3): string[] {
  const sentences = splitSentences(text);
  if (sentences.length <= 1 || parts <= 1) return [joinSentences(sentences) || text];
  const tease = teaseLength(sentences, parts);
  if (tease > 0) {
    return [joinSentences(sentences.slice(0, tease)), ...partition(sentences.slice(tease), parts - 1)];
  }
  return partition(sentences, parts);
}

export const CONCERN_BALLOON_COUNT = 3;

export function concernBalloons(text: string): string[] {
  return balloonsOf(text, CONCERN_BALLOON_COUNT);
}

const ORDER: readonly Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

export const DOMINANT_MIN = 3;

export function dominantElement(chart: Chart, pick: (tied: Element[]) => Element): Element | null {
  const max = Math.max(...ORDER.map((e) => chart.elements[e]));
  if (max < DOMINANT_MIN) return null;
  const tied = ORDER.filter((e) => chart.elements[e] === max);
  return tied.length === 1 ? tied[0] : pick(tied);
}

export function missingElement(chart: Chart, fromTraits: Element | null | undefined): Element | null {
  if (fromTraits && chart.elements[fromTraits] === 0) return fromTraits;
  return ORDER.find((e) => chart.elements[e] === 0) ?? null;
}
