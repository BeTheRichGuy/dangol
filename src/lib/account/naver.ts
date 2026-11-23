export const NAVER_USERINFO_URL = 'https://openapi.naver.com/v1/nid/me';

export interface StandardClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export function mapNaverProfile(body: unknown): StandardClaims | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (b.resultcode !== '00') return null;
  const r = b.response as Record<string, unknown> | undefined;
  if (!r || typeof r.id !== 'string' || !r.id) return null;
  const out: StandardClaims = { sub: r.id };
  if (typeof r.email === 'string' && r.email.includes('@')) {
    out.email = r.email;

    out.email_verified = true;
  }
  const name = typeof r.name === 'string' && r.name ? r.name : typeof r.nickname === 'string' ? r.nickname : '';
  if (name) out.name = name;
  if (typeof r.profile_image === 'string' && r.profile_image.startsWith('https://')) out.picture = r.profile_image;
  return out;
}
