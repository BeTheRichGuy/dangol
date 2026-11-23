import { DateTime } from 'luxon';
import { jieInstantMs, lunarAtCst } from './calendar';
import { JIE_TABLE, jieIndex } from './tables';
import type { SeasonWindow } from './types';

export function currentSeason(nowUtcIso: string): SeasonWindow {
  const now = DateTime.fromISO(nowUtcIso, { zone: 'utc' });
  if (!now.isValid) throw new RangeError('currentSeason: nowUtcIso must be an ISO 8601 string');

  const lunar = lunarAtCst(now.toMillis());
  const prev = lunar.getPrevJie();
  const next = lunar.getNextJie();
  if (!prev || !next) throw new RangeError('currentSeason: date is outside the supported calendar range');

  const info = JIE_TABLE[jieIndex(prev.getName())];
  return {
    name: info.name,
    hanzi: info.hanzi,
    start: new Date(jieInstantMs(prev)).toISOString(),
    end: new Date(jieInstantMs(next)).toISOString(),
    monthGanzhi: lunar.getMonthInGanZhiExact(),
    yearGanzhi: lunar.getYearInGanZhiExact(),
  };
}
