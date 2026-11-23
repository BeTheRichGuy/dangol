'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { UI } from '@/content/ui';
import { track } from '@/lib/analytics/track';
import { WEBTOON } from '@/content/webtoon';
import { ACCOUNT } from '@/content/account';
import { isContinueLocale } from '@/lib/rooms/continue-locales';
import { chartBlock } from '@/lib/rooms/payload';
import { giftPlan } from '@/lib/talisman';
import { activeLocale } from '@/content/locale';
import { ChevronLeftIcon } from '../icons';
import { Logo } from '../logo';
import { SiteFooter } from '../site-footer';
import { Stage } from '../stage';
import { resetAnswers, updateAnswers, type Answers } from '../flow/answers';
import { stepNav } from '../flow/steps';
import { BackToArchive } from '../account/back-to-archive';
import { ReviewBox } from '../review/review-box';
import { TalismanGift } from '../talisman/talisman-gift';
import { ChapterTitle } from '../webtoon';
import { ChapterConcern } from './chapter-concern';
import { ChapterPreview, type SexPick } from './chapter-preview';
import { ChapterWho } from './chapter-who';
import { NightTheme } from './night-theme';
import { RoadBridge } from './road-bridge';
import { ContinuePitch } from './continue-pitch';
import { DeeperPitch } from './deeper-pitch';
import { FateDrawers } from './fate-drawers';
import { buildResultModel, chapterWhen, withSex } from './result-data';
import { pickGoodMonth } from '@/lib/reading/fate-map';
import { SharePanel } from './share-panel';
import { StickyContinue } from './sticky-continue';
import { whoOf } from './trait-answers';
import type { TimeNote } from './what-i-see';
import './result.css';
import '../account/account.css';

const BACKDROP = '/media/webtoon/shrine.jpg';

