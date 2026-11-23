import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleWaitlistPost, handleWaitlistStatus } from '../src/app/api/waitlist/handler';
import {
  WaitlistError,
  addToWaitlist,
  createFileAdapter,
  createUpstashAdapter,
  createUpstashAdapterFromEnv,
  isValidEmail,
  isWaitlistOpen,
  parseWaitlistInput,
  regularNoForOrdinal,
  setWaitlistAdapter,
} from '../src/lib/store';
import type { WaitlistDraft, WaitlistEntry } from '../src/lib/store';
import { hasFour, nextRegularNo } from '../src/lib/regular';

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dangol-waitlist-'));
});

afterEach(async () => {
  setWaitlistAdapter(null);
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  await fs.rm(dir, { recursive: true, force: true });
});

function draft(email: string, extra: Partial<WaitlistDraft> = {}): WaitlistDraft {
  return { email, createdAt: '2026-10-15T00:00:00.000Z', consent: true, source: 'test', ...extra };
}

async function readLines(): Promise<WaitlistEntry[]> {
  const raw = await fs.readFile(path.join(dir, 'waitlist.jsonl'), 'utf8');
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as WaitlistEntry);
}

describe('isValidEmail', () => {
  it('accepts ordinary addresses', () => {
    for (const email of ['a@b.co', 'first.last@example.com', 'a+tag@mail.example.org', "o'neil@example.ie", 'x@xn--bcher-kva.example']) {
      expect(isValidEmail(email), email).toBe(true);
    }
  });

  it('rejects malformed addresses', () => {
    for (const email of [
      '',
      'plain',
      '@example.com',
      'a@',
      'a@b',
      'a@@b.com',
      'a b@example.com',
      '.a@example.com',
      'a.@example.com',
      'a..b@example.com',
      'a@-example.com',
      'a@example-.com',
      'a@example..com',
      'a@example.c',
      'a@example.123',
      `${'a'.repeat(65)}@example.com`,
      `a@${'b'.repeat(250)}.com`,
    ]) {
      expect(isValidEmail(email), email).toBe(false);
    }
  });
});

