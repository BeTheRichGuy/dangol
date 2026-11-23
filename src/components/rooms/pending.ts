import type { ReadingDraft } from '@/lib/account/types';
import type { RoomPayload } from '@/lib/rooms/payload';
import type { ChapterRoom } from '@/lib/rooms/themes';
import { splitChapters } from './reading-blocks';

export interface PendingReading {

  payload: RoomPayload;

  sex?: 'female' | 'male' | null;

  receipt: string | null;

  readerName: string;

  draft: Omit<ReadingDraft, 'body'> | null;

  guestDraft?: Omit<ReadingDraft, 'body'> | null;

  edition?: 'xmas';
}

const key = (room: ChapterRoom) => `dangol.pending.${room}.v1`;

export function savePending(store: Storage, room: ChapterRoom, v: PendingReading): void {
  try {
    store.setItem(key(room), JSON.stringify(v));
  } catch {

  }
}

export function readPendingRaw(store: Storage, room: ChapterRoom): string | null {
  try {
    return store.getItem(key(room));
  } catch {
    return null;
  }
}

export function loadPending(store: Storage, room: ChapterRoom): PendingReading | null {
  return parsePending(readPendingRaw(store, room), room);
}

export function parsePending(raw: string | null, room: ChapterRoom): PendingReading | null {
  try {
    const v = JSON.parse(raw ?? 'null') as Partial<PendingReading> | null;
    if (!v || typeof v !== 'object') return null;
    const p = v.payload as { room?: unknown } | null | undefined;
    if (!p || typeof p !== 'object' || p.room !== room) return null;
    if (v.receipt !== null && typeof v.receipt !== 'string') return null;
    if (typeof v.readerName !== 'string') return null;
    if (v.draft !== null && (typeof v.draft !== 'object' || v.draft === undefined)) return null;
    return v as PendingReading;
  } catch {
    return null;
  }
}

export type ReadPagePlan = 'sample' | 'show-saved' | 'start' | 'back';

export function readPagePlan(input: { sample: boolean; pending: PendingReading | null; saved: string | null }): ReadPagePlan {
  if (input.sample) return 'sample';
  if (!input.pending) return 'back';
  return input.saved !== null ? 'show-saved' : 'start';
}

export type ReadStage = 'preparing' | 'reading' | 'error';

export function readStage(phase: 'idle' | 'waiting' | 'streaming' | 'done' | 'error'): ReadStage {
  if (phase === 'done') return 'reading';
  if (phase === 'error') return 'error';
  return 'preparing';
}

export function writtenChapters(text: string): number {
  return splitChapters(text, true).filter((c) => c.complete).length;
}
