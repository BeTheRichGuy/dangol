'use client';

import Image from 'next/image';
import { Fragment, useEffect, useRef, type ReactNode } from 'react';
import { XMAS_HOOKS, type SeenKey } from '@/content/xmas-hooks';
import { StoryBeats } from '../story/story-strip';
import type { PastMonth } from '@/lib/xmas/hooks';
import type { Element } from '@/lib/saju/types';
import type { XmasStage } from '@/lib/xmas/relation';
import './xmas-hooks.css';

const H = XMAS_HOOKS;

function Marked({ text }: { text: string }) {
  return (
    <>
      {text.split('*').map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

export function XhLock({ items }: { items: readonly string[] }) {
  return (
    <div className="xh-lock">
      <i className="xh-lock__icon" aria-hidden="true" />
      <p className="xh-lock__head">{H.lockHead}</p>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function XhSeen({ k }: { k: SeenKey }) {
  return (
    <div className="xh-seen">
      <p className="xh-seen__lead">{H.seen.lead}</p>
      <p className="xh-seen__line" aria-hidden="true">
        <span data-veil="">“{H.seen.line[k]}”</span>
      </p>
      <p className="xh-seen__hint">{H.seen.hint}</p>
    </div>
  );
}

export function XhLanding() {
  const L = H.landing;
  return (
    <>
      <StoryBeats beats={[L.threat]} />
      <p className="xh-band">{L.band}</p>
      <p className="xh-veilrow">
        <span className="xh-veilrow__box">
          <span data-veil="">{L.veil}</span>
        </span>
        <span>{L.veilTail}</span>
      </p>
      <StoryBeats beats={[L.result]} />
    </>
  );
}

export function XhPast({ months }: { months: readonly PastMonth[] }) {
  if (months.length === 0) return null;
  return (
    <section className="xh-past" aria-label={H.past.title.replace('{year}', String(months[0].year))}>
      <h2>{H.past.title.replace('{year}', String(months[0].year))}</h2>
      <ol>
        {months.map((m) => (
          <li key={m.month}>
            <b data-veil={m.lead ? undefined : ''} aria-hidden={m.lead ? undefined : 'true'}>
              {H.past.month(m.month)}
            </b>
            <span>{H.past.line[m.tone]}</span>
          </li>
        ))}
      </ol>
      <i className="xh-past__seal" aria-hidden="true">
        動
      </i>
    </section>
  );
}

export function RivalFigure({ sex }: { sex: 'female' | 'male' | null }) {
  return (
    <div className="xh-rival__figure" aria-hidden="true">
      <Image src={sex === 'male' ? '/media/xmas/rival-m-photo.jpg' : '/media/xmas/rival-f-photo.jpg'} alt="" fill sizes="(min-width: 480px) 260px, 56vw" />
    </div>
  );
}

export function XhRival({ element, stage, days, sex }: { element: Element; stage: XmasStage; days: number; sex: 'female' | 'male' | null }) {
  return (
    <section className="xh-rival" aria-label={H.rival.title}>
      <h2>{H.rival.title}</h2>
      <RivalFigure sex={sex} />
      <p className="xh-rival__look">{H.rival.look[element]}</p>
      <p className="xh-rival__from">
        <span data-veil="">{H.rival.from[stage]}</span>
      </p>
      <p className="xh-rival__count">
        <Marked text={days > 0 ? H.rival.count.replace('{n}', String(days)) : H.rival.none} />
      </p>
      {}
      <p className="xh-rival__note">{H.rival.note}</p>
      <XhLock items={H.rival.lock} />
    </section>
  );
}

export function XhFit({ stage }: { stage: XmasStage }) {
  const F = H.fit;
  return (
    <section className="xh-fit" aria-label={F.over}>
      <p className="xh-fit__over">{F.over}</p>
      <h2>{F.title[stage]}</h2>
      <ol>
        {F.items[stage].map((item) => (
          <li key={item.text}>
            <span>{item.text}</span>
            <small>{F.ch.replace('{n}', item.ch.join(F.sep))}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function XhRivalOpen({ element, stage, days, seen, sex }: { element: Element; stage: XmasStage; days: readonly string[]; seen: SeenKey; sex: 'female' | 'male' | null }) {
  const P = H.paid;
  return (
    <section className="xh-rival xh-rival--open" aria-label={P.title}>
      {}
      <div className="xh-seen xh-seen--open">
        <p className="xh-seen__lead">{P.seenTitle}</p>
        <p className="xh-seen__line">“{H.seen.line[seen]}”</p>
      </div>
      <h2>{P.title}</h2>
      <RivalFigure sex={sex} />
      <p className="xh-rival__look">{H.rival.look[element]}</p>
      <dl>
        <div>
          <dt>{P.fromLead}</dt>
          <dd>{H.rival.from[stage]}</dd>
        </div>
        <div>
          <dt>{P.daysLead}</dt>
          <dd>
            {days.length > 0
              ? days.map((d, i) => (
                  <Fragment key={d}>
                    {i > 0 ? P.sep : null}
                    <span className="xh-nowrap">{P.date(Number(d.slice(5, 7)), Number(d.slice(8, 10)))}</span>
                  </Fragment>
                ))
              : P.none}
          </dd>
        </div>
        <div>
          <dt>{P.moveLead}</dt>
          <dd>{P.move[stage]}</dd>
        </div>
      </dl>
    </section>
  );
}

function monthsOf(from: string, to: string): { year: number; month: number; days: (string | null)[] }[] {
  const out: { year: number; month: number; days: (string | null)[] }[] = [];
  for (let t = Date.parse(`${from.slice(0, 7)}-01T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += 86_400_000) {
    const d = new Date(t);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    let cur = out.at(-1);
    if (!cur || cur.month !== month) {
      cur = { year, month, days: Array<string | null>(d.getUTCDay()).fill(null) };
      out.push(cur);
    }
    cur.days.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.45, y - s, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.45, y - s, x + s, y - s * 0.4, x, y + s * 0.35);
  ctx.fill();
}

function BlurMonth({ days, hearts, from }: { days: (string | null)[]; hearts: ReadonlySet<string>; from: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rows = Math.ceil(days.length / 7);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const W = 700;
    const cell = W / 7;
    c.width = W;
    c.height = rows * cell * 0.8;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    days.forEach((iso, i) => {
      if (!iso) return;
      const x = (i % 7) * cell + cell / 2;
      const y = Math.floor(i / 7) * cell * 0.8 + cell * 0.4;
      if (hearts.has(iso)) {
        ctx.fillStyle = '#e8364f';
        heart(ctx, x, y + 6, 38);
        ctx.fillStyle = '#fff';
      } else {
        ctx.fillStyle = iso < from ? '#c9c2ba' : '#4a4541';
      }
      ctx.font = '600 30px sans-serif';
      ctx.fillText(String(Number(iso.slice(8))), x, y);
    });
  }, [days, hearts, from, rows]);
  return <canvas ref={ref} className="xh-gold__canvas" aria-hidden="true" />;
}

export function XhGold({ from, to, hearts, count, wrapCount = (n) => n }: { from: string; to: string; hearts: readonly string[]; count: number; wrapCount?: (n: ReactNode) => ReactNode }) {
  const set = new Set(hearts);
  return (
    <section className="xh-gold" aria-label={H.gold.title}>
      <h2>{H.gold.title}</h2>
      {}
      {wrapCount(
        <p className="xh-gold__count">
          <Marked text={H.gold.count.replace('{n}', String(count))} />
        </p>,
      )}
      {}
      {hearts[0] ? (
        <p className="xh-gold__first">
          <Marked text={H.gold.first.replace('{date}', H.gold.date(Number(hearts[0].slice(5, 7)), Number(hearts[0].slice(8, 10))))} />
        </p>
      ) : null}
      {monthsOf(from, to).map((m) => (
        <div key={`${m.year}-${m.month}`} className="xh-gold__month">
          <h3>{H.gold.month(m.year, m.month)}</h3>
          <ol className="xh-gold__wd" aria-hidden="true">
            {H.gold.weekdays.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ol>
          <BlurMonth days={m.days} hearts={set} from={from} />
        </div>
      ))}
      <XhLock items={H.gold.lock} />
    </section>
  );
}