describe('parseWaitlistInput', () => {
  it('normalizes the email and keeps the optional fields it understands', () => {
    const result = parseWaitlistInput({
      email: '  Mina.Kim@Example.COM ',
      consent: true,
      source: 'Result',
      type: 'candle',
      focus: 'love',
      utm: { utm_source: 'tiktok', utm_campaign: 'launch', other: 'x' },
    });
    expect(result).toEqual({
      ok: true,
      value: {
        email: 'mina.kim@example.com',
        consent: true,
        source: 'result',
        type: 'candle',
        focus: 'love',
        utm: { utm_source: 'tiktok', utm_campaign: 'launch' },
      },
    });
  });

  it('drops bad optional fields instead of blocking the signup', () => {
    const result = parseWaitlistInput({
      email: 'a@b.co',
      consent: true,
      source: 'has spaces and <script>',
      type: 'dragon',
      focus: 7,
      utm: 'nope',
    });
    expect(result).toEqual({
      ok: true,
      value: { email: 'a@b.co', consent: true, source: 'unknown', type: undefined, focus: undefined, utm: undefined },
    });
  });

  it('caps utm values and strips control characters', () => {
    const result = parseWaitlistInput({
      email: 'a@b.co',
      consent: true,
      utm: { utm_source: `x\u0000y${'z'.repeat(500)}` },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const value = result.value.utm?.utm_source ?? '';
      expect(value.length).toBeLessThanOrEqual(100);
      expect(value).not.toContain('\u0000');
    }
  });

  it('requires a valid email', () => {
    expect(parseWaitlistInput({ consent: true })).toEqual({ ok: false, error: 'invalid_email' });
    expect(parseWaitlistInput({ email: 42, consent: true })).toEqual({ ok: false, error: 'invalid_email' });
    expect(parseWaitlistInput({ email: 'nope', consent: true })).toEqual({ ok: false, error: 'invalid_email' });
  });

  it('requires consent to be exactly true', () => {
    for (const consent of [undefined, false, 'true', 1, null]) {
      expect(parseWaitlistInput({ email: 'a@b.co', consent }), String(consent)).toEqual({
        ok: false,
        error: 'consent_required',
      });
    }
  });

  it('rejects bodies that are not objects', () => {
    for (const body of [null, 'x', 5, [], undefined]) {
      expect(parseWaitlistInput(body)).toEqual({ ok: false, error: 'invalid_body' });
    }
  });

  it('does not treat inherited keys as a type or focus', () => {
    const result = parseWaitlistInput({ email: 'a@b.co', consent: true, type: 'constructor', focus: '__proto__' });
    expect(result.ok && result.value.type).toBeFalsy();
    expect(result.ok && result.value.focus).toBeFalsy();
  });
});

describe('file adapter', () => {
  it('gives the first person No. 5, then 6, 7', async () => {
    const store = createFileAdapter({ dir });
    expect(await store.addOrGet(draft('a@example.com'))).toEqual({ regularNo: 5, created: true });
    expect(await store.addOrGet(draft('b@example.com'))).toEqual({ regularNo: 6, created: true });
    expect(await store.addOrGet(draft('c@example.com'))).toEqual({ regularNo: 7, created: true });
  });

  it('returns the existing number for the same email and writes no second line', async () => {
    const store = createFileAdapter({ dir });
    await store.addOrGet(draft('a@example.com'));
    await store.addOrGet(draft('b@example.com'));
    expect(await store.addOrGet(draft('a@example.com', { source: 'other' }))).toEqual({ regularNo: 5, created: false });
    expect(await readLines()).toHaveLength(2);
    const counter = JSON.parse(await fs.readFile(path.join(dir, 'counter.json'), 'utf8'));
    expect(counter).toEqual({ lastRegularNo: 6 });
  });

  it('skips numbers with a 4', async () => {
    const store = createFileAdapter({ dir });
    const issued: number[] = [];
    for (let i = 0; i < 60; i += 1) {
      issued.push((await store.addOrGet(draft(`p${i}@example.com`))).regularNo);
    }
    expect(issued.slice(0, 10)).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 15]);
    expect(issued.some(hasFour)).toBe(false);
    expect(new Set(issued).size).toBe(60);
    expect(issued).toEqual([...issued].sort((a, b) => a - b));
  });

  it('hands out unique numbers under heavy concurrent signups', async () => {
    const store = createFileAdapter({ dir });
    const results = await Promise.all(
      Array.from({ length: 40 }, (_, i) => store.addOrGet(draft(`p${i}@example.com`))),
    );
    const numbers = results.map((r) => r.regularNo);
    expect(new Set(numbers).size).toBe(40);
    expect(numbers.some(hasFour)).toBe(false);
    expect(results.every((r) => r.created)).toBe(true);
    expect(await readLines()).toHaveLength(40);
  });

  it('stays correct when two adapters (two processes) share one folder', async () => {
    const a = createFileAdapter({ dir });
    const b = createFileAdapter({ dir });
    const jobs: Promise<{ regularNo: number; created: boolean }>[] = [];
    for (let i = 0; i < 25; i += 1) {
      jobs.push(a.addOrGet(draft(`a${i}@example.com`)));
      jobs.push(b.addOrGet(draft(`b${i}@example.com`)));
    }

    jobs.push(a.addOrGet(draft('same@example.com')), b.addOrGet(draft('same@example.com')));
    const results = await Promise.all(jobs);
    const lines = await readLines();
    expect(lines).toHaveLength(51);
    expect(new Set(lines.map((l) => l.regularNo)).size).toBe(51);
    expect(new Set(lines.map((l) => l.email)).size).toBe(51);
    const same = results.slice(-2);
    expect(same[0].regularNo).toBe(same[1].regularNo);
    expect(same.filter((r) => r.created)).toHaveLength(1);

    await expect(fs.stat(path.join(dir, '.waitlist.lock'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('recovers the counter from the list when counter.json is missing or broken', async () => {
    const store = createFileAdapter({ dir });
    for (let i = 0; i < 3; i += 1) await store.addOrGet(draft(`p${i}@example.com`));
    await fs.rm(path.join(dir, 'counter.json'));
    expect((await store.addOrGet(draft('next@example.com'))).regularNo).toBe(8);
    await fs.writeFile(path.join(dir, 'counter.json'), '{not json', 'utf8');
    expect((await store.addOrGet(draft('after@example.com'))).regularNo).toBe(9);
  });

  it('survives a half-written last line', async () => {
    const store = createFileAdapter({ dir });
    await store.addOrGet(draft('a@example.com'));
    await fs.appendFile(path.join(dir, 'waitlist.jsonl'), '{"email":"broken@exa', 'utf8');
    expect(await store.addOrGet(draft('b@example.com'))).toEqual({ regularNo: 6, created: true });
    expect(await store.addOrGet(draft('a@example.com'))).toEqual({ regularNo: 5, created: false });
    const raw = await fs.readFile(path.join(dir, 'waitlist.jsonl'), 'utf8');
    const good = raw.split('\n').filter((line) => line.startsWith('{"email":"b@') || line.startsWith('{"email":"a@'));
    expect(good).toHaveLength(2);
  });

  it('clears a stale lock left by a dead process', async () => {
    const lock = path.join(dir, '.waitlist.lock');
    await fs.writeFile(lock, '99999', 'utf8');
    const old = new Date(Date.now() - 60_000);
    await fs.utimes(lock, old, old);
    const store = createFileAdapter({ dir, staleLockMs: 1000 });
    expect((await store.addOrGet(draft('a@example.com'))).regularNo).toBe(5);
  });

  it('reports storage_unavailable (without the email) when the lock never frees', async () => {
    await fs.writeFile(path.join(dir, '.waitlist.lock'), String(process.pid), 'utf8');
    const store = createFileAdapter({ dir, lockTimeoutMs: 120, staleLockMs: 60_000 });
    const failure = await store.addOrGet(draft('secret.person@example.com')).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(WaitlistError);
    expect((failure as WaitlistError).code).toBe('storage_unavailable');
    expect(String((failure as Error).message)).not.toContain('secret.person');
  });

  it('stores only what the signup needs', async () => {
    const store = createFileAdapter({ dir });
    await store.addOrGet(draft('a@example.com', { type: 'candle', focus: 'love', utm: { utm_source: 'tiktok' } }));
    const [line] = await readLines();
    expect(Object.keys(line).sort()).toEqual(
      ['consent', 'createdAt', 'email', 'focus', 'regularNo', 'source', 'type', 'utm'].sort(),
    );
  });
});

describe('addToWaitlist', () => {
  it('returns { regularNo } and lowercases the email before storing', async () => {
    setWaitlistAdapter(createFileAdapter({ dir }));
    const first = await addToWaitlist({ email: 'Mina@Example.com', consent: true, type: 'candle' });
    expect(first).toEqual({ regularNo: 5 });
    expect(await addToWaitlist({ email: ' mina@example.com ', consent: true })).toEqual({ regularNo: 5 });
    const lines = await readLines();
    expect(lines).toHaveLength(1);
    expect(lines[0].email).toBe('mina@example.com');
    expect(lines[0].type).toBe('candle');
    expect(lines[0].source).toBe('unknown');
  });

  it('refuses bad input with an error that does not contain the email', async () => {
    setWaitlistAdapter(createFileAdapter({ dir }));
    const noConsent = await addToWaitlist({ email: 'hidden@example.com', consent: false }).catch((e: unknown) => e);
    expect(noConsent).toMatchObject({ code: 'consent_required' });
    expect(String((noConsent as Error).message)).not.toContain('hidden');
    const badEmail = await addToWaitlist({ email: 'not an email', consent: true }).catch((e: unknown) => e);
    expect(badEmail).toMatchObject({ code: 'invalid_email' });
    expect(String((badEmail as Error).message)).not.toContain('not an email');
    await expect(fs.stat(path.join(dir, 'waitlist.jsonl'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
});

describe('POST /api/waitlist handler', () => {
  function post(body: unknown, headers: Record<string, string> = { 'content-type': 'application/json' }): Request {
    return new Request('http://localhost/api/waitlist', {
      method: 'POST',
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }

  beforeEach(() => {
    setWaitlistAdapter(createFileAdapter({ dir }));
  });

  it('answers { regularNo } and the same number for the same email', async () => {
    const res = await handleWaitlistPost(post({ email: 'a@example.com', consent: true, source: 'result' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ regularNo: 5 });
    const again = await handleWaitlistPost(post({ email: 'A@EXAMPLE.com', consent: true, source: 'type' }));
    expect(await again.json()).toEqual({ regularNo: 5 });
    const other = await handleWaitlistPost(post({ email: 'b@example.com', consent: true }));
    expect(await other.json()).toEqual({ regularNo: 6 });
  });

  it('answers 400 with a code and never echoes the email', async () => {
    const consent = await handleWaitlistPost(post({ email: 'hidden@example.com', consent: false }));
    expect(consent.status).toBe(400);
    const consentText = await consent.text();
    expect(JSON.parse(consentText)).toEqual({ error: 'consent_required' });
    expect(consentText).not.toContain('hidden');

    const email = await handleWaitlistPost(post({ email: 'hidden-at-example', consent: true }));
    expect(email.status).toBe(400);
    const emailText = await email.text();
    expect(JSON.parse(emailText)).toEqual({ error: 'invalid_email' });
    expect(emailText).not.toContain('hidden');

    const json = await handleWaitlistPost(post('{nope'));
    expect(json.status).toBe(400);
    expect(await json.json()).toEqual({ error: 'invalid_json' });

    const body = await handleWaitlistPost(post('[1,2]'));
    expect(body.status).toBe(400);
    expect(await body.json()).toEqual({ error: 'invalid_body' });
  });

  it('refuses requests that are not JSON', async () => {
    const res = await handleWaitlistPost(
      post('email=a@example.com&consent=true', { 'content-type': 'application/x-www-form-urlencoded' }),
    );
    expect(res.status).toBe(415);
    expect(await res.json()).toEqual({ error: 'unsupported_media_type' });
    const none = await handleWaitlistPost(post('{}', {}));
    expect(none.status).toBe(415);
  });

  it('refuses oversized bodies', async () => {
    const res = await handleWaitlistPost(post({ email: 'a@example.com', consent: true, pad: 'x'.repeat(10_000) }));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: 'payload_too_large' });
  });

  it('answers 503 without details when storage fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    setWaitlistAdapter({
      addOrGet: async () => {
        throw new Error('disk exploded for hidden@example.com');
      },
    });
    const res = await handleWaitlistPost(post({ email: 'hidden@example.com', consent: true }));
    expect(res.status).toBe(503);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ error: 'storage_unavailable' });
    expect(text).not.toContain('hidden');
    for (const call of consoleError.mock.calls) {
      expect(JSON.stringify(call)).not.toContain('hidden@example.com');
    }
  });
});

function fakeUpstash(options: { failWith?: number } = {}) {
  const hashes = new Map<string, Map<string, string>>();
  const counters = new Map<string, number>();
  const calls: { url: string; auth: string | null; command: string[] }[] = [];
  const hash = (key: string) => {
    let h = hashes.get(key);
    if (!h) hashes.set(key, (h = new Map()));
    return h;
  };

  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const command = JSON.parse(String(init?.body)) as string[];
    const headers = new Headers(init?.headers);
    calls.push({ url: String(input), auth: headers.get('authorization'), command });

    await Promise.resolve();
    if (options.failWith) {
      return Response.json({ error: `ERR something about ${command.join(' ')}` }, { status: options.failWith });
    }
    const [name, key, ...rest] = command;
    switch (name) {
      case 'HGET':
        return Response.json({ result: hash(key).get(rest[0]) ?? null });
      case 'HSETNX': {
        const h = hash(key);
        if (h.has(rest[0])) return Response.json({ result: 0 });
        h.set(rest[0], rest[1]);
        return Response.json({ result: 1 });
      }
      case 'HSET': {
        const h = hash(key);
        const isNew = !h.has(rest[0]);
        h.set(rest[0], rest[1]);
        return Response.json({ result: isNew ? 1 : 0 });
      }
      case 'INCR': {
        const next = (counters.get(key) ?? 0) + 1;
        counters.set(key, next);
        return Response.json({ result: next });
      }
      default:
        return Response.json({ error: `ERR unknown command '${name}'` }, { status: 400 });
    }
  }) as typeof fetch;

  return { fetch: fetchImpl, calls, hashes, counters };
}

const REST = { url: 'https://example-123.upstash.io', token: 'test-token-not-real' };

describe('regularNoForOrdinal', () => {
  it('matches walking nextRegularNo one person at a time', () => {
    let last = 0;
    for (let ordinal = 1; ordinal <= 3000; ordinal += 1) {
      last = nextRegularNo(last);
      expect(regularNoForOrdinal(ordinal), `ordinal ${ordinal}`).toBe(last);
    }
  });

  it('starts at 5, skips every number with a 4, and refuses ordinals below 1', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(regularNoForOrdinal)).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 15]);
    expect(() => regularNoForOrdinal(0)).toThrow(RangeError);
    expect(() => regularNoForOrdinal(1.5)).toThrow(RangeError);
  });
});

