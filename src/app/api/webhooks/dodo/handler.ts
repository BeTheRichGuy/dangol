import type { Lanterns } from '../../../../lib/chat/lanterns';
import { BUNDLE_LANTERNS } from '../../../../lib/payments/bundle';
import { makeLedger, type Ledger } from '../../../../lib/payments/ledger';
import { fetchDodoPayment, isOurDodoProduct, orderStatusFromDodo, verifyDodoWebhook } from '../../../../lib/payments/dodo';
import { paymentConfig, type PaymentEnv } from '../../../../lib/payments/payments';
import { readBodyText } from '../../waitlist/handler';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;
const MAX_BYTES = 64 * 1024;

const json = (body: Record<string, unknown>, status: number) => Response.json(body, { status, headers: NO_STORE });

export interface DodoWebhookDeps {
  env: PaymentEnv & Record<string, string | undefined>;
  fetcher?: typeof fetch;
  now?: () => number;

  ledger?: Ledger;

  lanterns?: Lanterns;
}

export async function handleDodoWebhook(request: Request, deps: DodoWebhookDeps): Promise<Response> {
  const cfg = paymentConfig(deps.env);
  const dodo = cfg.mode === 'dodo' || cfg.mode === 'toss' ? cfg.dodo : undefined;
  if (!dodo?.webhookSecret) return json({ error: 'not_open' }, 503);

  let text: string | null;
  try {
    text = await readBodyText(request, MAX_BYTES);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (text === null) return json({ error: 'payload_too_large' }, 413);
  const signed = await verifyDodoWebhook(
    dodo.webhookSecret,
    { id: request.headers.get('webhook-id'), timestamp: request.headers.get('webhook-timestamp'), signature: request.headers.get('webhook-signature') },
    text,
    (deps.now ?? Date.now)(),
  );
  if (!signed) return json({ error: 'bad_signature' }, 401);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const b = (body && typeof body === 'object' ? body : {}) as { type?: unknown; data?: { payment_id?: unknown } };
  const paymentId = typeof b.data?.payment_id === 'string' ? b.data.payment_id : '';
  if (typeof b.type !== 'string' || !paymentId) return json({ ok: true, ignored: true }, 200);

  const r = await fetchDodoPayment(dodo, paymentId, deps.fetcher);
  if (!r.ok) {

    return r.code === 'not_found' || r.code === 'invalid' ? json({ ok: true, ignored: true }, 200) : json({ error: 'lookup_failed' }, 500);
  }
  const p = r.payment;
  const status = orderStatusFromDodo(p);

  if (!p.orderId?.startsWith('dd_') || !status || !isOurDodoProduct(dodo, p.productIds)) return json({ ok: true, ignored: true }, 200);

  const ledger = deps.ledger ?? makeLedger(deps.env, deps.fetcher);
  if (!ledger) return json({ ok: true, recorded: false }, 200);
  const created = Date.parse(p.createdAt ?? '');
  const ok = await ledger.record({
    orderId: p.orderId,
    status,
    paymentKey: p.paymentId,
    approvedAt: Number.isFinite(created) ? created : null,
    method: 'dodo',
    cancelReason: status === 'canceled' || status === 'partial_canceled' ? 'dodo: refunded' : null,
    tie: { amount: p.totalAmount, currency: p.currency },
  });
  if (!ok) return json({ error: 'record_failed' }, 500);
  if (status === 'paid') await deps.lanterns?.bundleGrant(p.orderId, BUNDLE_LANTERNS).catch(() => null);
  return json({ ok: true, recorded: true }, 200);
}
