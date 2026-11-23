'use client';

import { useSyncExternalStore } from 'react';
import { parseXmasRelation, type XmasRelation } from '@/lib/xmas/relation';

const KEY = 'dangol.xmas.v2';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export interface XmasPartnerInput {

  date: string;

  time: string | null;
}

export interface XmasInput {
  relation: XmasRelation;

  partner: XmasPartnerInput | null;
}

export function parseXmasInput(raw: string | null): XmasInput | null {
  try {
    const v = JSON.parse(raw ?? 'null') as { relation?: unknown; partner?: unknown } | null;
    const relation = parseXmasRelation(v?.relation);
    if (!relation) return null;
    const p = v?.partner as { date?: unknown; time?: unknown } | null | undefined;
    if (p === null || p === undefined) return { relation, partner: null };
    if (typeof p.date !== 'string' || !DATE_RE.test(p.date)) return null;
    if (p.time !== null && (typeof p.time !== 'string' || !TIME_RE.test(p.time))) return null;
    return { relation, partner: { date: p.date, time: p.time } };
  } catch {
    return null;
  }
}

export function saveXmasInput(input: XmasInput): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(input));

    sessionStorage.removeItem(PULLED);
  } catch {

  }
}

export function loadXmasInput(): XmasInput | null {
  return parseXmasInput(read());
}

const PULLED = 'dangol.xmas.pulled';

export function wasPulled(): boolean {
  try {
    return sessionStorage.getItem(PULLED) === '1';
  } catch {
    return false;
  }
}

export function markPulled(): void {
  try {
    sessionStorage.setItem(PULLED, '1');
  } catch {

  }
}

function read(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

const QUIZ = 'dangol.xmas.quiz';
const QUIZ_DRAFT = 'dangol.xmas.quiz.draft';
const FROM = 'dangol.xmas.from';

function get(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function set(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {

  }
}

export function loadXmasQuiz(): string | null {
  return get(QUIZ);
}

export function saveXmasQuiz(answers: string | null): void {
  set(QUIZ, answers);
}

export function loadQuizDraft(): string {
  return get(QUIZ_DRAFT) ?? '';
}

export function saveQuizDraft(draft: string): void {
  set(QUIZ_DRAFT, draft || null);
}

export function markXmasFrom(from: 'quiz' | 'result'): void {
  set(FROM, from);
}

export function xmasFromQuiz(): boolean {
  return get(FROM) === 'quiz';
}

export function xmasReturnPath(): string {
  return xmasFromQuiz() ? '/xmas/test' : '/xmas/result';
}

const noop = () => () => {};

export function useXmasRaw(): string | null {
  return useSyncExternalStore(noop, read, () => null);
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
