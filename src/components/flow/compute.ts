import { LIBRARY } from '@/content/library';
import { dateLocale } from '@/content/locale';
import { TYPE_PROFILES } from '@/content/types';
import { buildReading, type Reading, type TypeProfile } from '@/lib/reading';
import { computeChart, type BirthInput, type Chart, type TypeKey } from '@/lib/saju';
import type { Answers } from './answers';

export function birthInputFrom(a: Answers): BirthInput | null {
  if (!a.date || !a.timeAnswered || !a.place) return null;
  return {
    date: a.date,
    time: a.time,
    place: {
      name: a.place.name,
      country: a.place.country,
      lat: a.place.lat,
      lng: a.place.lng,
      tz: a.place.tz,
    },
    sex: a.sex,
  };
}

export interface ResultData {
  chart: Chart;
  reading: Reading;
  profile: TypeProfile;
  nowIso: string;
}

export function computeResult(a: Answers): ResultData | null {
  const input = birthInputFrom(a);
  if (!input || !a.focus) return null;
  try {
    const nowIso = new Date().toISOString();
    const chart = computeChart(input);
    const locale = dateLocale();
    const reading = buildReading(chart, a.focus, nowIso, LIBRARY, { locale });
    return { chart, reading, profile: TYPE_PROFILES[reading.type], nowIso };
  } catch {
    return null;
  }
}

export interface TypeResult {
  type: TypeKey;
  profile: TypeProfile;

  alts: TypeKey[];

  approximate: boolean;
}

function shiftDay(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(t.getUTCFullYear(), 4)}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

function deviceZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function computeTypeResult(a: Answers): TypeResult | null {
  if (!a.date || !a.midnight) return null;
  try {
    if (a.midnight === 'yes' && a.time && a.place) {
      const chart = computeChart({
        date: a.date,
        time: a.time,
        place: {
          name: a.place.name,
          country: a.place.country,
          lat: a.place.lat,
          lng: a.place.lng,
          tz: a.place.tz,
        },
        sex: null,
      });
      const type = chart.dayMaster.type;
      const alts = chart.flags.ziHourAmbiguous && chart.flags.altType && chart.flags.altType !== type ? [chart.flags.altType] : [];
      return { type, profile: TYPE_PROFILES[type], alts, approximate: false };
    }

    const tz = deviceZone();
    const noonAt = (date: string) =>
      computeChart(
        { date, time: '12:00', place: { name: tz, country: '', lat: 0, lng: 0, tz }, sex: null },
        { solarTime: 'standard' },
      ).dayMaster.type;
    const type = noonAt(a.date);
    const alts: TypeKey[] = [];
    if (a.midnight === 'unsure' || (a.midnight === 'yes' && !a.time)) {
      for (const t of [noonAt(shiftDay(a.date, -1)), noonAt(shiftDay(a.date, 1))]) {
        if (t !== type && !alts.includes(t)) alts.push(t);
      }
    }
    return { type, profile: TYPE_PROFILES[type], alts, approximate: true };
  } catch {
    return null;
  }
}
