'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { UI } from '@/content/ui';
import { computeChart, type Chart } from '@/lib/saju';
import { useAccount } from '../account/account-provider';
import { claimSave, freeReadingDraft } from '../account/saved';
import { ResultView } from '../result/result-view';
import { useHydrated } from '../use-reduced-motion';
import { useAnswers } from './answers';
import { birthInputFrom } from './compute';
import { ReadingForm } from './reading-form';
import { ReadingIntro } from './reading-intro';
import { ReadingRitual } from './reading-ritual';
import { parseReadingStep, readingFrontier, readingStepAllowed, stepNav } from './steps';

const T = UI.reading.steps;

export function ReadingFlow() {
  const params = useSearchParams();
  const step = parseReadingStep(params.get('step'));
  const answers = useAnswers();
  const hydrated = useHydrated();
  const account = useAccount();
  const signedIn = account.mode !== 'off' && account.user !== null;
  const allowed = readingStepAllowed(step, answers);
  const ok = hydrated && allowed;

  useEffect(() => {
    stepNav.sync(step);
  }, [step]);

  useEffect(() => {
    if (hydrated && !allowed) stepNav.replace(readingFrontier(answers));
  }, [hydrated, allowed, answers]);

  const chart = useMemo<Chart | null>(() => {
    if (step !== 'ritual') return null;
    const input = birthInputFrom(answers);
    if (!input) return null;
    try {
      return computeChart(input);
    } catch {
      return null;
    }
  }, [step, answers]);

  const keep = (nowIso: string) => {
    if (!signedIn) return;
    const made = freeReadingDraft(answers, nowIso, account.people);
    if (made && claimSave(made.tag)) void account.saveReading(made.draft).catch(() => undefined);
  };

  if (ok && step === 'result') return <ResultView answers={answers} onReady={keep} />;
  if (ok && step === 'form') {
    return (
      <ReadingForm
        guided
        answers={answers}
        account={signedIn ? { people: account.people, onSave: (d) => void account.savePerson(d).catch(() => undefined) } : undefined}
        onBack={() => stepNav.back('intro')}
        onDone={() => {
          stepNav.push('form', 'ritual');
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  if (step === 'intro') return <ReadingIntro onStart={() => stepNav.push('intro', 'form')} />;
  if (ok && step === 'ritual') {
    const cols = chart ? (chart.pillars.hour ? 4 : 3) : 0;
    return <ReadingRitual chart={chart} line={!chart ? T.ritual.failed : cols === 4 ? T.ritual.line : T.ritual.lineSix} />;
  }

  return <div className="rf-screen" />;
}
