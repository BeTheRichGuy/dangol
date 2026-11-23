'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { BUNDLE_PAGE } from '@/content/bundle';
import { ROOMS_COPY } from '@/content/rooms';
import { activeLocale } from '@/content/locale';
import { UI } from '@/content/ui';
import { bundlePercentOff } from '@/lib/payments/bundle';
import { firstPercentOff, pickPercentOff } from '@/lib/payments/offers';
import type { RoomPayload } from '@/lib/rooms/payload';
import { REUNION_PRICE_TEXT } from '@/lib/reunion/product';
import type { ProductKey } from '@/lib/rooms/themes';
import { loadXmasOffer } from '@/lib/xmas/offer-store';
import { XMAS_DEAL, XMAS_LIST, xmasFraction, xmasOff } from '@/lib/xmas/product';
import { XMAS_FLOW } from '@/content/xmas';
import { XmasViewers } from '../xmas/xmas-viewers';
import { flushTracking, track } from '@/lib/analytics/track';
import { chromeIntentUrl, isMetaInApp } from '@/lib/analytics/meta';
import { ArrowRightIcon, CloseIcon } from '../icons';
import { LanternIcon } from '../play/play-icons';
import { entryOf } from './continue';
import { roomCopy } from './room-copy';
import { startDodoPayment } from './dodo-checkout';
import { saleBody, startTossPayment } from './toss-checkout';
import '../account/account.css';

