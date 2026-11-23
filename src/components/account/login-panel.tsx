'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { ACCOUNT } from '@/content/account';
import { methodsFor, safeNext, type AuthMethod } from '@/lib/account/config';
import { ChevronLeftIcon } from '../icons';
import { useLocale } from '../locale-provider';
import { useAccount } from './account-provider';
import { BrandMark } from './brand-marks';
import './account.css';

type Phase = 'idle' | 'going' | 'email' | 'sending' | 'sent' | 'error' | 'emailError';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const noopSubscribe = () => () => {};

function readFailed(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('login') === 'failed';
  } catch {
    return false;
  }
}

export function LoginPanel({
  next,
  layout = 'compact',
  onSignedIn,
}: {

  next: string;
  layout?: 'compact' | 'full';

  onSignedIn?: () => void;
}) {
  const A = ACCOUNT.login;
  const locale = useLocale();
  const router = useRouter();
  const uid = useId();
  const { mode, ready, methods, signIn, signInEmail } = useAccount();
  const cameBackFailed = useSyncExternalStore(noopSubscribe, readFailed, () => false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [email, setEmail] = useState('');
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const reset = (e: PageTransitionEvent) => {
      if (e.persisted) setPhase((p) => (p === 'going' ? 'idle' : p));
    };
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  if (!ready) return <div className={`ac-login ac-login--wait ac-login--${layout}`} aria-hidden="true" />;
  if (mode === 'off') return <p className="ac-soon">{A.soon}</p>;

  const order = methodsFor(locale, methods);
  const done = () => (onSignedIn ? onSignedIn() : router.push(safeNext(next)));

  async function go(method: AuthMethod) {
    if (method === 'email') {
      setPhase('email');
      return;
    }
    setPhase('going');
    const r = await signIn(method, next);
    if (r === 'signedIn') done();
    else if (r === 'error') setPhase('error');
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setPhase('sending');
    const r = await signInEmail(value, next);
    if (r === 'signedIn') done();
    else setPhase(r === 'sent' ? 'sent' : 'emailError');
  }

  const busy = phase === 'going' || phase === 'sending';
  const status = phase === 'error' || (cameBackFailed && phase === 'idle') ? A.failed : phase === 'going' ? A.going : null;

  if (phase === 'email' || phase === 'sending' || phase === 'sent' || phase === 'emailError') {
    return (
      <div className={`ac-login ac-login--${layout}`}>
        {phase === 'sent' ? (
          <p className="ac-login__status" role="status">
            {A.email.sent}
          </p>
        ) : (
          <form className="ac-email" onSubmit={sendLink} noValidate>
            <label htmlFor={`${uid}-email`} className="ac-email__label">
              {A.email.label}
            </label>
            <div className="ac-email__row">
              <input
                id={`${uid}-email`}
                className="ac-email__input"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={A.email.placeholder}
                value={email}
                aria-invalid={invalid || undefined}
                aria-describedby={invalid || phase === 'emailError' ? `${uid}-email-err` : undefined}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="ac-email__send" disabled={busy}>
                {phase === 'sending' ? A.email.sending : A.email.send}
              </button>
            </div>
            {invalid || phase === 'emailError' ? (
              <p id={`${uid}-email-err`} className="ac-login__error" role="alert">
                {invalid ? A.email.invalid : A.email.failed}
              </p>
            ) : null}
          </form>
        )}
        <button type="button" className="ac-login__back" onClick={() => setPhase('idle')}>
          <ChevronLeftIcon size={16} />
          {A.email.back}
        </button>
      </div>
    );
  }

  const [first, ...rest] = order;
  return (
    <div className={`ac-login ac-login--${layout}`}>
      {layout === 'full' ? (
        <div className="ac-login__stack">
          {order.map((m) => (
            <MethodButton key={m} method={m} label={A.methods[m]} disabled={busy} onClick={() => void go(m)} />
          ))}
        </div>
      ) : (
        <>
          {first ? <MethodButton method={first} label={A.methods[first]} disabled={busy} onClick={() => void go(first)} /> : null}
          {rest.length ? (
            <div className="ac-login__icons" role="group" aria-label={A.moreLabel}>
              {rest.map((m) => (
                <button
                  key={m}
                  type="button"
                  className="ac-icon"
                  data-method={m}
                  aria-label={A.methods[m]}
                  title={A.methods[m]}
                  disabled={busy}
                  onClick={() => void go(m)}
                >
                  <BrandMark method={m} size={m === 'google' ? 20 : 22} />
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
      <p className="ac-login__status" role="status" aria-live="polite">
        {status ?? (mode === 'preview' ? A.preview : '')}
      </p>
    </div>
  );
}

function MethodButton({ method, label, disabled, onClick }: { method: AuthMethod; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" className="ac-method" data-method={method} disabled={disabled} onClick={onClick}>
      <span className="ac-method__mark">
        <BrandMark method={method} size={method === 'google' ? 18 : 20} />
      </span>
      <span className="ac-method__label">{label}</span>
    </button>
  );
}
