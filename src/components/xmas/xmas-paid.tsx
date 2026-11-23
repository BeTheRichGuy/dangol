'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { XMAS_ASK, XMAS_MEET, XMAS_PAID, type XmasChapter } from '@/content/xmas';
import { coreOfBlock, partnerTraits } from '@/lib/reading/fate-map';
import type { RoomPayload } from '@/lib/rooms/payload';
import { xmasCalendarRange, xmasDays } from '@/lib/xmas/pulls';
import { afterBeats, chapterPlay, closeBeats, lateAfterBeats, openBeats } from '@/lib/xmas/chapter-beats';
import { xmasTier, type XmasTier } from '@/lib/xmas/relation';
import { XMAS_SEASON, xmasAskDays } from '@/lib/xmas/season';
import { splitSentences } from '../result/webtoon-text';
import { dropDangsin, type ChapterPart } from '../rooms/reading-blocks';
import { ReadingText } from '../rooms/reading-text';
import { StoryBeats } from '../story/story-strip';
import type { Beat } from '../story/types';
import '../story/story-strip.css';
import './xmas-landing.css';
import './xmas-flow.css';
import './xmas-paid.css';
import { XmasPairCard } from './xmas-cards';
import { XmasDays } from './xmas-days';
import { XhRivalOpen } from './xmas-hooks';
import { rivalDays, rivalElement, seenKey } from '@/lib/xmas/hooks';
import { XmasKeepsake } from './xmas-keepsake';
import { CardSave } from '../card-save/card-save';
import { XmasPlayView } from './xmas-paid-play';
import { callName } from '@/lib/xmas/call-name';
import { quizType } from '@/lib/xmas/quiz';
import { XMAS_QUIZ } from '@/content/ko/xmas-quiz';
import { XmasQuizMix } from './xmas-quiz-mix';

const C = XMAS_PAID;
const PLAYED = 'dangol.xmas.played';

export function xmasValues(payload: RoomPayload) {
  const core = coreOfBlock(payload.self);
  const days = xmasDays(core, payload.today);
  return {

    rivals: rivalDays(core, payload.today),
    rivalEl: rivalElement(core),
    seen: seenKey(core),
    meet: XMAS_MEET[partnerTraits(payload.self).meet],
    days,
    range: xmasCalendarRange(payload.today),
    askDays: xmasAskDays(days, payload.today),
    today: payload.today,
    relation: payload.xmas ?? null,
    tier: xmasTier(payload.partner) as XmasTier,
    pair: payload.partner?.cross.score ?? null,
  };
}

export function askText(askDays: readonly string[], today: string): string {
  if (askDays.length === 0) return XMAS_ASK.none;
  if (askDays[0] === today && today === XMAS_SEASON.eve) return XMAS_ASK.eve;
  return askDays.map((d) => XMAS_ASK.day(Number(d.slice(8, 10)))).join(XMAS_ASK.or);
}

type Values = ReturnType<typeof xmasValues>;

export function meSuffix(sex: 'female' | 'male' | null): '' | '-f' {
  return sex === 'male' ? '' : '-f';
}

export function fillBeats(beats: readonly Beat[], name: string, v: Values | null, sex: 'female' | 'male' | null = null): Beat[] {
  const fill = (t: string) =>
    t
      .replace('{name}', name || XMAS_PAID.you)
      .replace('{ask}', v ? askText(v.askDays, v.today) : XMAS_ASK.someday)
      .replace('{meet}', v?.meet ?? '');
  return beats.map((b) => {
    if (b.kind === 'art') return { ...b, src: b.src.replace('{me}', meSuffix(sex)), says: b.says?.map((s) => ({ ...s, text: fill(s.text) })), notes: b.notes?.map((n) => ({ ...n, text: fill(n.text) })) };
    if (b.kind === 'say' || b.kind === 'me') return { ...b, text: fill(b.text) };
    if (b.kind === 'text') return { ...b, lines: b.lines.map(fill) };
    return b;
  });
}

function yeonSays(lines: readonly string[]): Beat[] {
  return lines.map((text, i) => ({ kind: 'say', text: splitSentences(text).join('\n'), big: i === lines.length - 1, side: i === 1 ? 'right' : 'left', gap: i === 0 ? 22 : 8 }));
}

function readPlayed(): number {
  try {
    return Number(sessionStorage.getItem(PLAYED) ?? '0') || 0;
  } catch {
    return 0;
  }
}

function savePlayed(n: number) {
  try {
    sessionStorage.setItem(PLAYED, String(n));
  } catch {

  }
}

