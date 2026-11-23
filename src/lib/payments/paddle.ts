import type { PaddleServerConfig } from './payments';

const API_BASE: Record<PaddleServerConfig['env'], string> = {
  sandbox: 'https://sandbox-api.paddle.com',
  production: 'https://api.paddle.com',
};

export interface PaddleCustomData {
  room: string;
  key: string;
  uid: string | null;
}

export interface PaddleTransaction {
  id: string;
  status: string;
  priceIds: string[];
  customData: Record<string, unknown> | null;
  currency: string;

  total: number;
}

export async function fetchPaddleTransaction(
  cfg: PaddleServerConfig,
  transactionId: string,
  fetcher: typeof fetch = fetch,
): Promise<PaddleTransaction | null> {
  if (!/^txn_[a-z0-9]+$/i.test(transactionId)) return null;
  try {
    const res = await fetcher(`${API_BASE[cfg.env]}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[paddle] transaction lookup failed', res.status);
      return null;
    }
    const body = (await res.json()) as { data?: Record<string, unknown> };
    const d = body.data;
    if (!d || typeof d.id !== 'string' || typeof d.status !== 'string') return null;
    const items = Array.isArray(d.items) ? (d.items as { price?: { id?: unknown } }[]) : [];
    const totals = (d.details as { totals?: { grand_total?: unknown } } | undefined)?.totals;
    return {
      id: d.id,
      status: d.status,
      priceIds: items.map((i) => i.price?.id).filter((x): x is string => typeof x === 'string'),
      customData: d.custom_data && typeof d.custom_data === 'object' ? (d.custom_data as Record<string, unknown>) : null,
      currency: typeof d.currency_code === 'string' ? d.currency_code : '',
      total: Number(totals?.grand_total ?? 0) || 0,
    };
  } catch {
    console.error('[paddle] transaction lookup failed', 'network');
    return null;
  }
}

export type PaddleCheck = 'ok' | 'pending' | 'mismatch';

export function checkPaddleTransaction(tx: PaddleTransaction, expect: PaddleCustomData & { priceId: string }): PaddleCheck {
  const c = tx.customData ?? {};
  const same = c.room === expect.room && c.key === expect.key && (c.uid ?? null) === expect.uid;
  if (!same || !tx.priceIds.includes(expect.priceId)) return 'mismatch';
  if (tx.status === 'paid' || tx.status === 'completed') return 'ok';
  if (tx.status === 'canceled' || tx.status === 'past_due') return 'mismatch';
  return 'pending';
}
