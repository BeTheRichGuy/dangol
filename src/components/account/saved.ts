import { activeLocale } from '@/content/locale';
import { cleanDraft, samePerson } from '@/lib/account/person';
import type { Person, PersonSnapshot, ReadingDraft, Relation } from '@/lib/account/types';
import { hash32 } from '@/lib/reading/hash';
import { isConcernKey } from '@/lib/reading/concerns';
import { EMPTY_ANSWERS, focusOf, type Answers } from '../flow/answers';

const SAVED_KEY = 'dangol.saved.v1';

export function claimSave(tag: string): boolean {
  try {
    const list = JSON.parse(window.sessionStorage.getItem(SAVED_KEY) ?? '[]') as unknown;
    const seen = Array.isArray(list) ? (list as string[]) : [];
    if (seen.includes(tag)) return false;
    window.sessionStorage.setItem(SAVED_KEY, JSON.stringify([...seen.slice(-49), tag]));
    return true;
  } catch {
    return true;
  }
}

export function snapshotFromAnswers(a: Answers, people: readonly Person[]): PersonSnapshot | null {
  if (!a.date || !a.place || !a.timeAnswered) return null;
  const match = people.find((p) => samePerson(p, { date: a.date as string, time: a.time, place: a.place as Person['place'] }));
  const relation: Relation = match?.relation ?? 'self';
  const clean = cleanDraft({ name: a.name.trim() || match?.name || '-', relation, date: a.date, time: a.time, place: a.place, sex: a.sex });
  return clean ? { id: match?.id ?? null, ...clean } : null;
}

export function freeReadingDraft(a: Answers, nowIso: string, people: readonly Person[]): { draft: ReadingDraft; tag: string } | null {
  const who = snapshotFromAnswers(a, people);
  if (!who) return null;
  const tag = `free:${hash32(JSON.stringify([a.date, a.time, a.place?.name, a.sex, a.concern, a.question, nowIso.slice(0, 10)]))}`;
  return {
    tag,
    draft: { kind: 'free', locale: activeLocale(), people: [who], question: a.question, body: null, concern: a.concern, nowIso },
  };
}

export function answersFromSaved(people: readonly PersonSnapshot[], concern: string | null, question: string): Answers {
  const p = people[0];
  const c = isConcernKey(concern) ? concern : null;
  return {
    ...EMPTY_ANSWERS,
    name: p.name === '-' ? '' : p.name,
    concern: c,
    focus: c ? focusOf(c) : null,
    date: p.date,
    time: p.time,
    timeAnswered: true,
    place: p.place,
    sex: p.sex,
    sexAnswered: true,
    sexChoice: p.sex ?? 'skip',
    question,
  };
}
