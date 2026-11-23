'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { STORY_DRAFT as T } from '@/content/ko/story-draft';
import { StoryBeats } from './story-strip';
import './story-draft.css';

export function StoryDraft() {
  const [chosen, setChosen] = useState(false);
  const after = useRef<HTMLDivElement>(null);

  function choose() {
    setChosen(true);
    requestAnimationFrame(() => after.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  return (
    <main className="sd-page" lang="ko">
      <div className="sd">
        <header className="sdd-head">
          <p>{T.episode}</p>
          <h1>{T.title}</h1>
        </header>
        <StoryBeats beats={T.before} onChoose={choose} chosen={chosen} />
        {chosen ? (
          <div ref={after}>
            <StoryBeats beats={T.after} />
            <div className="sdd-end">
              <p className="sdd-end__done">{T.end.done}</p>
              <p className="sdd-end__label">{T.end.nextLabel}</p>
              <p className="sdd-end__next">{T.end.nextTitle}</p>
              <Link className="sdd-end__cta" href="/reading?step=form&l=ko">
                {T.end.cta}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
