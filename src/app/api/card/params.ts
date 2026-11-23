import { isHumanRegularNo } from '../../../lib/regular';

export interface CardType {

  key: string;

  born: string;
  hanzi: string;

  identity: string;

  inLove: string;
}

export type CardLocale = 'en' | 'ko' | 'ja';

export function parseCardLocale(searchParams: URLSearchParams): CardLocale {
  const raw = (searchParams.get('l') ?? '').trim().toLowerCase();
  return raw === 'ko' || raw === 'ja' ? raw : 'en';
}

export interface CardMonth {
  month: number;
  year: number | null;
  seat: 'day' | 'month';
}

export interface CardParams {
  type: CardType | null;
  regularNo: number | null;

  og: boolean;

  width: number | null;

  month: CardMonth | null;
}

export const CARD_WIDTHS = [272, 360, 544, 720] as const;

const NO_RE = /^\d{1,7}$/;

export function parseCardParams(searchParams: URLSearchParams, profiles: Record<string, CardType>): CardParams {
  const rawType = (searchParams.get('t') ?? '').trim().toLowerCase();
  const type = rawType && Object.hasOwn(profiles, rawType) ? profiles[rawType] : null;

  const rawNo = (searchParams.get('no') ?? '').trim();
  const regularNo = NO_RE.test(rawNo) && isHumanRegularNo(Number(rawNo)) ? Number(rawNo) : null;

  const og = (searchParams.get('og') ?? '').trim() === '1';

  const rawWidth = Number((searchParams.get('w') ?? '').trim());
  const width = (CARD_WIDTHS as readonly number[]).includes(rawWidth) ? rawWidth : null;

  return { type, regularNo, og, width, month: parseCardMonth(searchParams) };
}

export function parseCardMonth(searchParams: URLSearchParams): CardMonth | null {
  const rawMonth = (searchParams.get('gm') ?? '').trim();
  if (!/^\d{1,2}$/.test(rawMonth)) return null;
  const month = Number(rawMonth);
  if (month < 1 || month > 12) return null;
  const rawYear = (searchParams.get('gy') ?? '').trim();
  const year = /^\d{4}$/.test(rawYear) && Number(rawYear) >= 2000 && Number(rawYear) <= 2100 ? Number(rawYear) : null;
  const seat = (searchParams.get('gs') ?? '').trim() === 'month' ? 'month' : 'day';
  return { month, year, seat };
}
