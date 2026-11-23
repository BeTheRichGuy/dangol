import type { Lanterns } from '../../../../lib/chat/lanterns';
import { BUNDLE_LANTERNS } from '../../../../lib/payments/bundle';
import { makeLedger, orderStatusFromToss, type Ledger } from '../../../../lib/payments/ledger';
import { paymentConfig, type PaymentEnv } from '../../../../lib/payments/payments';
import { fetchTossPayment } from '../../../../lib/payments/toss';
import { readBodyText } from '../../waitlist/handler';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;
const EVENTS = new Set(['PAYMENT_STATUS_CHANGED', 'CANCEL_STATUS_CHANGED']);
const MAX_BYTES = 32 * 1024;

const json = (body: Record<string, unknown>, status: number) => Response.json(body, { status, headers: NO_STORE });

export interface TossWebhookDeps {
  env: PaymentEnv & Record<string, string | undefined>;
  fetcher?: typeof fetch;

  ledger?: Ledger;

  lanterns?: Lanterns;
}

export async function handleTossWebhook(request: Request, deps: TossWebhookDeps): Promise<Response> {
  const pay = paymentConfig(deps.env);
  if (pay.mode !== 'toss') return json({ error: 'not_open' }, 503);

  let body: unknown;
  try {
    const text = await readBodyText(request, MAX_BYTES);
    if (text === null) return json({ error: 'payload_too_large' }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const b = (body && typeof body === 'object' ? body : {}) as { eventType?: unknown; data?: { paymentKey?: unknown } };
  const paymentKey = typeof b.data?.paymentKey === 'string' ? b.data.paymentKey : '';
  if (typeof b.eventType !== 'string' || !EVENTS.has(b.eventType) || !paymentKey) return json({ ok: true, ignored: true }, 200);

  const r = await fetchTossPayment(pay.toss, paymentKey, deps.fetcher);
  if (!r.ok) {

    return r.code === 'NOT_FOUND_PAYMENT' || r.code === 'invalid' ? json({ ok: true, ignored: true }, 200) : json({ error: 'lookup_failed' }, 500);
  }
  const p = r.payment;
  const status = orderStatusFromToss(p.status);

  if (!p.orderId.startsWith('dg_') || !status) return json({ ok: true, ignored: true }, 200);

  const ledger = deps.ledger ?? makeLedger(deps.env, deps.fetcher);
  if (!ledger) return json({ ok: true, recorded: false }, 200);
  const approved = Date.parse(p.approvedAt ?? '');
  const ok = await ledger.record({
    orderId: p.orderId,
    status,
    paymentKey: p.paymentKey,
    approvedAt: Number.isFinite(approved) ? approved : null,
    method: p.method,
    cancelReason: p.cancelReason,
    tie: { amount: p.totalAmount, currency: p.currency },
  });
  if (!ok) return json({ error: 'record_failed' }, 500);

  if (status === 'paid') await deps.lanterns?.bundleGrant(p.orderId, BUNDLE_LANTERNS).catch(() => null);
  return json({ ok: true, recorded: true }, 200);
}
