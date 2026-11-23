import { bearerToken } from '../../../lib/account/server';
import { ledgerConfig, rpc } from '../../../lib/payments/ledger';
import { cleanReadingId, cleanReview, reviewLanterns } from '../../../lib/reviews/review';
import { readBodyText } from '../waitlist/handler';

const MAX_BYTES = 2 * 1024;

type Env = Record<string, string | undefined>;

export interface ReviewsDeps {
  env: Env;
  fetcher?: typeof fetch;

  verifyUser?: (token: string) => Promise<string | null>;
}

const noStore = { 'Cache-Control': 'no-store' };
const json = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers: { ...noStore, 'Content-Type': 'application/json' } });
const int = (v: unknown): number | null => (typeof v === 'number' && Number.isInteger(v) ? v : null);

export async function handleReviewsPost(request: Request, deps: ReviewsDeps): Promise<Response> {
  let text: string | null;
  try {
    text = await readBodyText(request, MAX_BYTES);
  } catch {
    return json(400, { error: 'bad_request' });
  }
  if (text === null) return json(413, { error: 'too_large' });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json(400, { error: 'bad_request' });
  }
  const review = cleanReview(body);
  if (!review) return json(400, { error: 'invalid' });
  const reading = cleanReadingId((body as { reading?: unknown }).reading);

  const cfg = ledgerConfig(deps.env);
  if (!cfg) return json(503, { error: 'not_open' });

  const token = bearerToken(request);
  const uid = reading && token && deps.verifyUser ? await deps.verifyUser(token) : null;
  const country = (request.headers.get('x-vercel-ip-country') ?? '').toUpperCase();

  const r = await rpc(
    cfg,
    'review_submit',
    {
      p_uid: uid,
      p_reading: uid ? reading : null,
      p_room: review.room,
      p_locale: review.locale,
      p_rating: review.rating,
      p_body: review.body,
      p_country: /^[A-Z]{2}$/.test(country) ? country : null,

      p_n: uid ? reviewLanterns(review.room, (body as { edition?: unknown }).edition) : 0,
    },
    deps.fetcher,
  );

  if (!r.ok || !r.value || typeof r.value !== 'object') return json(502, { error: 'store' });
  const v = r.value as Record<string, unknown>;
  const reason = typeof v.reason === 'string' ? v.reason : null;
  return json(200, { saved: v.saved === true, granted: int(v.granted) ?? 0, balance: int(v.balance), reason });
}
