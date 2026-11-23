'use client';

import { Fragment, type CSSProperties } from 'react';
import { XMAS_DAYS } from '@/content/xmas';
import type { XmasDay } from '@/lib/xmas/pulls';
import { XMAS_HOOKS } from '@/content/xmas-hooks';

const D = XMAS_DAYS;

function Marked({ text }: { text: string }) {
  return (
    <>
      {text.split('*').map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

function monthsOf(from: string, to: string): { year: number; month: number; days: (string | null)[] }[] {
  const out: { year: number; month: number; days: (string | null)[] }[] = [];
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += 86_400_000) {
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

export function XmasDays({ days, from, to, rivals = [] }: { days: readonly XmasDay[]; from: string; to: string; rivals?: readonly string[] }) {
  const kindOf = new Map(days.map((d) => [d.date, d.kind]));

  const rivalSet = new Set(rivals);

  const good = days.filter((d) => d.kind === 'close' || d.kind === 'group').length;
  const label = (iso: string) => D.date(Number(iso.slice(5, 7)), Number(iso.slice(8, 10)));
  return (
    <section className="xq-days" aria-label={D.title.replace('{from}', label(from)).replace('{to}', label(to))}>
      <p className="xq-days__count">{good > 0 ? <Marked text={D.count.replace('{n}', String(good))} /> : D.none}</p>
      {monthsOf(from, to).map((m) => (
        <div key={`${m.year}-${m.month}`} className="xq-days__month">
          <h3>
            {D.month(m.year, m.month)}
          </h3>
          <ol>
            {D.weekdays.map((w) => (
              <li key={w} className="xq-days__wd" aria-hidden="true">
                {w}
              </li>
            ))}
            {m.days.map((iso, i) => {
              if (!iso) return <li key={`e${i}`} aria-hidden="true" />;
              const kind = kindOf.get(iso);
              const special = D.special[iso.slice(5)];
              return (
                <li key={iso} data-kind={kind} data-special={special ? '' : undefined} data-rival={rivalSet.has(iso) ? '' : undefined} style={{ '--i': i } as CSSProperties}>
                  <b>{Number(iso.slice(8, 10))}</b>
                  {kind ? <i aria-label={D.kinds[kind].label}>{D.kinds[kind].mark}</i> : null}
                  {special ? <small>{special}</small> : null}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
      <ul className="xq-days__legend">
        {(['close', 'group', 'bloom', 'caution'] as const).map((k) => (
          <li key={k} data-kind={k}>
            <i>{D.kinds[k].mark}</i> {D.kinds[k].label}
          </li>
        ))}
        {rivals.length > 0 ? (
          <li data-rival="">
            <i aria-hidden="true" /> {XMAS_HOOKS.paid.rivalDay}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
