'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ACCOUNT } from '@/content/account';
import { BUNDLE_PAGE } from '@/content/bundle';
import { BUNDLE_PROMO } from '@/content/bundle-promo';
import { activeLocale } from '@/content/locale';
import { ROOMS_COPY } from '@/content/rooms';
import type { Person, ReadingDraft } from '@/lib/account/types';
import { snapshotOf } from '@/lib/account/person';
import { track } from '@/lib/analytics/track';
import type { RoomPayload } from '@/lib/rooms/payload';
import { isPairKind, ROOMS, type PairKind, type RoomKey } from '@/lib/rooms/themes';
import { useAccount } from '../account/account-provider';
import { PersonForm } from '../account/person-form';
import { RoomPeople } from '../account/room-people';
import { LanguagePicker } from '../home-hero';
import { ChevronLeftIcon } from '../icons';
import { useLocale } from '../locale-provider';
import { confirmDodo, dodoReturn } from '../rooms/dodo-checkout';
import { clearPayReturn, isTransientConfirmFailure, loadPayReturn, savePayReturn, type PayReturn } from '../rooms/pay-return';
import { savePending, writtenChapters } from '../rooms/pending';
import { confirmToss, tossReturn, type BundleLanterns } from '../rooms/toss-checkout';
import { jobIO } from '../rooms/job-io';
import { savedReadingText, useRoomReading } from '../rooms/use-room-reading';
import { useKeepAwake } from '../rooms/use-wake-lock';
import { SiteFooter } from '../site-footer';
import '../result/result.css';
import '../webtoon/webtoon.css';
import '../rooms/rooms.css';
import './bundle-page.css';
import { bundleLifePayload, bundlePayloads, clearBundlePending, parseBundlePending, pendingPicks, pendingRooms, readBundleRaw, saveBundlePending, subscribeBundlePending } from './bundle-store';

const noopSubscribe = () => () => {};

type Writer = ReturnType<typeof useRoomReading>;

function defaultKind(partner: Person | null): PairKind | null {
  return partner && isPairKind(partner.relation) ? partner.relation : null;
}

