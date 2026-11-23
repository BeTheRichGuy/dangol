import { Lunar, LunarYear, Solar } from 'lunar-javascript';

export const LUNAR_YEAR_MIN = 1900;
export const LUNAR_YEAR_MAX = 2100;

export interface LunarDate {
  year: number;

  month: number;
  day: number;
  leap: boolean;
}

export type LunarToSolar =
  | { ok: true; iso: string }

  | { ok: false; error: 'year' | 'month' | 'day' | 'noLeap'; maxDay?: number; leapMonth?: number };

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

export function lunarToSolar(d: LunarDate): LunarToSolar {
  const { year, month, day, leap } = d;
  if (!Number.isInteger(year) || year < LUNAR_YEAR_MIN || year > LUNAR_YEAR_MAX) return { ok: false, error: 'year' };
  if (!Number.isInteger(month) || month < 1 || month > 12) return { ok: false, error: 'month' };
  const ly = LunarYear.fromYear(year);
  const m = ly.getMonth(leap ? -month : month);
  if (!m) return { ok: false, error: 'noLeap', leapMonth: ly.getLeapMonth() };
  const maxDay = m.getDayCount();
  if (!Number.isInteger(day) || day < 1 || day > maxDay) return { ok: false, error: 'day', maxDay };
  const s = Lunar.fromYmd(year, leap ? -month : month, day).getSolar();
  return { ok: true, iso: `${pad(s.getYear(), 4)}-${pad(s.getMonth())}-${pad(s.getDay())}` };
}

export function solarToLunar(iso: string): LunarDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < LUNAR_YEAR_MIN || y > LUNAR_YEAR_MAX) return null;
  const l = Solar.fromYmd(y, mo, d).getLunar();
  const month = l.getMonth();
  return { year: l.getYear(), month: Math.abs(month), day: l.getDay(), leap: month < 0 };
}
