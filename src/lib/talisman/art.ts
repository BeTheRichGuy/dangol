import type { TalismanId } from './index';

export const ART_DIR = '/media/talisman';
export const ART_SIZE = { width: 1024, height: 1536 } as const;

export function artUrl(id: TalismanId): string {
  return `${ART_DIR}/${id}.jpg`;
}

export const MEDALLION_R = 0.153;

export const MEDALLION_AT: Record<TalismanId, { cx: number; cy: number }> = {
  water: { cx: 0.4976, cy: 0.2269 },
  wood: { cx: 0.4966, cy: 0.2272 },
  fire: { cx: 0.4941, cy: 0.2201 },
  earth: { cx: 0.4941, cy: 0.2214 },
  metal: { cx: 0.4937, cy: 0.2204 },
  love: { cx: 0.4937, cy: 0.2197 },
  wealth: { cx: 0.4932, cy: 0.2197 },
  work: { cx: 0.4932, cy: 0.221 },
  study: { cx: 0.4927, cy: 0.2197 },
  bond: { cx: 0.4941, cy: 0.222 },
  mind: { cx: 0.4937, cy: 0.2194 },
};

export const INK: Record<TalismanId, string> = {
  wood: '#1f4a2c',
  fire: '#5a1410',
  earth: '#5a3a0c',
  metal: '#3a3f4a',
  water: '#16294a',
  love: '#6a1f3a',
  wealth: '#4a3a08',
  work: '#14394a',
  study: '#2c1f5a',
  bond: '#5a2f12',
  mind: '#3a2a5a',
};

export function talismanImageUrl(id: TalismanId, opts: { width?: number; download?: boolean } = {}): string {
  const q = new URLSearchParams({ id });
  if (opts.width) q.set('w', String(opts.width));
  if (opts.download) q.set('dl', '1');
  return `/api/talisman?${q.toString()}`;
}

export const ALLOWED_WIDTHS: readonly number[] = [96, 192, 384, 512, 768];

export function parseWidth(raw: string | null): number | null {
  if (!raw || !/^\d{2,4}$/.test(raw)) return null;
  const n = Number(raw);
  return ALLOWED_WIDTHS.includes(n) ? n : null;
}
