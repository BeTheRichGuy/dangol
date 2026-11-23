import type { ChapterRoom } from '@/lib/rooms/themes';
import { dodoReturn, type DodoReturn } from './dodo-checkout';
import { tossReturn, type TossReturn } from './toss-checkout';

export type PayReturn = { provider: 'toss'; ret: TossReturn } | { provider: 'dodo'; ret: DodoReturn };

export type PayScope = ChapterRoom | 'bundle';

const key = (room: PayScope) => `dangol.payret.${room}.v1`;

export function savePayReturn(store: Storage, room: PayScope, v: PayReturn): void {
  try {
    store.setItem(key(room), JSON.stringify(v));
  } catch {

  }
}

export function clearPayReturn(store: Storage, room: PayScope): void {
  try {
    store.removeItem(key(room));
  } catch {

  }
}

export function loadPayReturn(store: Storage, room: PayScope): PayReturn | null {
  try {
    const v = JSON.parse(store.getItem(key(room)) ?? 'null') as { provider?: unknown; ret?: Record<string, unknown> } | null;
    if (!v || typeof v !== 'object' || !v.ret || typeof v.ret !== 'object') return null;
    if (v.provider === 'dodo') {
      const ret = typeof v.ret.paymentId === 'string' ? dodoReturn(`?payment_id=${encodeURIComponent(v.ret.paymentId)}`) : null;
      return ret ? { provider: 'dodo', ret } : null;
    }
    if (v.provider === 'toss') {
      const { paymentKey, orderId, amount } = v.ret;
      if (typeof paymentKey !== 'string' || typeof orderId !== 'string' || typeof amount !== 'number') return null;
      const q = new URLSearchParams({ paymentKey, orderId, amount: String(amount) });
      const ret = tossReturn(`?${q.toString()}`);
      return ret ? { provider: 'toss', ret } : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function isTransientConfirmFailure(e: unknown): boolean {
  const err = e as { status?: unknown; code?: unknown } | null;
  const status = typeof err?.status === 'number' ? err.status : null;
  if (status === null) return true;
  return status >= 500 || (status === 409 && err?.code === 'pending');
}
