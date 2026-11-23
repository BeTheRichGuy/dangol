'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useAnswers } from '../flow/answers';

export type PartnerFace = 'f' | 'm';

const KEY = 'dg_partner_face';
const EVENT = 'dg-partner-face';

export function defaultFace(sex: 'female' | 'male' | null): PartnerFace {
  return sex === 'female' ? 'm' : 'f';
}

let memory: PartnerFace | null = null;

function readSaved(): PartnerFace | null {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === 'f' || v === 'm') return v;
  } catch {

  }
  return memory;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function usePartnerFace(sexOf?: 'female' | 'male' | null): [PartnerFace, (face: PartnerFace) => void] {
  const answered = useAnswers().sex;
  const sex = sexOf ?? answered;

  const saved = useSyncExternalStore(subscribe, readSaved, () => null);
  const choose = useCallback((face: PartnerFace) => {
    memory = face;
    try {
      window.localStorage.setItem(KEY, face);
    } catch {

    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [saved ?? defaultFace(sex), choose];
}

export function partnerImage(kind: string, face: PartnerFace, blurred: boolean): string {
  return `/media/partner/${kind}-${face}${blurred ? '-blur' : ''}-v1.jpg`;
}
