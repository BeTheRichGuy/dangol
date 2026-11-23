import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { safeNext } from '@/lib/account/config';
import { GOOGLE_FLOW_COOKIE, GOOGLE_FLOW_PATH, googleAuthUrl, packFlow, randomToken, readGoogleEnv, sha256Hex } from '@/lib/account/google';
import { serverAuthEnv } from '@/lib/account/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const google = readGoogleEnv();
  if (!google || !serverAuthEnv()) return NextResponse.redirect(new URL('/?login=failed', url.origin));

  const flow = { state: randomToken(), nonce: randomToken(), next: safeNext(url.searchParams.get('next')) };
  (await cookies()).set(GOOGLE_FLOW_COOKIE, packFlow(flow), {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    path: GOOGLE_FLOW_PATH,
    maxAge: 600,
  });
  const target = googleAuthUrl({
    clientId: google.clientId,
    redirectUri: `${url.origin}/auth/google/callback`,
    state: flow.state,
    nonceHash: await sha256Hex(flow.nonce),
  });
  return NextResponse.redirect(target);
}
