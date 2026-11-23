import { CONCERNS } from '@/content/concerns';
import { pickReaction, type ReactionInput, type ReactionKind } from '@/content/reactions';
import { solarHourOf } from '@/lib/reading';
import { pickByHash } from '@/lib/reading/hash';
import { UI } from '@/content/ui';
import type { ReactionId, SceneId } from '../scene/manifest';
import type { Answers } from './answers';

const T = UI.reading.steps;
const C = UI.reading.chat;

export interface TalkStepDef {
  id: string;

  scene: SceneId;

  question: string;

  tray?: boolean;

  answer: (a: Answers) => string | null;

  reaction?: (a: Answers) => string | null;

  clip?: ReactionId | null;

  compact?: boolean;
}

export interface Turn {
  id: number;
  from: string;
  to: string;

  reaction: string | null;
}

export function dateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return C.date(UI.months[m - 1] ?? '', d, y);
}

export function timeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return C.time(h12, String(m).padStart(2, '0'), h >= 12 ? T.time.pm : T.time.am);
}

function concernLabel(a: Answers): string | null {
  return a.concern ? CONCERNS[a.concern].label : null;
}

function sexLabel(a: Answers): string {
  const o = T.sex.options;
  switch (a.sexChoice) {
    case 'female':
      return o.female;
    case 'male':
      return o.male;
    case 'nonbinary':
      return o.nonbinary;
    case 'skip':
      return o.skip;
    default:
      return a.sex === 'female' ? o.female : a.sex === 'male' ? o.male : o.skip;
  }
}

function nbLabel(a: Answers): string {
  const o = T.sex.nbOptions;
  return a.nbChoice === 'yang' ? o.yang : a.nbChoice === 'yin' ? o.yin : o.skip;
}

function react(kind: ReactionKind, a: ReactionInput, ...parts: (string | null | undefined)[]): string | null {
  try {
    const text = pickReaction(kind, a, parts.map((p) => p ?? '').join('|'));
    return text.trim() ? text : null;
  } catch {
    return null;
  }
}

export function concernReaction(a: Pick<Answers, 'name' | 'concern'>): string | null {
  if (!a.concern) return null;
  const all = CONCERNS[a.concern].reaction;
  const name = a.name.trim();
  const pool = name ? all : all.filter((t) => !t.includes('{name}'));
  const candidates = pool.length > 0 ? pool : all;
  if (candidates.length === 0) return null;
  const text = pickByHash(candidates, `concern|${name}|${a.concern}`).replace(/\{name\}/g, () => name);
  return text.trim() ? text : null;
}

export type TalkStep = 'greeting' | 'name' | 'concern' | 'date' | 'time' | 'place' | 'sex' | 'nb';

export const READING_TALK: readonly TalkStepDef[] = [
  { id: 'greeting', scene: 'listen', get question() { return T.greeting.line; }, answer: () => T.greeting.answer },
  {
    id: 'name',
    scene: 'listen',
    get question() { return T.name.line; },
    tray: true,
    answer: (a) => a.name || C.skip,
    reaction: (a) => react('name', a, a.name),
    clip: 'talk',
  },
  {
    id: 'concern',
    scene: 'listen',
    get question() { return T.concern.line; },
    answer: concernLabel,
    reaction: concernReaction,
    clip: 'talk',
  },
  {
    id: 'date',
    scene: 'listen',
    get question() { return T.date.line; },
    tray: true,
    answer: (a) => (a.date ? dateLabel(a.date) : null),
    reaction: (a) => react('date', a, a.name, a.date),
    clip: 'talk',
  },
  {
    id: 'time',
    scene: 'listen',
    get question() { return T.time.line; },
    tray: true,
    answer: (a) => (a.time ? timeLabel(a.time) : T.time.dontKnow),
    reaction: (a) => react('time', a, a.name, a.date, a.time ?? 'unknown'),
    clip: 'talk',
  },
  {
    id: 'place',
    scene: 'listen',
    get question() { return T.place.line; },
    tray: true,
    answer: (a) => a.place?.label ?? null,

    reaction: (a) =>
      react('place', { ...a, solarHour: solarHourOf(a) }, a.name, a.date, a.time ?? 'unknown', a.place?.name),
    clip: 'talk',
  },
  {
    id: 'sex',
    scene: 'listen',
    get question() { return T.sex.line; },
    answer: sexLabel,

    reaction: (a) => (a.sexChoice === 'nonbinary' ? null : react('sex', a, a.name, a.date, a.time ?? 'unknown', a.place?.name, a.sex ?? 'skip')),
    clip: null,
  },
  {
    id: 'nb',
    scene: 'listen',
    get question() { return T.sex.nbLine; },
    answer: nbLabel,

    reaction: (a) => react('sex', a, a.name, a.date, a.time ?? 'unknown', a.place?.name, 'nb', a.nbChoice ?? 'skip'),
    clip: null,
  },
];

export function ritualStep(question: string): TalkStepDef {
  return { id: 'ritual', scene: 'listen', question, answer: () => null, compact: true };
}

const TT = UI.type.steps;

export const TYPE_TALK: readonly TalkStepDef[] = [
  {
    id: 'date',
    scene: 'listen',
    get question() { return TT.date.line; },
    tray: true,
    answer: (a) => (a.date ? dateLabel(a.date) : null),
  },
  {
    id: 'midnight',
    scene: 'listen',
    get question() { return TT.midnight.line; },
    answer: (a) => (a.midnight === 'yes' ? TT.midnight.yes : a.midnight === 'no' ? TT.midnight.no : a.midnight ? TT.midnight.notSure : null),
  },
  {
    id: 'time',
    scene: 'listen',
    get question() { return TT.time.line; },
    tray: true,
    answer: (a) => (a.time ? timeLabel(a.time) : T.time.dontKnow),
  },
  {
    id: 'place',
    scene: 'listen',
    get question() { return TT.place.line; },
    tray: true,
    answer: (a) => a.place?.label ?? null,
  },
];
