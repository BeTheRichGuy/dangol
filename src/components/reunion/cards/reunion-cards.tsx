'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { saveCardUrl, type SaveKind } from '@/app/api/reunion-card/params';
import { REUNION } from '@/content/reunion';
import type { Locale } from '@/content/locale';
import { track } from '@/lib/analytics/track';
import type { WindowMonth } from '@/lib/reunion/cards';
import type { ReunionIntake } from '@/lib/reunion/intake';
import type { RoomPayload } from '@/lib/rooms/payload';
import { REUNION_GUIDE_NAME } from '@/lib/reunion/product';
import { ChevronDownIcon, DownloadIcon } from '../../icons';
import { useLocale } from '../../locale-provider';
import { Narration } from '../../webtoon';
import { canSaveCards, cardFolded, reunionCardData, reunionCardsAfter, saveCardsOf, splitNote, type ReunionCardData, type ReunionCardKey } from './plan';
import './cards.css';

const fillGuide = (text: string, locale: Locale): string => text.replaceAll('{guide}', REUNION_GUIDE_NAME[locale].name);

export function reunionCardDataNow(payload: RoomPayload): ReunionCardData | null {
  const K = REUNION.cards.kit;
  return reunionCardData(payload, { plain: K.tones.plain.lines.length, apology: K.tones.apology.lines.length, news: K.tones.news.lines.length, dontSend: K.dontSend.length });
}

