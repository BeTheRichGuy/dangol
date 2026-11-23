export interface UnknownPlace {
  name: '';
  country: '';
  lat: 0;
  lng: number;
  tz: string;
  label: '';
}

export function unknownPlace(offsetEastMinutes: number): UnknownPlace {
  const hours = Math.max(-12, Math.min(14, Math.round(offsetEastMinutes / 60)));

  const tz = hours === 0 ? 'Etc/GMT' : `Etc/GMT${hours > 0 ? '-' : '+'}${Math.abs(hours)}`;
  return { name: '', country: '', lat: 0, lng: hours * 15, tz, label: '' };
}

export function isUnknownPlace(p: { name: string } | null | undefined): boolean {
  return !!p && p.name === '';
}

export function deviceStandardOffsetMinutes(now: Date = new Date()): number {
  const year = now.getFullYear();
  const jan = -new Date(year, 0, 1).getTimezoneOffset();
  const jul = -new Date(year, 6, 1).getTimezoneOffset();
  return Math.min(jan, jul);
}
