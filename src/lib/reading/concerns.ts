import { currentSeason } from '@/lib/saju/season';
import { JIE_TABLE, jieIndex } from '@/lib/saju/tables';
import type { Chart, GodGroup, SeasonWindow } from '@/lib/saju/types';
import { pickByHash } from './hash';
import { nextTermPhrase } from './phrases';
import { monthGodOf } from './score';
import { seedBaseOf } from './seed';
import type { CandyBook, ConcernKey, ConcernLine } from './types';

export const CONCERN_KEYS = [
  'love', 'crush', 'ex', 'partner', 'marriage',
  'work', 'money', 'study', 'people', 'change', 'self',
] as const satisfies readonly ConcernKey[];

type MissingKeys = Exclude<ConcernKey, (typeof CONCERN_KEYS)[number]>;
const _allConcernKeysListed: [MissingKeys] extends [never] ? true : never = true;
void _allConcernKeysListed;

const LOVE_GROUP: ReadonlySet<ConcernKey> = new Set<ConcernKey>(['love', 'crush', 'ex', 'partner', 'marriage']);

export function isConcernKey(value: unknown): value is ConcernKey {
  return typeof value === 'string' && (CONCERN_KEYS as readonly string[]).includes(value);
}

export function bookForConcern(concern: ConcernKey): CandyBook {
  return LOVE_GROUP.has(concern) ? 'love' : 'general';
}

export const NEXT_SLOT = '{next}';

export interface PickConcernOptions {

  locale?: string;
}

export function pickConcernLine(
  chart: Chart,
  concern: ConcernKey,
  nowUtcIso: string,
  lines: Record<GodGroup, readonly ConcernLine[]>,
  opts: PickConcernOptions = {},
): ConcernLine {
  const season = currentSeason(nowUtcIso);
  const group = monthGodOf(chart, season);
  const pool = lines[group];
  if (!pool?.length) {
    throw new RangeError(`pickConcernLine: library has no lines for ${concern}/${group}`);
  }
  const pick = pickByHash(pool, `${seedBaseOf(chart, season)}|concern|${concern}`);
  const text = pick.text.includes(NEXT_SLOT)
    ? pick.text.split(NEXT_SLOT).join(nextTermPhraseOf(season, opts.locale ?? 'en-US'))
    : pick.text;
  return { id: pick.id, text };
}

function nextTermPhraseOf(season: SeasonWindow, locale: string): string {
  const nextName = JIE_TABLE[(jieIndex(season.hanzi) + 1) % JIE_TABLE.length].name;
  return nextTermPhrase(nextName, season.end, locale);
}
