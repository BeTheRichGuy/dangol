'use client';

import { Fragment } from 'react';
import { RevealText } from '@/components/mystic';
import { WEBTOON } from '@/content/webtoon';
import type { TraitReading } from '@/lib/reading/traits-types';
import type { Chart, TypeKey } from '@/lib/saju';
import type { TypeProfile } from '@/lib/reading/types';
import { Bubble, ChapterTitle, Narration, Panel } from '../webtoon';
import { artFor, framingProps, sideOf } from './art-plan';
import { balloonsMax, bubbleDelay } from './balloons';
import { ChartDetails } from './pillars';
import { DustWhenSeen, LanternScene, OrbScene } from './scenes';
import { WhatISee, type TimeNote } from './what-i-see';
import { elementTalk, introLine, pillarsLine, seedOf, sogeumBreakLine, typeCaptionOf } from './webtoon-text';

function Caption({ text, hanzi }: { text: string; hanzi: string }) {
  const parts = text.split(hanzi);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 ? <span className="t-hanja not-italic">{hanzi}</span> : null}
        </Fragment>
      ))}
    </>
  );
}

export function ChapterWho({
  chart,
  profile,
  traits,
  name,
  who,
  timeNote,
  onFixTime,
}: {
  chart: Chart;
  profile: TypeProfile;
  traits: TraitReading | null;
  name: string;

  who: number;
  timeNote: TimeNote;
  onFixTime: () => void;
}) {
  const type: TypeKey = profile.key;
  const seed = seedOf(chart);

  const readBubbles = elementTalk(chart, traits?.features.missing, seed).flatMap((talk) => balloonsMax(talk.text));
  const readSide = sideOf('read');

  return (
    <section aria-labelledby="chapter-who" className="px-4">
      <ChapterTitle id="chapter-who">{WEBTOON.chapterWho}</ChapterTitle>

      {}
      <div className="mt-8">
        <Panel image={artFor('who', type) ?? undefined} {...framingProps('who')} eager>
          <Bubble side={sideOf('who')} tail="up">
            <p>{introLine(seed, name)}</p>
          </Bubble>
        </Panel>
      </div>

      {}
      <div className="mt-16">
        <Panel image={artFor('type', type) ?? undefined} {...framingProps('type')} vision>
          <Narration side="left" serif>
            {}
            <p className="wt-narration__note italic">{WEBTOON.typeSmoke[type]}</p>
            <p className="wt-narration__lead mt-2">
              <em>
                <Caption text={typeCaptionOf(profile.born, profile.hanzi)} hanzi={profile.hanzi} />
              </em>
            </p>
            <p className="wt-narration__verdict mt-1">{profile.identity}</p>
            <p className="wt-narration__note mt-2">{profile.inLove}</p>
          </Narration>
        </Panel>
      </div>

      {}
      <div className="mt-16">
        <Panel scene={<LanternScene chart={chart} />} layer={<DustWhenSeen density={0.6} />} hang>
          <Bubble side="right" tail="up" delayMs={bubbleDelay(0)}>
            <p>
              <RevealText text={pillarsLine(seed)} delayMs={bubbleDelay(0)} />
            </p>
          </Bubble>
        </Panel>
      </div>

      {}
      <div className="mt-14">
        <Panel scene={<OrbScene chart={chart} />} layer={<DustWhenSeen density={0.5} />} align="left" />
      </div>
      <div className="mt-4">
        <Panel image={artFor('read', type) ?? undefined} {...framingProps('read')}>
          {readBubbles.map((part, i) => (
            <Bubble
              key={i}
              side={i % 2 === 0 ? readSide : readSide === 'left' ? 'right' : 'left'}
              tail={i === 0 ? 'up' : 'none'}
              delayMs={bubbleDelay(i)}
            >
              <p>
                <RevealText text={part} delayMs={bubbleDelay(i)} />
              </p>
            </Bubble>
          ))}
        </Panel>
      </div>

      {}
      <div className="mt-8">
        <ChartDetails chart={chart} />
      </div>

      {}
      {traits && traits.hits.length >= 3 ? (
        <div className="mt-16">
          <WhatISee traits={traits} who={who} type={type} timeNote={timeNote} onFixTime={onFixTime} />
        </div>
      ) : null}

      {}
      <div className="mt-16">
        <Panel image={artFor('sleep', type) ?? undefined} {...framingProps('sleep')}>
          <Narration voice="stage">
            <p>{sogeumBreakLine(seed)}</p>
          </Narration>
        </Panel>
      </div>
    </section>
  );
}
