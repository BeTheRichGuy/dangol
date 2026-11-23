'use client';

import { ROOMS_COPY } from '@/content/rooms';
import { firstPercentOff } from '@/lib/payments/offers';
import { useLocale } from '../locale-provider';
import { useOffers } from './use-offers';

export function useRoomPrice(): { price: string; was: string | null; first: boolean; off: number } {
  const locale = useLocale();
  const first = useOffers().first;
  return { price: first ? ROOMS_COPY.first.price : ROOMS_COPY.price, was: first ? ROOMS_COPY.price : null, first, off: first ? firstPercentOff(locale) : 0 };
}
