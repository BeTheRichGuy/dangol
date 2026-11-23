import type { Locale } from '@/content/locale';
import type { PairKind, ProductKey } from '@/lib/rooms/themes';

export interface PersonPlace {
  name: string;
  country: string;
  lat: number;
  lng: number;
  tz: string;
  label: string;
}

export type Relation = 'self' | PairKind;

export const RELATIONS: readonly Relation[] = ['self', 'lover', 'crush', 'friend', 'coworker', 'family', 'other'];

export interface Person {
  id: string;

  name: string;
  relation: Relation;

  date: string;

  time: string | null;
  place: PersonPlace;

  sex: 'female' | 'male' | null;
  createdAt: string;
  updatedAt: string;
}

export type PersonDraft = Omit<Person, 'id' | 'createdAt' | 'updatedAt'>;

export type ReadingKind = 'free' | ProductKey;

export const READING_KINDS: readonly ReadingKind[] = ['free', 'life', 'decades', 'love', 'match', 'year', 'reunion'];

export interface PersonSnapshot {
  id: string | null;
  name: string;
  relation: Relation;
  date: string;
  time: string | null;
  place: PersonPlace;
  sex: 'female' | 'male' | null;
}

export type ReadingStatus = 'running' | 'done' | 'error';

export interface SavedReading {
  id: string;
  kind: ReadingKind;
  locale: Locale;

  people: PersonSnapshot[];

  question: string;

  body: string | null;

  concern: string | null;

  nowIso: string;
  createdAt: string;
  status: ReadingStatus;

  error: string | null;
}

export type ReadingDraft = Omit<SavedReading, 'id' | 'createdAt' | 'status' | 'error'>;

export interface JobState {
  id: string;
  status: ReadingStatus;

  body: string | null;
  error: string | null;
  createdAt: string;

  startedAt: string | null;
  updatedAt: string;
}

export interface AccountStore {
  listPeople(): Promise<Person[]>;
  savePerson(draft: PersonDraft, id?: string): Promise<Person>;
  deletePerson(id: string): Promise<void>;

  listReadings(): Promise<SavedReading[]>;
  getReading(id: string): Promise<SavedReading | null>;
  saveReading(draft: ReadingDraft): Promise<SavedReading>;

  startReading(draft: ReadingDraft): Promise<SavedReading>;

  jobStates(ids: string[]): Promise<JobState[]>;
  deleteReading(id: string): Promise<void>;
}

export interface AccountUser {
  id: string;
  email: string | null;

  displayName: string | null;

  provider: string | null;
}