describe('upstash adapter', () => {
  it('gives the first person No. 5, then 6, 7, with the same shape as the file adapter', async () => {
    const redis = fakeUpstash();
    const store = createUpstashAdapter({ ...REST, fetch: redis.fetch });
    expect(await store.addOrGet(draft('a@example.com'))).toEqual({ regularNo: 5, created: true });
    expect(await store.addOrGet(draft('b@example.com'))).toEqual({ regularNo: 6, created: true });
    expect(await store.addOrGet(draft('c@example.com'))).toEqual({ regularNo: 7, created: true });
  });

  it('returns the existing number for the same email without spending a new one', async () => {
    const redis = fakeUpstash();
    const store = createUpstashAdapter({ ...REST, fetch: redis.fetch });
    await store.addOrGet(draft('a@example.com'));
    await store.addOrGet(draft('b@example.com'));
    expect(await store.addOrGet(draft('a@example.com', { source: 'other' }))).toEqual({ regularNo: 5, created: false });
    expect(redis.counters.get('dangol:waitlist:seq')).toBe(2);
    expect(redis.hashes.get('dangol:waitlist:entries')?.size).toBe(2);

    const first = JSON.parse(redis.hashes.get('dangol:waitlist:entries')?.get('5') ?? '{}') as WaitlistEntry;
    expect(first).toMatchObject({ email: 'a@example.com', regularNo: 5, source: 'test', consent: true });
  });

  it('skips numbers with a 4 (INCR counts people, not numbers)', async () => {
    const redis = fakeUpstash();
    const store = createUpstashAdapter({ ...REST, fetch: redis.fetch });
    const issued: number[] = [];
    for (let i = 0; i < 60; i += 1) issued.push((await store.addOrGet(draft(`p${i}@example.com`))).regularNo);
    expect(issued.slice(0, 10)).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 15]);
    expect(issued.some(hasFour)).toBe(false);
    expect(new Set(issued).size).toBe(60);
  });

  it('hands out unique numbers under heavy concurrent signups, and a doubled email gets one number', async () => {
    const redis = fakeUpstash();
    const store = createUpstashAdapter({ ...REST, fetch: redis.fetch });
    const jobs = Array.from({ length: 40 }, (_, i) => store.addOrGet(draft(`p${i}@example.com`)));

    jobs.push(...Array.from({ length: 5 }, () => store.addOrGet(draft('same@example.com'))));
    const results = await Promise.all(jobs);

    const people = results.slice(0, 40);
    const same = results.slice(40);
    expect(new Set(people.map((r) => r.regularNo)).size).toBe(40);
    expect(people.every((r) => r.created)).toBe(true);
    expect(new Set(same.map((r) => r.regularNo)).size).toBe(1);
    expect(same.filter((r) => r.created)).toHaveLength(1);
    expect(results.map((r) => r.regularNo).some(hasFour)).toBe(false);

    expect(redis.hashes.get('dangol:waitlist:email_no')?.size).toBe(41);
    expect(redis.hashes.get('dangol:waitlist:entries')?.size).toBe(41);
  });

  it('sends the token only as a bearer header, to the REST address, with the email only in the body', async () => {
    const redis = fakeUpstash();
    const store = createUpstashAdapter({ url: `${REST.url}/`, token: ` ${REST.token} `, fetch: redis.fetch });
    await store.addOrGet(draft('secret.person@example.com', { type: 'candle', focus: 'love' }));
    expect(redis.calls.map((c) => c.command[0])).toEqual(['HGET', 'INCR', 'HSETNX', 'HSET']);
    for (const call of redis.calls) {
      expect(call.url).toBe(REST.url);
      expect(call.auth).toBe(`Bearer ${REST.token}`);
      expect(call.url).not.toContain('secret.person');
    }
    const stored = JSON.parse(redis.calls[3].command[3]) as WaitlistEntry;
    expect(Object.keys(stored).sort()).toEqual(
      ['consent', 'createdAt', 'email', 'focus', 'regularNo', 'source', 'type'].sort(),
    );
  });

  it('reports storage_unavailable without the email or the token when Redis answers an error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const redis = fakeUpstash({ failWith: 401 });
    const store = createUpstashAdapter({ ...REST, fetch: redis.fetch });
    const failure = await store.addOrGet(draft('secret.person@example.com')).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(WaitlistError);
    expect((failure as WaitlistError).code).toBe('storage_unavailable');
    expect(String((failure as Error).message)).not.toContain('secret.person');
    expect(consoleError).toHaveBeenCalled();
    for (const call of consoleError.mock.calls) {
      const text = JSON.stringify(call);
      expect(text).not.toContain('secret.person');
      expect(text).not.toContain(REST.token);
    }
  });

  it('reports storage_unavailable when the network fails or the answer is not usable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const down = createUpstashAdapter({
      ...REST,
      fetch: (async () => {
        throw new TypeError('fetch failed for secret.person@example.com');
      }) as typeof fetch,
    });
    const networkFailure = await down.addOrGet(draft('secret.person@example.com')).catch((e: unknown) => e);
    expect(networkFailure).toMatchObject({ code: 'storage_unavailable' });
    expect(String((networkFailure as Error).message)).not.toContain('secret.person');

    const garbage = createUpstashAdapter({ ...REST, fetch: (async () => new Response('<html>', { status: 200 })) as typeof fetch });
    await expect(garbage.addOrGet(draft('a@example.com'))).rejects.toMatchObject({ code: 'storage_unavailable' });

    const weirdNumber = createUpstashAdapter({
      ...REST,
      fetch: (async () => Response.json({ result: 'not-a-number' })) as typeof fetch,
    });
    await expect(weirdNumber.addOrGet(draft('a@example.com'))).rejects.toMatchObject({ code: 'storage_unavailable' });
  });

  it('is built from the two environment variables, and only when both are usable', () => {
    expect(createUpstashAdapterFromEnv({})).toBeNull();
    expect(createUpstashAdapterFromEnv({ UPSTASH_REDIS_REST_URL: REST.url })).toBeNull();
    expect(createUpstashAdapterFromEnv({ UPSTASH_REDIS_REST_TOKEN: REST.token })).toBeNull();
    expect(createUpstashAdapterFromEnv({ UPSTASH_REDIS_REST_URL: '  ', UPSTASH_REDIS_REST_TOKEN: REST.token })).toBeNull();
    expect(createUpstashAdapterFromEnv({ UPSTASH_REDIS_REST_URL: 'not a url', UPSTASH_REDIS_REST_TOKEN: REST.token })).toBeNull();
    expect(
      createUpstashAdapterFromEnv({ UPSTASH_REDIS_REST_URL: `"${REST.url}"`, UPSTASH_REDIS_REST_TOKEN: REST.token }),
    ).not.toBeNull();
  });

  it('also accepts the names the Vercel Upstash integration creates (KV_REST_API_URL, KV_REST_API_TOKEN)', () => {
    expect(createUpstashAdapterFromEnv({ KV_REST_API_URL: REST.url, KV_REST_API_TOKEN: REST.token })).not.toBeNull();

    expect(
      createUpstashAdapterFromEnv({
        UPSTASH_REDIS_REST_URL: '',
        UPSTASH_REDIS_REST_TOKEN: '',
        KV_REST_API_URL: REST.url,
        KV_REST_API_TOKEN: REST.token,
      }),
    ).not.toBeNull();
    expect(createUpstashAdapterFromEnv({ KV_REST_API_URL: REST.url })).toBeNull();
  });
});

