import { cleanDraft, sortPeople } from './person';
import type { AccountStore, AccountUser, Person, PersonDraft, ReadingDraft, SavedReading } from './types';

export interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const PEOPLE = 'dangol.preview.people.v1';
const READINGS = 'dangol.preview.readings.v1';
export const PREVIEW_USER_KEY = 'dangol.preview.user.v1';

function read<T>(kv: KeyValue, key: string): T[] {
  try {
    const v: unknown = JSON.parse(kv.getItem(key) ?? '[]');
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

export function previewStore(kv: KeyValue, deps: { now: () => string; newId: () => string }): AccountStore {
  const write = (key: string, list: unknown[]) => kv.setItem(key, JSON.stringify(list));
  return {
    async listPeople() {
      return sortPeople(read<Person>(kv, PEOPLE));
    },
    async savePerson(draft: PersonDraft, id?: string) {
      const clean = cleanDraft(draft);
      if (!clean) throw new Error('invalid_person');
      const list = read<Person>(kv, PEOPLE);
      const now = deps.now();
      const old = id ? list.find((p) => p.id === id) : undefined;

      const rest = list
        .filter((p) => p.id !== id)
        .map((p) => (clean.relation === 'self' && p.relation === 'self' ? { ...p, relation: 'other' as const, updatedAt: now } : p));
      const person: Person = { id: old?.id ?? deps.newId(), ...clean, createdAt: old?.createdAt ?? now, updatedAt: now };
      write(PEOPLE, [...rest, person]);
      return person;
    },
    async deletePerson(id: string) {
      write(
        PEOPLE,
        read<Person>(kv, PEOPLE).filter((p) => p.id !== id),
      );
    },
    async listReadings() {
      return read<SavedReading>(kv, READINGS)
        .map((r) => ({ ...r, body: null }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async getReading(id: string) {
      return read<SavedReading>(kv, READINGS).find((r) => r.id === id) ?? null;
    },
    async saveReading(draft: ReadingDraft) {
      const saved: SavedReading = { ...draft, id: deps.newId(), createdAt: deps.now(), status: 'done', error: null };
      write(READINGS, [...read<SavedReading>(kv, READINGS), saved]);
      return saved;
    },

    async startReading() {
      throw new Error('background_unsupported');
    },
    async jobStates() {
      return [];
    },
    async deleteReading(id: string) {
      write(
        READINGS,
        read<SavedReading>(kv, READINGS).filter((r) => r.id !== id),
      );
    },
  };
}

export function previewSignIn(kv: KeyValue, provider: string, email: string | null): AccountUser {
  const user: AccountUser = { id: 'preview-user', email, displayName: null, provider: `preview:${provider}` };
  kv.setItem(PREVIEW_USER_KEY, JSON.stringify(user));
  return user;
}

export function previewUser(kv: KeyValue): AccountUser | null {
  try {
    const v = JSON.parse(kv.getItem(PREVIEW_USER_KEY) ?? 'null') as AccountUser | null;
    return v && typeof v.id === 'string' ? v : null;
  } catch {
    return null;
  }
}

export function previewSignOut(kv: KeyValue): void {
  kv.removeItem(PREVIEW_USER_KEY);
}
