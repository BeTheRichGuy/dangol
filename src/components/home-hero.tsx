'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { UI } from '@/content/ui';
import { track } from '@/lib/analytics/track';
import { chooseLocale, LOCALES, LOCALE_NAMES } from '@/content/locale';
import { HomeEntry } from './account/home-entry';
import { useLocale } from './locale-provider';
import { SiteFooter } from './site-footer';

export function LanguagePicker() {
  const locale = useLocale();
  return (
    <div role="group" aria-label={UI.home.languageLabel} className="home-lang">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          className="home-lang__btn"
          aria-pressed={locale === l}
          onClick={() => {
            chooseLocale(l);
            track('locale_choose', { to: l });
          }}
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </div>
  );
}

export function HomeHero() {

  useEffect(() => track('landing_view'), []);
  const headline = UI.home.headline;
  const emphasis = UI.home.headlineEmphasis;
  const at = emphasis ? headline.indexOf(emphasis) : -1;

  return (
    <>
      <h1
        className="home-rise home-headline t-display m-0 text-[clamp(2.25rem,9.4vw,3rem)] leading-[1.05]"
        style={{ '--i': 1 } as React.CSSProperties}
      >
        {at < 0 ? (
          headline
        ) : (
          <>
            {headline.slice(0, at)}
            <em className="font-medium italic">{emphasis}</em>
            {headline.slice(at + emphasis.length)}
          </>
        )}
      </h1>
      {}
      <p
        className="home-rise m-0 mt-3 text-[1.0625rem] leading-snug text-ink-soft"
        style={{ '--i': 2, textWrap: 'balance' } as React.CSSProperties}
      >
        {UI.home.subhead}
      </p>

      {}
      <div className="home-rise mt-5" style={{ '--i': 3 } as React.CSSProperties}>
        <HomeEntry />
      </div>

      {}
      <p className="home-rise m-0 mt-3 text-center text-[0.9375rem] leading-snug text-ink-soft" style={{ '--i': 4 } as React.CSSProperties}>
        {UI.home.reunionLead}{' '}
        <Link href="/reunion" className="dg-link font-semibold text-ink" onClick={() => track('room_click', { to: 'reunion', from: 'landing' })}>
          {UI.home.reunionLink}
        </Link>
      </p>

      <SiteFooter className="home-rise mt-4" disclosure={false} />
    </>
  );
}
