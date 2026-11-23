import { READING_KINDS, type ReadingKind, type SavedReading } from './types';

export type ArchiveView = 'all' | 'person' | 'kind';

export interface ArchiveGroup {

  key: string;

  label: string;
  items: SavedReading[];
}

const newestFirst = (a: SavedReading, b: SavedReading) => b.createdAt.localeCompare(a.createdAt);

function personKeys(r: SavedReading): { key: string; label: string }[] {
  return r.people.map((p) => ({ key: [p.date, p.time ?? '-', p.place.name, p.place.tz].join('|'), label: p.name }));
}

export function groupReadings(list: readonly SavedReading[], view: ArchiveView): ArchiveGroup[] {
  const sorted = [...list].sort(newestFirst);
  if (view === 'all') {
    const byMonth = new Map<string, SavedReading[]>();
    for (const r of sorted) {
      const m = r.createdAt.slice(0, 7);
      byMonth.set(m, [...(byMonth.get(m) ?? []), r]);
    }
    return [...byMonth].map(([key, items]) => ({ key, label: key, items }));
  }
  if (view === 'kind') {
    return READING_KINDS.flatMap((kind) => {
      const items = sorted.filter((r) => r.kind === kind);
      return items.length ? [{ key: kind, label: kind, items }] : [];
    });
  }
  const groups = new Map<string, ArchiveGroup>();
  for (const r of sorted) {
    for (const { key, label } of personKeys(r)) {
      const g = groups.get(key) ?? { key, label, items: [] };
      g.items.push(r);
      groups.set(key, g);
    }
  }
  return [...groups.values()];
}

export function isReadingKind(v: unknown): v is ReadingKind {
  return typeof v === 'string' && (READING_KINDS as readonly string[]).includes(v);
}
