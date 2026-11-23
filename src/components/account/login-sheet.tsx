'use client';

import { useEffect, useId, useRef } from 'react';
import { ACCOUNT } from '@/content/account';
import { UI } from '@/content/ui';
import { CHAT_CHARACTERS, CHAT_KEYS } from '@/lib/chat/characters';
import { CloseIcon } from '../icons';
import { LanternIcon } from '../play/play-icons';
import { LoginPanel } from './login-panel';
import './account.css';

export function LoginSheet({ next, onClose, nudge = false, general = false }: { next: string; onClose: () => void; nudge?: boolean; general?: boolean }) {
  const A = ACCOUNT.login;
  const N = A.nudge;
  const uid = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleClose = () => {
      if (!dialog.open) onCloseRef.current();
    };
    dialog.addEventListener('close', handleClose);
    if (!dialog.open) dialog.showModal();
    return () => {
      dialog.removeEventListener('close', handleClose);
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="dg-sheet ac-sheet"
      aria-labelledby={`${uid}-title`}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
    >
      <div className="relative px-6 pb-[max(28px,var(--safe-bottom))] pt-7">
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label={UI.common.close}
          className="dg-btn dg-btn--quiet absolute right-3 top-3 !min-h-11 !w-11 !rounded-full !border-0 !p-0"
        >
          <CloseIcon size={20} />
        </button>
        {nudge ? (
          <>
            <div className="ac-nudge__faces" aria-hidden="true">
              {CHAT_KEYS.map((k) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={k} src={CHAT_CHARACTERS[k].art} alt="" width={48} height={48} draggable={false} />
              ))}
              <span className="ac-nudge__lamp">
                <LanternIcon />
              </span>
            </div>
            <p className="ac-nudge__tag">{N.tag}</p>
          </>
        ) : null}
        <h2 id={`${uid}-title`} className="ac-sheet__title">
          {nudge ? N.heading : general ? A.heading : A.sheetHeading}
        </h2>
        <p className="ac-sheet__lead">{nudge ? N.lead : general ? A.lead : A.sheetLead}</p>
        <LoginPanel next={next} layout="full" onSignedIn={() => ref.current?.close()} />
        <p className="ac-sheet__agree">{A.agree}</p>
        {nudge ? (
          <button type="button" className="dg-btn dg-btn--quiet ac-nudge__later" onClick={() => ref.current?.close()}>
            {N.later}
          </button>
        ) : null}
      </div>
    </dialog>
  );
}
