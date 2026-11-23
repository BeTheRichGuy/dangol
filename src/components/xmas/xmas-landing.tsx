'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useSyncExternalStore } from 'react';
import { XMAS as T, XMAS_PAID } from '@/content/xmas';
import { useLocale } from '../locale-provider';
import { useVideoAllowed } from '../scene/use-video-allowed';
import { XhLanding } from './xmas-hooks';
import { XmasViewers } from './xmas-viewers';
import { StoryBeats } from '../story/story-strip';
import '../story/story-strip.css';
import './xmas-landing.css';

const START = '/xmas/start';

export function daysToChristmas(now: Date): number | null {
  const day = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const xmas = Date.UTC(now.getFullYear(), 11, 25);
  const left = Math.round((xmas - day) / 86_400_000);
  return left < 0 ? null : left;
}

const noop = () => () => {};

export function useXmasTitle(locale: string) {
  useEffect(() => {
    document.title = `${XMAS_PAID.over} | DANGOL`;
  }, [locale]);
}

function useDday(): number | null | undefined {
  return useSyncExternalStore(
    noop,
    () => daysToChristmas(new Date()),
    () => undefined,
  );
}

export function XmasLanding() {
  const locale = useLocale();
  useXmasTitle(locale);
  const left = useDday();
  const videoOk = useVideoAllowed();

  const closed = left === null || left === 0;
  const dday = left === undefined || closed ? null : T.cta.dday.replace('{n}', String(left));

  return (
    <main className="sd-page xm" lang={locale}>
      <div className="sd">
        <header className="xm-hero">
          <Image src={T.hero.image} alt="" fill priority sizes="(min-width: 480px) 480px, 100vw" />
          {}
          {videoOk ? <video className="xm-hero__video" src={T.hero.video} poster={T.hero.image} autoPlay muted loop playsInline preload="auto" aria-hidden="true" /> : null}
          <div className="xm-hero__copy">
            <p className="xm-hero__over">{T.hero.over}</p>
            <h1>
              {T.hero.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h1>
            <p className="xm-hero__sub">{T.hero.sub}</p>
            <XmasViewers className="xm-hero__proof" />
          </div>
        </header>

        <StoryBeats beats={T.hook} />
        {}
        <XhLanding />

        <div className="xm-rule" aria-hidden="true" />

        <StoryBeats beats={T.beats} />

        <section className="xm-offer xm-offer--dark">
          <h2>{T.check.title}</h2>
          <ul>
            {T.check.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="xm-offer__close">{T.check.close}</p>
        </section>
      </div>

      {}
      <div className="xm-bar">
        {closed ? (
          <p>{T.cta.closed}</p>
        ) : (
          <>
            {dday ? <p className="xm-bar__tag">{dday}</p> : null}
            <Link href={START}>{T.cta.label}</Link>
          </>
        )}
      </div>
    </main>
  );
}
