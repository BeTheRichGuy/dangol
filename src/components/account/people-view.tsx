'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ACCOUNT } from '@/content/account';
import { ROOMS_COPY } from '@/content/rooms';
import type { Person } from '@/lib/account/types';
import { LanguagePicker } from '../home-hero';
import { ChevronLeftIcon, PlusIcon } from '../icons';
import { useLocale } from '../locale-provider';
import { useAccount } from './account-provider';
import { birthLine } from './format';
import { LoginPanel } from './login-panel';
import { PersonForm, relationName } from './person-form';
import './account.css';

type Screen = { name: 'list' } | { name: 'form'; person: Person | null };

export function PeopleView() {
  useLocale();
  const T = ACCOUNT.people;
  const { mode, ready, user, people, loaded, failed, deletePerson } = useAccount();
  const [screen, setScreen] = useState<Screen>({ name: 'list' });
  const [asking, setAsking] = useState<string | null>(null);
  const hasSelf = people.some((p) => p.relation === 'self');

  if (screen.name === 'form') {
    return (
      <PersonForm
        initial={screen.person}
        defaultRelation={hasSelf ? undefined : 'self'}
        onBack={() => setScreen({ name: 'list' })}
        onSaved={() => {
          setScreen({ name: 'list' });
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  return (
    <main id="main" className="rs-night rm-night ac-page">
      <header className="ac-top">
        <Link href="/home" className="ac-back">
          <ChevronLeftIcon size={20} />
          <span>{T.back}</span>
        </Link>
        <LanguagePicker />
      </header>

      <div className="ac-page__head">
        <h1 className="ac-page__title">{T.title}</h1>
        <p className="ac-page__lead">{T.lead}</p>
      </div>

      {!ready ? null : mode === 'off' ? (
        <p className="ac-soon">{ACCOUNT.login.soon}</p>
      ) : !user ? (
        <div className="ac-card">
          <p className="ac-card__line">{T.signInFirst}</p>
          <LoginPanel next="/people" layout="full" />
        </div>
      ) : !loaded ? (
        <p className="ac-wait" role="status">
          {T.loading}
        </p>
      ) : (
        <>
          {failed ? (
            <p className="ac-error" role="alert">
              {T.error}
            </p>
          ) : null}
          {people.length === 0 ? <p className="ac-empty">{T.empty}</p> : null}
          <ul className="ac-people">
            {people.map((p) => (
              <li key={p.id} className="ac-person" data-self={p.relation === 'self' ? '' : undefined}>
                <span className="ac-person__rel">{relationName(p.relation)}</span>
                <span className="ac-person__name">{p.name}</span>
                <span className="ac-person__meta">{birthLine(p, ROOMS_COPY.page.timeUnknown)}</span>
                {asking === p.id ? (
                  <span className="ac-confirm" role="group" aria-label={T.removeConfirm(p.name)}>
                    <span className="ac-confirm__q">{T.removeConfirm(p.name)}</span>
                    <button
                      type="button"
                      className="ac-confirm__yes"
                      onClick={() => {
                        setAsking(null);
                        void deletePerson(p.id).catch(() => undefined);
                      }}
                    >
                      {T.removeYes}
                    </button>
                    <button type="button" className="ac-confirm__no" onClick={() => setAsking(null)}>
                      {T.removeNo}
                    </button>
                  </span>
                ) : (
                  <span className="ac-person__actions">
                    <button type="button" className="ac-text-btn" onClick={() => setScreen({ name: 'form', person: p })}>
                      {T.edit}
                    </button>
                    <button type="button" className="ac-text-btn ac-text-btn--soft" onClick={() => setAsking(p.id)}>
                      {T.remove}
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <button type="button" className="ac-add" onClick={() => setScreen({ name: 'form', person: null })}>
            <PlusIcon size={20} />
            {hasSelf ? T.add : T.addMe}
          </button>
          <p className="ac-note">{T.storedNote}</p>
        </>
      )}
    </main>
  );
}
