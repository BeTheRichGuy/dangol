import { godGroup, pillarFromGanzhi } from '@/lib/saju/tables';
import type { Chart, GodGroup } from '@/lib/saju/types';
import { luckBlock, yearLucks } from '@/lib/rooms/payload';
import { YEAR_ROOM_YEAR, type RoomKey } from '@/lib/rooms/themes';
import type { PeoplePreview } from './people-preview';
import type { ChapterInfo } from './traits-types';

export type TeaserKind = 'timing' | 'people' | 'gap';

export interface TeaserLock {
  room: RoomKey;

  sections: number[];

  items: string[];
}

export interface TeaserCard {
  id: string;
  kind: TeaserKind;

  lead: string;

  body: string;

  hidden: number;

  evidence: string;
  lock: TeaserLock;
}

export const DAEYUN_HORIZON_MONTHS = 36;

export type YearRelation = 'clash' | 'harmony' | 'none';

export interface TeaserLibrary {

  when: (nowYear: number, year: number, month: number) => string;
  daeyun: (v: { when: string; cur: string; next: string; group: GodGroup; monthsAhead: number; start: { y: number; m: number } }) => { lead: string; body: string; hidden: number; evidence: string };
  year: (v: { year: number; relation: YearRelation; group: GodGroup }) => { lead: string; body: string; hidden: number; evidence: string };
  people: (v: { careful: string; near: string }) => { lead: string; body: string; hidden: number };
  gap: (v: { group: GodGroup; count: number }) => { lead: string; body: string; hidden: number; evidence: string };
  lockDaeyun: TeaserLock;
  lockYear: TeaserLock;
  lockYearOther: TeaserLock;
  lockPeople: TeaserLock;
  lockGap: Record<GodGroup, TeaserLock>;
}

const TEN_GOD_GROUP: Record<string, GodGroup> = {
  比肩: 'peer', 劫財: 'peer', 食神: 'output', 傷官: 'output', 偏財: 'wealth', 正財: 'wealth', 偏官: 'power', 正官: 'power', 偏印: 'resource', 正印: 'resource',
};

const GAP_ORDER: readonly GodGroup[] = ['wealth', 'power', 'output', 'resource', 'peer'];

function ym(iso: string): { y: number; m: number } {
  return { y: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)) };
}

export function groupCounts(chart: Pick<Chart, 'elements' | 'dayMaster'>): Record<GodGroup, number> {
  const out: Record<GodGroup, number> = { peer: 0, output: 0, wealth: 0, power: 0, resource: 0 };
  for (const el of Object.keys(chart.elements) as (keyof Chart['elements'])[]) {
    out[godGroup(chart.dayMaster.element, el)] += chart.elements[el];
  }

  out.peer = Math.max(0, out.peer - 1);
  return out;
}

function timingCard(chart: Chart, nowIso: string, chapter: ChapterInfo | null, lib: TeaserLibrary): TeaserCard {
  const now = ym(nowIso);
  const luck = luckBlock(chart, nowIso);
  const next = chapter && luck ? luck.periods[chapter.index + 1] : undefined;
  if (chapter && !chapter.beforeStart && chapter.next && next?.startMonth) {
    const start = ym(next.startMonth);
    const monthsAhead = (start.y - now.y) * 12 + (start.m - now.m);
    if (monthsAhead >= 1 && monthsAhead <= DAEYUN_HORIZON_MONTHS) {
      const group = TEN_GOD_GROUP[next.stemGod];
      const text = lib.daeyun({ when: lib.when(now.y, start.y, start.m), cur: chapter.title, next: chapter.next.title, group, monthsAhead, start });
      return {
        id: 'timing-daeyun',
        kind: 'timing',
        ...text,
        lock: lib.lockDaeyun,
      };
    }
  }

  const year = now.y + 1;
  const y = yearLucks(chart, luck, year, year)[0];
  const day = (r: { at: string[] }) => r.at.includes('yearLuck') && r.at.includes('day');
  const relation: YearRelation = y.relations.some((r) => r.kind === '沖' && day(r)) ? 'clash' : y.relations.some((r) => (r.kind === '六合' || r.kind === '半合') && day(r)) ? 'harmony' : 'none';
  const group = godGroup(chart.dayMaster.element, pillarFromGanzhi(y.ganzhi).stemElement);
  const text = lib.year({ year, relation, group });
  return {
    id: `timing-year-${relation}`,
    kind: 'timing',
    ...text,
    lock: year === YEAR_ROOM_YEAR ? lib.lockYear : lib.lockYearOther,
  };
}

function peopleCard(people: PeoplePreview, lib: TeaserLibrary): TeaserCard {
  const firstSentence = (s: string) => s.split(/(?<=[.!?])\s+/)[0] ?? s;
  const text = lib.people({ careful: people.careful.text, near: firstSentence(people.near.text) });

  return { id: `people-${people.careful.group}-${people.near.group}`, kind: 'people', ...text, evidence: `${people.near.basis}\n${people.careful.basis}`, lock: lib.lockPeople };
}

export function gapCard(chart: Chart, lib: Pick<TeaserLibrary, 'gap' | 'lockGap'>): TeaserCard | null {
  const counts = groupCounts(chart);
  const group = [...GAP_ORDER].sort((a, b) => counts[a] - counts[b] || GAP_ORDER.indexOf(a) - GAP_ORDER.indexOf(b))[0];
  if (counts[group] > 1) return null;
  const text = lib.gap({ group, count: counts[group] });
  return { id: `gap-${group}-${counts[group]}`, kind: 'gap', ...text, lock: lib.lockGap[group] };
}

export function teaserCards(chart: Chart, nowIso: string, chapter: ChapterInfo | null, people: PeoplePreview | null, lib: TeaserLibrary): TeaserCard[] {
  const out: TeaserCard[] = [timingCard(chart, nowIso, chapter, lib)];
  if (people) out.push(peopleCard(people, lib));
  const gap = gapCard(chart, lib);
  if (gap) out.push(gap);
  return out;
}
