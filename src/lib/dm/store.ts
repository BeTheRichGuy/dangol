export class DmStoreError extends Error {
  constructor() {
    super('dm_store_unavailable');
    this.name = 'DmStoreError';
  }
}

export interface DmStore {
  claim(key: string, ttlSec: number): Promise<boolean>;
  release(key: string): Promise<void>;
  bump(key: string, ttlSec: number): Promise<number>;
}

export function createMemoryDmStore(now: () => number = Date.now): DmStore {
  const items = new Map<string, { value: number; exp: number }>();
  const live = (key: string) => {
    const it = items.get(key);
    if (it && it.exp <= now()) {
      items.delete(key);
      return undefined;
    }
    return it;
  };
  return {
    async claim(key, ttlSec) {
      if (live(key)) return false;
      items.set(key, { value: 1, exp: now() + ttlSec * 1000 });
      return true;
    },
    async release(key) {
      items.delete(key);
    },
    async bump(key, ttlSec) {
      const it = live(key);
      if (it) return ++it.value;
      items.set(key, { value: 1, exp: now() + ttlSec * 1000 });
      return 1;
    },
  };
}

export interface UpstashDmStoreOptions {
  url: string;
  token: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export function createUpstashDmStore(options: UpstashDmStoreOptions): DmStore {
  const baseUrl = options.url.trim().replace(/\/+$/, '');
  const token = options.token.trim();
  const timeoutMs = options.timeoutMs ?? 4000;

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
      console.error('[dm] redis request failed (network or timeout)');
      throw new DmStoreError();
    }
    const payload: unknown = await res.json().catch(() => null);
    if (!res.ok || typeof payload !== 'object' || payload === null || 'error' in payload || !('result' in payload)) {
      console.error(`[dm] redis error (http ${res.status})`);
      throw new DmStoreError();
    }
    return (payload as { result: unknown }).result;
  }

  return {
    async claim(key, ttlSec) {
      return (await command(['SET', key, '1', 'NX', 'EX', String(ttlSec)])) === 'OK';
    },
    async release(key) {
      await command(['DEL', key]);
    },
    async bump(key, ttlSec) {
      const n = Number(await command(['INCR', key]));
      if (!Number.isFinite(n)) throw new DmStoreError();
      if (n === 1) await command(['EXPIRE', key, String(ttlSec)]);
      return n;
    },
  };
}

type Env = Record<string, string | undefined>;
const clean = (raw: string | undefined) => (raw ?? '').trim().replace(/^(["'])(.*)\1$/, '$2').trim();

let memory: DmStore | null = null;

export function makeDmStore(env: Env, fetcher?: typeof fetch): DmStore | null {
  const url = clean(env.UPSTASH_REDIS_REST_URL) || clean(env.KV_REST_API_URL);
  const token = clean(env.UPSTASH_REDIS_REST_TOKEN) || clean(env.KV_REST_API_TOKEN);
  if (url && token && /^https?:\/\//.test(url)) return createUpstashDmStore({ url, token, fetch: fetcher });
  if (env.VERCEL) return null;
  return (memory ??= createMemoryDmStore());
}
