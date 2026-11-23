import type { TeaserLibrary, TeaserLock } from '@/lib/reading/teasers';
import type { GodGroup } from '@/lib/saju/types';
import { fill } from './fate-copy';

export type FreeSeen = 'why' | 'more';

export interface ContinueCopy {
  sectionLabel: string;
  lead: string;
  questionsHeading: string;
  questions: readonly string[];
  menuHeading: string;
  tags: { why: string; more: string; new: string };
  legend: string;
  format: string;
  ctaLabel: string;
  confirm: {
    title: string;
    lead: string;
    opensToggle: string;
    price: (price: string) => string;
    period: string;
    keepSignedIn: string;
    refund: string;
    browse: string;
  };
  failure: { title: string; body: string; backToFree: string; retry: string };
  readHead: { title: string; seen: (typeName: string) => string };
}

export interface OfferAnswer {
  answer: string;
  free?: FreeSeen;
}

export interface StickyCopy {
  region: string;
  label: string;
  note: string;
}

export interface OtherKeepersCopy {
  sectionLabel: string;
  heading: string;
  lead: string;
  keepers: ReadonlyArray<{ key: 'mansin' | 'yeon' | 'reunion'; name: string; line: string }>;
  cta: string;
}

export interface FreeResultCopy {
  hiddenSr: string;
  questionLine: string;
}

export type GapLibrary = Pick<TeaserLibrary, 'gap' | 'lockGap'>;

export const LIFE_FREE_SEEN: ReadonlyArray<FreeSeen | null> = ['why', 'why', 'why', 'why', 'why', null, null, 'more', null, 'more', null, null];

export const GAP_LOCK_SECTIONS: Record<GodGroup, number[]> = { wealth: [7, 2], power: [6, 4], output: [5, 3], resource: [11, 9], peer: [4, 10] };

export interface ContinueData {
  pitch: {
    sectionLabel: string;
    lead: string;
    questionsHeading: string;
    questions: string[];
    menuHeading: string;
    tags: { why: string; more: string; new: string };
    legend: string;
    format: string;
    ctaLabel: string;
  };
  offer: string[];
  confirm: { title: string; lead: string; opensToggle: string; price: string; period: string; keepSignedIn: string; refund: string; browse: string };
  failure: { title: string; body: string; backToFree: string; retry: string };
  readHead: { title: string; seen: string };
  sticky: StickyCopy;
  keepers: { sectionLabel: string; heading: string; lead: string; mansin: string; yeon: string; reunion: string; cta: string };
  teaser: FreeResultCopy;
  gap: Record<GodGroup, { none: string; one: string; body: string }>;
}

export interface ContinueOptions {

  keeperNames: Record<'mansin' | 'yeon' | 'reunion', string>;

  lifeTitles: readonly string[];

  groupName: Record<GodGroup, string>;
  basis: (name: string, count: number) => string;
}

export function buildContinue(d: ContinueData, o: ContinueOptions) {
  const lock = (group: GodGroup): TeaserLock => ({ room: 'life', sections: GAP_LOCK_SECTIONS[group], items: GAP_LOCK_SECTIONS[group].map((n) => o.lifeTitles[n - 1]) });
  const gap: GapLibrary = {
    gap: ({ group, count }) => ({
      lead: count === 0 ? d.gap[group].none : d.gap[group].one,
      body: d.gap[group].body,
      hidden: 2,
      evidence: o.basis(o.groupName[group], count),
    }),
    lockGap: { wealth: lock('wealth'), power: lock('power'), output: lock('output'), resource: lock('resource'), peer: lock('peer') },
  };
  const continueCopy: ContinueCopy = {
    ...d.pitch,
    confirm: { ...d.confirm, price: (price: string) => fill(d.confirm.price, { price }) },
    failure: d.failure,
    readHead: { title: d.readHead.title, seen: (typeName: string) => fill(d.readHead.seen, { type: typeName }) },
  };
  const offer: OfferAnswer[] = d.offer.map((answer, i) => ({ answer, free: LIFE_FREE_SEEN[i] ?? undefined }));
  const keepers: OtherKeepersCopy = {
    sectionLabel: d.keepers.sectionLabel,
    heading: d.keepers.heading,
    lead: d.keepers.lead,
    keepers: [
      { key: 'mansin', name: o.keeperNames.mansin, line: d.keepers.mansin },
      { key: 'yeon', name: o.keeperNames.yeon, line: d.keepers.yeon },
      { key: 'reunion', name: o.keeperNames.reunion, line: d.keepers.reunion },
    ],
    cta: d.keepers.cta,
  };
  return { continueCopy, offer, sticky: d.sticky, keepers, teaser: d.teaser, gap };
}
