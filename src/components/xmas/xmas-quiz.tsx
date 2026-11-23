'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { XMAS_FLOW, XMAS_PAID } from '@/content/xmas';
import { XMAS_QUIZ } from '@/content/ko/xmas-quiz';
import { QUIZ, QUIZ_LENGTH, optionLetter, parseQuizAnswers, parseQuizType, quizRelation, quizType, quizTypeArt } from '@/lib/xmas/quiz';
import { unknownPlace } from '@/lib/places/unknown-place';
import { track } from '@/lib/analytics/track';
import { callName } from '@/lib/xmas/call-name';
import { useLocale } from '../locale-provider';
import { updateAnswers, useAnswers } from '../flow/answers';
import { checkDate, checkTime, maskDate, maskTime } from '../flow/reading-form';
import { markContinue, XMAS_ROOM_PATH } from '../rooms/continue';
import { Balloon, StoryBeats } from '../story/story-strip';
import type { Beat } from '../story/types';
import { XmasLanding, useXmasTitle } from './xmas-landing';
import { XmasResult } from './xmas-result';
import { XmasQuizCard } from './xmas-quiz-card';
import { loadQuizDraft, loadXmasQuiz, markXmasFrom, saveQuizDraft, saveXmasInput, saveXmasQuiz, useHydrated } from './xmas-store';
import '../story/story-strip.css';
import './xmas-landing.css';
import './xmas-flow.css';
import './xmas-quiz.css';

const Q = XMAS_QUIZ;
const F = XMAS_FLOW.start;

const START_ART = '/media/xmas/quiz-start.jpg';

type Phase = 'start' | 'quiz' | 'birth' | 'result';

function hasBirth(a: ReturnType<typeof useAnswers>): boolean {
  return Boolean(a.name && a.date && a.timeAnswered && a.sex);
}

export function XmasQuiz() {
  const locale = useLocale();
  useXmasTitle(locale);

  if (locale !== 'ko') return <XmasLanding />;
  return <QuizFlow />;
}

