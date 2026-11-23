'use client';

import { useId, useState } from 'react';
import { TYPE_PROFILES } from '@/content/types';
import { UI } from '@/content/ui';
import { isUnknownPlace } from '@/lib/places/unknown-place';
import type { Chart, Element, Pillar } from '@/lib/saju';
import { ChevronDownIcon } from '../icons';

type PillarKey = 'year' | 'month' | 'day' | 'hour';
const ORDER: PillarKey[] = ['year', 'month', 'day', 'hour'];
const ELEMENTS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

export function PillarsLine({ chart, accent }: { chart: Chart; accent: string }) {
  const six = chart.pillars.hour === null;
  return (
    <section className="mt-4 border-t border-line-1 pt-3" aria-labelledby="pillars-title">
      <h3 id="pillars-title" className="m-0 text-[0.8125rem] font-semibold text-ink-soft">
        {six ? UI.result.pillarsLabelSix : UI.result.pillarsLabel}
      </h3>
      <ol className="m-0 mt-2 flex list-none justify-between gap-3 p-0 text-center">
        {ORDER.map((key) => {
          const pillar = chart.pillars[key];
          const isDay = key === 'day';
          return (
            <li
              key={key}
              className="flex min-w-0 flex-1 flex-col items-center rounded-[var(--r-sm)] px-1 py-1.5"
              style={isDay ? { background: `color-mix(in srgb, ${accent} 30%, transparent)` } : undefined}
            >
              <span className="sr-only">{UI.result.pillarNames[key]}</span>
              {pillar ? (
                <>
                  <span className="t-hanja text-[1.25rem] leading-tight">{pillar.ganzhi}</span>
                  <span className="mt-0.5 text-[0.6875rem] font-medium leading-none tracking-wide text-ink-soft">
                    {pillar.romanized}
                  </span>
                </>
              ) : (
                <>
                  <span aria-hidden="true" className="t-hanja text-[1.25rem] leading-tight text-ink-soft">
                    {'—'}
                  </span>
                  <span className="mt-0.5 text-[0.6875rem] font-medium leading-none text-ink-soft">{UI.result.hourUnknown}</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ElementDot({ element }: { element: Element }) {
  return <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: `var(--${element})` }} />;
}

function Cell({ pillar, part }: { pillar: Pillar | null; part: 'stem' | 'branch' }) {
  if (!pillar) return <span className="text-ink-soft">{'—'}</span>;
  const element = part === 'stem' ? pillar.stemElement : pillar.branchElement;
  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      <span className="t-hanja text-[1.25rem] leading-none">{part === 'stem' ? pillar.stem : pillar.branch}</span>
      <span className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-ink-soft">
        <ElementDot element={element} />
        {UI.elements[element].name}
      </span>
    </span>
  );
}

export function ChartDetails({ chart }: { chart: Chart }) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const t = UI.result.chart;
  const total = ELEMENTS.reduce((sum, e) => sum + chart.elements[e], 0);
  const { flags, meta } = chart;

  const notices: string[] = [];
  if (flags.timeUnknown) notices.push(t.notices.timeUnknown);
  if (flags.ziHourAmbiguous && flags.altType) notices.push(t.notices.nearMidnight(TYPE_PROFILES[flags.altType].born));
  if (flags.nearJieqiBoundary) notices.push(t.notices.jieqi);

  const basis = isUnknownPlace(chart.input.place)
    ? t.basisNoCity
    : meta.solarTime === 'standard'
      ? t.basisStandard
      : t.basis(chart.input.place.name, meta.offsetMinutes);

  return (
    <section>
      <button
        type="button"
        className="dg-btn dg-btn--quiet w-full !justify-between bg-haze"
        aria-expanded={open}
        aria-controls={`${uid}-chart`}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{open ? UI.result.hideChart : UI.result.showChart}</span>
        <ChevronDownIcon
          size={20}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms var(--ease-out)' }}
        />
      </button>

      <div id={`${uid}-chart`} className="reveal" data-open={open} inert={!open}>
        <div>
          <div className="dg-glass dg-glass--strong mt-3 p-4">
            <table className="w-full border-collapse text-center">
              <caption className="sr-only">{t.caption}</caption>
              <thead>
                <tr>
                  <td />
                  {ORDER.map((k) => (
                    <th key={k} scope="col" className="pb-2 text-[0.75rem] font-semibold text-ink-soft">
                      {UI.result.pillarNames[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(['stem', 'branch'] as const).map((part) => (
                  <tr key={part} className="border-t border-line-1">
                    <th scope="row" className="py-2 pr-2 text-left text-[0.75rem] font-semibold text-ink-soft">
                      {t[part]}
                    </th>
                    {ORDER.map((k) => (
                      <td key={k} className="py-2">
                        <Cell pillar={chart.pillars[k]} part={part} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="m-0 mt-5 text-[0.875rem] font-semibold text-ink">{t.elementsHeading}</h3>
            <ul className="m-0 mt-2 grid list-none gap-2 p-0">
              {ELEMENTS.map((e) => {
                const n = chart.elements[e];
                const pct = total > 0 ? (n / total) * 100 : 0;
                return (
                  <li key={e} className="grid grid-cols-[4.5rem_1fr_1.5rem] items-center gap-3">
                    <span className="text-[0.8125rem] font-medium text-ink">
                      <span className="t-hanja mr-1">{UI.elements[e].hanzi}</span>
                      {UI.elements[e].name}
                    </span>
                    {}
                    <span
                      className="relative block h-3 overflow-hidden rounded-full"
                      style={{ background: 'var(--track)' }}
                      role="img"
                      aria-label={t.elementCount(UI.elements[e].name, n, total)}
                    >
                      <span
                        className="absolute inset-y-0 left-0 block rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: e === 'metal' ? 'color-mix(in srgb, var(--metal) 75%, var(--ink))' : `var(--${e})`,
                          boxShadow: 'inset 0 0 0 1px var(--line-2)',
                        }}
                      />
                    </span>
                    <span className="text-right text-[0.8125rem] font-semibold tabular-nums text-ink">{n}</span>
                  </li>
                );
              })}
            </ul>

            {notices.length > 0 ? (
              <ul className="m-0 mt-5 grid list-none gap-2 p-0">
                {notices.map((n) => (
                  <li key={n} className="rounded-[var(--r-sm)] bg-haze-strong px-3.5 py-2.5 text-[0.875rem] leading-snug text-ink">
                    {n}
                  </li>
                ))}
              </ul>
            ) : null}

            <p className="m-0 mt-4 text-[0.8125rem] leading-snug text-ink-soft">{basis}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