export function ResultView({
  answers,
  nowIso: savedNow,
  archived = false,
  readingId,
  backHref,
  onReady,
}: {
  answers: Answers;

  nowIso?: string;

  archived?: boolean;

  readingId?: string;

  backHref?: string;

  onReady?: (nowIso: string) => void;
}) {

  const router = useRouter();
  const [data, setData] = useState(() => buildResultModel(answers, savedNow));
  const [sexFailed, setSexFailed] = useState(false);

  const [washing, setWashing] = useState(true);

  const giftPlanNow = useMemo(() => (data ? giftPlan({ chart: chartBlock(data.chart), concern: data.concern }) : null), [data]);

  const readyNow = data?.nowIso ?? null;
  useEffect(() => {
    if (readyNow) onReady?.(readyNow);

    if (readyNow && !archived) track('result_view');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyNow]);

  useEffect(() => {
    const t = window.setTimeout(() => setWashing(false), 1800);
    return () => window.clearTimeout(t);
  }, []);

  if (!data) {
    const e = UI.result.errors;
    return (
      <Stage backdrop={BACKDROP}>
        <main id="main" className="relative z-10 flex min-h-dvh flex-col justify-center gap-4 px-6 py-16">
          <h1 className="t-display text-[2.5rem]">{e.failedTitle}</h1>
          <p className="m-0 text-ink-soft">{e.failedBody}</p>
          <button type="button" className="dg-btn dg-btn--primary" onClick={() => stepNav.replace('date')}>
            {e.failedAction}
          </button>
        </main>
      </Stage>
    );
  }

  const { chart, reading, profile, traits, chapter, nowIso, concern, concernLine, teasers, fate } = data;
  const headline = UI.result.headline(answers.name, profile.born);
  const when = chapterWhen(chapter, chart);

  const timeNote: TimeNote = chart.flags.ziHourAmbiguous
    ? 'nearMidnight'
    : chart.flags.timeUnknown || chart.flags.nearJieqiBoundary
      ? 'unknown'
      : null;

  const showChapters = chapter !== null || chart.daYun === null;

  function pickSex({ sex, choice, nb }: SexPick) {
    const next = withSex(answers, sex, nowIso);
    if (!next) {
      setSexFailed(true);
      return;
    }
    setSexFailed(false);
    if (!archived) updateAnswers({ sex, sexAnswered: true, sexChoice: choice, nbChoice: nb });
    setData(next);
  }

  function fixTime() {

    if (archived) {
      router.push('/people');
      return;
    }
    stepNav.replace('time');
    window.scrollTo(0, 0);
  }

  return (
    <Stage backdrop={BACKDROP} night>
      <NightTheme />
      <main id="main" className="rs-night relative z-10 pb-[max(40px,var(--safe-bottom))]">
        <header className="flex items-center justify-between px-4 pt-[max(8px,var(--safe-top))]">
          <Logo tone="ivory" />
          {backHref ? (
            <Link href={backHref} className="ac-back">
              <ChevronLeftIcon size={20} />
              <span>{ACCOUNT.archive.back}</span>
            </Link>
          ) : null}
          {}
          <h1 className="sr-only">{headline}</h1>
        </header>
        {}
        {UI.result.freeBadge ? <p className="m-0 mt-2 px-4 text-center text-[0.875rem] text-ink-soft">{UI.result.freeBadge}</p> : null}

        {}
        <div className="mt-2">
          <ChapterWho
            chart={chart}
            profile={profile}
            traits={traits}
            name={answers.name}
            who={whoOf(chart)}
            timeNote={timeNote}
            onFixTime={fixTime}
          />
        </div>

        {}
        <div id="rs-sticky-start" aria-hidden="true" />

        {}
        <div className="mt-28">
          <ChapterConcern concern={concern} concernLine={concernLine} question={answers.question} teasers={teasers} reading={reading} type={profile.key} />
        </div>

        {}
        <section aria-labelledby="chapter-road" className="mt-28 px-4">
          <ChapterTitle id="chapter-road">{WEBTOON.chapterRoad}</ChapterTitle>

          {}
          <div className="mt-8">
            <RoadBridge type={profile.key} />
          </div>

          {}
          {showChapters ? (
            <div className="mt-16">
              <ChapterPreview
                chapter={chapter}
                when={when}
                onPickSex={pickSex}
                failed={sexFailed}
                type={profile.key}
              />
            </div>
          ) : null}

          {}
          {fate ? (
            <div className="mt-16">
              <FateDrawers fate={fate} name={answers.name} thisYear={Number(nowIso.slice(0, 4))} chart={chart} type={profile.key} />
            </div>
          ) : null}

          {}
          <div className="mt-16">
            {isContinueLocale(activeLocale()) ? (
              <ContinuePitch type={profile.key} />
            ) : (
              <DeeperPitch
                chapter={chapter}
                when={when}
                mapOpen={chart.daYun !== null}
                name={answers.name}
                type={profile.key}
              />
            )}
          </div>

        </section>

        {}
        <div className="px-4">
          <TalismanGift keeper="yul" plan={giftPlanNow} />
        </div>

        {}
        <div className="mt-20 px-4" data-sticky-hide>
          <SharePanel profile={profile} regularNo={answers.regularNo} goodMonth={pickGoodMonth(fate?.months)} />
        </div>

        {}
        {archived ? (
          <div className="px-4">
            {}
            <ReviewBox room="free" reading={readingId ?? String(answers.regularNo ?? 'free')} />
            <BackToArchive />
          </div>
        ) : null}

        {}
        <div className="mt-14 grid justify-items-center gap-1 px-4 text-center">
          <Link href="/wont-read" className="dg-link font-semibold">
            {UI.common.wontReadLink}
          </Link>
          <Link
            href="/reading"
            className="dg-link text-[0.875rem] text-ink-soft"
            onClick={() => resetAnswers()}
          >
            {UI.result.footer.startOver}
          </Link>
          <SiteFooter className="mt-4" />
        </div>
      </main>

      {}
      {fate ? <StickyContinue startId="rs-sticky-start" /> : null}

      {}
      {washing ? (
        <div
          aria-hidden="true"
          className="dg-fixed-layer dg-wash dg-wash--out"
          onAnimationEnd={() => setWashing(false)}
        />
      ) : null}
    </Stage>
  );
}
