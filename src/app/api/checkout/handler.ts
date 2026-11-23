import { bearerToken } from '../../../lib/account/server';
import type { Lanterns } from '../../../lib/chat/lanterns';
import { BUNDLE_LANTERNS, BUNDLE_PRICES, BUNDLE_ROOM, bundlesOn } from '../../../lib/payments/bundle';
import {
  checkDodoPayment,
  createDodoCheckout,
  dodoBundleProduct,
  dodoFirstProduct,
  dodoOrderId,
  dodoPending,
  dodoPickProduct,
  dodoProduct,
  dodoReunionProduct,
  dodoXmasProduct,
  fetchDodoPayment,
  verifyDodoOrderId,
  type DodoServerConfig,
} from '../../../lib/payments/dodo';
import type { Locale } from '../../../content/locale';
import { FIRST_PRICES, firstPriceOn, NO_OFFERS, offersFor, parsePicks, PICK_PRICES, PICK_ROOM, type Offers } from '../../../lib/payments/offers';
import { checkPaddleTransaction, fetchPaddleTransaction, type PaddleCustomData } from '../../../lib/payments/paddle';
import {
  bundleKey,
  newOrderId,
  paidKey,
  paymentConfig,
  pickKey,
  PRICES,
  RECEIPT_TTL_MS,
  signReceipt,
  testProvider,
  type PaymentConfig,
  type PaymentProvider,
  type Currency,
  type Receipt,
} from '../../../lib/payments/payments';
import type { Ledger, OrderTie } from '../../../lib/payments/ledger';
import { cancelTossPayment, checkTossPayment, confirmTossPayment, tossOrderId, verifyTossOrderId, type TossPayment } from '../../../lib/payments/toss';
import { cleanEntry, cleanSid, type EventRow } from '../../../lib/analytics/events';
import type { MetaPurchase } from '../../../lib/analytics/meta-capi';
import type { RoomPayload } from '../../../lib/rooms/payload';
import { REUNION_PRICES } from '../../../lib/reunion/product';
import type { ProductKey } from '../../../lib/rooms/themes';
import { MAX_BODY_BYTES, parseRoomRequest } from '../../../lib/rooms/prompt';
import { isReadingOpen, type ReadingEnv } from '../reading/handler';
import { readBodyText } from '../waitlist/handler';
import { readXmasOffer } from '../../../lib/xmas/offer';
import { xmasOnSale } from '../../../lib/xmas/season';
import { XMAS_DEAL, XMAS_LIST, XMAS_ROOM } from '../../../lib/xmas/product';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function json(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

function metaPurchase(p: { sale: Sale; payload: RoomPayload; body: Record<string, unknown> }, orderId: string, amount: number, currency: string): MetaPurchase {
  const { sale } = p;
  const product = sale.pick ? 'pick' : sale.bundle ? 'bundle' : sale.room === XMAS_ROOM ? 'xmas' : p.payload.room;
  return { orderId, amount, currency, product, fbp: p.body.fbp, fbc: p.body.fbc };
}

interface CheckoutDeps {
  env: ReadingEnv;

  verifyUser?: (token: string) => Promise<string | null>;
  provider?: PaymentProvider;

  fetcher?: typeof fetch;
  now?: () => number;

  onConfirmed?: (row: EventRow) => void;

  onPurchase?: (p: MetaPurchase) => void;

  ledger?: Ledger;

  lanterns?: Lanterns;
}

type Prepared =
  | { ok: true; pay: Exclude<PaymentConfig, { mode: 'off' } | { mode: 'broken' } | { mode: 'skip' }>; uid: string | null; payload: RoomPayload; body: Record<string, unknown>; sale: Sale }
  | { ok: false; res: Response };

interface Sale {
  room: ProductKey | typeof BUNDLE_ROOM | typeof PICK_ROOM | typeof XMAS_ROOM;
  key: string;
  price: { amount: number; currency: string };

  xmasDeal?: boolean;

  bundle: boolean;

  pick: boolean;

  picks: ProductKey[] | null;

  first: boolean;
}

function saleOf(payload: RoomPayload, kind: 'room' | 'bundle' | 'pick', first = false, picks: ProductKey[] | null = null): Sale {
  if (kind === 'bundle') {
    const { amount, currency } = BUNDLE_PRICES[payload.locale];
    return { room: BUNDLE_ROOM, key: bundleKey(payload), price: { amount, currency }, bundle: true, pick: false, picks: null, first: false };
  }
  if (kind === 'pick' && picks) {
    const { amount, currency } = PICK_PRICES[payload.locale];
    return { room: PICK_ROOM, key: pickKey(payload, picks), price: { amount, currency }, bundle: true, pick: true, picks, first: false };
  }

  const regular = payload.room === 'reunion' ? REUNION_PRICES[payload.locale] : PRICES[payload.locale];
  const { amount, currency } = first ? FIRST_PRICES[payload.locale] : regular;
  return { room: payload.room, key: paidKey(payload), price: { amount, currency }, bundle: false, pick: false, picks: null, first };
}

function xmasPrice(locale: Locale, deal: boolean): { amount: number; currency: string } {
  return { amount: (deal ? XMAS_DEAL : XMAS_LIST)[locale].amount, currency: PRICES[locale].currency };
}

function xmasSale(payload: RoomPayload, deal: boolean): Sale {
  return { room: XMAS_ROOM, key: paidKey(payload), price: xmasPrice(payload.locale, deal), xmasDeal: deal, bundle: false, pick: false, picks: null, first: false };
}

function picksField(sale: Sale): { picks?: ProductKey[] } {
  return sale.picks ? { picks: sale.picks } : {};
}

function tieOf(
  sale: Sale,
  uid: string | null,
  first = sale.first,
  xmasDeal = sale.xmasDeal === true,
): { room: string; key: string; uid: string | null; first?: boolean; xmasDeal?: boolean } {
  return { room: sale.room, key: sale.key, uid, ...(first ? { first: true } : {}), ...(xmasDeal ? { xmasDeal: true } : {}) };
}

async function prepare(request: Request, deps: CheckoutDeps): Promise<Prepared> {

  const pay = paymentConfig(deps.env);
  if ((pay.mode !== 'test' && pay.mode !== 'paddle' && pay.mode !== 'toss' && pay.mode !== 'dodo') || !isReadingOpen(deps.env)) return { ok: false, res: json({ error: 'not_open' }, 503) };

  let uid: string | null = null;

  const token = bearerToken(request);
  if (deps.verifyUser && token) {
    uid = await deps.verifyUser(token);
    if (!uid) return { ok: false, res: json({ error: 'login_required' }, 401) };
  }

  if (!(request.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) {
    return { ok: false, res: json({ error: 'unsupported_media_type' }, 415) };
  }
  let text: string | null;
  try {
    text = await readBodyText(request, MAX_BODY_BYTES);
  } catch {
    return { ok: false, res: json({ error: 'invalid_json' }, 400) };
  }
  if (text === null) return { ok: false, res: json({ error: 'payload_too_large' }, 413) };
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, res: json({ error: 'invalid_json' }, 400) };
  }
  const parsed = parseRoomRequest(body);
  if (!parsed.ok) return { ok: false, res: json({ error: parsed.error }, 400) };
  const bundle = (body as Record<string, unknown>).bundle === true;
  const rawPick = (body as Record<string, unknown>).pick;
  const picks = rawPick === undefined ? null : parsePicks(rawPick);
  if (rawPick !== undefined && (picks === null || bundle)) return { ok: false, res: json({ error: 'invalid_body' }, 400) };

  const edition = (body as Record<string, unknown>).edition;
  if (edition !== undefined && edition !== 'xmas') return { ok: false, res: json({ error: 'invalid_body' }, 400) };
  if (edition === 'xmas') {
    if (parsed.payload.room !== 'love' || bundle || rawPick !== undefined) return { ok: false, res: json({ error: 'invalid_body' }, 400) };
    return { ok: true, pay, uid, payload: parsed.payload, body: body as Record<string, unknown>, sale: xmasSale(parsed.payload, false) };
  }
  if (bundle || picks) {

    if (parsed.payload.room !== 'life') return { ok: false, res: json({ error: 'invalid_body' }, 400) };
    if (uid === null && pay.mode !== 'test') return { ok: false, res: json({ error: 'login_required' }, 401) };
    if ((pay.mode === 'toss' || pay.mode === 'dodo') && (!deps.ledger || (bundle && !deps.lanterns))) return { ok: false, res: json({ error: 'not_open' }, 503) };
  }
  return { ok: true, pay, uid, payload: parsed.payload, body: body as Record<string, unknown>, sale: saleOf(parsed.payload, picks ? 'pick' : bundle ? 'bundle' : 'room', false, picks) };
}

