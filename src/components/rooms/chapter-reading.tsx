'use client';

import type { ReactNode } from 'react';
import { Fragment, useRef, useState } from 'react';
import { RevealText } from '@/components/mystic';
import { ROOMS_COPY } from '@/content/rooms';
import { PAID_PANELS, paidPanelSrc, type PaidPanel } from '@/lib/rooms/paid-panels';
import { ROOMS, type ChapterRoom } from '@/lib/rooms/themes';
import { bubbleDelay } from '../result/balloons';
import { splitSentences } from '../result/webtoon-text';
import { Bubble, ChapterTitle, Panel, WritingBubble, type BubbleSide } from '../webtoon';
import { placeChapterBeats, type ChapterSay } from './chapter-beats';
import { fixedLines, introSecond } from '@/lib/rooms/openers';
import { ChevronDownIcon } from '../icons';
import { useLocale } from '../locale-provider';
import type { ChapterPart } from './reading-blocks';
import { roomCopy } from './room-copy';
import { partId, ReadingText } from './reading-text';

const byLine = (text: string) => splitSentences(text).join('\n');

export function ChapterReading({
  room,
  chapters,
  streaming,
  waiting,
  concern = false,
  after,
  before,
  startOpen,
}: {
  room: ChapterRoom;
  chapters: readonly ChapterPart[];

  streaming: boolean;

  waiting: boolean;

  concern?: boolean;

  after?: (n: number) => ReactNode;

  before?: (n: number) => ReactNode;

  startOpen?: readonly number[];
}) {
  const keeper = ROOMS_COPY.keepers[ROOMS[room].keeper].name;
  const shown: readonly ChapterPart[] =
    chapters.length > 0 ? chapters : waiting ? [{ title: roomCopy(room).contents[0].title, beats: [], body: '', complete: false }] : [];
  return (
    <div className="rm-chapters">
      {shown.map((part, i) => (
        <Fragment key={i}>
          {before?.(i + 1) ?? null}
          <ChapterBlock
            room={room}
            index={i}
            part={part}
            keeper={keeper}
            live={!part.complete && (streaming || waiting)}
            concern={concern}
            card={part.complete ? after?.(i + 1) : null}
            startOpen={startOpen?.includes(i + 1) ?? false}
          />
        </Fragment>
      ))}
    </div>
  );
}

function ChapterBlock({
  room,
  index,
  part,
  keeper,
  live,
  concern,
  card,
  startOpen,
}: {
  room: ChapterRoom;
  index: number;
  part: ChapterPart;
  keeper: string;
  live: boolean;
  concern: boolean;
  card: ReactNode;
  startOpen: boolean;
}) {
  const panels = PAID_PANELS[room][index];
  const locale = useLocale();
  const fixed = fixedLines(room, locale, index);

  const second = index === 0 ? introSecond(room, locale, concern, part.beats[1] ?? null) : null;
  const says = placeChapterBeats(part.beats, live, { ...fixed, second });
  const n = index + 1;
  const F = ROOMS_COPY.page.readPage;

  const [folded, setFolded] = useState(index !== 0 && !startOpen);
  const open = live || !folded;
  const head = useRef<HTMLDivElement>(null);

  function foldBack() {
    setFolded(true);
    requestAnimationFrame(() => head.current?.scrollIntoView({ block: 'center' }));
  }
  return (
    <section className="rm-chapter" aria-labelledby={partId(n)} data-open={open ? '' : undefined}>
      <div ref={head} className="rm-chapter__head">
        <ChapterTitle id={partId(n)} className="rm-chapter__title">
          <span className="rm-chapter__num" aria-hidden="true">
            {String(n).padStart(2, '0')}
          </span>
          {part.title}
        </ChapterTitle>
        <button type="button" className="rm-chapter__fold" aria-expanded={open} aria-controls={`${partId(n)}-body`} disabled={live} onClick={() => setFolded(open)}>
          <span className="sr-only">{`${part.title} ${open ? F.foldClose : F.foldOpen}`}</span>
          <span className="rm-chapter__chev" aria-hidden="true">
            <ChevronDownIcon size={20} />
          </span>
        </button>
      </div>
      <div id={`${partId(n)}-body`} className="rm-chapter__body" hidden={!open}>
      {panels ? (
        <div className="rm-story">
          {panels.map((panel, s) => (
            <ChapterPanel key={panel.file} panel={panel} say={says[s]} keeper={keeper} slot={s} first={index === 0 && s === 0} />
          ))}
        </div>
      ) : null}
      {part.body ? (
        <article className="rm-doc rm-doc--chapter">
          <ReadingText text={part.body} streaming={live} leadAtStart />
        </article>
      ) : null}
      {card}
      {!live ? (
        <button type="button" className="rm-chapter__close" onClick={foldBack}>
          <ChevronDownIcon size={18} />
          {F.foldClose}
        </button>
      ) : null}
      </div>
    </section>
  );
}

function ChapterPanel({ panel, say, keeper, slot, first }: { panel: PaidPanel; say: ChapterSay; keeper: string; slot: number; first: boolean }) {
  const mouth = panel.ready ? panel.mouth : undefined;

  const side: BubbleSide = mouth !== undefined ? (mouth >= 0.5 ? 'right' : 'left') : slot % 2 === 0 ? 'left' : 'right';
  return (
    <Panel image={paidPanelSrc(panel)} alt={panel.alt} aspect={panel.aspect} objectPosition={panel.objectPosition} mouth={mouth} eager={first} bloom={first}>
      {say.writing ? <WritingBubble side={side} /> : null}
      {say.text ? (

        <Bubble key={say.text} who={keeper} side={side} tail={mouth !== undefined ? 'up' : 'none'} mouth={mouth} delayMs={bubbleDelay(0)}>
          <p className="rm-lines">
            <RevealText text={byLine(say.text)} delayMs={bubbleDelay(0)} />
          </p>
        </Bubble>
      ) : null}
    </Panel>
  );
}
