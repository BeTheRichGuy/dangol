'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { parseReunion, readReunionRaw, saveReunion, type ReunionPerson } from '@/components/reunion/reunion-store';
import { ReunionMaterials } from '@/components/reunion/reunion-preview';
import { ACCOUNT } from '@/content/account';
import { CONTINUE } from '@/content/continue';
import { activeLocale, dateLocale } from '@/content/locale';
import { REUNION } from '@/content/reunion';
import { ROOMS_COPY, type RoomLine } from '@/content/rooms';
import { birthInputOf, snapshotOf } from '@/lib/account/person';
import type { Person, PersonSnapshot, ReadingDraft } from '@/lib/account/types';
import { guestSnapshot } from '@/lib/account/guest-claim';
import { isContinueLocale } from '@/lib/rooms/continue-locales';
import { encodeIntakeTag, type ReunionIntake } from '@/lib/reunion/intake';
import { REUNION_PRICE_TEXT } from '@/lib/reunion/product';
import { buildRoomPayload, type RoomPayload } from '@/lib/rooms/payload';
import { loadXmasInput, loadXmasQuiz, xmasFromQuiz, xmasReturnPath } from '../xmas/xmas-store';
import { parseQuizAnswers } from '@/lib/xmas/quiz';
import { isPairKind, ROOMS, usesChapters, type PairKind, type ProductKey } from '@/lib/rooms/themes';
import { computeChart, type BirthInput } from '@/lib/saju';
import { useAccount } from '../account/account-provider';
import { LoginSheet } from '../account/login-sheet';
import { PersonForm } from '../account/person-form';
import { RoomPeople } from '../account/room-people';
import { ConcernBox } from './concern-box';
import { EmailModal } from '../email-modal';
import { updateAnswers, useAnswers } from '../flow/answers';
import { birthInputFrom } from '../flow/compute';
import { ReadingForm } from '../flow/reading-form';
import { LanguagePicker } from '../home-hero';
import { ChevronLeftIcon } from '../icons';
import { useLocale } from '../locale-provider';
import { SealStamp } from '../seal';
import { SiteFooter } from '../site-footer';
import { Narration } from '../webtoon';
import '../result/result.css';
import '../webtoon/webtoon.css';
import { usePartner, type Partner } from './partner';
import { PartnerForm } from './partner-form';
import { fillName, splitReading } from './reading-blocks';
import { partId, ReadingText } from './reading-text';
import { dockStep } from './dock';
import { loadSample, SAMPLE_ROOMS } from './samples';
import { RoomArt } from './room-art';
import { roomCopy } from './room-copy';
import { RoomRailList } from './room-cards';
import { BundleLine } from '../bundle/bundle-line';
import { BUNDLES_ON } from '@/lib/payments/bundle';
import { RoomStory } from './room-story-view';
import { pickReceiptFor, subscribeBundlePending } from '../bundle/bundle-store';
import { CheckoutSheet } from './checkout-sheet';
import { ContinueConfirm, ContinueFailure } from './continue-confirm';
import { fromXmasUrl, readContinue, takePayNowEdition, useEntry } from './continue';
import { payWithPaddle } from './paddle-checkout';
import './rooms.css';
import { clearReceipt, loadReceipt, saveReceipt, savedReadingText, useRoomReading } from './use-room-reading';
import { useLocalSample } from './local-sample';
import { savePending } from './pending';
import { dodoCancelled } from './dodo-checkout';
import { tossFailure } from './toss-checkout';
import { useOffers } from './use-offers';
import { track } from '@/lib/analytics/track';
import { firstPercentOff } from '@/lib/payments/offers';
import { dealText } from './price-deal';
import { payForLocale, type ClientPay } from '@/lib/payments/pay-locale';

type Screen = 'room' | 'self' | 'partner' | 'add';

