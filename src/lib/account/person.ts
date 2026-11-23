import type { BirthInput } from '@/lib/saju/types';
import { RELATIONS, type Person, type PersonDraft, type PersonPlace, type PersonSnapshot, type Relation } from './types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isRelation(v: unknown): v is Relation {
  return typeof v === 'string' && (RELATIONS as readonly string[]).includes(v);
}

function isPlace(v: unknown): v is PersonPlace {
  if (!v || typeof v !== 'object') return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.name === 'string' &&
    typeof p.tz === 'string' &&
    typeof p.lat === 'number' &&
    typeof p.lng === 'number' &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng)
  );
}

export function cleanDraft(d: Partial<PersonDraft>): PersonDraft | null {
  const name = (d.name ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 24);
  if (!name) return null;
  if (!isRelation(d.relation)) return null;
  if (typeof d.date !== 'string' || !DATE_RE.test(d.date)) return null;
  if (!(d.time === null || (typeof d.time === 'string' && TIME_RE.test(d.time)))) return null;
  if (!isPlace(d.place)) return null;
  const p = d.place;
  return {
    name,
    relation: d.relation,
    date: d.date,
    time: d.time,
    place: {
      name: p.name.slice(0, 80),
      country: typeof p.country === 'string' ? p.country.slice(0, 2) : '',
      lat: p.lat,
      lng: p.lng,
      tz: p.tz.slice(0, 64),
      label: typeof p.label === 'string' && p.label ? p.label.slice(0, 120) : p.name.slice(0, 80),
    },
    sex: d.sex === 'female' || d.sex === 'male' ? d.sex : null,
  };
}

export function personFromRow(row: Record<string, unknown>): Person | null {
  const draft = cleanDraft({
    name: row.name as string,
    relation: row.relation as Relation,
    date: typeof row.birth_date === 'string' ? row.birth_date.slice(0, 10) : undefined,
    time: (row.birth_time as string | null) ?? null,
    place: row.place as PersonPlace,
    sex: row.sex as Person['sex'],
  });
  if (!draft || typeof row.id !== 'string') return null;
  return {
    id: row.id,
    ...draft,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? row.created_at ?? ''),
  };
}

export function rowFromDraft(d: PersonDraft): Record<string, unknown> {
  return {
    name: d.name,
    relation: d.relation,
    birth_date: d.date,
    birth_time: d.time,
    place: d.place,
    sex: d.sex,
  };
}

export function birthInputOf(p: Pick<Person, 'date' | 'time' | 'place' | 'sex'>): BirthInput {
  return {
    date: p.date,
    time: p.time,
    place: { name: p.place.name, country: p.place.country, lat: p.place.lat, lng: p.place.lng, tz: p.place.tz },
    sex: p.sex,
  };
}

export function snapshotOf(p: Person): PersonSnapshot {
  return { id: p.id, name: p.name, relation: p.relation, date: p.date, time: p.time, place: p.place, sex: p.sex };
}

export function sortPeople(list: readonly Person[]): Person[] {
  return [...list].sort((a, b) => {
    if (a.relation === 'self' && b.relation !== 'self') return -1;
    if (b.relation === 'self' && a.relation !== 'self') return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function samePerson(a: Pick<Person, 'date' | 'time' | 'place'>, b: Pick<Person, 'date' | 'time' | 'place'>): boolean {
  return a.date === b.date && a.time === b.time && a.place.name === b.place.name && a.place.tz === b.place.tz;
}
