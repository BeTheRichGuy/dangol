import { createServerClient } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { safeNext } from '@/lib/account/config';
import { serverAuthEnv } from '@/lib/account/server';

const EMAIL_TYPES = new Set(['email', 'magiclink', 'signup']);

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get('next'));
  const failed = NextResponse.redirect(new URL('/?login=failed', url.origin));
  const env = serverAuthEnv();
  if (!env) return failed;

  const store = await cookies();
  const sb = createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        for (const c of list) store.set(c.name, c.value, c.options);
      },
    },
  });

  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  let ok = false;
  if (code) {
    ok = !(await sb.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type && EMAIL_TYPES.has(type)) {
    ok = !(await sb.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType })).error;
  }
  return ok ? NextResponse.redirect(new URL(next, url.origin)) : failed;
}
