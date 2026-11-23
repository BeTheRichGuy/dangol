'use client';

import { useRef, useState } from 'react';
import type { ConcernKey } from '@/content/concerns';
import { FREE_RESULT as T } from '@/content/continue';
import type { TeaserCard } from '@/lib/reading/teasers';
import type { ConcernLine, Reading } from '@/lib/reading/types';
import type { TypeKey } from '@/lib/saju';
import { UI } from '@/content/ui';
import { ChapterTitle, Narration } from '../webtoon';
import { useReducedMotion } from '../use-reduced-motion';
import { CandyPanel, ConcernPanel, HandBeat, QuestionPanel, SaltPanel } from './verdict-panels';
import { concernChapterTitle } from './webtoon-text';

export function ChapterConcern({
  concern,
  concernLine,
  question,
  teasers = null,
  reading,
  type,
}: {
  concern: ConcernKey | null;

  question: string;
  concernLine: ConcernLine | null;

  teasers?: TeaserCard[] | null;
  reading: Reading;
  type: TypeKey;
}) {
  const [saltOpen, setSaltOpen] = useState(false);
  const saltRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  function openSalt() {
    setSaltOpen(true);

    requestAnimationFrame(() => {
      saltRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  }

  if (teasers) {
    if (question.trim() === '') return null;
    return (
      <section className="px-4">
        <div className="mt-8">
          <Narration voice="stage">
            <p>{T.questionLine}</p>
          </Narration>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="chapter-concern" className="px-4">
      <ChapterTitle id="chapter-concern">
        {concern ? concernChapterTitle(concern) : question ? UI.result.question.title : UI.result.question.titleNone}
      </ChapterTitle>

      {}
      {!concern ? (
        <div className="mt-8">
          <QuestionPanel question={question} type={type} />
        </div>
      ) : null}

      {}
      {concernLine ? (
        <div className="mt-8">
          <ConcernPanel text={concernLine.text} type={type} />
        </div>
      ) : null}

      {}
      <div className={concernLine ? 'mt-4' : 'mt-8'}>
        <CandyPanel reading={reading} type={type} />
      </div>

      {}
      <div className="mt-14">
        <HandBeat opened={saltOpen} onOpen={openSalt} type={type} />
      </div>
      {saltOpen ? (
        <div ref={saltRef} className="mt-12 scroll-mt-4">
          <SaltPanel reading={reading} type={type} />
        </div>
      ) : null}
    </section>
  );
}
