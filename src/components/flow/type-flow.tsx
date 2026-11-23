'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { TYPE_PROFILES } from '@/content/types';
import { UI } from '@/content/ui';
import { EmailModal } from '../email-modal';
import { NameTag } from './dialogue-box';
import { Logo } from '../logo';
import { TypeCard } from '../result/type-card';
import { SiteFooter } from '../site-footer';
import { Stage } from '../stage';
import { useHydrated } from '../use-reduced-motion';
import { DateAnswers, PlaceAnswers, TimeAnswers } from './answer-forms';
import { getAnswers, updateAnswers, useAnswers, type Answers } from './answers';
import { computeTypeResult } from './compute';
import { Conversation } from './conversation';
import { TYPE_TALK, type Turn } from './script';
import { TYPE_STEPS, parseTypeStep, stepNav, typeFrontier, typeStepAllowed, type TypeStep } from './steps';

const T = UI.type.steps;

const RESULT_BACKDROP = '/media/clips/enter-v2.jpg';

function prevOf(step: TypeStep): TypeStep {
  return TYPE_STEPS[Math.max(TYPE_STEPS.indexOf(step) - 1, 0)];
}

function afterTime(): TypeStep {
  return getAnswers().time ? 'place' : 'result';
}

export function TypeFlow() {
  const params = useSearchParams();
  const step = parseTypeStep(params.get('step'));
  const answers = useAnswers();
  const hydrated = useHydrated();
  const allowed = typeStepAllowed(step, answers);
  const [turn, setTurn] = useState<Turn | null>(null);
  const turnCount = useRef(0);

  useEffect(() => {
    stepNav.sync(step);
  }, [step]);

  useEffect(() => {
    if (hydrated && !allowed) stepNav.replace(typeFrontier(answers));
  }, [hydrated, allowed, answers]);

  if (hydrated && allowed && step === 'result') return <TypeResultView answers={answers} />;

  const go = (from: Exclude<TypeStep, 'result'>, to: TypeStep) => {
    turnCount.current += 1;
    setTurn({ id: turnCount.current, from, to, reaction: null });
    stepNav.push(from, to);
  };

  const ok = hydrated && allowed;
  let body: ReactNode = null;
  if (ok) {
    switch (step) {
      case 'date':
        body = <DateAnswers initial={answers.date} onDone={() => go('date', 'midnight')} />;
        break;
      case 'midnight':
        body = (
          <MidnightAnswers
            value={answers.midnight}
            onPick={(midnight) => {
              updateAnswers({ midnight });
              go('midnight', midnight === 'yes' ? 'time' : 'result');
            }}
          />
        );
        break;
      case 'time':
        body = <TimeAnswers initial={answers.time} onDone={() => go('time', afterTime())} />;
        break;
      case 'place':
        body = <PlaceAnswers place={answers.place} onDone={() => go('place', 'result')} />;
        break;
    }
  }

  return (
    <Conversation
      steps={TYPE_TALK}
      stepId={ok && step !== 'result' ? step : 'date'}
      answers={answers}
      turn={turn}
      pace="quick"
      loading={!ok}
      loadingScene="listen"
      onBack={step === 'date' ? undefined : () => stepNav.back(prevOf(step))}
      body={body}
    />
  );
}

function MidnightAnswers({
  value,
  onPick,
}: {
  value: Answers['midnight'];
  onPick: (v: 'no' | 'yes' | 'unsure') => void;
}) {
  const t = T.midnight;
  const options = [
    { value: 'no', label: t.no },
    { value: 'yes', label: t.yes },
    { value: 'unsure', label: t.notSure },
  ] as const;
  return (
    <div role="group" aria-label={t.group} className="grid grid-cols-3 gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          className="dg-btn dg-btn--glass !px-3"
          onClick={() => onPick(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function TypeResultView({ answers }: { answers: Answers }) {
  const [data] = useState(() => computeTypeResult(answers));
  const [emailOpen, setEmailOpen] = useState(false);

  if (!data) {
    return (
      <Stage backdrop={RESULT_BACKDROP}>
        <main id="main" className="relative z-10 flex min-h-dvh flex-col justify-center gap-4 px-6 py-16">
          <h1 className="t-display text-[2.5rem]">{UI.type.failed}</h1>
          <button type="button" className="dg-btn dg-btn--primary" onClick={() => stepNav.replace('date')}>
            {UI.type.failedAction}
          </button>
        </main>
      </Stage>
    );
  }

  const { profile, alts } = data;
  const heading = UI.type.resultHeading(profile.born);
  const at = heading.lastIndexOf(profile.born);

  return (
    <Stage backdrop={RESULT_BACKDROP}>
      <main id="main" className="relative z-10 pb-[max(32px,var(--safe-bottom))]">
        <header className="relative">
          <div className="relative h-[min(54dvh,480px)] min-h-[340px] w-full overflow-hidden">
            {}
            <Image
              src={`/media/webtoon/emblem-${profile.key}.jpg`}
              alt=""
              fill
              preload
              sizes="(min-width: 520px) 480px, 100vw"
              className="object-cover"
              style={{ objectPosition: '50% 36%' }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, var(--paper) 3%, rgba(var(--paper-rgb),0.86) 18%, rgba(var(--paper-rgb),0) 50%)',
              }}
            />
            <div aria-hidden="true" className="dg-top-scrim" />
            <div className="absolute inset-x-0 top-0 px-4 pt-[max(8px,var(--safe-top))]">
              <Logo />
            </div>
            <div className="absolute inset-x-0 bottom-0 px-5">
              <h1 className="t-display m-0 text-[3rem] leading-[0.98]">
                {at < 0 ? (
                  heading
                ) : (
                  <>
                    {heading.slice(0, at)}
                    <em className="whitespace-nowrap font-medium italic">{profile.born}</em>
                    {heading.slice(at + profile.born.length)}
                  </>
                )}
              </h1>
            </div>
          </div>
        </header>

        <div className="grid gap-4 px-4 pt-4">
          <TypeCard profile={profile} />

          {alts.length > 0 ? (
            <p className="m-0 rounded-[var(--r-md)] bg-haze-strong px-4 py-3 text-[0.9375rem] leading-snug text-ink">
              {UI.type.nearMidnight(alts.map((k) => TYPE_PROFILES[k].born).join(UI.type.nearMidnightOr))}
            </p>
          ) : null}

          <figure className="dg-dialogue dg-dialogue--static relative m-0 mt-3" aria-label={UI.type.greetsCaption}>
            <NameTag />
            <blockquote className="dg-line m-0">{profile.yulGreets}</blockquote>
          </figure>

          <div className="mt-2 grid gap-2">
            <Link href="/reading" className="dg-btn dg-btn--primary w-full">
              {UI.type.fullReading}
            </Link>
            {answers.regularNo ? null : (
              <button type="button" className="dg-btn dg-btn--paper w-full" onClick={() => setEmailOpen(true)}>
                {UI.type.regularNo}
              </button>
            )}
          </div>

          <SiteFooter className="mt-6" />
        </div>
      </main>

      {emailOpen ? (
        <EmailModal
          source="type"
          type={profile.key}
          onClose={() => setEmailOpen(false)}
          onSuccess={(regularNo) => updateAnswers({ regularNo })}
        />
      ) : null}
    </Stage>
  );
}
