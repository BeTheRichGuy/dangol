import { bearerToken } from '../../../lib/account/server';
import type { Lanterns } from '../../../lib/chat/lanterns';
import { CHECKIN_REWARD, MAX_TOKENS_PER_PLAY } from '../../../lib/chat/tokens';
import { paymentConfig, verifyReceipt, type PaymentEnv } from '../../../lib/payments/payments';
import { readBodyText } from '../waitlist/handler';
import { RECEIPT_HEADER } from '../reading/handler';

export interface LanternEnv extends PaymentEnv {
  NODE_ENV?: string;
}

export interface LanternDeps {
  env: LanternEnv;

  lanterns?: Lanterns;
  verifyUser?: (token: string) => Promise<string | null>;
  now?: () => number;
}

const NO_STORE = { 'Cache-Control': 'no-store' } as const;
const MAX_BODY = 1024;

function json(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

async function loginUid(request: Request, deps: LanternDeps): Promise<{ uid: string } | { res: Response }> {
  const token = bearerToken(request);
  const uid = deps.verifyUser && token ? await deps.verifyUser(token) : null;
  return uid ? { uid } : { res: json({ error: 'login_required' }, 401) };
}

export async function handleLanternGet(request: Request, deps: LanternDeps): Promise<Response> {
  if (!deps.lanterns) return json({ error: 'not_open' }, 503);
  const who = await loginUid(request, deps);
  if ('res' in who) return who.res;
  const s = await deps.lanterns.balance(who.uid);
  return s === null ? json({ error: 'api' }, 502) : json({ balance: s.balance, checkedIn: s.checkedIn }, 200);
}

export async function handleLanternCheckin(request: Request, deps: LanternDeps): Promise<Response> {
  if (!deps.lanterns) return json({ error: 'not_open' }, 503);
  const who = await loginUid(request, deps);
  if ('res' in who) return who.res;
  const r = await deps.lanterns.checkin(who.uid, CHECKIN_REWARD);
  return r ? json({ granted: r.granted, balance: r.balance }, 200) : json({ error: 'api' }, 502);
}

export async function handleLanternEarn(request: Request, deps: LanternDeps): Promise<Response> {
  if (!deps.lanterns) return json({ error: 'not_open' }, 503);
  const who = await loginUid(request, deps);
  if ('res' in who) return who.res;
  const { uid } = who;

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) return json({ error: 'unsupported_media_type' }, 415);
  let text: string | null;
  try {
    text = await readBodyText(request, MAX_BODY);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (text === null) return json({ error: 'payload_too_large' }, 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const lit = typeof body === 'object' && body !== null ? (body as { lit?: unknown }).lit : undefined;
  if (typeof lit !== 'number' || !Number.isInteger(lit) || lit < 0 || lit > MAX_TOKENS_PER_PLAY) return json({ error: 'invalid_body' }, 400);

  const pay = paymentConfig(deps.env);
  let order: string;
  let paid: boolean;
  if (pay.mode === 'test' || pay.mode === 'paddle' || pay.mode === 'toss' || pay.mode === 'dodo') {
    const receipt = await verifyReceipt(request.headers.get(RECEIPT_HEADER), pay.secret, (deps.now ?? Date.now)());

    if (!receipt || receipt.uid !== uid || receipt.room === 'bundle') return json({ error: 'payment_required' }, 402);
    order = receipt.order;

    paid = receipt.provider !== 'test';
  } else if (deps.env.NODE_ENV === 'development' && (pay.mode === 'skip' || pay.mode === 'off')) {
    order = `dev:${uid}`;
    paid = false;
  } else {
    return json({ error: 'payment_required' }, 402);
  }

  const r = await deps.lanterns.earn(uid, order, lit, paid);
  return r ? json({ granted: r.granted, balance: r.balance }, 200) : json({ error: 'api' }, 502);
}
