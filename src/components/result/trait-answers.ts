'use client';

import { hash32 } from '@/lib/reading/hash';
import type { Chart } from '@/lib/saju/types';

export type HitAnswer = 'yes' | 'no';
export type HitAnswers = Readonly<Record<string, HitAnswer>>;

const KEY = 'dangol.hits.v1';
const MAX_KEYS = 12;
const MAX_ID = 64;

interface Stored {
  who: number;
  answers: HitAnswers;
}

let memory: Stored | null = null;

export function whoOf(chart: Chart): number {
  const { date, time, place } = chart.input;
  return hash32([date, time ?? 'unknown', place.name, place.country, 'hit-answers'].join('|'));
}

function parse(raw: string | null): Stored | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
    const { who, answers } = v as { who?: unknown; answers?: unknown };
    if (typeof who !== 'number' || !Number.isSafeInteger(who)) return null;
    if (typeof answers !== 'object' || answers === null || Array.isArray(answers)) return null;
    const clean: Record<string, HitAnswer> = {};
    for (const [id, a] of Object.entries(answers as Record<string, unknown>).slice(0, MAX_KEYS)) {
      if (id.length <= MAX_ID && (a === 'yes' || a === 'no')) clean[id] = a;
    }
    return { who, answers: clean };
  } catch {
    return null;
  }
}

export function readHitAnswers(who: number): HitAnswers {
  let stored: Stored | null = memory;
  if (!stored) {
    try {
      stored = parse(window.sessionStorage.getItem(KEY));
    } catch {
      stored = null;
    }
  }
  return stored && stored.who === who ? stored.answers : {};
}

export function writeHitAnswers(who: number, answers: HitAnswers): void {
  const next: Stored = { who, answers };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
    memory = null;
  } catch {
    memory = next;
  }
}
