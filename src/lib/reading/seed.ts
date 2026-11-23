import type { Chart, SeasonWindow } from '@/lib/saju/types';

export function seedBaseOf(chart: Chart, season: SeasonWindow): string {
  const { date, time, place } = chart.input;
  return [date, time ?? 'unknown', place.name, place.country, season.monthGanzhi].join('|');
}
