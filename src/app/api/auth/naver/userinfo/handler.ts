import { mapNaverProfile, NAVER_USERINFO_URL } from '../../../../../lib/account/naver';
import { bearerToken } from '../../../../../lib/account/server';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function json(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function handleNaverUserinfo(request: Request, fetcher: typeof fetch = fetch): Promise<Response> {
  const token = bearerToken(request);
  if (!token) return json({ error: 'missing_token' }, 401);
  let res: Response;
  try {
    res = await fetcher(NAVER_USERINFO_URL, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  } catch {
    return json({ error: 'naver_unavailable' }, 502);
  }
  if (res.status === 401 || res.status === 403) return json({ error: 'naver_rejected' }, 401);
  if (!res.ok) return json({ error: 'naver_unavailable' }, 502);
  const claims = mapNaverProfile(await res.json().catch(() => null));
  if (!claims) return json({ error: 'naver_bad_profile' }, 502);
  return json({ ...claims }, 200);
}
