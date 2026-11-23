import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { COUNTRY_COOKIE, pickLocale, storedLocale } from '@/content/locale';
import { proxy } from '@/proxy';

afterEach(() => vi.unstubAllGlobals());

describe('pickLocale', () => {
  it('a saved choice wins over everything', () => {
    expect(pickLocale({ saved: 'en', country: 'KR', browser: 'ko-KR' })).toBe('en');
    expect(pickLocale({ saved: 'ja', country: 'US', browser: 'en-US' })).toBe('ja');
  });

  it('Korea and Japan pick their language over the browser language', () => {
    expect(pickLocale({ saved: null, country: 'KR', browser: 'en-US' })).toBe('ko');
    expect(pickLocale({ saved: null, country: 'JP', browser: 'ko' })).toBe('ja');
    expect(pickLocale({ saved: null, country: 'kr', browser: '' })).toBe('ko');
  });

  it('other or unknown countries fall back to the browser language, then English', () => {
    expect(pickLocale({ saved: null, country: 'US', browser: 'ko-KR' })).toBe('ko');
    expect(pickLocale({ saved: null, country: null, browser: 'ja' })).toBe('ja');
    expect(pickLocale({ saved: null, country: 'FR', browser: 'fr-FR' })).toBe('en');
    expect(pickLocale({ saved: 'xx', country: null, browser: '' })).toBe('en');
  });
});

describe('storedLocale reads the country cookie', () => {
  it('uses the country cookie when nothing is saved', () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => null } });
    vi.stubGlobal('document', { cookie: `a=1; ${COUNTRY_COOKIE}=JP` });
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(storedLocale()).toBe('ja');
  });

  it('keeps the saved language even with a country cookie', () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => 'en' } });
    vi.stubGlobal('document', { cookie: `${COUNTRY_COOKIE}=KR` });
    vi.stubGlobal('navigator', { language: 'ko-KR' });
    expect(storedLocale()).toBe('en');
  });
});

describe('proxy sets the country cookie from the host header', () => {
  const req = (headers: Record<string, string> = {}, cookie?: string) =>
    new NextRequest('https://dangolsaju.app/', { headers: cookie ? { ...headers, cookie } : headers });

  it('sets a readable cookie with the two-letter country', () => {
    const set = proxy(req({ 'x-vercel-ip-country': 'KR' })).headers.get('set-cookie') ?? '';
    expect(set).toContain(`${COUNTRY_COOKIE}=KR`);
    expect(set.toLowerCase()).not.toContain('httponly');
  });

  it('does nothing without a header, with a bad header, or when the cookie already matches', () => {
    expect(proxy(req()).headers.get('set-cookie')).toBeNull();
    expect(proxy(req({ 'x-vercel-ip-country': 'K1R' })).headers.get('set-cookie')).toBeNull();
    expect(proxy(req({ 'x-vercel-ip-country': 'JP' }, `${COUNTRY_COOKIE}=JP`)).headers.get('set-cookie')).toBeNull();
  });
});