describe('which store runs (Vercel vs local)', () => {
  function clearStoreEnv() {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    vi.stubEnv('KV_REST_API_URL', '');
    vi.stubEnv('KV_REST_API_TOKEN', '');
    vi.stubEnv('VERCEL', '');
    vi.stubEnv('DANGOL_DATA_DIR', dir);
  }

  it('local dev (no VERCEL, no Upstash): saves to the file as before', async () => {
    clearStoreEnv();
    expect(await addToWaitlist({ email: 'Mina@Example.com', consent: true })).toEqual({ regularNo: 5 });
    expect(await readLines()).toHaveLength(1);
  });

  it('production without Upstash: no file is written and the signup is refused with not_open', async () => {
    clearStoreEnv();
    vi.stubEnv('VERCEL', '1');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = await addToWaitlist({ email: 'hidden@example.com', consent: true }).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(WaitlistError);
    expect((failure as WaitlistError).code).toBe('not_open');
    expect(String((failure as Error).message)).not.toContain('hidden');

    expect(await fs.readdir(dir)).toEqual([]);
    for (const call of consoleError.mock.calls) expect(JSON.stringify(call)).not.toContain('hidden@example.com');
  });

  it('production with only one of the two variables is still not open', async () => {
    clearStoreEnv();
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', REST.url);
    await expect(addToWaitlist({ email: 'a@example.com', consent: true })).rejects.toMatchObject({ code: 'not_open' });
    expect(await fs.readdir(dir)).toEqual([]);
  });

  it('production with bad input still answers the input error, not not_open', async () => {
    clearStoreEnv();
    vi.stubEnv('VERCEL', '1');
    await expect(addToWaitlist({ email: 'a@example.com', consent: false })).rejects.toMatchObject({
      code: 'consent_required',
    });
    await expect(addToWaitlist({ email: 'nope', consent: true })).rejects.toMatchObject({ code: 'invalid_email' });
  });

  it('with the two variables set, saves through Upstash (also on Vercel) and never touches the file', async () => {
    clearStoreEnv();
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', REST.url);
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', REST.token);
    const redis = fakeUpstash();
    vi.stubGlobal('fetch', redis.fetch);

    expect(await addToWaitlist({ email: 'Mina@Example.com', consent: true, type: 'candle' })).toEqual({ regularNo: 5 });
    expect(await addToWaitlist({ email: ' mina@example.com ', consent: true })).toEqual({ regularNo: 5 });
    expect(await addToWaitlist({ email: 'b@example.com', consent: true })).toEqual({ regularNo: 6 });
    expect(redis.hashes.get('dangol:waitlist:email_no')?.get('mina@example.com')).toBe('5');
    expect(redis.calls.every((c) => c.url === REST.url && c.auth === `Bearer ${REST.token}`)).toBe(true);
    expect(await fs.readdir(dir)).toEqual([]);
  });
});

