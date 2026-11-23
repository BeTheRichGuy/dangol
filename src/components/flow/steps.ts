'use client';

import type { Answers } from './answers';

export const READING_STEPS = ['intro', 'form', 'ritual', 'result'] as const;
export type ReadingStep = (typeof READING_STEPS)[number];

const LEGACY_FORM_STEPS = new Set(['name', 'concern', 'focus', 'date', 'time', 'place', 'sex', 'nb']);

export function readingComplete(a: Answers): boolean {
  return Boolean(a.date && a.timeAnswered && a.place && a.sexAnswered);
}

export const TYPE_STEPS = ['date', 'midnight', 'time', 'place', 'result'] as const;
export type TypeStep = (typeof TYPE_STEPS)[number];

export function parseReadingStep(raw: string | null): ReadingStep {
  if (raw && (READING_STEPS as readonly string[]).includes(raw)) return raw as ReadingStep;
  if (raw && LEGACY_FORM_STEPS.has(raw)) return 'form';
  return 'intro';
}

export function parseTypeStep(raw: string | null): TypeStep {
  return (TYPE_STEPS as readonly string[]).includes(raw ?? '') ? (raw as TypeStep) : 'date';
}

export function readingFrontier(a: Answers): ReadingStep {
  return readingComplete(a) ? 'result' : 'form';
}

export function readingStepAllowed(step: ReadingStep, a: Answers): boolean {
  if (step === 'intro' || step === 'form') return true;
  return readingComplete(a);
}

export function prevReadingStep(step: ReadingStep): ReadingStep {
  return step === 'form' ? 'intro' : 'form';
}

export function typeFrontier(a: Answers): TypeStep {
  if (!a.date) return 'date';
  if (!a.midnight) return 'midnight';
  if (a.midnight === 'yes') {
    if (!a.timeAnswered) return 'time';

    if (a.time && !a.place) return 'place';
  }
  return 'result';
}

export function typeStepAllowed(step: TypeStep, a: Answers): boolean {
  return TYPE_STEPS.indexOf(step) <= TYPE_STEPS.indexOf(typeFrontier(a));
}

function href(step: string): string {
  return `?step=${step}`;
}

const trail: string[] = [];

export const stepNav = {
  push(from: string, to: string): void {
    trail.push(from);
    window.history.pushState(null, '', href(to));
  },
  replace(to: string): void {
    window.history.replaceState(null, '', href(to));
  },

  back(prev: string): void {
    if (trail.length > 0 && trail[trail.length - 1] === prev) {
      trail.pop();
      window.history.back();
    } else {
      window.history.replaceState(null, '', href(prev));
    }
  },

  sync(step: string): void {
    if (trail.length > 0 && trail[trail.length - 1] === step) trail.pop();
  },
};
