'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CHAT } from '@/content/chat';
import { activeLocale } from '@/content/locale';
import { ROOMS_COPY } from '@/content/rooms';
import { CHAT_CHARACTERS, HISTORY_MAX, MESSAGE_MAX, type ChatKey, type ChatLine } from '@/lib/chat/characters';
import { clearHistory, loadHistory, saveHistory } from '@/lib/chat/history';
import { CHAT_COST } from '@/lib/chat/tokens';
import { addTokens, spendTokens } from '@/lib/chat/wallet';
import { LoginSheet } from '../account/login-sheet';
import { birthLine } from '../account/format';
import { relationName } from '../account/person-form';
import { CheckIcon, ChevronDownIcon, CloseIcon, PlusIcon } from '../icons';
import { useLocale } from '../locale-provider';
import { ArrowLeftIcon, LanternIcon, SendIcon } from '../play/play-icons';
import { TokenChip } from '../play/token-chip';
import '../play/play.css';
import './chat.css';
import { LanternPitch } from './lantern-pitch';
import { useLanterns } from './use-lanterns';
import { chatPayload, useChatSubject } from './use-chat-subject';

type ErrorCode = keyof typeof CHAT.room.errors;

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function greetingLines(who: ChatKey): ChatLine[] {
  return CHAT.greetings[who].map((g) => ({ role: 'character' as const, text: g.text }));
}

