import { serverAuthEnv } from '../../../lib/account/server';
import { cleanEvent, type EventRow } from '../../../lib/analytics/events';
import { readBodyText } from '../waitlist/handler';

const MAX_BYTES = 8 * 1024;
const MAX_EVENTS = 20;

type Env = Record<string, string | undefined>;

export async function recordEvents(
  env: Env,
  rows: (EventRow & { country?: string | null })[],
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const auth = serverAuthEnv(env);
  if (!auth || rows.length === 0) return;
  try {
    await fetcher(`${auth.url.replace(/\/+$/, '')}/rest/v1/events`, {
      method: 'POST',
      headers: {
        apikey: auth.key,
        Authorization: `Bearer ${auth.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(rows),
    });
  } catch {

  }
}

export async function handleEventsPost(request: Request, deps: { env: Env; fetcher?: typeof fetch }): Promise<Response> {
  const done = new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  let text: string | null;
  try {
    text = await readBodyText(request, MAX_BYTES);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (text === null) return new Response(null, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const list = body && typeof body === 'object' && Array.isArray((body as { events?: unknown }).events) ? (body as { events: unknown[] }).events : [];
  const country = (request.headers.get('x-vercel-ip-country') ?? '').toUpperCase();
  const rows = list
    .slice(0, MAX_EVENTS)
    .map(cleanEvent)
    .filter((e): e is EventRow => e !== null)
    .map((e) => ({ ...e, country: /^[A-Z]{2}$/.test(country) ? country : null }));
  await recordEvents(deps.env, rows, deps.fetcher);
  return done;
}
