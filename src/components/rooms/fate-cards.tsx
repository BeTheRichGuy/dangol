'use client';

import { useMemo } from 'react';
import { FATE as F } from '@/content/fate-map';
import { elementPairs, fateMap, loveYears, meetWindows, monthCalendar, monthHeat, nextChapter, togetherMonths, type CalendarMonth, type ElementPair, type FlowMap, type HeatMonth, type LoveYear, type TogetherMonth } from '@/lib/reading/fate-map';
import type { RoomPayload } from '@/lib/rooms/payload';
import type { ChapterRoom } from '@/lib/rooms/themes';
import { FATE_X as X } from '@/content/fate-extra';
import { countryPicks } from '@/lib/reading/country';
import { pairLines, pairType, pairYears } from '@/lib/reading/match-extra';
import { CountryMapCard } from '../result/country-map';
import { LanternRiver } from '../result/lantern-river';
import { LoveBand } from '../result/love-band';
import { MatchElements, MatchTogether } from '../result/match-cards';
import { PairLinesCard, PairTypeCard, PairYearsCard } from '../result/match-extra-cards';
import { YearHeat } from '../result/year-heat';
import { FlowChart, MonthCalendar, PartnerCard, RecurringMonths, YearList } from '../result/fate-visuals';
import '../result/result.css';
import { Narration } from '../webtoon';
import { CardSave } from '../card-save/card-save';

export type FateCardPart = 'years' | 'flow' | 'partner' | 'calendar' | 'lantern' | 'heat' | 'band' | 'elements' | 'together' | 'pairType' | 'pairLines' | 'pairYears' | 'country';

const NO_CARDS: Record<FateCardPart, boolean> = {
  years: false, flow: false, partner: false, calendar: false, lantern: false, heat: false, band: false, elements: false, together: false,
  pairType: false, pairLines: false, pairYears: false, country: false,
};

export const FATE_CARDS: Record<ChapterRoom, Record<FateCardPart, boolean>> = {

  life: { ...NO_CARDS, years: true, flow: true, partner: true, country: true },

  decades: { ...NO_CARDS, years: true, flow: true, lantern: true },

  love: { ...NO_CARDS, partner: true, band: true, calendar: true },

  match: { ...NO_CARDS, elements: true, together: true, pairType: true, pairLines: true, pairYears: true, country: true },

  year: { ...NO_CARDS, heat: true },

  reunion: NO_CARDS,
};

function flowSummary(flow: FlowMap): string[] {
  const { best, hardest } = flow;
  if (best.score - hardest.score < 12) return [F.paid.flow.even];
  return [
    F.paid.flow.best(best.startAge, best.endAge, best.startYear, best.endYear),
    F.paid.flow.hardest(hardest.startAge, hardest.endAge, hardest.startYear, hardest.endYear),
  ];
}

export const FATE_PLACE: Record<ChapterRoom, Partial<Record<FateCardPart, number>>> = {

  life: { years: 6, flow: 7, partner: 8, country: 11 },
  decades: { flow: 1, years: 4, lantern: 6 },
  love: { partner: 2, band: 5, calendar: 6 },

  match: { pairType: 1, pairLines: 2, elements: 4, pairYears: 5, together: 7, country: 7 },
  year: { heat: 5 },
  reunion: {},
};

export function hasFateInline(room: ChapterRoom): boolean {
  return Object.keys(FATE_PLACE[room]).length > 0;
}

export function fateAfter(room: ChapterRoom, n: number): FateCardPart[] {
  const place = FATE_PLACE[room];
  return (Object.keys(place) as FateCardPart[]).filter((part) => place[part] === n && FATE_CARDS[room][part]);
}

function useFate(payload: RoomPayload) {
  return useMemo(() => fateMap(payload.self, payload.luck, payload.years, payload.age, Number(payload.today.slice(0, 4)), payload.today), [payload]);
}

function YearsCard({ fate, thisYear }: { fate: ReturnType<typeof fateMap>; thisYear: number }) {
  return (
    <Narration serif className="rs-fate rs-fate--years">
      <h3 className="rs-fate__head">{F.paid.years.head}</h3>
      <p className="rs-fate__sub">{F.paid.years.sub}</p>
      <YearList years={fate.years} thisYear={thisYear} visible={fate.years.length} tips months={fate.months ?? []} />
      <RecurringMonths months={fate.months ?? []} />
    </Narration>
  );
}