export function Avatar({ who, size = 40, online = false }: { who: ChatKey; size?: number; online?: boolean }) {
  return (
    <span className="ch-avatar" style={{ width: size, height: size }} data-online={online || undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={CHAT_CHARACTERS[who].art} alt="" width={size} height={size} draggable={false} />
    </span>
  );
}

export function ChatRoom({ who }: { who: ChatKey }) {
  const locale = useLocale();
  const T = CHAT.room;
  const info = CHAT.characters[who];
  const wallet = useLanterns();
  const balance = wallet.balance;
  const [signing, setSigning] = useState(false);
  const { input, ready, sample, signedIn, accountOn, people, person, scope, choose } = useChatSubject();
  const [lines, setLines] = useState<ChatLine[]>([]);

  const historyKey = `${who}|${scope}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loaded = loadedKey === historyKey;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [open, setOpen] = useState<boolean | null>(null);
  const alive = useRef(true);
  const abort = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    alive.current = true;

    if (ready) {
      queueMicrotask(() => {
        const saved = loadHistory(who, scope);
        setLines(saved.length > 0 ? saved : greetingLines(who));
        setLoadedKey(historyKey);
      });
    }
    return () => {
      alive.current = false;
      abort.current?.abort();
    };
  }, [who, scope, ready, historyKey]);

  useEffect(() => {
    if (loaded && lines.some((l) => l.role === 'reader')) saveHistory(who, lines, scope);
  }, [lines, loaded, who, scope]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPickerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pickerOpen]);

  useEffect(() => {
    const c = new AbortController();
    fetch('/api/chat', { cache: 'no-store', signal: c.signal })
      .then((r) => (r.ok ? r.json() : { open: false }))
      .then((v: { open?: unknown }) => setOpen(v.open === true))
      .catch(() => {
        if (!c.signal.aborted) setOpen(false);
      });
    return () => c.abort();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [lines, busy]);

  const payload = useMemo(() => chatPayload(who, input, new Date().toISOString(), locale), [who, input, locale]);
  const needSaju = ready && !payload;
  const canSend = loaded && open !== false && payload !== null && !busy && wallet.known && !wallet.needLogin && balance >= CHAT_COST;

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MESSAGE_MAX);
      if (!text || !payload || busy) return;
      const server = wallet.mode === 'server';

      if (server ? !wallet.known || wallet.needLogin || balance < CHAT_COST : !spendTokens(CHAT_COST)) return;

      if (server) wallet.setBalance(balance - CHAT_COST);
      const before = lines;
      const next: ChatLine[] = [...before, { role: 'reader', text }];
      setLines(next);
      setDraft('');
      setError(null);
      setBusy(true);
      const c = new AbortController();
      abort.current = c;

      const giveUp = (code: ErrorCode | null) => {

        if (server) void wallet.refresh();
        else addTokens(CHAT_COST);
        setLines(before);
        setDraft(text);
        setError(code);
      };
      try {
        const token = server ? await wallet.token() : null;
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ who, locale: activeLocale(), payload, messages: next.slice(-HISTORY_MAX) }),
          signal: c.signal,
        });
        if (!alive.current) return;
        if (!res.ok) {

          const failed = (await res.json().catch(() => null)) as { balance?: unknown } | null;
          if (typeof failed?.balance === 'number') wallet.setBalance(failed.balance);

          giveUp(
            res.status === 402
              ? null
              : res.status === 401
                ? 'login'
              : res.status === 429
                ? 'busy'
                : res.status === 422
                  ? 'refusal'
                  : res.status === 503
                    ? 'notOpen'
                    : res.status === 400
                      ? 'invalid'
                      : 'api',
          );
          return;
        }
        const data = (await res.json()) as { messages?: ChatLine[]; balance?: unknown };
        if (typeof data.balance === 'number') wallet.setBalance(data.balance);
        const replies = (data.messages ?? []).filter((m) => typeof m?.text === 'string' && m.text.trim());
        if (replies.length === 0) {
          giveUp('api');
          return;
        }

        for (const [i, m] of replies.entries()) {
          await sleep(i === 0 ? 450 : 650 + Math.min(m.text.length * 16, 900));
          if (!alive.current) return;
          setLines((l) => [...l, { role: 'character', text: m.text }]);
        }
      } catch {
        if (alive.current && !c.signal.aborted) giveUp('network');
      } finally {
        if (alive.current) setBusy(false);
      }
    },
    [payload, busy, lines, who, wallet, balance],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(draft);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {

    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(draft);
    }
  };

  const clear = () => {
    clearHistory(who, scope);
    setError(null);
    setLines(greetingLines(who));
  };

  const sampleQuery = sample ? '?sample' : '';
  const S = T.subject;
  const subjectLabel = person && person.relation !== 'self' ? S.label(person.name) : sample ? S.sample : S.mine;

  const canPick = signedIn && people.length > 0 && !sample;

  return (
    <main id="main" className="rs-night rm-night ch ch-room">
      <header className="ch-header">
        <Link href={`/chat${sampleQuery}`} className="sg-back" aria-label={T.back}>
          <ArrowLeftIcon />
        </Link>
        <Avatar who={who} size={44} online />
        <div className="ch-header__who">
          <h1 className="ch-header__name">{info.name}</h1>
          <p className="ch-header__status">
            <span className="ch-dot" aria-hidden="true" />
            {T.online} · {info.role}
          </p>
        </div>
        <TokenChip />
      </header>

      <div className="ch-scroll" role="log" aria-live="polite" aria-label={info.name}>
        {ready && !needSaju ? (
          canPick ? (
            <button type="button" className="ch-subject" disabled={busy} aria-haspopup="dialog" onClick={() => setPickerOpen(true)}>
              <span className="ch-subject__text">{subjectLabel}</span>
              <span className="ch-subject__change">
                {S.change}
                <ChevronDownIcon size={14} />
              </span>
            </button>
          ) : (
            <p className="ch-subject ch-subject--static">
              <span className="ch-subject__text">{subjectLabel}</span>
              {accountOn && !signedIn && !sample ? <span className="ch-subject__guest">{S.guest}</span> : null}
            </p>
          )
        ) : null}
        <p className="ch-note">{T.cost}</p>
        {lines.map((l, i) => (
          <div key={i} className="ch-row" data-side={l.role === 'reader' ? 'right' : 'left'}>
            {l.role === 'character' ? <Avatar who={who} size={34} /> : null}
            <div className="ch-col">
              {l.role === 'character' ? <span className="ch-name">{info.name}</span> : null}
              <p className="ch-bubble" data-side={l.role === 'reader' ? 'right' : 'left'}>
                {l.text}
              </p>
            </div>
          </div>
        ))}
        {busy ? (
          <div className="ch-row" data-side="left" role="status" aria-label={T.typing(info.name)}>
            <Avatar who={who} size={34} />
            <div className="ch-col">
              <p className="ch-bubble ch-typing" data-side="left">
                <span />
                <span />
                <span />
              </p>
            </div>
          </div>
        ) : null}
        {loaded && lines.some((l) => l.role === 'reader') ? (
          <button type="button" className="ch-clear" onClick={clear}>
            {T.clear}
          </button>
        ) : null}
        <div ref={endRef} />
      </div>

      <footer className="ch-dock">
        {error ? (
          <p className="ch-error" role="alert">
            {T.errors[error]}
          </p>
        ) : open === false ? (
          <p className="ch-error" role="alert">
            {T.errors.notOpen}
          </p>
        ) : null}

        {needSaju ? (
          <div className="ch-gate">
            <strong>{T.needSajuTitle}</strong>
            <p>{T.needSajuBody}</p>
            <Link href="/" className="dg-btn dg-btn--primary">
              {T.needSajuButton}
            </Link>
            {process.env.NODE_ENV === 'development' ? <p className="ch-gate__hint">{T.sampleHint}</p> : null}
          </div>
        ) : wallet.needLogin ? (
          <div className="ch-gate">
            <strong>{T.loginTitle}</strong>
            <p>{T.loginBody}</p>
            <button type="button" className="dg-btn dg-btn--primary" onClick={() => setSigning(true)}>
              {T.loginButton}
            </button>
          </div>
        ) : loaded && wallet.known && balance < CHAT_COST && !busy ? (
          <LanternPitch who={who} />
        ) : (
          <>
            <div className="ch-chips" role="group" aria-label={info.name}>
              {CHAT.chips[who].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="ch-chip"
                  disabled={busy}
                  onClick={() => {
                    setDraft(chip);
                    inputRef.current?.focus();
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <form className="ch-composer" onSubmit={onSubmit}>
              <textarea
                ref={inputRef}
                className="ch-input"
                rows={1}
                value={draft}
                maxLength={MESSAGE_MAX}
                placeholder={T.placeholder(info.name)}
                aria-label={T.placeholder(info.name)}
                enterKeyHint="send"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={busy || payload === null}
              />
              <button type="submit" className="ch-send" disabled={!canSend || !draft.trim()} aria-label={T.send}>
                <SendIcon className="ch-send__icon" />
                <span className="ch-send__cost" aria-hidden="true">
                  <LanternIcon />
                  <b>−{CHAT_COST}</b>
                </span>
              </button>
            </form>
            <p className="ch-left">{T.left(balance)}</p>
          </>
        )}
      </footer>
      {signing ? <LoginSheet next={`/chat/${who}`} onClose={() => setSigning(false)} /> : null}

      {pickerOpen ? (
        <div className="ch-sheet" role="presentation" onClick={() => setPickerOpen(false)}>
          <div className="ch-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="ch-sheet-title" onClick={(e) => e.stopPropagation()}>
            <div className="ch-sheet__head">
              <h2 id="ch-sheet-title" className="ch-sheet__title">
                {S.title}
              </h2>
              <button type="button" className="ch-sheet__close" aria-label={S.close} onClick={() => setPickerOpen(false)}>
                <CloseIcon size={20} />
              </button>
            </div>
            <p className="ch-sheet__hint">{S.hint}</p>
            <ul className="ch-sheet__list" role="list">
              {people.map((p) => {
                const on = p.id === person?.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="ch-sheet__item"
                      aria-pressed={on}
                      onClick={() => {
                        choose(p.id);
                        setPickerOpen(false);
                      }}
                    >
                      <span className="ch-sheet__text">
                        <span className="ch-sheet__name">
                          {p.name}
                          <span className="ch-sheet__rel">{relationName(p.relation)}</span>
                        </span>
                        <span className="ch-sheet__meta">{birthLine(p, ROOMS_COPY.page.timeUnknown)}</span>
                      </span>
                      {on ? <CheckIcon size={20} /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            <Link href="/people" className="ch-sheet__add">
              <PlusIcon size={18} />
              {S.add}
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}
