import type { CandyLine, ReadingLibrary } from '@/lib/reading/types';
import { CANDY } from './candy';
import { SALT } from './salt';

export const LIBRARY: ReadingLibrary = { candy: CANDY, salt: SALT };

const CANDY_BY_ID: ReadonlyMap<string, CandyLine> = new Map(
  Object.values(CANDY).flatMap((byGroup) => Object.values(byGroup).flat()).map((line) => [line.id, line]),
);

export function findCandy(id: string): CandyLine | undefined {
  return CANDY_BY_ID.get(id);
}
