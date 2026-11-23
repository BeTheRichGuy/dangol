import { computeChart } from '@/lib/saju';
import type { BirthInput, ChartOptions } from '@/lib/saju';

export function solarHourOf(
  input: {
    date: string | null | undefined;
    time: string | null | undefined;
    place: BirthInput['place'] | null | undefined;
  },
  opts: ChartOptions = {},
): string | null {
  const { date, time, place } = input;
  if (!date || !time || !place) return null;
  try {
    const chart = computeChart({ date, time, place, sex: null }, opts);
    return chart.meta.solarLocal.slice(-5);
  } catch {
    return null;
  }
}
