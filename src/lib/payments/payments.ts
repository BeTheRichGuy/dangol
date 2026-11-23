import { createHash } from 'node:crypto';
import { cleanQuestion } from '../rooms/prompt';
import type { RoomPayload } from '../rooms/payload';
import { ROOMS, type ProductKey } from '../rooms/themes';
import type { Locale } from '@/content/locale';
import { BUNDLE_ROOM } from './bundle';
import { dodoLocales, type DodoServerConfig } from './dodo';
import { PICK_ROOM } from './offers';
import type { Currency } from './prices';
import type { TossServerConfig } from './toss';
import type { XMAS_ROOM } from '../xmas/product';

export { PRICES, type Currency } from './prices';

export type PaymentMode = 'off' | 'test' | 'paddle' | 'toss' | 'dodo' | 'skip';

export interface PaymentEnv {
  DANGOL_PAYMENTS?: string;

  NODE_ENV?: string;

  PAYMENT_SECRET?: string;

  PADDLE_API_KEY?: string;

  PADDLE_PRICE_ID?: string;

  NEXT_PUBLIC_PADDLE_ENV?: string;

  TOSS_SECRET_KEY?: string;

  NEXT_PUBLIC_TOSS_CLIENT_KEY?: string;

  DODO_PAYMENTS_API_KEY?: string;

  DODO_PAYMENTS_ENV?: string;

  DODO_PRODUCT_ID_USD?: string;
  DODO_PRODUCT_ID_JPY?: string;

  DODO_PRODUCT_ID_USD_BUNDLE?: string;
  DODO_PRODUCT_ID_JPY_BUNDLE?: string;

  DODO_PRODUCT_ID_USD_FIRST?: string;
  DODO_PRODUCT_ID_JPY_FIRST?: string;

  DODO_PRODUCT_ID_USD_PICK?: string;
  DODO_PRODUCT_ID_JPY_PICK?: string;
  DODO_PRODUCT_ID_USD_REST?: string;
  DODO_PRODUCT_ID_JPY_REST?: string;

  DODO_PRODUCT_ID_USD_REUNION?: string;
  DODO_PRODUCT_ID_JPY_REUNION?: string;

  DODO_PRODUCT_ID_USD_XMAS?: string;
  DODO_PRODUCT_ID_JPY_XMAS?: string;
  DODO_PRODUCT_ID_USD_XMAS_LIST?: string;
  DODO_PRODUCT_ID_JPY_XMAS_LIST?: string;

  DODO_WEBHOOK_SECRET?: string;
}

export interface PaddleServerConfig {
  env: 'sandbox' | 'production';
  apiKey: string;
  priceId: string;
}

export type PaymentConfig =
  | { mode: 'off' }
  | { mode: 'skip' }
  | { mode: 'test'; secret: string }
  | { mode: 'paddle'; secret: string; paddle: PaddleServerConfig }

  | { mode: 'toss'; secret: string; toss: TossServerConfig; dodo?: DodoServerConfig }

  | { mode: 'dodo'; secret: string; dodo: DodoServerConfig }
  | { mode: 'broken' };

export function paymentConfig(env: PaymentEnv): PaymentConfig {
  const mode = env.DANGOL_PAYMENTS?.trim();
  if (mode === 'skip') return env.NODE_ENV === 'development' ? { mode: 'skip' } : { mode: 'broken' };
  if (mode !== 'test' && mode !== 'paddle' && mode !== 'toss' && mode !== 'dodo') return { mode: 'off' };
  const secret = env.PAYMENT_SECRET?.trim() ?? '';
  if (secret.length < 32) return { mode: 'broken' };
  if (mode === 'toss') {
    const secretKey = env.TOSS_SECRET_KEY?.trim() ?? '';
    const clientKey = env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim() ?? '';
    const live = secretKey.startsWith('live_sk_') && clientKey.startsWith('live_ck_');
    const test = secretKey.startsWith('test_sk_') && clientKey.startsWith('test_ck_');

    if (!live && !(test && env.NODE_ENV === 'development')) return { mode: 'broken' };
    const dodo = dodoConfig(env);
    return { mode: 'toss', secret, toss: { secretKey, clientKey }, ...(dodo ? { dodo } : {}) };
  }
  if (mode === 'dodo') {
    const dodo = dodoConfig(env);
    return dodo ? { mode: 'dodo', secret, dodo } : { mode: 'broken' };
  }

  if (mode === 'test') return env.NODE_ENV === 'development' ? { mode: 'test', secret } : { mode: 'broken' };
  const apiKey = env.PADDLE_API_KEY?.trim() ?? '';
  const priceId = env.PADDLE_PRICE_ID?.trim() ?? '';
  const paddleEnv = env.NEXT_PUBLIC_PADDLE_ENV?.trim() === 'production' ? 'production' : 'sandbox';
  if (!apiKey || !priceId.startsWith('pri_')) return { mode: 'broken' };
  return { mode: 'paddle', secret, paddle: { env: paddleEnv, apiKey, priceId } };
}

