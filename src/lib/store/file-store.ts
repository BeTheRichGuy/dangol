import { promises as fs } from 'node:fs';
import path from 'node:path';
import { nextRegularNo } from '../regular';
import {
  WaitlistError,
  type WaitlistAdapter,
  type WaitlistDraft,
  type WaitlistEntry,
  type WaitlistResult,
} from './types';

export interface FileAdapterOptions {

  dir?: string;

  lockTimeoutMs?: number;

  staleLockMs?: number;
}

const ENTRIES_FILE = 'waitlist.jsonl';
const COUNTER_FILE = 'counter.json';
const LOCK_FILE = '.waitlist.lock';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined;
}

function isEntry(value: unknown): value is WaitlistEntry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<WaitlistEntry>;
  return typeof v.email === 'string' && Number.isSafeInteger(v.regularNo) && (v.regularNo as number) > 0;
}

export function createFileAdapter(options: FileAdapterOptions = {}): WaitlistAdapter {
  const dir = options.dir ?? process.env.DANGOL_DATA_DIR ?? path.join(process.cwd(), 'data');
  const lockTimeoutMs = options.lockTimeoutMs ?? 8000;
  const staleLockMs = options.staleLockMs ?? 15000;
  const entriesPath = path.join(dir, ENTRIES_FILE);
  const counterPath = path.join(dir, COUNTER_FILE);
  const lockPath = path.join(dir, LOCK_FILE);

  async function acquireLock(): Promise<() => Promise<void>> {
    const startedAt = Date.now();
    for (;;) {
      try {
        const handle = await fs.open(lockPath, 'wx');
        await handle.writeFile(String(process.pid));
        await handle.close();
        return async () => {
          await fs.unlink(lockPath).catch(() => undefined);
        };
      } catch (error) {
        if (errorCode(error) !== 'EEXIST') throw error;
      }

      try {
        const stat = await fs.stat(lockPath);
        if (Date.now() - stat.mtimeMs > staleLockMs) {
          await fs.unlink(lockPath).catch(() => undefined);
          continue;
        }
      } catch (error) {
        if (errorCode(error) === 'ENOENT') continue;
        throw error;
      }
      if (Date.now() - startedAt > lockTimeoutMs) {
        throw new WaitlistError('storage_unavailable');
      }
      await sleep(15 + Math.floor(Math.random() * 25));
    }
  }

  async function readEntries(): Promise<{ entries: WaitlistEntry[]; needsLeadingNewline: boolean }> {
    let raw: string;
    try {
      raw = await fs.readFile(entriesPath, 'utf8');
    } catch (error) {
      if (errorCode(error) === 'ENOENT') return { entries: [], needsLeadingNewline: false };
      throw error;
    }
    const entries: WaitlistEntry[] = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        const parsed: unknown = JSON.parse(line);
        if (isEntry(parsed)) entries.push(parsed);
      } catch {

      }
    }
    return { entries, needsLeadingNewline: raw.length > 0 && !raw.endsWith('\n') };
  }

  async function readCounter(): Promise<number> {
    try {
      const parsed: unknown = JSON.parse(await fs.readFile(counterPath, 'utf8'));
      const last = (parsed as { lastRegularNo?: unknown } | null)?.lastRegularNo;
      return typeof last === 'number' && Number.isSafeInteger(last) && last >= 0 ? last : 0;
    } catch {
      return 0;
    }
  }

  async function writeCounter(lastRegularNo: number): Promise<void> {
    const tmp = `${counterPath}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ lastRegularNo }) + '\n', 'utf8');
    await fs.rename(tmp, counterPath);
  }

  async function addLocked(draft: WaitlistDraft): Promise<WaitlistResult> {
    const { entries, needsLeadingNewline } = await readEntries();

    const existing = entries.find((entry) => entry.email === draft.email);
    if (existing) return { regularNo: existing.regularNo, created: false };

    let last = await readCounter();
    for (const entry of entries) if (entry.regularNo > last) last = entry.regularNo;

    const regularNo = nextRegularNo(last);
    const entry: WaitlistEntry = { ...draft, regularNo };

    await fs.appendFile(entriesPath, (needsLeadingNewline ? '\n' : '') + JSON.stringify(entry) + '\n', 'utf8');
    await writeCounter(regularNo);
    return { regularNo, created: true };
  }

  let queue: Promise<unknown> = Promise.resolve();

  return {
    addOrGet(draft) {
      const job = queue.then(async () => {
        try {
          await fs.mkdir(dir, { recursive: true });
          const release = await acquireLock();
          try {
            return await addLocked(draft);
          } finally {
            await release();
          }
        } catch (error) {
          if (error instanceof WaitlistError) throw error;

          console.error(`[waitlist] storage error (${errorCode(error) ?? 'unknown'})`);
          throw new WaitlistError('storage_unavailable');
        }
      });
      queue = job.catch(() => undefined);
      return job;
    },
  };
}
