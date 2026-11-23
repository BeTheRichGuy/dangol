import { cleanMetaId, metaValue } from './meta';

export interface MetaPurchase {
  orderId: string;

  amount: number;
  currency: string;

  product: string;
  fbp?: unknown;
  fbc?: unknown;
}

const GRAPH = 'https://graph.facebook.com/v26.0';

export function metaPurchaseBody(
  env: Record<string, string | undefined>,
  p: MetaPurchase,
  ctx: { userAgent: string | null; now: number; siteUrl: string },
): { url: string; body: string } | null {
  const pixel = env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const token = env.META_CAPI_TOKEN?.trim();
  if (!pixel || !/^\d{6,20}$/.test(pixel) || !token) return null;
  const fbp = cleanMetaId(p.fbp);
  const fbc = cleanMetaId(p.fbc);
  if (!fbp && !fbc) return null;
  if (!p.orderId || !Number.isFinite(p.amount) || p.amount <= 0 || !/^[A-Za-z]{3}$/.test(p.currency)) return null;
  const event = {
    event_name: 'Purchase',
    event_time: Math.floor(ctx.now / 1000),
    event_id: p.orderId.slice(0, 100),
    action_source: 'website',
    event_source_url: `${ctx.siteUrl}/room`,
    user_data: { ...(fbp ? { fbp } : {}), ...(fbc ? { fbc } : {}), ...(ctx.userAgent ? { client_user_agent: ctx.userAgent.slice(0, 400) } : {}) },
    custom_data: { value: metaValue(p.amount, p.currency), currency: p.currency.toUpperCase(), content_name: p.product.slice(0, 20) },
  };
  const test = env.META_TEST_EVENT_CODE?.trim();
  return {
    url: `${GRAPH}/${pixel}/events?access_token=${encodeURIComponent(token)}`,
    body: JSON.stringify({ data: [event], ...(test ? { test_event_code: test } : {}) }),
  };
}

export async function sendMetaPurchase(
  env: Record<string, string | undefined>,
  p: MetaPurchase,
  ctx: { userAgent: string | null; now?: number; siteUrl?: string },
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  const req = metaPurchaseBody(env, p, { userAgent: ctx.userAgent, now: ctx.now ?? Date.now(), siteUrl: ctx.siteUrl ?? 'https://dangolsaju.app' });
  if (!req) return false;
  try {
    const res = await fetcher(req.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: req.body });
    if (!res.ok) console.warn('[meta-capi] purchase not accepted', res.status);
    return res.ok;
  } catch {
    console.warn('[meta-capi] purchase send failed');
    return false;
  }
}
