'use client';

import { useId, useState } from 'react';
import { ROOMS_COPY } from '@/content/rooms';
import { UI } from '@/content/ui';
import { deviceStandardOffsetMinutes, unknownPlace } from '@/lib/places/unknown-place';
import { CHOOSABLE_PAIR_KINDS, type PairKind } from '@/lib/rooms/themes';
import type { PlaceChoice } from '../flow/answers';
import { CitySearch } from '../flow/city-search';
import { BirthDateField, useBirthDate } from '../flow/birth-date-field';
import { checkTime, maskDate, maskTime } from '../flow/reading-form';
import { ChevronLeftIcon } from '../icons';
import { sceneStill } from '../scene/resolve';
import { savePartner, type Partner } from './partner';

type Gender = 'female' | 'male' | 'skip';

export function PartnerForm({ initial, onBack, onDone }: { initial: Partner | null; onBack: () => void; onDone: () => void }) {
  const t = ROOMS_COPY.partnerForm;
  const f = UI.reading.form;
  const uid = useId();
  const [name, setName] = useState(initial?.name ?? '');
  const birth = useBirthDate(initial?.date ?? null, maskDate);
  const [time, setTime] = useState(initial?.time ?? '');
  const [timeUnknown, setTimeUnknown] = useState(initial ? initial.time === null : false);
  const [place, setPlace] = useState<PlaceChoice | null>(initial?.place ?? null);
  const [gender, setGender] = useState<Gender | null>(initial ? (initial.sex ?? 'skip') : null);
  const [kind, setKind] = useState<PairKind | null>(initial?.kind ?? null);
  const [tried, setTried] = useState(false);

  const dateCheck = birth.check;
  const timeValue = timeUnknown ? null : checkTime(time);

  const timeOk = timeUnknown || time === '' || timeValue !== null;
  const ready = dateCheck.ok && timeOk && gender !== null && kind !== null;

  const timeError = !timeOk && (tried || time.length >= 5) ? f.errors.time : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || !dateCheck.ok || !kind) {
      setTried(true);
      return;
    }
    savePartner({
      name: name.trim().slice(0, 24),
      date: dateCheck.iso,
      time: timeValue,
      place: place ?? unknownPlace(deviceStandardOffsetMinutes()),
      sex: gender === 'female' || gender === 'male' ? gender : null,
      kind,
    });
    onDone();
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
          <h1 className="rf-label m-0 text-[1.125rem]">{t.heading}</h1>

          <fieldset className="rf-field">
            <legend className="rf-label">{t.kind}</legend>
            <div className="rm-kinds">
              {CHOOSABLE_PAIR_KINDS.map((k) => (
                <button key={k} type="button" className="rf-choice" aria-pressed={kind === k} onClick={() => setKind(k)}>
                  {ROOMS_COPY.page.pairKinds[k]}
                </button>
              ))}
            </div>
            {kind === null && tried ? <p className="rf-error">{t.errors.kind}</p> : null}
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
              aria-describedby={`${uid}-name-hint`}
              onChange={(e) => setName(e.target.value)}
            />
            <p id={`${uid}-name-hint`} className="rf-hint">
              {t.nameHint}
            </p>
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

          <div className="rf-submit">
            <button type="submit" className="rf-next" aria-disabled={!ready}>
              {t.submit}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
