'use client';

import Image from 'next/image';
import { useState } from 'react';
import { FATE_X as X } from '@/content/fate-extra';
import type { LineNode, PairLine, PairType, PairYear } from '@/lib/reading/match-extra';
import type { ChartBlock, PillarInfo } from '@/lib/rooms/payload';
import type { Element } from '@/lib/saju/types';
import './result.css';
import './result-extra.css';

const ELEMENT_FILL: Record<Element, string> = { wood: '124,184,120', fire: '226,110,92', earth: '222,184,96', metal: '226,226,236', water: '104,150,226' };

function FlowMark({ flow }: { flow: PairType['flow'] }) {
  const a = 122;
  const b = 178;
  const y = 78;
  const common = { stroke: '#fff6e6', strokeWidth: 2.2, strokeLinecap: 'round' as const, fill: 'none' };
  switch (flow) {
    case 'same':
      return (
        <g {...common}>
          <path d={`M${a} ${y - 4}H${b}M${a} ${y + 4}H${b}`} />
        </g>
      );
    case 'self-feeds-other':
      return <path {...common} d={`M${a} ${y}H${b}M${b - 8} ${y - 7}L${b} ${y}L${b - 8} ${y + 7}`} />;
    case 'other-feeds-self':
      return <path {...common} d={`M${b} ${y}H${a}M${a + 8} ${y - 7}L${a} ${y}L${a + 8} ${y + 7}`} />;
    case 'self-checks-other':
      return <path {...common} d={`M${a} ${y}H${b}M${b} ${y - 9}V${y + 9}`} />;
    case 'other-checks-self':
      return <path {...common} d={`M${b} ${y}H${a}M${a} ${y - 9}V${y + 9}`} />;
  }
}

function PairOrb({ cx, who, stem, element }: { cx: number; who: 'me' | 'you'; stem: string; element: string }) {
  const gold = who === 'me';
  return (
    <g>
      <circle cx={cx} cy={78} r={34} fill={gold ? 'rgba(255,196,96,0.3)' : 'rgba(166,190,255,0.3)'} stroke={gold ? '#ffd98a' : '#c9d6ff'} strokeWidth={1.6} />
      <text x={cx} y={80} textAnchor="middle" dominantBaseline="central" fontSize={30} fontWeight={600} fill="#fff6e6" fontFamily="var(--font-display)">
        {stem}
      </text>
      <text x={cx} y={126} textAnchor="middle" fontSize={11} fill={gold ? '#ffd98a' : '#c9d6ff'}>
        {element}
      </text>
    </g>
  );
}

