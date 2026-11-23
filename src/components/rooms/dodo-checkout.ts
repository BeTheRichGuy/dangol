'use client';

import { currentSid } from '@/lib/analytics/track';
import { metaIdsForConfirm } from '../meta-pixel';
import type { RoomPayload } from '@/lib/rooms/payload';
import type { ProductKey } from '@/lib/rooms/themes';
import { entryOf } from './continue';
import { readLanterns, saleBody, type BundleLanterns } from './toss-checkout';

function authHeaders(token: string | null): Record<string, string> {
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export async function startDodoPayment(opts: {
  payload: RoomPayload;
  token: string | null;

  beforeRedirect: () => void;

  bundle?: boolean;

  pick?: readonly ProductKey[];

  edition?: 'xmas';
  offer?: string;
}): Promise<{ receipt: string }> {
  const res = await fetch('/api/checkout', { method: 'POST', headers: authHeaders(opts.token), body: JSON.stringify(saleBody(opts.payload, opts)) });
  const v = (await res.json().catch(() => ({}))) as { provider?: unknown; checkoutUrl?: unknown; paid?: unknown; receipt?: unknown; code?: unknown };
  if (res.ok && v.provider === 'dodo' && v.paid === true && typeof v.receipt === 'string') return { receipt: v.receipt };
  if (!res.ok || v.provider !== 'dodo' || typeof v.checkoutUrl !== 'string') throw Object.assign(new Error('checkout'), { code: typeof v.code === 'string' ? v.code : `http_${res.status}` });
  opts.beforeRedirect();
  window.location.assign(v.checkoutUrl);
  return new Promise<never>(() => undefined);
}

export interface DodoReturn {
  paymentId: string;
}

export function dodoReturn(search: string): DodoReturn | null {
  const paymentId = new URLSearchParams(search).get('payment_id');
  return paymentId && /^pay_[A-Za-z0-9_-]{4,120}$/.test(paymentId) ? { paymentId } : null;
}

export function dodoCancelled(search: string): boolean {
  return new URLSearchParams(search).get('dodo') === 'cancel';
}

const PENDING_WAIT_MS = 2500;
const PENDING_TRIES = 8;

interface ConfirmDeps {
  fetcher?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;

  bundle?: { onLanterns?: (l: BundleLanterns) => void; pick?: readonly ProductKey[] };

  edition?: 'xmas';
}

export async function confirmDodo(payload: RoomPayload, ret: DodoReturn, token: string | null, deps: ConfirmDeps = {}): Promise<string> {
  const fetcher = deps.fetcher ?? fetch;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((done) => setTimeout(done, ms)));

  const body = JSON.stringify({ ...saleBody(payload, { bundle: Boolean(deps.bundle), pick: deps.bundle?.pick, edition: deps.edition }), paymentId: ret.paymentId, sid: currentSid(), entry: entryOf(payload.room), ...metaIdsForConfirm() });
  let code = 'confirm';
  let status: number | undefined;
  for (let i = 0; i < PENDING_TRIES; i += 1) {
    const res = await fetcher('/api/checkout/confirm', { method: 'POST', headers: authHeaders(token), body });
    status = res.status;
    const v = (await res.json().catch(() => ({}))) as { receipt?: unknown; error?: unknown; code?: unknown; lanterns?: unknown };
    if (res.ok && typeof v.receipt === 'string') {
      deps.bundle?.onLanterns?.(readLanterns(v.lanterns));
      return v.receipt;
    }
    code = typeof v.code === 'string' ? v.code : `http_${res.status}`;
    if (res.status !== 409 || v.error !== 'pending') break;
    code = 'pending';
    await sleep(PENDING_WAIT_MS);
  }

  throw Object.assign(new Error('confirm'), { code, status });
}
