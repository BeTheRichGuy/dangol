'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { RESULT_UI, type ChapterWhen } from '@/content/result-ui';
import { UI } from '@/content/ui';
import { UPSELL } from '@/content/upsell';
import type { ChapterInfo } from '@/lib/reading/traits-types';
import type { TypeKey } from '@/lib/saju';
import type { NbChoice, SexChoice } from '../flow/answers';
import { PawIcon } from '../icons';
import { Bubble, Narration, Panel } from '../webtoon';
import './result.css';
import { artFor, framingProps, sideOf } from './art-plan';

const T = UPSELL.chapters;
const U = RESULT_UI.chapters;
const S = UI.reading.steps.sex;

const CLOSED_TOTAL = 8;

export interface SexPick {
  sex: 'female' | 'male';
  choice: SexChoice;
  nb: NbChoice | null;
}

type TileState = 'past' | 'current' | 'next' | 'rest';

const TILE_CLASS: Record<TileState, string> = {
  past: 'bg-line-1 text-ink-soft',
  current: 'border-[1.5px] border-ink text-ink',
  next: 'border-[1.5px] border-ink bg-paper text-ink',
  rest: '',
};

function tileStates(chapter: ChapterInfo): { age: number; state: TileState }[] {
  const base = chapter.startAge - chapter.index * 10;
  return Array.from({ length: chapter.total }, (_, i) => {
    let state: TileState;

    if (chapter.beforeStart) state = i <= 1 ? 'next' : 'rest';
    else if (i < chapter.index) state = 'past';
    else if (i === chapter.index) state = 'current';
    else if (i === chapter.index + 1) state = 'next';
    else state = 'rest';
    return { age: base + i * 10, state };
  });
}

function Strip({ chapter }: { chapter: ChapterInfo | null }) {
  const label = !chapter
    ? U.stripLabelClosed
    : chapter.beforeStart
      ? U.stripLabelBefore(chapter.total)
      : U.stripLabel(chapter.index + 1, chapter.total);
  const tiles = chapter ? tileStates(chapter) : null;
  const count = tiles?.length ?? CLOSED_TOTAL;

  const hasHere = !!chapter && !chapter.beforeStart;

  return (
    <div className={hasHere ? 'mt-3' : 'mt-3'}>
      <div
        role="img"
        aria-label={label}
        className={`grid gap-1 ${hasHere ? 'pt-5' : ''}`}
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {(tiles ?? Array.from({ length: count }, () => null)).map((tile, i) => (
          <div key={i} className="relative">
            {tile?.state === 'current' ? (
              <span className="absolute inset-x-0 -top-5 flex justify-center text-ink" title={U.here}>
                <PawIcon size={16} line />
              </span>
            ) : null}
            {tile ? (
              <span
                aria-hidden="true"
                className={`rs-strip-tile ${TILE_CLASS[tile.state]}`}
                data-state={tile.state}
                style={tile.state === 'current' ? { background: 'var(--glow)' } : undefined}
              >
                {tile.age}
              </span>
            ) : (
              <span aria-hidden="true" className="rs-strip-tile rs-strip-tile--blank" />
            )}
          </div>
        ))}
      </div>
      {chapter ? <p className="wt-narration__note mt-2 !text-[0.8125rem] leading-snug">{U.stripCaption}</p> : null}
    </div>
  );
}

function Italic({ text, title }: { text: string; title: string }) {
  const at = text.indexOf(title);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <em className="font-semibold italic">{title}</em>
      {text.slice(at + title.length)}
    </>
  );
}