export async function offersOf(ledger: Ledger | undefined, uid: string | null): Promise<Offers> {
  if (!ledger || !uid) return offersFor(null);
  return offersFor(await ledger.holdings(uid).catch(() => null));
}

export async function availableOffers(pay: PaymentConfig, ledger: Ledger | undefined, uid: string | null, locale: Locale): Promise<Offers> {
  if (pay.mode !== 'toss' && pay.mode !== 'dodo') return NO_OFFERS;
  if (locale === 'ko') return pay.mode === 'toss' ? offersOf(ledger, uid) : NO_OFFERS;
  const dodo = pay.dodo;
  if (!dodo) return NO_OFFERS;
  const o = await offersOf(ledger, uid);
  return { first: o.first && dodoFirstProduct(dodo, locale) !== null };
}

async function priced(p: Extract<Prepared, { ok: true }>, deps: CheckoutDeps): Promise<Prepared> {
  if (p.pay.mode !== 'toss' && p.pay.mode !== 'dodo') return p;

  if (p.sale.bundle || p.sale.room === XMAS_ROOM) return p;

  if (!firstPriceOn(deps.env)) return p;
  const offers = await availableOffers(p.pay, deps.ledger, p.uid, p.payload.locale);
  return offers.first ? { ...p, sale: saleOf(p.payload, 'room', true) } : p;
}

