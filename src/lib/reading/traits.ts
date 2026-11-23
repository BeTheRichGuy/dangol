import { godGroup, isClash, pillarFromGanzhi } from '@/lib/saju/tables';
import type { Chart, Element, GodGroup } from '@/lib/saju/types';

export type NatalShape = Pick<Chart, 'pillars' | 'dayMaster' | 'elements'>;
import { chapterStartDates } from './chapter-dates';
import { pickByHash } from './hash';
import type {
  ChapterInfo,
  TraitChapterText,
  TraitFeatures,
  TraitHit,
  TraitKind,
  TraitLibrary,
  TraitLine,
  TraitReading,
  TraitStrength,
} from './traits-types';

export const STRENGTH_THRESHOLDS = {

  gentleBelow: 0.28,

  strongFrom: 0.53,
} as const;

const LEADING_BONUS = 0.5;

const DOMINANT_ORDER: readonly GodGroup[] = ['power', 'wealth', 'output', 'resource', 'peer'];

const RUNNER_UP_MIN = { withHour: 2, withoutHour: 1 } as const;

const MISSING_ORDER: readonly GodGroup[] = ['wealth', 'power', 'output', 'resource', 'peer'];

const ELEMENTS: readonly Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

interface Glyph {
  element: Element;
  weight: number;

  leading?: boolean;
}

function glyphsOf(chart: NatalShape): Glyph[] {
  const { year, month, day, hour } = chart.pillars;
  const glyphs: Glyph[] = [
    { element: year.stemElement, weight: 1 },
    { element: month.stemElement, weight: 1 },
    { element: year.branchElement, weight: 1 },
    { element: month.branchElement, weight: 2, leading: true },
    { element: day.branchElement, weight: 1 },
  ];
  if (hour) {
    glyphs.push({ element: hour.stemElement, weight: 1 }, { element: hour.branchElement, weight: 1 });
  }
  return glyphs;
}

export function helpShare(chart: NatalShape): number {
  const me = chart.dayMaster.element;
  let help = 0;
  let total = 0;
  let leadingHelps = false;
  for (const g of glyphsOf(chart)) {
    total += g.weight;
    const god = godGroup(me, g.element);
    if (god === 'peer' || god === 'resource') {
      help += g.weight;
      if (g.leading) leadingHelps = true;
    }
  }
  return (help + (leadingHelps ? LEADING_BONUS : 0)) / total;
}

export function strengthOf(share: number): TraitStrength {
  if (share < STRENGTH_THRESHOLDS.gentleBelow) return 'gentle';
  if (share >= STRENGTH_THRESHOLDS.strongFrom) return 'strong';
  return 'balanced';
}

function rankGods(chart: NatalShape): { order: GodGroup[]; count: Record<GodGroup, number> } {
  const me = chart.dayMaster.element;
  const count: Record<GodGroup, number> = { peer: 0, output: 0, wealth: 0, power: 0, resource: 0 };

  for (const g of glyphsOf(chart)) count[godGroup(me, g.element)] += 1;
  const monthBranchGod = godGroup(me, chart.pillars.month.branchElement);
  const monthStemGod = godGroup(me, chart.pillars.month.stemElement);
  const tieRank = (god: GodGroup) =>
    god === monthBranchGod ? 0 : god === monthStemGod ? 1 : 2 + DOMINANT_ORDER.indexOf(god);
  const order = [...DOMINANT_ORDER].sort((a, b) => count[b] - count[a] || tieRank(a) - tieRank(b));
  return { order, count };
}

function dominantOf(chart: NatalShape): GodGroup {
  return rankGods(chart).order[0];
}

export function runnerUpOf(chart: NatalShape): GodGroup | null {
  const { order, count } = rankGods(chart);
  const min = chart.pillars.hour ? RUNNER_UP_MIN.withHour : RUNNER_UP_MIN.withoutHour;
  return count[order[1]] >= min ? order[1] : null;
}

function missingOf(chart: NatalShape): Element | null {
  const me = chart.dayMaster.element;
  const absent = ELEMENTS.filter((e) => chart.elements[e] === 0);
  if (absent.length === 0) return null;
  const rank = (e: Element) => MISSING_ORDER.indexOf(godGroup(me, e));
  return absent.reduce((a, b) => (rank(b) < rank(a) ? b : a));
}

function tensionOf(chart: NatalShape): boolean {
  const { year, month, day } = chart.pillars;
  return isClash(day.branch, month.branch) || isClash(day.branch, year.branch);
}

export function traitFeatures(chart: NatalShape): TraitFeatures {
  return {
    strength: strengthOf(helpShare(chart)),
    dominant: dominantOf(chart),
    palace: godGroup(chart.dayMaster.element, chart.pillars.day.branchElement),
    missing: missingOf(chart),
    tension: tensionOf(chart),
  };
}

