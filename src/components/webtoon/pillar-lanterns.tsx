'use client';

import { useId, type CSSProperties } from 'react';
import { UI } from '@/content/ui';
import type { Chart, Pillar } from '@/lib/saju';
import './webtoon.css';

type PillarKey = 'year' | 'month' | 'day' | 'hour';
const ORDER: PillarKey[] = ['year', 'month', 'day', 'hour'];

export function splitRomanized(romanized: string): [string, string] {
  const at = romanized.indexOf('-');
  return at < 0 ? [romanized, ''] : [romanized.slice(0, at), romanized.slice(at + 1)];
}

export function lanternPillars(chart: Chart): { key: PillarKey; pillar: Pillar }[] {
  const out: { key: PillarKey; pillar: Pillar }[] = [];
  for (const key of ORDER) {
    const pillar = chart.pillars[key];
    if (pillar) out.push({ key, pillar });
  }
  return out;
}

export function chartGlyphs(chart: Chart): string[] {
  return lanternPillars(chart).flatMap(({ pillar }) => [pillar.stem, pillar.branch]);
}

export interface PillarArrive {
  delayMs: number;
  stepMs: number;
}

function LanternSvg({ pillar, day, slot, delay }: { pillar: Pillar; day: boolean; slot: number; delay?: number }) {
  const [stemRoman, branchRoman] = splitRomanized(pillar.romanized);
  const gid = useId();
  const glyph = { fontFamily: 'var(--font-hanja)', fontWeight: 600 } as const;
  const roman = { fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.02em' } as const;
  return (
    <svg
      viewBox="0 0 80 178"
      className="wt-lantern"
      aria-hidden="true"
      focusable="false"
      style={delay === undefined ? undefined : ({ transitionDelay: `${delay}ms, ${delay}ms` } as CSSProperties)}
    >
      <defs>
        <radialGradient id={`${gid}-lg`} cx="50%" cy="46%" r="62%">
          <stop offset="0%" stopColor={day ? '#fff4d2' : '#ffe9b8'} />
          <stop offset="58%" stopColor="#f6c98b" />
          <stop offset="100%" stopColor="#d9923f" />
        </radialGradient>
      </defs>
      {}
      <line x1="40" y1="0" x2="40" y2="15" stroke="#c9a15b" strokeWidth="1.6" />
      {}
      <path d="M21 26 L26 15 H54 L59 26 Z" fill="#3a2616" stroke="#c9a15b" strokeWidth="0.9" />
      {}
      <rect x="13" y="26" width="54" height="110" rx="17" fill={`url(#${gid}-lg)`} stroke="#8a5a22" strokeWidth="1.2" />
      {}
      <path d="M27 27 C20 62 20 100 27 135" fill="none" stroke="#8a5a22" strokeOpacity="0.28" strokeWidth="1" />
      <path d="M53 27 C60 62 60 100 53 135" fill="none" stroke="#8a5a22" strokeOpacity="0.28" strokeWidth="1" />
      {}
      <text x="40" y="63" textAnchor="middle" fontSize="31" fill="#2d1a0c" style={glyph} data-glyph-slot={slot * 2}>
        {pillar.stem}
      </text>
      <text x="40" y="77" textAnchor="middle" fontSize="10" fill="#4a2e14" style={roman}>
        {stemRoman}
      </text>
      <line x1="26" y1="84" x2="54" y2="84" stroke="#8a5a22" strokeOpacity="0.55" strokeWidth="0.9" />
      {}
      <text x="40" y="115" textAnchor="middle" fontSize="31" fill="#2d1a0c" style={glyph} data-glyph-slot={slot * 2 + 1}>
        {pillar.branch}
      </text>
      <text x="40" y="129" textAnchor="middle" fontSize="10" fill="#4a2e14" style={roman}>
        {branchRoman}
      </text>
      {}
      <path d="M22 136 H58 L53 146 H27 Z" fill="#3a2616" stroke="#c9a15b" strokeWidth="0.9" />
      <line x1="40" y1="146" x2="40" y2="160" stroke="#c9a15b" strokeWidth="1.4" />
      <path d="M35 160 H45 L47 176 H33 Z" fill="#c8473a" />
      <path d="M36.5 163 V176 M40 163 V176 M43.5 163 V176" stroke="#8e2f26" strokeWidth="0.8" />
    </svg>
  );
}

export function PillarLanterns({ chart, lit = true, arrive }: { chart: Chart; lit?: boolean; arrive?: PillarArrive }) {
  const pillars = lanternPillars(chart);
  const six = chart.pillars.hour === null;
  return (
    <div>
      <div
        className="wt-lanterns__beam"
        aria-hidden="true"
        style={{ opacity: lit ? 1 : 0, transition: arrive ? `opacity 600ms ease ${arrive.delayMs}ms` : 'opacity 600ms ease' }}
      />
      <ol
        className="wt-lanterns"
        data-lit={lit}
        data-count={pillars.length}
        aria-label={six ? UI.result.pillarsLabelSix : UI.result.pillarsLabel}
      >
        {pillars.map(({ key, pillar }, i) => (
          <li key={key} data-day={key === 'day' ? '' : undefined} style={{ ['--i' as string]: i }}>
            <LanternSvg pillar={pillar} day={key === 'day'} slot={i} delay={arrive ? arrive.delayMs + i * arrive.stepMs : undefined} />
            <span
              className="wt-lantern__label"
              style={{ opacity: lit ? 1 : 0, transition: `opacity 600ms ease ${arrive ? arrive.delayMs + i * arrive.stepMs : 0}ms` }}
            >
              {UI.result.pillarNames[key]}
            </span>
            <span className="sr-only">
              {pillar.ganzhi}, {pillar.romanized}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
