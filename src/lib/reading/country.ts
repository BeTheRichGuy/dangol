import { favorableElement } from '@/lib/ai/favorable';
import type { ChartBlock } from '@/lib/rooms/payload';
import type { Element } from '@/lib/saju/types';

export type Climate = 'warm' | 'mild' | 'cool' | 'cold';
export type Region = 'eastAsia' | 'seAsia' | 'southAsia' | 'oceania' | 'europe' | 'nordic' | 'northAmerica' | 'latinAmerica' | 'africaMiddleEast';

export interface Country {

  code: string;

  lat: number;
  lng: number;

  element: Element;
  climate: Climate;
  region: Region;
}

export const COUNTRIES: readonly Country[] = [

  { code: 'JP', lat: 36, lng: 138, element: 'wood', climate: 'mild', region: 'eastAsia' },
  { code: 'NZ', lat: -41, lng: 174, element: 'wood', climate: 'cool', region: 'oceania' },
  { code: 'CA', lat: 49, lng: -123, element: 'wood', climate: 'cool', region: 'northAmerica' },
  { code: 'CR', lat: 10, lng: -84, element: 'wood', climate: 'warm', region: 'latinAmerica' },
  { code: 'IE', lat: 53, lng: -8, element: 'wood', climate: 'cool', region: 'europe' },
  { code: 'CL', lat: -35, lng: -71, element: 'wood', climate: 'mild', region: 'latinAmerica' },

  { code: 'TH', lat: 15, lng: 101, element: 'fire', climate: 'warm', region: 'seAsia' },
  { code: 'VN', lat: 16, lng: 108, element: 'fire', climate: 'warm', region: 'seAsia' },
  { code: 'PH', lat: 13, lng: 122, element: 'fire', climate: 'warm', region: 'seAsia' },
  { code: 'ID', lat: -2, lng: 118, element: 'fire', climate: 'warm', region: 'seAsia' },
  { code: 'SG', lat: 1.3, lng: 103.8, element: 'fire', climate: 'warm', region: 'seAsia' },
  { code: 'MY', lat: 4, lng: 102, element: 'fire', climate: 'warm', region: 'seAsia' },
  { code: 'AU', lat: -25, lng: 134, element: 'fire', climate: 'warm', region: 'oceania' },
  { code: 'IN', lat: 21, lng: 78, element: 'fire', climate: 'warm', region: 'southAsia' },
  { code: 'ES', lat: 40, lng: -4, element: 'fire', climate: 'mild', region: 'europe' },
  { code: 'IT', lat: 42, lng: 12.5, element: 'fire', climate: 'mild', region: 'europe' },
  { code: 'GR', lat: 39, lng: 22, element: 'fire', climate: 'warm', region: 'europe' },
  { code: 'PT', lat: 39.5, lng: -8, element: 'fire', climate: 'mild', region: 'europe' },
  { code: 'MX', lat: 23, lng: -102, element: 'fire', climate: 'warm', region: 'latinAmerica' },
  { code: 'BR', lat: -10, lng: -52, element: 'fire', climate: 'warm', region: 'latinAmerica' },

  { code: 'CH', lat: 46.8, lng: 8.2, element: 'earth', climate: 'cool', region: 'europe' },
  { code: 'AT', lat: 47.5, lng: 14.5, element: 'earth', climate: 'cool', region: 'europe' },
  { code: 'CZ', lat: 49.8, lng: 15.5, element: 'earth', climate: 'cool', region: 'europe' },
  { code: 'NP', lat: 28, lng: 84, element: 'earth', climate: 'mild', region: 'southAsia' },
  { code: 'BT', lat: 27.5, lng: 90.5, element: 'earth', climate: 'mild', region: 'southAsia' },
  { code: 'MN', lat: 47, lng: 105, element: 'earth', climate: 'cold', region: 'eastAsia' },
  { code: 'PE', lat: -10, lng: -75, element: 'earth', climate: 'mild', region: 'latinAmerica' },
  { code: 'CO', lat: 4.5, lng: -74, element: 'earth', climate: 'mild', region: 'latinAmerica' },
  { code: 'TR', lat: 39, lng: 35, element: 'earth', climate: 'mild', region: 'africaMiddleEast' },
  { code: 'MA', lat: 32, lng: -6, element: 'earth', climate: 'warm', region: 'africaMiddleEast' },

  { code: 'GB', lat: 54, lng: -2, element: 'metal', climate: 'cool', region: 'europe' },
  { code: 'FR', lat: 46.5, lng: 2.5, element: 'metal', climate: 'mild', region: 'europe' },
  { code: 'DE', lat: 51, lng: 10, element: 'metal', climate: 'cool', region: 'europe' },
  { code: 'NL', lat: 52.2, lng: 5.3, element: 'metal', climate: 'cool', region: 'europe' },
  { code: 'BE', lat: 50.5, lng: 4.5, element: 'metal', climate: 'cool', region: 'europe' },
  { code: 'PL', lat: 52, lng: 19, element: 'metal', climate: 'cool', region: 'europe' },
  { code: 'US', lat: 39, lng: -98, element: 'metal', climate: 'mild', region: 'northAmerica' },
  { code: 'AR', lat: -34, lng: -64, element: 'metal', climate: 'mild', region: 'latinAmerica' },

  { code: 'IS', lat: 65, lng: -18, element: 'water', climate: 'cold', region: 'nordic' },
  { code: 'NO', lat: 62, lng: 10, element: 'water', climate: 'cold', region: 'nordic' },
  { code: 'SE', lat: 62, lng: 15, element: 'water', climate: 'cold', region: 'nordic' },
  { code: 'FI', lat: 64, lng: 26, element: 'water', climate: 'cold', region: 'nordic' },
  { code: 'EE', lat: 58.6, lng: 25, element: 'water', climate: 'cold', region: 'nordic' },
  { code: 'DK', lat: 56, lng: 10, element: 'water', climate: 'cool', region: 'nordic' },
  { code: 'HR', lat: 45, lng: 15.5, element: 'water', climate: 'mild', region: 'europe' },
  { code: 'LK', lat: 7.9, lng: 80.7, element: 'water', climate: 'warm', region: 'southAsia' },
  { code: 'MV', lat: 3.2, lng: 73.2, element: 'water', climate: 'warm', region: 'southAsia' },
  { code: 'FJ', lat: -17.7, lng: 178, element: 'water', climate: 'warm', region: 'oceania' },
];

