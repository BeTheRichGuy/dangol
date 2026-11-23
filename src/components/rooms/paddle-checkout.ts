'use client';

import { initializePaddle, type Paddle, type PaddleEventData } from '@paddle/paddle-js';
import type { Locale } from '@/content/locale';
import type { RoomPayload } from '@/lib/rooms/payload';

let instance: Promise<Paddle | undefined> | null = null;

let settle: ((transactionId: string | null) => void) | null = null;

function onEvent(e: PaddleEventData) {
  if (!settle) return;
  if (e.name === 'checkout.completed') {
    const done = settle;
    settle = null;
    done(e.data?.transaction_id ?? null);

    void instance?.then((p) => p?.Checkout.close());
  } else if (e.name === 'checkout.closed') {
    const done = settle;
    settle = null;
    done(null);
  }
}

function paddle(): Promise<Paddle | undefined> {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
  if (!token) return Promise.resolve(undefined);
  instance ??= initializePaddle({
    environment: process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox',
    token,
    eventCallback: onEvent,
  });
  return instance;
}

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

export async function payWithPaddle(payload: RoomPayload, token: string | null, locale: Locale): Promise<string | null> {
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const res = await fetch('/api/checkout', { method: 'POST', headers, body: JSON.stringify(payload) });
  const start = (await res.json().catch(() => ({}))) as { provider?: unknown; priceId?: unknown; customData?: unknown };
  if (!res.ok || start.provider !== 'paddle' || typeof start.priceId !== 'string') throw new Error('checkout');

  const p = await paddle();
  if (!p) throw new Error('paddle_unavailable');
  const transactionId = await new Promise<string | null>((resolve) => {
    settle = resolve;
    p.Checkout.open({
      items: [{ priceId: start.priceId as string, quantity: 1 }],
      customData: start.customData as Record<string, unknown>,
      settings: { displayMode: 'overlay', theme: 'light', locale },
    });
  });
  if (!transactionId) return null;

  for (let tries = 0; tries < 8; tries += 1) {
    const r = await fetch('/api/checkout/confirm', { method: 'POST', headers, body: JSON.stringify({ ...payload, transactionId }) });
    if (r.status === 409) {
      await wait(1500);
      continue;
    }
    const v = (await r.json().catch(() => ({}))) as { receipt?: unknown };
    if (r.ok && typeof v.receipt === 'string') return v.receipt;
    break;
  }
  throw new Error('confirm');
}
