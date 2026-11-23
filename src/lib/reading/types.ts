import type { Chart, GodGroup, SeasonWindow, TypeKey } from '@/lib/saju/types';

export type Focus = 'love' | 'someone' | 'everything';

export type ConcernKey =
  | 'love' | 'crush' | 'ex' | 'partner' | 'marriage'
  | 'work' | 'money' | 'study' | 'people' | 'change' | 'self';

export type ReadingFocus = Focus | ConcernKey;

export interface ConcernLine {
  id: string;
  text: string;
}
export type SaltLevel = 'pinch' | 'spoonful' | 'handful';

export interface CandyLine {
  id: string;
  text: string;
}

export interface SaltLine {
  id: string;

  when: string;
  situation: string;
  action: string;

  notCurse: string;
}

export interface Reading {
  type: TypeKey;

  focus: ReadingFocus;
  season: SeasonWindow;

  monthGod: GodGroup;
  candy: CandyLine;
  salt: { level: SaltLevel; score: number; line: SaltLine };

  reasons: string[];
}

export interface TypeProfile {
  key: TypeKey;

  name: string;

  hanzi: string;

  born: string;

  identity: string;

  inLove: string;

  yulGreets: string;

  accent: string;
}

export type CandyBook = 'love' | 'general';

export interface ReadingLibrary {

  candy: Record<CandyBook, Record<GodGroup, CandyLine[]>>;

  salt: Record<SaltLevel, Record<GodGroup, Omit<SaltLine, 'when' | 'notCurse'>[]>>;
}

export type { Chart };
