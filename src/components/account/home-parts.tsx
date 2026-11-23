'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { ACCOUNT } from '@/content/account';
import { ROOMS_COPY } from '@/content/rooms';
import { track } from '@/lib/analytics/track';
import { ROOMS, ROOM_KEYS, type ProductKey } from '@/lib/rooms/themes';
import { REUNION_GUIDE_NAME } from '@/lib/reunion/product';
import { useChatStatus } from '../chat/use-chat-open';
import { LanguagePicker } from '../home-hero';
import { useLocale } from '../locale-provider';
import { Logo } from '../logo';
import { markContinue } from '../rooms/continue';
import { RoomArt } from '../rooms/room-art';
import { useAccount } from './account-provider';
import { LoginSheet } from './login-sheet';
import '../rooms/rooms.css';
import './home.css';

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

const GLYPHS = {

  home: (
    <Svg>
      <path d="M3 10.5 12 5l9 5.5" />
      <path d="M5.5 9.5V19h13V9.5" />
      <path d="M10 19v-5h4v5" />
    </Svg>
  ),

  chat: (
    <Svg>
      <path d="M5 17.5 4 21l4-2a9 8 0 1 0-3-1.5Z" />
    </Svg>
  ),

  archive: (
    <Svg>
      <rect x="4" y="5" width="16" height="4" rx="1" />
      <path d="M5.5 9v9.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9" />
      <path d="M10 13h4" />
    </Svg>
  ),

  me: (
    <Svg>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" />
    </Svg>
  ),
};

export function HomeTabs({ active }: { active: 'home' | 'chat' | 'archive' | 'me' }) {
  const H = ACCOUNT.home;

  const chatStatus = useChatStatus();
  const chat = chatStatus !== null && chatStatus.open;
  const items: { key: keyof typeof GLYPHS; href: string }[] = [
    { key: 'home', href: '/home' },
    ...(chat ? [{ key: 'chat' as const, href: '/chat' }] : []),
    { key: 'archive', href: '/archive' },
    { key: 'me', href: '/people' },
  ];
  return (
    <>
      <div className="hm-tabs-space" aria-hidden="true" />
      <nav className="hm-tabs" aria-label={H.tabsLabel} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((it) => (
          <Link key={it.key} href={it.href} className={`hm-tab${it.key === active ? ' is-on' : ''}`} aria-current={it.key === active ? 'page' : undefined}>
            {GLYPHS[it.key]}
            <span>{H.tabs[it.key]}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

export function HomeTop() {
  const H = ACCOUNT.home;
  const { mode, ready, user } = useAccount();
  const [login, setLogin] = useState(false);
  const chatStatus = useChatStatus();

  const chatPerk = chatStatus !== null && chatStatus.open && chatStatus.wallet === 'server';
  return (
    <>
      <header className="hm-top">
        <Logo tone="ivory" />
        <div className="hm-top__right">
          <LanguagePicker />
          {ready && !user && mode !== 'off' ? (
            <button type="button" className="hm-pill" onClick={() => setLogin(true)}>
              {H.signIn}
            </button>
          ) : null}
        </div>
      </header>
      {login ? <LoginSheet next={chatPerk ? '/chat' : '/home'} nudge={chatPerk} general={!chatPerk} onClose={() => setLogin(false)} /> : null}
    </>
  );
}

type PosterItem = { key: ProductKey; title: string; quote: string; question: string; keeper: string; glyph: string; isNew: boolean };

export function usePosterItems(): PosterItem[] {
  const locale = useLocale();
  const r = ROOMS_COPY.reunion;
  return [
    { key: 'reunion', title: r.title, quote: r.quote, question: r.question, keeper: ROOMS_COPY.keepers.u12.name, glyph: REUNION_GUIDE_NAME[locale].hanja, isNew: true },
    ...ROOM_KEYS.map((k) => {
      const c = ROOMS_COPY.rooms[k];
      const keeper = ROOMS_COPY.keepers[ROOMS[k].keeper];
      return { key: k, title: c.title, quote: c.quote, question: c.question, keeper: keeper.name, glyph: keeper.hanja, isNew: false };
    }),
  ];
}

export function RoomPoster({ item, index }: { item: PosterItem; index: number }) {
  return (
    <Link
      href={`/room/${item.key}`}
      onClick={() => {

        if (item.key !== 'reunion') markContinue(item.key, 'home');
        track('room_click', { room: item.key, pos: index + 1 });
      }}
      className="hm-poster"
      aria-label={`${item.isNew ? `${ACCOUNT.home.newBadge}, ` : ''}${item.title}, ${item.keeper}`}
    >
      <span className="hm-poster__art">
        <RoomArt room={item.key} glyph={item.glyph} sizes="(max-width: 520px) 46vw, 220px" />
      </span>
      <span className="hm-poster__shade" aria-hidden="true" />
      {item.isNew ? <span className="hm-badge">{ACCOUNT.home.newBadge}</span> : null}
      <span className="hm-poster__copy">
        <span className="hm-poster__keeper">{item.keeper}</span>
        <span className="hm-poster__title">{item.title}</span>
        <span className="hm-poster__quote">{ROOMS_COPY.quote(item.quote)}</span>
      </span>
    </Link>
  );
}

export function FreeCard({ art }: { art: string }) {
  const H = ACCOUNT.home;
  return (
    <Link href="/reading" className="hm-free">
      <span className="hm-free__art">
        <Image src={art} alt="" fill sizes="76px" className="hm-cover" />
      </span>
      <span className="hm-free__body">
        <span className="hm-eyebrow">{H.freeEyebrow}</span>
        <span className="hm-free__title">{H.freeTitle}</span>
        <span className="hm-free__line">{H.freeSub}</span>
      </span>
      <span className="hm-free__go">{H.freeCta}</span>
    </Link>
  );
}
