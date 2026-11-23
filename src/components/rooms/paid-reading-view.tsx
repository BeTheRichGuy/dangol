'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ACCOUNT } from '@/content/account';
import { CONTINUE } from '@/content/continue';
import { activeLocale } from '@/content/locale';
import { ROOMS_COPY } from '@/content/rooms';
import { TYPE_PROFILES } from '@/content/types';
import type { ReadingDraft } from '@/lib/account/types';
import { addClaim } from '@/lib/account/guest-claim';
import { hasFateMap, isContinueLocale } from '@/lib/rooms/continue-locales';
import { reunionArtSrc } from '@/lib/reunion/art';
import { ROOMS, type ChapterRoom } from '@/lib/rooms/themes';
import { giftPlan } from '@/lib/talisman';
import Image from 'next/image';
import { useAccount } from '../account/account-provider';
import { LoginSheet } from '../account/login-sheet';
import { LanguagePicker } from '../home-hero';
import { ChevronLeftIcon } from '../icons';
import { useLocale } from '../locale-provider';
import { SiteFooter } from '../site-footer';
import { ReviewBox } from '../review/review-box';
import { TalismanGift } from '../talisman/talisman-gift';
import { MovementDivider, ReunionCardsAfter, ReunionSummary, SaveCards, reunionCardDataNow } from '../reunion/cards/reunion-cards';
import { movementAt, startOpenChapters } from '../reunion/cards/plan';
import '../result/result.css';
import '../webtoon/webtoon.css';
import { ChapterReading } from './chapter-reading';
import { entryOf, useEntry } from './continue';
import { FateCard, FateCards, fateAfter, hasFateInline } from './fate-cards';
import { readLocalSample, useLocalSample } from './local-sample';
import { roomCopy } from './room-copy';
import { loadPending, parsePending, readPagePlan, readPendingRaw, readStage, writtenChapters, type PendingReading } from './pending';
import { fillName, readingFormat, splitChapters } from './reading-blocks';
import { FlapGame } from '../play/flap-game';
import { ReadingText } from './reading-text';
import { RoomArt } from './room-art';
import { RoomRailList } from './room-cards';
import { BundleLine } from '../bundle/bundle-line';
import { BUNDLES_ON } from '@/lib/payments/bundle';
import { loadSample } from './samples';
import './rooms.css';
import { clearReceipt, loadReceipt, saveReceipt, savedReadingText, useRoomReading } from './use-room-reading';
import { jobIO } from './job-io';
import { savePending } from './pending';
import { confirmDodo, dodoReturn } from './dodo-checkout';
import { confirmToss, tossReturn } from './toss-checkout';
import { clearPayReturn, isTransientConfirmFailure, loadPayReturn, savePayReturn, type PayReturn } from './pay-return';
import { track } from '@/lib/analytics/track';
import { useKeepAwake } from './use-wake-lock';
import { XmasReading } from '../xmas/xmas-paid';
import { XMAS_REVIEW, xmasContents } from '@/content/xmas';
import { xmasChapters } from '@/lib/rooms/payload';

const noopSubscribe = () => () => {};

