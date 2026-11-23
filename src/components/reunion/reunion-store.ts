import type { PlaceChoice } from '../flow/answers';
import { parseIntake, type ReunionIntake } from '@/lib/reunion/intake';

export interface ReunionPerson {
  date: string;
  time: string | null;
  place: PlaceChoice;

  sex?: 'female' | 'male' | null;
}

export interface ReunionInput {
  me: ReunionPerson;
  them: ReunionPerson;

  nickname: string;
  intake: ReunionIntake;
}

const KEY = 'dangol.reunion.v2';

export function saveReunion(input: ReunionInput): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(input));
  } catch {

  }
}

function isPerson(v: unknown): v is ReunionPerson {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Record<string, unknown>;
  return typeof p.date === 'string' && (p.time === null || typeof p.time === 'string') && typeof p.place === 'object' && p.place !== null;
}

export function parseReunion(raw: string | null): ReunionInput | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    const intake = parseIntake(v.intake);
    if (!intake || !isPerson(v.me) || !isPerson(v.them)) return null;
    return { me: v.me, them: v.them, nickname: typeof v.nickname === 'string' ? v.nickname.slice(0, 20) : '', intake };
  } catch {
    return null;
  }
}

export function loadReunion(): ReunionInput | null {
  try {
    return parseReunion(window.sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function readReunionRaw(store: Storage): string | null {
  try {
    return store.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearReunion(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {

  }
}
