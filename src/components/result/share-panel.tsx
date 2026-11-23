'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { UI } from '@/content/ui';
import { track } from '@/lib/analytics/track';
import { formatRegularNo } from '@/lib/regular';
import type { KeyMonth } from '@/lib/reading/fate-map';
import type { TypeProfile } from '@/lib/reading/types';
import { ChevronDownIcon, DownloadIcon, ShareIcon } from '../icons';
import { useLocale } from '../locale-provider';
import './result.css';

type Status = { kind: 'idle' } | { kind: 'copied' } | { kind: 'shared' } | { kind: 'copy-failed' };

export interface CardMonthPick {
  month: number;
  year: number;
  seat: 'day' | 'month';
}

export function cardMonthOf(m: KeyMonth): CardMonthPick {
  return { month: m.month, year: m.year, seat: m.tone === 'harmonyMonth' ? 'month' : 'day' };
}

export function cardPath(type: string, opts: { no?: number | null; width?: number | null; locale?: string; month?: CardMonthPick | null }): string {
  const q = new URLSearchParams({ t: type });
  if (opts.no) q.set('no', String(opts.no));
  if (opts.width) q.set('w', String(opts.width));
  if (opts.month) {
    q.set('gm', String(opts.month.month));
    q.set('gy', String(opts.month.year));
    if (opts.month.seat === 'month') q.set('gs', 'month');
  }

  if (opts.locale && opts.locale !== 'en') q.set('l', opts.locale);
  return `/api/card?${q.toString()}`;
}

export function shareUrl(origin: string, type: string, locale: string): string {
  return `${origin}/?t=${type}${locale === 'ko' || locale === 'ja' ? `&l=${locale}` : ''}`;
}

