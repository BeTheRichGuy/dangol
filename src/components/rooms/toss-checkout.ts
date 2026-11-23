'use client';

import { ANONYMOUS, loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { currentSid } from '@/lib/analytics/track';
import { metaIdsForConfirm } from '../meta-pixel';
import { tossWindowTarget } from '@/lib/payments/toss-window';
import type { RoomPayload } from '@/lib/rooms/payload';
import type { ProductKey } from '@/lib/rooms/themes';
import { entryOf } from './continue';

function authHeaders(token: string | null): Record<string, string> {
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export function saleBody(
  payload: RoomPayload,
  sale: { bundle?: boolean; pick?: readonly ProductKey[]; edition?: 'xmas'; offer?: string },
): RoomPayload & { bundle?: true; pick?: ProductKey[]; edition?: 'xmas'; offer?: string } {
  if (sale.edition === 'xmas') return { ...payload, edition: 'xmas', ...(sale.offer ? { offer: sale.offer } : {}) };
  return { ...payload, ...(sale.pick ? { pick: [...sale.pick] } : sale.bundle ? { bundle: true as const } : {}) };
}

export async function startTossPayment(opts: {
  payload: RoomPayload;
  token: string | null;
  room: ProductKey;
  orderName: string;

  beforeRedirect: () => void;

  bundle?: boolean;

  pick?: readonly ProductKey[];

  edition?: 'xmas';
  offer?: string;
}): Promise<'cancel' | { receipt: string }> {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim();
  if (!clientKey) throw new Error('toss_unavailable');
  const res = await fetch('/api/checkout', { method: 'POST', headers: authHeaders(opts.token), body: JSON.stringify(saleBody(opts.payload, opts)) });
  const v = (await res.json().catch(() => ({}))) as { provider?: unknown; orderId?: unknown; amount?: unknown; paid?: unknown; receipt?: unknown };

  if (res.ok && v.provider === 'toss' && v.paid === true && typeof v.receipt === 'string') return { receipt: v.receipt };
  if (!res.ok || v.provider !== 'toss' || typeof v.orderId !== 'string' || typeof v.amount !== 'number') throw new Error('checkout');

  opts.beforeRedirect();
  const toss = await loadTossPayments(clientKey);
  const payment = toss.payment({ customerKey: ANONYMOUS });
  const origin = window.location.origin;

  const windowTarget = tossWindowTarget(window.innerWidth);
  try {
    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: v.amount },
      orderId: v.orderId,
      orderName: opts.orderName.slice(0, 100),
      successUrl: opts.bundle || opts.pick ? `${origin}/bundle/read` : `${origin}/room/${opts.room}/read`,

      failUrl: opts.pick
        ? `${origin}/bundle?plan=pick&toss=fail`
        : opts.bundle
          ? `${origin}/bundle?toss=fail`
          : opts.edition === 'xmas'
            ? `${origin}/xmas/result?toss=fail`
            : `${origin}/room/${opts.room}?toss=fail`,
      ...(windowTarget ? { windowTarget } : {}),
    });
  } catch (e) {
    const code = (e as { code?: unknown })?.code;
    if (code === 'USER_CANCEL' || code === 'PAY_PROCESS_CANCELED') return 'cancel';
    throw e;
  }
  return 'cancel';
}

export interface TossReturn {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export function tossReturn(search: string): TossReturn | null {
  const q = new URLSearchParams(search);
  const paymentKey = q.get('paymentKey');
  const orderId = q.get('orderId');
  const amount = Number(q.get('amount'));
  if (!paymentKey || !orderId || !Number.isFinite(amount)) return null;
  return { paymentKey, orderId, amount };
}

export function tossFailure(search: string): string | null {
  const q = new URLSearchParams(search);
  return q.get('toss') === 'fail' ? (q.get('code') ?? 'unknown').slice(0, 60) : null;
}

export type BundleLanterns = { balance: number | null } | null;

export async function confirmToss(
  payload: RoomPayload,
  ret: TossReturn,
  token: string | null,
  bundle?: { onLanterns?: (l: BundleLanterns) => void; pick?: readonly ProductKey[] },

  edition?: 'xmas',
): Promise<string> {

  const meta = { sid: currentSid(), entry: entryOf(payload.room), ...metaIdsForConfirm() };
  const res = await fetch('/api/checkout/confirm', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ ...saleBody(payload, { bundle: Boolean(bundle), pick: bundle?.pick, edition }), ...ret, ...meta }),
  });
  const v = (await res.json().catch(() => ({}))) as { receipt?: unknown; code?: unknown; lanterns?: unknown };
  if (res.ok && typeof v.receipt === 'string') {
    bundle?.onLanterns?.(readLanterns(v.lanterns));
    return v.receipt;
  }
  throw Object.assign(new Error('confirm'), { code: typeof v.code === 'string' ? v.code : `http_${res.status}`, status: res.status });
}

export function readLanterns(v: unknown): BundleLanterns {
  if (!v || typeof v !== 'object') return null;
  const balance = (v as { balance?: unknown }).balance;
  return { balance: typeof balance === 'number' && Number.isFinite(balance) ? balance : null };
}
