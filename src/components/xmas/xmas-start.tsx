'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { XMAS_FLOW, XMAS_PAID } from '@/content/xmas';
import { useLocale } from '../locale-provider';
import { useXmasTitle } from './xmas-landing';
import { unknownPlace } from '@/lib/places/unknown-place';
import { asksContact, XMAS_STAGES, type XmasContact, type XmasGoal, type XmasStage } from '@/lib/xmas/relation';
import { updateAnswers, useAnswers } from '../flow/answers';
import { checkDate, checkTime, maskDate, maskTime } from '../flow/reading-form';
import { Balloon } from '../story/story-strip';
import '../story/story-strip.css';
import './xmas-landing.css';
import './xmas-flow.css';
import { useVideoAllowed } from '../scene/use-video-allowed';
import { saveXmasInput, saveXmasQuiz } from './xmas-store';
import { callName } from '@/lib/xmas/call-name';

const F = XMAS_FLOW.start;
const ALL = ['hello', 'name', 'date', 'time', 'sex', 'stage', 'goal', 'contact', 'partner'] as const;
type Step = (typeof ALL)[number];

const concernOf = (stage: XmasStage) => (stage === 'past' ? 'ex' : 'crush');

export function XmasStart() {
  const router = useRouter();
  const locale = useLocale();
  useXmasTitle(locale);
  const saved = useAnswers();
  const [at, setAt] = useState<Step>('hello');
  const videoOk = useVideoAllowed();
  const [name, setName] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [noTime, setNoTime] = useState(false);
  const [sex, setSex] = useState<'female' | 'male' | null>(null);

  const [stage, setStage] = useState<XmasStage | null>(() => {
    if (typeof window === 'undefined') return null;
    const s = new URLSearchParams(window.location.search).get('s');
    return s && (XMAS_STAGES as readonly string[]).includes(s) ? (s as XmasStage) : null;
  });
  const [goal, setGoal] = useState<XmasGoal | null>(null);
  const [contact, setContact] = useState<XmasContact | null>(null);
  const [pDate, setPDate] = useState('');
  const [pTime, setPTime] = useState('');
  const [pNoTime, setPNoTime] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const order: readonly Step[] = ALL.filter((s) => s !== 'contact' || (stage !== null && asksContact(stage)));
  const index = order.indexOf(at);

  const nameValue = name ?? saved.name;
  const dateValue = date ?? (saved.date ? saved.date.replaceAll('-', '.') : '');
  const timeValue = time ?? saved.time ?? '';

  useEffect(() => {
    if (at !== 'hello') return;
    const t = window.setTimeout(() => setAt('name'), 3600);
    return () => window.clearTimeout(t);
  }, [at]);

  function go(step: Step) {
    setError(null);
    setAt(step);
  }
  const next = (from: Step, list: readonly Step[] = order) => go(list[list.indexOf(from) + 1]);

  function finish(partner: { date: string; time: string | null } | null) {
    const d = checkDate(dateValue);
    if (!d.ok) return go('date');
    if (!stage || !goal) return go('stage');
    const chosen = sex ?? saved.sex;
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
      concern: concernOf(stage),
    });
    saveXmasInput({ relation: { stage, goal, contact: asksContact(stage) ? contact : null }, partner });

    saveXmasQuiz(null);
    router.push('/xmas/result');
  }

  function submitPartner() {
    const d = checkDate(pDate);
    if (!d.ok) return setError(F.errors.partnerDate);
    const t = pNoTime || !pTime ? null : checkTime(pTime);
    if (!pNoTime && pTime && !t) return setError(F.errors.partnerTime);
    finish({ date: d.iso, time: t });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (at === 'name') return nameValue.trim() ? next('name') : setError(F.errors.name);
    if (at === 'date') return checkDate(dateValue).ok ? next('date') : setError(F.errors.date);
    if (at === 'time') return noTime || checkTime(timeValue) ? next('time') : setError(F.errors.time);
    if (at === 'partner') return submitPartner();
  }

  return (
    <main className="sd-page xm" lang={locale}>
      <div className="sd xs">
        <div className="xs__top">
          <button type="button" onClick={() => (index <= 1 ? router.push('/xmas') : go(order[index - 1]))}>
            {F.back}
          </button>
          <ol aria-label={F.progress.replace('{n}', String(index + 1)).replace('{total}', String(order.length))}>
            {order.map((key, i) => (
              <li key={key} data-on={i <= index ? '' : undefined} />
            ))}
          </ol>
        </div>

        {}
        <div className="xs__art" aria-hidden="true">
          {ALL.map((key, i) => (
            <Image key={key} src={F.steps[key].image} alt="" fill priority={i === 0} sizes="(min-width: 480px) 480px, 100vw" data-on={key === at ? '' : undefined} />
          ))}
          {}
          {videoOk
            ? ALL.map((key) => {
                const step = F.steps[key];
                return 'video' in step && key === at ? <video key={key} className="xs__video" src={step.video} poster={step.image} autoPlay muted loop playsInline preload="auto" /> : null;
              })
            : null}
        </div>

        <div key={at} className="xs__body">
          <Balloon className="xs__say" text={F.steps[at].say.replace('{name}', callName(nameValue) || XMAS_PAID.you)} tail="ul" reveal />

          <form className="xs__panel" onSubmit={submit} noValidate>
            {at === 'hello' ? (
              <button type="button" className="xs__next" onClick={() => go('name')}>
                {F.steps.hello.go}
              </button>
            ) : null}
            {at === 'name' ? (
              <label>
                <span>{F.steps.name.label}</span>
                <input value={nameValue} onChange={(e) => setName(e.target.value)} placeholder={F.steps.name.placeholder} maxLength={10} autoComplete="off" />
              </label>
            ) : null}
            {at === 'date' ? (
              <label>
                <span>{F.steps.date.label}</span>
                <input value={dateValue} onChange={(e) => setDate(maskDate(e.target.value))} placeholder={F.steps.date.placeholder} inputMode="numeric" autoComplete="off" />
                <small>{F.steps.date.hint}</small>
              </label>
            ) : null}
            {at === 'time' ? (
              <>
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
                  <small>{F.steps.time.hint}</small>
                </label>
                <button type="button" className="xs__chip" aria-pressed={noTime} onClick={() => setNoTime(!noTime)}>
                  {F.steps.time.unknown}
                </button>
              </>
            ) : null}
            {at === 'sex' ? (
              <div className="xs__options" data-cols="2">
                {(['female', 'male'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={(sex ?? saved.sex) === v}
                    onClick={() => {
                      setSex(v);
                      next('sex');
                    }}
                  >
                    {F.steps.sex[v]}
                  </button>
                ))}
                <small>{F.steps.sex.hint}</small>
              </div>
            ) : null}
            {at === 'stage' ? (
              <div className="xs__options">
                {F.steps.stage.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={stage === o.id}
                    onClick={() => {
                      setStage(o.id);
                      if (!asksContact(o.id)) setContact(null);
                      next('stage');
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            ) : null}
            {at === 'goal' ? (
              <div className="xs__options">
                {F.steps.goal.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={goal === o.id}
                    onClick={() => {
                      setGoal(o.id);
                      next('goal');
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            ) : null}
            {at === 'contact' ? (
              <div className="xs__options">
                {F.steps.contact.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={contact === o.id}
                    onClick={() => {
                      setContact(o.id);
                      next('contact');
                    }}
                  >
                    {o.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="xs__chip"
                  onClick={() => {
                    setContact(null);
                    next('contact');
                  }}
                >
                  {F.steps.contact.skip}
                </button>
              </div>
            ) : null}
            {at === 'partner' ? (
              <>
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
              </>
            ) : null}

            {error ? (
              <p className="xs__error" role="alert">
                {error}
              </p>
            ) : null}
            {at === 'name' || at === 'date' || at === 'time' ? (
              <button type="submit" className="xs__next">
                {F.next}
              </button>
            ) : null}
            {at === 'partner' ? (
              <>
                <button type="submit" className="xs__next">
                  {F.done}
                </button>
                <button type="button" className="xs__chip" onClick={() => finish(null)}>
                  {F.steps.partner.skip}
                </button>
              </>
            ) : null}
          </form>
        </div>
        <p className="xs__privacy">{F.privacy}</p>
      </div>
    </main>
  );
}
