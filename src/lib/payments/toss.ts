import { hmacB64url } from './payments';

export interface TossServerConfig {

  secretKey: string;

  clientKey: string;
}

export interface TossPayment {
  paymentKey: string;
  orderId: string;

  status: string;
  totalAmount: number;
  currency: string;

  method: string | null;

  approvedAt: string | null;

  cancelReason: string | null;
}

const API = 'https://api.tosspayments.com/v1/payments';

interface OrderTie {
  room: string;
  key: string;
  uid: string | null;

  first?: boolean;

  xmasDeal?: boolean;
}

const tie = (rand: string, t: OrderTie) => `${rand}|${t.room}|${t.key}|${t.uid ?? ''}${t.first ? '|first' : ''}${t.xmasDeal ? '|xmas-deal' : ''}`;

export async function tossOrderId(secret: string, t: OrderTie): Promise<string> {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');
  return `dg_${rand}_${(await hmacB64url(secret, tie(rand, t))).slice(0, 22)}`;
}

export async function verifyTossOrderId(secret: string, orderId: string, t: OrderTie): Promise<boolean> {
  const m = /^dg_([0-9a-f]{16})_([A-Za-z0-9_-]{22})$/.exec(orderId);
  if (!m) return false;
  return (await hmacB64url(secret, tie(m[1], t))).slice(0, 22) === m[2];
}

function readPayment(v: unknown): TossPayment | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as Record<string, unknown>;
  if (typeof p.paymentKey !== 'string' || typeof p.orderId !== 'string' || typeof p.status !== 'string') return null;
  if (typeof p.totalAmount !== 'number' || typeof p.currency !== 'string') return null;
  return {
    paymentKey: p.paymentKey,
    orderId: p.orderId,
    status: p.status,
    totalAmount: p.totalAmount,
    currency: p.currency,
    method: typeof p.method === 'string' ? p.method : null,
    approvedAt: typeof p.approvedAt === 'string' ? p.approvedAt : null,
    cancelReason: lastCancelReason(p.cancels),
  };
}

function lastCancelReason(cancels: unknown): string | null {
  if (!Array.isArray(cancels) || cancels.length === 0) return null;
  const last: unknown = cancels[cancels.length - 1];
  const reason = last && typeof last === 'object' ? (last as { cancelReason?: unknown }).cancelReason : null;
  return typeof reason === 'string' ? reason.slice(0, 200) : null;
}

export async function confirmTossPayment(
  cfg: TossServerConfig,
  body: { paymentKey: string; orderId: string; amount: number },
  fetcher: typeof fetch = fetch,
): Promise<{ ok: true; payment: TossPayment } | { ok: false; code: string }> {
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(body.paymentKey)) return { ok: false, code: 'invalid' };
  const headers = { Authorization: `Basic ${btoa(`${cfg.secretKey}:`)}`, 'Content-Type': 'application/json' };
  try {
    const res = await fetcher(`${API}/confirm`, { method: 'POST', headers, body: JSON.stringify(body) });
    const v: unknown = await res.json().catch(() => null);
    if (res.ok) {
      const payment = readPayment(v);
      return payment ? { ok: true, payment } : { ok: false, code: 'invalid' };
    }
    const code = v && typeof v === 'object' && typeof (v as { code?: unknown }).code === 'string' ? (v as { code: string }).code : `http_${res.status}`;
    if (code !== 'ALREADY_PROCESSED_PAYMENT') return { ok: false, code };
    const again = await fetcher(`${API}/${encodeURIComponent(body.paymentKey)}`, { headers });
    const payment = again.ok ? readPayment(await again.json().catch(() => null)) : null;
    return payment ? { ok: true, payment } : { ok: false, code };
  } catch {
    return { ok: false, code: 'network' };
  }
}

export function checkTossPayment(p: TossPayment, want: { orderId: string; amount: number }): boolean {
  return p.status === 'DONE' && p.orderId === want.orderId && p.totalAmount === want.amount && p.currency === 'KRW';
}

const authHeaders = (cfg: TossServerConfig) => ({ Authorization: `Basic ${btoa(`${cfg.secretKey}:`)}`, 'Content-Type': 'application/json' });

function tossErrorCode(v: unknown, status: number): string {
  return v && typeof v === 'object' && typeof (v as { code?: unknown }).code === 'string' ? (v as { code: string }).code : `http_${status}`;
}

export async function fetchTossPayment(
  cfg: TossServerConfig,
  paymentKey: string,
  fetcher: typeof fetch = fetch,
): Promise<{ ok: true; payment: TossPayment } | { ok: false; code: string }> {
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(paymentKey)) return { ok: false, code: 'invalid' };
  try {
    const res = await fetcher(`${API}/${encodeURIComponent(paymentKey)}`, { headers: authHeaders(cfg) });
    const v: unknown = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, code: tossErrorCode(v, res.status) };
    const payment = readPayment(v);
    return payment ? { ok: true, payment } : { ok: false, code: 'invalid' };
  } catch {
    return { ok: false, code: 'network' };
  }
}

export async function cancelTossPayment(
  cfg: TossServerConfig,
  paymentKey: string,
  reason: string,
  fetcher: typeof fetch = fetch,
): Promise<{ ok: true; payment: TossPayment } | { ok: false; code: string }> {
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(paymentKey)) return { ok: false, code: 'invalid' };
  try {
    const res = await fetcher(`${API}/${encodeURIComponent(paymentKey)}/cancel`, {
      method: 'POST',
      headers: { ...authHeaders(cfg), 'Idempotency-Key': `dangol-cancel-${paymentKey}`.slice(0, 300) },
      body: JSON.stringify({ cancelReason: reason.slice(0, 200) }),
    });
    const v: unknown = await res.json().catch(() => null);
    if (res.ok) {
      const payment = readPayment(v);
      return payment ? { ok: true, payment } : { ok: false, code: 'invalid' };
    }
    const code = tossErrorCode(v, res.status);
    if (code === 'ALREADY_CANCELED_PAYMENT') return fetchTossPayment(cfg, paymentKey, fetcher);
    return { ok: false, code };
  } catch {
    return { ok: false, code: 'network' };
  }
}
