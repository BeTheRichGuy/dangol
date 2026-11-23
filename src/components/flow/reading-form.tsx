'use client';

import { useId, useRef, useState } from 'react';
import { ACCOUNT } from '@/content/account';
import { UI } from '@/content/ui';
import { samePerson } from '@/lib/account/person';
import { deviceStandardOffsetMinutes, unknownPlace } from '@/lib/places/unknown-place';
import { track } from '@/lib/analytics/track';
import type { Person, PersonDraft } from '@/lib/account/types';
import { ChevronLeftIcon } from '../icons';
import { RevealText } from '../mystic';
import { bubbleDelay } from '../result/balloons';
import { sceneStill } from '../scene/resolve';
import { Bubble, Panel } from '../webtoon';
import { NAME_MAX, QUESTION_MAX, updateAnswers, type Answers, type PlaceChoice, type SexChoice } from './answers';
import '../account/account.css';
import '../rooms/rooms.css';
import { CitySearch } from './city-search';
import { BirthDateField, useBirthDate } from './birth-date-field';
import { parseDateParts } from './fields';
import './reading-form.css';

function joinDigits(raw: string, starts: readonly number[]): string {
  const groups = raw.split(/\D+/);
  let digits = '';
  groups.forEach((g, i) => {
    const closed = i < groups.length - 1;
    digits += closed && g.length === 1 && starts.includes(digits.length) ? `0${g}` : g;
  });
  return digits;
}

export function maskDate(raw: string): string {
  const d = joinDigits(raw, [4, 6]).slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}.${d.slice(4)}`;
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}`;
}

export function maskTime(raw: string): string {
  let d = joinDigits(raw, [0]).slice(0, 4);
  const half = /[ap]/i.exec(raw)?.[0].toLowerCase();
  const hour = Number(d.slice(0, 2));
  if (half && d.length >= 2 && hour >= 1 && hour <= 12) {
    d = String(half === 'p' ? (hour % 12) + 12 : hour % 12).padStart(2, '0') + d.slice(2);
  }
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

export type DateCheck = { ok: true; iso: string } | { ok: false; error: 'empty' | 'invalid' | 'range' };

export function checkDate(text: string): DateCheck {
  const m = /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/.exec(text.trim());
  if (!text.trim()) return { ok: false, error: 'empty' };
  if (!m) return { ok: false, error: 'invalid' };
  const r = parseDateParts({ year: m[1], month: String(Number(m[2])), day: String(Number(m[3])) });
  if (r.ok) return { ok: true, iso: r.iso };
  return { ok: false, error: r.error === 'range' ? 'range' : 'invalid' };
}

export function checkTime(text: string): string | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(text.trim());
  return m ? `${m[1]}:${m[2]}` : null;
}

type Gender = 'female' | 'male' | 'skip';

function genderOf(a: Answers): Gender | null {
  if (a.sexChoice === 'female' || a.sexChoice === 'male' || a.sexChoice === 'skip') return a.sexChoice;

  if (a.sexAnswered) return a.sex ?? 'skip';
  return null;
}

const GUIDED_PARTS = ['birth', 'time', 'you'] as const;
const GUIDED_ART = [
  '/media/webtoon/yul-form-welcome.jpg',
  '/media/webtoon/yul-form-time.jpg',
  '/media/webtoon/yul-form-you.jpg',
] as const;
const LAST_PART = GUIDED_PARTS.length - 1;

