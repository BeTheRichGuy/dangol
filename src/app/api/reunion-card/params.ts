import { isLocale, type Locale } from '@/content/locale';
import { ACTIONS_PER_KIND, DONT_SEND_COUNT, type MonthKind, type WindowMonth } from '@/lib/reunion/cards';

export const SAVE_KINDS = ['window', 'kit', 'song'] as const;
export type SaveKind = (typeof SAVE_KINDS)[number];

export const PREVIEW_WIDTHS = [360, 540] as const;

export const SONG_LINE_COUNT = 9;
export const MAX_KEY_DATES = 3;
export const CALENDAR_MONTHS = 12;

export interface YearMonth {
  year: number;
  month: number;
}

export type SaveCard =
  | { kind: 'window'; locale: Locale; from: YearMonth; kinds: MonthKind[] }
  | { kind: 'kit'; locale: Locale; mode: 'kit'; plain: number; apology: number; news: number; dontSend: number[] }
  | { kind: 'kit'; locale: Locale; mode: 'waiting' }
  | { kind: 'song'; locale: Locale; line: number; dates: YearMonth[] };

export interface SaveRequest {
  card: SaveCard;

  width: number | null;
  download: boolean;
}

export interface SaveLimits {
  plain: number;
  apology: number;
  news: number;
  dontSend: number;
}

const CODE: Record<MonthKind, string> = { both: 'b', one: 'o', care: 'c', even: 'e' };
const KIND_OF_CODE: Record<string, MonthKind> = { b: 'both', o: 'one', c: 'care', e: 'even' };

const YM = /^(\d{4})-(\d{2})$/;

export function formatYearMonth(v: YearMonth): string {
  return `${v.year}-${String(v.month).padStart(2, '0')}`;
}

function parseYearMonth(raw: string | null): YearMonth | null {
  const m = YM.exec((raw ?? '').trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  return year >= 2000 && year <= 2100 && month >= 1 && month <= 12 ? { year, month } : null;
}

function parseIndex(raw: string | null, limit: number): number | null {
  const s = (raw ?? '').trim();
  if (!/^\d{1,3}$/.test(s)) return null;
  const n = Number(s);
  return n < limit ? n : null;
}

export function calendarFrom(from: YearMonth, kinds: readonly MonthKind[]): WindowMonth[] {
  return kinds.map((kind, i) => {
    const index = from.year * 12 + (from.month - 1) + i;
    const month = (index % 12) + 1;
    return { year: Math.floor(index / 12), month, kind, action: (month + i) % ACTIONS_PER_KIND };
  });
}

export function parseSaveRequest(sp: URLSearchParams, limits: SaveLimits): SaveRequest | null {
  const kind = (sp.get('k') ?? '').trim();
  if (!(SAVE_KINDS as readonly string[]).includes(kind)) return null;
  const locale = sp.get('l');
  if (!isLocale(locale)) return null;

  const rawWidth = sp.get('w');
  let width: number | null = null;
  if (rawWidth !== null) {
    const n = Number(rawWidth.trim());
    if (!(PREVIEW_WIDTHS as readonly number[]).includes(n)) return null;
    width = n;
  }
  const download = (sp.get('dl') ?? '').trim() === '1';

  if (kind === 'window') {
    const from = parseYearMonth(sp.get('f'));
    const cal = (sp.get('cal') ?? '').trim();
    if (!from || cal.length !== CALENDAR_MONTHS || ![...cal].every((c) => Object.hasOwn(KIND_OF_CODE, c))) return null;
    return { card: { kind: 'window', locale, from, kinds: [...cal].map((c) => KIND_OF_CODE[c]) }, width, download };
  }

  if (kind === 'kit') {
    if ((sp.get('m') ?? '').trim() === 'w') return { card: { kind: 'kit', locale, mode: 'waiting' }, width, download };
    const plain = parseIndex(sp.get('p'), limits.plain);
    const apology = parseIndex(sp.get('a'), limits.apology);
    const news = parseIndex(sp.get('n'), limits.news);
    const ds = (sp.get('ds') ?? '').trim().split('.');
    const dontSend = ds.map((s) => parseIndex(s, limits.dontSend));
    if (plain === null || apology === null || news === null) return null;
    if (dontSend.length !== DONT_SEND_COUNT || dontSend.some((n) => n === null) || new Set(dontSend).size !== dontSend.length) return null;
    return { card: { kind: 'kit', locale, mode: 'kit', plain, apology, news, dontSend: dontSend as number[] }, width, download };
  }

  const line = parseIndex(sp.get('s'), SONG_LINE_COUNT);
  if (line === null) return null;
  const rawDates = (sp.get('d') ?? '').trim();
  const dates: YearMonth[] = [];
  if (rawDates) {
    const parts = rawDates.split(',');
    if (parts.length > MAX_KEY_DATES) return null;
    for (const p of parts) {
      const ym = parseYearMonth(p);
      if (!ym) return null;
      dates.push(ym);
    }
  }
  return { card: { kind: 'song', locale, line, dates }, width, download };
}

export function saveQuery(card: SaveCard, opts: { width?: number; download?: boolean } = {}): string {
  const q = new URLSearchParams();
  q.set('k', card.kind);
  q.set('l', card.locale);
  if (card.kind === 'window') {
    q.set('f', formatYearMonth(card.from));
    q.set('cal', card.kinds.map((k) => CODE[k]).join(''));
  } else if (card.kind === 'kit') {
    if (card.mode === 'waiting') q.set('m', 'w');
    else {
      q.set('p', String(card.plain));
      q.set('a', String(card.apology));
      q.set('n', String(card.news));
      q.set('ds', card.dontSend.join('.'));
    }
  } else {
    q.set('s', String(card.line));
    if (card.dates.length > 0) q.set('d', card.dates.map(formatYearMonth).join(','));
  }
  if (opts.width) q.set('w', String(opts.width));
  if (opts.download) q.set('dl', '1');
  return q.toString();
}

export const saveCardUrl = (card: SaveCard, opts: { width?: number; download?: boolean } = {}): string => `/api/reunion-card?${saveQuery(card, opts)}`;
