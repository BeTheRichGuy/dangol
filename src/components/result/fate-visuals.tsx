'use client';

import Image from 'next/image';
import { useId, useState } from 'react';
import { FATE as F } from '@/content/fate-map';
import { isYearTone, monthsOfYear, openMonth, recurringMonths, veiledMonths, yearFocusMonth, type YearKind, type CalendarKind, type CalendarMonth, type FlowMap, type KeyMonth, type KeyYear, type MeetWindows, type PartnerTraits, type PartnerTypeKey } from '@/lib/reading/fate-map';
import { risingPreview } from '@/lib/reading/fate-preview';
import { LockIcon } from '../icons';
import { partnerImage, usePartnerFace, type PartnerFace } from './partner-face';
import './result.css';

const BARS = ['▒▒▒▒ ▒▒▒▒▒▒ ▒▒▒', '▒▒▒▒▒ ▒▒▒ ▒▒▒▒▒▒▒', '▒▒▒ ▒▒▒▒▒▒▒ ▒▒▒▒', '▒▒▒▒▒▒ ▒▒▒▒ ▒▒▒▒▒'];

export function Veil({ i = 0 }: { i?: number }) {
  return (
    <>
      <span className="rs-blur" aria-hidden="true">
        {BARS[i % BARS.length]}
      </span>
      <span className="sr-only">{F.drawers.hiddenSr}</span>
    </>
  );
}

function BothMark() {
  return (
    <svg className="rs-fate__bothstar" width="10" height="10" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M6 .9 7.6 4.3 11.2 4.7 8.5 7.2 9.3 10.8 6 9 2.7 10.8 3.5 7.2 .8 4.7 4.4 4.3Z" fill="currentColor" />
    </svg>
  );
}

function MonthDetail({ m }: { m: KeyMonth }) {
  return (
    <>
      <span className="rs-fate__mo" data-good={m.good ? '' : undefined}>
        <b>{F.months.at(m.month)}</b> <em>{F.months.tag[m.good ? 'good' : 'caution']}</em> {F.months.tone[m.tone]}
      </span>
      <span className="rs-fate__prep">
        <b>{F.paid.years.prepLabel}</b> {F.months.prep[m.tone]}
      </span>
    </>
  );
}

