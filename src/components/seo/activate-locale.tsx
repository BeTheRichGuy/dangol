'use client';

import { useEffect } from 'react';
import { chooseLocale, type Locale } from '@/content/locale';
import { track } from '@/lib/analytics/track';

export function ActivateLocale({ locale }: { locale: Locale }) {
  useEffect(() => {
    chooseLocale(locale);
    track('landing_view');
  }, [locale]);
  return null;
}
