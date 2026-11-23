'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { JobState } from '@/lib/account/types';
import { hash32 } from '@/lib/reading/hash';
import type { RoomPayload } from '@/lib/rooms/payload';
import type { ProductKey } from '@/lib/rooms/themes';

export type ReadingError = 'refusal' | 'busy' | 'api' | 'incomplete' | 'network' | 'notOpen' | 'login' | 'payment';

const SERVER_ERRORS: readonly ReadingError[] = ['refusal', 'busy', 'api', 'incomplete'];

export type ReadingState =
  | { phase: 'idle' }
  | { phase: 'waiting' }
  | { phase: 'streaming'; text: string }
  | { phase: 'done'; text: string }
  | { phase: 'error'; error: ReadingError };

const storeKey = (room: ProductKey) => `dangol.room.${room}.v1`;

export interface JobIO {
  create(): Promise<string>;
  poll(id: string): Promise<JobState | null>;
  discard(id: string): Promise<void>;
}

export const JOB_STALE_MS = 9 * 60 * 1000;

export const JOB_START_MS = 60 * 1000;
export const JOB_POLL_MS = 3000;

export type JobView =
  | { phase: 'waiting' }
  | { phase: 'streaming'; text: string }
  | { phase: 'done'; text: string }
  | { phase: 'error'; error: ReadingError }
  | { phase: 'gone' };

export function viewOfJob(s: JobState | null, nowMs: number): JobView {
  if (!s) return { phase: 'gone' };
  if (s.status === 'done') return s.body && s.body.trim() ? { phase: 'done', text: s.body } : { phase: 'error', error: 'api' };
  if (s.status === 'error') return { phase: 'error', error: SERVER_ERRORS.find((e) => e === s.error) ?? 'api' };
  const created = Date.parse(s.createdAt);
  const touched = Date.parse(s.updatedAt);
  if (s.startedAt === null && Number.isFinite(created) && nowMs - created > JOB_START_MS) return { phase: 'error', error: 'network' };
  if (Number.isFinite(touched) && nowMs - touched > JOB_STALE_MS) return { phase: 'error', error: 'incomplete' };
  return s.body && s.body.length > 0 ? { phase: 'streaming', text: s.body } : { phase: 'waiting' };
}

const JOB_TTL_MS = 60 * 60 * 1000;
const jobKey = (room: ProductKey, payload: RoomPayload) => `dangol.job.${room}.${readingKey(payload)}`;

export function saveJobId(store: Storage, room: ProductKey, payload: RoomPayload, id: string, now: number = Date.now()): void {
  try {
    store.setItem(jobKey(room, payload), JSON.stringify({ id, at: now }));
  } catch {

  }
}

export function loadJobId(store: Storage, room: ProductKey, payload: RoomPayload, now: number = Date.now()): string | null {
  try {
    const v = JSON.parse(store.getItem(jobKey(room, payload)) ?? 'null') as { id?: unknown; at?: unknown } | null;
    if (!v || typeof v.id !== 'string' || typeof v.at !== 'number' || now - v.at > JOB_TTL_MS) return null;
    return v.id;
  } catch {
    return null;
  }
}

export function clearJobId(store: Storage, room: ProductKey, payload: RoomPayload): void {
  try {
    store.removeItem(jobKey(room, payload));
  } catch {

  }
}

export function readingKey(p: RoomPayload): string {
  return String(hash32(JSON.stringify({ ...p, today: undefined, now: undefined })));
}

function loadSaved(room: ProductKey, key: string): string | null {
  try {
    const raw = window.sessionStorage.getItem(storeKey(room));
    if (!raw) return null;
    const v = JSON.parse(raw) as { key?: unknown; text?: unknown };
    return v.key === key && typeof v.text === 'string' ? v.text : null;
  } catch {
    return null;
  }
}

export function savedReadingText(room: ProductKey, payload: RoomPayload): string | null {
  return loadSaved(room, readingKey(payload));
}

function save(room: ProductKey, key: string, text: string) {
  try {
    window.sessionStorage.setItem(storeKey(room), JSON.stringify({ key, text }));
  } catch {

  }
}

const receiptKey = (room: ProductKey) => `dangol.receipt.${room}.v1`;

