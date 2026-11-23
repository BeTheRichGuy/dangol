import { hmacB64url } from './payments';

export interface DodoServerConfig {

  env: 'test' | 'live';

  apiKey: string;

  products: { USD?: string; JPY?: string };

  bundleProducts?: { USD?: string; JPY?: string };

  firstProducts?: { USD?: string; JPY?: string };

  pickProducts?: { USD?: string; JPY?: string };

  reunionProducts?: { USD?: string; JPY?: string };

  xmasProducts?: { USD?: string; JPY?: string };

  xmasListProducts?: { USD?: string; JPY?: string };

  webhookSecret?: string;
}

export function dodoProduct(cfg: DodoServerConfig, locale: string): string | null {
  if (locale === 'en') return cfg.products.USD ?? null;
  if (locale === 'ja') return cfg.products.JPY ?? null;
  return null;
}

export function dodoBundleProduct(cfg: DodoServerConfig, locale: string): string | null {
  if (locale === 'en') return cfg.bundleProducts?.USD ?? null;
  if (locale === 'ja') return cfg.bundleProducts?.JPY ?? null;
  return null;
}

export function dodoFirstProduct(cfg: DodoServerConfig, locale: string): string | null {
  if (locale === 'en') return cfg.firstProducts?.USD ?? null;
  if (locale === 'ja') return cfg.firstProducts?.JPY ?? null;
  return null;
}

export function dodoPickProduct(cfg: DodoServerConfig, locale: string): string | null {
  if (locale === 'en') return cfg.pickProducts?.USD ?? null;
  if (locale === 'ja') return cfg.pickProducts?.JPY ?? null;
  return null;
}

export function dodoReunionProduct(cfg: DodoServerConfig, locale: string): string | null {
  if (locale === 'en') return cfg.reunionProducts?.USD ?? null;
  if (locale === 'ja') return cfg.reunionProducts?.JPY ?? null;
  return null;
}

export function dodoXmasProduct(cfg: DodoServerConfig, locale: string, deal: boolean): string | null {
  const ids = deal ? cfg.xmasProducts : cfg.xmasListProducts;
  if (locale === 'en') return ids?.USD ?? null;
  if (locale === 'ja') return ids?.JPY ?? null;
  return null;
}

export function dodoLocales(cfg: DodoServerConfig): string[] {
  return (['en', 'ja'] as const).filter((l) => dodoProduct(cfg, l) !== null);
}

