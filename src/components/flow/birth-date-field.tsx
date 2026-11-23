'use client';

import { useState } from 'react';
import { UI } from '@/content/ui';
import { MIN_BIRTH_YEAR } from './fields';
import { checkBirthDate, convertDateText, isoToDotted, type BirthDateCheck, type Calendar } from './birth-date';
import './birth-date-field.css';

export interface BirthDate {
  calendar: Calendar;
  text: string;
  leap: boolean;
  check: BirthDateCheck;
  onText: (raw: string) => void;
  onLeap: (leap: boolean) => void;
  onCalendar: (next: Calendar) => void;

  setIso: (iso: string | null) => void;
}

export function useBirthDate(initialIso: string | null, mask: (raw: string) => string): BirthDate {
  const [calendar, setCalendar] = useState<Calendar>('solar');
  const [text, setText] = useState(isoToDotted(initialIso));
  const [leap, setLeap] = useState(false);
  return {
    calendar,
    text,
    leap,
    check: checkBirthDate(text, calendar, leap),
    onText: (raw) => setText(mask(raw)),
    onLeap: setLeap,
    onCalendar: (next) => {
      const c = convertDateText(text, calendar, next, leap);
      setCalendar(next);
      setText(c.text);
      setLeap(c.leap);
    },
    setIso: (iso) => {
      setCalendar('solar');
      setLeap(false);
      setText(isoToDotted(iso));
    },
  };
}

export function BirthDateField({
  id,
  label,
  birth,
  tried,
  autoComplete = 'off',
}: {
  id: string;
  label: string;
  birth: BirthDate;

  tried: boolean;
  autoComplete?: string;
}) {
  const f = UI.reading.form;
  const L = f.lunar;
  const { check, calendar } = birth;
  const lunar = calendar === 'lunar';

  const showError = !check.ok && (tried || birth.text.length >= 10);
  let message: string | null = null;
  let isError = false;
  if (!check.ok && showError) {
    isError = true;
    if (check.error === 'range') message = f.errors.dateRange(MIN_BIRTH_YEAR, new Date().getFullYear());
    else if (check.error === 'noLeap' && check.at) message = L.errors.noLeap(check.at.year, check.at.month, check.leapMonth ?? 0);
    else if (check.error === 'noDay' && check.at) message = L.errors.noDay(check.at.year, check.at.month, check.at.leap, check.maxDay ?? 0);
    else message = f.errors.date;
  } else if (lunar) {
    if (check.ok) {
      const [y, m, d] = check.iso.split('-').map(Number);
      message = L.converted(y, m, d);
    } else {
      message = L.hint;
    }
  }
  const msgId = `${id}-msg`;

  return (
    <div className="rf-field">
      <div className="rf-label-row">
        <label htmlFor={id} className="rf-label">
          {label}
        </label>
        <div role="radiogroup" aria-label={L.calendar} className="bd-cal">
          {(['solar', 'lunar'] as const).map((c) => (
            <button key={c} type="button" role="radio" aria-checked={calendar === c} onClick={() => birth.onCalendar(c)}>
              {c === 'solar' ? L.solar : L.lunar}
            </button>
          ))}
        </div>
      </div>
      <input
        id={id}
        className="rf-input"
        type="text"
        inputMode="numeric"
        autoComplete={lunar ? 'off' : autoComplete}
        placeholder={f.datePlaceholder}
        value={birth.text}
        aria-invalid={isError ? true : undefined}
        aria-describedby={message ? msgId : undefined}
        onChange={(e) => birth.onText(e.target.value)}
      />
      {lunar ? (
        <label className="rf-check bd-leap">
          <input type="checkbox" checked={birth.leap} onChange={(e) => birth.onLeap(e.target.checked)} />
          <span>{L.leap}</span>
        </label>
      ) : null}
      {}
      <p id={msgId} className={isError ? 'rf-error' : 'rf-hint'} aria-live="polite" hidden={!message}>
        {message}
      </p>
    </div>
  );
}
