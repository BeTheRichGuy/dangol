import { lunarToSolar, solarToLunar, type LunarDate } from '@/lib/saju/lunar-date';
import { parseDateParts } from './fields';

export type Calendar = 'solar' | 'lunar';

export type BirthDateCheck =
  | { ok: true; iso: string;  lunar: LunarDate | null }
  | {
      ok: false;
      error: 'empty' | 'invalid' | 'range' | 'noLeap' | 'noDay';

      at?: LunarDate;

      maxDay?: number;
      leapMonth?: number;
    };

const DOTTED = /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/;

export function checkBirthDate(text: string, calendar: Calendar, leap: boolean): BirthDateCheck {
  const m = DOTTED.exec(text.trim());
  if (!text.trim()) return { ok: false, error: 'empty' };
  if (!m) return { ok: false, error: 'invalid' };
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];

  if (calendar === 'solar') {
    const r = parseDateParts({ year: m[1], month: String(mo), day: String(d) });
    if (r.ok) return { ok: true, iso: r.iso, lunar: null };
    return { ok: false, error: r.error === 'range' ? 'range' : 'invalid' };
  }

  if (mo < 1 || mo > 12 || d < 1) return { ok: false, error: 'invalid' };
  const at: LunarDate = { year: y, month: mo, day: d, leap };
  const r = lunarToSolar(at);
  if (!r.ok) {
    if (r.error === 'year') return { ok: false, error: 'range' };
    if (r.error === 'noLeap') return { ok: false, error: 'noLeap', at, leapMonth: r.leapMonth };
    if (r.error === 'day') return { ok: false, error: 'noDay', at, maxDay: r.maxDay };
    return { ok: false, error: 'invalid' };
  }

  const [sy, sm, sd] = r.iso.split('-');
  const solar = parseDateParts({ year: sy, month: String(Number(sm)), day: String(Number(sd)) });
  if (!solar.ok) return { ok: false, error: 'range' };
  return { ok: true, iso: solar.iso, lunar: at };
}

const dots = (iso: string) => iso.replaceAll('-', '.');
const pad = (n: number, w = 2) => String(n).padStart(w, '0');

export function convertDateText(text: string, from: Calendar, to: Calendar, leap: boolean): { text: string; leap: boolean } {
  if (from === to) return { text, leap };
  const c = checkBirthDate(text, from, leap);
  if (!c.ok) return { text, leap: from === 'lunar' ? leap : false };
  if (to === 'solar') return { text: dots(c.iso), leap: false };
  const l = solarToLunar(c.iso);
  if (!l) return { text, leap: false };
  return { text: `${pad(l.year, 4)}.${pad(l.month)}.${pad(l.day)}`, leap: l.leap };
}

export function isoToDotted(iso: string | null): string {
  return iso ? dots(iso) : '';
}
