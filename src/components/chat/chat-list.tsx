'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CHAT } from '@/content/chat';
import { CHAT_KEYS, type ChatKey, type ChatLine } from '@/lib/chat/characters';
import { lastLines } from '@/lib/chat/history';
import { useLocalSample } from '../rooms/local-sample';
import { useLocale } from '../locale-provider';
import { LanguagePicker } from '../home-hero';
import { ChevronRightIcon } from '../icons';
import { Logo } from '../logo';
import { ArrowLeftIcon, LanternIcon } from '../play/play-icons';
import { TokenChip } from '../play/token-chip';
import { CheckinCard } from './checkin-card';
import { Avatar } from './chat-room';
import '../play/play.css';
import './chat.css';
import { useChatSubject } from './use-chat-subject';

export function ChatList() {
  useLocale();
  const T = CHAT.list;
  const sample = useLocalSample();
  const [last, setLast] = useState<Record<ChatKey, ChatLine | null> | null>(null);

  const { ready, scope } = useChatSubject();
  useEffect(() => {
    if (ready) queueMicrotask(() => setLast(lastLines(scope)));
  }, [ready, scope]);

  const query = sample ? '?sample' : '';

  return (
    <main id="main" className="rs-night rm-night ch ch-list">
      <header className="sg-top">
        <Link href="/home" className="sg-back" aria-label={CHAT.room.back}>
          <ArrowLeftIcon />
        </Link>
        <div className="sg-top__title">
          <Logo tone="ivory" />
        </div>
        <LanguagePicker />
      </header>

      <section className="ch-hero" aria-labelledby="chat-title">
        <p className="rm-eyebrow m-0">{T.eyebrow}</p>
        <h1 id="chat-title" className="sg-title">
          {T.title}
        </h1>
        <p className="ch-hero__lead">{T.lead}</p>
        <div className="ch-hero__row">
          <TokenChip />
          <span className="ch-hero__play">
            <LanternIcon />
            {T.getTokens}
          </span>
        </div>
      </section>

      <CheckinCard />

      <ul className="ch-people" role="list">
        {CHAT_KEYS.map((key) => {
          const info = CHAT.characters[key];
          const line = last?.[key] ?? null;
          return (
            <li key={key}>
              <Link href={`/chat/${key}${query}`} className="ch-person">
                <Avatar who={key} size={64} online />
                <span className="ch-person__text">
                  <span className="ch-person__top">
                    <strong>{info.name}</strong>
                    <em>{info.role}</em>
                  </span>
                  <span className="ch-person__line">{line ? `${line.role === 'reader' ? '· ' : ''}${line.text}` : info.blurb}</span>
                </span>
                <ChevronRightIcon className="ch-person__go" />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="ch-foot">{T.cost}</p>
    </main>
  );
}
