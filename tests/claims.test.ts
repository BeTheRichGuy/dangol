import { describe, expect, it } from 'vitest';
import { claimReading, MAX_READINGS_PER_ORDER } from '@/lib/payments/claims';

const ENV = { NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' };

describe('claimReading (Supabase RPC claim_reading)', () => {
  it('RPC 를 공개 키로 부르고 횟수를 돌려준다', async () => {
    let seen: { url: string; body: unknown; key: string | null } | null = null;
    const f = (async (url: string, init?: RequestInit) => {
      seen = { url, body: JSON.parse(String(init?.body)), key: new Headers(init?.headers).get('apikey') };
      return Response.json(2);
    }) as typeof fetch;
    expect(await claimReading(ENV, 'dg_abc', f)).toBe(2);
    expect(seen).toEqual({ url: 'https://x.supabase.co/rest/v1/rpc/claim_reading', body: { p_order: 'dg_abc' }, key: 'sb_publishable_x' });
    expect(MAX_READINGS_PER_ORDER).toBe(4);
  });

  it('설정이 없거나, 함수가 없거나(404), 이상한 답이면 null', async () => {
    expect(await claimReading({}, 'dg_abc')).toBeNull();
    expect(await claimReading(ENV, 'dg_abc', (async () => new Response('{}', { status: 404 })) as typeof fetch)).toBeNull();
    expect(await claimReading(ENV, 'dg_abc', (async () => Response.json('x')) as typeof fetch)).toBeNull();
    expect(await claimReading(ENV, 'dg_abc', (async () => { throw new Error('down'); }) as typeof fetch)).toBeNull();
  });
});
