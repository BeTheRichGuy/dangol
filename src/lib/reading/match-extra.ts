import { yearGanzhi, type RelationKind } from '@/lib/saju/details';
import type { Element, Stem } from '@/lib/saju/types';
import { luckPillar, type ChartBlock, type CrossBlock, type PillarAt } from '@/lib/rooms/payload';
import { coreOfBlock, monthToneOf, type MonthTone, type TogetherKind } from './fate-map';

export type PairFlow = CrossBlock['dayStems']['flow'];

export type PairTone = 'combine' | 'clash' | 'plain';

export interface PairType {
  flow: PairFlow;
  tone: PairTone;
  me: { stem: Stem; element: Element };
  you: { stem: Stem; element: Element };
}

export const PAIR_FLOWS: readonly PairFlow[] = ['same', 'self-feeds-other', 'other-feeds-self', 'self-checks-other', 'other-checks-self'];

export function pairType(cross: CrossBlock, me: ChartBlock, you: ChartBlock): PairType {
  const d = cross.dayStems;
  return {
    flow: d.flow,
    tone: d.combine ? 'combine' : d.clash ? 'clash' : 'plain',
    me: { stem: d.self, element: me.dayMaster.element },
    you: { stem: d.other, element: you.dayMaster.element },
  };
}

export type LineTone = 'harmony' | 'clash' | 'tangle';

export interface LineNode {
  who: 'me' | 'you';
  at: PillarAt;

  part: 'stem' | 'branch';
}

export interface PairLine {
  kind: RelationKind;
  tone: LineTone;

  chars: string;

  from: LineNode;
  to: LineNode;

  element: Element | null;
}

export const MAX_PAIR_LINES = 6;

const TONE_OF: Record<RelationKind, LineTone> = {
  天干合: 'harmony', 六合: 'harmony', 三合: 'harmony', 半合: 'harmony', 方合: 'harmony',
  天干沖: 'clash', 沖: 'clash',
  刑: 'tangle', 自刑: 'tangle', 破: 'tangle', 害: 'tangle', 怨嗔: 'tangle', 鬼門: 'tangle',
};
const TONE_RANK: Record<LineTone, number> = { harmony: 0, clash: 1, tangle: 2 };
const STEMS = '甲乙丙丁戊己庚辛壬癸';
const AT_VALUES: readonly PillarAt[] = ['year', 'month', 'day', 'hour'];

function nodeOf(at: string, char: string): LineNode | null {
  const [side, pillar] = at.split('.');
  const who = side === 'self' ? 'me' : side === 'other' ? 'you' : null;
  const pos = AT_VALUES.find((v) => v === pillar);
  return who && pos ? { who, at: pos, part: STEMS.includes(char) ? 'stem' : 'branch' } : null;
}

export function pairLines(cross: CrossBlock): { lines: PairLine[]; total: number } {
  const seen = new Set<string>();
  const all: PairLine[] = [];
  for (const r of cross.relations) {
    const nodes = r.at.map((at, i) => nodeOf(at, r.chars[i] ?? ''));
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        if (!a || !b || a.who === b.who) continue;
        const [from, to] = a.who === 'me' ? [a, b] : [b, a];
        const key = `${r.kind}|${from.at}.${from.part}|${to.at}.${to.part}`;
        if (seen.has(key)) continue;
        seen.add(key);
        all.push({ kind: r.kind, tone: TONE_OF[r.kind], chars: r.chars, from, to, element: r.element });
      }
    }
  }
  const sorted = all.map((l, i) => ({ l, i })).sort((x, y) => TONE_RANK[x.l.tone] - TONE_RANK[y.l.tone] || x.i - y.i).map((x) => x.l);
  return { lines: sorted.slice(0, MAX_PAIR_LINES), total: sorted.length };
}

export interface PairYear {
  year: number;

  me: MonthTone | null;
  you: MonthTone | null;
  kind: TogetherKind;
}

export const PAIR_YEARS = 7;

export function pairYears(me: ChartBlock, you: ChartBlock, todayIso: string, count = PAIR_YEARS): PairYear[] {
  const from = Number(todayIso.slice(0, 4));
  const mine = coreOfBlock(me);
  const yours = coreOfBlock(you);
  return Array.from({ length: count }, (_, i) => {
    const year = from + i;
    const g = yearGanzhi(year);
    const a = monthToneOf(luckPillar(mine, g, 'yearLuck'));
    const b = monthToneOf(luckPillar(yours, g, 'yearLuck'));
    const goodA = a?.startsWith('harmony') ?? false;
    const goodB = b?.startsWith('harmony') ?? false;
    const badA = a !== null && !goodA;
    const badB = b !== null && !goodB;
    const kind: TogetherKind = goodA && goodB ? 'both' : goodA || goodB ? 'one' : badA && badB ? 'care' : 'even';
    return { year, me: a, you: b, kind };
  });
}