export function dodoConfig(env: PaymentEnv): DodoServerConfig | null {
  const apiKey = env.DODO_PAYMENTS_API_KEY?.trim() ?? '';
  const usd = env.DODO_PRODUCT_ID_USD?.trim() || undefined;
  const jpy = env.DODO_PRODUCT_ID_JPY?.trim() || undefined;
  const usdBundle = env.DODO_PRODUCT_ID_USD_BUNDLE?.trim() || undefined;
  const jpyBundle = env.DODO_PRODUCT_ID_JPY_BUNDLE?.trim() || undefined;
  if (!apiKey || (!usd && !jpy)) return null;
  if ((usd && !usd.startsWith('pdt_')) || (jpy && !jpy.startsWith('pdt_'))) return null;

  const bundle = {
    ...(usdBundle?.startsWith('pdt_') ? { USD: usdBundle } : {}),
    ...(jpyBundle?.startsWith('pdt_') ? { JPY: jpyBundle } : {}),
  };
  const pair = (usdId: string | undefined, jpyId: string | undefined) => ({
    ...(usdId?.trim().startsWith('pdt_') ? { USD: usdId.trim() } : {}),
    ...(jpyId?.trim().startsWith('pdt_') ? { JPY: jpyId.trim() } : {}),
  });

  const first = pair(env.DODO_PRODUCT_ID_USD_FIRST, env.DODO_PRODUCT_ID_JPY_FIRST);
  const pick = pair(env.DODO_PRODUCT_ID_USD_PICK || env.DODO_PRODUCT_ID_USD_REST, env.DODO_PRODUCT_ID_JPY_PICK || env.DODO_PRODUCT_ID_JPY_REST);
  const reunion = pair(env.DODO_PRODUCT_ID_USD_REUNION, env.DODO_PRODUCT_ID_JPY_REUNION);
  const xmas = pair(env.DODO_PRODUCT_ID_USD_XMAS, env.DODO_PRODUCT_ID_JPY_XMAS);
  const xmasList = pair(env.DODO_PRODUCT_ID_USD_XMAS_LIST, env.DODO_PRODUCT_ID_JPY_XMAS_LIST);
  const dodoEnv = env.DODO_PAYMENTS_ENV?.trim().replace(/_mode$/, '') === 'live' ? 'live' : 'test';
  if (dodoEnv === 'test' && env.NODE_ENV !== 'development') return null;
  const webhookSecret = env.DODO_WEBHOOK_SECRET?.trim();
  return {
    env: dodoEnv,
    apiKey,
    products: { ...(usd ? { USD: usd } : {}), ...(jpy ? { JPY: jpy } : {}) },
    ...(Object.keys(bundle).length ? { bundleProducts: bundle } : {}),
    ...(Object.keys(first).length ? { firstProducts: first } : {}),
    ...(Object.keys(pick).length ? { pickProducts: pick } : {}),
    ...(Object.keys(reunion).length ? { reunionProducts: reunion } : {}),
    ...(Object.keys(xmas).length ? { xmasProducts: xmas } : {}),
    ...(Object.keys(xmasList).length ? { xmasListProducts: xmasList } : {}),
    ...(webhookSecret ? { webhookSecret } : {}),
  };
}

export function payLocales(cfg: PaymentConfig): Locale[] {
  switch (cfg.mode) {
    case 'toss':
      return ['ko', ...(cfg.dodo ? (dodoLocales(cfg.dodo) as Locale[]) : [])];
    case 'dodo':
      return dodoLocales(cfg.dodo) as Locale[];
    case 'off':
    case 'broken':
      return [];
    default:
      return ['en', 'ko', 'ja'];
  }
}

export interface PaymentProvider {
  id: 'test';
  confirm(order: { orderId: string; amount: number; currency: Currency }): Promise<boolean>;
}

export const testProvider: PaymentProvider = {
  id: 'test',
  confirm: async () => true,
};

export interface Receipt {
  v: 1;

  order: string;
  provider: 'test' | 'paddle' | 'toss' | 'dodo';

  room: ProductKey | typeof BUNDLE_ROOM | typeof PICK_ROOM | typeof XMAS_ROOM;

  picks?: readonly ProductKey[];

  key: string;

  uid: string | null;

  amount: number;
  currency: string;

  exp: number;
}

export const RECEIPT_TTL_MS = 2 * 60 * 60 * 1000;

export function paidKey(p: RoomPayload): string {
  const partner = ROOMS[p.room].needsPartner && p.partner ? [p.partner.kind, p.partner.chart] : null;

  const parts: unknown[] = [p.room, p.locale, p.self, partner, cleanQuestion(p.question)];
  if (p.room === 'reunion') parts.push(p.reunion ?? null);

  if (p.edition === 'xmas') {
    const xmas: unknown[] = ['xmas', p.xmas ?? null, p.partner ? [p.partner.kind, p.partner.chart] : null];
    if (p.quiz) xmas.push(p.quiz);
    parts.push(xmas);
  }
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}

export function bundleKey(p: RoomPayload): string {
  return createHash('sha256').update(JSON.stringify([BUNDLE_ROOM, p.locale, p.self])).digest('hex');
}

export function pickKey(p: RoomPayload, picks: readonly ProductKey[]): string {
  return createHash('sha256').update(JSON.stringify([PICK_ROOM, p.locale, p.self, picks])).digest('hex');
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(text: string): Uint8Array<ArrayBuffer> {
  const s = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function hmacB64url(secret: string, text: string): Promise<string> {
  return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(text))));
}

export async function signReceipt(receipt: Receipt, secret: string): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(receipt)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

export async function verifyReceipt(token: string | null, secret: string, now: number): Promise<Receipt | null> {
  if (!token) return null;
  const [body, sig, extra] = token.split('.');
  if (!body || !sig || extra !== undefined) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const r = JSON.parse(new TextDecoder().decode(fromB64url(body))) as Receipt;
    if (r.v !== 1 || typeof r.exp !== 'number' || r.exp <= now) return null;
    return r;
  } catch {
    return null;
  }
}

export function newOrderId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return `ord_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}
