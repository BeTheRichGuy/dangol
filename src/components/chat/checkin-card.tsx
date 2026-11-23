'use client';

import { useState } from 'react';
import { CHAT } from '@/content/chat';
import { CHECKIN_REWARD } from '@/lib/chat/tokens';
import { useLocale } from '../locale-provider';
import { LanternIcon } from '../play/play-icons';
import { useLanterns } from './use-lanterns';
import './chat.css';

export function CheckinCard() {
  useLocale();
  const T = CHAT.list.checkin;
  const wallet = useLanterns();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<'done' | 'error' | null>(null);
  if (wallet.mode !== 'server' || wallet.needLogin || wallet.checkedIn === null) return null;

  const done = wallet.checkedIn;
  const onClick = async () => {
    setBusy(true);
    setResult(null);
    const r = await wallet.checkIn();
    setBusy(false);
    setResult(r === 'error' ? 'error' : r === 'done' ? 'done' : null);
  };
  return (
    <section className="ch-checkin" aria-labelledby="checkin-title" data-testid="checkin" data-done={done || undefined}>
      <LanternIcon className="ch-checkin__lamp" lit={done ? 1 : 0.4} />
      <div className="ch-checkin__text">
        <strong id="checkin-title">{T.title}</strong>
        <p>{done ? T.done : T.body}</p>
        {result === 'error' ? (
          <p className="ch-checkin__error" role="alert">
            {T.error}
          </p>
        ) : null}
        {done && result === 'done' ? <span className="ch-checkin__pop">{T.pop(CHECKIN_REWARD)}</span> : null}
      </div>
      {done ? null : (
        <button type="button" className="ch-checkin__btn" disabled={busy} onClick={() => void onClick()}>
          {T.button}
        </button>
      )}
    </section>
  );
}
