import { NextResponse, type NextRequest } from 'next/server';
import { COUNTRY_COOKIE } from '@/content/locale';

export function proxy(request: NextRequest) {
  const res = NextResponse.next();
  const country = (request.headers.get('x-vercel-ip-country') ?? '').toUpperCase();
  if (/^[A-Z]{2}$/.test(country) && request.cookies.get(COUNTRY_COOKIE)?.value !== country) {
    res.cookies.set(COUNTRY_COOKIE, country, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',

      httpOnly: false,
    });
  }
  return res;
}

export const config = {

  matcher: ['/((?!api|_next/static|_next/image|media|.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico|mp4|webm|woff2?|ttf|txt|xml|json)$).*)'],
};