function SexChoices({ onPick, label }: { onPick: (sex: SexPick) => void; label: string }) {
  const [nonBinary, setNonBinary] = useState(false);

  if (nonBinary) {
    return (
      <div className="grid gap-3">
        <Bubble side="left" tail="none">
          <p>{S.nbLine}</p>
        </Bubble>
        <div role="group" aria-label={S.nbGroup} className="rs-answers">
          {}
          <button
            type="button"
            className="dg-btn dg-btn--paper dg-chip"
            onClick={() => onPick({ sex: 'male', choice: 'nonbinary', nb: 'yang' })}
          >
            {S.nbOptions.yang}
          </button>
          <button
            type="button"
            className="dg-btn dg-btn--paper dg-chip"
            onClick={() => onPick({ sex: 'female', choice: 'nonbinary', nb: 'yin' })}
          >
            {S.nbOptions.yin}
          </button>
          <button type="button" className="dg-btn dg-btn--paper dg-chip" onClick={() => setNonBinary(false)}>
            {S.nbOptions.skip}
          </button>
        </div>
        {}
        <p className="rs-nb-hint">{S.nbHint}</p>
      </div>
    );
  }

  return (
    <div role="group" aria-label={label} className="rs-answers">
      <button
        type="button"
        className="dg-btn dg-btn--paper dg-chip !px-4"
        onClick={() => onPick({ sex: 'female', choice: 'female', nb: null })}
      >
        {S.options.female}
      </button>
      <button
        type="button"
        className="dg-btn dg-btn--paper dg-chip !px-4"
        onClick={() => onPick({ sex: 'male', choice: 'male', nb: null })}
      >
        {S.options.male}
      </button>
      <button type="button" className="dg-btn dg-btn--paper dg-chip !px-4" onClick={() => setNonBinary(true)}>
        {S.options.nonbinary}
      </button>
    </div>
  );
}

export function ChapterPreview({
  chapter,
  when,
  onPickSex,
  failed,
  type,
}: {

  chapter: ChapterInfo | null;

  when: ChapterWhen | null;
  onPickSex: (sex: SexPick) => void;

  failed: boolean;

  type: TypeKey;
}) {
  const uid = useId();
  const current = useRef<HTMLDivElement>(null);

  const opened = useRef(false);

  useEffect(() => {
    if (chapter && opened.current) {
      opened.current = false;
      current.current?.focus({ preventScroll: true });
    }
  }, [chapter]);

  function pick(choice: SexPick) {
    opened.current = true;
    onPickSex(choice);
  }

  const headline = chapter ? U.headline(chapter, when) : null;
  const next = chapter ? U.next(chapter, when) : null;
  const rest = chapter ? U.restClosed(chapter) : null;

  return (
    <section aria-labelledby={`${uid}-title`}>
      <h3 id={`${uid}-title`} className="rs-eyebrow mb-5 px-1">
        {T.eyebrow}
      </h3>

      {}
      <Panel image={artFor('road', type) ?? undefined} {...framingProps('road')}>
        <Bubble side={sideOf('road', 'left')} tail="up" className="!max-w-[92%]">
          {chapter && headline ? (
            <p className="!text-[1.3125rem]">
              <Italic text={headline.lead} title={chapter.title} />
            </p>
          ) : (
            <p className="!text-[1.3125rem]">{T.needSex.line}</p>
          )}
        </Bubble>
        {chapter && headline ? (
          <Narration>
            <div ref={current} tabIndex={-1} className="outline-none">
              {!chapter.beforeStart ? <p className="wt-narration__note">{T.intro}</p> : null}
              <Strip chapter={chapter} />
              <p className="mt-3 font-medium">
                <Italic text={headline.detail} title={chapter.title} />
              </p>
              <p className="mt-2">{chapter.line}</p>

              <div className="mt-3 border-t border-line-2 pt-3">
                {next ? (
                  <>
                    <p className="wt-narration__note !font-semibold">{T.nextLabel}</p>
                    <p className="wt-narration__verdict mt-0.5 italic">{next}</p>
                  </>
                ) : (
                  <p className="wt-narration__note !font-medium">{T.lastChapter}</p>
                )}
              </div>
            </div>
          </Narration>
        ) : (
          <Narration>
            <p className="wt-narration__note">{T.needSex.why}</p>
            <Strip chapter={null} />
          </Narration>
        )}

        {chapter && headline ? (

          rest ? (
            <Bubble side="right" tail="none">
              <p>{rest}</p>
            </Bubble>
          ) : null
        ) : (
          <>
            <SexChoices onPick={pick} label={T.needSex.group} />
            {failed ? (
              <p role="alert" className="dg-error text-right">
                {U.failed}
              </p>
            ) : null}
          </>
        )}
      </Panel>
    </section>
  );
}