describe('POST /api/waitlist handler without a store on production', () => {
  function post(body: unknown): Request {
    return new Request('http://localhost/api/waitlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  beforeEach(() => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('DANGOL_DATA_DIR', dir);
  });

  it('answers 503 { error: "not_open" } with no email in the body and writes nothing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await handleWaitlistPost(post({ email: 'hidden@example.com', consent: true, source: 'result:full' }));
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ error: 'not_open' });
    expect(text).not.toContain('hidden');
    expect(await fs.readdir(dir)).toEqual([]);
    for (const call of consoleError.mock.calls) expect(JSON.stringify(call)).not.toContain('hidden@example.com');
  });

  it('still answers 400 for a bad email or missing consent', async () => {
    const consent = await handleWaitlistPost(post({ email: 'hidden@example.com', consent: false }));
    expect(consent.status).toBe(400);
    expect(await consent.json()).toEqual({ error: 'consent_required' });
    const email = await handleWaitlistPost(post({ email: 'hidden-at-example', consent: true }));
    expect(email.status).toBe(400);
    expect(await email.json()).toEqual({ error: 'invalid_email' });
  });

  it('answers 200 { regularNo } once the two variables exist', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', REST.url);
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', REST.token);
    vi.stubGlobal('fetch', fakeUpstash().fetch);
    const res = await handleWaitlistPost(post({ email: 'a@example.com', consent: true }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ regularNo: 5 });
  });
});

