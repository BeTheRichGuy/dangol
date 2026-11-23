'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ROOMS_COPY } from '@/content/rooms';
import { UI } from '@/content/ui';
import { isRoomKey } from '@/lib/rooms/themes';
import type { ReadingFocus } from '@/lib/reading/types';
import type { TypeKey } from '@/lib/saju/types';
import { NameTag } from './flow/dialogue-box';
import { CloseIcon } from './icons';
import { RegularCard } from './regular-card';
import { readUtm } from './utm-capture';

type Phase =
  | { name: 'form' }
  | { name: 'sending' }
  | { name: 'done'; regularNo: number; issuedIso: string }

  | { name: 'notOpen' };

function productOf(source: string): { name: string; price: string } | null {
  const key = source.startsWith('room:') ? source.slice(5) : null;
  return isRoomKey(key) ? { name: ROOMS_COPY.rooms[key].title, price: ROOMS_COPY.price } : null;
}

export function EmailModal({
  source,
  type,
  focus,
  onClose,
  onSuccess,
}: {

  source: string;
  type?: TypeKey;

  focus?: ReadingFocus | null;
  onClose: () => void;
  onSuccess?: (regularNo: number) => void;
}) {
  const t = UI.email;
  const uid = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<{ field: 'email' | 'consent' | 'form'; text: string } | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: 'form' });

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
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

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/waitlist', { method: 'GET', cache: 'no-store', signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (typeof data === 'object' && data !== null && (data as { open?: unknown }).open === false) {
          setPhase((p) => (p.name === 'form' ? { name: 'notOpen' } : p));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (phase.name === 'sending') return;
    const trimmed = email.trim();
    if (trimmed === '') {
      setError({ field: 'email', text: t.errors.empty });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setError({ field: 'email', text: t.errors.invalid });
      return;
    }
    if (!consent) {
      setError({ field: 'consent', text: t.errors.consent });
      return;
    }
    setError(null);
    setPhase({ name: 'sending' });
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, consent: true, source, type, focus: focus ?? undefined, utm: readUtm() }),
      });
      const data: unknown = await res.json().catch(() => null);
      const regularNo =
        typeof data === 'object' && data !== null && typeof (data as { regularNo?: unknown }).regularNo === 'number'
          ? (data as { regularNo: number }).regularNo
          : null;
      if (res.ok && regularNo !== null) {
        setPhase({ name: 'done', regularNo, issuedIso: new Date().toISOString() });
        onSuccess?.(regularNo);
        return;
      }
      const code = typeof data === 'object' && data !== null ? (data as { error?: unknown }).error : undefined;
      if (code === 'not_open') {

        setEmail('');
        setConsent(false);
        setPhase({ name: 'notOpen' });
        return;
      }
      setPhase({ name: 'form' });
      if (code === 'invalid_email') setError({ field: 'email', text: t.errors.invalid });
      else if (code === 'consent_required') setError({ field: 'consent', text: t.errors.consent });
      else setError({ field: 'form', text: t.errors.server });
    } catch {
      setPhase({ name: 'form' });
      setError({ field: 'form', text: t.errors.network });
    }
  }

  const sending = phase.name === 'sending';
  const product = productOf(source);

  return (
    <dialog
      ref={dialogRef}
      className="dg-sheet"
      aria-labelledby={`${uid}-title`}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialogRef.current?.close();
      }}
    >
      <div className="relative px-6 pb-[max(28px,var(--safe-bottom))] pt-7">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label={t.closeLabel}
          className="dg-btn dg-btn--quiet absolute right-3 top-3 !min-h-11 !w-11 !rounded-full !border-0 !p-0"
        >
          <CloseIcon size={22} />
        </button>

        {phase.name === 'done' ? (
          <div className="dg-rise">
            <h2 id={`${uid}-title`} className="t-display pr-10 text-[2.25rem]">
              {t.success.title}
            </h2>
            <div className="mt-5">
              <RegularCard regularNo={phase.regularNo} issuedIso={phase.issuedIso} />
            </div>
            <p className="mt-4 text-[0.9375rem] text-ink-soft" role="status">
              {t.success.body}
            </p>
            <button type="button" className="dg-btn dg-btn--primary mt-5 w-full" onClick={() => dialogRef.current?.close()}>
              {t.success.done}
            </button>
          </div>
        ) : phase.name === 'notOpen' ? (
          <div className="dg-rise">
            {}
            <div className="dg-bubble dg-bubble--yul mt-7 !max-w-full !text-[1.125rem]" data-first>
              <NameTag />
              <p id={`${uid}-title`} className="m-0" role="status">
                {t.notOpen.yul}
              </p>
            </div>
            <button
              type="button"
              className="dg-btn dg-btn--primary mt-6 w-full"
              autoFocus
              onClick={() => dialogRef.current?.close()}
            >
              {t.notOpen.close}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            {product ? (
              <>
                <h2 id={`${uid}-title`} className="t-display pr-10 text-[2rem]">
                  {t.product.title(product.name)}
                </h2>
                {}
                <div className="dg-bubble dg-bubble--yul mt-7 !max-w-full !text-[1.125rem]" data-first>
                  <NameTag />
                  <p className="m-0">{t.product.yul(product.price)}</p>
                </div>
              </>
            ) : (
              <>
                <h2 id={`${uid}-title`} className="t-display pr-10 text-[2.25rem]">
                  {t.title}
                </h2>
                <p className="mt-2 text-[0.9375rem] text-ink-soft">{t.intro}</p>
              </>
            )}

            <div className="mt-5">
              <label htmlFor={`${uid}-email`} className="dg-label">
                {t.emailLabel}
              </label>
              <input
                id={`${uid}-email`}
                className="dg-field"
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="send"
                placeholder={t.emailPlaceholder}
                value={email}
                aria-invalid={error?.field === 'email' || undefined}
                aria-describedby={error?.field === 'email' ? `${uid}-err` : undefined}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error?.field === 'email') setError(null);
                }}
              />
              {}
              {error?.field === 'email' ? (
                <p id={`${uid}-err`} role="alert" className="dg-error">
                  {error.text}
                </p>
              ) : null}
            </div>

            <label className="mt-4 flex min-h-12 cursor-pointer items-start gap-3 py-1.5 text-[0.9375rem] leading-snug text-ink">
              <input
                type="checkbox"
                className="dg-check mt-0.5"
                checked={consent}
                aria-invalid={error?.field === 'consent' || undefined}
                aria-describedby={error?.field === 'consent' ? `${uid}-err` : undefined}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (error?.field === 'consent') setError(null);
                }}
              />
              <span>
                {t.consent}{' '}
                <Link href="/terms" target="_blank" rel="noopener" className="font-semibold underline underline-offset-4">
                  {t.consentLink}
                </Link>{' '}
                {t.consentJoin}{' '}
                <Link href="/privacy" target="_blank" rel="noopener" className="font-semibold underline underline-offset-4">
                  {t.consentLink2}
                </Link>
                {t.consentEnd}
              </span>
            </label>

            {error?.field === 'consent' ? (
              <p id={`${uid}-err`} role="alert" className="dg-error">
                {error.text}
              </p>
            ) : null}
            {error?.field === 'form' ? (
              <p role="alert" className="dg-error">
                {error.text}
              </p>
            ) : null}

            <button type="submit" className="dg-btn dg-btn--primary mt-5 w-full" disabled={sending}>
              {sending ? t.submitting : t.submit}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
