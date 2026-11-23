import { Solar } from 'lunar-javascript';
import { keyMonths, type KeyMonthTone } from '@/lib/reading/fate-map';
import { traitFeatures } from '@/lib/reading/traits';
import type { SeenKey } from '@/content/xmas-hooks';
import type { NatalCore } from '@/lib/rooms/payload';
import { tenGod } from '@/lib/saju/details';
import type { Element, Stem } from '@/lib/saju/types';
import { XMAS_SEASON } from './season';

export interface PastMonth {
  year: number;

  month: number;
  tone: KeyMonthTone;

  lead: boolean;
}

const RANK: Record<KeyMonthTone, number> = { clashDay: 0, clashMonth: 1, harmonyDay: 2, clashYear: 3, harmonyMonth: 4, harmonyYear: 5 };

export function pastMonths(core: NatalCore, nowIso: string, max = 3): PastMonth[] {
  const nowYear = Number(nowIso.slice(0, 4));
  const nowMonth = Number(nowIso.slice(5, 7));
  const year = nowMonth <= 2 ? nowYear - 1 : nowYear;
  const before = year === nowYear ? nowMonth : 13;

  const seen = new Set<KeyMonthTone>();
  return keyMonths(core, `${year}-01-01T00:00:00.000Z`, [year])
    .filter((m) => m.month < before)
    .sort((a, b) => RANK[a.tone] - RANK[b.tone] || a.month - b.month)
    .filter((m) => !seen.has(m.tone) && seen.add(m.tone))
    .slice(0, max)
    .map((m, i) => ({ year: m.year, month: m.month, tone: m.tone, lead: i === 0 }))
    .sort((a, b) => a.month - b.month);
}

function dayStem(date: string): Stem {
  const [y, m, d] = date.split('-').map(Number);
  return Solar.fromYmd(y, m, d).getLunar().getDayInGanZhi().slice(0, 1) as Stem;
}

export function rivalDays(core: NatalCore, nowIso: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${nowIso.slice(0, 10)}T00:00:00Z`); t <= Date.parse(`${XMAS_SEASON.eve}T00:00:00Z`); t += 86_400_000) {
    const date = new Date(t).toISOString().slice(0, 10);
    if (tenGod(core.dayMaster.stem, dayStem(date)) === '劫財') out.push(date);
  }
  return out;
}

export function seenKey(core: NatalCore): SeenKey {
  const f = traitFeatures(core);
  return f.tension ? 'tension' : f.palace;
}

export function rivalElement(core: NatalCore): Element {
  return core.dayMaster.element;
}
