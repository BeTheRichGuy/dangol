'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { BUNDLE_PAGE } from '@/content/bundle';
import { REUNION } from '@/content/reunion';
import { ROOMS_COPY } from '@/content/rooms';
import { UI } from '@/content/ui';
import { computeChart, type BirthInput } from '@/lib/saju';
import { track } from '@/lib/analytics/track';
import { chartBlock, crossBlock } from '@/lib/rooms/payload';
import { togetherMonths } from '@/lib/reading/fate-map';
import { kitPick } from '@/lib/reunion/cards';
import { parseIntake, cleanConcern, CONCERN_MAX, REASONS_MAX, type ReasonId, type ReunionIntake } from '@/lib/reunion/intake';
import { pickReunion, type ReunionPick } from '@/lib/reunion/pick';
import { REUNION_GUIDE_NAME } from '@/lib/reunion/product';
import { REUNION_ART, reunionArtSrc } from '@/lib/reunion/art';
import type { QuestionCopy, ResultCard } from '@/lib/reunion/types';
import type { Person } from '@/lib/account/types';
import { useMaybeAccount } from '../account/account-provider';
import { pickPersonFor, pickReceiptFor, subscribeBundlePending } from '../bundle/bundle-store';
import type { PlaceChoice } from '../flow/answers';
import { BirthDateField, useBirthDate } from '../flow/birth-date-field';
import { CitySearch } from '../flow/city-search';
import { checkTime, maskDate, maskTime } from '../flow/reading-form';
import { ArrowRightIcon, ChevronLeftIcon } from '../icons';
import { useLocale } from '../locale-provider';
import { RevealText } from '../mystic';
import { bubbleDelay } from '../result/balloons';
import { StickyContinue } from '../result/sticky-continue';
import { splitNote } from './cards/plan';
import { ReunionPreview } from './reunion-preview';
import { markContinue } from '../rooms/continue';
import { PriceDeal } from '../rooms/price-deal';
import { useRoomPrice } from '../rooms/use-room-price';
import { Bubble, Panel, type PanelAspect } from '../webtoon';
import { canPickReason, toggleReason } from './reason-pick';
import { ASK_ART, LABEL_ART, PITCH_ART, RESULT_ART, RITUAL_ART } from './result-art';
import { saveReunion, type ReunionPerson } from './reunion-store';
import { SavedPeoplePick } from './saved-people';
import '../rooms/rooms.css';
import './reunion.css';

