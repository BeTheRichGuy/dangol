import { CONCERNS, type ConcernKey } from '@/content/concerns';
import { gapLibraryFor } from '@/content/continue';
import { LIBRARY } from '@/content/library';
import { PEOPLE_KO } from '@/content/ko/people';
import { TEASERS_KO } from '@/content/ko/teasers';
import { activeLocale, dateLocale } from '@/content/locale';
import type { ChapterWhen } from '@/content/result-ui';
import { TRAITS } from '@/content/traits';
import { TYPE_PROFILES } from '@/content/types';
import { UI } from '@/content/ui';
import {
  buildReading,
  chapterStartDates,
  isConcernKey,
  pickConcernLine,
  type ConcernLine,
  type Reading,
  type TypeProfile,
} from '@/lib/reading';
import { fateMapOf, type FateMap } from '@/lib/reading/fate-map';
import { peoplePreview, type PeoplePreview } from '@/lib/reading/people-preview';
import { gapCard, teaserCards, type TeaserCard } from '@/lib/reading/teasers';
import { buildTraits, currentChapter } from '@/lib/reading/traits';
import type { ChapterInfo, TraitReading } from '@/lib/reading/traits-types';
import { computeChart, type Chart } from '@/lib/saju';
import { hasFateMap, isContinueLocale } from '@/lib/rooms/continue-locales';
import type { Answers } from '../flow/answers';
import { birthInputFrom } from '../flow/compute';

export interface ResultModel {
  chart: Chart;
  reading: Reading;
  profile: TypeProfile;
  nowIso: string;

  traits: TraitReading | null;

  chapter: ChapterInfo | null;

  concern: ConcernKey | null;

  concernLine: ConcernLine | null;

  people: PeoplePreview | null;

  teasers: TeaserCard[] | null;

  fate: FateMap | null;
}

const LEGACY_CONCERN: Record<string, ConcernKey> = { someone: 'crush', everything: 'self' };

export function concernOf(focus: string | null | undefined): ConcernKey {
  if (isConcernKey(focus)) return focus;
  return (focus ? LEGACY_CONCERN[focus] : undefined) ?? 'love';
}

export function buildResultModel(a: Answers, nowIso: string = new Date().toISOString()): ResultModel | null {
  const input = birthInputFrom(a);

  const focus = a.concern ?? a.focus ?? 'everything';
  if (!input) return null;
  try {
    const chart = computeChart(input);

    const reading = buildReading(chart, focus, nowIso, LIBRARY, { locale: dateLocale() });

    let traits: TraitReading | null = null;
    try {
      traits = buildTraits(chart, TRAITS);
    } catch {
      traits = null;
    }
    let chapter: ChapterInfo | null = null;
    try {
      chapter = currentChapter(chart, nowIso, TRAITS);

      if (chapter && chapter.index === chapter.total - 1 && Number(nowIso.slice(0, 4)) > chapter.endYear) chapter = null;
    } catch {
      chapter = null;
    }

    const concern = a.concern ?? (a.focus ? concernOf(a.focus) : null);
    let concernLine: ConcernLine | null = null;
    if (concern) {
      try {
        concernLine = pickConcernLine(chart, concern, nowIso, CONCERNS[concern].lines, { locale: dateLocale() });
      } catch {
        concernLine = null;
      }
    }

    let people: PeoplePreview | null = null;
    let teasers: TeaserCard[] | null = null;
    let fate: FateMap | null = null;
    if (isContinueLocale(activeLocale())) {
      try {
        const gap = gapLibraryFor(activeLocale());
        if (gap) {

          const card = gapCard(chart, gap);
          teasers = card ? [card] : [];
        } else {
          people = peoplePreview(chart, PEOPLE_KO);
          teasers = teaserCards(chart, nowIso, chapter, people, TEASERS_KO);
        }
      } catch {
        people = null;
        teasers = null;
      }
    }

    if (hasFateMap(activeLocale())) {
      try {
        fate = fateMapOf(chart, nowIso);
      } catch {
        fate = null;
      }
    }

    return { chart, reading, profile: TYPE_PROFILES[reading.type], nowIso, traits, chapter, concern, concernLine, people, teasers, fate };
  } catch {
    return null;
  }
}

export function withSex(a: Answers, sex: 'female' | 'male', nowIso: string): ResultModel | null {
  return buildResultModel({ ...a, sex, sexAnswered: true }, nowIso);
}

export function chapterWhen(chapter: ChapterInfo | null, chart: Chart): ChapterWhen | null {
  if (!chapter) return null;
  const direct = (chapter as ChapterInfo & { startDate?: unknown }).startDate;
  let raw: string | null = typeof direct === 'string' ? direct : null;
  if (raw === null) {
    try {
      raw = chapterStartDates(chart)?.[chapter.index] ?? null;
    } catch {
      raw = null;
    }
  }
  if (raw === null) return null;
  const m = /^(\d{4})-(\d{2})-\d{2}/.exec(raw);
  if (!m) return null;
  const month = UI.months[Number(m[2]) - 1];
  return month ? { month, year: Number(m[1]) } : null;
}
