'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ROOMS_COPY } from '@/content/rooms';
import { savedPayload, shownQuestion } from '@/lib/account/saved-payload';
import type { SavedReading } from '@/lib/account/types';
import { hasFateMap } from '@/lib/rooms/continue-locales';
import { ROOMS, usesChapters, type ProductKey } from '@/lib/rooms/themes';
import { giftPlanOfReading } from '@/lib/talisman/shelf';
import { LanguagePicker } from '../home-hero';
import { ChevronLeftIcon } from '../icons';
import { useLocale } from '../locale-provider';
import { ENTER } from '../scene/manifest';
import { SiteFooter } from '../site-footer';
import { Stage } from '../stage';
import { MovementDivider, ReunionCardsAfter, ReunionSummary, SaveCards, reunionCardDataNow } from '../reunion/cards/reunion-cards';
import { movementAt, startOpenChapters } from '../reunion/cards/plan';
import { TalismanGift } from '../talisman/talisman-gift';
import '../result/result.css';
import '../webtoon/webtoon.css';
import { ChapterReading } from '../rooms/chapter-reading';
import { XmasReading } from '../xmas/xmas-paid';
import { xmasContents } from '@/content/xmas';
import { FateCard, FateCards, fateAfter, hasFateInline } from '../rooms/fate-cards';
import { roomCopy } from '../rooms/room-copy';
import { fillName, readingFormat, splitChapters, splitReading } from '../rooms/reading-blocks';
import { ReadingText } from '../rooms/reading-text';
import { RoomArt } from '../rooms/room-art';
import { RoomStory } from '../rooms/room-story-view';
import '../rooms/rooms.css';
import { ACCOUNT } from '@/content/account';
import { ReviewBox } from '../review/review-box';
import { BackToArchive } from './back-to-archive';
import { formatDay } from './format';
import './account.css';

export function SavedRoomReading({ reading, room }: { reading: SavedReading; room: ProductKey }) {
  const locale = useLocale();
  const A = ACCOUNT.archive;
  const copy = roomCopy(room);
  const keeper = ROOMS_COPY.keepers[ROOMS[room].keeper];
  const [a, b] = reading.people;
  const body = fillName(reading.body ?? '', a?.name ?? '');

  const chaptered = usesChapters(room) && readingFormat(body) === 'chapters' ? room : null;
  const split = splitReading(body, false);
  const payload = useMemo(() => (chaptered && chaptered !== 'reunion' && hasFateMap(reading.locale) ? savedPayload(reading, chaptered) : null), [chaptered, reading]);

  const reunionData = useMemo(() => {
    const p = chaptered === 'reunion' ? savedPayload(reading, chaptered) : null;
    return p ? reunionCardDataNow(p) : null;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaptered, reading, locale]);

  const chapters = useMemo(() => (chaptered ? splitChapters(body, false) : []), [chaptered, body]);
  const xmas = chaptered === 'love' && chapters[0]?.title === xmasContents(reading.locale)[0].title;
  const asked = chaptered === 'reunion' ? shownQuestion(reading.question) : reading.question;

  const giftPlanNow = useMemo(() => giftPlanOfReading(reading), [reading]);
  const fateInline = (n: number) => (payload && chaptered && chaptered !== 'reunion' ? fateAfter(chaptered, n).map((part) => <FateCard key={part} payload={payload} room={chaptered} part={part} sex={reading.people[0]?.sex ?? null} />) : null);

  return (
    <Stage backdrop={ENTER.poster} night>
      <main id="main" className="rs-night rm-page" data-room={room}>
        <header className="rm-top">
          <Link href="/archive" className="rm-back">
            <ChevronLeftIcon size={20} />
            <span>{A.back}</span>
          </Link>
          <LanguagePicker />
        </header>

        {xmas ? null : (
        <section className="rm-hero" aria-labelledby="saved-title">
          <div className="rm-hero__art">
            <RoomArt room={room} glyph={keeper.hanja} priority sizes="(max-width: 520px) 100vw, 480px" />
          </div>
          <div className="rm-hero__shade" aria-hidden="true" />
          <div className="rm-hero__body">
            <p className="rm-hero__keeper">{keeper.name}</p>
            <h1 id="saved-title" className="rm-hero__title">
              {copy.title}
            </h1>
            <p className="rm-hero__quote">
              {b ? A.pair(a.name, b.name) : a?.name} · {A.readOn(formatDay(reading.createdAt))}
            </p>
          </div>
        </section>
        )}

        <div className="rm-body">
          {xmas ? (
            <div className="sd-page xm xq-wrap" lang={reading.locale}>
              <XmasReading parts={chapters} payload={payload ? { ...payload, edition: 'xmas' } : null} name={a?.name ?? ''} sex={a?.sex ?? null} />
            </div>
          ) : chaptered ? (

            <>
              {asked ? <p className="ac-asked">{A.asked(asked)}</p> : null}
              {reunionData ? <ReunionSummary intake={reunionData.intake} /> : null}
              {payload && chaptered && !hasFateInline(chaptered) ? <FateCards payload={payload} room={chaptered} sex={reading.people[0]?.sex ?? null} /> : null}
              <ChapterReading
                room={chaptered}
                chapters={chapters}
                streaming={false}
                waiting={false}
                concern={Boolean(asked)}
                after={reunionData ? (n) => <ReunionCardsAfter n={n} data={reunionData} /> : fateInline}
                before={reunionData ? (n) => (movementAt(n) === null ? null : <MovementDivider index={movementAt(n) ?? 0} />) : undefined}
                startOpen={reunionData ? startOpenChapters(reunionData.intake) : undefined}
              />
              {reunionData ? <SaveCards data={reunionData} /> : null}
            </>
          ) : (
            <>
              <RoomStory room={room} beats={split.beats} writing={false} />
              <section className="rm-reading" aria-labelledby="saved-title" data-phase="done">
                {reading.question ? <p className="ac-asked">{A.asked(reading.question)}</p> : null}
                <article className="rm-doc" aria-label={ROOMS_COPY.page.docHeading}>
                  <header className="rm-doc__head">
                    <p className="rm-doc__keeper">{keeper.name}</p>
                    <p className="rm-doc__title">{ROOMS_COPY.page.docHeading}</p>
                    <p className="rm-doc__note">{ROOMS_COPY.page.docNote}</p>
                  </header>
                  <ReadingText text={split.body} streaming={false} />
                </article>
              </section>
            </>
          )}
          {room === 'reunion' ? null : <TalismanGift keeper={ROOMS[room].keeper} plan={giftPlanNow} />}
          {}
          {}
          {}
          {xmas ? null : <ReviewBox room={room} reading={reading.id} />}
          <BackToArchive />
          <SiteFooter className="mt-10" />
        </div>
      </main>
    </Stage>
  );
}
