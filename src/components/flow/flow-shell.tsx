'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { UI } from '@/content/ui';
import { ChevronLeftIcon } from '../icons';
import type { SceneId } from '../scene/manifest';
import { sceneStill } from '../scene/resolve';
import { SceneStage, type SceneReaction } from '../scene/scene-stage';
import { Stage } from '../stage';
import { useReducedMotion } from '../use-reduced-motion';
import { rememberAnswerOrigin } from './answer-origin';
import { ChatSkeleton } from './chat-log';
import { FlowReadyContext } from './flow-context';
import { useGateArrival } from './gate';

export type { SceneId };

function ProgressTicks({ index, total }: { index: number; total: number }) {
  return (
    <div role="img" aria-label={UI.reading.progress(index + 1, total)} className="flex h-11 items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="dg-tick" data-on={i <= index} />
      ))}
    </div>
  );
}

export function FlowFrame({
  scene,
  prefetch,
  reaction,
  onReactionEnd,
  progress,
  onBack,
  log,
  overlay,
  body,
  stepKey,
  tray = false,
  dense = false,
  ready,
  onTap,
}: {
  scene: SceneId;
  prefetch?: SceneId | null;
  reaction?: SceneReaction | null;

  onReactionEnd?: (key: number) => void;
  progress?: { index: number; total: number };
  onBack?: () => void;

  log: ReactNode;

  overlay?: ReactNode;

  body?: ReactNode;

  stepKey: string;

  tray?: boolean;

  dense?: boolean;

  ready: boolean;

  onTap?: () => void;
}) {

  const [paperShown, setPaperShown] = useState(tray);
  if (ready && paperShown !== tray) setPaperShown(tray);
  const paper = ready ? tray : paperShown;

  const open = ready || !body;
  const reduced = useReducedMotion();

  const arrived = useGateArrival() !== null;

  const innerRef = useRef<HTMLDivElement>(null);
  const leaveRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const inner = innerRef.current;
    const leave = leaveRef.current;
    if (!inner || !leave || reduced || typeof MutationObserver === 'undefined') return;
    const timers: number[] = [];
    const mo = new MutationObserver((records) => {
      for (const rec of records) {
        rec.removedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement) || !node.classList.contains('dg-answer__pad') || node.childElementCount === 0) return;
          node.classList.add('dg-answer__leaving');
          node.setAttribute('inert', '');
          node.setAttribute('aria-hidden', 'true');

          node.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
          leave.appendChild(node);
          timers.push(window.setTimeout(() => node.remove(), 240));
        });
      }
    });
    mo.observe(inner, { childList: true });
    return () => {
      mo.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      leave.replaceChildren();
    };
  }, [reduced]);

  return (
    <Stage backdrop={sceneStill(scene)} night>
      <FlowReadyContext value={ready}>
        <main
          id="main"
          className="dg-main relative isolate z-10 flex min-h-dvh flex-col overflow-hidden"
          data-dense={dense || undefined}
          onClick={
            onTap
              ? (e) => {
                  const target = e.target as Element;
                  if (target.closest('button, a, input, select, textarea, label, [role="option"]')) return;
                  onTap();
                }
              : undefined
          }
        >
          <div className="absolute inset-0 -z-10">
            <div className={`dg-scenebox ${arrived ? 'dg-scene-arrive' : ''}`}>
              <SceneStage scene={scene} prefetch={prefetch} reaction={reaction} onReactionEnd={onReactionEnd} priority />
            </div>
            {}
            <div aria-hidden="true" className="dg-night-vignette" />
            <div aria-hidden="true" className="dg-top-scrim dg-top-scrim--night" />
            <div aria-hidden="true" className="dg-night-veil" />
          </div>

          <header className="relative z-10 flex items-center justify-between gap-3 px-4 pt-[max(12px,var(--safe-top))]">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label={UI.common.back}
                className="dg-btn dg-btn--glass !min-h-11 !w-11 !rounded-full !p-0"
              >
                <ChevronLeftIcon size={22} />
              </button>
            ) : (
              <span className="block w-11" aria-hidden="true" />
            )}
            {progress ? <ProgressTicks index={progress.index} total={progress.total} /> : <span />}
            <span className="block w-11" aria-hidden="true" />
          </header>

          {}
          <div className="dg-chat-area">{log}</div>

          {overlay}

          {}
          <div
            className="dg-answer relative z-10"
            data-open={open}
            data-paper={paper && !!body}
            onClickCapture={(e) => {
              const button = (e.target as Element).closest('button');
              if (button) rememberAnswerOrigin(button);
            }}
          >
            <div ref={innerRef} className="dg-answer__in">
              <div ref={leaveRef} className="dg-answer__leave" aria-hidden="true" />
              <div
                key={stepKey}
                className={`dg-answer__pad ${body ? (ready ? 'dg-rise' : 'dg-pending') : ''}`}
                inert={!ready}
              >
                {body}
              </div>
            </div>
          </div>
        </main>
      </FlowReadyContext>
    </Stage>
  );
}

export function FlowFallback({ scene = 'listen' }: { scene?: SceneId }) {
  return <FlowFrame scene={scene} log={<ChatSkeleton />} stepKey="loading" ready={false} />;
}
