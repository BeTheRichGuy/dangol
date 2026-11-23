'use client';

import { Fragment } from 'react';
import { activeLocale } from '@/content/locale';
import { ROOMS_COPY } from '@/content/rooms';
import { parseReading, visibleBlocks, type Inline } from './reading-blocks';

export const partId = (n: number) => `room-part-${n}`;

function Lines({ lines }: { lines: Inline[] }) {
  return (
    <>
      {lines.map((parts, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          <Text parts={parts} />
        </Fragment>
      ))}
    </>
  );
}

function Text({ parts }: { parts: Inline }) {
  return (
    <>
      {parts.map((p, i) => (p.bold ? <strong key={i}>{p.text}</strong> : <Fragment key={i}>{p.text}</Fragment>))}
    </>
  );
}

export function ReadingText({ text, streaming, leadAtStart = false }: { text: string; streaming: boolean; leadAtStart?: boolean }) {

  const blocks = visibleBlocks(parseReading(text, { leadAtStart, chunk: activeLocale() === 'ko' ? 0 : 3 }));

  const nums: number[] = [];
  for (let i = 0, n = 0; i < blocks.length; i += 1) nums.push(blocks[i].kind === 'h2' ? ++n : n);
  return (
    <div className="rm-r" data-streaming={streaming ? '' : undefined}>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'h2':
            return (
              <h2 key={i} id={partId(nums[i])} className="rm-r__h2">
                <span className="rm-r__num" aria-hidden="true">
                  {String(nums[i]).padStart(2, '0')}
                </span>
                {b.text}
              </h2>
            );
          case 'lead':
            return (
              <p key={i} className="rm-r__lead">
                {b.text}
              </p>
            );
          case 'h3':
            return (
              <h3 key={i} className="rm-r__h3">
                {b.text}
              </h3>
            );
          case 'evidence':

            return null;
          case 'summary':
            return (
              <aside key={i} className="rm-r__sum" aria-label={ROOMS_COPY.page.summaryLabel}>
                <p className="rm-r__sum-label">{ROOMS_COPY.page.summaryLabel}</p>
                <ul className="rm-r__sum-list">
                  {b.items.map((item, j) => (
                    <li key={j}>
                      <Text parts={item} />
                    </li>
                  ))}
                </ul>
              </aside>
            );
          case 'callout':
            return (
              <p key={i} className="rm-r__key">
                <Text parts={b.text} />
              </p>
            );
          case 'list':
            return (
              <ul key={i} className="rm-r__list">
                {b.items.map((item, j) => (
                  <li key={j}>
                    <Text parts={item} />
                  </li>
                ))}
              </ul>
            );
          case 'line':
            return (
              <p key={i} className="rm-r__p">
                <Lines lines={b.lines} />
              </p>
            );
        }
      })}
      {streaming ? <span className="rm-r__caret" aria-hidden="true" /> : null}
    </div>
  );
}
