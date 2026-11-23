import type { XmasDay } from './pulls';

export const XMAS_SEASON = {
  year: 2026,

  late: '2026-12-03',

  askFrom: '2026-12-10',
  askTo: '2026-12-18',
  lastCall: '2026-12-23',
  eve: '2026-12-24',

  close: '2026-12-25',
} as const;

export type XmasPhase = 'early' | 'late' | 'ask' | 'eve';

export function kstDate(nowMs: number): string {
  return new Date(nowMs + 9 * 3_600_000).toISOString().slice(0, 10);
}

export function xmasOnSale(nowMs: number): boolean {
  return kstDate(nowMs) < XMAS_SEASON.close;
}

export function daysToClose(nowMs: number): number {
  const left = Math.round((Date.parse(`${XMAS_SEASON.close}T00:00:00Z`) - Date.parse(`${kstDate(nowMs)}T00:00:00Z`)) / 86_400_000);
  return Math.max(0, left);
}

export function xmasPhase(today: string): XmasPhase | null {
  const s = XMAS_SEASON;
  if (today >= s.close) return null;
  if (today >= s.eve) return 'eve';
  if (today >= s.askFrom) return 'ask';
  if (today >= s.late) return 'late';
  return 'early';
}

function addDays(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

export function xmasAskDays(days: readonly XmasDay[], today: string): string[] {
  const phase = xmasPhase(today);
  if (!phase) return [];
  if (phase === 'eve') return [XMAS_SEASON.eve];
  const kind = new Map(days.map((d) => [d.date, d.kind]));
  const window: string[] = [];
  const end = today > XMAS_SEASON.askTo ? XMAS_SEASON.lastCall : XMAS_SEASON.askTo;
  for (let d = today > XMAS_SEASON.askFrom ? today : XMAS_SEASON.askFrom; d <= end; d = addDays(d, 1)) window.push(d);
  const rank = (d: string) => {
    const k = kind.get(d);
    return k === 'close' || k === 'group' ? 0 : k === 'bloom' ? 1 : k === undefined ? 2 : 3;
  };
  return window
    .filter((d) => rank(d) < 3)
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .slice(0, 2)
    .sort();
}