async function openOrder(
  deps: CheckoutDeps,
  fresh: string,
  tie: OrderTie,
  matches: (orderId: string) => Promise<boolean>,
): Promise<Awaited<ReturnType<Ledger['open']>> | undefined> {
  const opened = await deps.ledger?.open(fresh, tie);
  if (opened && opened.status === 'ready' && opened.orderId !== fresh && !(await matches(opened.orderId))) {
    await deps.ledger?.record({ orderId: opened.orderId, status: 'failed', cancelReason: 'dangol: plan_changed', tie });
    return deps.ledger?.open(fresh, tie);
  }
  return opened;
}

async function issueReceipt(fields: Omit<Receipt, 'v' | 'exp'>, secret: string, now: number): Promise<string> {
  return signReceipt({ v: 1, ...fields, exp: now + RECEIPT_TTL_MS }, secret);
}

async function receiptResponse(fields: Omit<Receipt, 'v' | 'exp'>, secret: string, now: number, extra: Record<string, unknown> = {}): Promise<Response> {
  const receipt = await issueReceipt(fields, secret, now);
  return json({ receipt, order: fields.order, amount: fields.amount, currency: fields.currency, ...extra }, 200);
}

function siteOrigin(request: Request, env: ReadingEnv): string {
  const site = (env as Record<string, string | undefined>).NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
  if (site && /^https?:\/\/[^/\s]+$/i.test(site)) return site;
  return new URL(request.url).origin;
}

async function paidAgain(
  opened: NonNullable<Awaited<ReturnType<Ledger['open']>>>,
  provider: 'toss' | 'dodo',
  sale: Sale,
  p: Extract<Prepared, { ok: true }>,
  secret: string,
  deps: CheckoutDeps,
): Promise<Response | null> {
  if (opened.status !== 'paid' || opened.approvedAt === null) return null;
  const now = (deps.now ?? Date.now)();
  const base = Math.min(opened.approvedAt, now);
  if (now - base >= RECEIPT_TTL_MS) return null;
  const amount = opened.amount ?? sale.price.amount;
  const currency = opened.currency ?? sale.price.currency;
  const receipt = await issueReceipt({ order: opened.orderId, provider, room: sale.room, ...picksField(sale), key: sale.key, uid: p.uid, amount, currency }, secret, base);
  return json({ provider, paid: true, receipt, order: opened.orderId, amount, currency, ...(await bundleExtras(sale, deps, opened.orderId)) }, 200);
}

