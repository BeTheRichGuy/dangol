import { safeNext } from './config';

export interface GoogleEnv {
  clientId: string;
  clientSecret: string;
}

export function readGoogleEnv(env: Record<string, string | undefined> = process.env): GoogleEnv | null {
  const clientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export const GOOGLE_FLOW_COOKIE = 'dg_google_flow';
export const GOOGLE_FLOW_PATH = '/auth/google';

export interface GoogleFlow {
  state: string;

  nonce: string;
  next: string;
}

export function packFlow(flow: GoogleFlow): string {
  return JSON.stringify(flow);
}

export function unpackFlow(raw: string | undefined): GoogleFlow | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<GoogleFlow>;
    if (typeof v.state !== 'string' || typeof v.nonce !== 'string' || v.state.length < 16 || v.nonce.length < 16) return null;
    return { state: v.state, nonce: v.nonce, next: safeNext(typeof v.next === 'string' ? v.next : null) };
  } catch {
    return null;
  }
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function googleAuthUrl(o: { clientId: string; redirectUri: string; state: string; nonceHash: string }): string {
  const q = new URLSearchParams({
    client_id: o.clientId,
    redirect_uri: o.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: o.state,
    nonce: o.nonceHash,
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

export async function exchangeCode(env: GoogleEnv, code: string, redirectUri: string, fetcher: typeof fetch = fetch): Promise<string | null> {
  try {
    const res = await fetcher('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.clientId,
        client_secret: env.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { id_token?: unknown };
    return typeof body.id_token === 'string' ? body.id_token : null;
  } catch {
    return null;
  }
}
