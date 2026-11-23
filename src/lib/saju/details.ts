import { BRANCHES, STEMS, branchIndex, stemElement, stemIndex, stemPolarity, godGroup } from './tables';
import type { Branch, Element, GodGroup, Stem } from './types';

export type TenGod = '比肩' | '劫財' | '食神' | '傷官' | '偏財' | '正財' | '偏官' | '正官' | '偏印' | '正印';

export type Stage = '長生' | '沐浴' | '冠帶' | '建祿' | '帝旺' | '衰' | '病' | '死' | '墓' | '絶' | '胎' | '養';

const STAGES: readonly Stage[] = ['長生', '沐浴', '冠帶', '建祿', '帝旺', '衰', '病', '死', '墓', '絶', '胎', '養'];

export const HIDDEN_STEMS: Record<Branch, readonly Stem[]> = {
  子: ['壬', '癸'],
  丑: ['癸', '辛', '己'],
  寅: ['戊', '丙', '甲'],
  卯: ['甲', '乙'],
  辰: ['乙', '癸', '戊'],
  巳: ['戊', '庚', '丙'],
  午: ['丙', '己', '丁'],
  未: ['丁', '乙', '己'],
  申: ['戊', '壬', '庚'],
  酉: ['庚', '辛'],
  戌: ['辛', '丁', '戊'],
  亥: ['戊', '甲', '壬'],
};

export function mainStemOf(branch: Branch): Stem {
  const list = HIDDEN_STEMS[branch];
  return list[list.length - 1];
}

const SAME_POLARITY: Record<GodGroup, TenGod> = {
  peer: '比肩',
  output: '食神',
  wealth: '偏財',
  power: '偏官',
  resource: '偏印',
};
const OTHER_POLARITY: Record<GodGroup, TenGod> = {
  peer: '劫財',
  output: '傷官',
  wealth: '正財',
  power: '正官',
  resource: '正印',
};

export function tenGod(me: Stem, other: Stem): TenGod {
  const group = godGroup(stemElement(me), stemElement(other));
  return stemPolarity(me) === stemPolarity(other) ? SAME_POLARITY[group] : OTHER_POLARITY[group];
}

export function branchGod(me: Stem, branch: Branch): TenGod {
  return tenGod(me, mainStemOf(branch));
}

const CHANG_SHENG: Record<Stem, Branch> = {
  甲: '亥', 丙: '寅', 戊: '寅', 庚: '巳', 壬: '申',
  乙: '午', 丁: '酉', 己: '酉', 辛: '子', 癸: '卯',
};

export function stageOf(me: Stem, branch: Branch): Stage {
  const start = branchIndex(CHANG_SHENG[me]);
  const at = branchIndex(branch);
  const forward = stemPolarity(me) === 'yang';
  const step = forward ? (at - start + 12) % 12 : (start - at + 12) % 12;
  return STAGES[step];
}

export function voidBranches(dayStem: Stem, dayBranch: Branch): [Branch, Branch] {
  const xunStart = (branchIndex(dayBranch) - stemIndex(dayStem) + 12) % 12;
  return [BRANCHES[(xunStart + 10) % 12], BRANCHES[(xunStart + 11) % 12]];
}

export function yearGanzhi(year: number): string {
  const i = (((year - 4) % 60) + 60) % 60;
  return STEMS[i % 10] + BRANCHES[i % 12];
}

export interface PlacedChar {
  at: string;
  char: Stem | Branch;
}

export type RelationKind =
  | '天干合' | '天干沖'
  | '六合' | '三合' | '半合' | '方合'
  | '沖' | '刑' | '自刑' | '破' | '害' | '怨嗔' | '鬼門';

export interface Relation {
  kind: RelationKind;

  chars: string;

  at: string[];

  element: Element | null;
}

type Pair = readonly [string, string];

const STEM_COMBOS: ReadonlyArray<readonly [string, string, Element]> = [
  ['甲', '己', 'earth'], ['乙', '庚', 'metal'], ['丙', '辛', 'water'], ['丁', '壬', 'wood'], ['戊', '癸', 'fire'],
];
const STEM_CLASHES: readonly Pair[] = [['甲', '庚'], ['乙', '辛'], ['丙', '壬'], ['丁', '癸']];
const SIX_COMBOS: ReadonlyArray<readonly [string, string, Element | null]> = [
  ['子', '丑', 'earth'], ['寅', '亥', 'wood'], ['卯', '戌', 'fire'], ['辰', '酉', 'metal'], ['巳', '申', 'water'], ['午', '未', null],
];

