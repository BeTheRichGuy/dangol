import { keyMonths, type KeyMonth } from '@/lib/reading/fate-map';
import { Solar } from 'lunar-javascript';
import { luckPillar, type NatalCore } from '@/lib/rooms/payload';

export function xmasYears(nowIso: string): number[] {
  const year = Number(nowIso.slice(0, 4));
  return Number(nowIso.slice(5, 7)) >= 11 ? [year, year + 1] : [year];
}

export function xmasPulls(core: NatalCore, nowIso: string): KeyMonth[] {
  return keyMonths(core, nowIso, xmasYears(nowIso)).filter((k) => k.tone === 'harmonyDay' || k.tone === 'harmonyMonth');
}

export function xmasCautions(core: NatalCore, nowIso: string): KeyMonth[] {
  return keyMonths(core, nowIso, xmasYears(nowIso)).filter((k) => k.tone === 'clashDay' || k.tone === 'clashMonth');
}

export function xmasBig(pulls: readonly KeyMonth[]): KeyMonth | null {
  return pulls.find((m) => m.both) ?? pulls.find((m) => m.tone === 'harmonyDay') ?? pulls[0] ?? null;
}

export function xmasLanternMonths(nowIso: string): { year: number; month: number }[] {
  const years = xmasYears(nowIso);
  const out: { year: number; month: number }[] = [];
  let y = Number(nowIso.slice(0, 4));
  let m = Number(nowIso.slice(5, 7));
  const last = years[years.length - 1];
  while (y < last || (y === last && m <= 12)) {
    out.push({ year: y, month: m });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function ymOf(k: { year: number; month: number }): string {
  return `${k.year}-${String(k.month).padStart(2, '0')}`;
}

export type XmasDayKind = 'close' | 'group' | 'bloom' | 'caution';

export interface XmasDay {

  date: string;
  kind: XmasDayKind;

  ganzhi: string;
}

const HARMONY_KINDS: ReadonlySet<string> = new Set(['六合']);
const CLASH_KINDS: ReadonlySet<string> = new Set(['沖']);
const BLOOM: ReadonlySet<string> = new Set(['桃花']);

export function xmasDayKind(core: NatalCore, date: string): XmasDayKind | null {
  const [y, m, d] = date.split('-').map(Number);
  const p = luckPillar(core, Solar.fromYmd(y, m, d).getLunar().getDayInGanZhi(), 'day-luck');
  const rel = (kinds: ReadonlySet<string>, seat: 'day' | 'month') => p.relations.some((r) => kinds.has(r.kind) && r.at.includes(seat) && r.at.includes('day-luck'));
  if (rel(CLASH_KINDS, 'day')) return 'caution';
  if (rel(HARMONY_KINDS, 'day')) return 'close';
  if (rel(HARMONY_KINDS, 'month')) return 'group';
  if (p.shinsal.some((s) => BLOOM.has(s))) return 'bloom';
  return null;
}

export function xmasCalendarRange(nowIso: string): { from: string; to: string } {
  const year = Number(nowIso.slice(0, 4));
  const from = nowIso.slice(0, 10);
  if (Number(nowIso.slice(5, 7)) >= 11) return { from, to: `${year + 1}-01-31` };
  const end = new Date(Date.parse(`${from}T00:00:00Z`) + 59 * 86_400_000);
  return { from, to: end.toISOString().slice(0, 10) };
}

export function dayGanzhi(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return Solar.fromYmd(y, m, d).getLunar().getDayInGanZhi();
}

export function xmasDays(core: NatalCore, nowIso: string): XmasDay[] {
  const { from, to } = xmasCalendarRange(nowIso);
  const out: XmasDay[] = [];
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += 86_400_000) {
    const date = new Date(t).toISOString().slice(0, 10);
    const kind = xmasDayKind(core, date);
    if (!kind) continue;
    out.push({ date, kind, ganzhi: dayGanzhi(date) });
  }
  return out;
}
