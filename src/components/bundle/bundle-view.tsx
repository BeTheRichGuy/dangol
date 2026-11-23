'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { ACCOUNT } from '@/content/account';
import { BUNDLE_PAGE } from '@/content/bundle';
import { BUNDLE_PROMO } from '@/content/bundle-promo';
import { activeLocale } from '@/content/locale';
import { ROOMS_COPY } from '@/content/rooms';
import type { Person } from '@/lib/account/types';
import { track } from '@/lib/analytics/track';
import { payForLocale, type ClientPay } from '@/lib/payments/pay-locale';
import { BUNDLE_ROOMS, bundlePercentOff } from '@/lib/payments/bundle';
import { PICK_COUNT, parsePicks, pickPercentOff } from '@/lib/payments/offers';
import { PRODUCT_KEYS, ROOMS, type ProductKey } from '@/lib/rooms/themes';
import { useAccount } from '../account/account-provider';
import { LoginPanel } from '../account/login-panel';
import { LoginSheet } from '../account/login-sheet';
import { PersonForm } from '../account/person-form';
import { RoomPeople } from '../account/room-people';
import { LanguagePicker } from '../home-hero';
import { ChevronLeftIcon } from '../icons';
import { useLocale } from '../locale-provider';
import { dodoCancelled } from '../rooms/dodo-checkout';
import { CheckoutSheet } from '../rooms/checkout-sheet';
import { roomCopy } from '../rooms/room-copy';
import { tossFailure } from '../rooms/toss-checkout';
import { SiteFooter } from '../site-footer';
import '../result/result.css';
import '../webtoon/webtoon.css';
import '../rooms/rooms.css';
import './bundle-page.css';
import { bundleLifePayload, saveBundlePending } from './bundle-store';
import { BundleFaces } from './bundle-faces';
import { BundleLuckChooser } from './luck-chooser';

function defaultPerson(people: readonly Person[]): Person | null {
  return people.find((p) => p.relation === 'self') ?? people[0] ?? null;
}

const noopSubscribe = () => () => {};

function keeperName(key: ProductKey): string {
  return key === 'reunion' ? ROOMS_COPY.keepers.u12.name : ROOMS_COPY.keepers[ROOMS[key].keeper].name;
}