const FALLBACK_PLACE: PlaceChoice = { label: 'Seoul, South Korea', name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' };

type Step = 'hello' | 'me' | 'them' | 'ask' | 'ritual' | 'result';

const QUESTION_TOTAL = 7;
const CONCERN_AT = 6;
type SingleKey = 'since' | 'length' | 'who' | 'contact' | 'want';

const KEY_AT: readonly (SingleKey | 'reasons')[] = ['since', 'length', 'who', 'reasons', 'contact', 'want'];
const REASONS_AT = 3;

const RITUAL_MS = 2400;

function Shell({ children, extra = '' }: { children: React.ReactNode; extra?: string }) {
  return (
    <div className="rf-screen rm-night">
      <main id="main" className={`rf-main ru-main ${extra}`}>
        {children}
      </main>
    </div>
  );
}

function Says({ lines, who, from = 0 }: { lines: readonly string[]; who: string; from?: number }) {
  return (
    <>
      {lines.map((text, i) => (
        <Bubble key={`${i}:${text}`} who={who} side="left" tail="none" delayMs={bubbleDelay(from + i)}>
          <p className="rm-lines">
            <RevealText text={text} delayMs={bubbleDelay(from + i)} />
          </p>
        </Bubble>
      ))}
    </>
  );
}

function Top({ onBack, progress }: { onBack: () => void; progress?: string }) {
  return (
    <div className="rf-top ru-top">
      <button type="button" className="rf-back" onClick={onBack} aria-label={REUNION.ui.back}>
        <ChevronLeftIcon size={22} />
      </button>
      {progress ? (
        <p className="ru-top__step" role="status">
          {progress}
        </p>
      ) : null}
    </div>
  );
}

function PersonFields({
  uid,
  labels,
  birth,
  time,
  setTime,
  timeUnknown,
  setTimeUnknown,
  place,
  setPlace,
  tried,
  nickname,
}: {
  uid: string;
  labels: { date: string; time: string; city: string };
  birth: ReturnType<typeof useBirthDate>;
  time: string;
  setTime: (v: string) => void;
  timeUnknown: boolean;
  setTimeUnknown: (v: boolean) => void;
  place: PlaceChoice | null;
  setPlace: (p: PlaceChoice | null) => void;
  tried: boolean;
  nickname?: { value: string; set: (v: string) => void; label: string; placeholder: string };
}) {
  const f = UI.reading.form;
  const timeValue = timeUnknown ? null : checkTime(time);
  const timeError = !timeUnknown && timeValue === null && (tried || time.length >= 5) ? f.errors.time : null;
  return (
    <>
      <BirthDateField id={`${uid}-date`} label={labels.date} birth={birth} tried={tried} />
      <div className="rf-field">
        <div className="rf-label-row">
          <label htmlFor={`${uid}-time`} className="rf-label">
            {labels.time}
          </label>
          <label className="rf-check">
            <input
              type="checkbox"
              checked={timeUnknown}
              onChange={(e) => {
                setTimeUnknown(e.target.checked);
                if (e.target.checked) setTime('');
              }}
            />
            <span>{f.timeUnknown}</span>
          </label>
        </div>
        <input
          id={`${uid}-time`}
          className="rf-input"
          type="text"
          inputMode="numeric"
          placeholder={f.timePlaceholder}
          value={time}
          disabled={timeUnknown}
          aria-invalid={timeError ? true : undefined}
          onChange={(e) => setTime(maskTime(e.target.value))}
        />
        {timeError ? <p className="rf-error">{timeError}</p> : null}
      </div>
      {timeUnknown ? null : (
        <div className="rf-field rf-city">
          <CitySearch initial={place} onSelect={setPlace} onClear={() => setPlace(null)} label={labels.city} />
          {!place && tried ? <p className="rf-error">{f.errors.city}</p> : null}
        </div>
      )}
      {nickname ? (
        <div className="rf-field">
          <label htmlFor={`${uid}-name`} className="rf-label">
            {nickname.label}
          </label>
          <input
            id={`${uid}-name`}
            className="rf-input"
            type="text"
            autoComplete="off"
            maxLength={24}
            placeholder={nickname.placeholder}
            value={nickname.value}
            onChange={(e) => nickname.set(e.target.value)}
          />
        </div>
      ) : null}
    </>
  );
}

const aspectOf = (name: string): PanelAspect => REUNION_ART[name].aspect;

function CardView({ art, card, who }: { art: string; card: ResultCard; who: string }) {
  return (
    <article className="ru-card ru-result">
      <h3 className="ru-card__name">{card.title}</h3>
      <Panel image={reunionArtSrc(art)} alt="" aspect={aspectOf(art)}>
        <Bubble who={who} side="left" tail="none" delayMs={bubbleDelay(0)}>
          <p className="rm-lines">
            <RevealText text={card.body} delayMs={bubbleDelay(0)} />
          </p>
        </Bubble>
      </Panel>
    </article>
  );
}

function PitchTicket({ label, note, onClick }: { label: string; note: string; onClick: () => void }) {
  const { price, was, off } = useRoomPrice();

  const paidByPick = useSyncExternalStore(subscribeBundlePending, () => pickReceiptFor(window.sessionStorage, 'reunion') !== null, () => false);
  return (
    <Link href="/room/reunion" className="dg-btn rs-cta rs-cta--deal ru-pitch__ticket" onClick={onClick}>
      {was !== null && !paidByPick ? <span className="rs-cta__tag">{ROOMS_COPY.first.tag}</span> : null}
      <span className="rs-cta__main">{label}</span>
      <span className="rs-cta__price">{paidByPick ? BUNDLE_PAGE.pick.read.reunionPaid : <PriceDeal now={price} was={was} off={off} />}</span>
      <span className="rs-cta__note">{note}</span>
      <span className="rs-cta__go" aria-hidden="true">
        <ArrowRightIcon size={22} />
      </span>
    </Link>
  );
}

function ReunionSticky({ label, region, before }: { label: string; region: string; before: () => void }) {
  const paidByPick = useSyncExternalStore(subscribeBundlePending, () => pickReceiptFor(window.sessionStorage, 'reunion') !== null, () => false);
  return (
    <StickyContinue
      startId="ru-sticky-start"
      room="reunion"
      href="/room/reunion"
      label={label}
      region={region}
      before={before}
      paidNote={paidByPick ? BUNDLE_PAGE.pick.read.reunionPaid : undefined}
    />
  );
}

export function ReunionFlow() {
  const locale = useLocale();
  const R = REUNION;
  const guide = REUNION_GUIDE_NAME[locale].name;
  const say = (t: string) => t.replace(/{guide}/g, guide);
  const uidMe = useId();
  const uidThem = useId();
  const f = UI.reading.form;

  const [step, setStep] = useState<Step>('hello');
  const [q, setQ] = useState(0);
  const [tried, setTried] = useState(false);

  const meBirth = useBirthDate(null, maskDate);
  const [meTime, setMeTime] = useState('');
  const [meUnknown, setMeUnknown] = useState(false);
  const [mePlace, setMePlace] = useState<PlaceChoice | null>(null);
  const themBirth = useBirthDate(null, maskDate);
  const [themTime, setThemTime] = useState('');
  const [themUnknown, setThemUnknown] = useState(false);
  const [themPlace, setThemPlace] = useState<PlaceChoice | null>(null);
  const [nick, setNick] = useState('');

  const account = useMaybeAccount();
  const saved: readonly Person[] = account?.user && account.loaded ? account.people : [];
  const [meId, setMeId] = useState<string | null>(null);
  const [themId, setThemId] = useState<string | null>(null);
  const [meKey, setMeKey] = useState(0);
  const [themKey, setThemKey] = useState(0);

  const [meSex, setMeSex] = useState<'female' | 'male' | null>(null);
  const pickPrefilled = useRef(false);

  const [picks, setPicks] = useState<Partial<Record<SingleKey, string>>>({});
  const [reasons, setReasons] = useState<ReasonId[]>([]);
  const [concern, setConcern] = useState('');

  const [ritualAt, setRitualAt] = useState(0);
  const [copied, setCopied] = useState(false);
  const tracked = useRef(new Set<number>());

  useEffect(() => track('reunion_view', { locale }), [locale]);

  const meTimeValue = meUnknown ? null : checkTime(meTime);
  const themTimeValue = themUnknown ? null : checkTime(themTime);
  const meReady = meBirth.check.ok && (meUnknown || (meTimeValue !== null && mePlace !== null));
  const themReady = themBirth.check.ok && (themUnknown || (themTimeValue !== null && themPlace !== null));

  const meIso = meBirth.check.ok ? meBirth.check.iso : null;
  const themIso = themBirth.check.ok ? themBirth.check.iso : null;
  const people = useMemo(() => {
    if (!meIso || !themIso) return null;
    const me: ReunionPerson = { date: meIso, time: meUnknown ? null : meTimeValue, place: mePlace ?? FALLBACK_PLACE, ...(meSex ? { sex: meSex } : {}) };
    const them: ReunionPerson = { date: themIso, time: themUnknown ? null : themTimeValue, place: themPlace ?? FALLBACK_PLACE };
    return { me, them };
  }, [meIso, themIso, meUnknown, themUnknown, meTimeValue, themTimeValue, mePlace, themPlace, meSex]);

  const intake: ReunionIntake | null = useMemo(() => parseIntake({ ...picks, reasons, concern }), [picks, reasons, concern]);

  function fillMe(p: Person | null, keepSex = false) {
    setMeSex(keepSex && p?.sex ? p.sex : null);
    setMeId(p?.id ?? null);
    meBirth.setIso(p?.date ?? null);
    setMeTime(p?.time ?? '');
    setMeUnknown(p ? p.time === null : false);
    setMePlace(p ? p.place : null);
    setMeKey((k) => k + 1);

    if (p && p.id === themId) fillThem(null);
  }

  useEffect(() => {
    if (pickPrefilled.current || saved.length === 0) return;
    const id = pickPersonFor(window.sessionStorage, 'reunion');
    const person = id ? saved.find((x) => x.id === id) : undefined;
    if (!person) return;
    pickPrefilled.current = true;
    queueMicrotask(() => fillMe(person, true));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  function fillThem(p: Person | null) {
    setThemId(p?.id ?? null);
    themBirth.setIso(p?.date ?? null);
    setThemTime(p?.time ?? '');
    setThemUnknown(p ? p.time === null : false);
    setThemPlace(p ? p.place : null);
    setNick(p ? p.name.slice(0, 24) : '');
    setThemKey((k) => k + 1);
  }

  function go(next: Step, nextQ = q) {
    setStep(next);
    setQ(nextQ);
    window.scrollTo(0, 0);
  }

  function leaveQuestion(n: number) {
    if (!tracked.current.has(n)) {
      tracked.current.add(n);
      track('reunion_step', { step: n + 1 });
    }
  }

  function submitMe(e: React.FormEvent) {
    e.preventDefault();
    if (!meReady) return setTried(true);
    setTried(false);
    go('them');
  }

  function submitThem(e: React.FormEvent) {
    e.preventDefault();
    if (!themReady) return setTried(true);
    setTried(false);
    go('ask', 0);
  }

  function back() {
    if (step === 'ask') return q > 0 ? go('ask', q - 1) : go('them');
    if (step === 'them') return go('me');
    if (step === 'me') return go('hello');
  }

  function nextQuestion() {
    leaveQuestion(q);
    go('ask', q + 1);
  }

  function finishConcern(text: string) {
    setConcern(cleanConcern(text));
    leaveQuestion(CONCERN_AT);
    setRitualAt(0);

    go(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'result' : 'ritual');
  }

  useEffect(() => {
    if (step !== 'ritual') return;
    track('reunion_ritual');
    const timers = [1, 2].map((i) => window.setTimeout(() => setRitualAt(i), i * RITUAL_MS));
    timers.push(window.setTimeout(() => go('result'), 3 * RITUAL_MS));
    return () => timers.forEach((t) => window.clearTimeout(t));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step === 'result') track('reunion_result');
  }, [step]);

  const pick: ReunionPick | null = useMemo(() => {
    if (step !== 'result' || !people || !intake) return null;
    try {
      const toInput = (p: ReunionPerson): BirthInput => ({ date: p.date, time: p.time, place: p.place, sex: null });
      const cross = crossBlock(computeChart(toInput(people.me)), computeChart(toInput(people.them)));
      return pickReunion(cross, { contact: intake.contact, want: intake.want });
    } catch {
      return null;
    }
  }, [step, people, intake]);

  const preview = useMemo(() => {
    if (step !== 'result' || !people || !intake) return null;
    try {
      const toInput = (p: ReunionPerson): BirthInput => ({ date: p.date, time: p.time, place: p.place, sex: null });
      const me = chartBlock(computeChart(toInput(people.me)));
      const them = chartBlock(computeChart(toInput(people.them)));
      const months = togetherMonths(me, them, new Date().toISOString().slice(0, 10));
      const K = REUNION.cards.kit;
      const kit = kitPick({ self: me, partner: { chart: them, kind: 'lover' } } as never, intake, {
        plain: K.tones.plain.lines.length,
        apology: K.tones.apology.lines.length,
        news: K.tones.news.lines.length,
        dontSend: K.dontSend.length,
      });
      const firstLine = kit.mode === 'kit' ? splitNote(K.tones.plain.lines[kit.plain] ?? '').quote || null : null;
      return { months, firstLine };
    } catch {
      return null;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, people, intake, locale]);

  function saveForPaid() {
    if (!people || !intake) return;
    track('reunion_cta');
    saveReunion({ me: people.me, them: people.them, nickname: nick.trim().slice(0, 24), intake });
  }

  async function share(name: string) {
    const text = R.result.shareText.replace('{name}', name);
    try {
      if (typeof navigator.share === 'function') await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      }
    } catch {

    }
  }

  if (step === 'hello') {
    return (
      <Shell>
        <header className="ru-hook">
          <h1 className="ru-hook__title">{R.hook.title}</h1>
          <p className="ru-hook__sub">{R.hook.sub}</p>
        </header>
        <section className="ru-card">
          <Panel image={reunionArtSrc('free-hello')} alt="" aspect="portrait" eager bloom>
            <Says lines={R.hello.lines.map(say)} who={guide} />
          </Panel>
        </section>
        <div className="ru-cta">
          <button type="button" className="rf-next" aria-disabled="false" onClick={() => go('me')}>
            {R.hello.cta}
          </button>
        </div>
      </Shell>
    );
  }

  if (step === 'me') {
    return (
      <Shell>
        <Top onBack={back} />
        <form className="rf-form ru-form" onSubmit={submitMe} noValidate>
          <section className="ru-card">
            <Panel image={reunionArtSrc(ASK_ART[0])} alt="" aspect="square" eager>
              <Says lines={[R.birth.meAsk]} who={guide} />
            </Panel>
          </section>
          <SavedPeoplePick
            hint={R.birth.pickSaved}

            people={[...saved].sort((a, b) => Number(b.relation === 'self') - Number(a.relation === 'self'))}
            activeId={meId}
            onPick={fillMe}
          />
          <PersonFields
            key={`me-${meKey}`}
            uid={uidMe}
            labels={{ date: f.date, time: f.time, city: f.city }}
            birth={meBirth}
            time={meTime}
            setTime={setMeTime}
            timeUnknown={meUnknown}
            setTimeUnknown={setMeUnknown}
            place={mePlace}
            setPlace={setMePlace}
            tried={tried}
          />
          <div className="rf-submit">
            <button type="submit" className="rf-next" aria-disabled={!meReady}>
              {R.birth.next}
            </button>
          </div>
        </form>
      </Shell>
    );
  }

  if (step === 'them') {
    return (
      <Shell>
        <Top onBack={back} />
        <form className="rf-form ru-form" onSubmit={submitThem} noValidate>
          <section className="ru-card">
            <Panel image={reunionArtSrc(ASK_ART[1])} alt="" aspect="portrait" eager>
              <Says lines={[R.birth.themAsk, R.birth.themTimeHint]} who={guide} />
            </Panel>
          </section>
          <SavedPeoplePick
            hint={R.birth.pickSaved}

            people={saved.filter((p) => p.id !== meId)}
            activeId={themId}
            onPick={fillThem}
          />
          <PersonFields
            key={`them-${themKey}`}
            uid={uidThem}
            labels={{ date: ROOMS_COPY.partnerForm.date, time: ROOMS_COPY.partnerForm.time, city: ROOMS_COPY.partnerForm.city }}
            birth={themBirth}
            time={themTime}
            setTime={setThemTime}
            timeUnknown={themUnknown}
            setTimeUnknown={setThemUnknown}
            place={themPlace}
            setPlace={setThemPlace}
            tried={tried}
            nickname={{ value: nick, set: setNick, label: R.birth.nicknameLabel, placeholder: R.birth.nicknamePlaceholder }}
          />
          <div className="rf-submit">
            <button type="submit" className="rf-next" aria-disabled={!themReady}>
              {R.birth.next}
            </button>
          </div>
        </form>
      </Shell>
    );
  }

  if (step === 'ask') {
    const I = R.intake;
    const progress = R.ui.stepOf(q + 1, QUESTION_TOTAL);
    const art = ASK_ART[q % 2];

    if (q === CONCERN_AT) {
      const clean = cleanConcern(concern);
      return (
        <Shell>
          <Top onBack={back} progress={progress} />
          <form
            className="rf-form ru-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (clean) finishConcern(clean);
            }}
            noValidate
          >
            <section className="ru-card" key={q}>
              <Panel image={reunionArtSrc(art)} alt="" aspect={aspectOf(art)} eager>
                <Says lines={[I.concern.ask]} who={guide} />
              </Panel>
            </section>
            <div className="rf-field">
              <label htmlFor={`${uidThem}-concern`} className="rf-label">
                {I.concern.optional}
              </label>
              <textarea
                id={`${uidThem}-concern`}
                className="rf-input ru-concern__input"
                rows={3}
                maxLength={CONCERN_MAX}
                placeholder={I.concern.placeholder}
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                aria-describedby={`${uidThem}-concern-count`}
              />
              <p id={`${uidThem}-concern-count`} className="rf-hint">
                {I.concern.counter} ({concern.length}/{CONCERN_MAX})
              </p>
            </div>
            <div className="rf-submit ru-actions">
              <button type="submit" className="rf-next" aria-disabled={!clean}>
                {I.concern.submit}
              </button>
              <button type="button" className="rf-skip ru-actions__skip" onClick={() => finishConcern('')}>
                {I.concern.skip}
              </button>
            </div>
          </form>
        </Shell>
      );
    }

    const key = KEY_AT[q];
    const copy: QuestionCopy<string> = [I.since, I.length, I.who, I.reasons, I.contact, I.want][q];
    const multi = q === REASONS_AT;
    const selected: readonly string[] = multi ? reasons : picks[key as SingleKey] ? [picks[key as SingleKey] as string] : [];
    const lastId = selected[selected.length - 1];
    const reaction = copy.options.find((o) => o.id === lastId)?.reaction;
    const ready = selected.length > 0;

    function choose(id: string) {
      if (multi) setReasons((cur) => toggleReason(cur, id as ReasonId));
      else setPicks((cur) => ({ ...cur, [key]: id }));
    }

    return (
      <Shell>
        <Top onBack={back} progress={progress} />
        <div className="ru-form">
          <section className="ru-card" key={q}>
            <Panel image={reunionArtSrc(art)} alt="" aspect={aspectOf(art)} eager>
              <Says lines={[copy.ask]} who={guide} />
            </Panel>
          </section>
          <div className="rf-choices ru-opts" role="group" aria-label={copy.ask}>
            {copy.options.map((o) => {
              const on = selected.includes(o.id);
              const blocked = multi && !canPickReason(reasons, o.id as ReasonId);
              return (
                <button
                  key={o.id}
                  type="button"
                  className="rf-choice"
                  aria-pressed={on}
                  aria-disabled={blocked || undefined}
                  onClick={() => (blocked ? undefined : choose(o.id))}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          {multi ? (
            <p className="rf-hint ru-limit">
              {I.reasons.limit} ({reasons.length}/{REASONS_MAX})
            </p>
          ) : null}
          <div className="ru-reaction" aria-live="polite">
            {reaction ? <Says key={lastId} lines={[reaction]} who={guide} /> : null}
          </div>
          <div className="rf-submit">
            <button type="button" className="rf-next" aria-disabled={!ready} onClick={() => (ready ? nextQuestion() : undefined)}>
              {multi ? I.reasons.done : R.birth.next}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (step === 'ritual') {
    return (
      <Shell extra="ru-ritual">
        <section className="ru-card" key={ritualAt}>
          <Panel image={reunionArtSrc(RITUAL_ART[ritualAt] ?? RITUAL_ART[0])} alt="" aspect="wide" eager />
          <p className="ru-ritual__line" aria-live="polite">
            {R.ritual[ritualAt] ?? R.ritual[0]}
          </p>
        </section>
        <div className="ru-cta">
          <button type="button" className="rf-skip" onClick={() => go('result')}>
            {R.intake.concern.skip}
          </button>
        </div>
      </Shell>
    );
  }

  if (!pick || !intake) {
    return (
      <Shell>
        <Top onBack={() => go('me')} />
        <p className="rf-error">{f.errors.time}</p>
        <div className="ru-cta">
          <button type="button" className="rf-next" aria-disabled="false" onClick={() => go('me')}>
            {R.ui.editAnswers}
          </button>
        </div>
      </Shell>
    );
  }

  const res = R.result;
  const S = res.sections;
  const label = res.labels[pick.frayed];
  const flowCard = res.flow[pick.flow];
  const concernText = intake.concern;

  return (
    <Shell>
      <section
        className="ru-card ru-label"
        style={{ backgroundImage: `linear-gradient(180deg, rgba(20, 16, 24, 0.55), rgba(20, 16, 24, 0.88)), url(${reunionArtSrc(LABEL_ART)})` }}
      >
        <p className="ru-label__eyebrow">{res.labelEyebrow}</p>
        <h1 className="ru-label__name">{label.name}</h1>
        <p className="ru-label__tagline">{label.tagline}</p>
        <button type="button" className="ru-label__share" onClick={() => void share(label.name)}>
          {copied ? res.shareCopied : res.share}
        </button>
      </section>

      {}
      <div id="ru-sticky-start" aria-hidden="true" />

      <h2 className="ru-heading">{res.heading}</h2>

      <h2 className="ru-card__title">{S.first}</h2>
      <CardView art={RESULT_ART.flow} card={flowCard} who={guide} />

      <h2 className="ru-card__title">{S.frayed}</h2>
      <CardView art={RESULT_ART.frayed} card={res.frayed[pick.frayed]} who={guide} />

      <h2 className="ru-card__title">{S.filled}</h2>
      <CardView art={RESULT_ART.filled} card={res.filled[pick.filled]} who={guide} />

      <h2 className="ru-card__title">{S.yours}</h2>
      <CardView art={RESULT_ART.contact} card={res.contact[pick.contact]} who={guide} />
      <CardView art={RESULT_ART.want} card={res.want[pick.want]} who={guide} />

      {concernText ? (
        <section className="ru-card ru-concern">
          <h2 className="ru-card__title">{res.concernCard.title}</h2>
          <blockquote className="ru-concern__quote">{concernText}</blockquote>
          <Says lines={[res.concernCard.echo]} who={guide} />
        </section>
      ) : null}

      <ReunionPreview months={preview?.months ?? null} firstLine={preview?.firstLine ?? null} />

      <section className="ru-card" data-sticky-hide>
        <Panel image={reunionArtSrc(PITCH_ART)} alt="" aspect="wide">
          <Says lines={R.pitch.lines.map(say)} who={guide} />
        </Panel>
        <div className="ru-pitch">
          {}
          <PitchTicket
            label={R.pitch.button}
            note={R.pitch.ticketNote}
            onClick={() => {
              saveForPaid();
              markContinue('reunion', 'free_result', Date.now(), true);
            }}
          />
          <p className="ru-pitch__note">{R.pitch.note}</p>
        </div>
      </section>

      <div className="ru-again" data-sticky-hide>
        <button type="button" className="rf-skip" onClick={() => go('me')}>
          {R.ui.editAnswers}
        </button>
        <button
          type="button"
          className="rf-skip"
          onClick={() => {
            setPicks({});
            setReasons([]);
            setConcern('');
            tracked.current.clear();
            go('hello', 0);
          }}
        >
          {R.ui.startOver}
        </button>
      </div>

      <aside className="ru-safety" data-sticky-hide>
        <h2 className="ru-safety__title">{R.safety.title}</h2>
        <p className="ru-safety__body">{R.safety.body}</p>
      </aside>

      <ReunionSticky label={R.pitch.button} region={R.pitch.region} before={saveForPaid} />
    </Shell>
  );
}