describe('GET /api/waitlist: is the list open? (the email modal asks before it shows the email box)', () => {
  const NONE = { UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '', VERCEL: '' };

  it('isWaitlistOpen follows the same order as the store choice', () => {
    expect(isWaitlistOpen({ ...NONE })).toBe(true);
    expect(isWaitlistOpen({ ...NONE, VERCEL: '1' })).toBe(false);
    expect(isWaitlistOpen({ ...NONE, VERCEL: '1', UPSTASH_REDIS_REST_URL: REST.url })).toBe(false);
    expect(isWaitlistOpen({ ...NONE, VERCEL: '1', UPSTASH_REDIS_REST_URL: REST.url, UPSTASH_REDIS_REST_TOKEN: REST.token })).toBe(true);
    expect(isWaitlistOpen({ ...NONE, VERCEL: '1', UPSTASH_REDIS_REST_URL: 'not a url', UPSTASH_REDIS_REST_TOKEN: REST.token })).toBe(false);
  });

  it('answers { open } only: no address, no key, no cache', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', REST.url);
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', REST.token);
    vi.stubEnv('VERCEL', '1');
    const open = handleWaitlistStatus();
    expect(open.status).toBe(200);
    expect(open.headers.get('cache-control')).toBe('no-store');
    const text = await open.text();
    expect(JSON.parse(text)).toEqual({ open: true });
    expect(text).not.toContain(REST.token);
    expect(text).not.toContain('upstash');

    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    expect(await handleWaitlistStatus().json()).toEqual({ open: false });
  });

  it('a plugged-in adapter counts as open (tests, future stores)', () => {
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    setWaitlistAdapter(createFileAdapter({ dir }));
    expect(isWaitlistOpen()).toBe(true);
  });
});
