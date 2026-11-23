'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { XmasPlay } from '@/content/xmas';
import { Balloon, StoryBeats } from '../story/story-strip';
import { FrostWipe, HoldToPull } from './xmas-play';

type Of<K extends XmasPlay['kind']> = Extract<XmasPlay, { kind: K }>;

export interface LanternMonth {
  year: number;
  month: number;
  pull: boolean;

  caution: boolean;
}

export const LANTERN_STEP_MS = 110;

function LanternPlay({ play, months, done: was, onDone }: { play: Of<'lanterns'>; months: readonly LanternMonth[]; done: boolean; onDone: () => void }) {
  const [lit, setLit] = useState(was ? months.length : 0);
  const [going, setGoing] = useState(false);
  const done = lit >= months.length;
  const told = useRef(false);
  useEffect(() => {
    if (!going || done) return;
    const t = window.setTimeout(() => setLit((n) => n + 1), LANTERN_STEP_MS);
    return () => window.clearTimeout(t);
  }, [going, done, lit]);
  useEffect(() => {
    if (done && !told.current) {
      told.current = true;
      onDone();
    }
  }, [done, onDone]);
  function light() {
    if (going || done) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setLit(months.length);
    setGoing(true);
  }
  return (
    <div className="xq-lanterns">
      <ol>
        {months.map((m, i) => (
          <li key={`${m.year}-${m.month}`} data-on={i < lit ? '' : undefined} data-pull={m.pull ? '' : undefined} data-caution={m.caution ? '' : undefined}>
            {i === 0 || m.month === 1 ? <em>{m.year}</em> : null}
            <i aria-hidden="true" />
            <span>
              {m.month}월{i < lit ? <b className="sr-only"> {m.pull ? play.pull : m.caution ? play.caution : play.still}</b> : null}
            </span>
          </li>
        ))}
      </ol>
      {done ? (
        <p className="xq-lanterns__legend">
          <i data-pull="" /> {play.pull} <i data-caution="" /> {play.caution} <i /> {play.still}
        </p>
      ) : (
        <button type="button" className="xq-lanterns__go" onClick={light} disabled={going}>
          {play.hint}
        </button>
      )}
    </div>
  );
}

