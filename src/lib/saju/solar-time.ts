import { DateTime } from 'luxon';
import type { SolarTimeMode } from './types';

export function equationOfTimeMinutes(utcMs: number): number {
  const d = DateTime.fromMillis(utcMs, { zone: 'utc' });
  const dayOfYear = d.ordinal + (d.hour + d.minute / 60 + d.second / 3600) / 24;
  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

function wrapToHalfDay(minutes: number): number {
  return ((((minutes + 720) % 1440) + 1440) % 1440) - 720;
}

export function solarOffsetMinutes(
  mode: SolarTimeMode,
  lngDeg: number,
  wallOffsetMinutes: number,
  utcMs: number,
): number {
  if (mode === 'standard') return 0;
  const meanSolarOffset = (lngDeg / 15) * 60;
  const eot = mode === 'apparent' ? equationOfTimeMinutes(utcMs) : 0;

  return wrapToHalfDay(Math.round(meanSolarOffset + eot - wallOffsetMinutes)) || 0;
}