const TRIPLE_COMBOS: ReadonlyArray<readonly [string, string, string, Element]> = [
  ['申', '子', '辰', 'water'], ['亥', '卯', '未', 'wood'], ['寅', '午', '戌', 'fire'], ['巳', '酉', '丑', 'metal'],
];
const SEASON_COMBOS: ReadonlyArray<readonly [string, string, string, Element]> = [
  ['寅', '卯', '辰', 'wood'], ['巳', '午', '未', 'fire'], ['申', '酉', '戌', 'metal'], ['亥', '子', '丑', 'water'],
];
const CLASHES: readonly Pair[] = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];

const PUNISHMENTS: readonly Pair[] = [
  ['寅', '巳'], ['巳', '申'], ['寅', '申'], ['丑', '戌'], ['戌', '未'], ['丑', '未'], ['子', '卯'],
];
const SELF_PUNISH = new Set(['辰', '午', '酉', '亥']);
const BREAKS: readonly Pair[] = [['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['未', '戌']];
const HARMS: readonly Pair[] = [['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']];
const WONJIN: readonly Pair[] = [['子', '未'], ['丑', '午'], ['寅', '酉'], ['卯', '申'], ['辰', '亥'], ['巳', '戌']];
const GWIMUN: readonly Pair[] = [['子', '酉'], ['丑', '午'], ['寅', '未'], ['卯', '申'], ['辰', '亥'], ['巳', '戌']];

const isStem = (c: string) => (STEMS as readonly string[]).includes(c);

function pairMatch(pairs: readonly Pair[], a: string, b: string): Pair | null {
  return pairs.find(([x, y]) => (x === a && y === b) || (x === b && y === a)) ?? null;
}

export function relationsAmong(chars: readonly PlacedChar[], pivot?: string): Relation[] {
  const out: Relation[] = [];
  const stems = chars.filter((c) => isStem(c.char));
  const branches = chars.filter((c) => !isStem(c.char));

  for (let i = 0; i < stems.length; i += 1) {
    for (let j = i + 1; j < stems.length; j += 1) {
      const a = stems[i];
      const b = stems[j];
      const combo = STEM_COMBOS.find(([x, y]) => (x === a.char && y === b.char) || (x === b.char && y === a.char));
      if (combo) out.push({ kind: '天干合', chars: a.char + b.char, at: [a.at, b.at], element: combo[2] });
      if (pairMatch(STEM_CLASHES, a.char, b.char)) out.push({ kind: '天干沖', chars: a.char + b.char, at: [a.at, b.at], element: null });
    }
  }

  for (let i = 0; i < branches.length; i += 1) {
    for (let j = i + 1; j < branches.length; j += 1) {
      const a = branches[i];
      const b = branches[j];
      const chars2 = a.char + b.char;
      const at2 = [a.at, b.at];
      const six = SIX_COMBOS.find(([x, y]) => (x === a.char && y === b.char) || (x === b.char && y === a.char));
      if (six) out.push({ kind: '六合', chars: chars2, at: at2, element: six[2] });
      const tri = TRIPLE_COMBOS.find((t) => t.includes(a.char) && t.includes(b.char) && a.char !== b.char);

      if (tri && (a.char === tri[1] || b.char === tri[1])) out.push({ kind: '半合', chars: chars2, at: at2, element: tri[3] });
      if (pairMatch(CLASHES, a.char, b.char)) out.push({ kind: '沖', chars: chars2, at: at2, element: null });
      if (pairMatch(PUNISHMENTS, a.char, b.char)) out.push({ kind: '刑', chars: chars2, at: at2, element: null });
      if (a.char === b.char && SELF_PUNISH.has(a.char)) out.push({ kind: '自刑', chars: chars2, at: at2, element: null });
      if (pairMatch(BREAKS, a.char, b.char)) out.push({ kind: '破', chars: chars2, at: at2, element: null });
      if (pairMatch(HARMS, a.char, b.char)) out.push({ kind: '害', chars: chars2, at: at2, element: null });
      if (pairMatch(WONJIN, a.char, b.char)) out.push({ kind: '怨嗔', chars: chars2, at: at2, element: null });
      if (pairMatch(GWIMUN, a.char, b.char)) out.push({ kind: '鬼門', chars: chars2, at: at2, element: null });
    }
  }

  for (const [kind, table] of [['三合', TRIPLE_COMBOS], ['方合', SEASON_COMBOS]] as const) {
    for (const [x, y, z, element] of table) {
      const hit = [x, y, z].map((c) => branches.find((b) => b.char === c));
      if (hit.every(Boolean)) {
        out.push({ kind, chars: x + y + z, at: hit.map((h) => (h as PlacedChar).at), element });
      }
    }
  }

  return pivot === undefined ? out : out.filter((r) => r.at.includes(pivot));
}

export type ShinsalName = '桃花' | '驛馬' | '華蓋' | '天乙貴人' | '文昌貴人' | '紅艶' | '羊刃' | '魁罡' | '白虎' | '空亡';

export interface Shinsal {
  name: ShinsalName;

  at: string[];

  basis: string;
}

const GROUP_STARS: ReadonlyArray<readonly [string, Branch, Branch, Branch]> = [
  ['申子辰', '酉', '寅', '辰'],
  ['寅午戌', '卯', '申', '戌'],
  ['巳酉丑', '午', '亥', '丑'],
  ['亥卯未', '子', '巳', '未'],
];

const NOBLE: Record<Stem, readonly Branch[]> = {
  甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
  乙: ['子', '申'], 己: ['子', '申'],
  丙: ['亥', '酉'], 丁: ['亥', '酉'],
  辛: ['寅', '午'],
  壬: ['巳', '卯'], 癸: ['巳', '卯'],
};
const LITERARY: Record<Stem, Branch> = {
  甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯',
};
const RED_GLOW: Record<Stem, Branch> = {
  甲: '午', 乙: '午', 丙: '寅', 丁: '未', 戊: '辰', 己: '辰', 庚: '戌', 辛: '酉', 壬: '子', 癸: '申',
};

const BLADE: Partial<Record<Stem, Branch>> = { 甲: '卯', 丙: '午', 戊: '午', 庚: '酉', 壬: '子' };

const KUIGANG = new Set(['庚辰', '庚戌', '壬辰', '戊戌']);
const WHITE_TIGER = new Set(['甲辰', '乙未', '丙戌', '丁丑', '戊辰', '壬戌', '癸丑']);

export interface PlacedPillar {
  at: string;
  stem: Stem;
  branch: Branch;
}

export function shinsalOf(natal: readonly PlacedPillar[], targets?: readonly PlacedPillar[]): Shinsal[] {
  const day = natal.find((p) => p.at === 'day');
  const year = natal.find((p) => p.at === 'year');
  if (!day) return [];
  const where = targets ?? natal;
  const out: Shinsal[] = [];
  const push = (name: ShinsalName, at: string[], basis: string) => {
    if (at.length === 0) return;
    const same = out.find((s) => s.name === name && s.basis === basis);
    if (same) same.at = [...new Set([...same.at, ...at])];
    else out.push({ name, at, basis });
  };
  const hitsOf = (branches: readonly Branch[], skip?: string) =>
    where.filter((p) => branches.includes(p.branch) && p.at !== skip).map((p) => p.at);

  for (const base of [year, day]) {
    if (!base) continue;
    const group = GROUP_STARS.find(([g]) => g.includes(base.branch));
    if (!group) continue;
    const basis = `${base.at === 'year' ? '年支' : '日支'} ${base.branch}`;
    push('桃花', hitsOf([group[1]], base.at), basis);
    push('驛馬', hitsOf([group[2]], base.at), basis);
    push('華蓋', hitsOf([group[3]], base.at), basis);
  }

  const dm = `日干 ${day.stem}`;
  push('天乙貴人', hitsOf(NOBLE[day.stem]), dm);
  push('文昌貴人', hitsOf([LITERARY[day.stem]]), dm);
  push('紅艶', hitsOf([RED_GLOW[day.stem]]), dm);
  const blade = BLADE[day.stem];
  if (blade) push('羊刃', hitsOf([blade]), dm);
  push('空亡', hitsOf(voidBranches(day.stem, day.branch), targets ? undefined : 'day'), `日柱 ${day.stem}${day.branch}`);

  if (!targets) {
    if (KUIGANG.has(day.stem + day.branch)) push('魁罡', ['day'], `日柱 ${day.stem}${day.branch}`);
    push('白虎', natal.filter((p) => WHITE_TIGER.has(p.stem + p.branch)).map((p) => p.at), '柱');
  } else {
    push('白虎', targets.filter((p) => WHITE_TIGER.has(p.stem + p.branch)).map((p) => p.at), '柱');
  }
  return out;
}
