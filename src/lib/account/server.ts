import { createClient } from '@supabase/supabase-js';
import { readAuthEnv, type AuthEnv } from './config';

export function serverAuthEnv(env: Record<string, string | undefined> = process.env): AuthEnv | null {
  return readAuthEnv({
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function bearerToken(request: Request): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') ?? '');
  return m ? m[1] : null;
}

export async function accessTokenUser(env: AuthEnv, token: string): Promise<string | null> {
  try {
    const sb = createClient(env.url, env.key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.auth.getUser(token);
    return !error && data.user ? data.user.id : null;
  } catch {
    return null;
  }
}