export function PaidReadingView({ room }: { room: ChapterRoom }) {
  const locale = useLocale();
  const entry = useEntry(room);
  const router = useRouter();
  const account = useAccount();
  const P = ROOMS_COPY.page;
  const keeper = ROOMS_COPY.keepers[ROOMS[room].keeper];
  const { state, start, startJob, resume, restore, startSample, forget, jobDoneId } = useRoomReading(room);

  const sample = useLocalSample();
  const pendingRaw = useSyncExternalStore(noopSubscribe, () => readPendingRaw(window.sessionStorage, room), () => null);
  const pending = useMemo(() => parsePending(pendingRaw, room), [pendingRaw, room]);

  const copy = roomCopy(room);
  const reunion = room === 'reunion';

  const continueType = !sample && room === 'life' && isContinueLocale(locale) && entry === 'free_result' ? (pending?.payload.self.dayMaster.type ?? null) : null;
  const [signing, setSigning] = useState(false);
  const [saveNote, setSaveNote] = useState<'saved' | 'failed' | null>(null);

  const [savedId, setSavedId] = useState<string | null>(null);

  const [recheck, setRecheck] = useState<PayReturn | null>(null);
  const [checking, setChecking] = useState(false);

  const [skipPay, setSkipPay] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    fetch('/api/reading', { cache: 'no-store', signal: c.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((v: { pay?: unknown } | null) => setSkipPay(v?.pay === 'skip'))
      .catch(() => undefined);
    return () => c.abort();
  }, []);

  const toSave = useRef<Omit<ReadingDraft, 'body'> | null>(null);
  const accountRef = useRef(account);
  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  const accountReady = account.mode === 'off' || account.ready;

  async function begin(p: PendingReading) {
    const acc = accountRef.current;
    const token = await acc.accessToken();
    const receipt = p.receipt ?? loadReceipt(room, p.payload);

    if (acc.background && p.draft) {
      toSave.current = null;
      const io = jobIO(acc, p.draft);
      if (resume(p.payload, io)) return;
      return void startJob(p.payload, token, receipt, io);
    }
    toSave.current = p.draft;
    void start(p.payload, token, receipt);
  }

  async function confirmReturn(p: PendingReading, found: PayReturn) {
    const store = window.sessionStorage;
    setRecheck(null);
    setChecking(true);
    try {
      const token = await accountRef.current.accessToken();

      const edition = p.edition === 'xmas' ? ('xmas' as const) : undefined;
      const receipt =
        found.provider === 'toss' ? await confirmToss(p.payload, found.ret, token, undefined, edition) : await confirmDodo(p.payload, found.ret, token, { edition });
      clearPayReturn(store, room);
      track('pay_success', { room, provider: found.provider });
      saveReceipt(room, p.payload, receipt);
      const next = { ...p, receipt };
      savePending(store, room, next);
      void begin(next);
    } catch (e) {
      track('pay_fail', { room, provider: found.provider, code: String((e as { code?: unknown })?.code ?? 'confirm') });
      if (isTransientConfirmFailure(e)) {
        savePayReturn(store, room, found);
        setRecheck(found);
      } else {
        clearPayReturn(store, room);
      }

      void begin(p);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (!accountReady) return;
    const isSample = readLocalSample();
    const p = isSample ? null : loadPending(window.sessionStorage, room);
    const plan = readPagePlan({ sample: isSample, pending: p, saved: p ? savedReadingText(room, p.payload) : null });
    if (plan === 'back') {

      const lost = tossReturn(window.location.search) ? 'toss' : dodoReturn(window.location.search) ? 'dodo' : null;
      if (lost) track('pay_fail', { room, provider: lost, code: 'lost_tab' });
      return router.replace(`/room/${room}`);
    }

    if (plan === 'sample') return room === 'reunion' ? router.replace(`/room/${room}`) : void startSample(() => loadSample(room, activeLocale()));
    if (plan === 'show-saved') return void restore(p!.payload);

    const ret = tossReturn(window.location.search);
    const dodoRet = ret ? null : dodoReturn(window.location.search);
    if (dodoRet) router.replace(`/room/${room}/read`);

    if (p!.receipt) clearPayReturn(window.sessionStorage, room);
    const found: PayReturn | null = ret
      ? { provider: 'toss', ret }
      : dodoRet
        ? { provider: 'dodo', ret: dodoRet }
        : p!.receipt
          ? null
          : loadPayReturn(window.sessionStorage, room);
    if (found && !p!.receipt) {
      if (ret) router.replace(`/room/${room}/read`);

      queueMicrotask(() => void confirmReturn(p!, found));
      return;
    }
    void begin(p!);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, accountReady, restore, startSample]);

  const startedAt = useRef<number | null>(null);
  useEffect(() => {
    if (sample) return;
    if (state.phase === 'waiting' && startedAt.current === null) {
      startedAt.current = Date.now();
      track('reading_start', { room });
    } else if (state.phase === 'done' && startedAt.current !== null) {
      track('reading_done', { room, ms: Date.now() - startedAt.current, entry: entryOf(room) });
      startedAt.current = null;
    } else if (state.phase === 'error' && startedAt.current !== null) {
      track('reading_error', { room, code: state.error });
      startedAt.current = null;
    }
  }, [state, room, sample]);

  useEffect(() => {
    if (state.phase !== 'done' || sample || account.user || !pending?.guestDraft) return;
    addClaim(window.sessionStorage, { key: `${room}:${pending.receipt ?? pending.payload.today}`, draft: { ...pending.guestDraft, body: state.text } });
  }, [state, sample, account.user, pending, room]);

  const { saveReading } = account;
  useEffect(() => {
    if (state.phase !== 'done' || !toSave.current) return;
    const draft: ReadingDraft = { ...toSave.current, body: state.text };
    toSave.current = null;
    saveReading(draft).then(
      (r) => {
        setSaveNote('saved');
        setSavedId(r.id);
      },
      () => setSaveNote('failed'),
    );
  }, [state, saveReading]);

  const busy = state.phase === 'waiting' || state.phase === 'streaming';

  useKeepAwake(busy && !sample);
  const text = state.phase === 'streaming' || state.phase === 'done' ? fillName(state.text, sample ? '' : (pending?.readerName ?? '')) : '';
  const chaptered = readingFormat(text) === 'chapters' || text === '';
  const chapters = splitChapters(text, state.phase === 'streaming');

  const stage = readStage(state.phase);

  const total = pending && xmasChapters(pending.payload) ? xmasContents(pending.payload.locale).length : copy.contents.length;
  const written = Math.min(writtenChapters(text), total);

  const mySex = pending?.sex ?? pending?.draft?.people[0]?.sex ?? null;

  const giftPlanNow = useMemo(() => (pending && room !== 'reunion' ? giftPlan({ chart: pending.payload.self, room, question: pending.payload.question }) : null), [pending, room]);

  const fateCards = !sample && pending && hasFateMap(locale) ? <FateCards payload={pending.payload} room={room} sex={mySex} /> : null;

  const fatePayload = !sample && pending ? pending.payload : null;
  const fateInline = (n: number) =>
    fatePayload && hasFateMap(locale)
      ? fateAfter(room, n).map((part) => <FateCard key={part} payload={fatePayload} room={room} part={part} sex={mySex} />)
      : null;

  const reunionData = useMemo(() => (reunion && !sample && pending ? reunionCardDataNow(pending.payload) : null), [reunion, sample, pending, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  const xmas = Boolean(pending && xmasChapters(pending.payload));
  const cardsAfter = (n: number) => (reunionData ? <ReunionCardsAfter n={n} data={reunionData} /> : null);
  const movementBefore = (n: number) => {
    const m = reunionData ? movementAt(n) : null;
    return m === null ? null : <MovementDivider index={m} />;
  };

  return (
    <main id="main" className="rs-night rm-page" data-room={room}>
      <header className="rm-top">
        <Link href={`/room/${room}`} className="rm-back">
          <ChevronLeftIcon size={20} />
          <span>{P.readPage.back}</span>
        </Link>
        <LanguagePicker />
      </header>

      {xmas ? null : (
      <section className="rm-hero" aria-labelledby="read-title">
        <div className="rm-hero__art">
          {reunion ? (
            <div className="rm-art" data-room={room}>
              <Image src={reunionArtSrc('story-2')} alt="" fill priority sizes="(max-width: 520px) 100vw, 480px" className="rm-art__img" />
            </div>
          ) : (
            <RoomArt room={room} glyph={keeper.hanja} priority sizes="(max-width: 520px) 100vw, 480px" />
          )}
        </div>
        <div className="rm-hero__shade" aria-hidden="true" />
        <div className="rm-hero__body">
          <p className="rm-hero__keeper">{keeper.name}</p>
          <h1 id="read-title" className="rm-hero__title">
            {continueType ? CONTINUE.readHead.title : copy.title}
          </h1>
          <p className="rm-hero__quote">
            {sample
              ? P.sampleNote
              : continueType
                ? [pending?.readerName, CONTINUE.readHead.seen(TYPE_PROFILES[continueType].name)].filter(Boolean).join(' · ')
                : (pending?.readerName ?? '')}
          </p>
        </div>
      </section>
      )}

      <div className="rm-body" aria-busy={busy}>
        {stage === 'reading' && reunionData ? <ReunionSummary intake={reunionData.intake} /> : null}
        {stage === 'reading' && !hasFateInline(room) ? fateCards : null}
        {stage === 'reading' && xmas && pending ? (
          <div className="sd-page xm xq-wrap" lang={locale}>
            <XmasReading parts={chapters} payload={pending.payload} name={pending.readerName ?? ''} sex={mySex} />
          </div>
        ) : stage === 'reading' ? (
          chaptered ? (
            <>
              <ChapterReading
                room={room}
                chapters={chapters}
                streaming={false}
                waiting={false}
                concern={Boolean(pending?.payload.question)}
                after={reunion ? cardsAfter : fateInline}
                before={reunionData ? movementBefore : undefined}
                startOpen={reunionData ? startOpenChapters(reunionData.intake) : undefined}
              />
              {reunionData ? <SaveCards data={reunionData} /> : null}
            </>
          ) : (

            <article className="rm-doc">
              <ReadingText text={text} streaming={false} />
            </article>
          )
        ) : null}

        {stage === 'preparing' ? (
          <section className="rm-preparing" role="status" aria-live="polite">
            <p className="rm-preparing__title">
              <span className="wt-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {P.readPage.preparing(keeper.name)}
            </p>
            <p className="rm-preparing__note">{P.readPage.preparingNote}</p>
            <div className="rm-preparing__bar" aria-hidden="true">
              <span style={{ width: `${Math.round((written / total) * 100)}%` }} />
            </div>
            <p className="rm-preparing__count">{P.readPage.progress(written, total)}</p>
          </section>
        ) : null}
        {}
        {!sample && (state.phase === 'waiting' || state.phase === 'streaming') ? <FlapGame receipt={pending ? (pending.receipt ?? loadReceipt(room, pending.payload)) : null} keeper={keeper.name} /> : null}
        {stage === 'preparing' && !xmas ? fateCards : null}
        {state.phase === 'done' ? (
          <p className="rm-done" role="status">
            {P.done}
            {saveNote || (account.background && pending?.draft) ? (
              <span className="rm-done__saved">{saveNote === 'failed' ? ACCOUNT.picker.saveFailed : ACCOUNT.picker.saved}</span>
            ) : null}
          </p>
        ) : null}
        {state.phase === 'done' && !sample && !reunion ? <TalismanGift keeper={ROOMS[room].keeper} plan={giftPlanNow} /> : null}
        {}
        {}
        {state.phase === 'done' && !sample && (xmas || !account.user) ? (
          <ReviewBox room={room} reading={(pending?.receipt ?? 'paid').slice(-24)} {...(xmas ? { edition: 'xmas' as const, copy: XMAS_REVIEW } : {})} />
        ) : state.phase === 'done' && !sample && account.user && (jobDoneId ?? savedId) ? (
          <ReviewBox room={room} reading={(jobDoneId ?? savedId)!} />
        ) : null}
        {}
        {state.phase === 'done' && !sample && !account.user && account.mode !== 'off' && pending?.guestDraft ? (
          <div className="rm-keep" role="note">
            <p className="m-0">{P.readPage.guestKeep.line}</p>
            <button type="button" className="dg-btn dg-btn--primary" onClick={() => setSigning(true)}>
              {P.readPage.guestKeep.button}
            </button>
          </div>
        ) : null}
        {state.phase === 'done' && skipPay && !sample && pending ? (

          <div className="mt-4 flex flex-col items-start gap-2">
            <button
              type="button"
              className="dg-btn dg-btn--quiet"
              onClick={() => {
                setSaveNote(null);
                forget();
                void begin(pending);
              }}
            >
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
              <>
                {}
                {recheck && pending ? (
                  <>
                    <button type="button" className="dg-btn dg-btn--primary" disabled={checking} onClick={() => void confirmReturn(pending, recheck)}>
                      {checking ? P.rechecking : P.recheck}
                    </button>
                    <p className="rm-note m-0">{P.recheckNote}</p>
                  </>
                ) : null}
                {}
                <button
                  type="button"
                  className="dg-btn dg-btn--quiet"
                  onClick={() => {
                    clearReceipt(room);
                    clearPayReturn(window.sessionStorage, room);
                    router.push(`/room/${room}`);
                  }}
                >
                  {P.payAndRead()}
                </button>
              </>
            ) : state.error !== 'notOpen' && pending ? (
              <button type="button" className="dg-btn dg-btn--quiet" onClick={() => {
                  setSaveNote(null);
                  void begin(pending);
                }}>
                {P.retry}
              </button>
            ) : null}
          </div>
        ) : null}

        <section aria-labelledby="read-others" className="rm-section rm-others">
          <h2 id="read-others" className="rm-section__title">
            {P.otherRooms}
          </h2>
          {reunion || !BUNDLES_ON ? null : <BundleLine from="paid" />}
          <RoomRailList exclude={room === 'reunion' ? undefined : room} label={P.otherRooms} withReunion={room !== 'reunion'} />
        </section>

        {}
        <div className="grid">
          <Link href="/home" className="dg-btn dg-btn--glow rs-cta">
            {P.readPage.toMain}
          </Link>
        </div>

        <SiteFooter className="mt-10" />
      </div>

      {signing ? <LoginSheet next={`/room/${room}/read`} onClose={() => setSigning(false)} /> : null}
    </main>
  );
}
