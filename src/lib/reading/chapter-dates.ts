import { eightCharOf, lunarAtCst } from '@/lib/saju/calendar';
import type { Chart } from '@/lib/saju/types';
import type { LibSolar, LibYun } from 'lunar-javascript';

type YunWithStart = LibYun & { getStartSolar?: () => LibSolar };

const pad = (n: number, width: number) => String(n).padStart(width, '0');

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function lastDayOf(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function ymd(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(Math.min(day, lastDayOf(year, month)), 2)}`;
}

export function chapterStartDates(chart: Chart): string[] | null {
  const dayun = chart.daYun;
  const sex = chart.input.sex;
  if (!dayun || dayun.list.length === 0 || !sex) return null;

  const utcMs = Date.parse(chart.meta.utc);
  if (Number.isNaN(utcMs)) return null;

  const yun: YunWithStart = eightCharOf(lunarAtCst(utcMs), 2).getYun(sex === 'male' ? 1 : 0, 2);
  if (typeof yun.getStartSolar !== 'function') return null;
  if (yun.getStartYear() !== dayun.startAge || yun.isForward() !== dayun.forward) return null;

  const start = yun.getStartSolar();
  const [year, month, day] = [start.getYear(), start.getMonth(), start.getDay()];

  if (dayun.list.some((cycle, i) => cycle.startYear !== year + i * 10)) return null;
  return dayun.list.map((_, i) => ymd(year + i * 10, month, day));
}
