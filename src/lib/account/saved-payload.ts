import { splitIntakeTag } from '@/lib/reunion/intake';
import { buildRoomPayload, type RoomPayload } from '@/lib/rooms/payload';
import { computeChart } from '@/lib/saju';
import { isPairKind, type ChapterRoom } from '@/lib/rooms/themes';
import { birthInputOf } from './person';
import type { SavedReading } from './types';

export function shownQuestion(question: string): string {
  return splitIntakeTag(question).concern;
}

export function savedPayload(reading: Pick<SavedReading, 'locale' | 'people' | 'nowIso' | 'question'>, room: ChapterRoom): RoomPayload | null {
  const self = reading.people[0];
  if (!self || !Number.isFinite(Date.parse(reading.nowIso))) return null;
  try {
    if (room === 'reunion') {
      const { concern, intake } = splitIntakeTag(reading.question);
      const them = reading.people[1];
      if (!intake || !them) return null;
      return buildRoomPayload({
        room,
        locale: reading.locale,
        chart: computeChart(birthInputOf(self)),
        nowIso: reading.nowIso,
        question: concern,
        partner: { chart: computeChart(birthInputOf(them)), kind: 'lover' },
        reunion: intake,
      });
    }

    const them = room === 'match' ? reading.people[1] : undefined;
    const partner = them ? { chart: computeChart(birthInputOf(them)), kind: isPairKind(them.relation) ? them.relation : ('lover' as const) } : undefined;
    return buildRoomPayload({ room, locale: reading.locale, chart: computeChart(birthInputOf(self)), nowIso: reading.nowIso, question: reading.question, partner });
  } catch {
    return null;
  }
}