function ChoicePlay({ play, onDone }: { play: Of<'choice'>; onDone: () => void }) {
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <div className="xq-choice">
      <p className="xq-choice__ask">{play.ask}</p>
      <div className="xq-choice__options">
        {play.options.map((o, i) => (
          <button
            key={o.label}
            type="button"
            data-on={chosen === i ? '' : undefined}
            data-off={chosen !== null && chosen !== i ? '' : undefined}
            disabled={chosen !== null}
            onClick={() => {
              setChosen(i);
              window.setTimeout(onDone, 900);
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      {chosen !== null ? <Balloon className="xq-choice__reply" text={play.options[chosen].reply} tail="dl" /> : null}
    </div>
  );
}

function CandlePlay({ play, done, onDone }: { play: Of<'candle'>; done: boolean; onDone: () => void }) {
  const [on, setOn] = useState(done);
  function light() {
    if (on) return;
    setOn(true);
    window.setTimeout(onDone, 900);
  }
  return (
    <div className="xq-candle" data-on={on ? '' : undefined}>
      <div className="xq-candle__stick" aria-hidden="true">
        <i className="xq-candle__glow" />
        <i className="xq-candle__flame" />
        <i className="xq-candle__wick" />
        <i className="xq-candle__wax" />
      </div>
      {on ? null : (
        <>
          <button type="button" className="xq-candle__match" onClick={light}>
            <i aria-hidden="true" />
            {play.label}
          </button>
          <p className="xq-hint">{play.hint}</p>
          <button type="button" className="xp-skip" onClick={light}>
            {play.skip}
          </button>
        </>
      )}
    </div>
  );
}

export function tieLayers(p: number): { mid: number; tied: number } {
  const c = Math.min(1, Math.max(0, p));
  return { mid: Math.min(1, c * 2), tied: Math.max(0, c * 2 - 1) };
}

export const TIE_SNAP = 0.82;

function TiePlay({ play, me, done, onDone }: { play: Of<'tie'>; me: '' | '-f'; done: boolean; onDone: () => void }) {
  const { knot: K, grab: S } = play.points[me];
  const frame = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(done ? 1 : 0);
  const [pos, setPos] = useState(done ? K : S);
  const [tied, setTied] = useState(done);
  const drag = useRef<{ moved: boolean } | null>(null);
  const raf = useRef(0);
  const d0 = Math.hypot(S.x - K.x, S.y - K.y);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  function glide(to: number, ms: number, after?: () => void) {
    cancelAnimationFrame(raf.current);
    const from = { p, x: pos.x, y: pos.y };
    const target = to >= 1 ? K : to <= 0 ? S : { x: S.x + (K.x - S.x) * to, y: S.y + (K.y - S.y) * to };
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - (1 - k) ** 3;
      setP(from.p + (to - from.p) * e);
      setPos({ x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e });
      if (k < 1) raf.current = requestAnimationFrame(step);
      else after?.();
    };
    raf.current = requestAnimationFrame(step);
  }
  function finish(ms = 420) {
    if (tied) return;
    setTied(true);
    glide(1, ms, () => window.setTimeout(onDone, 700));
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const b = frame.current?.getBoundingClientRect();
    if (!drag.current || !b || tied) return;
    drag.current.moved = true;
    const x = Math.min(98, Math.max(2, ((e.clientX - b.left) / b.width) * 100));
    const y = Math.min(98, Math.max(2, ((e.clientY - b.top) / b.height) * 100));
    const np = Math.min(1, Math.max(0, 1 - Math.hypot(x - K.x, y - K.y) / d0));
    setPos({ x, y });
    setP(np);
    if (np >= TIE_SNAP) finish();
  }
  function release() {
    const d = drag.current;
    drag.current = null;
    if (tied || !d) return;

    if (!d.moved) finish(1400);
    else glide(0, 380);
  }
  const L = tieLayers(p);
  return (
    <div className="xq-tie" data-tied={tied ? '' : undefined}>
      <div ref={frame} className="xq-tie__frame" onPointerMove={move} onPointerUp={release} onPointerCancel={release}>
        <Image src={play.frames.loose.replace('{me}', me)} alt="" fill sizes="(min-width: 480px) 440px, 92vw" />
        <Image src={play.frames.mid.replace('{me}', me)} alt="" fill sizes="(min-width: 480px) 440px, 92vw" style={{ opacity: L.mid }} />
        <Image src={play.frames.tied.replace('{me}', me)} alt="" fill sizes="(min-width: 480px) 440px, 92vw" style={{ opacity: L.tied }} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {}
          {p > 0.02 && !tied ? <path className="xq-tie__pull" d={`M${S.x} ${S.y} Q${(S.x + pos.x) / 2 + 4} ${Math.max(S.y, pos.y) + 4} ${pos.x} ${pos.y}`} style={{ opacity: 1 - L.tied }} /> : null}
          {}
          {tied ? null : <path className="xq-tie__guide" d={`M${pos.x} ${pos.y} Q${(pos.x + K.x) / 2 + 8} ${(pos.y + K.y) / 2 - 10} ${K.x} ${K.y}`} />}
          {tied ? <circle className="xq-tie__burst" cx={K.x} cy={K.y} r="6" /> : <circle className="xq-tie__spot" cx={K.x} cy={K.y} r="4.5" />}
        </svg>
        {tied ? null : (
          <button
            type="button"
            className="xq-tie__end"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            aria-label={play.hint}
            onPointerDown={(e) => {
              drag.current = { moved: false };
              e.currentTarget.parentElement?.setPointerCapture(e.pointerId);
            }}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' ? finish(1400) : undefined)}
          />
        )}
      </div>
      {tied ? (
        <p className="xq-tie__done">{play.done}</p>
      ) : (
        <>
          <p className="xq-hint">{play.hint}</p>
          <button type="button" className="xp-skip" onClick={() => finish(1400)}>
            {play.skip}
          </button>
        </>
      )}
    </div>
  );
}

function typedWidth(text: string): number {
  return Math.ceil(Array.from(text).reduce((w, ch) => w + (/[\s.,!?~]/.test(ch) ? 0.3 : 0.86), 0));
}

function SendPlay({ play, done, onDone }: { play: Of<'send'>; done: boolean; onDone: () => void }) {
  const [sent, setSent] = useState(done);
  function send() {
    if (sent) return;
    setSent(true);
    window.setTimeout(onDone, 300 + (play.replies.length + 1) * 750 + 600);
  }
  if (sent) return <StoryBeats beats={[{ kind: 'chat', title: play.title, lines: [{ text: play.text, me: true }, ...play.replies], gap: 4 }]} />;
  return (
    <div className="sd-beat sd-typing xq-send" data-seen="true">
      <p className="sd-typing__to">{play.to}</p>
      <div className="sd-typing__bar">
        <p style={{ '--n': typedWidth(play.text) } as CSSProperties}>
          <span>{play.text}</span>
        </p>
        <button type="button" className="xq-send__go" onClick={send}>
          {play.send}
        </button>
      </div>
    </div>
  );
}

export function XmasPlayView({
  play,
  months,
  meet,
  me,
  done,
  onDone,
}: {
  play: XmasPlay;

  done: boolean;

  months: readonly LanternMonth[];

  meet: string;

  me: '' | '-f';
  onDone: () => void;
}) {
  switch (play.kind) {
    case 'hold':
      return done ? null : <HoldToPull label={play.label} hint={play.hint} skip={play.skip} onDone={onDone} />;
    case 'lanterns':
      return <LanternPlay play={play} months={months} done={done} onDone={onDone} />;
    case 'choice':
      return done ? null : <ChoicePlay play={play} onDone={onDone} />;
    case 'candle':
      return <CandlePlay play={play} done={done} onDone={onDone} />;
    case 'frost':
      return (
        <FrostWipe hint={play.hint} skip={play.skip} onClear={onDone} done={done}>
          <p className="xq-meet">{meet}</p>
        </FrostWipe>
      );
    case 'tie':
      return <TiePlay play={play} me={me} done={done} onDone={onDone} />;
    case 'send':
      return <SendPlay play={play} done={done} onDone={onDone} />;
  }
}