const base = (cfg: DodoServerConfig) => (cfg.env === 'live' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com');
const headers = (cfg: DodoServerConfig) => ({ Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' });

interface OrderTie {
  room: string;
  key: string;
  uid: string | null;

  first?: boolean;

  xmasDeal?: boolean;
}

const tie = (rand: string, t: OrderTie) => `dodo|${rand}|${t.room}|${t.key}|${t.uid ?? ''}${t.first ? '|first' : ''}${t.xmasDeal ? '|xmas-deal' : ''}`;

export async function dodoOrderId(secret: string, t: OrderTie): Promise<string> {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');
  return `dd_${rand}_${(await hmacB64url(secret, tie(rand, t))).slice(0, 22)}`;
}

export async function verifyDodoOrderId(secret: string, orderId: string, t: OrderTie): Promise<boolean> {
  const m = /^dd_([0-9a-f]{16})_([A-Za-z0-9_-]{22})$/.exec(orderId);
  if (!m) return false;
  return (await hmacB64url(secret, tie(m[1], t))).slice(0, 22) === m[2];
}

export function isDodoCheckoutUrl(url: string): boolean {
  return /^https:\/\/([a-z0-9-]+\.)*dodopayments\.com(\/|$)/i.test(url);
}

export async function createDodoCheckout(
  cfg: DodoServerConfig,
  args: { productId: string; orderId: string; room: string; locale: string; returnUrl: string; cancelUrl: string },
  fetcher: typeof fetch = fetch,
): Promise<{ ok: true; url: string; sessionId: string | null } | { ok: false; code: string }> {
  try {
    const res = await fetcher(`${base(cfg)}/checkouts`, {
      method: 'POST',
      headers: headers(cfg),
      body: JSON.stringify({
        product_cart: [{ product_id: args.productId, quantity: 1 }],
        return_url: args.returnUrl,
        cancel_url: args.cancelUrl,

        metadata: { order_id: args.orderId, room: args.room, locale: args.locale },
        feature_flags: {

          allow_phone_number_collection: false,
          redirect_immediately: true,
        },
      }),
    });
    const v: unknown = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, code: `http_${res.status}` };
    const o = (v && typeof v === 'object' ? v : {}) as { checkout_url?: unknown; session_id?: unknown };

    if (typeof o.checkout_url !== 'string' || !isDodoCheckoutUrl(o.checkout_url)) return { ok: false, code: 'invalid' };
    return { ok: true, url: o.checkout_url, sessionId: typeof o.session_id === 'string' ? o.session_id : null };
  } catch {
    return { ok: false, code: 'network' };
  }
}

export interface DodoPayment {
  paymentId: string;

  status: string;

  totalAmount: number;
  currency: string;

  orderId: string | null;
  productIds: string[];

  refundStatus: string | null;

  createdAt: string | null;
}

function readPayment(v: unknown): DodoPayment | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as Record<string, unknown>;
  if (typeof p.payment_id !== 'string' || typeof p.total_amount !== 'number' || typeof p.currency !== 'string') return null;
  const meta = p.metadata && typeof p.metadata === 'object' ? (p.metadata as Record<string, unknown>) : {};
  const cart = Array.isArray(p.product_cart) ? p.product_cart : [];
  return {
    paymentId: p.payment_id,
    status: typeof p.status === 'string' ? p.status : 'unknown',
    totalAmount: p.total_amount,
    currency: p.currency,
    orderId: typeof meta.order_id === 'string' ? meta.order_id : null,
    productIds: cart.map((c) => (c && typeof c === 'object' ? (c as { product_id?: unknown }).product_id : null)).filter((x): x is string => typeof x === 'string'),
    refundStatus: typeof p.refund_status === 'string' ? p.refund_status : null,
    createdAt: typeof p.created_at === 'string' ? p.created_at : null,
  };
}

export async function fetchDodoPayment(
  cfg: DodoServerConfig,
  paymentId: string,
  fetcher: typeof fetch = fetch,
): Promise<{ ok: true; payment: DodoPayment } | { ok: false; code: string }> {
  if (!/^pay_[A-Za-z0-9_-]{4,120}$/.test(paymentId)) return { ok: false, code: 'invalid' };
  try {
    const res = await fetcher(`${base(cfg)}/payments/${encodeURIComponent(paymentId)}`, { headers: headers(cfg) });
    if (res.status === 404) return { ok: false, code: 'not_found' };
    if (!res.ok) return { ok: false, code: `http_${res.status}` };
    const payment = readPayment(await res.json().catch(() => null));
    return payment ? { ok: true, payment } : { ok: false, code: 'invalid' };
  } catch {
    return { ok: false, code: 'network' };
  }
}

export function isOurDodoProduct(cfg: DodoServerConfig, productIds: readonly string[]): boolean {
  const ours = new Set(
    [cfg.products, cfg.bundleProducts, cfg.firstProducts, cfg.pickProducts, cfg.reunionProducts, cfg.xmasProducts, cfg.xmasListProducts]
      .flatMap((m) => (m ? [m.USD, m.JPY] : []))
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  );
  return productIds.some((id) => ours.has(id));
}

export function checkDodoPayment(p: DodoPayment, want: { orderId: string; productId: string }): boolean {
  return p.status === 'succeeded' && p.orderId === want.orderId && p.productIds.includes(want.productId) && p.refundStatus !== 'full';
}

export function dodoPending(p: DodoPayment): boolean {
  return p.status === 'processing' || p.status === 'requires_confirmation' || p.status === 'requires_capture';
}

export function orderStatusFromDodo(p: Pick<DodoPayment, 'status' | 'refundStatus'>): 'paid' | 'canceled' | 'partial_canceled' | 'failed' | null {
  if (p.status === 'succeeded') return p.refundStatus === 'full' ? 'canceled' : p.refundStatus === 'partial' ? 'partial_canceled' : 'paid';
  if (p.status === 'failed' || p.status === 'cancelled') return 'failed';
  return null;
}

const WEBHOOK_TOLERANCE_S = 5 * 60;

function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export async function verifyDodoWebhook(
  secret: string,
  h: { id: string | null; timestamp: string | null; signature: string | null },
  body: string,
  nowMs: number,
): Promise<boolean> {
  if (!h.id || !h.timestamp || !h.signature) return false;
  const ts = Number(h.timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowMs / 1000 - ts) > WEBHOOK_TOLERANCE_S) return false;
  try {
    const raw = secret.startsWith('whsec_') ? secret.slice(6) : secret;
    const key = await crypto.subtle.importKey('raw', fromB64(raw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h.id}.${h.timestamp}.${body}`)));
    let expected = '';
    for (const b of mac) expected += String.fromCharCode(b);
    expected = btoa(expected);
    return h.signature.split(' ').some((part) => {
      const [version, sig] = part.split(',');
      return version === 'v1' && sig !== undefined && sig.length === expected.length && timingSafeEqual(sig, expected);
    });
  } catch {
    return false;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  let d = 0;
  for (let i = 0; i < a.length; i += 1) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
