'use client';

import { useId } from 'react';
import { RESULT_UI } from '@/content/result-ui';
import { UPSELL } from '@/content/upsell';
import type { TraitReading } from '@/lib/reading/traits-types';
import type { TypeKey } from '@/lib/saju';
import { Bubble, Panel } from '../webtoon';
import './result.css';
import { artFor, framingProps, type ArtSlot } from './art-plan';
import { CLASH_GLYPH, GROUP_GLYPH, PALACE_GLYPH } from '@/content/en/glyphs';

const T = UPSELL.whatISee;
const R = RESULT_UI.whatISee;

const HIT_SLOTS: readonly ArtSlot[] = ['hit1', 'hit2', 'hit3'];

export type TimeNote = 'unknown' | 'nearMidnight' | null;

export function WhatISee({
  traits,
  type,
  timeNote,
  onFixTime,
}: {
  traits: TraitReading;

  who?: number;

  type: TypeKey;

  timeNote: TimeNote;

  onFixTime: () => void;
}) {
  const uid = useId();
  const hits = traits.hits;
  const note = timeNote ? R.timeNote[timeNote] : null;

  return (
    <section aria-labelledby={`${uid}-title`}>
      <div className="px-1">
        <h3 id={`${uid}-title`} className="rs-eyebrow">
          {T.heading}
        </h3>
      </div>

      <ol className="m-0 mt-6 grid list-none gap-12 p-0">
        {HIT_SLOTS.map((slot, i) => {
          const hit = hits[i];
          if (!hit) return null;
          const image = artFor(slot, type) ?? undefined;

          const glyph = image
            ? undefined
            : slot === 'hit2'
              ? GROUP_GLYPH[traits.features.dominant]
              : slot === 'hit3'
                ? hit.kind === 'tension'
                  ? CLASH_GLYPH
                  : traits.features.palace === traits.features.dominant
                    ? PALACE_GLYPH
                    : GROUP_GLYPH[traits.features.palace]
                : undefined;
          return (
            <li key={hit.id}>
              <Panel
                image={image}
                {...framingProps(slot)}
                glyph={glyph}
                glyphSide="right"

                overlap={image && i > 0 ? 0 : undefined}
              >
                {}
                {i === 0 ? (
                  <Bubble side="left" tail={image ? 'up' : 'none'}>
                    <p>{T.intro}</p>
                  </Bubble>
                ) : null}
                <Bubble side="left" tail="none" caption={T.labels[hit.kind]}>
                  <p>{hit.text}</p>
                </Bubble>
              </Panel>
            </li>
          );
        })}
      </ol>

      {note ? (
        <div className="mt-8">
          <Bubble side="left">
            <p>{note}</p>
            <button type="button" className="dg-link -ml-3 mt-1 text-[1rem]" onClick={onFixTime}>
              {timeNote === 'nearMidnight' ? R.timeNote.linkCheck : R.timeNote.linkUnknown}
            </button>
          </Bubble>
        </div>
      ) : null}
    </section>
  );
}