async function grantBundle(deps: CheckoutDeps, orderId: string): Promise<{ balance: number | null } | null> {
  const r = await deps.lanterns?.bundleGrant(orderId, BUNDLE_LANTERNS).catch(() => null);
  return r && (r.granted > 0 || r.reason === 'already') ? { balance: r.balance } : null;
}

async function bundleExtras(sale: Sale, deps: CheckoutDeps, orderId: string): Promise<Record<string, unknown>> {
  if (!sale.bundle) return {};
  if (sale.pick) return { bundle: true, pick: true };
  return { bundle: true, lanterns: (await grantBundle(deps, orderId)) ?? null };
}

function dodoProductOf(dodo: DodoServerConfig, locale: string, sale: Sale, first: boolean, xmasDeal = sale.xmasDeal === true): string | null {
  if (sale.room === XMAS_ROOM) return dodoXmasProduct(dodo, locale, xmasDeal);
  if (sale.pick) return dodoPickProduct(dodo, locale);
  if (sale.bundle) return dodoBundleProduct(dodo, locale);

  if (first) return dodoFirstProduct(dodo, locale);

  return sale.room === 'reunion' ? dodoReunionProduct(dodo, locale) : dodoProduct(dodo, locale);
}

async function startDodo(request: Request, p: Extract<Prepared, { ok: true }>, secret: string, dodo: DodoServerConfig, deps: CheckoutDeps): Promise<Response> {
  const { sale } = p;
  const locale = p.payload.locale;
  const productId = dodoProductOf(dodo, locale, sale, sale.first);
  if (!productId) return json({ error: 'not_open' }, 503);
  const fresh = await dodoOrderId(secret, tieOf(sale, p.uid));
  const opened = await openOrder(deps, fresh, { room: sale.room, locale, key: sale.key, uid: p.uid, ...sale.price }, (id) => verifyDodoOrderId(secret, id, tieOf(sale, p.uid)));
  const again = opened ? await paidAgain(opened, 'dodo', sale, p, secret, deps) : null;
  if (again) return again;

  const orderId = opened?.status === 'ready' ? opened.orderId : fresh;
  const origin = siteOrigin(request, deps.env);
  const session = await createDodoCheckout(
    dodo,
    {
      productId,
      orderId,
      room: sale.room,
      locale,

      returnUrl: sale.bundle ? `${origin}/bundle/read` : `${origin}/room/${p.payload.room}/read`,

      cancelUrl: sale.pick
        ? `${origin}/bundle?plan=pick&dodo=cancel`
        : sale.bundle
          ? `${origin}/bundle?dodo=cancel`
          : sale.room === XMAS_ROOM
            ? `${origin}/xmas/result?dodo=cancel`
            : `${origin}/room/${p.payload.room}?dodo=cancel`,
    },
    deps.fetcher,
  );
  if (!session.ok) return json({ error: 'payment_unavailable', code: session.code }, 502);
  return json({ provider: 'dodo', checkoutUrl: session.url, orderId, ...sale.price, ...(sale.bundle ? { bundle: true } : {}), ...(sale.pick ? { pick: true } : {}) }, 200);
}