function Shell({ name, title, fold, children }: { name: ReunionCardKey; title: string; fold: boolean; children: ReactNode }) {
  return (
    <div className="rm-fate-inline" data-reunion-card={name}>
      <Narration serif className="ru-card">
        {fold ? (
          <details className="ru-fold">
            <summary>
              <h3 className="ru-card__head">{title}</h3>
              <ChevronDownIcon size={20} aria-hidden="true" />
            </summary>
            <div className="ru-fold__body">{children}</div>
          </details>
        ) : (
          <>
            <h3 className="ru-card__head">{title}</h3>
            {children}
          </>
        )}
      </Narration>
    </div>
  );
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function CopyButton({ text, label, done }: { text: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );
  return (
    <button
      type="button"
      className="ru-copy"
      data-done={copied ? '' : undefined}
      onClick={() => {
        void writeClipboard(text).then((ok) => {
          if (!ok) return;
          setCopied(true);
          if (timer.current !== null) window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      <span aria-live="polite">{copied ? done : label}</span>
    </button>
  );
}

const monthName = (m: WindowMonth) => REUNION.cards.window.monthLabel(m.year, m.month);

function ReadinessCard({ fold }: { fold: boolean }) {
  useLocale();
  const C = REUNION.cards.readiness;
  const [checked, setChecked] = useState<boolean[]>(() => C.items.map(() => false));
  return (
    <Shell name="readiness" title={C.title} fold={fold}>
      <p className="ru-card__intro">{C.intro}</p>
      <ul className="ru-check">
        {C.items.map((item, i) => (
          <li key={item}>
            <label>
              <input type="checkbox" checked={checked[i] ?? false} onChange={() => setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)))} />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="ru-card__foot">{C.footer}</p>
    </Shell>
  );
}

export function pathTiming(timing: string, month: string | null, noMonth: string): string {
  return timing.includes('{month}') ? (month ? timing.replaceAll('{month}', month) : noMonth) : timing;
}

function PathsCard({ data, fold }: { data: ReunionCardData; fold: boolean }) {
  useLocale();
  const C = REUNION.cards.paths;
  const month = data.open ? monthName(data.open) : null;
  const [picked, setPicked] = useState<string | null>(null);
  const col = C.columns.find((c) => c.id === picked) ?? null;
  return (
    <Shell name="paths" title={C.title} fold={fold}>
      <p className="ru-card__intro">{C.intro}</p>
      <div className="ru-pathtabs" role="group" aria-label={C.title}>
        {C.columns.map((c) => (
          <button key={c.id} type="button" className="ru-pathtab" aria-pressed={picked === c.id} data-path={c.id} onClick={() => setPicked(picked === c.id ? null : c.id)}>
            {c.name}
          </button>
        ))}
      </div>
      {col ? (
        <section className="ru-path" aria-label={col.name} data-path={col.id} aria-live="polite">
          <h4 className="ru-path__name">{col.name}</h4>
          <dl>
            <div>
              <dt>{C.rows.when}</dt>
              <dd>{col.when}</dd>
            </div>
            <div>
              <dt>{C.rows.timing}</dt>
              <dd>{pathTiming(col.timing, month, C.noMonth)}</dd>
            </div>
            <div>
              <dt>{C.rows.relief}</dt>
              <dd>{col.relief}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </Shell>
  );
}

function WindowCard({ data, fold }: { data: ReunionCardData; fold: boolean }) {
  useLocale();
  const C = REUNION.cards.window;
  return (
    <Shell name="window" title={C.title} fold={fold}>
      <p className="ru-card__intro">{C.intro}</p>
      <ul className="ru-strip" aria-hidden="true">
        {data.calendar.map((m) => (
          <li key={`${m.year}-${m.month}`} data-kind={m.kind} />
        ))}
      </ul>
      <ul className="ru-months">
        {data.calendar.map((m) => (
          <li key={`${m.year}-${m.month}`} className="ru-month" data-kind={m.kind}>
            <span className="ru-month__when">{monthName(m)}</span>
            <span className="ru-month__kind">{C.kinds[m.kind].label}</span>
            <p className="ru-month__act">{C.kinds[m.kind].actions[m.action]}</p>
          </li>
        ))}
      </ul>
      <ol className="ru-dates">
        {data.dates.map((m, i) => (
          <li key={`${m.year}-${m.month}`} className="ru-date" data-kind={m.kind}>
            <p className="ru-date__head">{C.cardHead(i + 1)}</p>
            <p className="ru-date__when">{monthName(m)}</p>
            <span className="ru-month__kind">{C.kinds[m.kind].label}</span>
            <p>{C.kinds[m.kind].actions[m.action]}</p>
          </li>
        ))}
      </ol>
      <p className="ru-card__foot">{C.footer}</p>
    </Shell>
  );
}

function KitCard({ data, fold }: { data: ReunionCardData; fold: boolean }) {
  const locale = useLocale();
  const C = REUNION.cards.kit;
  if (data.kit.mode === 'waiting') {
    return (
      <Shell name="kit" title={C.waiting.title} fold={fold}>
        <ol className="ru-rules">
          {C.waiting.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </Shell>
    );
  }
  const tones = [
    { id: 'plain', tone: C.tones.plain, pick: data.kit.plain },
    { id: 'apology', tone: C.tones.apology, pick: data.kit.apology },
    { id: 'news', tone: C.tones.news, pick: data.kit.news },
  ] as const;
  return (
    <Shell name="kit" title={C.title} fold={fold}>
      <p className="ru-card__intro">{fillGuide(C.intro, locale)}</p>
      <div className="ru-tones">
        {tones.map(({ id, tone, pick }) => {
          const line = splitNote(tone.lines[pick] ?? '').quote;
          return (
            <section key={id} className="ru-tone" aria-label={tone.name} data-tone={id}>
              <p className="ru-tone__name">{tone.name}</p>
              <p className="ru-tone__line">{line}</p>
              <CopyButton text={line} label={C.copy} done={C.copied} />
            </section>
          );
        })}
      </div>
      <ul className="ru-branches">
        {C.branches.map((b) => (
          <li key={b.name} className="ru-branch">
            <b>{b.name}</b>
            <span>{b.next}</span>
            <span>{b.stop}</span>
          </li>
        ))}
      </ul>
      <h4 className="ru-sub">{C.dontSendTitle}</h4>
      <ul className="ru-list ru-dont">
        {data.kit.dontSend.map((i) => {
          const { quote, note } = splitNote(C.dontSend[i] ?? '');
          return (
            <li key={i}>
              <span>{quote}</span>
              {note ? <small>{note}</small> : null}
            </li>
          );
        })}
      </ul>
      <h4 className="ru-sub">{C.timeTitle}</h4>
      <p className="ru-card__intro">{C.timeLine}</p>
    </Shell>
  );
}

function DaysCard({ fold }: { fold: boolean }) {
  useLocale();
  const C = REUNION.cards.days;
  return (
    <Shell name="days" title={C.title} fold={fold}>
      <p className="ru-card__intro">{C.intro}</p>
      <ol className="ru-days">
        {C.nodes.map((n) => (
          <li key={n.range} className="ru-day">
            <span className="ru-day__range">{n.range}</span>
            <span className="ru-day__title">{n.title}</span>
            <p className="ru-day__line">{n.line}</p>
          </li>
        ))}
      </ol>
    </Shell>
  );
}

function RulesCard({ data, fold }: { data: ReunionCardData; fold: boolean }) {
  useLocale();
  const C = REUNION.cards.rules;
  return (
    <Shell name="rules" title={C.title} fold={fold}>
      <p className="ru-card__intro">{C.intro}</p>
      <ul className="ru-rulecards">
        {C.byFrayed[data.frayed].map((rule) => (
          <li key={rule.title} className="ru-rulecard">
            <b>{rule.title}</b>
            <p>{rule.line}</p>
          </li>
        ))}
      </ul>
      <h4 className="ru-sub">{C.warningsTitle}</h4>
      <ul className="ru-list">
        {C.warnings.map((w) => (
          <li key={w} className="ru-branch">
            {w}
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function LetGoCard({ fold }: { fold: boolean }) {
  useLocale();
  const C = REUNION.cards.letgo;
  return (
    <Shell name="letgo" title={C.title} fold={fold}>
      <p className="ru-card__intro">{C.intro}</p>
      <ol className="ru-steps">
        {C.steps.map((s) => (
          <li key={s.title}>
            <b>{s.title}</b>
            <span>{s.line}</span>
          </li>
        ))}
      </ol>
      <h4 className="ru-sub">{C.letter.title}</h4>
      <ul className="ru-list">
        {C.letter.prompts.map((p) => (
          <li key={p} className="ru-branch">
            {p}
          </li>
        ))}
      </ul>
      <h4 className="ru-sub">{C.signalsTitle}</h4>
      <ul className="ru-list">
        {C.signals.map((s) => (
          <li key={s} className="ru-branch">
            {s}
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function CardOf({ name, data }: { name: ReunionCardKey; data: ReunionCardData }) {
  const fold = cardFolded(name, data.intake);
  switch (name) {
    case 'readiness':
      return <ReadinessCard fold={fold} />;
    case 'paths':
      return <PathsCard data={data} fold={fold} />;
    case 'window':
      return <WindowCard data={data} fold={fold} />;
    case 'kit':
      return <KitCard data={data} fold={fold} />;
    case 'days':
      return <DaysCard fold={fold} />;
    case 'rules':
      return <RulesCard data={data} fold={fold} />;
    case 'letgo':
      return <LetGoCard fold={fold} />;
  }
}

export function ReunionCardsAfter({ n, data }: { n: number; data: ReunionCardData }) {
  const names = reunionCardsAfter(n);
  if (names.length === 0) return null;
  return (
    <>
      {names.map((name) => (
        <CardOf key={name} name={name} data={data} />
      ))}
    </>
  );
}

export function ReunionSummary({ intake }: { intake: ReunionIntake }) {
  useLocale();
  const I = REUNION.intake;
  const label = <Id extends string>(options: readonly { id: Id; label: string }[], id: Id) => options.find((o) => o.id === id)?.label ?? '';
  return <p className="ru-summary">{REUNION.product.summary({ since: label(I.since.options, intake.since), who: label(I.who.options, intake.who), want: label(I.want.options, intake.want) })}</p>;
}

export function MovementDivider({ index }: { index: number }) {
  useLocale();
  const name = REUNION.product.movements[index];
  return name ? (
    <p className="ru-movement">
      <span>{name}</span>
    </p>
  ) : null;
}

export function SaveCards({ data }: { data: ReunionCardData }) {
  const locale = useLocale();
  const S = REUNION.cards.save;
  const [saved, setSaved] = useState<SaveKind | null>(null);
  const [broken, setBroken] = useState<ReadonlySet<SaveKind>>(new Set());
  if (!canSaveCards(data)) return null;
  const cards = saveCardsOf(data, locale);
  const items: { kind: SaveKind; name: string; caption: string }[] = [
    { kind: 'window', name: S.window.name, caption: S.window.caption },
    { kind: 'kit', name: S.kit.name, caption: S.kit.caption },
    { kind: 'song', name: S.song.name, caption: S.song.caption },
  ];
  return (
    <section className="ru-save" aria-labelledby="ru-save-title" data-reunion-card="save">
      <h2 id="ru-save-title" className="ru-save__head">
        {S.title}
      </h2>
      <ul className="ru-save__list">
        {items.map(({ kind, name, caption }) => (
          <li key={kind} className="ru-save__item">
            {broken.has(kind) ? (
              <div className="ru-save__thumb" aria-hidden="true" />
            ) : (
              <Image
                className="ru-save__thumb"
                src={saveCardUrl(cards[kind], { width: 360 })}
                alt={name}
                width={96}
                height={144}
                unoptimized
                loading="lazy"
                onError={() => setBroken((prev) => new Set(prev).add(kind))}
              />
            )}
            <div className="ru-save__text">
              <p className="ru-save__name">{name}</p>
              <p className="ru-save__caption">{caption}</p>
              {broken.has(kind) ? (
                <p className="ru-save__note" role="status">
                  {S.failed}
                </p>
              ) : (
                <a
                  className="dg-btn dg-btn--primary ru-save__btn"
                  href={saveCardUrl(cards[kind], { download: true })}
                  download
                  onClick={() => {
                    track('reunion_card_save', { card: kind });
                    setSaved(kind);
                  }}
                >
                  <DownloadIcon size={18} />
                  <span>{S.button}</span>
                </a>
              )}
              {saved === kind ? (
                <p className="ru-save__note" role="status">
                  {S.saved}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <p className="ru-save__foot">{S.footer}</p>
    </section>
  );
}
