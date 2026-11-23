'use client';

import { useId, useState } from 'react';
import { ACCOUNT } from '@/content/account';
import { ROOMS_COPY } from '@/content/rooms';
import { UI } from '@/content/ui';
import { deviceStandardOffsetMinutes, unknownPlace } from '@/lib/places/unknown-place';
import { RELATIONS, type Person, type PersonDraft, type PersonPlace, type Relation } from '@/lib/account/types';
import { CitySearch } from '../flow/city-search';
import { BirthDateField, useBirthDate } from '../flow/birth-date-field';
import { checkTime, maskDate, maskTime } from '../flow/reading-form';
import { ChevronLeftIcon } from '../icons';
import { sceneStill } from '../scene/resolve';
import { useAccount } from './account-provider';
import './account.css';

type Gender = 'female' | 'male' | 'skip';

export function relationName(r: Relation): string {
  return r === 'self' ? ACCOUNT.people.me : ROOMS_COPY.page.pairKinds[r];
}

export function PersonForm({
  initial,
  defaultRelation,
  onBack,
  onSaved,
}: {
  initial: Person | null;

  defaultRelation?: Relation;
  onBack: () => void;
  onSaved: (p: Person) => void;
}) {
  const t = ACCOUNT.people.form;
  const f = UI.reading.form;
  const uid = useId();
  const { savePerson } = useAccount();
  const [relation, setRelation] = useState<Relation | null>(initial?.relation ?? defaultRelation ?? null);
  const [name, setName] = useState(initial?.name ?? '');
  const birth = useBirthDate(initial?.date ?? null, maskDate);
  const [time, setTime] = useState(initial?.time ?? '');
  const [timeUnknown, setTimeUnknown] = useState(initial ? initial.time === null : false);
  const [place, setPlace] = useState<PersonPlace | null>(initial?.place ?? null);
  const [gender, setGender] = useState<Gender | null>(initial ? (initial.sex ?? 'skip') : null);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const dateCheck = birth.check;
  const timeValue = timeUnknown ? null : checkTime(time);

  const timeOk = timeUnknown || time === '' || timeValue !== null;
  const nameOk = name.trim().length > 0;
  const ready = relation !== null && nameOk && dateCheck.ok && timeOk && gender !== null;

  const timeError = !timeOk && (tried || time.length >= 5) ? f.errors.time : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || !dateCheck.ok || !relation) {
      setTried(true);
      return;
    }
    const draft: PersonDraft = {
      name: name.trim().slice(0, 24),
      relation,
      date: dateCheck.iso,
      time: timeValue,
      place: place ?? unknownPlace(deviceStandardOffsetMinutes()),
      sex: gender === 'female' || gender === 'male' ? gender : null,
    };
    setSaving(true);
    setFailed(false);
    try {
      onSaved(await savePerson(draft, initial?.id));
    } catch {
      setFailed(true);
      setSaving(false);
    }
  }

  return (
    <div className="rf-screen">
      <div aria-hidden="true" className="rf-backdrop">
        {/* eslint-disable-next-line @next/next/no-img-element -- 흐리게 까는 배경이라 최적화가 필요 없다 */}
        <img src={sceneStill('listen')} alt="" />
      </div>
      <main id="main" className="rf-main">
        <div className="rf-top">
          <button type="button" className="rf-back" onClick={onBack} aria-label={UI.common.back}>
            <ChevronLeftIcon size={22} />
          </button>
        </div>
        <form className="rf-form" onSubmit={submit} noValidate>
          <h1 className="rf-label m-0 text-[1.125rem]">{initial ? t.headingEdit : t.headingNew}</h1>

          <fieldset className="rf-field">
            <legend className="rf-label">{t.relation}</legend>
            <div className="ac-chips">
              {RELATIONS.map((r) => (
                <button key={r} type="button" className="rf-choice" aria-pressed={relation === r} onClick={() => setRelation(r)}>
                  {relationName(r)}
                </button>
              ))}
            </div>
            {relation === null && tried ? <p className="rf-error">{t.errors.relation}</p> : null}
          </fieldset>

          <div className="rf-field">
            <label htmlFor={`${uid}-name`} className="rf-label">
              {t.name}
            </label>
            <input
              id={`${uid}-name`}
              className="rf-input"
              type="text"
              autoComplete="off"
              maxLength={24}
              placeholder={t.namePlaceholder}
              value={name}
              aria-invalid={!nameOk && tried ? true : undefined}
              aria-describedby={!nameOk && tried ? `${uid}-name-err` : undefined}
              onChange={(e) => setName(e.target.value)}
            />
            {!nameOk && tried ? (
              <p id={`${uid}-name-err`} className="rf-error">
                {t.errors.name}
              </p>
            ) : null}
          </div>

          <BirthDateField id={`${uid}-date`} label={t.date} birth={birth} tried={tried} />

          <div className="rf-field">
            <div className="rf-label-row">
              <label htmlFor={`${uid}-time`} className="rf-label">
                {t.time} <span className="rf-optional">{f.questionOptional}</span>
              </label>
              <label className="rf-check">
                <input
                  type="checkbox"
                  checked={timeUnknown}
                  onChange={(e) => {
                    setTimeUnknown(e.target.checked);
                    if (e.target.checked) setTime('');
                  }}
                />
                <span>{f.timeUnknown}</span>
              </label>
            </div>
            <input
              id={`${uid}-time`}
              className="rf-input"
              type="text"
              inputMode="numeric"
              placeholder={f.timePlaceholder}
              value={time}
              disabled={timeUnknown}
              aria-invalid={timeError ? true : undefined}
              aria-describedby={timeError ? `${uid}-time-err` : undefined}
              onChange={(e) => setTime(maskTime(e.target.value))}
            />
            {timeError ? (
              <p id={`${uid}-time-err`} className="rf-error">
                {timeError}
              </p>
            ) : null}
          </div>

          <div className="rf-field rf-city">
            <CitySearch initial={place} onSelect={setPlace} onClear={() => setPlace(null)} label={t.city} optional={f.questionOptional} />
          </div>

          <fieldset className="rf-field">
            <legend className="rf-label">{t.gender}</legend>
            <div className="rf-choices">
              {(['female', 'male'] as const).map((g) => (
                <button key={g} type="button" className="rf-choice" aria-pressed={gender === g} onClick={() => setGender(g)}>
                  {g === 'female' ? f.woman : f.man}
                </button>
              ))}
            </div>
            <div className="rf-skip-row">
              <button type="button" className="rf-skip" aria-pressed={gender === 'skip'} onClick={() => setGender('skip')}>
                {t.genderSkip}
              </button>
              <p className="rf-hint">{f.genderHint}</p>
            </div>
            {gender === null && tried ? <p className="rf-error">{f.errors.gender}</p> : null}
          </fieldset>

          <p className="rf-hint ac-stored">{ACCOUNT.people.storedNote}</p>
          {failed ? (
            <p className="rf-error" role="alert">
              {t.errors.save}
            </p>
          ) : null}

          <div className="rf-submit">
            <button type="submit" className="rf-next" aria-disabled={!ready || saving} disabled={saving}>
              {saving ? t.saving : t.submit}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
