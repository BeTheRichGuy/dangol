'use client';

import Link from 'next/link';
import { UI } from '@/content/ui';
import { ChevronLeftIcon } from '../icons';
import { RevealText } from '../mystic';
import { balloonsMax, bubbleDelay } from '../result/balloons';
import { Bubble, Panel } from '../webtoon';
import '../rooms/rooms.css';
import './reading-form.css';

export const INTRO_ART = '/media/webtoon/yul-intro.jpg';

export function ReadingIntro({ onStart }: { onStart: () => void }) {
  const lines = balloonsMax(UI.reading.intro.line);
  return (
    <div className="rf-screen rf-guided rf-intro">
      <main id="main" className="rf-main">
        <div className="rf-top">
          <Link href="/" className="rf-back" aria-label={UI.common.back}>
            <ChevronLeftIcon size={22} />
          </Link>
        </div>
        <div className="rf-form">
          <header className="rf-hook">
            <h1 className="rf-hook__title">{UI.reading.intro.hook.title}</h1>
            <p className="rf-hook__sub">{UI.reading.intro.hook.sub}</p>
          </header>
          <section className="rf-lead">
            <Panel image={INTRO_ART} alt="" aspect="portrait" overlap={64} eager bloom>
              {lines.map((text, i) => (
                <Bubble key={`${i}:${text}`} side="left" tail="none" delayMs={bubbleDelay(i)}>
                  <p className="rm-lines">
                    <RevealText text={text} delayMs={bubbleDelay(i)} />
                  </p>
                </Bubble>
              ))}
            </Panel>
          </section>
          <p className="rf-privacy">{UI.reading.form.privacy}</p>
          <div className="rf-submit">
            <button type="button" className="rf-next" aria-disabled="false" onClick={onStart}>
              {UI.reading.intro.answer}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