export function ReadingForm({
  answers,
  onBack,
  onDone,
  privacy,
  account,
  guided = false,
}: {
  answers: Answers;
  onBack: () => void;
  onDone: () => void;

  privacy?: string;

  account?: { people: readonly Person[]; onSave: (draft: PersonDraft) => void };

  guided?: boolean;
}) {
  const t = UI.reading.form;
  const [part, setPart] = useState(0);

  const showing = (n: number) => !guided || part === n;
  const lastPart = !guided || part === LAST_PART;
  const uid = useId();
  const [name, setName] = useState(answers.name);
  const birth = useBirthDate(answers.date, maskDate);
  const [time, setTime] = useState(answers.time ?? '');
  const [timeUnknown, setTimeUnknown] = useState(answers.timeAnswered && answers.time === null);
  const [place, setPlace] = useState<PlaceChoice | null>(answers.place);
  const [gender, setGender] = useState<Gender | null>(genderOf(answers));
  const [question, setQuestion] = useState(answers.question);
  const [tried, setTried] = useState(false);
  const startedRef = useRef(false);
  const [save, setSave] = useState(true);

  const [filled, setFilled] = useState(0);

  const dateCheck = birth.check;
  const timeValue = timeUnknown ? null : checkTime(time);

  const timeOk = timeUnknown || time === '' || timeValue !== null;
  const ready = dateCheck.ok && timeOk && gender !== null;

  const timeError = !timeOk && (tried || time.length >= 5) ? t.errors.time : null;
  const genderError = gender === null && tried ? t.errors.gender : null;

  const people = account?.people ?? [];
  const hasSelf = people.some((p) => p.relation === 'self');
  const known =
    dateCheck.ok && timeOk ? people.find((p) => samePerson(p, { date: dateCheck.iso, time: timeValue, place: place ?? unknownPlace(deviceStandardOffsetMinutes()) })) : undefined;
  const offerSave = account !== undefined && !known;

  function fill(p: Person) {
    setName(p.name);
    birth.setIso(p.date);
    setTime(p.time ?? '');
    setTimeUnknown(p.time === null);
    setPlace(p.place);
    setGender(p.sex ?? 'skip');
    setFilled((n) => n + 1);
  }

  function goPart(n: number) {
    setTried(false);
    setPart(n);
    window.scrollTo(0, 0);
  }

  function advance() {
    const fine = part === 0 ? dateCheck.ok : timeOk;
    if (!fine) {
      setTried(true);
      return;
    }
    goPart(part + 1);
  }

  function back() {
    if (guided && part > 0) goPart(part - 1);
    else onBack();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!lastPart) {
      advance();
      return;
    }
    if (!ready || !dateCheck.ok) {
      setTried(true);
      return;
    }
    const sex = gender === 'female' || gender === 'male' ? gender : null;
    const sexChoice: SexChoice = gender ?? 'skip';

    const where = place ?? unknownPlace(deviceStandardOffsetMinutes());
    updateAnswers({
      name: name.trim().slice(0, NAME_MAX),
      date: dateCheck.iso,
      time: timeValue,
      timeAnswered: true,
      place: where,
      sex,
      sexAnswered: true,
      sexChoice,
      nbChoice: null,
      question: question.trim().slice(0, QUESTION_MAX),
    });
    track('birth_done', { time_unknown: timeValue === null, gender: gender ?? 'skip', has_question: question.trim().length > 0, city_unknown: place === null });
    if (offerSave && save) {
      account.onSave({ name: name.trim().slice(0, NAME_MAX) || ACCOUNT.people.me, relation: hasSelf ? 'other' : 'self', date: dateCheck.iso, time: timeValue, place: where, sex });
    }
    onDone();
  }

  const art = GUIDED_ART[part];
  const lines = t.guided[GUIDED_PARTS[part]];

  return (
    <div className={guided ? 'rf-screen rf-guided' : 'rf-screen'}>
      {guided ? null : (
        <div aria-hidden="true" className="rf-backdrop">
          {/* eslint-disable-next-line @next/next/no-img-element -- 흐리게 까는 배경이라 최적화가 필요 없다 */}
          <img src={sceneStill('listen')} alt="" />
        </div>
      )}
      <main id="main" className="rf-main">
        <div className={guided ? 'rf-top rf-top--guided' : 'rf-top'}>
          <button type="button" className="rf-back" onClick={back} aria-label={UI.common.back}>
            <ChevronLeftIcon size={22} />
          </button>
          {guided ? (
            <p className="rf-step" role="status">
              {UI.reading.progress(part + 1, GUIDED_PARTS.length)}
            </p>
          ) : null}
        </div>

        <form
          className="rf-form"
          onSubmit={submit}
          noValidate
          onFocusCapture={() => {

            if (!startedRef.current) {
              startedRef.current = true;
              track('birth_start');
            }
          }}
        >
          <h1 className="sr-only">{t.heading}</h1>
          {guided ? (

            <section className="rf-lead" key={part}>
              <Panel image={art} alt="" aspect="square" eager>
                {lines.map((text, i) => (
                  <Bubble key={`${i}:${text}`} side="left" tail="none" delayMs={bubbleDelay(i)}>
                    <p className="rm-lines">
                      <RevealText text={text} delayMs={bubbleDelay(i)} />
                    </p>
                  </Bubble>
                ))}
              </Panel>
            </section>
          ) : null}
          {t.previewLine && showing(0) ? <p className="rf-hint">{t.previewLine}</p> : null}

          {people.length > 0 && showing(0) ? (
            <div className="rf-field">
              <p className="rf-label">{ACCOUNT.form.pickHeading}</p>
              <div className="ac-chips">
                {people.map((p) => (
                  <button key={p.id} type="button" className="rf-choice" aria-pressed={known?.id === p.id} onClick={() => fill(p)}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {showing(0) ? (
            <>
              <div className="rf-field">
                <label htmlFor={`${uid}-name`} className="rf-label">
                  {t.name}
                </label>
                <input
                  id={`${uid}-name`}
                  className="rf-input"
                  type="text"
                  autoComplete="nickname"
                  maxLength={NAME_MAX}
                  placeholder={t.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <BirthDateField id={`${uid}-date`} label={t.date} birth={birth} tried={tried} autoComplete="bday" />
            </>
          ) : null}

          {showing(1) ? (
            <>
              <div className="rf-field">
                <div className="rf-label-row">
                  <label htmlFor={`${uid}-time`} className="rf-label">
                    {t.time} <span className="rf-optional">{t.questionOptional}</span>
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
                    <span>{t.timeUnknown}</span>
                  </label>
                </div>
                <input
                  id={`${uid}-time`}
                  className="rf-input"
                  type="text"
                  inputMode="numeric"
                  placeholder={t.timePlaceholder}
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
                <CitySearch key={filled} initial={place} onSelect={setPlace} onClear={() => setPlace(null)} optional={t.questionOptional} />
              </div>
            </>
          ) : null}

          {showing(2) ? (
            <>
          <fieldset className="rf-field">
            <legend className="rf-label">{t.gender}</legend>
            <div className="rf-choices">
              {(['female', 'male'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  className="rf-choice"
                  aria-pressed={gender === g}
                  onClick={() => setGender(g)}
                >
                  {g === 'female' ? t.woman : t.man}
                </button>
              ))}
            </div>
            <div className="rf-skip-row">
              <button type="button" className="rf-skip" aria-pressed={gender === 'skip'} onClick={() => setGender('skip')}>
                {t.genderSkip}
              </button>
              <p className="rf-hint">{t.genderHint}</p>
            </div>
            {genderError ? <p className="rf-error">{genderError}</p> : null}
          </fieldset>

          <div className="rf-field">
            <div className="rf-label-row">
              <label htmlFor={`${uid}-q`} className="rf-label">
                {t.question}
              </label>
              <span className="rf-optional">{t.questionOptional}</span>
            </div>
            <textarea
              id={`${uid}-q`}
              className="rf-input rf-textarea"
              rows={3}
              maxLength={QUESTION_MAX}
              placeholder={t.questionPlaceholder}
              value={question}
              aria-describedby={`${uid}-q-hint`}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="rf-label-row">
              <p id={`${uid}-q-hint`} className="rf-hint">
                {t.questionHint}
              </p>
              <span className="rf-hint tabular-nums">{t.counter(question.length, QUESTION_MAX)}</span>
            </div>
          </div>

          {offerSave ? (
            <label className="rf-check rf-save">
              <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
              <span>{hasSelf ? ACCOUNT.form.saveThem : ACCOUNT.form.saveMe}</span>
            </label>
          ) : null}
            </>
          ) : null}

          <div className="rf-submit">
            {lastPart ? (
              <button type="submit" className="rf-next" aria-disabled={!ready}>
                {t.submit}
              </button>
            ) : (
              <button type="submit" className="rf-next" aria-disabled={part === 0 ? !dateCheck.ok : !timeOk}>
                {t.guided.next}
              </button>
            )}
            {showing(0) || showing(2) ? (
              <p className="rf-privacy">{offerSave && save && lastPart ? ACCOUNT.form.savedNote : (privacy ?? t.privacy)}</p>
            ) : null}
          </div>
        </form>
      </main>
    </div>
  );
}
