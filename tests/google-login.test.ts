import { describe, expect, it } from 'vitest';
import { exchangeCode, googleAuthUrl, packFlow, randomToken, readGoogleEnv, sha256Hex, unpackFlow } from '@/lib/account/google';

describe('google direct sign-in', () => {
  it('needs both the client id and the secret', () => {
    expect(readGoogleEnv({})).toBeNull();
    expect(readGoogleEnv({ NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'id' })).toBeNull();
    expect(readGoogleEnv({ GOOGLE_CLIENT_SECRET: 's' })).toBeNull();
    expect(readGoogleEnv({ NEXT_PUBLIC_GOOGLE_CLIENT_ID: ' id ', GOOGLE_CLIENT_SECRET: ' s ' })).toEqual({ clientId: 'id', clientSecret: 's' });
  });

  it('hashes the nonce as hex sha-256 (what Supabase checks)', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('makes long random tokens', () => {
    const a = randomToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(randomToken()).not.toBe(a);
  });

  it('sends Google back to our own address', () => {
    const u = new URL(googleAuthUrl({ clientId: 'cid', redirectUri: 'https://site.test/auth/google/callback', state: 'st', nonceHash: 'nh' }));
    expect(u.origin + u.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(u.searchParams)).toEqual({
      client_id: 'cid',
      redirect_uri: 'https://site.test/auth/google/callback',
      response_type: 'code',
      scope: 'openid email profile',
      state: 'st',
      nonce: 'nh',
      prompt: 'select_account',
    });
  });

  it('round-trips the flow cookie and refuses bad ones', () => {
    const flow = { state: 'a'.repeat(64), nonce: 'b'.repeat(64), next: '/room/love' };
    expect(unpackFlow(packFlow(flow))).toEqual(flow);
    expect(unpackFlow(undefined)).toBeNull();
    expect(unpackFlow('not json')).toBeNull();
    expect(unpackFlow(JSON.stringify({ state: 'short', nonce: 'b'.repeat(64) }))).toBeNull();

    expect(unpackFlow(packFlow({ ...flow, next: '//evil.test' }))?.next).toBe('/home');
  });

  it('trades the code for an id token', async () => {
    let sent: URLSearchParams | null = null;
    const fake = (async (_url: string, init?: RequestInit) => {
      sent = init?.body as URLSearchParams;
      return Response.json({ id_token: 'idt', access_token: 'x' });
    }) as typeof fetch;
    const env = { clientId: 'cid', clientSecret: 'sec' };
    expect(await exchangeCode(env, 'code1', 'https://site.test/auth/google/callback', fake)).toBe('idt');
    expect(sent!.get('grant_type')).toBe('authorization_code');
    expect(sent!.get('redirect_uri')).toBe('https://site.test/auth/google/callback');

    const refused = (async () => new Response('{}', { status: 400 })) as typeof fetch;
    expect(await exchangeCode(env, 'bad', 'https://site.test/x', refused)).toBeNull();
    const down = (async () => {
      throw new Error('offline');
    }) as typeof fetch;
    expect(await exchangeCode(env, 'c', 'https://site.test/x', down)).toBeNull();
  });
});