export function CheckoutSheet({
  room,
  payload,
  readers,
  token,
  onPaid,
  onClose,
  toss,
  dodo,
  bundle = false,
  pick,
  first: firstProp = false,
  signedIn = true,
  onPreview,
  edition,
}: {
  room: ProductKey;
  payload: RoomPayload;

  readers: string[];
  token: () => Promise<string | null>;
  onPaid: (receipt: string) => void;
  onClose: () => void;

  signedIn?: boolean;

  toss?: { beforeRedirect: () => void };

  dodo?: { beforeRedirect: () => void };

  bundle?: boolean;

  pick?: readonly ProductKey[];

  first?: boolean;

  onPreview?: () => void;

  edition?: 'xmas';
}) {
  const C = ROOMS_COPY.checkout;
  const B = BUNDLE_PAGE.checkout;
  const PK = BUNDLE_PAGE.pick;
  const XF = XMAS_FLOW.result;
  const pickMode = pick !== undefined;
  const xmas = edition === 'xmas';

  const first = firstProp && !xmas;

  const [xmasOffer] = useState(() => (xmas ? loadXmasOffer() : null));

  const quizSale = xmas && payload.quiz !== undefined;
  const [xmasDeal, setXmasDeal] = useState(() => quizSale || (xmasOffer !== null && xmasOffer.until > Date.now()));
  useEffect(() => {
    if (!xmasDeal || !xmasOffer || quizSale) return;
    const t = window.setTimeout(() => setXmasDeal(false), Math.max(0, xmasOffer.until - Date.now()));
    return () => window.clearTimeout(t);
  }, [xmasDeal, xmasOffer, quizSale]);

  const stat: Record<string, string | number | boolean> & { room?: ProductKey } = pickMode
    ? { pick: 1 }
    : bundle
      ? { bundle: 1 }
      : { room, ...(first ? { first: 1 } : {}), ...(xmas ? { xmas: 1 } : {}), ...(quizSale ? { quiz: 1 } : {}) };
  const uid = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [paying, setPaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [inApp] = useState(() => {
    if (typeof navigator === 'undefined' || !isMetaInApp(navigator.userAgent)) return null;
    return { chrome: /Android/i.test(navigator.userAgent) ? chromeIntentUrl(window.location.href) : null };
  });

  const dealAtOpen = useRef(xmasDeal);
  const statRef = useRef(stat);
  const openedAt = useRef(0);
  const agreedRef = useRef(false);

  const leavingRef = useRef(false);
  const roomRef = useRef(room);
  const bundleRef = useRef(bundle);
  const pickRef = useRef(pickMode);
  const firstRef = useRef(first);
  const xmasRef = useRef(xmas);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleClose = () => {
      if (dialog.open) return;
      if (!leavingRef.current) {
        track('checkout_close', { ...statRef.current, sec: Math.round((Date.now() - openedAt.current) / 1000), agreed: agreedRef.current ? 1 : 0 });
      }
      onCloseRef.current();
    };
    dialog.addEventListener('close', handleClose);
    if (!dialog.open) dialog.showModal();
    openedAt.current = Date.now();
    if (pickRef.current) track('checkout_open', { pick: 1 });
    else if (bundleRef.current) track('checkout_open', { bundle: 1 });
    else
      track('checkout_open', {
        room: roomRef.current,
        entry: entryOf(roomRef.current),
        ...(firstRef.current ? { first: 1 } : {}),
        ...(xmasRef.current ? { xmas: 1, deal: dealAtOpen.current ? 1 : 0 } : {}),
      });
    return () => {
      dialog.removeEventListener('close', handleClose);
      if (dialog.open) dialog.close();
    };
  }, []);

  const xmasSale: { edition?: 'xmas'; offer?: string } = xmas ? { edition: 'xmas', ...(xmasOffer ? { offer: xmasOffer.token } : {}) } : {};

  async function pay() {
    setPaying(true);
    setFailed(false);
    const redirect = toss ?? dodo;
    const provider = toss ? 'toss' : dodo ? 'dodo' : 'test';
    track('pay_start', { ...stat, provider });
    if (redirect) {
      try {

        flushTracking();
        const beforeRedirect = () => {
          leavingRef.current = true;
          redirect.beforeRedirect();

          ref.current?.close();
        };
        const started = dodo
          ? await startDodoPayment({ payload, token: await token(), beforeRedirect, bundle, pick, ...xmasSale })
          : await startTossPayment({
              payload,
              token: await token(),
              room,
              orderName: pickMode ? PK.checkout.orderName : bundle ? B.orderName : xmas ? C.xmasProduct : roomCopy(room).title,
              beforeRedirect,
              bundle,
              pick,
              ...xmasSale,
            });
        if (started !== 'cancel') {
          track('pay_success', { ...stat, provider, already: 1 });
          leavingRef.current = true;
          onPaid(started.receipt);
          ref.current?.close();
          return;
        }
        track('pay_cancel', { ...stat, provider });
        leavingRef.current = false;
        setPaying(false);
      } catch (e) {
        track('pay_fail', { ...stat, provider, code: String((e as { code?: unknown })?.code ?? (e as Error)?.message ?? 'unknown') });
        leavingRef.current = false;
        setFailed(true);
        setPaying(false);
      }
      return;
    }
    try {
      const t = await token();
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        body: JSON.stringify(saleBody(payload, { bundle, pick, ...xmasSale })),
      });
      const v = (await res.json().catch(() => ({}))) as { receipt?: unknown };
      if (!res.ok || typeof v.receipt !== 'string') throw new Error('checkout');
      track('pay_success', { ...stat, provider });
      leavingRef.current = true;
      onPaid(v.receipt);
      ref.current?.close();
    } catch {
      track('pay_fail', { ...stat, provider, code: 'checkout' });
      setFailed(true);
      setPaying(false);
    }
  }

  const regular = room === 'reunion' ? REUNION_PRICE_TEXT[activeLocale()] : ROOMS_COPY.price;
  const locale = activeLocale();
  const price = pickMode
    ? PK.price
    : bundle
      ? BUNDLE_PAGE.price
      : xmas
        ? (xmasDeal ? XMAS_DEAL : XMAS_LIST)[locale].text
        : first
          ? ROOMS_COPY.first.price
          : regular;

  const deal: { was: string; wasSr: string; off: number } | null = pickMode
    ? { was: PK.list, wasSr: PK.page.listLabel, off: pickPercentOff(locale) }
    : bundle
      ? { was: BUNDLE_PAGE.listPrice, wasSr: BUNDLE_PAGE.page.listLabel, off: bundlePercentOff(locale) }
      : xmas
        ? xmasDeal && !quizSale
          ? { was: XMAS_LIST[locale].text, wasSr: ROOMS_COPY.first.wasSr, off: xmasOff(locale) }
          : null
        : first
          ? { was: regular, wasSr: ROOMS_COPY.first.wasSr, off: firstPercentOff(locale) }
          : null;
  const total: ReactNode = deal ? (
    <>
      <s className="rm-pay__was">
        <span className="sr-only">{deal.wasSr} </span>
        {deal.was}
      </s>{' '}
      <strong>{price}</strong>
      {deal.off > 0 ? <span className="rm-pay__off">{ROOMS_COPY.percentOff(deal.off)}</span> : null}
    </>
  ) : (
    price
  );
  const who = readers.filter(Boolean).join(' · ');
  const rows: [string, ReactNode][] = pickMode
    ? [
        [B.productLabel, PK.checkout.product],
        [C.periodLabel, C.period],
        [B.includesLabel, pick.map((r) => roomCopy(r).title).join(' · ')],
        [C.forLabel, who],
        [C.totalLabel, total],
      ]
    : bundle
      ? [
          [B.productLabel, B.product],
          [C.periodLabel, C.period],
          [B.includesLabel, B.includes],
          [B.lanternsLabel, B.lanternsValue],
          [C.forLabel, who],
          [C.totalLabel, total],
        ]
      : [
          [C.productLabel, C.product],
          [C.periodLabel, C.period],
          [C.roomLabel, xmas ? C.xmasProduct : roomCopy(room).title],
          [C.forLabel, who],
          [C.totalLabel, total],
        ];
  const pair = pickMode && pick.includes('match');
  const withReunion = pickMode && pick.includes('reunion');

  return (
    <dialog
      ref={ref}
      className="dg-sheet ac-sheet rm-paysheet"
      aria-labelledby={`${uid}-title`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !paying) ref.current?.close();
      }}
    >
      <div className="relative px-6 pb-3 pt-7">
        <button
          type="button"
          onClick={() => ref.current?.close()}
          disabled={paying}
          aria-label={UI.common.close}
          className="dg-btn dg-btn--quiet absolute right-3 top-3 !min-h-11 !w-11 !rounded-full !border-0 !p-0"
        >
          <CloseIcon size={20} />
        </button>
        <h2 id={`${uid}-title`} className="ac-sheet__title">
          {bundle || pickMode ? B.title : C.title}
        </h2>
        <dl className="rm-pay">
          {rows.map(([label, value]) => (
            <div key={label} className="rm-pay__row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {}
        {xmas ? (
          <>
            {xmasDeal && xmasFraction(locale) && XF.third.line ? <p className="rm-pay__compare">{XF.third.line.replace('{n}', String(xmasFraction(locale)))}</p> : null}
            <XmasViewers className="rm-pay__proof" />
            <p className="rm-pay__label">{XF.stack.title}</p>
            <ul className="rm-pay__includes">
              {XF.stack.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}
        {}
        {pickMode || xmas || (room === 'reunion' && !first) ? null : (
          <p className="rm-pay__promo">
            <span className="rm-pay__promo-tag">{first ? ROOMS_COPY.first.tag : ROOMS_COPY.launchBadge}</span>
            {ROOMS_COPY.launchLine}
          </p>
        )}
        <p className="rm-pay__label">{C.methodLabel}</p>
        <p className="rm-pay__method">{toss ? C.tossMethod : dodo ? C.dodoMethod : C.testMethod}</p>
        {toss || dodo ? <p className="rm-pay__trust">{toss ? C.trust.toss : C.trust.dodo}</p> : null}
        <p className="ac-sheet__lead">
          {pickMode ? PK.checkout.after(pair, withReunion) : bundle ? B.after : xmas ? (signedIn ? C.xmasAfter : C.xmasAfterGuest) : signedIn ? C.after : C.afterGuest}
        </p>
        {}
        {bundle || pickMode || xmas ? null : (
          <p className="rm-pay__game">
            <LanternIcon />
            <span>{signedIn ? C.gameNote : C.gameNoteGuest}</span>
          </p>
        )}
        {inApp && (toss || dodo) ? (
          <p className="rm-pay__inapp">
            {C.inApp.note}
            {inApp.chrome ? (
              <>
                <br />
                <a href={inApp.chrome}>{C.inApp.open}</a>
              </>
            ) : null}
          </p>
        ) : null}
        {}
        <p className="rm-pay__notice">{pickMode ? PK.checkout.refundNotice : bundle ? B.refundNotice : C.refundNotice}</p>
        <p className="rm-pay__links">
          <a href="/terms" target="_blank" rel="noopener">
            {UI.common.links.terms}
          </a>
          <span aria-hidden="true"> · </span>
          <a href="/refund" target="_blank" rel="noopener">
            {UI.common.links.refund}
          </a>
        </p>
      </div>
      {}
      <div className="rm-paysheet__foot">
        {failed ? (
          <p className="rm-pay__error" role="alert">
            {C.failed}
          </p>
        ) : null}
        <label className="rm-pay__agree">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              agreedRef.current = e.target.checked;
              if (e.target.checked) track('checkout_agree', stat);
            }}
            disabled={paying}
          />
          <span>{bundle || pickMode ? B.agree : C.agree}</span>
        </label>
        <div className="rm-paysheet__row">
          {onPreview ? (
            <button type="button" className="dg-btn dg-btn--quiet rm-pay__preview" onClick={onPreview} disabled={paying}>
              {C.preview}
            </button>
          ) : null}
          <button type="button" className="dg-btn dg-btn--seal rm-pay__go" onClick={() => void pay()} disabled={paying || !agreed} aria-busy={paying}>
            {paying ? (
              C.paying
            ) : (
              <>
                {C.pay(price)}
                <ArrowRightIcon size={20} />
              </>
            )}
          </button>
        </div>
        {onPreview ? null : (
          <button type="button" className="dg-btn dg-btn--quiet" onClick={() => ref.current?.close()} disabled={paying}>
            {C.cancel}
          </button>
        )}
      </div>
    </dialog>
  );
}