function Chapter({
  chapter,
  part,
  values,
  name,
  sex,
  story,
  open,
  onPlayed,
  quizLead,
}: {

  quizLead?: string;
  chapter: XmasChapter;
  part: ChapterPart | undefined;
  values: Values | null;
  name: string;
  sex: 'female' | 'male' | null;
  story: boolean;

  open: boolean;
  onPlayed: () => void;
}) {
  const fill = (beats: readonly Beat[] | undefined) => fillBeats(beats ?? [], name, values, sex);
  const play = chapterPlay(chapter, values);
  const playView =
    story && play ? (
      <div className="xq-play">
        <XmasPlayView play={play} months={[]} meet={values?.meet ?? ''} me={meSuffix(sex)} done={open} onDone={onPlayed} />
      </div>
    ) : null;

  const reading = (
    <>
      {part && part.beats.length > 0 ? (
        <div className="xq-yeon">
          {}
          {chapter.face && story ? (
            <>
              <StoryBeats
                beats={[
                  {
                    kind: 'art',
                    src: chapter.face,
                    ratio: 1,
                    width: 84,
                    shape: 'soft',
                    gap: 6,
                    says: [{ text: splitSentences(part.beats[0]).join('\n'), x: 50, y: 90, tail: 'ul' }],
                  },
                ]}
              />
              <StoryBeats beats={yeonSays(part.beats.slice(1))} />
            </>
          ) : (
            <>
              <p className="xq-yeon__who">{C.speaker}</p>
              <StoryBeats beats={yeonSays(part.beats)} />
            </>
          )}
        </div>
      ) : null}
      {part && quizLead ? <p className="xq-quiz-lead">{quizLead}</p> : null}
      {part ? (
        <article className="xq-prose">
          <ReadingText text={part.body} streaming={false} leadAtStart />
        </article>
      ) : null}
      {}
      {chapter.card === 'pair' && values?.pair != null ? (
        <CardSave name="xmas-pair">
          <XmasPairCard score={values.pair} />
        </CardSave>
      ) : null}
    </>
  );
  const late = Boolean(chapter.late);
  return (
    <>
      {story ? <StoryBeats beats={fill(openBeats(chapter, values))} /> : null}
      {}
      {chapter.card === 'days' && values ? (
        <CardSave name="xmas-days">
          <XmasDays days={values.days} from={values.range.from} to={values.range.to} rivals={values.rivals} />
        </CardSave>
      ) : null}
      {}
      {chapter.card === 'days' && values?.relation ? (
        <CardSave name="xmas-rival">
          <XhRivalOpen element={values.rivalEl} stage={values.relation.stage} days={values.rivals} seen={values.seen} sex={sex} />
        </CardSave>
      ) : null}
      {!late ? playView : null}
      {late || open || !story || !chapter.play ? (
        <>
          {!late && story ? <StoryBeats beats={fill(afterBeats(chapter, values))} /> : null}
          {reading}
          {story ? <StoryBeats beats={fill(closeBeats(chapter, values))} /> : null}
          {late ? playView : null}
          {late && (open || !story) && story ? <StoryBeats beats={fill(lateAfterBeats(chapter, values))} /> : null}
        </>
      ) : null}
    </>
  );
}

export function XmasReading({ parts: rawParts, payload, name: fullName, sex }: { parts: readonly ChapterPart[]; payload: RoomPayload | null; name: string; sex: 'female' | 'male' | null }) {

  const parts = useMemo(() => rawParts.map((p) => ({ ...p, body: dropDangsin(p.body), beats: p.beats.map(dropDangsin) })), [rawParts]);

  const quizName = payload?.quiz ? XMAS_QUIZ.types[quizType(payload.quiz)]?.name : undefined;

  const name = callName(fullName);
  const values = useMemo(() => (payload ? xmasValues(payload) : null), [payload]);

  const [played, setPlayed] = useState(0);
  const [story, setStory] = useState(true);
  const [jump, setJump] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlayed(readPlayed());
  }, []);
  const playAt = useMemo(() => C.chapters.map((c, i) => (c.play || c.playByStage ? i : -1)).filter((i) => i >= 0), []);

  const order = (i: number) => playAt.indexOf(i);
  const finish = useCallback(
    (i: number) => {
      setPlayed((n) => {
        const next = Math.max(n, playAt.indexOf(i) + 1);
        savePlayed(next);
        return next;
      });
    },
    [playAt],
  );

  function goTo(i: number) {
    const need = playAt.filter((p) => p < i).length;
    if (played < need) {
      savePlayed(need);
      setPlayed(need);
    }
    setJump(i);
  }
  useEffect(() => {
    if (jump === null) return;
    document.getElementById(`xq-${jump + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJump(null);
  }, [jump]);

  const stopAt = story ? (playAt.find((i) => order(i) >= played && !C.chapters[i].late) ?? C.chapters.length) : C.chapters.length;

  return (
    <div className="sd xq">
      <header className="xq-head">
        <p className="xq-head__over">{C.over}</p>
        <h1>{C.title.replace('{name}', name || C.you)}</h1>
      </header>

      {}
      {payload?.quiz ? (
        <CardSave name="xmas-type">
          <XmasQuizMix answers={payload.quiz} />
        </CardSave>
      ) : null}

      <nav className="xq-toc" aria-label={C.toc}>
        <ol>
          {C.chapters.map((c, i) => (
            <li key={c.title}>
              <a
                href={`#xq-${i + 1}`}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(i);
                }}
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
                <b>{c.title}</b>
                <small>{c.line}</small>
              </a>
            </li>
          ))}
        </ol>
        <button type="button" className="xq-toc__story" onClick={() => setStory((s) => !s)}>
          {story ? C.skipStory : C.showStory}
        </button>
      </nav>

      {story ? <StoryBeats beats={fillBeats(C.prologue, name, values)} /> : null}

      {C.chapters.map((chapter, i) =>
        i > stopAt ? null : (
          <section key={chapter.title} id={`xq-${i + 1}`} className="xq-chapter" aria-labelledby={`xq-${i + 1}-t`}>
            <header className="xq-chapter__head">
              <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <h2 id={`xq-${i + 1}-t`}>{chapter.title}</h2>
            </header>
            <Chapter
              chapter={chapter}
              part={parts[i]}
              values={values}
              name={name}
              sex={sex}
              story={story}
              open={!(chapter.play || chapter.playByStage) || order(i) < played}
              onPlayed={() => finish(i)}
              quizLead={quizName && i === XMAS_QUIZ.paid.mistakesAt ? XMAS_QUIZ.paid.mistakes.replace('{type}', quizName) : undefined}
            />
          </section>
        ),
      )}

      {}
      {values && stopAt >= C.chapters.length ? <XmasKeepsake name={name} values={values} quizType={quizName} /> : null}

      {}
      {stopAt >= C.chapters.length ? (
        <Link href="/home" className="xq-home">
          {C.toMain}
        </Link>
      ) : null}
    </div>
  );
}
