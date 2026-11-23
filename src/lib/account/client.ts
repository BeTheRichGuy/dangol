import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { enabledMethods, readAuthEnv } from './config';

export const AUTH_ENV = readAuthEnv({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export const ENABLED_METHODS = enabledMethods(process.env.NEXT_PUBLIC_AUTH_METHODS);

export const GOOGLE_DIRECT = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim());

let client: SupabaseClient | null = null;

export function browserClient(): SupabaseClient | null {
  if (!AUTH_ENV) return null;
  client ??= createBrowserClient(AUTH_ENV.url, AUTH_ENV.key);
  return client;
}
