'use client';

import type { CSSProperties } from 'react';
import { revealBlurMs, splitWords, wordDelays } from './logic';
import { useHostSeen } from './seen-context';
import { useSeen } from './use-seen';
import './mystic.css';

export function RevealText({ text, delayMs = 0 }: { text: string; delayMs?: number }) {
  const [ref, ownSeen] = useSeen<HTMLSpanElement>({ rootMargin: '0px 0px -6% 0px' });

  const hostSeen = useHostSeen();
  const seen = hostSeen ?? ownSeen;
  const tokens = splitWords(text);
  const words = tokens.filter((t) => t.word).length;
  const delays = wordDelays(words, delayMs);
  const style = { '--mx-blur-ms': `${revealBlurMs(words)}ms`, '--mx-blur-delay': `${Math.max(0, Math.round(delayMs))}ms` } as CSSProperties;

  return (
    <span ref={ref} className="mx-reveal" data-seen={seen ? 'true' : 'false'} style={style}>
      {tokens.map((t, i) =>
        t.word ? (
          <span key={`${i}:${t.text}`} className="mx-reveal-w" style={{ animationDelay: `${delays[t.index]}ms` }}>
            {t.text}
          </span>
        ) : (
          t.text
        ),
      )}
    </span>
  );
}
