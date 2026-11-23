'use client';

import { useRef, useState, type FormEvent } from 'react';
import { CONCERN_ORDER, CONCERNS } from '@/content/concerns';
import { UI } from '@/content/ui';
import type { ConcernKey } from '@/lib/reading/types';
import { SendIcon } from '../icons';
import { NAME_MAX, updateAnswers, type Answers, type NbChoice, type SexChoice } from './answers';
import { CitySearch } from './city-search';
import { useFocusWhenReady } from './flow-context';
import {
  DateField,
  FieldError,
  TimeField,
  datePartsFrom,
  parseDateParts,
  parseTimeParts,
  timePartsFrom,
} from './fields';

const T = UI.reading.steps;

export function NameAnswers({ initial, onDone }: { initial: string; onDone: () => void }) {
  const [name, setName] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);
  useFocusWhenReady(inputRef);
  function submit(e: FormEvent) {
    e.preventDefault();
    updateAnswers({ name: name.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX) });
    onDone();
  }
  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="name" className="sr-only">
        {T.name.label}
      </label>
      <div className="dg-composer">
        <input
          id="name"
          ref={inputRef}
          className="dg-field"
          type="text"
          autoComplete="nickname"
          enterKeyHint="send"
          maxLength={NAME_MAX}
          placeholder={T.name.placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-describedby="name-hint"
        />
        <button type="submit" className="dg-send" aria-label={UI.common.continue}>
          <SendIcon size={24} />
        </button>
      </div>
      <p id="name-hint" className="m-0 mt-2 px-5 text-[0.75rem] font-medium leading-snug text-ink-soft">
        {T.name.hint}
      </p>
    </form>
  );
}

export function ConcernAnswers({ value, onDone }: { value: Answers['concern']; onDone: (concern: ConcernKey) => void }) {
  const C = T.concern;
  const groups = [
    { id: 'love', label: C.loveGroup },
    { id: 'life', label: C.lifeGroup },
  ] as const;
  return (
    <div className="dg-concerns">
      {groups.map((g) => (
        <div key={g.id} role="group" aria-labelledby={`concern-${g.id}`} className="dg-concerns__group">
          <p id={`concern-${g.id}`} className="dg-concerns__label">
            {g.label}
          </p>
          <div className="dg-concerns__chips">
            {CONCERN_ORDER.filter((k) => CONCERNS[k].group === g.id).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={value === k}
                className="dg-btn dg-btn--glass dg-chip dg-chip--sm"
                onClick={() => {
                  updateAnswers({ concern: k });
                  onDone(k);
                }}
              >
                {CONCERNS[k].label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DateAnswers({ initial, onDone }: { initial: string | null; onDone: () => void }) {
  const [parts, setParts] = useState(() => datePartsFrom(initial));
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const r = parseDateParts(parts);
    if (!r.ok) {
      setError(
        r.error === 'incomplete'
          ? UI.reading.errors.dateIncomplete
          : r.error === 'invalid'
            ? UI.reading.errors.dateInvalid
            : UI.reading.errors.dateRange(r.min, r.max),
      );
      return;
    }
    updateAnswers({ date: r.iso });
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate>
      <DateField
        value={parts}
        onChange={(next) => {
          setParts(next);
          setError(null);
        }}
        invalid={error !== null}
        describedBy={error ? 'date-error' : undefined}
      />
      {error ? <FieldError id="date-error">{error}</FieldError> : null}
      <button type="submit" className="dg-btn dg-btn--primary mt-3 w-full">
        {UI.common.continue}
      </button>
    </form>
  );
}

export function TimeAnswers({ initial, onDone }: { initial: string | null; onDone: () => void }) {
  const [parts, setParts] = useState(() => timePartsFrom(initial));
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const r = parseTimeParts(parts);
    if (!r.ok) {
      setError(r.error === 'period' ? UI.reading.errors.timePeriod : UI.reading.errors.timeInvalid);
      return;
    }
    updateAnswers({ time: r.hhmm, timeAnswered: true });
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate>
      <TimeField
        value={parts}
        onChange={(next) => {
          setParts(next);
          setError(null);
        }}
        invalid={error !== null}
        describedBy={error ? 'time-error' : undefined}
      />
      {error ? <FieldError id="time-error">{error}</FieldError> : null}
      {}
      <button type="submit" className="dg-btn dg-btn--primary mt-3 w-full">
        {UI.common.continue}
      </button>
      <div className="mt-1 flex justify-center">
        <button
          type="button"
          className="dg-link text-[0.9375rem] text-ink-soft"
          onClick={() => {
            updateAnswers({ time: null, timeAnswered: true });
            onDone();
          }}
        >
          {T.time.dontKnow}
        </button>
      </div>
    </form>
  );
}

export function PlaceAnswers({ place, onDone }: { place: Answers['place']; onDone: () => void }) {
  return (
    <div>
      <CitySearch
        initial={place}
        autoFocus
        onSelect={(p) => {
          updateAnswers({ place: p });
          onDone();
        }}
        onClear={() => updateAnswers({ place: null })}
      />
      {place ? (
        <button type="button" className="dg-btn dg-btn--primary mt-3 w-full" onClick={onDone}>
          {UI.common.continue}
        </button>
      ) : null}
    </div>
  );
}

export function SexAnswers({ value, onDone }: { value: Answers['sexChoice']; onDone: (choice: SexChoice) => void }) {
  const o = T.sex.options;
  function pick(choice: SexChoice) {
    if (choice === 'nonbinary') {
      updateAnswers({ sexChoice: choice, sex: null, sexAnswered: false, nbChoice: null });
    } else {
      updateAnswers({
        sexChoice: choice,
        sex: choice === 'female' ? 'female' : choice === 'male' ? 'male' : null,
        sexAnswered: true,
        nbChoice: null,
      });
    }
    onDone(choice);
  }
  const options: { value: SexChoice; label: string }[] = [
    { value: 'female', label: o.female },
    { value: 'male', label: o.male },
    { value: 'nonbinary', label: o.nonbinary },
  ];
  return (
    <div role="group" aria-label={T.sex.group} className="grid gap-2">
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={value === opt.value}
            className="dg-btn dg-btn--glass !px-1.5 !text-[0.9375rem]"
            onClick={() => pick(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {}
      <div className="flex justify-center">
        <button type="button" className="dg-link dg-onscene text-[0.9375rem]" onClick={() => pick('skip')}>
          {o.skip}
        </button>
      </div>
    </div>
  );
}

export function NbAnswers({ value, onDone }: { value: Answers['nbChoice']; onDone: (choice: NbChoice) => void }) {
  const o = T.sex.nbOptions;
  function pick(choice: NbChoice) {
    updateAnswers({
      nbChoice: choice,
      sex: choice === 'yang' ? 'male' : choice === 'yin' ? 'female' : null,
      sexAnswered: true,
    });
    onDone(choice);
  }
  return (
    <div role="group" aria-label={T.sex.nbGroup} className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" aria-pressed={value === 'yang'} className="dg-btn dg-btn--glass !px-3" onClick={() => pick('yang')}>
          {o.yang}
        </button>
        <button type="button" aria-pressed={value === 'yin'} className="dg-btn dg-btn--glass !px-3" onClick={() => pick('yin')}>
          {o.yin}
        </button>
      </div>
      {}
      <p className="dg-hint dg-onscene">{T.sex.nbHint}</p>
      <div className="flex justify-center">
        <button type="button" className="dg-link dg-onscene text-[0.9375rem]" onClick={() => pick('skip')}>
          {o.skip}
        </button>
      </div>
    </div>
  );
}
