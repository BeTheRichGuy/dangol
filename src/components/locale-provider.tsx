'use client';

import { Fragment, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { activateStoredLocale, activeLocale, subscribeLocale, type Locale } from '@/content/locale';

const serverLocale = (): Locale => 'en';

export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, activeLocale, serverLocale);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();

  useEffect(() => {
    activateStoredLocale();
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  return <Fragment key={locale}>{children}</Fragment>;
}
