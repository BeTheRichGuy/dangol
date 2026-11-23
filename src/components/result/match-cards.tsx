'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import { fill } from '@/content/fate-copy';
import { FATE as F } from '@/content/fate-map';
import type { ElementLink, ElementPair, TogetherMonth } from '@/lib/reading/fate-map';
import './result.css';

const HANJA: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };

const PENT = { cx: 150, cy: 110, r: 60 } as const;
const ANGLE: Record<string, number> = { wood: -90, fire: -18, earth: 54, metal: 126, water: 198 };

const reach = (n: number) => 0.2 + 0.8 * (Math.min(n, 4) / 4);
const at = (el: string, k: number) => {
  const a = (ANGLE[el] * Math.PI) / 180;
  return { x: PENT.cx + PENT.r * k * Math.cos(a), y: PENT.cy + PENT.r * k * Math.sin(a) };
};
const poly = (pairs: readonly ElementPair[], who: 'me' | 'you') =>
  pairs
    .map((p) => {
      const { x, y } = at(p.element, reach(p[who]));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

function LinkIcon({ link }: { link: ElementLink }) {
  if (link === 'none') return null;
  return (
    <svg className="rs-mc__linkicon" data-link={link} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      {link === 'overlap' ? (
        <>
          <circle cx="4.4" cy="6" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="7.6" cy="6" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </>
      ) : (
        <path d={link === 'meFills' ? 'M1.5 6h8M6.5 2.6 10 6 6.5 9.4' : 'M10.5 6h-8M5.5 2.6 2 6l3.5 3.4'} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function MatchElements({ pairs }: { pairs: readonly ElementPair[] }) {
  const E = F.paid.match.elements;
  const first = pairs.findIndex((p) => p.link === 'overlap') >= 0 ? pairs.findIndex((p) => p.link === 'overlap') : Math.max(0, pairs.findIndex((p) => p.link !== 'none'));
  const [sel, setSel] = useState(first);
  const cur = pairs[Math.min(sel, pairs.length - 1)];
  if (!cur) return null;
  return (
    <div className="rs-mc">
      <div className="rs-mc__scene rs-mc__scene--pent">
        <Image src="/media/fate/match-night-v1.jpg" alt="" fill sizes="(max-width: 480px) 90vw, 420px" className="rs-mc__img" />
        <svg className="rs-mc__svg" viewBox="0 0 300 200" aria-hidden="true" focusable="false">
          {[0.25, 0.5, 0.75, 1].map((k) => (
            <polygon key={k} points={pairs.map((p) => `${at(p.element, k).x.toFixed(1)},${at(p.element, k).y.toFixed(1)}`).join(' ')} className="rs-mc__grid" />
          ))}
          {pairs.map((p) => (
            <line key={p.element} x1={PENT.cx} y1={PENT.cy} x2={at(p.element, 1).x} y2={at(p.element, 1).y} className="rs-mc__grid" />
          ))}
          <polygon points={poly(pairs, 'me')} className="rs-mc__poly rs-mc__poly--me" />
          <polygon points={poly(pairs, 'you')} className="rs-mc__poly rs-mc__poly--you" />
        </svg>
        {pairs.map((p, i) => {
          const pos = at(p.element, 1.3);
          return (
            <button
              key={p.element}
              type="button"
              className="rs-mc__node"
              data-link={p.link}
              aria-pressed={i === sel}
              aria-label={`${E.name[p.element]}, ${E.me} ${p.me}, ${E.you} ${p.you}, ${E.link[p.link]}`}
              onClick={() => setSel(i)}
              style={{ left: `${(pos.x / 300) * 100}%`, top: `${(pos.y / 200) * 100}%` } as CSSProperties}
            >
              <LinkIcon link={p.link} />
              <span className="rs-mc__hanja" aria-hidden="true">
                {HANJA[p.element]}
              </span>
              <span className="rs-mc__name" aria-hidden="true">
                {E.name[p.element]}
              </span>
              <span className="rs-mc__count" aria-hidden="true">
                <i className="rs-mc__me">{p.me}</i>
                <i className="rs-mc__you">{p.you}</i>
              </span>
            </button>
          );
        })}
      </div>
      <p className="rs-mc__legend" aria-hidden="true">
        <span className="rs-mc__me">{E.me}</span>
        <span className="rs-mc__you">{E.you}</span>
        <span>
          <LinkIcon link="overlap" /> {E.link.overlap}
        </span>
        <span>
          <LinkIcon link="meFills" /> {E.link.meFills}
        </span>
        <span>
          <LinkIcon link="youFills" /> {E.link.youFills}
        </span>
      </p>
      <p className="rs-mc__detail" data-link={cur.link} aria-live="polite">
        <b>{E.name[cur.element]}</b> <em>{E.link[cur.link]}</em> {fill(E.line[cur.link], { el: E.name[cur.element], me: cur.me, you: cur.you })}
      </p>
    </div>
  );
}

function StarMark() {
  return (
    <svg className="rs-mc__star" width="11" height="11" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M6 .9 7.6 4.3 11.2 4.7 8.5 7.2 9.3 10.8 6 9 2.7 10.8 3.5 7.2 .8 4.7 4.4 4.3Z" fill="currentColor" />
    </svg>
  );
}

function Dot({ who, tone }: { who: 'me' | 'you'; tone: string | null }) {
  const state = tone === null ? 'none' : tone.startsWith('harmony') ? 'on' : 'off';
  return <i className="rs-mt__dot" data-who={who} data-state={state} />;
}

export function MatchTogether({ months }: { months: readonly TogetherMonth[] }) {
  const T = F.paid.match.together;
  const C = F.paid.calendar;
  const both = months.filter((m) => m.kind === 'both');
  const first = Math.max(0, months.findIndex((m) => m.kind === 'both') >= 0 ? months.findIndex((m) => m.kind === 'both') : months.findIndex((m) => m.kind === 'one'));
  const [sel, setSel] = useState(first);
  const cur = months[Math.min(sel, months.length - 1)];
  if (!cur) return null;
  const who = cur.me?.startsWith('harmony') ? T.me : T.you;
  return (
    <div className="rs-mt">
      <div className="rs-mt__scene">
        <Image src="/media/fate/match-night-v1.jpg" alt="" fill sizes="(max-width: 480px) 90vw, 420px" className="rs-mc__img" />
        <p className="rs-mt__summary">
          {both.length > 0 ? <span className="rs-mt__big">{both.length}</span> : null}
          <span>{both.length > 0 ? fill(T.summary.some, { n: both.length }) : T.summary.none}</span>
        </p>
      </div>
      <ul className="rs-mt__grid" aria-label={T.head}>
        {months.map((m, i) => (
          <li key={`${m.year}-${m.month}`}>
            <button
              type="button"
              className="rs-mt__cell"
              data-kind={m.kind}
              aria-pressed={i === Math.min(sel, months.length - 1)}
              aria-label={`${C.label(m.year, m.month)}, ${T.kind[m.kind]}`}
              onClick={() => setSel(i)}
            >
              <span className="rs-mt__mo" aria-hidden="true">
                {m.kind === 'both' ? <StarMark /> : null}
                {C.short(m.month)}
              </span>
              <span className="rs-mt__dots" aria-hidden="true">
                <Dot who="me" tone={m.me} />
                <Dot who="you" tone={m.you} />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="rs-mc__legend" aria-hidden="true">
        <span className="rs-mc__me">{T.me}</span>
        <span className="rs-mc__you">{T.you}</span>
      </p>
      <p className="rs-mt__detail" data-kind={cur.kind} aria-live="polite">
        <b>{C.label(cur.year, cur.month)}</b> <em>{T.kind[cur.kind]}</em> {fill(T.line[cur.kind], { who })}
        {}
        {cur.me ? <span className="rs-mt__side">{T.side(T.me, cur.me)}</span> : null}
        {cur.you ? <span className="rs-mt__side">{T.side(T.you, cur.you)}</span> : null}
        <span className="rs-mt__prep">
          <b>{T.prepLabel}</b> {T.prep[cur.kind]}
        </span>
      </p>
    </div>
  );
}