export function BundleView() {
  useLocale();
  const router = useRouter();
  const account = useAccount();
  const B = BUNDLE_PAGE.page;
  const P = ROOMS_COPY.page;
  const PK = BUNDLE_PAGE.pick;
  const accountOn = account.mode !== 'off';
  const signedIn = accountOn && account.ready && account.user !== null;
  const people = account.people;

  const urlPick = useSyncExternalStore(noopSubscribe, () => new URLSearchParams(window.location.search).get('plan') === 'pick', () => false);
  const [pickOverride, setPickOverride] = useState<boolean | null>(null);
  const wantPick = pickOverride ?? urlPick;
  const [picked, setPicked] = useState<ProductKey[]>([]);

  const picks = parsePicks(picked);
  const here = wantPick ? '/bundle?plan=pick' : '/bundle';
  const hasPair = wantPick ? picked.includes('match') : BUNDLE_ROOMS.includes('match');
  const withReunion = wantPick && picked.includes('reunion');
  const priceNow = wantPick ? PK.price : BUNDLE_PAGE.price;

  const off = wantPick ? pickPercentOff(activeLocale()) : bundlePercentOff(activeLocale());

  const [adding, setAdding] = useState(false);
  const [picked1, setPicked1] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [checkout, setCheckout] = useState<ReturnType<typeof bundleLifePayload>>(null);
  const [payFailed, setPayFailed] = useState(false);

  const [status, setStatus] = useState<boolean | null>(null);
  const [payRaw, setPayRaw] = useState<ClientPay>('off');
  const [payLocales, setPayLocales] = useState<string[] | null>(null);

  const chosen = people.find((p) => p.id === picked1) ?? defaultPerson(people);
  const needLuck = chosen !== null && chosen.sex === null;

  useEffect(() => {
    const c = new AbortController();
    fetch('/api/reading', { cache: 'no-store', signal: c.signal })
      .then((r) => (r.ok ? r.json() : { open: false }))
      .then((v: { open?: unknown; pay?: unknown; payLocales?: unknown }) => {
        setStatus(v.open === true);
        setPayRaw(v.pay === 'test' || v.pay === 'toss' || v.pay === 'dodo' ? v.pay : 'off');
        setPayLocales(Array.isArray(v.payLocales) ? v.payLocales.filter((l): l is string => typeof l === 'string') : null);
      })
      .catch(() => {
        if (!c.signal.aborted) setStatus(false);
      });
    return () => c.abort();
  }, []);

  useEffect(() => {
    const isPick = new URLSearchParams(window.location.search).get('plan') === 'pick';
    const sale: Record<string, number> = isPick ? { pick: 1 } : { bundle: 1 };
    track('bundle_page', isPick ? { pick: 1 } : undefined);
    if (dodoCancelled(window.location.search)) {
      track('pay_cancel', { ...sale, provider: 'dodo' });
      router.replace(isPick ? '/bundle?plan=pick' : '/bundle');
      return;
    }
    const code = tossFailure(window.location.search);
    if (code === null) return;
    const cancel = code === 'PAY_PROCESS_CANCELED' || code === 'USER_CANCEL';
    track(cancel ? 'pay_cancel' : 'pay_fail', { ...sale, provider: 'toss', code });
    if (!cancel) queueMicrotask(() => setPayFailed(true));
    router.replace(isPick ? '/bundle?plan=pick' : '/bundle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [adding]);

  const payFor = payForLocale(payRaw, payLocales, activeLocale());
  const pay: ClientPay = payFor === 'closed' ? 'off' : payFor;
  const payable = payFor !== 'closed';
  const open = status === null ? null : status && payable;

  function switchPlan(toPick: boolean) {
    if (toPick === wantPick) return;
    setPickOverride(toPick);
    try {

      const q = new URLSearchParams(window.location.search);
      if (toPick) q.set('plan', 'pick');
      else q.delete('plan');
      const qs = q.toString();
      window.history.replaceState(null, '', qs ? `/bundle?${qs}` : '/bundle');
    } catch {

    }
  }

  function togglePick(key: ProductKey) {
    setPicked((cur) => {
      if (cur.includes(key)) return cur.filter((k) => k !== key);
      if (cur.length >= PICK_COUNT) return cur;
      return PRODUCT_KEYS.filter((k) => k === key || cur.includes(k));
    });
  }

  function begin() {
    if (!signedIn) return setSigning(true);
    if (!chosen || needLuck) return;
    if (wantPick && !picks) return;
    const payload = bundleLifePayload(chosen, activeLocale(), new Date().toISOString());
    if (!payload) return;
    setPayFailed(false);
    setCheckout(payload);
  }

  function saveBeforeRedirect() {
    if (chosen) saveBundlePending(window.sessionStorage, { selfId: chosen.id, receipt: null, lanterns: null, partnerId: null, kind: null, ...(picks ? { plan: 'pick' as const, picks } : {}) });
  }

  function chooseRule(sex: 'female' | 'male') {
    if (!chosen) return;
    const { name, relation, date, time, place } = chosen;
    void account.savePerson({ name, relation, date, time, place, sex }, chosen.id).catch(() => undefined);
  }

  if (adding) {
    return (
      <PersonForm
        initial={null}
        defaultRelation={people.some((p) => p.relation === 'self') ? undefined : 'self'}
        onBack={() => setAdding(false)}
        onSaved={(p) => {
          setPicked1(p.id);
          setAdding(false);
        }}
      />
    );
  }

  const dockLabel = !signedIn
    ? B.dockLogin
    : !chosen
      ? B.dockPick
      : needLuck
        ? B.dockLuck
        : wantPick
          ? picks
            ? PK.page.dockPay(priceNow)
            : PK.page.dockChoose(PICK_COUNT - picked.length)
          : B.dockPay(priceNow);

  return (
    <main id="main" className="rs-night rm-page bd-page">
      <header className="rm-top">
        <Link href="/home" className="rm-back">
          <ChevronLeftIcon size={20} />
          <span>{B.back}</span>
        </Link>
        <LanguagePicker />
      </header>

      <section className="bd-hero" aria-labelledby="bundle-title">
        <div className="bd-tabs" role="group" aria-label={BUNDLE_PROMO.badge}>
          <button type="button" className="bd-tabs__btn" aria-pressed={!wantPick} onClick={() => switchPlan(false)} disabled={checkout !== null}>
            {PK.tabAll}
          </button>
          <button type="button" className="bd-tabs__btn" aria-pressed={wantPick} onClick={() => switchPlan(true)} disabled={checkout !== null}>
            {PK.name}
          </button>
        </div>
        <p className="bd-hero__tag">{wantPick ? PK.badge : BUNDLE_PROMO.badge}</p>
        <h1 id="bundle-title" className="bd-hero__title">
          {wantPick ? PK.page.title : B.title}
        </h1>
        <p className="bd-hero__lead">{wantPick ? PK.page.lead : B.lead}</p>
        <p className="bd-price">
          <span className="bd-price__was">
            <span className="sr-only">{wantPick ? PK.page.listLabel : B.listLabel} </span>
            <s>{wantPick ? PK.list : BUNDLE_PAGE.listPrice}</s>
          </span>
          <span className="bd-price__arrow" aria-hidden="true">
            →
          </span>
          <strong className="bd-price__now">{priceNow}</strong>
        </p>
        {off > 0 ? <p className="bd-offrow"><span className="bd-price__off">{ROOMS_COPY.percentOff(off)}</span></p> : null}
        {wantPick ? null : <p className="bd-hero__lantern">{B.lanternLine}</p>}
        {wantPick ? null : <BundleFaces rooms={BUNDLE_ROOMS} />}
      </section>

      <div className="rm-body">
        {wantPick ? (
          <section aria-labelledby="bundle-choose" className="rm-section">
            <h2 id="bundle-choose" className="rm-section__title">
              {PK.page.chooseHeading}
            </h2>
            <p className="rm-note" role="status">
              {PK.page.chooseHint} {PK.page.chosen(picked.length, PRODUCT_KEYS.length)}
            </p>
            <ul className="bd-pick">
              {PRODUCT_KEYS.map((key) => {
                const on = picked.includes(key);
                const full = !on && picked.length >= PICK_COUNT;
                const copy = roomCopy(key);
                return (
                  <li key={key}>
                    <label className="bd-pick__item" data-on={on ? '' : undefined} data-full={full ? '' : undefined}>
                      <input type="checkbox" checked={on} disabled={full || checkout !== null} onChange={() => togglePick(key)} />
                      <span className="bd-pick__body">
                        <span className="bd-rooms__keeper">{keeperName(key)}</span>
                        <strong>{copy.title}</strong>
                        <span className="bd-rooms__line">{copy.line}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {hasPair ? <p className="rm-note">{PK.page.partnerNote}</p> : null}
            {withReunion ? <p className="rm-note">{PK.page.reunionNote}</p> : null}
          </section>
        ) : (
          <section aria-labelledby="bundle-includes" className="rm-section">
            <details className="bd-more">
              <summary id="bundle-includes">{B.more}</summary>
              <ol className="bd-rooms">
                {BUNDLE_ROOMS.map((room) => (
                  <li key={room}>
                    <span className="bd-rooms__keeper">{keeperName(room)}</span>
                    <strong>{ROOMS_COPY.rooms[room].title}</strong>
                    <span className="bd-rooms__line">{ROOMS_COPY.rooms[room].line}</span>
                  </li>
                ))}
              </ol>
            </details>
            {hasPair ? <p className="rm-note">{B.partnerNote}</p> : null}
          </section>
        )}

        <section aria-labelledby="bundle-how" className="rm-section">
          <h2 id="bundle-how" className="rm-section__title">
            {B.howHeading}
          </h2>
          <ol className="bd-steps">
            {(wantPick ? PK.page.steps(hasPair, withReunion) : B.steps).map((s, i) => (
              <li key={s}>
                <span className="bd-steps__num" aria-hidden="true">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </section>

        {open === false ? (
          <section className="rm-section" role="status">
            <p className="rm-note">{B.closed}</p>
            <p className="rm-note">{B.closedNote}</p>
          </section>
        ) : (
          <section aria-labelledby="bundle-subject" className="rm-section">
            <h2 id="bundle-subject" className="rm-section__title">
              {B.subjectHeading}
            </h2>
            {signedIn ? (
              <>
                <RoomPeople
                  pair={false}
                  people={people}
                  loaded={account.loaded}
                  signedIn
                  ids={chosen ? [chosen.id] : []}
                  onToggle={(id) => setPicked1(id)}
                  kind={null}
                  onKind={() => undefined}
                  onAdd={() => setAdding(true)}
                  onSignIn={() => setSigning(true)}
                  disabled={checkout !== null}
                />
                {needLuck ? <BundleLuckChooser onChoose={chooseRule} /> : null}
                <p className="rm-note">{ACCOUNT.picker.sendNote}</p>
              </>
            ) : accountOn ? (
              <div className="ac-card">
                <p className="ac-card__line">{wantPick ? PK.page.loginLead : B.loginLead}</p>
                <LoginPanel next={here} layout="full" />
                <p className="rm-note">{B.loginNote}</p>
              </div>
            ) : (
              <p className="rm-note">{B.closed}</p>
            )}
          </section>
        )}

        <SiteFooter className="mt-10" />
      </div>

      {open !== null && open !== false ? (
        <div className="rm-dock">
          <button
            type="button"
            className="dg-btn dg-btn--seal rm-dock__btn"
            onClick={begin}
            disabled={signedIn && (!chosen || needLuck || checkout !== null || (wantPick && !picks))}
          >
            {dockLabel}
          </button>
          <p className="rm-dock__note">{payFailed ? ROOMS_COPY.checkout.failed : pay === 'test' ? P.testPayNote : wantPick ? PK.page.payNote : B.payNote}</p>
        </div>
      ) : null}

      {checkout && chosen ? (
        <CheckoutSheet
          room="life"
          payload={checkout}
          bundle={!wantPick}
          pick={wantPick && picks ? picks : undefined}
          readers={[chosen.name]}
          token={() => account.accessToken()}
          onPaid={(receipt) => {

            saveBundlePending(window.sessionStorage, {
              selfId: chosen.id,
              receipt,
              lanterns: null,
              partnerId: null,
              kind: null,
              ...(picks ? { plan: 'pick' as const, picks } : {}),
            });
            router.push('/bundle/read');
          }}
          onClose={() => setCheckout(null)}
          toss={pay === 'toss' ? { beforeRedirect: saveBeforeRedirect } : undefined}
          dodo={pay === 'dodo' ? { beforeRedirect: saveBeforeRedirect } : undefined}
        />
      ) : null}
      {signing ? <LoginSheet next={here} onClose={() => setSigning(false)} /> : null}
    </main>
  );
}
