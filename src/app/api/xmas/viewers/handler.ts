import { LOCALES, type Locale } from '@/content/locale';
import { adminJson, callAdminRpc, type AdminTrafficDeps } from '../../admin/traffic/handler';

const CACHE = { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } as const;

export async function handleXmasViewers(request: Request, deps: AdminTrafficDeps): Promise<Response> {
  const locale = new URL(request.url).searchParams.get('locale');
  if (!(LOCALES as readonly unknown[]).includes(locale)) return adminJson({ error: 'invalid_locale' }, 400);
  const got = await callAdminRpc('xmas_viewers', { p_locale: locale as Locale }, deps);
  if ('error' in got) return got.error;
  const count = Number(got.value);
  if (!Number.isInteger(count) || count < 0) return adminJson({ error: 'report_failed' }, 502);
  return Response.json({ count }, { status: 200, headers: CACHE });
}
