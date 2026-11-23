import { REACTIONS as EN, HOUR_ANIMAL_NAMES, pickReaction as pick, type ReactionCopy, type ReactionInput, type ReactionKind } from './en/reactions';
import { REACTIONS_KO, HOUR_ANIMAL_NAMES_KO } from './ko/reactions';
import { REACTIONS_JA, HOUR_ANIMAL_NAMES_JA } from './ja/reactions';
import { activeLocale, localized } from './locale';

export const REACTIONS = localized<ReactionCopy>({ en: EN, ko: REACTIONS_KO, ja: REACTIONS_JA });
const ANIMAL_NAMES = { en: HOUR_ANIMAL_NAMES, ko: HOUR_ANIMAL_NAMES_KO, ja: HOUR_ANIMAL_NAMES_JA };

export function pickReaction(kind: ReactionKind, input: ReactionInput, seed: string): string {
  return pick(kind, input, seed, REACTIONS, ANIMAL_NAMES[activeLocale()]);
}

export { REACTION_KINDS, HOUR_ANIMALS, datePeriod, hourAnimal, isSouthern, sunShift } from './en/reactions';
export type { ReactionKind, ReactionInput, ReactionCopy, DatePeriod, HourAnimal } from './en/reactions';
