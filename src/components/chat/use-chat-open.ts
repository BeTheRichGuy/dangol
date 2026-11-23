'use client';

import { useEffect, useState } from 'react';

export interface ChatStatus {
  open: boolean;
  wallet: 'server' | 'local';
}

let asked: Promise<ChatStatus> | null = null;

function askServer(): Promise<ChatStatus> {
  asked ??= fetch('/api/chat', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : { open: false }))
    .then((v: { open?: unknown; wallet?: unknown }): ChatStatus => ({ open: v.open === true, wallet: v.wallet === 'server' ? 'server' : 'local' }))
    .catch((): ChatStatus => {
      asked = null;
      return { open: false, wallet: 'local' };
    });
  return asked;
}

export function useChatStatus(): ChatStatus | null {
  const [status, setStatus] = useState<ChatStatus | null>(null);
  useEffect(() => {
    let live = true;
    void askServer().then((v) => {
      if (live) setStatus(v);
    });
    return () => {
      live = false;
    };
  }, []);
  return status;
}

export function useChatOpen(): boolean | null {
  const status = useChatStatus();
  return status === null ? null : status.open;
}
