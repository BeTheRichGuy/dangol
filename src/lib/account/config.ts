import type { Locale } from '@/content/locale';

export type AuthMethod = 'kakao' | 'naver' | 'google' | 'line' | 'email';

export const AUTH_METHODS: readonly AuthMethod[] = ['kakao', 'naver', 'google', 'line', 'email'];

export const SUPABASE_PROVIDER: Record<Exclude<AuthMethod, 'email'>, 'google' | 'kakao' | `custom:${string}`> = {
  google: 'google',
  kakao: 'kakao',
  naver: 'custom:naver',
  line: 'custom:line',
};

export const METHOD_ORDER: Record<Locale, readonly AuthMethod[]> = {
  ko: ['kakao', 'naver', 'google', 'line', 'email'],
  ja: ['line', 'google', 'kakao', 'naver', 'email'],
  en: ['google', 'line', 'kakao', 'naver', 'email'],
};

export interface AuthEnv {
  url: string;

  key: string;
}

export function readAuthEnv(env: { url?: string; key?: string }): AuthEnv | null {
  const url = env.url?.trim();
  const key = env.key?.trim();
  if (!url || !key) return null;
  if (!/^https:\/\/[^/]+/.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url)) return null;
  return { url: url.replace(/\/+$/, ''), key };
}

export function enabledMethods(list: string | undefined): AuthMethod[] {
  const wanted = (list ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (wanted.length === 0) return [...AUTH_METHODS];
  return AUTH_METHODS.filter((m) => wanted.includes(m));
}

export function methodsFor(locale: Locale, enabled: readonly AuthMethod[]): AuthMethod[] {
  return METHOD_ORDER[locale].filter((m) => enabled.includes(m));
}

export function safeNext(next: string | null | undefined, fallback = '/home'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;

  if (/[\u0000-\u001f\u007f\\]/.test(next)) return fallback;

  const probe = 'https://same.invalid';
  const url = new URL(next, probe);
  if (url.origin !== probe) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function methodOf(provider: string | null): AuthMethod | null {
  const m = (provider ?? '').replace(/^(preview|custom):/, '');
  return (AUTH_METHODS as readonly string[]).includes(m) ? (m as AuthMethod) : null;
}

export type AuthMode = 'supabase' | 'preview' | 'off';

export function authMode(env: AuthEnv | null, hostname: string | null): AuthMode {
  if (env) return 'supabase';
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return 'preview';
  return 'off';
}
