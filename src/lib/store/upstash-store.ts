import {
  WaitlistError,
  type WaitlistAdapter,
  type WaitlistDraft,
  type WaitlistEntry,
  type WaitlistResult,
} from './types';

export interface UpstashAdapterOptions {

  url: string;
  token: string;

  prefix?: string;

  timeoutMs?: number;

  fetch?: typeof fetch;
}

const DEFAULT_PREFIX = 'dangol:waitlist';
const DEFAULT_TIMEOUT_MS = 6000;

export function regularNoForOrdinal(ordinal: number): number {
  if (!Number.isSafeInteger(ordinal) || ordinal < 1) {
    throw new RangeError('ordinal must be a safe integer >= 1');
  }
  let rest = ordinal + 3;
  let digits = '';
  do {
    const digit = rest % 9;
    digits = String(digit >= 4 ? digit + 1 : digit) + digits;
    rest = Math.floor(rest / 9);
  } while (rest > 0);
  return Number(digits);
}

function toPositiveInteger(value: unknown): number {
  const n =
    typeof value === 'number' ? value : typeof value === 'string' && /^\d{1,15}$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n < 1) throw new WaitlistError('storage_unavailable');
  return n;
}

export function createUpstashAdapter(options: UpstashAdapterOptions): WaitlistAdapter {
  const baseUrl = options.url.trim().replace(/\/+$/, '');
  const token = options.token.trim();
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const seqKey = `${prefix}:seq`;
  const emailKey = `${prefix}:email_no`;
  const entriesKey = `${prefix}:entries`;

  async function command(args: string[]): Promise<unknown> {
    const doFetch = options.fetch ?? globalThis.fetch;
    let res: Response;
    try {
      res = await doFetch(baseUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      console.error('[waitlist] redis request failed (network or timeout)');
      throw new WaitlistError('storage_unavailable');
    }
    const payload: unknown = await res.json().catch(() => null);
    const failed =
      !res.ok || typeof payload !== 'object' || payload === null || 'error' in payload || !('result' in payload);
    if (failed) {

      console.error(`[waitlist] redis error (http ${res.status})`);
      throw new WaitlistError('storage_unavailable');
    }
    return (payload as { result: unknown }).result;
  }

  async function addOrGet(draft: WaitlistDraft): Promise<WaitlistResult> {
    const known = await command(['HGET', emailKey, draft.email]);
    if (known !== null && known !== undefined) {
      return { regularNo: toPositiveInteger(known), created: false };
    }

    const ordinal = toPositiveInteger(await command(['INCR', seqKey]));
    const regularNo = regularNoForOrdinal(ordinal);

    const claimed = await command(['HSETNX', emailKey, draft.email, String(regularNo)]);
    if (claimed !== 1 && claimed !== '1') {

      const winner = await command(['HGET', emailKey, draft.email]);
      return { regularNo: toPositiveInteger(winner), created: false };
    }

    const entry: WaitlistEntry = { ...draft, regularNo };
    await command(['HSET', entriesKey, String(regularNo), JSON.stringify(entry)]);
    return { regularNo, created: true };
  }

  return {
    async addOrGet(draft) {
      try {
        return await addOrGet(draft);
      } catch (error) {
        if (error instanceof WaitlistError) throw error;
        console.error('[waitlist] unexpected redis adapter error');
        throw new WaitlistError('storage_unavailable');
      }
    },
  };
}

function cleanEnv(raw: string | undefined): string {
  return (raw ?? '').trim().replace(/^(["'])(.*)\1$/, '$2').trim();
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

export function createUpstashAdapterFromEnv(
  env: Record<string, string | undefined> = process.env,
): WaitlistAdapter | null {
  const url = cleanEnv(env.UPSTASH_REDIS_REST_URL) || cleanEnv(env.KV_REST_API_URL);
  const token = cleanEnv(env.UPSTASH_REDIS_REST_TOKEN) || cleanEnv(env.KV_REST_API_TOKEN);
  if (!url || !token || !isHttpUrl(url)) return null;
  return createUpstashAdapter({ url, token });
}