function QuizFlow() {
  const router = useRouter();
  const hydrated = useHydrated();
  const saved = useAnswers();

  const [phaseState, setPhase] = useState<Phase | null>(null);
  const [draftState, setDraft] = useState<string | null>(null);
  const done = hydrated ? parseQuizAnswers(loadXmasQuiz()) : null;
  const draft = draftState ?? (hydrated ? loadQuizDraft().slice(0, QUIZ_LENGTH) : '');
  const phase: Phase = phaseState ?? (done && hasBirth(saved) ? 'result' : done ? 'birth' : draft ? 'quiz' : 'start');
  const shared = hydrated ? parseQuizType(new URLSearchParams(window.location.search).get('t')) : null;

  const [name, setName] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [noTime, setNoTime] = useState(false);
  const [sex, setSex] = useState<'female' | 'male' | null>(null);

  const [pDate, setPDate] = useState('');
  const [pTime, setPTime] = useState('');
  const [pNoTime, setPNoTime] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameValue = name ?? saved.name;
  const dateValue = date ?? (saved.date ? saved.date.replaceAll('-', '.') : '');
  const timeValue = time ?? saved.time ?? '';

  function answer(k: number) {
    const next = (draft + optionLetter(k)).slice(0, QUIZ_LENGTH);
    setDraft(next);
    saveQuizDraft(next);
    const n = next.length;
    if (n === 1) track('quiz_start');
    if (n % 5 === 0 && n < QUIZ_LENGTH) track('quiz_q', { i: n });
    if (n === QUIZ_LENGTH) {
      track('quiz_done');
      saveXmasQuiz(next);
      setPhase('birth');
    }
    window.scrollTo({ top: 0 });
  }

  function back() {
    if (phase === 'birth') {

      saveXmasQuiz(null);
      const prev = draft.slice(0, QUIZ_LENGTH - 1);
      setDraft(prev);
      saveQuizDraft(prev);
      return setPhase('quiz');
    }
    if (!draft) return setPhase('start');
    const prev = draft.slice(0, -1);
    setDraft(prev);
    saveQuizDraft(prev);
    setPhase('quiz');
  }

  function submitBirth(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nameValue.trim()) return setError(F.errors.name);
    const d = checkDate(dateValue);
    if (!d.ok) return setError(F.errors.date);
    if (!noTime && !checkTime(timeValue)) return setError(F.errors.time);
    const chosen = sex ?? saved.sex;
    if (!chosen) return setError(F.steps.sex.hint);

    let partner: { date: string; time: string | null } | null = null;
    if (pDate.trim()) {
      const pd = checkDate(pDate);
      if (!pd.ok) return setError(F.errors.partnerDate);
      const pt = pNoTime || !pTime ? null : checkTime(pTime);
      if (!pNoTime && pTime && !pt) return setError(F.errors.partnerTime);
      partner = { date: pd.iso, time: pt };
    }
    const answers = parseQuizAnswers(loadXmasQuiz());
    if (!answers) return setPhase('quiz');
    const relation = quizRelation(answers);
    updateAnswers({
      name: nameValue.trim().slice(0, 10),
      date: d.iso,
      time: noTime ? null : checkTime(timeValue),
      timeAnswered: true,
      place: saved.place ?? unknownPlace(-new Date().getTimezoneOffset()),
      sex: chosen,
      sexAnswered: true,
      sexChoice: chosen,
      nbChoice: null,
      concern: relation.stage === 'past' ? 'ex' : 'crush',
    });

    saveXmasInput({ relation, partner });
    track('quiz_birth', { partner: partner ? 1 : 0 });
    setPhase('result');
    window.scrollTo({ top: 0 });
  }

  function restart() {
    saveXmasQuiz(null);
    saveQuizDraft('');
    setDraft('');
    setPhase('start');
    window.scrollTo({ top: 0 });
  }

  function pay() {

    track('quiz_cta');
    markXmasFrom('quiz');
    markContinue('love', 'free_result', Date.now(), true, 'xmas');
    router.push(XMAS_ROOM_PATH);
  }

  if (!hydrated) return <main className="sd-page xm" lang="ko" />;

  if (phase === 'result') {
    const answers = done ?? parseQuizAnswers(loadXmasQuiz());
    if (!answers) return null;
    return <QuizResult answers={answers} onPay={pay} onRestart={restart} />;
  }

  if (phase === 'start') {
    return (
      <main className="sd-page xm" lang="ko">
        <div className="sd xs xq">
          <div className="xs__art" aria-hidden="true">
            <Image src={START_ART} alt="" fill priority sizes="(min-width: 480px) 480px, 100vw" data-on="" />
          </div>
          <div className="xs__body">
            <Balloon className="xs__say" text={shared ? Q.start.shared.replace('{type}', Q.types[shared].name) : Q.start.lead} tail="ul" reveal />
            <div className="xs__panel xq__start">
              <h1 className="xq__title">{Q.start.title}</h1>
              <button type="button" className="xs__next" onClick={() => setPhase('quiz')}>
                {Q.start.button}
              </button>
              <p className="xq__time">{Q.start.time}</p>
              {}
              <p className="xq__price">{Q.start.price}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const index = Math.min(draft.length, QUIZ_LENGTH - 1);
  const q = QUIZ[index];

  return (
    <main className="sd-page xm" lang="ko">
      <div className="sd xq xq--plain">
        <div className="xq__top">
          <button type="button" onClick={back}>
            {Q.back}
          </button>
          {phase === 'quiz' ? (
            <div className="xq__bar" role="progressbar" aria-valuemin={0} aria-valuemax={QUIZ_LENGTH} aria-valuenow={draft.length} aria-label={Q.progress.replace('{n}', String(draft.length))}>
              <i style={{ width: `${(draft.length / QUIZ_LENGTH) * 100}%` }} />
            </div>
          ) : null}
        </div>

        {phase === 'quiz' ? (
          <div key={index} className="xq__step">
            <p className="xq__part">{Q.parts[q.part]}</p>
            {}
            <h1 className="xq__q">
              <span className="xq__no">{Q.number.replace('{n}', String(index + 1))}</span>
              <span>{Q.questions[q.id].q}</span>
            </h1>
            <div className="xq__options">
              {Q.questions[q.id].o.map((label, k) => (
                <button key={label} type="button" onClick={() => answer(k)}>
                  {label}
                </button>
              ))}
            </div>
            <p className="xq__count">{Q.progress.replace('{n}', String(index + 1))}</p>
          </div>
        ) : null}

        {phase === 'birth' ? (
          <form className="xs__panel xq__birth" onSubmit={submitBirth} noValidate>
            <p className="xq__over">{Q.birth.over}</p>
            <h1 className="xq__q xq__q--center">{Q.birth.title}</h1>
            <p className="xq__lead">{Q.birth.lead}</p>
            <label>
              <span>{F.steps.name.label}</span>
              <input value={nameValue} onChange={(e) => setName(e.target.value)} placeholder={F.steps.name.placeholder} maxLength={10} autoComplete="off" />
            </label>
            <label>
              <span>{F.steps.date.label}</span>
              <input value={dateValue} onChange={(e) => setDate(maskDate(e.target.value))} placeholder={F.steps.date.placeholder} inputMode="numeric" autoComplete="off" />
              <small>{F.steps.date.hint}</small>
            </label>
            <label>
              <span>{F.steps.time.label}</span>
              <input
                value={noTime ? '' : timeValue}
                onChange={(e) => {
                  setNoTime(false);
                  setTime(maskTime(e.target.value));
                }}
                placeholder={F.steps.time.placeholder}
                inputMode="numeric"
                autoComplete="off"
              />
            </label>
            <button type="button" className="xs__chip" aria-pressed={noTime} onClick={() => setNoTime(!noTime)}>
              {F.steps.time.unknown}
            </button>
            <div className="xs__options" data-cols="2">
              {(['female', 'male'] as const).map((v) => (
                <button key={v} type="button" aria-pressed={(sex ?? saved.sex) === v} onClick={() => setSex(v)}>
                  {F.steps.sex[v]}
                </button>
              ))}
            </div>
            <div className="xq__partner">
              <h2>{Q.birth.partnerTitle}</h2>
              <p>{Q.birth.partnerLead}</p>
              <label>
                <span>{F.steps.partner.label}</span>
                <input value={pDate} onChange={(e) => setPDate(maskDate(e.target.value))} placeholder={F.steps.partner.placeholder} inputMode="numeric" autoComplete="off" />
                <small>{F.steps.partner.hint}</small>
              </label>
              <label>
                <span>{F.steps.partner.timeLabel}</span>
                <input
                  value={pNoTime ? '' : pTime}
                  onChange={(e) => {
                    setPNoTime(false);
                    setPTime(maskTime(e.target.value));
                  }}
                  placeholder={F.steps.partner.timePlaceholder}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </label>
              <button type="button" className="xs__chip" aria-pressed={pNoTime} onClick={() => setPNoTime(!pNoTime)}>
                {F.steps.partner.timeUnknown}
              </button>
            </div>
            {error ? (
              <p className="xq__error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="xs__next">
              {Q.birth.button}
            </button>
            <small className="xq__note">{Q.birth.note}</small>
          </form>
        ) : null}
      </div>
    </main>
  );
}

function QuizResult({ answers, onPay, onRestart }: { answers: string; onPay: () => void; onRestart: () => void }) {
  const saved = useAnswers();
  const type = quizType(answers);
  const t = Q.types[type];
  const R = Q.result;
  useEffect(() => {
    track('quiz_type', { t: type });
  }, [type]);
  const name = callName(saved.name) || XMAS_PAID.you;

  const fill = (beats: readonly Beat[]): Beat[] =>
    beats.map((b) => (b.kind === 'say' || b.kind === 'me' ? { ...b, text: b.text.replace('{name}', name).replace('{type}', t.name) } : b));
  const head = (
    <div className="xq-result-head">
      <div className="xq__head" style={{ '--xq-art': `url(${quizTypeArt(type)})` } as CSSProperties}>
        <p className="xq__over">{R.over}</p>
        <p className="xq__who">{name}</p>
        <h1 className="xq__type">
          <span>{t.name}</span>
        </h1>
        <p className="xq__line">{t.line}</p>
      </div>
      <XmasQuizCard type={type} />
    </div>
  );

  const beforePitch = (
    <>
      <StoryBeats beats={fill(Q.bridge.out)} />
      <section className="xq__locked" aria-label={`${t.name} ${R.locked.title}`}>
        <p className="xq__over">{R.locked.over}</p>
        <p className="xq__locked-type">{t.name}</p>
        <h2>{R.locked.title}</h2>
        <ul>
          {R.locked.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="xq__locked-note">{R.price.note}</p>
      </section>
    </>
  );
  const tail = (
    <div className="xq__tail">
      <p className="xq__fun">{R.fun}</p>
      <button type="button" className="xq__again" onClick={onRestart}>
        {R.again}
      </button>
    </div>
  );
  return <XmasResult quiz={{ onPay, head, bridgeIn: <StoryBeats beats={fill(Q.bridge.in)} />, beforePitch, tail }} />;
}
