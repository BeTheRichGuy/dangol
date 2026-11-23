'use client';

import { useCallback, useEffect } from 'react';
import { setServerBalance, setServerChecked, useBalance, useServerBalance, useServerChecked } from '@/lib/chat/wallet';
import { useAccount } from '../account/account-provider';
import { useChatStatus } from './use-chat-open';

export interface Lanterns {

  mode: 'server' | 'local' | null;

  open: boolean | null;

  needLogin: boolean;

  balance: number;

  known: boolean;

  token(): Promise<string | null>;

  checkedIn: boolean | null;

  refresh(): Promise<void>;

  checkIn(): Promise<'done' | 'already' | 'error'>;

  setBalance(n: number): void;
}

export function useLanterns(): Lanterns {
  const status = useChatStatus();
  const account = useAccount();
  const local = useBalance();
  const server = useServerBalance();
  const checked = useServerChecked();
  const mode = status === null ? null : status.wallet;
  const signedIn = account.user !== null;

  const token = useCallback(() => account.accessToken(), [account]);

  const refresh = useCallback(async () => {
    const t = await account.accessToken();
    if (!t) return;
    try {
      const res = await fetch('/api/lantern', { cache: 'no-store', headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) return;
      const v = (await res.json()) as { balance?: unknown; checkedIn?: unknown };
      if (typeof v.balance === 'number') setServerBalance(v.balance);
      if (typeof v.checkedIn === 'boolean') setServerChecked(v.checkedIn);
    } catch {

    }
  }, [account]);

  const checkIn = useCallback(async (): Promise<'done' | 'already' | 'error'> => {
    const t = await account.accessToken();
    if (!t) return 'error';
    try {
      const res = await fetch('/api/lantern/checkin', { method: 'POST', cache: 'no-store', headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) return 'error';
      const v = (await res.json()) as { granted?: unknown; balance?: unknown };
      if (typeof v.balance === 'number') setServerBalance(v.balance);
      setServerChecked(true);
      return typeof v.granted === 'number' && v.granted > 0 ? 'done' : 'already';
    } catch {
      return 'error';
    }
  }, [account]);

  const uid = account.user?.id ?? null;
  useEffect(() => {
    if (mode !== 'server') return;
    if (!uid) {
      setServerBalance(null);
      setServerChecked(null);
      return;
    }
    void refresh();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, uid]);

  return {
    mode,
    open: status === null ? null : status.open,
    needLogin: mode === 'server' && account.ready && !signedIn,
    balance: mode === 'server' ? server ?? 0 : local,
    known: mode === 'server' ? server !== null : mode === 'local',
    checkedIn: mode === 'server' ? checked : null,
    token,
    refresh,
    checkIn,
    setBalance: setServerBalance,
  };
}