export async function handleCheckoutPost(request: Request, deps: CheckoutDeps): Promise<Response> {
  const prepared = await prepare(request, deps);
  if (!prepared.ok) return prepared.res;

  if (prepared.sale.bundle && !bundlesOn(deps.env)) return json({ error: 'closed' }, 410);

  if (prepared.sale.room === XMAS_ROOM && !xmasOnSale((deps.now ?? Date.now)())) return json({ error: 'closed' }, 410);

  const xmasReady =
    prepared.sale.room === XMAS_ROOM &&
    (prepared.payload.quiz !== undefined || (await readXmasOffer(prepared.body.offer, prepared.pay.secret, (deps.now ?? Date.now)())) !== null)
      ? { ...prepared, sale: xmasSale(prepared.payload, true) }
      : prepared;

  const p = await priced(xmasReady, deps);
  if (!p.ok) return p.res;
  const { sale } = p;

  if (p.pay.mode === 'paddle') {

    if (sale.room === XMAS_ROOM) return json({ error: 'not_open' }, 503);

    if (sale.bundle) return json({ error: 'not_open' }, 503);

    const customData: PaddleCustomData = { room: p.payload.room, key: sale.key, uid: p.uid };
    return json({ provider: 'paddle', priceId: p.pay.paddle.priceId, customData }, 200);
  }

  if (p.pay.mode === 'dodo' || (p.pay.mode === 'toss' && p.payload.locale !== 'ko')) {
    const dodo = p.pay.mode === 'dodo' ? p.pay.dodo : p.pay.mode === 'toss' ? p.pay.dodo : undefined;
    if (!dodo) return json({ error: 'not_open' }, 503);
    return startDodo(request, p, p.pay.secret, dodo, deps);
  }

  if (p.pay.mode === 'toss') {

    if (p.payload.locale !== 'ko') return json({ error: 'not_open' }, 503);
    const secret = p.pay.secret;
    const fresh = await tossOrderId(secret, tieOf(sale, p.uid));
    const opened = await openOrder(deps, fresh, { room: sale.room, locale: 'ko', key: sale.key, uid: p.uid, ...sale.price }, (id) => verifyTossOrderId(secret, id, tieOf(sale, p.uid)));

    const again = opened ? await paidAgain(opened, 'toss', sale, p, secret, deps) : null;
    if (again) return again;

    const orderId = opened?.status === 'ready' ? opened.orderId : fresh;
    return json({ provider: 'toss', orderId, ...sale.price, ...(sale.bundle ? { bundle: true } : {}), ...(sale.pick ? { pick: true } : {}) }, 200);
  }

  const price = sale.price;
  const order = newOrderId();
  const provider = deps.provider ?? testProvider;
  if (!(await provider.confirm({ orderId: order, amount: price.amount, currency: price.currency as Currency }))) return json({ error: 'payment_failed' }, 402);
  return receiptResponse({ order, provider: 'test', room: sale.room, ...picksField(sale), key: sale.key, uid: p.uid, ...price }, p.pay.secret, (deps.now ?? Date.now)());
}

