'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { Locale } from '@/content/locale';
import { birthInputOf } from '@/lib/account/person';
import type { Person } from '@/lib/account/types';
import type { ChatKey } from '@/lib/chat/characters';
import { CHAT_CHARACTERS } from '@/lib/chat/characters';
import { buildRoomPayload, type RoomPayload } from '@/lib/rooms/payload';
import { computeChart, type BirthInput } from '@/lib/saju';
import { useAccount } from '../account/account-provider';
import { useAnswers } from '../flow/answers';
import { birthInputFrom } from '../flow/compute';
import { useLocalSample } from '../rooms/local-sample';

const SAMPLE: BirthInput = {
  date: '1995-03-14',
  time: '09:30',
  place: { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' },
  sex: 'female',
};

const PICK_KEY = 'dangol.chat.subject.v1';
const pickListeners = new Set<() => void>();

function readPick(): string {
  try {
    return window.localStorage.getItem(PICK_KEY) ?? '';
  } catch {
    return '';
  }
}

function subscribePick(onChange: () => void) {
  pickListeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    pickListeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

function writePick(id: string) {
  try {
    window.localStorage.setItem(PICK_KEY, id);
  } catch {

  }
  pickListeners.forEach((f) => f());
}

export interface ChatSubject {
  input: BirthInput | null;
  ready: boolean;
  sample: boolean;

  signedIn: boolean;

  accountOn: boolean;
  people: readonly Person[];

  person: Person | null;

  scope: string;
  choose: (id: string) => void;
}

export function useChatSubject(): ChatSubject {
  const account = useAccount();
  const answers = useAnswers();
  const sample = useLocalSample();
  const picked = useSyncExternalStore(subscribePick, readPick, () => '');
  const signedIn = account.mode !== 'off' && account.ready && account.user !== null;
  const people = account.people;
  const person = useMemo<Person | null>(() => {
    if (sample || !signedIn) return null;
    return people.find((p) => p.id === picked) ?? people.find((p) => p.relation === 'self') ?? people[0] ?? null;
  }, [sample, signedIn, people, picked]);
  const input = useMemo<BirthInput | null>(() => {
    if (sample) return SAMPLE;
    if (signedIn) return person ? birthInputOf(person) : null;
    return birthInputFrom(answers);
  }, [sample, signedIn, person, answers]);

  const ready = sample || account.mode === 'off' || account.ready;
  const choose = useCallback((id: string) => writePick(id), []);
  return { input, ready, sample, signedIn, accountOn: account.mode !== 'off', people, person, scope: person?.id ?? '', choose };
}

export function chatPayload(who: ChatKey, input: BirthInput | null, nowIso: string, locale: Locale): RoomPayload | null {
  if (!input) return null;
  try {
    return buildRoomPayload({ room: CHAT_CHARACTERS[who].room, locale, chart: computeChart(input), nowIso, question: '', partner: null });
  } catch {
    return null;
  }
}
