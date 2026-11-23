'use client';

import { useSyncExternalStore } from 'react';
import { isConcernKey } from '@/lib/reading/concerns';
import type { ConcernKey, Focus } from '@/lib/reading/types';

export interface PlaceChoice {

  name: string;

  country: string;
  lat: number;
  lng: number;

  tz: string;

  label: string;
}

export type MidnightAnswer = 'no' | 'yes' | 'unsure';

export type SexChoice = 'female' | 'male' | 'nonbinary' | 'skip';

export type NbChoice = 'yang' | 'yin' | 'skip';

const SOMEONE_CONCERNS: ReadonlySet<ConcernKey> = new Set<ConcernKey>(['crush', 'ex', 'partner']);

export function focusOf(concern: ConcernKey): Focus {
  if (SOMEONE_CONCERNS.has(concern)) return 'someone';
  return concern === 'love' || concern === 'marriage' ? 'love' : 'everything';
}

export interface Answers {
  name: string;

  concern: ConcernKey | null;

  focus: Focus | null;

  date: string | null;

  time: string | null;

  timeAnswered: boolean;
  place: PlaceChoice | null;

  sex: 'female' | 'male' | null;

  sexAnswered: boolean;

  sexChoice: SexChoice | null;

  nbChoice: NbChoice | null;

  midnight: MidnightAnswer | null;

  regularNo: number | null;

  question: string;
}

export const EMPTY_ANSWERS: Answers = {
  name: '',
  concern: null,
  focus: null,
  date: null,
  time: null,
  timeAnswered: false,
  place: null,
  sex: null,
  sexAnswered: false,
  sexChoice: null,
  nbChoice: null,
  midnight: null,
  regularNo: null,
  question: '',
};

const KEY = 'dangol.session.v1';
export const NAME_MAX = 24;
export const QUESTION_MAX = 300;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parsePlace(v: unknown): PlaceChoice | null {
  if (!isRecord(v)) return null;
  const { name, country, lat, lng, tz, label } = v;
  if (
    typeof name !== 'string' ||
    typeof country !== 'string' ||
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    typeof tz !== 'string' ||
    typeof label !== 'string' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }
  return { name, country, lat, lng, tz, label };
}

function parse(raw: string | null): Answers {
  if (!raw) return EMPTY_ANSWERS;
  try {
    const v: unknown = JSON.parse(raw);
    if (!isRecord(v)) return EMPTY_ANSWERS;
    const concern = isConcernKey(v.concern) ? v.concern : null;
    const sex = v.sex === 'female' || v.sex === 'male' ? v.sex : null;
    const sexChoice =
      v.sexChoice === 'female' || v.sexChoice === 'male' || v.sexChoice === 'nonbinary' || v.sexChoice === 'skip'
        ? v.sexChoice
        : null;
    const nbChoice = v.nbChoice === 'yang' || v.nbChoice === 'yin' || v.nbChoice === 'skip' ? v.nbChoice : null;
    const midnight = v.midnight === 'no' || v.midnight === 'yes' || v.midnight === 'unsure' ? v.midnight : null;
    return {
      name: typeof v.name === 'string' ? v.name.slice(0, NAME_MAX) : '',
      concern,
      focus: concern ? focusOf(concern) : null,
      date: typeof v.date === 'string' && DATE_RE.test(v.date) ? v.date : null,
      time: typeof v.time === 'string' && TIME_RE.test(v.time) ? v.time : null,
      timeAnswered: v.timeAnswered === true,
      place: parsePlace(v.place),
      sex,
      sexAnswered: v.sexAnswered === true,
      sexChoice,
      nbChoice,
      midnight,
      regularNo:
        typeof v.regularNo === 'number' && Number.isSafeInteger(v.regularNo) && v.regularNo > 0 ? v.regularNo : null,
      question: typeof v.question === 'string' ? v.question.slice(0, QUESTION_MAX) : '',
    };
  } catch {
    return EMPTY_ANSWERS;
  }
}

let memory: Answers | null = null;
let cachedRaw: string | null | undefined;
let cachedValue: Answers = EMPTY_ANSWERS;
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function emit(): void {
  for (const l of listeners) l();
}

export function getAnswers(): Answers {
  if (memory) return memory;
  const raw = readRaw();
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  cachedValue = parse(raw);
  return cachedValue;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function updateAnswers(patch: Partial<Answers>): void {

  const merged: Partial<Answers> = 'concern' in patch ? { ...patch, focus: patch.concern ? focusOf(patch.concern) : null } : patch;
  const next: Answers = { ...getAnswers(), ...merged };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
    memory = null;
  } catch {
    memory = next;
  }
  emit();
}

export function resetAnswers(): void {
  const regularNo = getAnswers().regularNo;
  const next: Answers = { ...EMPTY_ANSWERS, regularNo };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
    memory = null;
  } catch {
    memory = next;
  }
  emit();
}

export function useAnswers(): Answers {
  return useSyncExternalStore(subscribe, getAnswers, () => EMPTY_ANSWERS);
}
