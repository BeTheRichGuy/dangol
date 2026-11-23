'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { UI } from '@/content/ui';
import { useReducedMotion } from '../use-reduced-motion';
import { takeAnswerOrigin } from './answer-origin';
import { NameTag } from './dialogue-box';

export type ChatState = 'typing' | 'typed' | 'full';

export interface ChatMsg {

  id: string;
  who: 'yul' | 'me';
  text: string;
  state: ChatState;

  instant?: boolean;

  fresh?: boolean;

  pace?: 'slow';

  onTyped?: () => void;
}

const FAST = { perChar: 10, max: 900, pause: 0 } as const;

const SLOW = { perChar: 18, max: 1500, pause: 110 } as const;

const FLIP_MS = 260;
const MAX_RENDER = 5;
const PAUSE_AFTER = new Set(['.', '?', '!', ',', '—', '…']);

const NAMETAG_OVERHANG = 20;

function typingSchedule(text: string, pace: typeof FAST | typeof SLOW): number[] {
  const at: number[] = [];
  let t = 0;
  for (let i = 0; i < text.length; i += 1) {
    at.push(t);
    t += pace.perChar;
    if (pace.pause > 0 && PAUSE_AFTER.has(text[i]) && text[i + 1] === ' ') t += pace.pause;
  }
  const scale = t > pace.max ? pace.max / t : 1;
  return scale === 1 ? at : at.map((x) => x * scale);
}

function TypedLine({
  text,
  animate,
  slow,
  onDone,
}: {
  text: string;
  animate: boolean;
  slow: boolean;
  onDone?: () => void;
}) {
  const [count, setCount] = useState(animate ? 0 : text.length);
  const shown = animate ? count : text.length;
  const done = shown >= text.length;
  const schedule = useMemo(() => typingSchedule(text, slow ? SLOW : FAST), [text, slow]);

  useEffect(() => {
    if (!animate || done) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      let next = 0;
      while (next < schedule.length && schedule[next] <= elapsed) next += 1;
      setCount(next);
      if (next < schedule.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, done, schedule]);

  useEffect(() => {
    if (done) onDone?.();
  }, [done, onDone]);

  return (
    <span aria-hidden="true">
      <span>{text.slice(0, shown)}</span>
      <span className="invisible">{text.slice(shown)}</span>
    </span>
  );
}

export function TypingDots() {
  return (
    <span className="dg-dots" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function MeBubble({ msg }: { msg: ChatMsg }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const fresh = msg.fresh === true;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !fresh || reduced) return;
    const from = takeAnswerOrigin();
    if (!from) return;

    el.parentElement?.getAnimations().forEach((a) => a.cancel());
    const to = el.getBoundingClientRect();
    if (to.width <= 0 || to.height <= 0) return;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const sx = Math.min(2, Math.max(0.5, from.width / to.width));
    const sy = Math.min(1.6, Math.max(0.6, from.height / to.height));
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.15 },
        { opacity: 1, offset: 0.3 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 320, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    );
  }, [fresh, reduced]);

  return (
    <div ref={ref} className="dg-bubble dg-bubble--me">
      <span className="sr-only">{UI.reading.chat.you}: </span>
      {msg.text}
    </div>
  );
}

function Bubble({ msg, first }: { msg: ChatMsg; first: boolean }) {
  if (msg.who === 'me') return <MeBubble msg={msg} />;
  const typing = msg.state === 'typing';
  return (
    <div className="dg-bubble dg-bubble--yul" data-first={first || undefined} data-typing={typing || undefined}>
      {first ? <NameTag /> : null}
      {typing ? (
        <TypingDots />
      ) : (
        <span className="dg-bubble__text">
          {}
          <span className="sr-only">
            {UI.common.yul}: {msg.text}
          </span>
          <TypedLine
            key={msg.text}
            text={msg.text}
            animate={msg.state === 'typed' && !msg.instant}
            slow={msg.pace === 'slow'}
            onDone={msg.state === 'typed' ? msg.onTyped : undefined}
          />
        </span>
      )}
    </div>
  );
}

function useFlip(ref: RefObject<HTMLElement | null>, reduced: boolean) {
  const last = useRef<Map<string, { top: number; height: number }>>(new Map());
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const base = el.getBoundingClientRect().top;
    const next = new Map<string, { top: number; height: number }>();
    for (const node of Array.from(el.children) as HTMLElement[]) {
      const id = node.dataset.id;
      if (!id) continue;
      const box = { top: base + node.offsetTop, height: node.offsetHeight };
      next.set(id, box);
      const before = last.current.get(id);

      if (!reduced && node.dataset.age !== 'gone' && before && Math.abs(before.height - box.height) < 1 && Math.abs(before.top - box.top) > 1) {
        node.animate(
          [{ transform: `translateY(${before.top - box.top}px)` }, { transform: 'translateY(0)' }],
          { duration: FLIP_MS, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
        );
      }
    }
    last.current = next;
  });
}

function useClipAtTop(ref: RefObject<HTMLElement | null>) {
  const measureRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const nodes = Array.from(el.children) as HTMLElement[];

      let latestYul: HTMLElement | null = null;
      for (const node of nodes) {
        if (node.dataset.who === 'yul' && node.dataset.age !== 'gone') latestYul = node;
      }
      for (const node of nodes) {

        if (node.dataset.age === '2') node.setAttribute('data-folded', '');
        else if (node.dataset.age !== 'gone') node.removeAttribute('data-folded');

        const limit = node.dataset.first ? NAMETAG_OVERHANG : 0;
        if (node !== latestYul && node.offsetTop < limit) node.setAttribute('data-clip', '');
        else node.removeAttribute('data-clip');
      }
    };
    measureRef.current = measure;
    measure();
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measureRef.current());
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
}

export function ChatLog({ messages, visible }: { messages: readonly ChatMsg[]; visible: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useFlip(ref, reduced);
  useClipAtTop(ref);

  const start = Math.max(0, messages.length - MAX_RENDER);
  const recent = messages.slice(start);

  const groupStarts = recent.map((m, i) => m.who === 'yul' && messages[start + i - 1]?.who !== 'yul');
  const latestGroup = groupStarts.lastIndexOf(true);

  return (
    <div ref={ref} className="dg-chat" role="log" aria-live="polite" aria-relevant="additions text">
      {recent.map((m, i) => {
        const age = recent.length - 1 - i;
        const first = groupStarts[i] && i === latestGroup;
        return (
          <div
            key={m.id}
            data-id={m.id}
            data-who={m.who}
            data-first={first || undefined}
            data-age={age < visible ? age : 'gone'}
            aria-live={m.who === 'me' ? 'off' : undefined}
            className={`dg-msg ${m.fresh ? 'dg-msg--fresh' : ''}`}
          >
            <Bubble msg={m} first={first} />
          </div>
        );
      })}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="dg-chat" aria-hidden="true">
      <div className="dg-msg" data-who="yul" data-first="true" data-age="0">
        <div className="dg-bubble dg-bubble--yul" data-first="true">
          <NameTag />
          <div className="skeleton h-5 w-[88%] rounded-md" />
          <div className="skeleton mt-3 h-5 w-[62%] rounded-md" />
        </div>
      </div>
    </div>
  );
}
