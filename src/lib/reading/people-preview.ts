import type { Chart, GodGroup } from '@/lib/saju/types';
import { pickByHash } from './hash';
import { traitFeatures } from './traits';

export interface PeopleNearLine {
  id: string;

  text: string;
}

export interface PeopleCarefulLine {
  id: string;

  text: string;

  signal: string;
}

export interface PeopleLibrary {
  near: Record<GodGroup, PeopleNearLine[]>;
  careful: Record<GodGroup, PeopleCarefulLine[]>;

  groupName: Record<GodGroup, string>;

  basis: { near: (group: string) => string; careful: (group: string) => string };
}

export interface PeoplePreview {
  near: { group: GodGroup; id: string; text: string; basis: string };
  careful: { group: GodGroup; id: string; text: string; signal: string; basis: string };
}

function seedBase(chart: Chart): string {
  const { date, time, place } = chart.input;
  return [date, time ?? 'unknown', place.name, place.country].join('|');
}

function requirePool<T>(pool: readonly T[] | undefined, label: string): readonly T[] {
  if (!pool?.length) throw new RangeError(`peoplePreview: library has no lines for ${label}`);
  return pool;
}

export function peoplePreview(chart: Chart, lib: PeopleLibrary): PeoplePreview {
  const { palace, dominant } = traitFeatures(chart);
  const base = seedBase(chart);
  const near = pickByHash(requirePool(lib.near[palace], `near/${palace}`), `${base}|people-near`);
  const careful = pickByHash(requirePool(lib.careful[dominant], `careful/${dominant}`), `${base}|people-careful`);
  return {
    near: { group: palace, id: near.id, text: near.text, basis: lib.basis.near(lib.groupName[palace]) },
    careful: { group: dominant, id: careful.id, text: careful.text, signal: careful.signal, basis: lib.basis.careful(lib.groupName[dominant]) },
  };
}