export function loadReceipt(room: ProductKey, payload: RoomPayload): string | null {
  try {
    const v = JSON.parse(window.sessionStorage.getItem(receiptKey(room)) ?? 'null') as { key?: unknown; receipt?: unknown } | null;
    return v && v.key === readingKey(payload) && typeof v.receipt === 'string' ? v.receipt : null;
  } catch {
    return null;
  }
}

export function clearReceipt(room: ProductKey) {
  try {
    window.sessionStorage.removeItem(receiptKey(room));
  } catch {

  }
}

export function saveReceipt(room: ProductKey, payload: RoomPayload, receipt: string) {
  try {
    window.sessionStorage.setItem(receiptKey(room), JSON.stringify({ key: readingKey(payload), receipt }));
  } catch {

  }
}

export function interruptedState(s: ReadingState): ReadingState {
  return s.phase === 'waiting' || s.phase === 'streaming' ? { phase: 'error', error: 'network' } : s;
}

export function useRoomReading(room: ProductKey) {
  const [state, setState] = useState<ReadingState>({ phase: 'idle' });
  const ctrl = useRef<AbortController | null>(null);

  const watching = useRef<{ id: string; io: JobIO; payload: RoomPayload } | null>(null);
  const timer = useRef<number | null>(null);
  const failures = useRef(0);

  const lastFailed = useRef<{ id: string; io: JobIO } | null>(null);

  const [jobDoneId, setJobDoneId] = useState<string | null>(null);

  const starting = useRef(false);

  const stopPolling = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    const w = watching.current;
    if (!w) return;
    timer.current = null;
    const again = () => {
      if (watching.current === w) timer.current = window.setTimeout(() => void poll(), JOB_POLL_MS);
    };
    let view: JobView;
    try {
      view = viewOfJob(await w.io.poll(w.id), Date.now());
      failures.current = 0;
    } catch {

      failures.current += 1;
      if (failures.current >= 8 && watching.current === w) {
        watching.current = null;
        setState({ phase: 'error', error: 'network' });
        return;
      }
      return again();
    }
    if (watching.current !== w) return;
    if (view.phase === 'waiting') {
      setState((s) => (s.phase === 'streaming' || s.phase === 'waiting' ? s : { phase: 'waiting' }));
      return again();
    }
    if (view.phase === 'streaming') {
      setState({ phase: 'streaming', text: view.text });
      return again();
    }
    watching.current = null;
    clearJobId(window.localStorage, room, w.payload);
    if (view.phase === 'done') {
      save(room, readingKey(w.payload), view.text);
      setJobDoneId(w.id);
      setState({ phase: 'done', text: view.text });
    } else {
      if (view.phase === 'error') lastFailed.current = { id: w.id, io: w.io };
      setState({ phase: 'error', error: view.phase === 'error' ? view.error : 'api' });
    }
  }, [room]);

  const startPolling = useCallback(() => {
    stopPolling();
    void poll();
  }, [poll, stopPolling]);

  useEffect(() => {
    if (watching.current) startPolling();
    return () => {
      stopPolling();
      const c = ctrl.current;
      if (!c || c.signal.aborted) return;
      c.abort();

      if (!starting.current) setState(interruptedState);
    };
  }, [startPolling, stopPolling]);

  const restore = useCallback(
    (payload: RoomPayload): boolean => {
      const saved = loadSaved(room, readingKey(payload));
      if (saved === null) return false;
      setState({ phase: 'done', text: saved });
      return true;
    },
    [room],
  );

  const start = useCallback(
    async (payload: RoomPayload, token: string | null = null, receipt: string | null = null) => {
      ctrl.current?.abort();
      const c = new AbortController();
      ctrl.current = c;
      setState({ phase: 'waiting' });
      let text = '';
      try {
        const res = await fetch('/api/reading', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(receipt ? { 'X-Dangol-Receipt': receipt } : {}),
          },
          body: JSON.stringify(payload),
          signal: c.signal,
        });
        if (res.status === 503) return setState({ phase: 'error', error: 'notOpen' });
        if (res.status === 401) return setState({ phase: 'error', error: 'login' });
        if (res.status === 402) return setState({ phase: 'error', error: 'payment' });
        if (!res.ok || !res.body) return setState({ phase: 'error', error: 'api' });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let ended = false;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const ev = JSON.parse(line) as { t: string; v?: string; stop?: unknown; code?: unknown };
            if (ev.t === 'text' && typeof ev.v === 'string') {
              text += ev.v;
              setState({ phase: 'streaming', text });
            } else if (ev.t === 'end') {

              ended = ev.stop === 'end_turn';
            } else if (ev.t === 'error') {

              const code = SERVER_ERRORS.find((c) => c === ev.code) ?? 'api';
              return setState({ phase: 'error', error: code });
            }

          }
        }
        if (!ended || !text.trim()) return setState({ phase: 'error', error: 'api' });
        save(room, readingKey(payload), text);
        setState({ phase: 'done', text });
      } catch {
        if (c.signal.aborted) return;
        setState({ phase: 'error', error: 'network' });
      }
    },
    [room],
  );

  const startJob = useCallback(
    async (payload: RoomPayload, token: string | null, receipt: string | null, io: JobIO) => {
      ctrl.current?.abort();
      stopPolling();
      watching.current = null;
      const c = new AbortController();
      ctrl.current = c;
      starting.current = true;
      setState({ phase: 'waiting' });
      const done = (s: ReadingState) => {
        starting.current = false;
        if (ctrl.current === c) ctrl.current = null;
        if (!c.signal.aborted) setState(s);
      };
      let id: string;
      try {

        const failed = lastFailed.current;
        lastFailed.current = null;
        if (failed) void failed.io.discard(failed.id).catch(() => undefined);
        id = await io.create();
      } catch {
        return done({ phase: 'error', error: 'api' });
      }
      saveJobId(window.localStorage, room, payload, id);
      try {
        const res = await fetch('/api/reading', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(receipt ? { 'X-Dangol-Receipt': receipt } : {}),
          },
          body: JSON.stringify({ ...payload, jobId: id }),
          signal: c.signal,
        });
        if (res.status !== 202) {

          void io.discard(id).catch(() => undefined);
          clearJobId(window.localStorage, room, payload);
          const error: ReadingError = res.status === 503 ? 'notOpen' : res.status === 401 ? 'login' : res.status === 402 ? 'payment' : 'api';
          return done({ phase: 'error', error });
        }
      } catch {

        if (c.signal.aborted) {
          starting.current = false;
          return;
        }
      }
      starting.current = false;
      if (ctrl.current === c) ctrl.current = null;
      if (c.signal.aborted) return;
      watching.current = { id, io, payload };
      startPolling();
    },
    [room, startPolling, stopPolling],
  );

  const resume = useCallback(
    (payload: RoomPayload, io: JobIO): boolean => {
      const id = loadJobId(window.localStorage, room, payload);
      if (!id) return false;
      if (watching.current?.id === id) return true;
      stopPolling();
      watching.current = { id, io, payload };
      setState({ phase: 'waiting' });
      startPolling();
      return true;
    },
    [room, startPolling, stopPolling],
  );

  const startSample = useCallback(async (load: () => Promise<string | null>) => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setState({ phase: 'waiting' });
    const full = await load();
    if (c.signal.aborted) return;
    if (!full) return setState({ phase: 'error', error: 'notOpen' });
    await new Promise((r) => window.setTimeout(r, 900));
    for (let at = 0; at < full.length; at += SAMPLE_CHUNK) {
      if (c.signal.aborted) return;
      setState({ phase: 'streaming', text: full.slice(0, at + SAMPLE_CHUNK) });
      await new Promise((r) => window.setTimeout(r, SAMPLE_TICK_MS));
    }
    if (!c.signal.aborted) setState({ phase: 'done', text: full });
  }, []);

  const forget = useCallback(() => {
    ctrl.current?.abort();
    stopPolling();
    watching.current = null;
    try {
      window.sessionStorage.removeItem(storeKey(room));
    } catch {

    }
    setState({ phase: 'idle' });
  }, [room, stopPolling]);

  return { state, start, startJob, resume, restore, startSample, forget, jobDoneId };
}

const SAMPLE_CHUNK = 60;
const SAMPLE_TICK_MS = 30;
