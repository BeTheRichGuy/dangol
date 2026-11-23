'use client';

import { ROOMS_COPY } from '@/content/rooms';
import type { Person } from '@/lib/account/types';
import { birthLine } from '../account/format';
import { relationName } from '../account/person-form';
import '../account/account.css';

export function SavedPeoplePick({
  hint,
  people,
  activeId,
  onPick,
}: {
  hint: string;
  people: readonly Person[];

  activeId: string | null;

  onPick: (person: Person | null) => void;
}) {
  if (people.length === 0) return null;
  return (
    <div className="ac-pick ru-saved">
      <p className="ac-pick__hint">{hint}</p>
      <ul className="ac-pick__list" role="list">
        {people.map((p) => {
          const on = p.id === activeId;
          return (
            <li key={p.id}>
              <button type="button" className="ac-pick__person" aria-pressed={on} onClick={() => onPick(on ? null : p)}>
                <span className="ac-pick__dot" aria-hidden="true" />
                <span className="ac-pick__text">
                  <span className="ac-pick__name">
                    {p.name}
                    <span className="ac-pick__rel">{relationName(p.relation)}</span>
                  </span>
                  <span className="ac-pick__meta">{birthLine(p, ROOMS_COPY.page.timeUnknown)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