const IN_APP_BROWSER = /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER\(inapp/i;

const THUMB_WIDTH = 544;

interface Prepared {
  src: string;
  file: File;
  url: string;
}

type CardKind = 'type' | 'month';
const CARD_KINDS: readonly CardKind[] = ['type', 'month'];

export function SharePanel({
  profile,
  regularNo,
  goodMonth = null,
}: {
  profile: TypeProfile;
  regularNo: number | null;

  goodMonth?: KeyMonth | null;
}) {
  const t = UI.result.share;
  const locale = useLocale();
  const [kind, setKind] = useState<CardKind>('type');
  const month = goodMonth && kind === 'month' ? cardMonthOf(goodMonth) : null;
  const monthLabel = goodMonth ? UI.months[goodMonth.month - 1] : '';

  const fullSrc = cardPath(profile.key, { no: regularNo, locale, month });

  const src = cardPath(profile.key, { no: regularNo, width: THUMB_WIDTH, locale, month });
  const cardName = month ? `dangol-month-${month.month}` : `dangol-${profile.key}`;
  const cardAlt = month ? t.monthAlt(monthLabel) : t.cardAlt(profile.name);
  const shareHow: Record<string, string> = month ? { type: profile.key, card: 'month' } : { type: profile.key };
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const [open, setOpen] = useState(false);
  const [prepared, setPrepared] = useState<Prepared | null>(null);

  const [holdView, setHoldView] = useState(false);

  const isLoaded = loaded === `${src}#${attempt}`;
  const isFailed = failed === `${src}#${attempt}`;

  useEffect(() => {
    if (!isLoaded) return;
    let alive = true;
    let objectUrl: string | null = null;
    fetch(fullSrc)
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (!alive || !blob) return;
        const type = blob.type === 'image/png' ? 'image/png' : 'image/jpeg';
        objectUrl = URL.createObjectURL(blob);
        const file = new File([blob], `${cardName}.${type === 'image/png' ? 'png' : 'jpg'}`, { type });
        setPrepared({ src: fullSrc, file, url: objectUrl });
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isLoaded, fullSrc, cardName]);

  const ready = prepared?.src === fullSrc ? prepared : null;

  async function share() {
    const url = shareUrl(window.location.origin, profile.key, locale);
    const text = month ? t.monthShareText(monthLabel) : t.shareText(profile.born);
    const title = month ? t.monthShareTitle : t.shareTitle;
    try {
      if (typeof navigator.share === 'function') {
        if (ready && navigator.canShare?.({ files: [ready.file] })) {
          await navigator.share({ files: [ready.file], title, text: `${text} ${url}` });
        } else {
          await navigator.share({ title, text, url });
        }
        setStatus({ kind: 'shared' });
        track('share', { how: 'native', ...shareHow });
        return;
      }
    } catch (err) {

      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus({ kind: 'copied' });
      track('share', { how: 'copy', ...shareHow });
    } catch {
      setStatus({ kind: 'copy-failed' });
    }
  }

  const message =
    status.kind === 'copied' ? t.copied : status.kind === 'shared' ? t.shared : status.kind === 'copy-failed' ? t.copyFailed : '';

  return (
    <section aria-labelledby="share-title" className="text-center">
      <h2 id="share-title" className="t-display text-[2rem]">
        {t.heading}
      </h2>

      {}
      {goodMonth ? (
        <div className="rs-card-tabs" role="tablist" aria-label={t.pick}>
          {CARD_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              id={`rs-card-tab-${k}`}
              aria-selected={kind === k}
              aria-controls="rs-card-panel"
              tabIndex={kind === k ? 0 : -1}
              className="rs-card-tab"
              onClick={() => {
                setKind(k);
                setOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                e.preventDefault();
                const next = CARD_KINDS[(CARD_KINDS.indexOf(k) + 1) % CARD_KINDS.length];
                setKind(next);
                setOpen(true);
                document.getElementById(`rs-card-tab-${next}`)?.focus();
              }}
            >
              {k === 'type' ? t.tabType : t.tabMonth}
            </button>
          ))}
        </div>
      ) : null}

      {}
      <div className="rs-card" data-big={open || isFailed} id="rs-card-panel" role={goodMonth ? 'tabpanel' : undefined} aria-labelledby={goodMonth ? `rs-card-tab-${kind}` : undefined}>
        {isFailed ? (
          <div className="rs-card__box grid place-content-center gap-3 p-4 text-[0.9375rem] text-ink" role="alert">
            <span>{t.cardError}</span>
            <button type="button" className="dg-btn dg-btn--paper !min-h-11" onClick={() => setAttempt((n) => n + 1)}>
              {t.retry}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="rs-card__box rs-card__thumb"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {!isLoaded ? (
              <span className="skeleton absolute inset-0 grid place-items-center text-[0.875rem] font-medium text-ink-soft" aria-hidden="true">
                {open ? t.cardLoading : null}
              </span>
            ) : null}
            <Image
              key={`${src}#${attempt}`}
              src={src}
              alt={cardAlt}
              fill
              unoptimized
              sizes="272px"
              className="object-cover"
              onLoad={() => setLoaded(`${src}#${attempt}`)}
              onError={() => setFailed(`${src}#${attempt}`)}
            />
            <span className="rs-card__chev" aria-hidden="true">
              <ChevronDownIcon size={14} style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
            </span>
          </button>
        )}
        {!isLoaded && !isFailed ? (
          <span className="sr-only" role="status">
            {t.cardLoading}
          </span>
        ) : null}
      </div>

      <div className="mx-auto mt-5 grid max-w-[360px] grid-cols-2 gap-2">
        <a href={ready ? ready.url : fullSrc} download={ready ? ready.file.name : `${cardName}.jpg`} onClick={(e) => {
            track('share', { how: 'download', ...shareHow });

            const ua = navigator.userAgent;
            if (/KAKAOTALK/i.test(ua)) {

              e.preventDefault();
              const page = new URL('/save-card', window.location.origin);
              page.search = new URL(fullSrc, window.location.origin).search;
              window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(page.href)}`;
            } else if (IN_APP_BROWSER.test(ua)) {
              e.preventDefault();
              setHoldView(true);
            }
          }} className="dg-btn dg-btn--paper !gap-2 !px-3">
          <DownloadIcon size={22} />
          {t.save}
        </a>
        <button type="button" className="dg-btn dg-btn--primary !gap-2 !px-3" onClick={share}>
          <ShareIcon size={22} />
          {t.share}
        </button>
      </div>

      <p className="m-0 mt-3 min-h-6 text-[0.9375rem] font-semibold text-jade" role="status" aria-live="polite">
        {message}
      </p>

      <p className="m-0 mx-auto mt-1 max-w-[30ch] text-[0.875rem] text-ink-soft">{t.privacy}</p>

      {holdView ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.save}
          className="fixed inset-0 z-50 grid content-center justify-items-center gap-4 overflow-y-auto bg-black/85 p-4"
          onClick={() => setHoldView(false)}
        >
          <Image src={fullSrc} alt={cardAlt} width={540} height={960} unoptimized className="h-auto w-[min(78vw,320px)] rounded-lg" />
          <p className="m-0 max-w-[28ch] text-[0.9375rem] font-semibold text-white">{t.saveHold}</p>
          <a href={`${fullSrc}${fullSrc.includes('?') ? '&' : '?'}dl=1`} download onClick={(e) => e.stopPropagation()} className="dg-btn dg-btn--primary !min-h-11">
            {t.save}
          </a>
          <button type="button" className="dg-btn dg-btn--paper !min-h-11" onClick={() => setHoldView(false)}>
            {t.saveClose}
          </button>
        </div>
      ) : null}

      {}
      {regularNo ? (
        <p className="m-0 mt-4 text-[0.9375rem] font-medium text-ink">{t.hasNumber(formatRegularNo(regularNo))}</p>
      ) : null}
    </section>
  );
}