function seedBase(chart: Chart): string {
  const { date, time, place } = chart.input;
  return [date, time ?? 'unknown', place.name, place.country].join('|');
}

function hitFrom(kind: TraitKind, pool: readonly TraitLine[], seed: string): TraitHit {
  const line = pickByHash(pool, seed);
  return { id: line.id, kind, text: line.text };
}

function requirePool(pool: readonly TraitLine[] | undefined, label: string): readonly TraitLine[] {
  if (!pool?.length) throw new RangeError(`buildTraits: library has no lines for ${label}`);
  return pool;
}

export function buildTraits(chart: Chart, lib: TraitLibrary): TraitReading {
  const features = traitFeatures(chart);
  const base = seedBase(chart);
  const type = chart.dayMaster.type;

  const core = hitFrom(
    'core',
    requirePool(lib.core[type]?.[features.strength], `core/${type}/${features.strength}`),
    `${base}|trait-core`,
  );
  const sameGroup = !features.tension && features.dominant === features.palace;
  const patternGroup = (sameGroup && runnerUpOf(chart)) || features.dominant;
  const pattern = hitFrom(
    'pattern',
    requirePool(lib.pattern[patternGroup], `pattern/${patternGroup}`),
    `${base}|trait-pattern`,
  );
  const third = features.tension
    ? hitFrom('tension', requirePool(lib.tension, 'tension'), `${base}|trait-tension`)
    : hitFrom('love', requirePool(lib.love[features.palace], `love/${features.palace}`), `${base}|trait-love`);

  let bonus: TraitHit | null = null;
  if (features.missing) {
    const pool = lib.missing[features.missing];
    if (pool?.length) bonus = hitFrom('missing', pool, `${base}|trait-missing`);
  }

  return { features, hits: [core, pattern, third], bonus };
}

export function ageAt(birthDate: string, nowUtcIso: string): number {
  const now = new Date(nowUtcIso);
  if (Number.isNaN(now.getTime())) {
    throw new RangeError('ageAt: nowUtcIso must be an ISO 8601 instant');
  }
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const nm = now.getUTCMonth() + 1;
  const nd = now.getUTCDate();
  let age = now.getUTCFullYear() - by;
  if (nm < bm || (nm === bm && nd < bd)) age -= 1;
  return age;
}

function chapterOf(
  chart: Chart,
  ganzhi: string,
  lib: TraitLibrary,
): { group: GodGroup; samePolarity: boolean; text: TraitChapterText } {
  const stem = pillarFromGanzhi(ganzhi);
  const group = godGroup(chart.dayMaster.element, stem.stemElement);
  const samePolarity = stem.stemPolarity === chart.dayMaster.polarity;
  const text = lib.chapters10?.[group]?.[samePolarity ? 'same' : 'other'] ?? lib.chapters[group];
  if (!text) throw new RangeError(`currentChapter: library has no chapter text for ${group}`);
  return { group, samePolarity, text };
}

function utcDate(nowUtcIso: string): string {
  const now = new Date(nowUtcIso);
  if (Number.isNaN(now.getTime())) {
    throw new RangeError('currentChapter: nowUtcIso must be an ISO 8601 instant');
  }
  return now.toISOString().slice(0, 10);
}

export function currentChapter(chart: Chart, nowUtcIso: string, lib: TraitLibrary): ChapterInfo | null {
  const yun = chart.daYun;
  if (!yun || yun.list.length === 0) return null;

  const today = utcDate(nowUtcIso);
  const starts = chapterStartDates(chart);
  let index = 0;
  let beforeStart: boolean;
  if (starts) {
    for (let i = 0; i < starts.length; i += 1) {
      if (starts[i] <= today) index = i;
    }
    beforeStart = today < starts[0];
  } else {
    const age = ageAt(chart.input.date, nowUtcIso);
    for (let i = 0; i < yun.list.length; i += 1) {
      if (yun.list[i].startAge <= age) index = i;
    }
    beforeStart = age < yun.list[0].startAge;
  }

  const cycle = yun.list[index];
  const { group, samePolarity, text } = chapterOf(chart, cycle.ganzhi, lib);

  const nextCycle = yun.list[index + 1];
  let next: ChapterInfo['next'] = null;
  if (nextCycle) {
    next = { title: chapterOf(chart, nextCycle.ganzhi, lib).text.title, startAge: nextCycle.startAge };
  }

  return {
    index,
    total: yun.list.length,
    startAge: cycle.startAge,
    endAge: cycle.startAge + 9,
    startYear: cycle.startYear,
    endYear: cycle.startYear + 9,
    ganzhi: cycle.ganzhi,
    group,
    samePolarity,
    title: text.title,
    line: text.line,
    next,
    ...(beforeStart ? { beforeStart: true } : {}),
  };
}
