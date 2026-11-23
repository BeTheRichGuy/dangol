'use client';

import type { CSSProperties, ReactNode, RefObject } from 'react';
import { HostSeenContext } from '@/components/mystic';
import { RESULT_UI } from '@/content/result-ui';
import { usePanelMouth } from './panel-context';
import { useSeen } from './use-seen';
import './webtoon.css';

export type BubbleSide = 'left' | 'right';

export interface BubbleProps {

  speaker?: 'yul';

  who?: string;

  side?: BubbleSide;

  tail?: 'down' | 'up' | 'none';

  size?: 'lg';

  caption?: string;

  label?: string;
  italic?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;

  mouth?: number;

  centered?: boolean;

  delayMs?: number;
}

export function Bubble(props: BubbleProps) {
  return props.delayMs === undefined ? <BubbleView {...props} /> : <TimedBubble {...props} />;
}

function TimedBubble(props: BubbleProps) {
  const [ref, seen] = useSeen<HTMLDivElement>({ rootMargin: '0px 0px -6% 0px' });

  return (
    <HostSeenContext.Provider value={seen}>
      <BubbleView {...props} rootRef={ref} seen={seen} />
    </HostSeenContext.Provider>
  );
}

function BubbleView({
  speaker = 'yul',
  who,
  side = 'left',
  tail = 'none',
  size,
  caption,
  label,
  italic = false,
  children,
  className = '',
  style,
  id,
  mouth,
  centered = false,
  delayMs,
  rootRef,
  seen,
}: BubbleProps & { rootRef?: RefObject<HTMLDivElement | null>; seen?: boolean }) {
  const ctxMouth = usePanelMouth();
  const aim = tail === 'none' ? undefined : (mouth ?? ctxMouth ?? undefined);
  const head = caption ?? label;
  const timed = delayMs !== undefined;

  const vars: CSSProperties = {
    ...(aim !== undefined ? { ['--wt-mouth' as string]: aim } : null),
    ...(timed ? { ['--wt-delay' as string]: `${delayMs}ms` } : null),
    ...style,
  } as CSSProperties;
  const timing = {
    ref: rootRef,
    'data-timed': timed ? '' : undefined,
    'data-seen': timed ? String(Boolean(seen)) : undefined,
  };

  const bubble = (
    <div
      id={id}
      className={head ? 'wt-bubble' : `wt-bubble ${className}`}
      data-side={side}
      data-tail={tail === 'none' ? undefined : tail}
      data-size={size}
      data-italic={italic ? '' : undefined}
      data-speaker={speaker}
      data-mouth={aim !== undefined ? '' : undefined}
      data-center={centered ? '' : undefined}
      style={head ? undefined : vars}
      {...(head ? null : timing)}
    >
      {who !== undefined ? (
        head === who ? null : <span className="sr-only">{who}: </span>
      ) : speaker === 'yul' ? (
        <span className="sr-only">{RESULT_UI.whatISee.yulSays} </span>
      ) : null}
      {children}
    </div>
  );

  if (!head) return bubble;
  return (
    <div className={`wt-bubble-group ${className}`} data-side={side} data-center={centered ? '' : undefined} style={vars} {...timing}>
      <p className="wt-caption">{head}</p>
      {bubble}
    </div>
  );
}

export function MyBubble({ children }: { children: ReactNode }) {
  return (
    <div className="wt-me">
      <span className="sr-only">{RESULT_UI.whatISee.yourAnswer} </span>
      {children}
    </div>
  );
}

export function WritingBubble({ side = 'left', className = '' }: { side?: BubbleSide; className?: string }) {
  return (
    <div className={`wt-bubble wt-pop ${className}`} data-side={side} aria-hidden="true" style={{ minWidth: 84 }}>
      <span className="wt-dots">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