export function BundleReadView() {
  useLocale();
  const router = useRouter();
  const account = useAccount();
  const R = BUNDLE_PAGE.read;
  const PK = BUNDLE_PAGE.pick.read;
  const P = ROOMS_COPY.page;

  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const returned = useSyncExternalStore(
    noopSubscribe,
    () => Boolean(tossReturn(window.location.search) || dodoReturn(window.location.search) || loadPayReturn(window.sessionStorage, 'bundle')),
    () => false,
  );
  const raw = useSyncExternalStore(subscribeBundlePending, () => readBundleRaw(window.sessionStorage), () => null);
  const pending = useMemo(() => parseBundlePending(raw), [raw]);

  const picks = pendingPicks(pending);
  const isPick = picks !== null;
  const withReunion = picks?.includes('reunion') ?? false;
  const rooms = pendingRooms(pending);
  const hasPair = rooms.includes('match');
  const bundlePath = isPick ? '/bundle?plan=pick' : '/bundle';
  const people = account.people;
  const self = pending ? (people.find((p) => p.id === pending.selfId) ?? null) : null;
  const partner = pending?.partnerId ? (people.find((p) => p.id === pending.partnerId) ?? null) : null;

  const ready = account.mode !== 'off' && account.ready && account.user !== null && account.loaded;

  const writers: Record<RoomKey, Writer> = {
    life: useRoomReading('life'),
    decades: useRoomReading('decades'),
    love: useRoomReading('love'),
    match: useRoomReading('match'),
    year: useRoomReading('year'),
  };

  const [confirming, setConfirming] = useState(false);
  const [confirmFailed, setConfirmFailed] = useState(false);
  const [recheck, setRecheck] = useState<PayReturn | null>(null);
  const confirmStarted = useRef(false);

  async function confirm(found: PayReturn) {
    const store = window.sessionStorage;
    if (!pending || !self) return;
    setConfirmFailed(false);
    setRecheck(null);
    setConfirming(true);
    try {
      const payload = bundleLifePayload(self, activeLocale(), new Date().toISOString());
      if (!payload) throw Object.assign(new Error('payload'), { code: 'payload', status: 400 });
      const token = await account.accessToken();
      const got: { lanterns: BundleLanterns } = { lanterns: null };
      const onLanterns = (l: BundleLanterns) => {
        got.lanterns = l;
      };
      const receipt =
        found.provider === 'toss'
          ? await confirmToss(payload, found.ret, token, { onLanterns, pick: picks ?? undefined })
          : await confirmDodo(payload, found.ret, token, { bundle: { onLanterns, pick: picks ?? undefined } });
      clearPayReturn(store, 'bundle');
      track('pay_success', { ...(isPick ? { pick: 1 } : { bundle: 1 }), provider: found.provider });
      saveBundlePending(store, { ...pending, receipt, lanterns: isPick ? null : got.lanterns ? 'arrived' : 'late' });
    } catch (e) {
      track('pay_fail', { ...(isPick ? { pick: 1 } : { bundle: 1 }), provider: found.provider, code: String((e as { code?: unknown })?.code ?? 'confirm') });
      if (isTransientConfirmFailure(e)) {
        savePayReturn(store, 'bundle', found);
        setRecheck(found);
      } else {
        clearPayReturn(store, 'bundle');
      }
      setConfirmFailed(true);
    } finally {
      setConfirming(false);
    }
  }

  useEffect(() => {
    if (!hydrated || !ready || !pending || pending.receipt || !self || confirmStarted.current) return;
    const search = window.location.search;
    const toss = tossReturn(search);
    const dodo = toss ? null : dodoReturn(search);
    const found: PayReturn | null = toss ? { provider: 'toss', ret: toss } : dodo ? { provider: 'dodo', ret: dodo } : loadPayReturn(window.sessionStorage, 'bundle');
    if (!found) return;
    confirmStarted.current = true;
    if (toss || dodo) router.replace('/bundle/read');

    queueMicrotask(() => void confirm(found));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, ready, pending, self, router]);

  const [partnerPick, setPartnerPick] = useState<string | null>(null);
  const [pairKind, setPairKind] = useState<PairKind | null>(null);
  const [adding, setAdding] = useState(false);
  const pickedPerson = people.find((p) => p.id === partnerPick) ?? null;
  const kind = pairKind ?? defaultKind(pickedPerson);

  const stage: 'lost' | 'confirming' | 'partner' | 'writing' | 'wait' =
    !hydrated || !ready
      ? 'wait'
      : !pending || !self
        ? 'lost'
        : !pending.receipt
          ? confirming || confirmFailed || returned
            ? 'confirming'
            : 'lost'
          : hasPair && (!pending.partnerId || !partner || !pending.kind)
            ? 'partner'
            : 'writing';

  const started = useRef(false);
  const payloads = useRef<Record<RoomKey, RoomPayload> | null>(null);
  const drafts = useRef<Partial<Record<RoomKey, Omit<ReadingDraft, 'body'>>>>({});

  const fresh = useRef(new Set<RoomKey>());
  const archived = useRef(new Set<RoomKey>());
  const [buildFailed, setBuildFailed] = useState(false);
  const accountRef = useRef(account);
  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  async function begin(room: RoomKey, p: RoomPayload, receipt: string, token: string | null, restoreSaved: boolean) {
    if (restoreSaved && savedReadingText(room, p) !== null) {
      writers[room].restore(p);
      return;
    }
    const draft = drafts.current[room];
    if (accountRef.current.background && draft) {
      const io = jobIO(accountRef.current, draft);
      if (restoreSaved && writers[room].resume(p, io)) return;
      void writers[room].startJob(p, token, receipt, io);
      return;
    }
    fresh.current.add(room);
    void writers[room].start(p, token, receipt);
  }

  useEffect(() => {
    if (stage !== 'writing' || started.current || !pending?.receipt || !self || (hasPair && (!partner || !pending.kind))) return;
    started.current = true;
    const receipt = pending.receipt;
    const nowIso = new Date().toISOString();
    const built = bundlePayloads(self, partner, pending.kind, activeLocale(), nowIso, rooms);
    if (!built) {
      queueMicrotask(() => setBuildFailed(true));
      return;
    }
    payloads.current = built;
    void (async () => {
      const token = await accountRef.current.accessToken();
      for (const room of rooms) {
        const people2 = ROOMS[room].needsPartner && partner ? [snapshotOf(self), snapshotOf(partner)] : [snapshotOf(self)];
        const draft: Omit<ReadingDraft, 'body'> = { kind: room, locale: activeLocale(), people: people2, question: '', concern: null, nowIso };
        drafts.current[room] = draft;

        savePending(window.sessionStorage, room, { payload: built[room], receipt, readerName: self.name, draft, sex: self.sex });
        await begin(room, built[room], receipt, token, true);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, pending, self, partner]);

  useEffect(() => {
    for (const room of rooms) {
      const s = writers[room].state;
      if (s.phase !== 'done' || !fresh.current.has(room) || archived.current.has(room)) continue;
      const draft = drafts.current[room];
      if (!draft) continue;
      archived.current.add(room);
      void accountRef.current.saveReading({ ...draft, body: s.text }).catch(() => undefined);
    }
  });

  const startedAt = useRef<Partial<Record<RoomKey, number>>>({});
  useEffect(() => {
    for (const room of rooms) {
      const phase = writers[room].state.phase;
      const t = startedAt.current[room];
      if (phase === 'waiting' && t === undefined) {
        startedAt.current[room] = Date.now();
        track('reading_start', { room, bundle: 1 });
      } else if (phase === 'done' && t !== undefined) {
        track('reading_done', { room, bundle: 1, ms: Date.now() - t });
        startedAt.current[room] = undefined;
      } else if (phase === 'error' && t !== undefined) {
        const s = writers[room].state;
        track('reading_error', { room, bundle: 1, code: s.phase === 'error' ? s.error : 'unknown' });
        startedAt.current[room] = undefined;
      }
    }
  });

  const busy = rooms.some((r) => writers[r].state.phase === 'waiting' || writers[r].state.phase === 'streaming');

  useKeepAwake(busy);

  useEffect(() => {

    if (!busy || account.background) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [busy, account.background]);
  const allDone = stage === 'writing' && rooms.every((r) => writers[r].state.phase === 'done');

  async function retry(room: RoomKey) {
    const p = payloads.current?.[room];
    if (!p || !pending?.receipt) return;
    await begin(room, p, pending.receipt, await accountRef.current.accessToken(), false);
  }

  function startAll() {
    if (!pending || !partnerPick || !kind) return;
    saveBundlePending(window.sessionStorage, { ...pending, partnerId: partnerPick, kind });
  }

  if (adding) {
    return (
      <PersonForm
        initial={null}
        onBack={() => setAdding(false)}
        onSaved={(p) => {
          setPartnerPick(p.id);
          setAdding(false);
        }}
      />
    );
  }

  return (
    <main id="main" className="rs-night rm-page bd-page">
      <header className="rm-top">
        {busy && !account.background ? (
          <span className="rm-back" aria-hidden="true" />
        ) : (
          <Link href="/home" className="rm-back">
            <ChevronLeftIcon size={20} />
            <span>{R.toMain}</span>
          </Link>
        )}
        <LanguagePicker />
      </header>

      <section className="bd-hero" aria-labelledby="bundle-read-title">
        <p className="bd-hero__tag">{isPick ? BUNDLE_PAGE.pick.badge : BUNDLE_PROMO.badge}</p>
        <h1 id="bundle-read-title" className="bd-hero__title">
          {isPick ? PK.title : R.title}
        </h1>
      </section>

      <div className="rm-body" aria-busy={busy || confirming}>
        {stage === 'confirming' ? (
          <section className="rm-section" role="status" aria-live="polite">
            {confirmFailed ? (
              <div className="rm-error" role="alert">
                <p className="m-0">{R.confirmFailed}</p>
                {recheck ? (
                  <button type="button" className="dg-btn dg-btn--primary" disabled={confirming} onClick={() => void confirm(recheck)}>
                    {confirming ? P.rechecking : P.recheck}
                  </button>
                ) : null}
                <Link href={bundlePath} className="dg-btn dg-btn--quiet">
                  {R.other}
                </Link>
              </div>
            ) : (
              <p className="rm-preparing__title">
                <span className="wt-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                {R.confirming}
              </p>
            )}
          </section>
        ) : null}

        {stage === 'lost' ? (
          <section className="rm-section" role="alert">
            <p className="rm-note">{R.lost}</p>
            <Link href={bundlePath} className="dg-btn dg-btn--primary">
              {R.other}
            </Link>
          </section>
        ) : null}

        {pending?.receipt && stage !== 'confirming' && stage !== 'lost' && (pending.lanterns || isPick) ? (
          <div className="bd-paid" role="status">
            <p>{R.paid}</p>
            {isPick ? null : <p>{pending.lanterns === 'arrived' ? R.lanternsArrived : R.lanternsLate}</p>}
          </div>
        ) : null}

        {stage === 'partner' && self ? (
          <section aria-labelledby="bundle-partner" className="rm-section bd-partner">
            <h2 id="bundle-partner" className="rm-section__title">
              {R.partnerHeading}
            </h2>
            <p className="rm-note">{isPick ? PK.partnerLead : R.partnerLead}</p>
            <RoomPeople
              pair
              people={people}
              loaded={account.loaded}
              signedIn
              ids={partnerPick ? [self.id, partnerPick] : [self.id]}
              onToggle={(id) => {

                if (id === self.id) return;
                setPartnerPick((cur) => (cur === id ? null : id));
                setPairKind(null);
              }}
              kind={kind}
              onKind={setPairKind}
              onAdd={() => setAdding(true)}
              onSignIn={() => undefined}
              disabled={false}
            />
            <p className="rm-note">{R.partnerPickHint}</p>
            <button type="button" className="dg-btn dg-btn--seal" onClick={startAll} disabled={!partnerPick || !kind}>
              {!partnerPick ? R.partnerNeed : !kind ? R.startNeedKind : isPick ? PK.start : R.start}
            </button>
            <p className="rm-note">{ACCOUNT.picker.sendNote}</p>
          </section>
        ) : null}

        {stage === 'writing' ? (
          <section aria-labelledby="bundle-writing" className="rm-section">
            <h2 id="bundle-writing" className="rm-section__title">
              {allDone ? (isPick ? PK.allDone : R.allDone) : isPick ? PK.writingHeading : R.writingHeading}
            </h2>
            {!allDone ? <p className="rm-note">{isPick ? PK.writingNote : R.writingNote}</p> : <p className="rm-note">{R.archive}</p>}
            {buildFailed ? (
              <p className="rm-error" role="alert">
                {BUNDLE_PAGE.page.failed}
              </p>
            ) : null}
            <ul className="bd-cards">
              {rooms.map((room) => {
                const state = writers[room].state;
                const total = ROOMS_COPY.rooms[room].contents.length;
                const text = state.phase === 'streaming' || state.phase === 'done' ? state.text : '';
                const written = state.phase === 'done' ? total : Math.min(writtenChapters(text), total);
                const label =
                  state.phase === 'done'
                    ? R.status.done
                    : state.phase === 'error'
                      ? R.status.error
                      : state.phase === 'streaming'
                        ? R.status.writing(written, total)
                        : R.status.waiting;
                return (
                  <li key={room} className="bd-card" data-state={state.phase}>
                    <span className="bd-card__who">
                      <span className="bd-card__keeper">{ROOMS_COPY.keepers[ROOMS[room].keeper].name}</span>
                      <span className="bd-card__title">{ROOMS_COPY.rooms[room].title}</span>
                    </span>
                    <span className="bd-card__state" role="status">
                      {label}
                    </span>
                    {state.phase === 'waiting' || state.phase === 'streaming' ? (
                      <span className="bd-card__bar" aria-hidden="true">
                        <span style={{ width: `${Math.round((written / total) * 100)}%` }} />
                      </span>
                    ) : null}
                    {state.phase === 'done' && (!busy || account.background) ? (
                      <Link href={`/room/${room}/read`} className="dg-btn dg-btn--glow bd-card__act">
                        {R.open}
                      </Link>
                    ) : null}
                    {state.phase === 'error' ? (
                      <>
                        <p className="bd-card__err" role="alert">
                          {P.errors[state.error]}
                        </p>
                        {state.error !== 'notOpen' ? (
                          <button type="button" className="dg-btn dg-btn--quiet bd-card__act" onClick={() => void retry(room)}>
                            {R.retry}
                          </button>
                        ) : null}
                      </>
                    ) : null}
                  </li>
                );
              })}
              {withReunion ? (
                <li className="bd-card" data-state="idle">
                  <span className="bd-card__who">
                    <span className="bd-card__keeper">{ROOMS_COPY.keepers.u12.name}</span>
                    <span className="bd-card__title">{ROOMS_COPY.reunion.title}</span>
                  </span>
                  <span className="bd-card__state">{PK.reunionNote}</span>
                  <Link href="/reunion" className="dg-btn dg-btn--glow bd-card__act">
                    {PK.reunionButton}
                  </Link>
                </li>
              ) : null}
            </ul>
            {allDone ? (
              <div className="bd-done">
                <Link href="/archive" className="dg-btn dg-btn--glow">
                  {ACCOUNT.home.archive}
                </Link>
                <Link
                  href="/home"
                  className="dg-btn dg-btn--quiet"
                  onClick={() => clearBundlePending(window.sessionStorage)}
                >
                  {R.toMain}
                </Link>
              </div>
            ) : null}
          </section>
        ) : null}

        <SiteFooter className="mt-10" />
      </div>
    </main>
  );
}