export function PairTypeCard({ type }: { type: PairType }) {
  const T = X.type;
  const f = T.flow[type.flow];
  return (
    <div className="rs-xt">
      <div className="rs-mc__scene rs-xt__scene">
        <Image src="/media/fate/match-night-v1.jpg" alt="" fill sizes="(max-width: 480px) 90vw, 420px" className="rs-mc__img" />
        <svg className="rs-mc__svg" viewBox="0 0 300 150" role="img" aria-label={`${T.me} ${type.me.stem}, ${T.link[type.flow]}, ${T.you} ${type.you.stem}`} focusable="false">
          {type.tone === 'combine' ? <path d="M92 40Q150 6 208 40" fill="none" stroke="#ffd98a" strokeWidth={2} strokeLinecap="round" strokeDasharray="1 5" /> : null}
          {type.tone === 'clash' ? <path d="M132 40l8 -10 8 10 8 -10 8 10 8 -10" fill="none" stroke="#ff9b8a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /> : null}
          <FlowMark flow={type.flow} />
          <PairOrb cx={88} who="me" stem={type.me.stem} element={T.element[type.me.element]} />
          <PairOrb cx={212} who="you" stem={type.you.stem} element={T.element[type.you.element]} />
        </svg>
      </div>
      <p className="rs-xt__name">{f.name}</p>
      <p className="rs-xt__line">{f.line}</p>
      {type.tone !== 'plain' ? <p className="rs-xt__tone">{T.tone[type.tone]}</p> : null}
      <p className="rs-mc__legend" aria-hidden="true">
        <span className="rs-mc__me">{T.me}</span>
        <span className="rs-mc__you">{T.you}</span>
        <span>{T.link[type.flow]}</span>
      </p>
    </div>
  );
}

const COL_X: Record<PillarInfo['at'], number> = { year: 78, month: 132, day: 186, hour: 240 };
const ROW_Y = { me: { stem: 34, branch: 60 }, you: { stem: 124, branch: 150 } } as const;

function charAt(chart: ChartBlock, at: PillarInfo['at'], part: 'stem' | 'branch'): string | null {
  const p = chart.pillars.find((x) => x.at === at);
  return p ? p[part] : null;
}

function nodeChar(node: LineNode, me: ChartBlock, you: ChartBlock): string {
  return charAt(node.who === 'me' ? me : you, node.at, node.part) ?? '';
}

function nodePoint(node: LineNode): { x: number; y: number } {
  return { x: COL_X[node.at], y: ROW_Y[node.who][node.part] };
}

function ChartRow({ chart, who }: { chart: ChartBlock; who: 'me' | 'you' }) {
  const L = X.lines;
  const gold = who === 'me';
  return (
    <g>
      <text x={14} y={ROW_Y[who].stem + 16} fontSize={11} fontWeight={700} fill={gold ? '#ffd98a' : '#c9d6ff'} stroke="rgba(10,8,40,0.85)" strokeWidth={3} paintOrder="stroke">
        {gold ? L.me : L.you}
      </text>
      {(['year', 'month', 'day', 'hour'] as const).map((at) => {
        const p = chart.pillars.find((x) => x.at === at);
        const x = COL_X[at];
        return (
          <g key={at}>
            {gold ? (
              <text x={x} y={16} textAnchor="middle" fontSize={10} fill="rgba(255,246,230,0.7)">
                {L.pillar[at]}
              </text>
            ) : null}
            {(['stem', 'branch'] as const).map((part) => {
              const y = ROW_Y[who][part];
              const el = p ? (part === 'stem' ? p.stemElement : p.branchElement) : null;
              return (
                <g key={part}>
                  <circle cx={x} cy={y} r={11.5} fill={el ? `rgba(${ELEMENT_FILL[el]},0.26)` : 'rgba(255,255,255,0.06)'} stroke="rgba(255,246,230,0.25)" strokeWidth={0.8} />
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill="#fff6e6" fontFamily="var(--font-display)">
                    {p ? p[part] : '?'}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

function ToneMark({ tone }: { tone: PairLine['tone'] }) {
  return (
    <svg className="rs-xl__mark" data-tone={tone} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      {tone === 'harmony' ? (
        <>
          <circle cx="5" cy="7" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="9" cy="7" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </>
      ) : tone === 'clash' ? (
        <path d="M2 4l4 3-4 3M12 4l-4 3 4 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M2 9c3-7 7-7 10 0M2 5c3 7 7 7 10 0" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function PairLinesCard({ lines, total, me, you }: { lines: readonly PairLine[]; total: number; me: ChartBlock; you: ChartBlock }) {
  const L = X.lines;
  const [sel, setSel] = useState(0);
  const cur = lines[Math.min(sel, Math.max(0, lines.length - 1))];
  const label = (n: LineNode, chart: ChartBlock) => `${L.pillar[n.at]} ${L.part[n.part]} ${charAt(chart, n.at, n.part) ?? ''}`;
  return (
    <div className="rs-xl">
      <div className="rs-mc__scene rs-xl__scene">
        <Image src="/media/fate/match-night-v1.jpg" alt="" fill sizes="(max-width: 480px) 90vw, 420px" className="rs-mc__img" />
        <svg className="rs-mc__svg" viewBox="0 0 300 170" aria-hidden="true" focusable="false">
          {lines.map((l, i) => {
            const a = nodePoint(l.from);
            const b = nodePoint(l.to);
            const on = i === Math.min(sel, lines.length - 1);
            return <line key={`${l.kind}-${i}`} x1={a.x} y1={a.y + 11} x2={b.x} y2={b.y - 11} className="rs-xl__line" data-tone={l.tone} data-on={on ? '' : undefined} />;
          })}
          <ChartRow chart={me} who="me" />
          <ChartRow chart={you} who="you" />
        </svg>
      </div>
      <p className="rs-xl__summary">{total > 0 ? L.summary.some(total) : L.summary.none}</p>
      {lines.length > 0 ? (
        <ul className="rs-xl__list" aria-label={L.head}>
          {lines.map((l, i) => (
            <li key={`${l.kind}-${i}`}>
              <button type="button" className="rs-xl__chip" data-tone={l.tone} aria-pressed={i === Math.min(sel, lines.length - 1)} onClick={() => setSel(i)}>
                <ToneMark tone={l.tone} />
                <b>{L.kind[l.kind]}</b>
                <span>
                  {L.pillar[l.from.at]} {nodeChar(l.from, me, you)} · {L.pillar[l.to.at]} {nodeChar(l.to, me, you)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {cur ? (
        <p className="rs-mc__detail rs-xl__detail" data-tone={cur.tone} aria-live="polite">
          <b>{L.kind[cur.kind]}</b> <em>{L.tone[cur.tone]}</em> {L.line[cur.tone](label(cur.from, me), label(cur.to, you))}
        </p>
      ) : null}
      {total > lines.length ? <p className="rs-xl__more">{L.more(total - lines.length)}</p> : null}
      <p className="rs-mc__legend" aria-hidden="true">
        <span className="rs-mc__me">{L.me}</span>
        <span className="rs-mc__you">{L.you}</span>
        <span>{L.hint}</span>
      </p>
    </div>
  );
}

function Dot({ who, tone }: { who: 'me' | 'you'; tone: string | null }) {
  const state = tone === null ? 'none' : tone.startsWith('harmony') ? 'on' : 'off';
  return <i className="rs-mt__dot" data-who={who} data-state={state} />;
}

export function PairYearsCard({ years }: { years: readonly PairYear[] }) {
  const Y = X.years;
  const both = years.filter((y) => y.kind === 'both').length;
  const firstBoth = years.findIndex((y) => y.kind === 'both');
  const firstOne = years.findIndex((y) => y.kind === 'one');
  const [sel, setSel] = useState(Math.max(0, firstBoth >= 0 ? firstBoth : firstOne));
  const cur = years[Math.min(sel, years.length - 1)];
  if (!cur) return null;
  return (
    <div className="rs-xy">
      <p className="rs-xl__summary">{both > 0 ? Y.summary.some(both) : Y.summary.none}</p>
      <ul className="rs-xy__grid" aria-label={Y.head}>
        {years.map((y, i) => (
          <li key={y.year}>
            <button type="button" className="rs-mt__cell rs-xy__cell" data-kind={y.kind} aria-pressed={i === Math.min(sel, years.length - 1)} aria-label={`${Y.year(y.year)}, ${Y.kind[y.kind]}`} onClick={() => setSel(i)}>
              <span className="rs-mt__mo" aria-hidden="true">
                {String(y.year).slice(2)}
              </span>
              <span className="rs-mt__dots" aria-hidden="true">
                <Dot who="me" tone={y.me} />
                <Dot who="you" tone={y.you} />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="rs-mc__legend" aria-hidden="true">
        <span className="rs-mc__me">{Y.me}</span>
        <span className="rs-mc__you">{Y.you}</span>
      </p>
      <p className="rs-mt__detail" data-kind={cur.kind} aria-live="polite">
        <b>{Y.year(cur.year)}</b> <em>{Y.kind[cur.kind]}</em> {Y.line[cur.kind]}
      </p>
    </div>
  );
}
