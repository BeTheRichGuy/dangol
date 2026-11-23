'use client';

import { useMemo, useState } from 'react';
import { FATE_X as X } from '@/content/fate-extra';
import { climateWish, type CountryPick } from '@/lib/reading/country';
import { LAND_DOTS, WORLD, project } from '@/lib/reading/world-dots';
import type { ChartBlock } from '@/lib/rooms/payload';
import { useLocale } from '../locale-provider';
import './result.css';
import './result-extra.css';

function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function pickReasons(pick: CountryPick, charts: readonly ChartBlock[]): string[] {
  const R = X.country.reason;
  const el = X.country.element[pick.country.element];
  const out: string[] = [];
  if (charts.length === 1) {
    const e = pick.fits[0].element;
    if (e === 'match') out.push(R.self.match(el));
    if (e === 'feeds') out.push(R.self.feeds(el));
  } else {
    const kinds = pick.fits.map((f) => f.element);
    const matches = kinds.filter((k) => k === 'match').length;
    if (matches === kinds.length) out.push(R.pair.bothMatch(el));
    else if (matches > 0) out.push(R.pair.oneMatch(el));
    else if (kinds.some((k) => k === 'feeds')) out.push(R.pair.feeds(el));
  }

  const wishes = charts.map((c, i) => (pick.fits[i].climate ? climateWish(c) : null));
  const hit = wishes.filter((w): w is NonNullable<typeof w> => w !== null);
  if (hit.length > 0) {
    const wish = hit[0];
    if (charts.length === 1) out.push(R.climate.self[wish]);
    else out.push(hit.length === charts.length && hit.every((w) => w === wish) ? R.climate.pairBoth[wish] : R.climate.pairOne[wish]);
  }
  if (out.length === 0) out.push(R.plain);
  return out;
}

export function CountryMapCard({ picks, charts }: { picks: readonly CountryPick[]; charts: readonly ChartBlock[] }) {
  const C = X.country;
  const locale = useLocale();
  const [sel, setSel] = useState(0);
  const names = useMemo(() => picks.map((p) => countryName(p.country.code, locale)), [picks, locale]);
  if (picks.length === 0) return null;
  const mode = charts.length === 1 ? 'self' : 'pair';
  const cur = Math.min(sel, picks.length - 1);
  return (
    <div className="rs-cm">
      <div className="rs-cm__scene" role="group" aria-label={C.mapLabel}>
        <svg className="rs-cm__svg" viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} aria-hidden="true" focusable="false">
          <path d={LAND_DOTS} className="rs-cm__land" />
        </svg>
        {picks.map((p, i) => {
          const pos = project(p.country.lat, p.country.lng);
          return (
            <button
              key={p.country.code}
              type="button"
              className="rs-cm__pin"
              data-rank={p.rank}
              aria-pressed={i === cur}
              aria-label={`${C.rank(p.rank)}: ${names[i]}`}
              onClick={() => setSel(i)}
              style={{ left: `${(pos.x / WORLD.w) * 100}%`, top: `${(pos.y / WORLD.h) * 100}%` }}
            >
              <span aria-hidden="true">{p.rank}</span>
            </button>
          );
        })}
      </div>
      <ol className="rs-cm__list">
        {picks.map((p, i) => {
          const open = i === cur;
          return (
            <li key={p.country.code} className="rs-cm__item" data-rank={p.rank} data-open={open ? '' : undefined}>
              <button type="button" className="rs-cm__row" aria-expanded={open} onClick={() => setSel(i)}>
                <span className="rs-cm__rank" aria-hidden="true">
                  {p.rank}
                </span>
                <span className="rs-cm__name">{names[i]}</span>
                <span className="rs-cm__vibe">{C.vibe[p.country.code]}</span>
              </button>
              {open ? (
                <div className="rs-cm__why" aria-live="polite">
                  <p className="rs-cm__tags">
                    <span>{C.rank(p.rank)}</span>
                    <span>{C.element[p.country.element]}</span>
                    <span>{C.climate[p.country.climate]}</span>
                  </p>
                  {pickReasons(p, charts).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="rs-cm__note" data-mode={mode}>
        {C.note}
      </p>
    </div>
  );
}
