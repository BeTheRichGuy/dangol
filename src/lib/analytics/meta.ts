import type { EventName, PropValue } from './events';

export function isMetaArrival(search: string, savedUtmSource?: string | null): boolean {
  const q = new URLSearchParams(search);
  if (q.get('fbclid')) return true;
  return (q.get('utm_source') ?? savedUtmSource ?? '').trim().toLowerCase() === 'meta';
}

export function fbcFromClickId(fbclid: string | null, now: number): string | null {
  const id = fbclid?.trim();
  if (!id || !/^[\w-]{10,500}$/.test(id)) return null;
  return `fb.1.${now}.${id}`;
}

export function metaCookieIds(cookie: string): { fbp?: string; fbc?: string } {
  const out: { fbp?: string; fbc?: string } = {};
  for (const part of cookie.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    const v = cleanMetaId(rest.join('='));
    if (!v) continue;
    if (k === '_fbp') out.fbp = v;
    if (k === '_fbc') out.fbc = v;
  }
  return out;
}

export function cleanMetaId(v: unknown): string | null {
  return typeof v === 'string' && /^fb\.\d\.\d{10,16}\.[\w-]{1,500}$/.test(v) ? v : null;
}

export type MetaStd = 'ViewContent' | 'Lead' | 'InitiateCheckout' | 'AddPaymentInfo';
export type MetaCall = { kind: 'track'; event: MetaStd; params: Record<string, string> } | { kind: 'trackCustom'; event: 'FreeResult'; params: Record<string, string> };

export function metaCallFor(name: EventName, room: string | null, props: Record<string, PropValue>): MetaCall | null {
  const product = props.xmas ? 'xmas' : props.bundle ? 'bundle' : props.pick ? 'pick' : (room ?? 'free');
  switch (name) {
    case 'xmas_view':
      return { kind: 'track', event: 'ViewContent', params: { content_name: 'xmas' } };
    case 'room_view':
      return { kind: 'track', event: 'ViewContent', params: { content_name: room ?? 'room' } };
    case 'birth_done':
      return { kind: 'track', event: 'Lead', params: { content_name: 'free' } };
    case 'result_view':
      return { kind: 'trackCustom', event: 'FreeResult', params: { content_name: 'free' } };
    case 'xmas_result':
      return { kind: 'trackCustom', event: 'FreeResult', params: { content_name: 'xmas' } };
    case 'reunion_result':
      return { kind: 'trackCustom', event: 'FreeResult', params: { content_name: 'reunion' } };
    case 'checkout_open':
      return { kind: 'track', event: 'InitiateCheckout', params: { content_name: product } };
    case 'pay_start':
      return { kind: 'track', event: 'AddPaymentInfo', params: { content_name: product } };
    default:
      return null;
  }
}

export function metaValue(amount: number, currency: string): number {
  const c = currency.toUpperCase();
  return c === 'KRW' || c === 'JPY' ? amount : Math.round(amount) / 100;
}

export type InApp = 'instagram' | 'facebook' | 'threads' | 'kakaotalk' | 'line' | 'naver';
export function inAppBrowser(ua: string): InApp | null {
  if (/\bInstagram\b/i.test(ua)) return 'instagram';
  if (/\bBarcelona\b/i.test(ua)) return 'threads';
  if (/FBAN|FBAV|FB_IAB|FBIOS/.test(ua)) return 'facebook';
  if (/KAKAOTALK/i.test(ua)) return 'kakaotalk';
  if (/\bLine\//.test(ua)) return 'line';
  if (/NAVER\(inapp/i.test(ua)) return 'naver';
  return null;
}

export function isMetaInApp(ua: string): boolean {
  const k = inAppBrowser(ua);
  return k === 'instagram' || k === 'facebook' || k === 'threads';
}

export function chromeIntentUrl(href: string): string | null {
  try {
    const u = new URL(href);
    if (u.protocol !== 'https:') return null;
    return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=com.android.chrome;end`;
  } catch {
    return null;
  }
}
