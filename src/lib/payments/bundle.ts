import type { Locale } from '@/content/locale';
import { ROOM_KEYS, type ProductKey, type RoomKey } from '../rooms/themes';
import { percentOff } from './prices';

export const BUNDLES_ON = false;

export function bundlesOn(env: { DANGOL_BUNDLES?: string }): boolean {
  return env.DANGOL_BUNDLES === 'on';
}

export const BUNDLE_ROOM = 'bundle' as const;

export const BUNDLE_ROOMS: readonly RoomKey[] = ROOM_KEYS;

export const BUNDLE_LANTERNS = 15;

export type BundleCurrency = 'KRW' | 'JPY' | 'USD';

export interface BundlePrice {

  amount: number;
  currency: BundleCurrency;

  list: number;
}

export const BUNDLE_PRICES: Record<Locale, BundlePrice> = {
  ko: { amount: 9900, currency: 'KRW', list: 24500 },
  ja: { amount: 1100, currency: 'JPY', list: 4450 },
  en: { amount: 790, currency: 'USD', list: 3145 },
};

export function bundlePercentOff(locale: Locale): number {
  return percentOff(BUNDLE_PRICES[locale].list, BUNDLE_PRICES[locale].amount);
}

export function bundleClaimId(order: string, room: ProductKey): string {
  return `${order}#${room}`;
}