function FlowExtras({ flow }: { flow: FlowMap }) {
  const N = F.paid.flow.next;
  const next = nextChapter(flow);
  const stages = flow.stages.filter((s) => s.toAge >= flow.age);
  return (
    <>
      {next ? (
        <div className="rs-fate__next">
          <p className="rs-fate__nexthead">{N.head}</p>
          <p className="rs-fate__summary">
            {N.opens(next.year, next.month, next.dir === null)} {next.dir ? N.dir[next.dir] : null}
          </p>
          <p className="rs-fate__prep">
            <b>{N.prepLabel}</b> {next.dir ? N.prep[next.dir] : N.firstPrep}
          </p>
        </div>
      ) : null}
      {stages.length > 0 ? (
        <div className="rs-fate__stageprep">
          <p className="rs-fate__nexthead">{F.paid.flow.stageHead}</p>
          <ul>
            {stages.map((s) => (
              <li key={s.key} data-current={s.current ? '' : undefined} data-level={s.level}>
                <b>{F.stageLabel[s.key]}</b> <span>{F.stageAges[s.key]}</span> {F.paid.flow.stageFocus[s.key]}
                {' · '}
                {F.paid.flow.pace[s.level]}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

function FlowCard({ flow }: { flow: FlowMap }) {
  return (
    <Narration serif className="rs-fate rs-fate--flow">
      <h3 className="rs-fate__head">{F.paid.flow.head}</h3>
      <p className="rs-fate__sub">{F.paid.flow.sub}</p>
      <FlowChart flow={flow} locked={false} />
      {flowSummary(flow).map((line) => (
        <p key={line} className="rs-fate__summary">
          {line}
        </p>
      ))}
      <FlowExtras flow={flow} />
    </Narration>
  );
}

function BandBlock({ years }: { years: readonly LoveYear[] }) {
  return (
    <Narration serif className="rs-fate rs-fate--band">
      <h3 className="rs-fate__head">{F.paid.band.head}</h3>
      <p className="rs-fate__sub">{F.paid.band.sub}</p>
      <LoveBand years={years} />
    </Narration>
  );
}

function ElementsBlock({ pairs }: { pairs: readonly ElementPair[] }) {
  return (
    <Narration serif className="rs-fate rs-fate--elements">
      <h3 className="rs-fate__head">{F.paid.match.elements.head}</h3>
      <p className="rs-fate__sub">{F.paid.match.elements.sub}</p>
      <MatchElements pairs={pairs} />
    </Narration>
  );
}

function TogetherBlock({ months }: { months: readonly TogetherMonth[] }) {
  return (
    <Narration serif className="rs-fate rs-fate--together">
      <h3 className="rs-fate__head">{F.paid.match.together.head}</h3>
      <p className="rs-fate__sub">{F.paid.match.together.sub}</p>
      <MatchTogether months={months} />
    </Narration>
  );
}

function PairTypeBlock({ payload }: { payload: RoomPayload }) {
  const p = payload.partner;
  if (!p) return null;
  return (
    <Narration serif className="rs-fate rs-fate--pairtype">
      <h3 className="rs-fate__head">{X.type.head}</h3>
      <p className="rs-fate__sub">{X.type.sub}</p>
      <PairTypeCard type={pairType(p.cross, payload.self, p.chart)} />
    </Narration>
  );
}

function PairLinesBlock({ payload }: { payload: RoomPayload }) {
  const p = payload.partner;
  const found = useMemo(() => (p ? pairLines(p.cross) : null), [p]);
  if (!p || !found) return null;
  return (
    <Narration serif className="rs-fate rs-fate--pairlines">
      <h3 className="rs-fate__head">{X.lines.head}</h3>
      <p className="rs-fate__sub">{X.lines.sub}</p>
      <PairLinesCard lines={found.lines} total={found.total} me={payload.self} you={p.chart} />
    </Narration>
  );
}

function PairYearsBlock({ payload }: { payload: RoomPayload }) {
  const p = payload.partner;
  const years = useMemo(() => (p ? pairYears(payload.self, p.chart, payload.today) : []), [payload, p]);
  if (!p || years.length === 0) return null;
  return (
    <Narration serif className="rs-fate rs-fate--pairyears">
      <h3 className="rs-fate__head">{X.years.head}</h3>
      <p className="rs-fate__sub">{X.years.sub}</p>
      <PairYearsCard years={years} />
    </Narration>
  );
}

function CountryBlock({ payload, room }: { payload: RoomPayload; room: ChapterRoom }) {
  const charts = useMemo(() => (room === 'match' ? (payload.partner ? [payload.self, payload.partner.chart] : []) : [payload.self]), [payload, room]);
  const picks = useMemo(() => (charts.length > 0 ? countryPicks(charts) : []), [charts]);
  if (picks.length === 0) return null;
  const mode = charts.length === 1 ? 'self' : 'pair';
  return (
    <Narration serif className="rs-fate rs-fate--country">
      <h3 className="rs-fate__head">{X.country.head[mode]}</h3>
      <p className="rs-fate__sub">{X.country.sub[mode]}</p>
      <CountryMapCard picks={picks} charts={charts} />
    </Narration>
  );
}

function HeatBlock({ heat }: { heat: readonly HeatMonth[] }) {
  return (
    <Narration serif className="rs-fate rs-fate--heat">
      <h3 className="rs-fate__head">{F.paid.heat.head}</h3>
      <p className="rs-fate__sub">{F.paid.heat.sub}</p>
      <YearHeat heat={heat} />
    </Narration>
  );
}

function LanternBlock({ flow }: { flow: FlowMap }) {
  return (
    <Narration serif className="rs-fate rs-fate--lantern">
      <h3 className="rs-fate__head">{F.paid.lantern.head}</h3>
      <p className="rs-fate__sub">{F.paid.lantern.sub}</p>
      <LanternRiver flow={flow} />
    </Narration>
  );
}

function CalendarBlock({ cal }: { cal: readonly CalendarMonth[] }) {
  return (
    <Narration serif className="rs-fate rs-fate--calendar">
      <h3 className="rs-fate__head">{F.paid.calendar.head}</h3>
      <p className="rs-fate__sub">{F.paid.calendar.sub}</p>
      <MonthCalendar cal={cal} />
    </Narration>
  );
}

function PartnerBlock({ fate, sex }: { fate: ReturnType<typeof fateMap>; sex?: 'female' | 'male' | null }) {
  return (
    <Narration serif className="rs-fate rs-fate--partner">
      <h3 className="rs-fate__head">{F.paid.partner.head}</h3>
      <p className="rs-fate__sub">{F.paid.partner.sub}</p>
      <PartnerCard partner={fate.partner} kind={fate.partnerKind} locked={false} visible={3} sex={sex} when={meetWindows(fate.months ?? [])} />
    </Narration>
  );
}

export function FateCard({ payload, room, part, sex }: { payload: RoomPayload; room: ChapterRoom; part: FateCardPart; sex?: 'female' | 'male' | null }) {
  const fate = useFate(payload);
  const cal = useMemo(() => monthCalendar(payload.months), [payload]);
  const heat = useMemo(() => monthHeat(payload.months, fate.favorable), [payload, fate.favorable]);
  const band = useMemo(() => loveYears(payload.years), [payload]);
  const pairs = useMemo(() => (payload.partner ? elementPairs(payload.self, payload.partner.chart) : []), [payload]);
  const together = useMemo(() => (payload.partner ? togetherMonths(payload.self, payload.partner.chart, payload.today) : []), [payload]);
  const thisYear = Number(payload.today.slice(0, 4));
  if (!FATE_CARDS[room][part]) return null;
  let card: React.ReactNode = null;
  if (part === 'years' && fate.years.length > 0) card = <YearsCard fate={fate} thisYear={thisYear} />;
  if (part === 'flow' && fate.flow) card = <FlowCard flow={fate.flow} />;
  if (part === 'partner') card = <PartnerBlock fate={fate} sex={sex} />;
  if (part === 'calendar' && cal.length > 0) card = <CalendarBlock cal={cal} />;
  if (part === 'lantern' && fate.flow) card = <LanternBlock flow={fate.flow} />;
  if (part === 'heat' && heat.length > 0) card = <HeatBlock heat={heat} />;
  if (part === 'band' && band.length > 0) card = <BandBlock years={band} />;
  if (part === 'elements' && pairs.length > 0) card = <ElementsBlock pairs={pairs} />;
  if (part === 'together' && together.length > 0) card = <TogetherBlock months={together} />;
  if (part === 'pairType' && payload.partner) card = <PairTypeBlock payload={payload} />;
  if (part === 'pairLines' && payload.partner) card = <PairLinesBlock payload={payload} />;
  if (part === 'pairYears' && payload.partner) card = <PairYearsBlock payload={payload} />;
  if (part === 'country' && (room !== 'match' || payload.partner)) card = <CountryBlock payload={payload} room={room} />;
  return card ? (
    <div className="rm-fate-inline" data-fate-card={part}>
      <CardSave name={part}>{card}</CardSave>
    </div>
  ) : null;
}

export function FateCards({ payload, room, sex }: { payload: RoomPayload; room: ChapterRoom; sex?: 'female' | 'male' | null }) {
  const fate = useFate(payload);
  const thisYear = Number(payload.today.slice(0, 4));
  const want = FATE_CARDS[room];
  const showYears = want.years && fate.years.length > 0;
  const showFlow = want.flow && fate.flow !== null;
  if (!showYears && !showFlow && !want.partner) return null;
  return (
    <section className="rm-section grid gap-4" aria-labelledby="fate-eyebrow">
      <div className="grid gap-1">
        <h2 id="fate-eyebrow" className="rm-section__title">
          {F.paid.eyebrow}
        </h2>
        <p className="rm-note m-0">{F.paid.intro}</p>
      </div>
      {showYears ? <YearsCard fate={fate} thisYear={thisYear} /> : null}
      {showFlow && fate.flow ? <FlowCard flow={fate.flow} /> : null}
      {want.partner ? <PartnerBlock fate={fate} sex={sex} /> : null}
    </section>
  );
}