function formatBirth(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  try {
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(dateLocale(), { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  } catch {
    return iso;
  }
}

function partnerInput(p: Partner) {
  return { date: p.date, time: p.time, place: { name: p.place.name, country: p.place.country, lat: p.place.lat, lng: p.place.lng, tz: p.place.tz }, sex: p.sex };
}

interface Subject {
  input: BirthInput;
  question: string;
}
interface Pair {
  input: BirthInput;
  kind: PairKind;
}

function reunionSummary(i: ReunionIntake): string {
  const label = <Id extends string>(q: { options: readonly { id: Id; label: string }[] }, id: Id) => q.options.find((o) => o.id === id)?.label ?? '';
  const Q = REUNION.intake;
  return REUNION.product.summary({ since: label(Q.since, i.since), who: label(Q.who, i.who), want: label(Q.want, i.want) });
}

function reunionInput(p: ReunionPerson, sex: 'female' | 'male' | null | undefined): BirthInput {
  const { name, country, lat, lng, tz } = p.place;
  return { date: p.date, time: p.time, place: { name, country, lat, lng, tz }, sex: sex ?? null };
}

function reunionSnapshot(p: ReunionPerson, sex: 'female' | 'male' | null | undefined, name: string): PersonSnapshot {
  return { id: null, name: name.slice(0, 24), relation: 'other', date: p.date, time: p.time, place: p.place, sex: sex ?? null };
}

const noopSubscribe = () => () => {};

const MOVEMENT_RANGES = [
  [0, 2],
  [2, 6],
  [6, 10],
  [10, 12],
] as const;

function makePayload(room: ProductKey, subject: Subject | null, pair: Pair | null, nowIso: string, intake: ReunionIntake | null = null, edition?: 'xmas'): RoomPayload | null {
  if (!subject) return null;
  const spec = ROOMS[room];
  if (spec.needsLuck && !subject.input.sex) return null;
  if (spec.needsPartner && !pair) return null;
  if (room === 'reunion' && !intake) return null;

  const xmas = edition === 'xmas' ? loadXmasInput() : null;
  if (edition === 'xmas' && !xmas) return null;

  const quiz = edition === 'xmas' && xmasFromQuiz() ? parseQuizAnswers(loadXmasQuiz()) : null;
  const xmasPartner = xmas?.partner
    ? { chart: computeChart({ date: xmas.partner.date, time: xmas.partner.time, place: subject.input.place, sex: null }), kind: 'crush' as const }
    : null;
  try {
    return buildRoomPayload({
      room,
      locale: activeLocale(),
      chart: computeChart(subject.input),
      nowIso,
      question: subject.question,
      partner: spec.needsPartner && pair ? { chart: computeChart(pair.input), kind: pair.kind } : xmasPartner,
      ...(room === 'reunion' && intake ? { reunion: intake } : {}),

      ...(edition ? { edition } : {}),
      ...(xmas ? { xmas: xmas.relation } : {}),
      ...(quiz ? { quiz } : {}),
    });
  } catch {
    return null;
  }
}

function defaultIds(people: readonly Person[], pair: boolean): string[] {
  const self = people.find((p) => p.relation === 'self');
  if (self) return [self.id];
  return !pair && people[0] ? [people[0].id] : [];
}

function defaultKind(two: readonly Person[]): PairKind | null {
  if (two.length !== 2) return null;
  const other = two[0].relation === 'self' ? two[1] : two[1].relation === 'self' ? two[0] : null;
  return other && isPairKind(other.relation) ? other.relation : null;
}

function KeeperBubbles({ lines, keeperName }: { lines: readonly RoomLine[]; keeperName: string }) {
  return (
    <div className="rm-greeting">
      {lines.map((line, i) => {
        return (
          <div key={i} className="wt-bubble rm-bubble" data-side="left">
            <span className="sr-only">{keeperName}: </span>
            <p className="m-0">{line.text}</p>
          </div>
        );
      })}
    </div>
  );
}

function LuckChooser({ onChoose }: { onChoose: (sex: 'female' | 'male', choice: 'female' | 'male' | 'yang' | 'yin') => void }) {
  const L = ROOMS_COPY.page.needLuck;
  return (
    <div className="rm-luck" role="group" aria-label={L.line}>
      <p className="m-0">{L.line}</p>
      <p className="rm-subject__meta m-0">{L.why}</p>
      <div className="rm-luck__row">
        <button type="button" className="rf-choice" onClick={() => onChoose('female', 'female')}>
          {L.woman}
        </button>
        <button type="button" className="rf-choice" onClick={() => onChoose('male', 'male')}>
          {L.man}
        </button>
      </div>
      <div className="rm-luck__row">
        <button type="button" className="rf-choice" onClick={() => onChoose('male', 'yang')}>
          {L.yang}
        </button>
        <button type="button" className="rf-choice" onClick={() => onChoose('female', 'yin')}>
          {L.yin}
        </button>
      </div>
      <p className="rm-subject__meta m-0">{L.nbHint}</p>
    </div>
  );
}

export function RoomView({ room }: { room: ProductKey }) {
  const locale = useLocale();

  const entry = useEntry(room);
  const spec = ROOMS[room];
  const isReunion = room === 'reunion';
  const copy = roomCopy(room);

  const home = `/room/${room}`;
  const P = ROOMS_COPY.page;
  const keeper = ROOMS_COPY.keepers[spec.keeper];
  const answers = useAnswers();
  const partner = usePartner();
  const account = useAccount();
  const router = useRouter();

  const accountOn = account.mode !== 'off';
  const signedIn = accountOn && account.ready && account.user !== null;
  const [screen, setScreen] = useState<Screen>('room');
  const [status, setStatus] = useState<boolean | null>(null);

  const [payRaw, setPay] = useState<ClientPay>('off');

  const [payLocales, setPayLocales] = useState<string[] | null>(null);

  const [paying, setPaying] = useState(false);
  const [payFailed, setPayFailed] = useState(false);

  const [checkout, setCheckout] = useState<RoomPayload | null>(null);
  const [reserving, setReserving] = useState(false);
  const [signing, setSigning] = useState(false);

  const [picked, setPicked] = useState<string[] | null>(null);
  const [pairKind, setPairKind] = useState<PairKind | null>(null);
  const [question, setQuestion] = useState('');

  const questionTouched = useRef(false);
  const onQuestion = (v: string) => {
    questionTouched.current = true;
    setQuestion(v);
  };
  useEffect(() => {
    if (!questionTouched.current && answers.question) setQuestion(answers.question);
  }, [answers.question]);

  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const reunionRaw = useSyncExternalStore(noopSubscribe, () => (isReunion ? readReunionRaw(window.sessionStorage) : null), () => null);
  const reunionIn = useMemo(() => (isReunion ? parseReunion(reunionRaw) : null), [isReunion, reunionRaw]);

  const [reunionSex, setReunionSex] = useState<'female' | 'male' | null>(null);
  const meSex = reunionSex ?? reunionIn?.me.sex ?? null;

  const meCalcSex = meSex ?? (isReunion ? 'male' : null);
  const intake = reunionIn?.intake ?? null;
  const [saveNote, setSaveNote] = useState<'saved' | 'failed' | null>(null);
  const { state, start, restore, startSample, forget } = useRoomReading(room);
  const readingRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLElement>(null);

  const pendingSave = useRef<Omit<ReadingDraft, 'body'> | null>(null);

  const guestDraft = useRef<Omit<ReadingDraft, 'body'> | null>(null);

  const sample = useLocalSample() && (SAMPLE_ROOMS as readonly ProductKey[]).includes(room);

  const [payNow, setPayNow] = useState(false);
  const payNowStarted = useRef(false);

  const [edition, setEdition] = useState<'xmas' | undefined>(undefined);

  const leaving = useRef(false);

  const people = account.people;
  const ids = (picked ?? defaultIds(people, spec.needsPartner)).filter((id) => people.some((p) => p.id === id));
  const chosen = ids.map((id) => people.find((p) => p.id === id)).filter((p): p is Person => p !== undefined);
  const kind: PairKind | null = pairKind ?? defaultKind(chosen);
  const first = chosen[0] ?? null;
  const second = chosen[1] ?? null;
  const subject = useMemo<Subject | null>(() => {

    if (isReunion) return reunionIn ? { input: reunionInput(reunionIn.me, meCalcSex), question: reunionIn.intake.concern } : null;

    if (signedIn && edition !== 'xmas') return first ? { input: birthInputOf(first), question: question.trim() } : null;

    const input = birthInputFrom(answers);
    return input ? { input, question: question.trim() || answers.question } : null;
  }, [isReunion, reunionIn, meCalcSex, signedIn, first, question, answers, edition]);
  const pair = useMemo<Pair | null>(() => {
    if (!spec.needsPartner) return null;

    if (isReunion) return reunionIn ? { input: reunionInput(reunionIn.them, reunionIn.them.sex), kind: 'lover' } : null;
    if (signedIn) return second && kind ? { input: birthInputOf(second), kind } : null;
    return partner ? { input: partnerInput(partner), kind: partner.kind } : null;
  }, [spec.needsPartner, isReunion, reunionIn, signedIn, second, kind, partner]);
  const readerName = isReunion ? '' : signedIn && edition !== 'xmas' ? (first?.name ?? '') : answers.name;

  useEffect(() => {
    const c = new AbortController();
    fetch('/api/reading', { cache: 'no-store', signal: c.signal })
      .then((r) => (r.ok ? r.json() : { open: false }))
      .then((v: { open?: unknown; pay?: unknown; payLocales?: unknown }) => {
        setStatus(v.open === true);
        setPay(v.pay === 'test' || v.pay === 'paddle' || v.pay === 'toss' || v.pay === 'dodo' || v.pay === 'skip' ? v.pay : 'off');
        setPayLocales(Array.isArray(v.payLocales) ? v.payLocales.filter((l): l is string => typeof l === 'string') : null);
      })
      .catch(() => {
        if (!c.signal.aborted) setStatus(false);
      });
    return () => c.abort();
  }, []);

  useEffect(() => {
    track('room_view', { room, entry });
    if (dodoCancelled(window.location.search)) {
      track('pay_cancel', { room, provider: 'dodo' });
      router.replace(home);
      return;
    }
    const code = tossFailure(window.location.search);
    if (code === null) return;
    const cancel = code === 'PAY_PROCESS_CANCELED' || code === 'USER_CANCEL';
    track(cancel ? 'pay_cancel' : 'pay_fail', { room, provider: 'toss', code });

    if (!cancel) queueMicrotask(() => setPayFailed(true));
    router.replace(home);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  const restoredFor = useRef<string | null>(null);
  useEffect(() => {
    if (state.phase !== 'idle' || usesChapters(room)) return;
    const p = makePayload(room, subject, pair, new Date().toISOString());
    if (!p) return;
    const tag = JSON.stringify([subject, pair]);
    if (restoredFor.current === tag) return;
    restoredFor.current = tag;
    restore(p);
  }, [room, subject, pair, state.phase, restore]);

  const { saveReading } = account;
  useEffect(() => {
    if (state.phase !== 'done' || !pendingSave.current) return;
    const draft: ReadingDraft = { ...pendingSave.current, body: state.text };
    pendingSave.current = null;
    saveReading(draft).then(
      () => setSaveNote('saved'),
      () => setSaveNote('failed'),
    );
  }, [state, saveReading]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const payFor = payForLocale(payRaw, payLocales, activeLocale());
  const pay: ClientPay = payFor === 'closed' ? 'off' : payFor;
  const payable = payFor !== 'closed';

  const offers = useOffers();

  const pickReceipt = useSyncExternalStore(subscribeBundlePending, () => (isReunion ? pickReceiptFor(window.sessionStorage, 'reunion') : null), () => null);

  const firstPrice = (pay === 'toss' || pay === 'dodo') && offers.first;
  const regularPrice = isReunion ? REUNION_PRICE_TEXT[locale] : ROOMS_COPY.price;
  const priceNow = firstPrice ? ROOMS_COPY.first.price : regularPrice;

  const priceWas = firstPrice ? regularPrice : null;
  const open = sample ? true : status === null ? null : status && payable && !(state.phase === 'error' && state.error === 'notOpen');

  const continueMode = room === 'life' && isContinueLocale(locale) && entry === 'free_result' && open !== false;
  const selfInput = subject?.input ?? null;
  const needLuck = !sample && spec.needsLuck && selfInput !== null && selfInput.sex === null;
  const needPartner = spec.needsPartner && pair === null;
  const busy = state.phase === 'waiting' || state.phase === 'streaming';
  const hasReading = state.phase === 'streaming' || state.phase === 'done';

  const split = splitReading(hasReading ? fillName(state.text, readerName) : '', state.phase === 'streaming');
  const hasBody = split.body.trim().length > 0;

  const hasReceipt = useMemo(() => {
    if (pay === 'off' || state.phase === 'waiting') return false;
    if (pickReceipt) return true;
    const p = makePayload(room, subject, pair, new Date().toISOString(), intake, edition);

    return p !== null && (loadReceipt(room, p) !== null || (usesChapters(room) && savedReadingText(room, p) !== null));
  }, [pay, room, subject, pair, intake, state.phase, pickReceipt, edition]);

  const toStory = () => window.requestAnimationFrame(() => storyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  function handoff(p: RoomPayload, receipt: string | null, draft: Omit<ReadingDraft, 'body'> | null) {
    if (!usesChapters(room)) return;
    savePending(window.sessionStorage, room, { payload: p, receipt, readerName, draft, guestDraft: guestDraft.current, sex: selfInput?.sex ?? null, ...(p.edition ? { edition: p.edition } : {}) });
    router.push(`/room/${room}/read`);
  }

  function saveBeforeRedirect(p: RoomPayload) {
    leaving.current = true;

    if (usesChapters(room)) savePending(window.sessionStorage, room, { payload: p, receipt: null, readerName, draft: pendingSave.current, guestDraft: guestDraft.current, sex: selfInput?.sex ?? null, ...(edition ? { edition } : {}) });
  }

  function reunionPeople(me: ReunionPerson, them: ReunionPerson, nickname: string): PersonSnapshot[] {
    return [reunionSnapshot(me, meSex, P.you), reunionSnapshot(them, them.sex, nickname.trim() || P.pairKinds.other)];
  }

  async function begin() {
    if (sample) {
      if (usesChapters(room)) return router.push(`/room/${room}/read?sample`);
      if (room !== 'reunion') void startSample(() => loadSample(room, activeLocale()));
      return toStory();
    }
    if (isReunion) {

      if (!subject || needPartner) return;
    } else if (edition === 'xmas') {

      if (!selfInput) return backToXmas();
    } else if (signedIn) {
      if (!subject || needPartner) return subjectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      if (!selfInput) return setScreen('self');
      if (needPartner) return setScreen('partner');
    }
    const nowIso = new Date().toISOString();
    const p = makePayload(room, subject, pair, nowIso, intake, edition);
    if (!p) return edition === 'xmas' ? backToXmas() : undefined;
    setSaveNote(null);

    const draft: Omit<ReadingDraft, 'body'> | null = signedIn
      ? {
          kind: room,
          locale: activeLocale(),
          people:
            isReunion && reunionIn
              ? reunionPeople(reunionIn.me, reunionIn.them, reunionIn.nickname)
              : edition === 'xmas' && subject
                ? [guestSnapshot(answers.name, subject.input, 'self')]
                : chosen.slice(0, spec.needsPartner ? 2 : 1).map(snapshotOf),
          question: isReunion && intake ? encodeIntakeTag(intake) : question.trim(),
          concern: null,
          nowIso,
        }
      : null;

    guestDraft.current =
      !signedIn && subject
        ? {
            kind: room,
            locale: activeLocale(),
            people:
              isReunion && reunionIn
                ? reunionPeople(reunionIn.me, reunionIn.them, reunionIn.nickname)
                : [guestSnapshot(answers.name, subject.input, 'self'), ...(spec.needsPartner && partner && pair ? [guestSnapshot(partner.name, pair.input, partner.kind)] : [])],
            question: isReunion && intake ? encodeIntakeTag(intake) : question.trim(),
            concern: null,
            nowIso,
          }
        : null;
    if (usesChapters(room)) {

      const paidMode = pay === 'test' || pay === 'paddle' || pay === 'toss' || pay === 'dodo';
      const receipt = paidMode ? (loadReceipt(room, p) ?? pickReceipt) : null;
      if (paidMode && !receipt && savedReadingText(room, p) === null) {
        pendingSave.current = draft;
        return pay === 'paddle' ? void paddlePay(p) : setCheckout(p);
      }
      return handoff(p, receipt, draft);
    }
    if (!restore(p)) {
      pendingSave.current = draft;
      if (pay === 'skip') {

        void start(p, await account.accessToken());
      } else if (pay !== 'off') {

        const receipt = loadReceipt(room, p);
        if (!receipt) return pay === 'paddle' ? void paddlePay(p) : setCheckout(p);
        void start(p, await account.accessToken(), receipt);
      } else {
        void start(p, await account.accessToken());
      }
    }
    toStory();
  }

  async function rereadLocal() {
    if (pay !== 'skip' || sample) return;
    forget();
    await begin();
  }

  async function paddlePay(p: RoomPayload) {
    setPaying(true);
    setPayFailed(false);
    try {
      const receipt = await payWithPaddle(p, await account.accessToken(), activeLocale());
      if (receipt) await paid(p, receipt);
    } catch {
      setPayFailed(true);
    } finally {
      setPaying(false);
    }
  }

  function backToXmas() {
    router.replace(xmasReturnPath());
  }

  async function paid(p: RoomPayload, receipt: string) {
    leaving.current = true;
    saveReceipt(room, p, receipt);
    setCheckout(null);
    if (usesChapters(room)) return handoff(p, receipt, pendingSave.current);
    void start(p, await account.accessToken(), receipt);
    toStory();
  }

  useLayoutEffect(() => {

    if (room !== 'life' && room !== 'reunion' && room !== 'love') return;
    const mark = readContinue(room);
    const taken = mark?.payNow ? { edition: mark.edition } : null;

    if (room === 'love' && fromXmasUrl(window.location.search) && taken?.edition !== 'xmas') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPayNow(true);
      router.replace(xmasReturnPath());
      return;
    }
    if (!taken) return;

    payNowStarted.current = false;

    if (room === 'love' && taken.edition === 'xmas') setEdition('xmas');
    setPayNow(true);
  }, [room, router]);

  const sheetPay = pay === 'toss' || pay === 'dodo' || pay === 'test';
  useEffect(() => {
    if (!payNow || payNowStarted.current) return;

    if (status === null || !offers.loaded || (isReunion && !mounted) || (accountOn && !account.ready) || (signedIn && !account.loaded && edition !== 'xmas')) return;
    payNowStarted.current = true;

    takePayNowEdition(room);
    const p = open === true && sheetPay ? makePayload(room, subject, pair, new Date().toISOString(), intake) : null;
    if (!p) {

      if (edition === 'xmas') return backToXmas();
      queueMicrotask(() => setPayNow(false));
      return;
    }
    queueMicrotask(() => void begin());

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payNow, status, offers.loaded, accountOn, account.ready, account.loaded, signedIn, open, sheetPay, room, subject, pair, isReunion, mounted, intake, edition]);

  function chooseRule(sex: 'female' | 'male', choice: 'female' | 'male' | 'yang' | 'yin') {

    if (isReunion) {
      if (reunionIn) saveReunion({ ...reunionIn, me: { ...reunionIn.me, sex } });
      setReunionSex(sex);
      return;
    }

    if (signedIn && first) {
      const { name, relation, date, time, place } = first;
      void account.savePerson({ name, relation, date, time, place, sex }, first.id).catch(() => undefined);
      return;
    }
    updateAnswers(
      choice === 'yang' || choice === 'yin'
        ? { sex, sexAnswered: true, sexChoice: 'nonbinary', nbChoice: choice }
        : { sex, sexAnswered: true, sexChoice: choice, nbChoice: null },
    );
  }

  function toggle(id: string) {
    setSaveNote(null);
    if (!spec.needsPartner) return setPicked([id]);
    if (ids.includes(id)) return setPicked(ids.filter((x) => x !== id));
    setPicked(ids.length < 2 ? [...ids, id] : [ids[0], id]);
  }

  if (screen === 'add') {
    return (
      <PersonForm
        initial={null}
        defaultRelation={people.some((p) => p.relation === 'self') ? undefined : 'self'}
        onBack={() => setScreen('room')}
        onSaved={(p) => {
          setPicked(spec.needsPartner ? (ids.length < 2 ? [...ids, p.id] : [ids[0], p.id]) : [p.id]);
          setScreen('room');
        }}
      />
    );
  }
  if (screen === 'self') {
    return <ReadingForm answers={answers} onBack={() => setScreen('room')} onDone={() => setScreen('room')} privacy={P.sendNote} />;
  }
  if (screen === 'partner') {
    return <PartnerForm initial={partner} onBack={() => setScreen('room')} onDone={() => setScreen('room')} />;
  }

  const selfName = answers.name.trim() || P.you;

  const readLabel = paying ? ROOMS_COPY.checkout.paying : pay !== 'off' && !hasReceipt ? P.payAndRead() : P.readNow;

  function dockLabel(): string {
    const T = ACCOUNT.picker;
    const step = dockStep({ signedIn, hasSubject: subject !== null, needPartner, chosen: second ? 2 : first ? 1 : 0 });
    return { signIn: T.dockSignIn, pick: T.dockPick, pickTwo: T.dockPickTwo, pickKind: T.dockPickKind, read: readLabel }[step];
  }

  const contentItem = (c: { title: string; line: string }, i: number) => (
    <li key={c.title}>
      <span className="rm-contents__num" aria-hidden="true">
        {String(i + 1).padStart(2, '0')}
      </span>
      <span className="rm-contents__text">
        {}
        {hasBody ? (
          <a href={`#${partId(i + 1)}`} className="rm-contents__title rm-contents__link">
            {c.title}
          </a>
        ) : (
          <span className="rm-contents__title">{c.title}</span>
        )}
        <span className="rm-contents__line">{c.line}</span>
      </span>
    </li>
  );

  const roomIntro = (
    <>
      <div ref={storyRef} className="scroll-mt-4">
        {}
        <RoomStory room={room} beats={split.beats} writing={state.phase === 'waiting' || (state.phase === 'streaming' && !split.webtoonDone)} />
      </div>

      {}
      {continueMode ? null : (
        <section aria-labelledby="room-contents" className="rm-section" data-sealed={open === false ? '' : undefined}>
          <h2 id="room-contents" className="rm-section__title">
            {P.contentsHeading}
          </h2>
          {open === false ? (

            <Narration className="rm-sealed">
              <SealStamp size={34} className="rm-sealed__stamp" />
              <p className="m-0">{P.sealed}</p>
            </Narration>
          ) : null}
          {isReunion ? (

            MOVEMENT_RANGES.map(([from, to], m) => (
              <div key={from} className="rm-movement">
                <h3 className="rm-movement__name">{REUNION.product.movements[m]}</h3>
                <ol className="rm-contents">{copy.contents.slice(from, to).map((c, k) => contentItem(c, from + k))}</ol>
              </div>
            ))
          ) : (
            <ol className="rm-contents">{copy.contents.map(contentItem)}</ol>
          )}
        </section>
      )}

      {}
      {isReunion ? (
        <section aria-labelledby="room-includes" className="rm-section">
          <h2 id="room-includes" className="rm-section__title">
            {REUNION.product.includesTitle}
          </h2>
          <ul className="rm-includes">
            {REUNION.product.includes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <ReunionMaterials />
        </section>
      ) : null}
    </>
  );

  if (isReunion && mounted && !reunionIn) {
    const G = REUNION.product.gate;
    return (
      <main id="main" className="rs-night rm-page" data-room={room} data-gate="">
        <header className="rm-top">
          <Link href="/home#rooms" className="rm-back">
            <ChevronLeftIcon size={20} />
            <span>{P.back}</span>
          </Link>
          <LanguagePicker />
        </header>
        <div className="rm-body">
          {roomIntro}
          <section aria-labelledby="room-gate" className="rm-section rm-gate">
            <h2 id="room-gate" className="rm-section__title">
              {G.title}
            </h2>
            <p className="m-0">{G.body}</p>
            <Link href="/reunion" className="dg-btn dg-btn--seal rm-gate__cta">
              {G.cta}
            </Link>
          </section>
          <SiteFooter className="mt-10" />
        </div>
        {}
        <div className="rm-dock">
          <Link href="/reunion" className="dg-btn dg-btn--seal rm-dock__btn">
            {dealText(readLabel, priceNow, priceNow, priceWas)}
          </Link>
          <p className="rm-dock__note">{G.payNote}</p>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="rs-night rm-page" data-room={room} data-paynow={payNow ? '' : undefined}>
      {}
      {payNow ? (
        <p className="rm-paynow" role="status">
          <span className="wt-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {P.openingPay}
        </p>
      ) : null}
      <header className="rm-top">
        <Link href="/home#rooms" className="rm-back">
          <ChevronLeftIcon size={20} />
          <span>{P.back}</span>
        </Link>
        <LanguagePicker />
      </header>

      <section className="rm-hero" aria-labelledby="room-title">
        <div className="rm-hero__art">
          <RoomArt room={room} glyph={keeper.hanja} priority sizes="(max-width: 520px) 100vw, 480px" />
        </div>
        <div className="rm-hero__shade" aria-hidden="true" />
        <div className="rm-hero__body">
          <p className="rm-hero__keeper">{keeper.name}</p>
          <h1 id="room-title" className="rm-hero__title">
            {copy.title}
          </h1>
          <p className="rm-hero__quote">{ROOMS_COPY.quote(copy.quote)}</p>
        </div>
      </section>

      <div className="rm-body">
        {continueMode && payFailed ? <ContinueFailure onRetry={() => void begin()} /> : null}

        {}
        {continueMode ? (
          <details className="rm-browse" open>
            <summary>{CONTINUE.confirm.browse}</summary>
            {roomIntro}
          </details>
        ) : (
          roomIntro
        )}

        {continueMode ? <ContinueConfirm /> : null}

        {}
        {open === false ? <KeeperBubbles lines={copy.closed} keeperName={keeper.name} /> : null}

        {}
        {open && !sample && !isReunion && signedIn ? (
          <section ref={subjectRef} aria-labelledby="room-subject" className="rm-section scroll-mt-4">
            <h2 id="room-subject" className="rm-section__title">
              {P.subjectHeading}
            </h2>
            <RoomPeople
              pair={spec.needsPartner}
              people={people}
              loaded={account.loaded}
              signedIn={signedIn}
              ids={ids}
              onToggle={toggle}
              kind={kind}
              onKind={setPairKind}
              onAdd={() => setScreen('add')}
              onSignIn={() => setSigning(true)}
              disabled={busy}
            />
            {signedIn && needLuck ? <LuckChooser onChoose={chooseRule} /> : null}
            <p className="rm-note">{ACCOUNT.picker.sendNote}</p>
          </section>
        ) : null}

        {}
        {open && !sample && !isReunion && !signedIn ? (
          <section aria-labelledby="room-subject" className="rm-section">
            <h2 id="room-subject" className="rm-section__title">
              {P.subjectHeading}
            </h2>
            <div className="rm-subject">
              {selfInput && answers.date ? (
                <div className="rm-subject__row">
                  <span className="rm-subject__who">{selfName}</span>
                  <span className="rm-subject__meta">
                    {P.born(formatBirth(answers.date))}
                    {answers.time ? ` · ${answers.time}` : ` · ${P.timeUnknown}`}
                    {answers.place?.label ? ` · ${answers.place.label}` : ''}
                  </span>
                  <button type="button" className="rm-subject__change" onClick={() => setScreen('self')} disabled={busy}>
                    {P.change}
                  </button>
                </div>
              ) : (
                <button type="button" className="dg-btn dg-btn--quiet rm-subject__add" onClick={() => setScreen('self')}>
                  {P.addSelf}
                </button>
              )}

              {spec.needsPartner ? (
                partner ? (
                  <div className="rm-subject__row">
                    <span className="rm-subject__who">{partner.name.trim() || P.pairKinds[partner.kind]}</span>
                    <span className="rm-subject__meta">
                      {P.pairKinds[partner.kind]} · {P.born(formatBirth(partner.date))}
                      {partner.time ? ` · ${partner.time}` : ` · ${P.timeUnknown}`}
                    </span>
                    <button type="button" className="rm-subject__change" onClick={() => setScreen('partner')} disabled={busy}>
                      {P.change}
                    </button>
                  </div>
                ) : (
                  <button type="button" className="dg-btn dg-btn--quiet rm-subject__add" onClick={() => setScreen('partner')}>
                    {P.addPartner}
                  </button>
                )
              ) : null}

              {needLuck ? <LuckChooser onChoose={chooseRule} /> : null}
            </div>
            {accountOn ? (
              <p className="rm-note">
                {P.guestNote}{' '}
                <button type="button" className="rm-subject__change" onClick={() => setSigning(true)}>
                  {P.guestSignIn}
                </button>
              </p>
            ) : null}
            <p className="rm-note">{P.sendNote}</p>
          </section>
        ) : null}

        {}
        {open && !sample && isReunion && reunionIn ? (
          <section aria-label={REUNION.pitch.region} className="rm-section">
            <div className="rm-subject">
              <div className="rm-subject__row">
                <span className="rm-subject__who">{reunionSummary(reunionIn.intake)}</span>
                <Link href="/reunion" className="rm-subject__change rm-subject__link">
                  {P.change}
                </Link>
              </div>
              {needLuck ? <LuckChooser onChoose={chooseRule} /> : null}
            </div>
            {accountOn && !signedIn ? (
              <p className="rm-note">
                {P.guestNote}{' '}
                <button type="button" className="rm-subject__change" onClick={() => setSigning(true)}>
                  {P.guestSignIn}
                </button>
              </p>
            ) : null}
            <p className="rm-note">{P.sendNote}</p>
          </section>
        ) : null}

        {}
        {open && !sample && !isReunion ? <ConcernBox value={question} onChange={onQuestion} disabled={busy} /> : null}

        <section
          ref={readingRef}
          className="rm-reading"
          aria-labelledby="room-title"
          aria-busy={busy}
          data-phase={state.phase}
          hidden={state.phase === 'idle'}
        >
          {}
          {busy && !hasBody ? (
            <p className="rm-writing" role="status">
              <span className="wt-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {P.writing(keeper.name)}
            </p>
          ) : null}
          {}
          {hasBody ? (
            <article className="rm-doc" aria-label={P.docHeading}>
              <header className="rm-doc__head">
                <p className="rm-doc__keeper">{keeper.name}</p>
                <p className="rm-doc__title">{P.docHeading}</p>
                <p className="rm-doc__note">{sample ? P.sampleNote : P.docNote}</p>
              </header>
              <ReadingText text={split.body} streaming={state.phase === 'streaming'} />
            </article>
          ) : null}
          {state.phase === 'done' ? (
            <p className="rm-done" role="status">
              {P.done}
              {saveNote ? <span className="rm-done__saved">{saveNote === 'saved' ? ACCOUNT.picker.saved : ACCOUNT.picker.saveFailed}</span> : null}
            </p>
          ) : null}
          {state.phase === 'done' && pay === 'skip' && !sample ? (
            <div className="mt-4 flex flex-col items-start gap-2">
              <button type="button" className="dg-btn dg-btn--quiet" onClick={() => void rereadLocal()}>
                {P.rereadLocal}
              </button>
              <p className="rm-note m-0">{P.rereadLocalNote}</p>
            </div>
          ) : null}
          {state.phase === 'error' ? (
            <div className="rm-error" role="alert">
              <p className="m-0">{P.errors[state.error]}</p>
              {state.error === 'login' ? (
                <button type="button" className="dg-btn dg-btn--quiet" onClick={() => setSigning(true)}>
                  {ACCOUNT.picker.signInButton}
                </button>
              ) : state.error === 'payment' ? (

                <button
                  type="button"
                  className="dg-btn dg-btn--quiet"
                  onClick={() => {
                    clearReceipt(room);
                    void begin();
                  }}
                >
                  {dealText(P.payAndRead(), priceNow, priceNow, priceWas)}
                </button>
              ) : state.error !== 'notOpen' ? (
                <button type="button" className="dg-btn dg-btn--quiet" onClick={() => void begin()}>
                  {P.retry}
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

        {}
        {!isReunion ? (
          <section aria-labelledby="room-others" className="rm-section rm-others">
            <h2 id="room-others" className="rm-section__title">
              {P.otherRooms}
            </h2>
            {BUNDLES_ON ? <BundleLine from="room" /> : null}
            <RoomRailList exclude={room} label={P.otherRooms} />
          </section>
        ) : null}

        <SiteFooter className="mt-10" />
      </div>

      {}
      {open !== null && !busy && !hasReading ? (
        <div className="rm-dock">
          {open ? (
            <>
              <button
                type="button"
                className="dg-btn dg-btn--seal rm-dock__btn"
                onClick={() => void begin()}
                disabled={needLuck || paying || (accountOn && !account.ready)}
              >
                {dealText(sample ? P.readSample : isReunion ? readLabel : signedIn ? dockLabel() : !selfInput ? P.addSelf : needPartner ? P.addPartner : readLabel, priceNow, priceNow, priceWas)}
              </button>
              <p className="rm-dock__note">
                {dealText(
                  sample
                  ? P.sampleNote
                  : payFailed && !continueMode
                    ? ROOMS_COPY.checkout.failed
                    : pay === 'paddle'
                      ? P.paddleNote
                      : pay === 'toss'
                        ? `${firstPrice ? `${ROOMS_COPY.first.note(firstPercentOff(locale))} ` : ''}${P.tossNote}`
                        : pay === 'dodo'
                          ? `${firstPrice ? `${ROOMS_COPY.first.note(firstPercentOff(locale))} ` : ''}${P.dodoNote}`
                          : pay === 'test'
                            ? P.testPayNote
                            : pay === 'skip'
                              ? P.skipPayNote
                              : isReunion
                                ? P.previewNote
                                : `${P.priceNote(ROOMS_COPY.price)} ${P.previewNote}`,
                  priceNow,
                  priceNow,
                  priceWas,
                )}
              </p>
            </>
          ) : (
            <>
              <button type="button" className="dg-btn dg-btn--seal rm-dock__btn" onClick={() => setReserving(true)}>
                {P.reserve(isReunion ? priceNow : ROOMS_COPY.price)}
              </button>
              <p className="rm-dock__note">{P.noCharge}</p>
            </>
          )}
        </div>
      ) : null}

      {reserving ? <EmailModal source={`room:${room}`} onClose={() => setReserving(false)} /> : null}
      {checkout ? (
        <CheckoutSheet
          room={room}
          payload={checkout}
          readers={
            isReunion
              ? [P.you, reunionIn?.nickname.trim() || P.pairKinds.other]
              : signedIn && edition !== 'xmas'
                ? chosen.slice(0, spec.needsPartner ? 2 : 1).map((p) => p.name)
                : [selfName, ...(partner && spec.needsPartner ? [partner.name.trim() || P.pairKinds[partner.kind]] : [])]
          }
          token={() => account.accessToken()}
          onPaid={(receipt) => void paid(checkout, receipt)}
          onClose={() => {
            setCheckout(null);

            if (!leaving.current && edition === 'xmas') {
              router.replace(xmasReturnPath());
              return;
            }

            if (!leaving.current) {
              setPayNow(false);

              setEdition(undefined);
            }
          }}
          signedIn={signedIn}
          first={firstPrice}
          edition={edition}

          onPreview={payNow && edition !== 'xmas' ? () => {
            setCheckout(null);
            setPayNow(false);
            setEdition(undefined);
          } : undefined}
          toss={pay === 'toss' ? { beforeRedirect: () => saveBeforeRedirect(checkout) } : undefined}
          dodo={pay === 'dodo' ? { beforeRedirect: () => saveBeforeRedirect(checkout) } : undefined}
        />
      ) : null}
      {signing ? <LoginSheet next={home} onClose={() => setSigning(false)} /> : null}
    </main>
  );
}
