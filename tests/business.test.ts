import { afterEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BUSINESS, businessRows, ftcUrl } from '@/content/business';
import { setActiveLocaleForTest } from '@/content/locale';
import { SiteFooter } from '@/components/site-footer';
import { LegalDocument } from '@/app/about/_components/legal-document';
import { CheckoutSheet } from '@/components/rooms/checkout-sheet';
import type { RoomPayload } from '@/lib/rooms/payload';

afterEach(() => setActiveLocaleForTest('en'));

describe('business info', () => {
  it('lists only the facts we have, in the legal order', () => {
    const rows = businessRows('ko', { ...BUSINESS, mailOrderNo: null, address: null, phone: null });
    expect(rows.map((r) => r.field)).toEqual(['name', 'owner', 'bizNo', 'email', 'hosting']);
    expect(rows.find((r) => r.field === 'name')?.value).toBe('도깨비웍스');
    expect(rows.find((r) => r.field === 'bizNo')?.value).toBe('629-04-03844');
  });

  it('shows the address, phone and mail-order number once they are filled in', () => {
    const rows = businessRows('en', { ...BUSINESS, mailOrderNo: '2026-경기파주-0000', address: 'Paju', phone: '010-0000-0000' });
    expect(rows.map((r) => r.field)).toEqual(['name', 'owner', 'bizNo', 'mailOrderNo', 'address', 'phone', 'email', 'hosting']);
  });

  it.each(['en', 'ko', 'ja'] as const)('%s footer shows the business address, phone and the pricing link', (locale) => {
    expect(BUSINESS.address).toBe('경기도 파주시 큰연당길 45-14');
    expect(BUSINESS.phone).toBe('010-8996-9157');
    setActiveLocaleForTest(locale);
    const html = renderToStaticMarkup(createElement(SiteFooter, {}));
    for (const text of ['경기도 파주시 큰연당길 45-14', '010-8996-9157', 'href="tel:010-8996-9157"', 'href="/pricing"']) {
      expect(html, text).toContain(text);
    }
  });

  it('the pricing page server HTML lists every room with its description and the won, yen and dollar prices', () => {
    const html = renderToStaticMarkup(createElement(LegalDocument, { legalKey: 'pricing', path: '/pricing' }));
    for (const text of ['4,900원', '890円', '$6.29', 'The many sides of you', 'href="/pricing"', 'href="/refund"']) {
      expect(html, text).toContain(text);
    }
  });

  it('links the FTC business lookup with digits only', () => {
    expect(ftcUrl('629-04-03844')).toBe('https://www.ftc.go.kr/bizCommPop.do?wrkr_no=6290403844');
  });

  it.each(['en', 'ko', 'ja'] as const)('%s site footer shows the business info and the refund link', (locale) => {
    setActiveLocaleForTest(locale);
    const html = renderToStaticMarkup(createElement(SiteFooter, {}));
    for (const text of ['629-04-03844', 'admin@dokkaebiworks.com', 'Vercel Inc.', '고희승', 'href="/refund"', 'wrkr_no=6290403844']) {
      expect(html, text).toContain(text);
    }
  });

  it('legal pages carry the same business info and the refund page in their nav', () => {
    setActiveLocaleForTest('ko');
    const html = renderToStaticMarkup(createElement(LegalDocument, { legalKey: 'refund', path: '/refund' }));
    expect(html).toContain('629-04-03844');
    expect(html).toContain('href="/refund"');
    expect(html).not.toContain('<aside');
  });
});

describe('checkout consent', () => {
  const payload = {} as RoomPayload;
  it.each(['en', 'ko', 'ja'] as const)('%s keeps the pay button off until the refund notice is agreed', (locale) => {
    setActiveLocaleForTest(locale);
    const html = renderToStaticMarkup(
      createElement(CheckoutSheet, {
        room: 'life',
        payload,
        readers: ['A'],
        token: async () => null,
        onPaid: () => {},
        onClose: () => {},
      }),
    );
    expect(html).toContain('type="checkbox"');
    expect(html).toMatch(/<button[^>]*dg-btn--seal[^>]*disabled=""/);
    expect(html).toContain('href="/refund"');
    expect(html).toContain('href="/terms"');
  });
});

describe('service period is stated on the site', () => {
  const cases = [
    ['ko', '서비스 제공 기간', '결제 후 바로'],
    ['en', 'Service period', 'right after payment'],
    ['ja', 'サービス提供期間', 'お支払い後すぐ'],
  ] as const;
  it.each(cases)('%s: checkout sheet, pricing, terms and refund policy', (locale, label, phrase) => {
    setActiveLocaleForTest(locale);
    const sheet = renderToStaticMarkup(
      createElement(CheckoutSheet, { room: 'life', payload: {} as RoomPayload, readers: ['A'], token: async () => null, onPaid: () => {}, onClose: () => {} }),
    );
    expect(sheet, 'checkout').toContain(label);
    expect(sheet, 'checkout').toContain(phrase);
    for (const key of ['pricing', 'terms', 'refund'] as const) {
      const html = renderToStaticMarkup(createElement(LegalDocument, { legalKey: key, path: `/${key}` as '/pricing' }));
      expect(html, key).toContain(label);
    }
  });
});

describe('checkout sheet for guests', () => {
  it('ko: guests hear the reading stays on this screen; signed-in people hear it is saved', () => {
    setActiveLocaleForTest('ko');
    const render = (signedIn: boolean) =>
      renderToStaticMarkup(createElement(CheckoutSheet, { room: 'life', payload: {} as RoomPayload, readers: ['A'], token: async () => null, onPaid: () => {}, onClose: () => {}, signedIn }));
    expect(render(false)).toContain('이 화면에서만');
    expect(render(false)).not.toContain('보관함에 저장돼요');
    expect(render(true)).toContain('보관함에 저장돼요');
  });
});
