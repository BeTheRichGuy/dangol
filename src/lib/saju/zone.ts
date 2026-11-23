import { IANAZone } from 'luxon';

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

export interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function isRealDate(year: number, month: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

export function isValidZone(tz: string): boolean {
  return IANAZone.isValidZone(tz);
}

export function resolveWallClock(tz: string, w: WallClock): number {
  const zone = IANAZone.create(tz);
  const local = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);

  const before = zone.offset(local - 36 * HOUR_MS);
  const after = zone.offset(local + 36 * HOUR_MS);

  const valid: number[] = [];
  for (const offset of new Set([before, after])) {
    const utc = local - offset * MINUTE_MS;
    if (zone.offset(utc) === offset) valid.push(utc);
  }
  if (valid.length === 0) return local - before * MINUTE_MS;
  return Math.min(...valid);
}

export function offsetAt(tz: string, utcMs: number): number {
  return IANAZone.create(tz).offset(utcMs);
}