async function confirmDodo(p: Extract<Prepared, { ok: true }>, secret: string, dodo: DodoServerConfig, deps: CheckoutDeps): Promise<Response> {
  const { sale } = p;
  const room = p.payload.room;
  const locale = p.payload.locale;
  const xmas = sale.room === XMAS_ROOM;

  if (!xmas && !dodoProductOf(dodo, locale, sale, false)) return json({ error: 'not_open' }, 503);
  const paymentId = typeof p.body.paymentId === 'string' ? p.body.paymentId : '';
  const r = await fetchDodoPayment(dodo, paymentId, deps.fetcher);
  if (!r.ok) return r.code === 'not_found' || r.code === 'invalid' ? json({ error: 'payment_failed', code: r.code }, 402) : json({ error: 'payment_unavailable', code: r.code }, 502);
  const pay = r.payment;

  if (dodoPending(pay)) return json({ error: 'pending' }, 409);
  const orderId = pay.orderId ?? '';

  const first = !sale.bundle && !xmas && (await verifyDodoOrderId(secret, orderId, tieOf(sale, p.uid, true)));
  const xmasDeal = xmas && (await verifyDodoOrderId(secret, orderId, tieOf(sale, p.uid, false, true)));
  if (!first && !xmasDeal && !(await verifyDodoOrderId(secret, orderId, tieOf(sale, p.uid, false, false)))) return json({ error: 'payment_failed', code: 'mismatch' }, 402);
  const productId = dodoProductOf(dodo, locale, sale, first, xmasDeal);
  if (!productId) return json({ error: 'not_open' }, 503);
  if (!checkDodoPayment(pay, { orderId, productId })) return json({ error: 'payment_failed', code: pay.status === 'succeeded' ? 'mismatch' : pay.status }, 402);
  const now = (deps.now ?? Date.now)();
  const created = Date.parse(pay.createdAt ?? '');
  const base = Number.isFinite(created) ? Math.min(created, now) : now;
  if (now - base >= RECEIPT_TTL_MS) return json({ error: 'payment_failed', code: 'expired' }, 402);

  const price = first ? FIRST_PRICES[locale] : xmas ? xmasPrice(locale, xmasDeal) : sale.price;
  const tie: OrderTie = { room: sale.room, locale, key: sale.key, uid: p.uid, ...price };
  try {
    await deps.ledger?.record({ orderId, status: 'paid', paymentKey: pay.paymentId, approvedAt: base, method: 'dodo', tie });
    const res = await receiptResponse(
      { order: orderId, provider: 'dodo', room: sale.room, ...picksField(sale), key: sale.key, uid: p.uid, amount: pay.totalAmount, currency: pay.currency },
      secret,
      base,
      await bundleExtras(sale, deps, orderId),
    );
    const entry = cleanEntry(p.body.entry);
    deps.onConfirmed?.({
      name: 'pay_confirmed',
      sid: cleanSid(p.body.sid),
      room: sale.bundle ? null : room,
      locale,
      path: null,
      utm: null,
      props: { provider: 'dodo', amount: pay.totalAmount, currency: pay.currency, ...(sale.bundle ? { bundle: 1 } : {}), ...(sale.pick ? { pick: 1 } : {}), ...(first ? { first: 1 } : {}), ...(xmas ? { xmas: 1 } : {}), ...(entry ? { entry } : {}) },
    });
    deps.onPurchase?.(metaPurchase(p, orderId, pay.totalAmount, pay.currency));
    return res;
  } catch {

    await deps.ledger?.record({ orderId, status: 'failed', paymentKey: pay.paymentId, cancelReason: 'dangol: receipt_failed', tie }).catch(() => undefined);
    return json({ error: 'payment_failed', code: 'receipt_failed' }, 402);
  }
}

async function confirmToss(
  p: Extract<Prepared, { ok: true }>,
  pay: Extract<PaymentConfig, { mode: 'toss' }>,
  deps: CheckoutDeps,
): Promise<Response> {
  const { sale } = p;
  const room = p.payload.room;
  const paymentKey = typeof p.body.paymentKey === 'string' ? p.body.paymentKey : '';
  const orderId = typeof p.body.orderId === 'string' ? p.body.orderId : '';
  if (p.payload.locale !== 'ko') return json({ error: 'payment_failed', code: 'mismatch' }, 402);

  const xmas = sale.room === XMAS_ROOM;
  const first = !sale.bundle && !xmas && (await verifyTossOrderId(pay.secret, orderId, tieOf(sale, p.uid, true)));
  const xmasDeal = xmas && (await verifyTossOrderId(pay.secret, orderId, tieOf(sale, p.uid, false, true)));
  if (!first && !xmasDeal && !(await verifyTossOrderId(pay.secret, orderId, tieOf(sale, p.uid, false, false)))) return json({ error: 'payment_failed', code: 'mismatch' }, 402);
  const price = first ? FIRST_PRICES.ko : xmas ? xmasPrice('ko', xmasDeal) : sale.price;
  if (p.body.amount !== price.amount) return json({ error: 'payment_failed', code: 'mismatch' }, 402);
  if (first && p.uid !== null) {

    const h = await deps.ledger?.holdings(p.uid, orderId).catch(() => null);
    if (h && !offersFor(h).first) return json({ error: 'payment_failed', code: 'promo_used' }, 402);
  }

  const tie: OrderTie = { room: sale.room, locale: 'ko', key: sale.key, uid: p.uid, ...price };
  const r = await confirmTossPayment(pay.toss, { paymentKey, orderId, amount: price.amount }, deps.fetcher);
  if (!r.ok) return json({ error: 'payment_failed', code: r.code }, 402);
  if (!checkTossPayment(r.payment, { orderId, amount: price.amount })) {

    if (r.payment.status === 'DONE' && r.payment.orderId === orderId) await refund(pay, deps, r.payment, tie, 'amount_mismatch');
    return json({ error: 'payment_failed', code: 'mismatch' }, 402);
  }

  const now = (deps.now ?? Date.now)();
  const approved = Date.parse(r.payment.approvedAt ?? '');
  const base = Number.isFinite(approved) ? Math.min(approved, now) : now;
  if (now - base >= RECEIPT_TTL_MS) return json({ error: 'payment_failed', code: 'expired' }, 402);

  try {

    await deps.ledger?.record({
      orderId,
      status: 'paid',
      paymentKey: r.payment.paymentKey,
      approvedAt: Number.isFinite(approved) ? approved : base,
      method: r.payment.method,
      tie,
    });
    const res = await receiptResponse(
      { order: orderId, provider: 'toss', room: sale.room, ...picksField(sale), key: sale.key, uid: p.uid, amount: r.payment.totalAmount, currency: r.payment.currency },
      pay.secret,
      base,
      await bundleExtras(sale, deps, orderId),
    );

    const entry = cleanEntry(p.body.entry);
    deps.onConfirmed?.({
      name: 'pay_confirmed',
      sid: cleanSid(p.body.sid),
      room: sale.bundle ? null : room,
      locale: 'ko',
      path: null,
      utm: null,
      props: { provider: 'toss', amount: r.payment.totalAmount, currency: r.payment.currency, method: r.payment.method ?? '', ...(sale.bundle ? { bundle: 1 } : {}), ...(sale.pick ? { pick: 1 } : {}), ...(first ? { first: 1 } : {}), ...(xmas ? { xmas: 1 } : {}), ...(entry ? { entry } : {}) },
    });
    deps.onPurchase?.(metaPurchase(p, orderId, r.payment.totalAmount, r.payment.currency));
    return res;
  } catch {

    const refunded = await refund(pay, deps, r.payment, tie, 'receipt_failed');
    return json({ error: 'payment_failed', code: refunded ? 'refunded' : 'receipt_failed' }, 402);
  }
}

