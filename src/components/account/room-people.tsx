'use client';

import { ACCOUNT } from '@/content/account';
import { ROOMS_COPY } from '@/content/rooms';
import type { Person } from '@/lib/account/types';
import { CHOOSABLE_PAIR_KINDS, type PairKind } from '@/lib/rooms/themes';
import { PlusIcon } from '../icons';
import { birthLine } from './format';
import { relationName } from './person-form';
import './account.css';

export function RoomPeople({
  pair,
  people,
  loaded,
  signedIn,
  ids,
  onToggle,
  kind,
  onKind,
  onAdd,
  onSignIn,
  disabled,
}: {

  pair: boolean;
  people: readonly Person[];
  loaded: boolean;
  signedIn: boolean;

  ids: readonly string[];
  onToggle: (id: string) => void;
  kind: PairKind | null;
  onKind: (k: PairKind) => void;
  onAdd: () => void;
  onSignIn: () => void;
  disabled: boolean;
}) {
  const T = ACCOUNT.picker;
  const f = ROOMS_COPY.page;

  if (!signedIn) {
    return (
      <div className="ac-pick ac-pick--out">
        <p className="m-0">{T.signIn}</p>
        <button type="button" className="dg-btn dg-btn--glass w-full" onClick={onSignIn}>
          {T.signInButton}
        </button>
      </div>
    );
  }

  return (
    <div className="ac-pick">
      <p className="ac-pick__hint">{pair ? T.pickTwo : T.pickOne}</p>
      {loaded ? (
        <ul className="ac-pick__list" role="list">
          {people.map((p) => {
            const at = ids.indexOf(p.id);
            const on = at >= 0;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className="ac-pick__person"
                  aria-pressed={on}
                  data-lantern={pair && on ? (at === 0 ? 'gold' : 'silver') : undefined}
                  disabled={disabled}
                  onClick={() => onToggle(p.id)}
                >
                  <span className="ac-pick__dot" aria-hidden="true" />
                  <span className="ac-pick__text">
                    <span className="ac-pick__name">
                      {p.name}
                      <span className="ac-pick__rel">{relationName(p.relation)}</span>
                    </span>
                    <span className="ac-pick__meta">{birthLine(p, f.timeUnknown)}</span>
                  </span>
                  {pair && on ? <span className="ac-pick__lantern">{at === 0 ? T.gold : T.silver}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="ac-wait" role="status">
          {ACCOUNT.people.loading}
        </p>
      )}
      <button type="button" className="ac-add" onClick={onAdd} disabled={disabled}>
        <PlusIcon size={20} />
        {ACCOUNT.people.add}
      </button>

      {pair && ids.length === 2 ? (
        <fieldset className="ac-pick__kind">
          <legend className="ac-pick__legend">{T.kind}</legend>
          <div className="ac-chips">
            {CHOOSABLE_PAIR_KINDS.map((k) => (
              <button key={k} type="button" className="rf-choice" aria-pressed={kind === k} disabled={disabled} onClick={() => onKind(k)}>
                {f.pairKinds[k]}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

    </div>
  );
}