function PaidYearMonths({ kind, rows }: { kind: YearKind; rows: readonly KeyMonth[] }) {
  const P = F.paid.years;
  const focus = yearFocusMonth(kind, rows);
  if (!focus) return <p className="rs-fate__nomo">{P.noMonths}</p>;

  const yearOnly = rows.filter((m) => isYearTone(m) && m !== focus);
  return (
    <div className="rs-fate__ym">
      <p className="rs-fate__focus" data-good={focus.good ? '' : undefined}>
        <span className="rs-fate__focuslabel">{P.focusLabel}</span>
        <MonthDetail m={focus} />
        {focus.both ? <span className="rs-fate__both">{F.months.both}</span> : null}
      </p>
      {rows.length > 1 ? (
        <ul className="rs-fate__mchips" aria-label={P.chipsLabel}>
          {rows.map((m) => (
            <li key={m.month} data-good={m.good ? '' : undefined} data-focus={m === focus ? '' : undefined} aria-label={`${F.months.at(m.month)}, ${F.months.tag[m.good ? 'good' : 'caution']}`}>
              <CalGlyph kind={m.good ? 'good' : 'caution'} />
              <span aria-hidden="true">{F.paid.calendar.short(m.month)}</span>
              {m.both ? <BothMark /> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {yearOnly.length > 0 ? (
        <div className="rs-fate__yonly">
          <p className="rs-fate__focuslabel">{P.yearOnlyLabel}</p>
          <ul className="rs-fate__mlist">
            {yearOnly.map((m) => (
              <li key={m.month} data-good={m.good ? '' : undefined}>
                <MonthDetail m={m} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function RecurringMonths({ months }: { months: readonly KeyMonth[] }) {
  const rows = recurringMonths(months);
  if (rows.length === 0) return null;
  return (
    <div className="rs-fate__recur">
      <p className="rs-fate__nexthead">{F.paid.years.recurHead}</p>
      <p className="rs-fate__recurnote">{F.paid.years.recurNote}</p>
      <ul className="rs-fate__mlist">
        {rows.map((m) => (
          <li key={m.month} data-good={m.good ? '' : undefined}>
            <MonthDetail m={m} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function YearList({ years, thisYear, visible, tips = false, months }: { years: KeyYear[]; thisYear: number; visible: number; tips?: boolean; months?: readonly KeyMonth[] }) {
  return (
    <ol className="rs-fate__years">
      {years.map((y, i) => {
        const shown = i < visible;
        return (
          <li key={y.year} data-kind={y.kind} data-hidden={shown ? undefined : ''}>
            <span className="rs-fate__n" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="rs-fate__year">{F.yearLabel(y.year, thisYear)}</span>
            <span className="rs-fate__tag" data-kind={y.kind}>
              {F.kindTag[y.kind]}
            </span>
            <span className="rs-fate__title">{shown ? F.yearTitle(y) : <Veil i={i} />}</span>
            {months && shown ? (
              <div className="rs-fate__ml">
                <PaidYearMonths kind={y.kind} rows={monthsOfYear(months, y.year)} />
              </div>
            ) : null}
            {tips && shown ? (
              <span className="rs-fate__tip" data-fix={y.kind === 'crisis' ? '' : undefined}>
                <b>{y.kind === 'crisis' ? F.paid.years.fixLabel : F.paid.years.tipLabel}</b> {F.yearTip(y)}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function MonthLine({ m }: { m: KeyMonth }) {
  return (
    <span className="rs-fate__mo" data-good={m.good ? '' : undefined}>
      <b>{F.months.at(m.month)}</b> <em>{F.months.tag[m.good ? 'good' : 'caution']}</em> {F.months.tone[m.tone]}
    </span>
  );
}

function VeiledMonthLines({ months, seed }: { months: readonly KeyMonth[]; seed: number }) {
  return (
    <span className="rs-fate__veilrow">
      {months.map((m, k) => (
        <span key={m.month} className="rs-fate__mo">
          <b>{F.months.at(m.month)}</b>{' '}
          <span className="rs-blur" aria-hidden="true">
            {BARS[(seed + k) % BARS.length]}
          </span>
          <span className="sr-only"> {F.drawers.hiddenSr}</span>
        </span>
      ))}
    </span>
  );
}

export function FreeYearList({ years, thisYear, months, open = 2 }: { years: KeyYear[]; thisYear: number; months: readonly KeyMonth[]; open?: number }) {
  return (
    <ol className="rs-fate__years">
      {years.map((y, i) => {
        const near = i < open;
        const first = near ? openMonth(months, y.year, i) : null;
        return (
          <li key={y.year} data-kind={y.kind} data-hidden={near ? undefined : ''}>
            <span className="rs-fate__n" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="rs-fate__year">{F.yearLabel(y.year, thisYear)}</span>
            <span className="rs-fate__tag" data-kind={y.kind}>
              {F.kindTag[y.kind]}
            </span>
            {!near ? (
              <span className="rs-fate__title">
                <Veil i={i} />
              </span>
            ) : first ? (
              <span className="rs-fate__months">
                <MonthLine m={first} />
              </span>
            ) : (
              <span className="rs-fate__title">{F.yearTitle(y)}</span>
            )}
            {near ? <VeiledMonthLines months={veiledMonths(months, y.year, first)} seed={i} /> : null}
            {y.kind === 'crisis' ? (
              <span className="rs-fate__fix">
                <LockIcon size={14} />
                {F.drawers.years.fix}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function CalGlyph({ kind }: { kind: CalendarKind }) {
  return (
    <svg className="rs-cal__glyph" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      {kind === 'good' ? (
        <circle cx="6" cy="6" r="4.5" fill="currentColor" />
      ) : kind === 'caution' ? (
        <path d="M6 1.2 10.8 6 6 10.8 1.2 6Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      ) : (
        <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function MonthCalendar({ cal }: { cal: readonly CalendarMonth[] }) {
  const firstGood = cal.findIndex((c) => c.kind === 'good');
  const [sel, setSel] = useState(firstGood >= 0 ? firstGood : 0);
  const C = F.paid.calendar;
  const cur = cal[Math.min(sel, cal.length - 1)];
  if (!cur) return null;
  return (
    <div className="rs-cal">
      <ul className="rs-cal__grid">
        {cal.map((c, i) => (
          <li key={`${c.year}-${c.month}`}>
            <button
              type="button"
              className="rs-cal__cell"
              data-kind={c.kind}
              aria-pressed={i === sel}
              aria-label={`${C.label(c.year, c.month)}, ${C.tag[c.kind]}`}
              onClick={() => setSel(i)}
            >
              <span className="rs-cal__yr" aria-hidden="true">
                {i === 0 || c.month === 1 ? c.year : ''}
              </span>
              <span className="rs-cal__mo" aria-hidden="true">
                {C.short(c.month)}
              </span>
              <CalGlyph kind={c.kind} />
              <span className="rs-cal__tag" aria-hidden="true">
                {C.tag[c.kind]}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="rs-cal__detail" data-kind={cur.kind} aria-live="polite">
        <b>{C.label(cur.year, cur.month)}</b> <em>{C.tag[cur.kind]}</em> {C.detail[cur.tone ?? 'even']}
        <span className="rs-cal__prep">
          <b>{C.prepLabel}</b> {C.prep[cur.tone ?? 'even']}
        </span>
      </p>
    </div>
  );
}

const W = 320;
const H = 150;
const PAD_X = 14;
const PAD_T = 14;
const PAD_B = 14;

function frac(age: number): number {
  const a = Math.max(age, 0);
  if (a < 60) return a / 80;
  return 0.75 + (Math.min(a, 100) - 60) / 160;
}
const xOf = (age: number) => PAD_X + frac(age) * (W - PAD_X * 2);
const yOf = (score: number) => PAD_T + (1 - (score - 8) / 86) * (H - PAD_T - PAD_B);

function curve(pts: { x: number; y: number }[]): string {
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1];
    const b = pts[i];
    const m = (a.x + b.x) / 2;
    d += ` C${m.toFixed(1)} ${a.y.toFixed(1)} ${m.toFixed(1)} ${b.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return d;
}

export function FlowChart({ flow: realFlow, locked }: { flow: FlowMap; locked: boolean }) {
  const gid = useId().replace(/:/g, '');

  const flow = locked ? risingPreview(realFlow) : realFlow;
  const first = flow.points[0];
  const last = flow.points[flow.points.length - 1];
  const pts = [
    { x: xOf(first.startAge), y: yOf(first.score) },
    ...flow.points.map((p) => ({ x: xOf((p.startAge + p.endAge + 1) / 2), y: yOf(p.score) })),
    { x: xOf(last.endAge + 1), y: yOf(last.score) },
  ];
  const line = curve(pts);
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)} ${H - PAD_B} L${pts[0].x.toFixed(1)} ${H - PAD_B} Z`;
  const here = (xOf(flow.age) / W) * 100;

  const cut = locked ? xOf(flow.age) : null;
  return (
    <div className="rs-fate__flow" data-locked={locked ? '' : undefined}>
      <div className="rs-fate__plot">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={F.paid.flow.head} className="rs-fate__svg">
          <defs>
            <linearGradient id={`a${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d9a45c" stopOpacity="0.42" />
              <stop offset="1" stopColor="#d9a45c" stopOpacity="0.04" />
            </linearGradient>
            {cut !== null ? (
              <clipPath id={`c${gid}`}>
                <rect x={0} y={0} width={cut} height={H} />
              </clipPath>
            ) : null}
          </defs>
          {[20, 40, 60].map((age) => (
            <line key={age} x1={xOf(age)} x2={xOf(age)} y1={PAD_T} y2={H - PAD_B} className="rs-fate__grid" />
          ))}
          <line x1={PAD_X} x2={W - PAD_X} y1={yOf(50)} y2={yOf(50)} className="rs-fate__grid" />
          <g clipPath={cut !== null ? `url(#c${gid})` : undefined}>
            <path d={area} fill={`url(#a${gid})`} />
            <path d={line} className="rs-fate__line" fill="none" />
          </g>
          {flow.points
            .filter((p) => cut === null || xOf((p.startAge + p.endAge + 1) / 2) <= cut)
            .map((p) => (
                <circle
                  key={p.number}
                  cx={xOf((p.startAge + p.endAge + 1) / 2)}
                  cy={yOf(p.score)}
                  r={p.current ? 5.5 : 3.6}
                  className="rs-fate__dot"
                  data-level={p.level}
                  data-current={p.current ? '' : undefined}
                />
          ))}
        </svg>
        {}
        <span className="rs-fate__here" style={{ left: `${here}%` }} data-flip={here > 66 ? '' : undefined}>
          <span>{F.drawers.flow.here}</span>
        </span>
        {locked ? (
          <p className="rs-fate__veil">
            <LockIcon size={20} />
            <span>{F.drawers.flow.locked}</span>
          </p>
        ) : null}
      </div>
      <ul className="rs-fate__stages" aria-label={F.paid.flow.head}>
        {flow.stages.map((s) => (
          <li key={s.key} data-current={s.current ? '' : undefined} data-level={locked ? undefined : s.level}>
            <strong>{F.stageLabel[s.key]}</strong>
            <span>{F.stageAges[s.key]}</span>
            {locked ? null : <em>{F.levelWord[s.level]}</em>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PartnerFace({ kind, face, locked }: { kind: PartnerTypeKey; face: PartnerFace; locked: boolean }) {
  const name = F.partner.types[kind].name;
  return (
    <figure className="rs-fate__face" data-locked={locked ? '' : undefined}>
      {locked ? (
        <Image src={partnerImage(kind, face, true)} alt="" width={24} height={30} unoptimized className="rs-fate__photo" />
      ) : (
        <Image src={partnerImage(kind, face, false)} alt={F.partner.alt(name)} width={720} height={900} sizes="112px" className="rs-fate__photo" />
      )}
      {locked ? (
        <figcaption className="rs-fate__facelock">
          <LockIcon size={16} />
        </figcaption>
      ) : null}
    </figure>
  );
}

function FaceToggle({ face, onChange }: { face: PartnerFace; onChange: (f: PartnerFace) => void }) {
  return (
    <div className="rs-fate__faces" role="group" aria-label={F.partner.faces.label} data-card-save-skip="">
      {(['f', 'm'] as const).map((f) => (
        <button key={f} type="button" className="rs-fate__facebtn" aria-pressed={face === f} onClick={() => onChange(f)}>
          {F.partner.faces[f]}
        </button>
      ))}
    </div>
  );
}

export function PartnerCard({ partner, kind, locked, visible, sex, when }: { partner: PartnerTraits; kind: PartnerTypeKey; locked: boolean; visible: number; sex?: 'female' | 'male' | null; when?: MeetWindows | null }) {
  const [face, setFace] = usePartnerFace(sex);
  const type = F.partner.types[kind];
  const rows: Array<{ key: string; text: string }> = [
    { key: F.partner.keys.vibe, text: F.partner.vibe(partner.vibe) },
    { key: F.partner.keys.temper, text: F.partner.temper(partner.temper) },
    { key: F.partner.keys.meet, text: F.partner.meet(partner.meet) },
  ];
  return (
    <div className="grid gap-3">
      <div className="rs-fate__partner">
        <PartnerFace kind={kind} face={face} locked={locked} />
        <ul className="rs-fate__chips">
          {rows.map((r, i) => (
            <li key={r.key} data-hidden={i < visible ? undefined : ''}>
              <span className="rs-fate__k">{r.key}</span>
              <span className="rs-fate__v">{i < visible ? r.text : <Veil i={i + 1} />}</span>
            </li>
          ))}
        </ul>
      </div>
      <FaceToggle face={face} onChange={setFace} />
      {locked ? null : (
        <div className="rs-fate__type">
          <p className="rs-fate__typename">{type.name}</p>
          <p className="rs-fate__who">{type.who}</p>
          <p className="rs-fate__look">{type.look}</p>
          <dl className="rs-fate__why">
            <div>
              <dt>{F.partner.typeKeys.ease}</dt>
              <dd>{type.ease}</dd>
            </div>
            <div>
              <dt>{F.partner.typeKeys.care}</dt>
              <dd>{type.care}</dd>
            </div>
          </dl>
          {when ? (
            <div className="rs-fate__when">
              <p className="rs-fate__whenhead">{F.paid.partner.when.head}</p>
              <ul>
                {when.work ? <li>{F.paid.partner.when.work(when.work.year, when.work.month)}</li> : null}
                {when.close ? <li>{F.paid.partner.when.close(when.close.year, when.close.month)}</li> : null}
                {!when.work && !when.close ? <li>{F.paid.partner.when.none}</li> : null}
              </ul>
              {when.work || when.close ? <p className="rs-fate__recurnote">{F.paid.partner.when.recur}</p> : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