async function refund(
  pay: Extract<PaymentConfig, { mode: 'toss' }>,
  deps: CheckoutDeps,
  payment: TossPayment,
  tie: OrderTie,
  why: string,
): Promise<boolean> {
  const c = await cancelTossPayment(pay.toss, payment.paymentKey, `dangol: ${why}`, deps.fetcher);
  if (!c.ok) return false;
  await deps.ledger?.record({ orderId: payment.orderId, status: 'canceled', paymentKey: payment.paymentKey, cancelReason: `dangol: ${why}`, tie });
  return true;
}

export async function handleCheckoutConfirm(request: Request, deps: CheckoutDeps): Promise<Response> {
  const p = await prepare(request, deps);
  if (!p.ok) return p.res;

  if (p.pay.mode === 'dodo' || (p.pay.mode === 'toss' && p.payload.locale !== 'ko')) {
    const dodo = p.pay.mode === 'dodo' ? p.pay.dodo : p.pay.mode === 'toss' ? p.pay.dodo : undefined;
    return dodo ? confirmDodo(p, p.pay.secret, dodo, deps) : json({ error: 'not_open' }, 503);
  }
  if (p.pay.mode === 'toss') return confirmToss(p, p.pay, deps);
  if (p.pay.mode !== 'paddle' || p.sale.bundle || p.sale.room === XMAS_ROOM) return json({ error: 'not_open' }, 503);
  const transactionId = typeof p.body.transactionId === 'string' ? p.body.transactionId : '';
  const tx = await fetchPaddleTransaction(p.pay.paddle, transactionId, deps.fetcher);
  if (!tx) return json({ error: 'payment_failed' }, 402);

  const room = p.payload.room;
  const key = paidKey(p.payload);
  const check = checkPaddleTransaction(tx, { room, key, uid: p.uid, priceId: p.pay.paddle.priceId });
  if (check === 'pending') return json({ error: 'pending' }, 409);
  if (check !== 'ok') return json({ error: 'payment_failed' }, 402);
  return receiptResponse(
    { order: tx.id, provider: 'paddle', room, key, uid: p.uid, amount: tx.total, currency: tx.currency },
    p.pay.secret,
    (deps.now ?? Date.now)(),
  );
}
