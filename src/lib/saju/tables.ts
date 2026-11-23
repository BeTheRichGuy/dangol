import type { Branch, Element, GodGroup, Pillar, Polarity, Stem, TypeKey } from './types';

export const STEMS: readonly Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const BRANCHES: readonly Branch[] = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
];

const STEM_ELEMENTS: readonly Element[] = [
  'wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water',
];

const BRANCH_ELEMENTS: readonly Element[] = [
  'water', 'earth', 'wood', 'wood', 'earth', 'fire', 'fire', 'earth', 'metal', 'metal', 'earth', 'water',
];

const STEM_ROMAN = ['gap', 'eul', 'byeong', 'jeong', 'mu', 'gi', 'gyeong', 'sin', 'im', 'gye'];
const BRANCH_ROMAN = ['ja', 'chuk', 'in', 'myo', 'jin', 'sa', 'o', 'mi', 'sin', 'yu', 'sul', 'hae'];

const TYPE_BY_STEM_INDEX: readonly TypeKey[] = [
  'pine', 'vine', 'sun', 'candle', 'mountain', 'field', 'blade', 'jewel', 'ocean', 'rain',
];

export function stemIndex(stem: string): number {
  const i = STEMS.indexOf(stem as Stem);
  if (i < 0) throw new RangeError('Unknown stem');
  return i;
}

export function branchIndex(branch: string): number {
  const i = BRANCHES.indexOf(branch as Branch);
  if (i < 0) throw new RangeError('Unknown branch');
  return i;
}

export function stemElement(stem: Stem): Element {
  return STEM_ELEMENTS[stemIndex(stem)];
}

export function branchElement(branch: Branch): Element {
  return BRANCH_ELEMENTS[branchIndex(branch)];
}

export function stemPolarity(stem: Stem): Polarity {
  return stemIndex(stem) % 2 === 0 ? 'yang' : 'yin';
}

export function typeOfStem(stem: Stem): TypeKey {
  return TYPE_BY_STEM_INDEX[stemIndex(stem)];
}

export function pillarFromGanzhi(ganzhi: string): Pillar {
  const stem = ganzhi.charAt(0) as Stem;
  const branch = ganzhi.charAt(1) as Branch;
  const si = stemIndex(stem);
  const bi = branchIndex(branch);
  return {
    stem,
    branch,
    stemElement: STEM_ELEMENTS[si],
    branchElement: BRANCH_ELEMENTS[bi],
    stemPolarity: si % 2 === 0 ? 'yang' : 'yin',
    ganzhi: stem + branch,
    romanized: `${STEM_ROMAN[si]}-${BRANCH_ROMAN[bi]}`,
  };
}

const GENERATES: Record<Element, Element> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};
const CONTROLS: Record<Element, Element> = {
  wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
};

export function godGroup(me: Element, other: Element): GodGroup {
  if (me === other) return 'peer';
  if (GENERATES[me] === other) return 'output';
  if (CONTROLS[me] === other) return 'wealth';
  if (CONTROLS[other] === me) return 'power';
  return 'resource';
}

export function isClash(a: Branch, b: Branch): boolean {
  return (branchIndex(a) - branchIndex(b) + 12) % 12 === 6;
}

const SIX_HARMONY: ReadonlyArray<readonly [Branch, Branch]> = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
];

export function isSixHarmony(a: Branch, b: Branch): boolean {
  return SIX_HARMONY.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

const WONJIN: ReadonlyArray<readonly [Branch, Branch]> = [
  ['子', '未'], ['丑', '午'], ['寅', '酉'], ['卯', '申'], ['辰', '亥'], ['巳', '戌'],
];

export function isWonjin(a: Branch, b: Branch): boolean {
  return WONJIN.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export interface JieInfo {

  lib: string;
  hanzi: string;
  name: string;
}

export const JIE_TABLE: readonly JieInfo[] = [
  { lib: '立春', hanzi: '立春', name: 'Start of Spring' },
  { lib: '惊蛰', hanzi: '驚蟄', name: 'Awakening of Insects' },
  { lib: '清明', hanzi: '清明', name: 'Clear and Bright' },
  { lib: '立夏', hanzi: '立夏', name: 'Start of Summer' },
  { lib: '芒种', hanzi: '芒種', name: 'Grain in Ear' },
  { lib: '小暑', hanzi: '小暑', name: 'Minor Heat' },
  { lib: '立秋', hanzi: '立秋', name: 'Start of Autumn' },
  { lib: '白露', hanzi: '白露', name: 'White Dew' },
  { lib: '寒露', hanzi: '寒露', name: 'Cold Dew' },
  { lib: '立冬', hanzi: '立冬', name: 'Start of Winter' },
  { lib: '大雪', hanzi: '大雪', name: 'Major Snow' },
  { lib: '小寒', hanzi: '小寒', name: 'Minor Cold' },
];

export function jieIndex(libName: string): number {
  const i = JIE_TABLE.findIndex((j) => j.lib === libName || j.hanzi === libName);
  if (i < 0) throw new RangeError('Unknown solar term');
  return i;
}
