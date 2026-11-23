import { describe, expect, it } from 'vitest';
import { chromeIntentUrl, cleanMetaId, fbcFromClickId, inAppBrowser, isMetaArrival, isMetaInApp, metaCallFor, metaCookieIds, metaValue } from '@/lib/analytics/meta';
import { metaPurchaseBody, sendMetaPurchase } from '@/lib/analytics/meta-capi';
import { EVENT_NAMES } from '@/lib/analytics/events';

const FBP = 'fb.1.1763251200000.1234567890';
const FBC = 'fb.1.1763251200000.IwAR3abcdefghij';
const ENV = { NEXT_PUBLIC_META_PIXEL_ID: '123456789012345', META_CAPI_TOKEN: 'tok' };

describe('isMetaArrival', () => {
  it('turns on only for a Meta ad click or our meta utm', () => {
    expect(isMetaArrival('?fbclid=IwAR3abcdefghij')).toBe(true);
    expect(isMetaArrival('?l=ko&utm_source=meta&utm_medium=paid')).toBe(true);
    expect(isMetaArrival('?l=ko', 'meta')).toBe(true);
    expect(isMetaArrival('?l=ko&utm_source=instagram&utm_medium=bio')).toBe(false);
    expect(isMetaArrival('')).toBe(false);
  });
});

describe('fbc and cookies', () => {
  it('builds _fbc from a click id and rejects junk', () => {
    expect(fbcFromClickId('IwAR3abcdefghij', 1763251200000)).toBe(FBC);
    expect(fbcFromClickId('<script>', 1)).toBeNull();
    expect(fbcFromClickId(null, 1)).toBeNull();
  });
  it('reads only well-formed _fbp and _fbc', () => {
    expect(metaCookieIds(`a=1; _fbp=${FBP}; _fbc=${FBC}; sb-x=y`)).toEqual({ fbp: FBP, fbc: FBC });
    expect(metaCookieIds('_fbp=hello; _fbc=fb.1.x.y')).toEqual({});
    expect(cleanMetaId(42)).toBeNull();
  });
});

describe('metaCallFor', () => {
  it('maps our funnel to Meta events without personal data', () => {
    expect(metaCallFor('xmas_view', null, {})).toEqual({ kind: 'track', event: 'ViewContent', params: { content_name: 'xmas' } });
    expect(metaCallFor('birth_done', null, {})).toEqual({ kind: 'track', event: 'Lead', params: { content_name: 'free' } });
    expect(metaCallFor('result_view', null, {})?.event).toBe('FreeResult');
    expect(metaCallFor('xmas_result', null, {})).toEqual({ kind: 'trackCustom', event: 'FreeResult', params: { content_name: 'xmas' } });
    expect(metaCallFor('checkout_open', 'love', { xmas: 1 })).toEqual({ kind: 'track', event: 'InitiateCheckout', params: { content_name: 'xmas' } });
    expect(metaCallFor('checkout_open', 'life', {})?.params).toEqual({ content_name: 'life' });
    expect(metaCallFor('pay_start', null, { bundle: 1 })?.event).toBe('AddPaymentInfo');
  });
  it('sends no purchase from the browser (the server does) and ignores the rest', () => {
    expect(metaCallFor('pay_success', 'love', {})).toBeNull();
    expect(metaCallFor('landing_view', null, {})).toBeNull();
    expect(metaCallFor('xmas_start', null, {})).toBeNull();
  });
  it('xmas funnel events exist in the analytics allow-list', () => {
    for (const n of ['xmas_view', 'xmas_start', 'xmas_result', 'xmas_cta']) expect(EVENT_NAMES).toContain(n);
  });
});

describe('in-app browsers', () => {
  const IG_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 Instagram 350.0.0.0 Android';
  const IG_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0';
  const FB = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/FBIOS;FBAV/480.0]';
  const KAKAO = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36 KAKAOTALK 10.8.0';
  const SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  it('tells which app it is', () => {
    expect(inAppBrowser(IG_ANDROID)).toBe('instagram');
    expect(inAppBrowser(IG_IOS)).toBe('instagram');
    expect(inAppBrowser(FB)).toBe('facebook');
    expect(inAppBrowser(KAKAO)).toBe('kakaotalk');
    expect(inAppBrowser(SAFARI)).toBeNull();
  });
  it('shows the open-in-browser hint only in Meta apps', () => {
    expect(isMetaInApp(IG_IOS)).toBe(true);
    expect(isMetaInApp(FB)).toBe(true);
    expect(isMetaInApp(KAKAO)).toBe(false);
  });
  it('builds a Chrome intent for the same page', () => {
    expect(chromeIntentUrl('https://dangolsaju.app/room/love?utm_source=meta')).toBe('intent://dangolsaju.app/room/love?utm_source=meta#Intent;scheme=https;package=com.android.chrome;end');
    expect(chromeIntentUrl('http://localhost:3200/room/love')).toBeNull();
  });
});

describe('Conversions API purchase', () => {
  const now = 1763251200000;
  const base = { orderId: 'tc_abc123', amount: 13500, currency: 'KRW', product: 'xmas', fbp: FBP, fbc: FBC };

  it('is off without keys or without an ad cookie', () => {
    expect(metaPurchaseBody({}, base, { userAgent: 'UA', now, siteUrl: 'https://dangolsaju.app' })).toBeNull();
    expect(metaPurchaseBody(ENV, { ...base, fbp: undefined, fbc: 'bad' }, { userAgent: 'UA', now, siteUrl: 'https://dangolsaju.app' })).toBeNull();
  });

  it('sends order id, value, currency, product and ad cookies only', () => {
    const req = metaPurchaseBody({ ...ENV, META_TEST_EVENT_CODE: 'TEST123' }, base, { userAgent: 'UA', now, siteUrl: 'https://dangolsaju.app' })!;
    expect(req.url).toBe('https://graph.facebook.com/v26.0/123456789012345/events?access_token=tok');
    const body = JSON.parse(req.body);
    expect(body.test_event_code).toBe('TEST123');
    expect(body.data).toEqual([
      {
        event_name: 'Purchase',
        event_time: 1763251200,
        event_id: 'tc_abc123',
        action_source: 'website',
        event_source_url: 'https://dangolsaju.app/room',
        user_data: { fbp: FBP, fbc: FBC, client_user_agent: 'UA' },
        custom_data: { value: 13500, currency: 'KRW', content_name: 'xmas' },
      },
    ]);
  });

  it('converts cents to dollars and keeps yen whole', () => {
    expect(metaValue(999, 'USD')).toBe(9.99);
    expect(metaValue(1500, 'JPY')).toBe(1500);
    expect(metaValue(7900, 'krw')).toBe(7900);
  });

  it('never throws when Meta is down', async () => {
    const down = (async () => {
      throw new Error('net');
    }) as unknown as typeof fetch;
    await expect(sendMetaPurchase(ENV, base, { userAgent: null, now }, down)).resolves.toBe(false);
    const ok = (async () => new Response('{}', { status: 200 })) as unknown as typeof fetch;
    await expect(sendMetaPurchase(ENV, base, { userAgent: null, now }, ok)).resolves.toBe(true);
  });
});