const CYCLE: readonly Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

const feeds = (a: Element, b: Element) => CYCLE[(CYCLE.indexOf(a) + 1) % 5] === b;

export type ClimateWish = 'warm' | 'cool' | null;
export function climateWish(c: Pick<ChartBlock, 'season'>): ClimateWish {
  return c.season === 'winter' ? 'warm' : c.season === 'summer' ? 'cool' : null;
}

export type ElementFitKind = 'match' | 'feeds' | null;
export function elementFitKind(country: Element, favorable: Element): ElementFitKind {
  return country === favorable ? 'match' : feeds(country, favorable) ? 'feeds' : null;
}

const ELEMENT_POINTS: Record<NonNullable<ElementFitKind>, number> = { match: 3, feeds: 1.5 };
const CLIMATE_POINTS: Record<ClimateWish & string, Record<Climate, number>> = {
  warm: { warm: 2, mild: 1, cool: 0, cold: -1 },
  cool: { cold: 2, cool: 1, mild: 0, warm: -1 },
};

export function countryFit(chart: ChartBlock, c: Country): { points: number; element: ElementFitKind; climate: boolean } {
  const fav = favorableElement(chart.dayMaster.element, chart.strength, chart.elements);
  const element = elementFitKind(c.element, fav);
  const wish = climateWish(chart);
  const climatePoints = wish ? CLIMATE_POINTS[wish][c.climate] : 0;
  return { points: (element ? ELEMENT_POINTS[element] : 0) + climatePoints, element, climate: climatePoints > 0 };
}

export const MIN_PIN_GAP = 38;

export interface CountryPick {
  rank: 1 | 2 | 3;
  country: Country;

  fits: { element: ElementFitKind; climate: boolean }[];
}

export function countryPicks(charts: readonly ChartBlock[], count = 3): CountryPick[] {
  const scored = COUNTRIES.map((country, order) => {
    const fits = charts.map((c) => countryFit(c, country));
    return { country, order, total: fits.reduce((s, f) => s + f.points, 0), fits: fits.map(({ element, climate }) => ({ element, climate })) };
  }).sort((a, b) => b.total - a.total || a.order - b.order);
  const used = new Set<Region>();
  const out: CountryPick[] = [];
  for (const s of scored) {
    if (used.has(s.country.region)) continue;

    if (out.some((o) => Math.hypot(o.country.lat - s.country.lat, o.country.lng - s.country.lng) < MIN_PIN_GAP)) continue;
    used.add(s.country.region);
    out.push({ rank: (out.length + 1) as 1 | 2 | 3, country: s.country, fits: s.fits });
    if (out.length === count) break;
  }
  return out;
}
