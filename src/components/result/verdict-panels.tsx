'use client';

import { useId, useState } from 'react';
import { RevealText } from '@/components/mystic';
import { WEBTOON } from '@/content/webtoon';
import { UI } from '@/content/ui';
import type { Reading } from '@/lib/reading/types';
import type { TypeKey } from '@/lib/saju';
import { CandyIcon, ChevronDownIcon, HandIcon, SaltDishIcon } from '../icons';
import { Bubble, MyBubble, Narration, Panel } from '../webtoon';
import './result.css';
import { artFor, framingProps, sideOf } from './art-plan';
import { balloonsMax, bubbleDelay, isShortOpener } from './balloons';
import { HAND_GLYPH } from '@/content/en/glyphs';
import { DustWhenSeen } from './scenes';
import { concernBalloons } from './webtoon-text';

const other = (side: 'left' | 'right') => (side === 'left' ? 'right' : 'left');

const LEVEL_COUNT = { pinch: 1, spoonful: 2, handful: 3 } as const;

export function ConcernPanel({ text, type }: { text: string; type: TypeKey }) {
  const balloons = concernBalloons(text);
  const first = sideOf('concern');
  return (
    <Panel
      image={artFor('concern', type) ?? undefined}
      {...framingProps('concern')}
      bloom
      layer={<DustWhenSeen density={0.5} />}
      className="wt-mood-tease"
    >
      {balloons.map((part, i) => (
        <Bubble
          key={i}
          side={i % 2 === 0 ? first : other(first)}
          tail={i === 0 ? 'up' : 'none'}

          centered={i === 0 && balloons.length > 1 && isShortOpener(part)}
          delayMs={bubbleDelay(i)}
        >
          <p>
            <RevealText text={part} delayMs={bubbleDelay(i)} />
          </p>
        </Bubble>
      ))}
    </Panel>
  );
}

export function QuestionPanel({ question, type }: { question: string; type: TypeKey }) {
  const first = sideOf('concern');
  return (
    <Panel
      image={artFor('concern', type) ?? undefined}
      {...framingProps('concern')}
      bloom
      layer={<DustWhenSeen density={0.5} />}
      className="wt-mood-tease"
    >
      <Bubble side={first} tail="up">
        <p>
          <RevealText text={question ? UI.result.question.lead : UI.result.question.none} />
        </p>
      </Bubble>
      {question ? (
        <Narration>
          <p className="rs-question">{UI.result.question.quote(question)}</p>
          <p className="mt-2">{UI.result.question.promise}</p>
        </Narration>
      ) : null}
    </Panel>
  );
}

function TitleLines({ text }: { text: string }) {
  const m = text.match(/^(.+?[,、，])s*(.+)$/);
  if (!m) return <span>{text}</span>;
  return (
    <span>
      <span className="block">{m[1]}</span>
      <span className="block">{m[2]}</span>
    </span>
  );
}

export function CandyPanel({ reading, type }: { reading: Reading; type: TypeKey }) {
  const parts = balloonsMax(reading.candy.text);
  const first = sideOf('candy', 'right');
  return (
    <Panel image={artFor('candy', type) ?? undefined} {...framingProps('candy')} className="wt-mood-sweet">
      {parts.map((part, i) =>
        i === 0 ? (
          <Bubble key={i} side={first} tail="up" size="lg">
            <h3 className="wt-bubble__title">
              <CandyIcon size={26} />
              <TitleLines text={UI.result.candy.title} />
            </h3>
            <p>{part}</p>
          </Bubble>
        ) : (
          <Bubble key={i} side={i % 2 === 0 ? first : other(first)} tail="none">
            <p>{part}</p>
          </Bubble>
        ),
      )}
    </Panel>
  );
}

export function HandBeat({ opened, onOpen, type }: { opened: boolean; onOpen: () => void; type: TypeKey }) {
  const image = artFor('hand', type) ?? undefined;
  return (
    <Panel image={image} {...framingProps('hand')} align="narrow" className="rs-hand" glyph={image ? undefined : HAND_GLYPH}>
      <Bubble side="left" tail="none">
        <p>{WEBTOON.handPrompt}</p>
      </Bubble>
      {opened ? (
        <MyBubble>{UI.result.hand.button}</MyBubble>
      ) : (
        <>
          <div className="rs-answers">
            <button type="button" className="dg-btn dg-btn--paper dg-chip" onClick={onOpen}>
              <HandIcon size={24} />
              {UI.result.hand.button}
            </button>
          </div>
          <p className="rs-hand__hint">{UI.result.hand.hint}</p>
        </>
      )}
    </Panel>
  );
}

export function SaltPanel({ reading, type }: { reading: Reading; type: TypeKey }) {
  const uid = useId();
  const [whyOpen, setWhyOpen] = useState(false);
  const { level, line } = reading.salt;
  const count = LEVEL_COUNT[level];
  const parts = balloonsMax(line.situation);
  const first = sideOf('salt');

  return (
    <Panel image={artFor('salt', type) ?? undefined} {...framingProps('salt')} dim className="wt-mood-warn">
      <Bubble side={first} tail="up" size="lg">
        <h3 className="wt-bubble__title">
          <span className="inline-flex items-center gap-0.5" role="img" aria-label={UI.result.salt.levelLabel(level)}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ opacity: i < count ? 1 : 0.28 }}>
                <SaltDishIcon size={26} filled={i < count} />
              </span>
            ))}
          </span>
          <TitleLines text={UI.result.salt.title[level]} />
        </h3>
        {}
        <p className="wt-bubble__small text-ink-soft">{line.when}</p>
        <p>{parts[0]}</p>
      </Bubble>
      {parts.slice(1).map((part, i) => (
        <Bubble key={part} side={i % 2 === 0 ? other(first) : first} tail="none">
          <p>{part}</p>
        </Bubble>
      ))}

      {}
      <Bubble side={parts.length % 2 === 1 ? other(first) : first} tail="none" caption={UI.result.salt.try}>
        <p className="wt-bubble__small">{line.action}</p>
      </Bubble>

      <Narration side="right" voice="stage">
        <p>{WEBTOON.notCurse}</p>
      </Narration>

      {}
      <div className="grid justify-items-start gap-2">
        <button
          type="button"
          className="dg-link -ml-1.5 gap-1 text-[0.875rem]"
          aria-expanded={whyOpen}
          aria-controls={`${uid}-why`}
          onClick={() => setWhyOpen((v) => !v)}
        >
          {whyOpen ? UI.result.salt.hideWhy : UI.result.salt.why}
          <ChevronDownIcon size={16} style={{ transform: whyOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms var(--ease-out)' }} />
        </button>
        <div id={`${uid}-why`} className="reveal w-full" data-open={whyOpen} inert={!whyOpen}>
          <div>
            <Narration>
              <p className="wt-narration__note !font-medium">{UI.result.salt.whyIntro}</p>
              <ul className="m-0 mt-2 grid list-disc gap-1.5 pl-5 text-[0.9375rem] leading-snug text-ink">
                {reading.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </Narration>
          </div>
        </div>
      </div>
    </Panel>
  );
}
