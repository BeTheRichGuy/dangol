import { dateLocale } from '@/content/locale';
import type { PersonSnapshot } from '@/lib/account/types';

export function formatBirth(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  try {
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(dateLocale(), { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  } catch {
    return iso;
  }
}

export function formatDay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(dateLocale(), { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  try {
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(dateLocale(), { year: 'numeric', month: 'long', timeZone: 'UTC' });
  } catch {
    return ym;
  }
}

export function birthLine(p: Pick<PersonSnapshot, 'date' | 'time' | 'place'>, timeUnknown: string): string {
  return [formatBirth(p.date), p.time ?? timeUnknown, p.place.label].filter(Boolean).join(' · ');
}
