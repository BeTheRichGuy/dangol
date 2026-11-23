import { serverAuthEnv } from '../account/server';
import type { Holdings } from './offers';

export interface LedgerConfig {
  url: string;
  key: string;
  secret: string;
}

export function ledgerConfig(env: Record<string, string | undefined>): LedgerConfig | null {
  const auth = serverAuthEnv(env);
  const secret = env.LEDGER_SECRET?.trim() ?? '';
  if (!auth || secret.length < 32) return null;
  return { url: auth.url.replace(/\/+$/, ''), key: auth.key, secret };
}

export type OrderStatus = 'ready' | 'paid' | 'canceled' | 'partial_canceled' | 'failed';

export interface OrderTie {
  room: string;
  locale: string;

  key: string;
  uid: string | null;
  amount: number;
  currency: string;
}

export interface OpenedOrder {
  orderId: string;

  status: OrderStatus;
  amount: number | null;
  currency: string | null;

  approvedAt: number | null;
}

export interface OrderInfo {
  orderId: string;
  status: OrderStatus;
  paymentKey: string | null;
  amount: number | null;
  currency: string | null;

  readings: number;
}

export interface OrderRecord {
  orderId: string;
  status: OrderStatus;
  paymentKey?: string | null;
  approvedAt?: number | null;
  method?: string | null;
  cancelReason?: string | null;
  tie?: Partial<OrderTie>;
}

export interface Ledger {

  open(orderId: string, tie: OrderTie): Promise<OpenedOrder | null>;

  record(r: OrderRecord): Promise<boolean>;
  get(orderId: string): Promise<OrderInfo | null>;

  holdings(uid: string, except?: string): Promise<Holdings | null>;
}

type Fetcher = typeof fetch;

export async function rpc(cfg: LedgerConfig, fn: string, args: Record<string, unknown>, fetcher: Fetcher = fetch): Promise<{ ok: true; value: unknown } | { ok: false }> {
  try {
    const res = await fetcher(`${cfg.url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_secret: cfg.secret, ...args }),
    });
    if (!res.ok) return { ok: false };
    const text = await res.text();
    return { ok: true, value: text ? (JSON.parse(text) as unknown) : null };
  } catch {
    return { ok: false };
  }
}

const STATUSES: readonly string[] = ['ready', 'paid', 'canceled', 'partial_canceled', 'failed'];
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);

function readStatus(v: unknown): OrderStatus | null {
  return typeof v === 'string' && STATUSES.includes(v) ? (v as OrderStatus) : null;
}

export function makeLedger(env: Record<string, string | undefined>, fetcher: Fetcher = fetch): Ledger | undefined {
  const cfg = ledgerConfig(env);
  if (!cfg) return undefined;
  return {
    async open(orderId, tie) {
      const r = await rpc(
        cfg,
        'order_open',
        { p_order: orderId, p_room: tie.room, p_locale: tie.locale, p_key: tie.key, p_uid: tie.uid, p_amount: tie.amount, p_currency: tie.currency },
        fetcher,
      );
      if (!r.ok || !r.value || typeof r.value !== 'object') return null;
      const v = r.value as Record<string, unknown>;
      const status = readStatus(v.status);
      const id = str(v.order_id);
      if (!status || !id) return null;
      return { orderId: id, status, amount: num(v.amount), currency: str(v.currency), approvedAt: num(v.approved_ms) };
    },
    async record(o) {
      const t = o.tie ?? {};
      const r = await rpc(
        cfg,
        'order_record',
        {
          p_order: o.orderId,
          p_status: o.status,
          p_payment_key: o.paymentKey ?? null,
          p_approved_ms: o.approvedAt ?? null,
          p_method: o.method ?? null,
          p_cancel_reason: o.cancelReason ?? null,
          p_room: t.room ?? null,
          p_locale: t.locale ?? null,
          p_key: t.key ?? null,
          p_uid: t.uid ?? null,
          p_amount: t.amount ?? null,
          p_currency: t.currency ?? null,
        },
        fetcher,
      );
      return r.ok;
    },
    async get(orderId) {
      const r = await rpc(cfg, 'order_get', { p_order: orderId }, fetcher);
      if (!r.ok || !r.value || typeof r.value !== 'object') return null;
      const v = r.value as Record<string, unknown>;
      const status = readStatus(v.status);
      if (!status) return null;
      return { orderId, status, paymentKey: str(v.payment_key), amount: num(v.amount), currency: str(v.currency), readings: num(v.readings) ?? 0 };
    },
    async holdings(uid, except) {
      const r = await rpc(cfg, 'order_holdings', { p_uid: uid, p_except: except ?? null }, fetcher);
      if (!r.ok || !r.value || typeof r.value !== 'object') return null;
      const rooms = (r.value as { rooms?: unknown }).rooms;
      return Array.isArray(rooms) ? { rooms: rooms.filter((x): x is string => typeof x === 'string') } : null;
    },
  };
}

export function orderStatusFromToss(status: string): OrderStatus | null {
  switch (status) {
    case 'DONE':
      return 'paid';
    case 'CANCELED':
      return 'canceled';
    case 'PARTIAL_CANCELED':
      return 'partial_canceled';
    case 'ABORTED':
    case 'EXPIRED':
      return 'failed';
    default:
      return null;
  }
}
