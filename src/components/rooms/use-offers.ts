'use client';

import { useEffect, useState } from 'react';
import { activeLocale } from '@/content/locale';
import { useMaybeAccount } from '../account/account-provider';

export interface ClientOffers {

  first: boolean;

  loaded: boolean;
}

export const DEFAULT_CLIENT_OFFERS: ClientOffers = { first: true, loaded: false };

export function parseOffers(v: unknown): ClientOffers {
  if (!v || typeof v !== 'object') return { ...DEFAULT_CLIENT_OFFERS, loaded: true };
  return { first: (v as { first?: unknown }).first === true, loaded: true };
}

const SHARE_MS = 15_000;
let shared: { key: string; at: number; promise: Promise<ClientOffers> } | null = null;

function fetchOffers(key: string, locale: string, token: string | null, fresh: boolean): Promise<ClientOffers> {
  if (!fresh && shared && shared.key === key && Date.now() - shared.at < SHARE_MS) return shared.promise;
  const promise = fetch(`/api/offers?l=${locale}`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} })
    .then(async (res) => (res.ok ? parseOffers(await res.json().catch(() => null)) : { ...DEFAULT_CLIENT_OFFERS, loaded: true }))
    .catch(() => ({ ...DEFAULT_CLIENT_OFFERS, loaded: true }));
  shared = { key, at: Date.now(), promise };
  return promise;
}

export function useOffers(refresh?: unknown): ClientOffers {
  const account = useMaybeAccount();
  const ready = account?.ready ?? false;
  const userId = account?.user?.id ?? null;
  const [offers, setOffers] = useState<ClientOffers>(DEFAULT_CLIENT_OFFERS);

  useEffect(() => {
    if (!ready || !account) return;
    let alive = true;
    void (async () => {
      const token = userId ? await account.accessToken() : null;
      const locale = activeLocale();
      const next = await fetchOffers(`${locale}|${userId ?? ''}`, locale, token, refresh !== undefined);
      if (alive) setOffers(next);
    })();
    return () => {
      alive = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, userId, refresh]);

  return offers;
}
