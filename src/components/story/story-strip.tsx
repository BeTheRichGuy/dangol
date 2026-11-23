'use client';

import { BlurReveal } from './blur-reveal';
import Image from 'next/image';
import { Fragment, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useVideoAllowed } from '../scene/use-video-allowed';
import { useSeen } from '../webtoon/use-seen';
import type { Beat, Note, Say, Tail } from './types';
import './story-strip.css';

const SIZES = '(min-width: 480px) 480px, 100vw';

function Marked({ text }: { text: string }) {
  return (
    <>
      {text.split('*').map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

export function Balloon({
  text,
  tail = 'none',
  big,
  me,
  className = '',
  style,
  reveal,
}: {
  text: string;
  tail?: Tail;

  reveal?: boolean;
  big?: boolean;
  me?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <p className={`sd-bal ${className}`} data-tail={tail} data-big={big ? '' : undefined} data-me={me ? '' : undefined} style={style}>
      {me ? null : (
        <i className="sd-bal__bg" aria-hidden="true">
          <svg className="sd-bal__shape" viewBox="0 0 200 120" preserveAspectRatio="none">
            <path d="M101 3C152 1 197 23 197 59C198 97 153 118 99 117C46 118 3 97 3 61C2 23 49 4 101 3Z" />
          </svg>
          {tail === 'none' ? null : (
            <svg className="sd-bal__tail" viewBox="0 0 40 46">
              <path d="M6 0L37 45L23 0Z" />
            </svg>
          )}
        </i>
      )}
      <span>{reveal ? <BlurReveal text={text} /> : text}</span>
    </p>
  );
}

function Frame({ beat, className, children, threshold = 0.3 }: { beat: Beat; className: string; children: ReactNode; threshold?: number }) {
  const [ref, seen] = useSeen<HTMLDivElement>({ threshold });
  return (
    <div ref={ref} className={`sd-beat ${className}`} data-seen={seen} style={{ marginTop: `${beat.gap ?? 0}cqw` }}>
      {children}
    </div>
  );
}

function Bubbles({ says, notes }: { says?: readonly Say[]; notes?: readonly Note[] }) {
  return (
    <>
      {notes?.map((n, i) => (
        <p key={`n${i}`} className="sd-note" style={{ left: `${n.x}%`, top: `${n.y}%`, '--d': `${400 + i * 400}ms` } as CSSProperties}>
          {n.text}
        </p>
      ))}
      {says?.map((s, i) => (
        <Balloon
          key={`s${i}`}
          className="sd-say"
          text={s.text}
          tail={s.tail}
          big={s.big}
          me={s.me}
          style={{ left: `${s.x}%`, top: `${s.y}%`, '--d': `${450 + i * 900}ms` } as CSSProperties}
        />
      ))}
    </>
  );
}

function Art({ beat }: { beat: Extract<Beat, { kind: 'art' }> }) {
  return (
    <Frame beat={beat} className="sd-art" threshold={0.22}>
      <div
        className="sd-art__box"
        data-fade={beat.fade}
        data-slant={beat.slant}
        data-shape={beat.shape}
        data-side={beat.side}
        data-hush={beat.hush ? '' : undefined}
        style={{ aspectRatio: String(beat.ratio), width: beat.width ? `${beat.width}%` : undefined }}
      >
        <div className="sd-art__img">
          <Image src={beat.src} alt="" fill sizes={SIZES} style={{ objectPosition: beat.position ?? '50% 50%' }} />
        </div>
        <Bubbles says={beat.says} notes={beat.notes} />
      </div>
    </Frame>
  );
}

function Clip({ beat }: { beat: Extract<Beat, { kind: 'clip' }> }) {
  const allowed = useVideoAllowed();
  const [nearRef, near] = useSeen<HTMLDivElement>({ rootMargin: '200px 0px' });
  const [viewRef, inView] = useSeen<HTMLDivElement>({ threshold: 0.55 });
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (inView) void video.current?.play().catch(() => {});
  }, [inView]);
  return (
    <div ref={nearRef} className="sd-beat sd-clip" style={{ marginTop: `${beat.gap ?? 0}cqw` }}>
      <div ref={viewRef} className="sd-clip__box" style={{ aspectRatio: String(beat.ratio) }}>
        <Image src={beat.poster} alt="" fill sizes={SIZES} />
        {allowed && near ? <video ref={video} src={beat.src} poster={beat.poster} muted playsInline loop={beat.loop} preload="auto" /> : null}
      </div>
    </div>
  );
}

function Flip({ beat }: { beat: Extract<Beat, { kind: 'flip' }> }) {
  return (
    <Frame beat={beat} className="sd-flip">
      <div className="sd-art__box" style={{ aspectRatio: String(beat.ratio) }}>
        {beat.frames.map((src, i) => (
          <div key={src} className="sd-flip__frame" data-n={i}>
            <Image src={src} alt="" fill sizes={SIZES} />
          </div>
        ))}
        <Bubbles says={beat.says} />
      </div>
    </Frame>
  );
}

function Lanterns({ beat }: { beat: Extract<Beat, { kind: 'lanterns' }> }) {
  return (
    <Frame beat={beat} className="sd-lanterns">
      <div className="sd-lanterns__row" data-stir={beat.stir ? '' : undefined} aria-hidden="true">
        {beat.labels.map((label, i) => (
          <div key={label} className="sd-lantern" style={{ '--i': i } as CSSProperties}>
            <i className="sd-lantern__body" />
            <span>{label}</span>
          </div>
        ))}
      </div>
      {beat.says?.map((text, i) => (
        <Balloon key={i} text={text} className={`sd-line-say ${i % 2 === 0 ? '' : 'sd-plain__right'}`} style={{ '--d': `${700 + i * 1100}ms` } as CSSProperties} />
      ))}
    </Frame>
  );
}

function BeatView({ beat, onChoose, chosen }: { beat: Beat; onChoose?: () => void; chosen?: boolean }) {
  switch (beat.kind) {
    case 'clock':
      return (
        <Frame beat={beat} className="sd-clock">
          {beat.sub ? <p className="sd-clock__sub">{beat.sub}</p> : null}
          <p className="sd-clock__num">{beat.text}</p>
        </Frame>
      );
    case 'text':
      return (
        <Frame beat={beat} className="sd-text" threshold={0.6}>
          {beat.lines.map((line, i) => (
            <p key={i} data-size={beat.size} style={{ '--d': `${i * 520}ms` } as CSSProperties}>
              <Marked text={line} />
            </p>
          ))}
        </Frame>
      );
    case 'hook':
      return (
        <Frame beat={beat} className="sd-hook" threshold={0.5}>
          {beat.lines.map((line, i) => (
            <p key={i} data-box={line.box ? '' : undefined} data-small={line.small ? '' : undefined} style={{ '--d': `${i * 380}ms` } as CSSProperties}>
              <span>
                <Marked text={line.text} />
              </span>
            </p>
          ))}
        </Frame>
      );
    case 'thoughts':
      return (
        <Frame beat={beat} className="sd-thoughts">
          {beat.lines.map((line, i) => (
            <p key={i} data-n={i} style={{ '--d': `${i * 900}ms` } as CSSProperties}>
              {line}
            </p>
          ))}
        </Frame>
      );
    case 'sfx':
      return (
        <Frame beat={beat} className="sd-sfx" threshold={0.7}>
          <p data-side={beat.side}>{beat.text}</p>
        </Frame>
      );
    case 'me':
      return (
        <Frame beat={beat} className="sd-me" threshold={0.7}>
          <p>{beat.text}</p>
        </Frame>
      );
    case 'say':
      return (
        <Frame beat={beat} className="sd-plain" threshold={0.7}>
          {}
          <Balloon text={beat.text} big={beat.big} tail="none" className={beat.side === 'right' ? 'sd-plain__right' : ''} />
        </Frame>
      );
    case 'typing':
      return (
        <Frame beat={beat} className="sd-typing" threshold={0.8}>
          <p className="sd-typing__to">{beat.to}</p>
          <div className="sd-typing__bar">
            <p style={{ '--n': Array.from(beat.text).length } as CSSProperties}>
              <span>{beat.text}</span>
            </p>
            <i aria-hidden="true">{beat.send}</i>
          </div>
        </Frame>
      );
    case 'chat':
      return (
        <Frame beat={beat} className="sd-chat" threshold={0.35}>
          <p className="sd-chat__title">{beat.title}</p>
          {beat.lines.map((line, i) => (
            <div key={i} className="sd-chat__line" data-me={line.me ? '' : undefined} style={{ '--d': `${300 + i * 750}ms` } as CSSProperties}>
              {line.who ? <span>{line.who}</span> : null}
              <p>{line.text}</p>
            </div>
          ))}
        </Frame>
      );
    case 'art':
      return <Art beat={beat} />;
    case 'clip':
      return <Clip beat={beat} />;
    case 'flip':
      return <Flip beat={beat} />;
    case 'lanterns':
      return <Lanterns beat={beat} />;
    case 'choice':
      return (
        <Frame beat={beat} className="sd-choice" threshold={0.8}>
          <button type="button" onClick={onChoose} disabled={chosen}>
            {beat.label}
          </button>
          {chosen ? null : <p>{beat.hint}</p>}
        </Frame>
      );
  }
}

export function StoryBeats({ beats, onChoose, chosen }: { beats: readonly Beat[]; onChoose?: () => void; chosen?: boolean }) {
  return (
    <>
      {beats.map((beat, i) => (
        <BeatView key={i} beat={beat} onChoose={onChoose} chosen={chosen} />
      ))}
    </>
  );
}
