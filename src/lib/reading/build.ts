import { currentSeason } from '@/lib/saju/season';
import { JIE_TABLE, jieIndex } from '@/lib/saju/tables';
import type { Chart } from '@/lib/saju/types';
import { bookForConcern } from './concerns';
import { pickByHash } from './hash';
import { notCursePhrase, whenPhrase } from './phrases';
import { scoreSalt } from './score';
import { seedBaseOf } from './seed';
import type {
  CandyBook,
  CandyLine,
  Reading,
  ReadingFocus,
  ReadingLibrary,
  SaltLine,
} from './types';

export interface BuildReadingOptions {

  locale?: string;
}

export function bookOf(focus: ReadingFocus): CandyBook {
  if (focus === 'everything') return 'general';
  if (focus === 'someone') return 'love';
  return bookForConcern(focus);
}

export function buildReading(
  chart: Chart,
  focus: ReadingFocus,
  nowUtcIso: string,
  lib: ReadingLibrary,
  opts: BuildReadingOptions = {},
): Reading {
  const season = currentSeason(nowUtcIso);
  const { monthGod, score, level, reasons } = scoreSalt(chart, season);
  const book = bookOf(focus);

  const seedBase = seedBaseOf(chart, season);

  const candyPool = lib.candy[book][monthGod];
  const saltPool = lib.salt[level][monthGod];
  if (!candyPool?.length || !saltPool?.length) {
    throw new RangeError(`buildReading: library has no lines for ${book}/${level}/${monthGod}`);
  }
  const candy: CandyLine = pickByHash(candyPool, `${seedBase}|candy`);
  const saltPick = pickByHash(saltPool, `${seedBase}|salt`);

  const here = jieIndex(season.hanzi);
  const nextName = JIE_TABLE[(here + 1) % JIE_TABLE.length].name;
  const line: SaltLine = {
    id: saltPick.id,
    when: whenPhrase(season.name, nextName, season.end, opts.locale ?? 'en-US'),
    situation: saltPick.situation,
    action: saltPick.action,
    notCurse: notCursePhrase(),
  };

  return {
    type: chart.dayMaster.type,
    focus,
    season,
    monthGod,
    candy: { id: candy.id, text: candy.text },
    salt: { level, score, line },
    reasons,
  };
}
