import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { exchangeCode, GOOGLE_FLOW_COOKIE, GOOGLE_FLOW_PATH, readGoogleEnv, unpackFlow } from '@/lib/account/google';
import { serverAuthEnv } from '@/lib/account/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const failed = NextResponse.redirect(new URL('/?login=failed', url.origin));
  const store = await cookies();
  const flow = unpackFlow(store.get(GOOGLE_FLOW_COOKIE)?.value);
  store.set(GOOGLE_FLOW_COOKIE, '', { path: GOOGLE_FLOW_PATH, maxAge: 0 });

  const google = readGoogleEnv();
  const env = serverAuthEnv();
  const code = url.searchParams.get('code');
  if (!google || !env || !flow || !code || url.searchParams.get('state') !== flow.state) return failed;

  const idToken = await exchangeCode(google, code, `${url.origin}/auth/google/callback`);
  if (!idToken) return failed;

  const sb = createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        for (const c of list) store.set(c.name, c.value, c.options);
      },
    },
  });
  const { error } = await sb.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce: flow.nonce });
  return error ? failed : NextResponse.redirect(new URL(flow.next, url.origin));
}
