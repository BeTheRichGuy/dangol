import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateMetadata } from '@/app/page';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { landingMetadata } from '@/components/seo/landing-metadata';
import { LocaleLanding } from '@/components/seo/locale-landing';
import { landingCopy } from '@/content/landing-by-locale';
import { LANG_ALTERNATES, metaFor, metaLocale, OG_IMAGE, typesFor } from '@/content/meta-by-locale';
import { pickLocale } from '@/content/locale';
import { shareUrl } from '@/components/result/share-panel';
import { indexingOpen, siteOrigin } from '@/lib/site-origin';

afterEach(() => vi.unstubAllEnvs());

const HANGUL = /[가-힣]/;
const KANA = /[぀-ヿ]/;

describe('링크 미리보기 문구', () => {
  it('?l= 값이 없거나 모르는 값이면 영어', () => {
    expect(metaLocale(undefined)).toBe('en');
    expect(metaLocale('fr')).toBe('en');
    expect(metaLocale(['ko'])).toBe('en');
    expect(metaLocale('ko')).toBe('ko');
    expect(metaLocale('ja')).toBe('ja');
  });

  it('한국어·일본어 묶음은 그 언어 글자로 쓰여 있다', () => {
    expect(metaFor('ko').description).toMatch(HANGUL);
    expect(metaFor('ja').description).toMatch(KANA);
    expect(metaFor('en').description).not.toMatch(HANGUL);
    expect(typesFor('ko').candle.born).toMatch(HANGUL);
  });

  const meta = async (q: Record<string, string>) => generateMetadata({ searchParams: Promise.resolve(q) });

  it('홈: 영어이고 유형이 없으면 layout 기본 그대로, 대표 주소와 언어별 주소만 더한다', async () => {
    expect(await meta({})).toEqual({ alternates: { canonical: '/', languages: LANG_ALTERNATES } });
  });

  it('홈: ?l=ko 이면 제목·설명·그림·사이트 이름이 모두 있다(layout 의 openGraph 를 통째로 바꾸므로)', async () => {
    const m = await meta({ l: 'ko' });
    expect(m.description).toMatch(HANGUL);
    expect(m.openGraph).toMatchObject({ siteName: 'DANGOL', images: [{ url: OG_IMAGE }] });
    expect(m.openGraph?.description).toMatch(HANGUL);
    expect(m.twitter).toMatchObject({ card: 'summary_large_image', images: [OG_IMAGE] });
  });

  it('공유 링크: ?t=candle&l=ja 이면 일본어 제목, 그림은 그 유형의 카드', async () => {
    const m = await meta({ t: 'candle', l: 'ja' });
    expect(JSON.stringify(m.title)).toMatch(KANA);
    expect(m.openGraph?.images).toEqual([expect.objectContaining({ url: '/api/card?t=candle&og=1' })]);
  });

  it('공유 링크: ?t=candle 만 있으면 영어, 모르는 유형은 무시', async () => {
    expect(JSON.stringify((await meta({ t: 'candle' })).title)).not.toMatch(HANGUL);
    expect(await meta({ t: 'nope' })).toEqual({ alternates: { canonical: '/', languages: LANG_ALTERNATES } });
    expect(await meta({ t: 'nope', l: 'ko' })).toMatchObject({ description: metaFor('ko').description });
  });
});

describe('언어별 검색 페이지(/ko, /ja)', () => {
  it('hreflang: 영어 /, 한국어 /ko, 일본어 /ja, 기본은 /', () => {
    expect(LANG_ALTERNATES).toEqual({ en: '/', ko: '/ko', ja: '/ja', 'x-default': '/' });
    const m = landingMetadata('ko');
    expect(m.alternates).toEqual({ canonical: '/ko', languages: LANG_ALTERNATES });
    expect(m.description).toMatch(HANGUL);
    expect((m.openGraph as { locale?: string }).locale).toBe('ko_KR');
    expect((landingMetadata('ja').openGraph as { locale?: string }).locale).toBe('ja_JP');
  });

  it('서버가 그리는 글이 그 언어다(영어 문장이 섞이지 않는다)', () => {
    const ko = renderToStaticMarkup(LocaleLanding({ locale: 'ko' }));
    const ja = renderToStaticMarkup(LocaleLanding({ locale: 'ja' }));
    expect(ko).toContain('lang="ko"');
    expect(ko).toContain(landingCopy('ko').title);
    expect(ko).toContain(landingCopy('ko').rooms[0].title);
    expect(ko).toContain('href="/?l=ko"');
    expect(ja).toContain('lang="ja"');
    expect(ja).toMatch(KANA);
    expect(ja).toContain('href="/?l=ja"');
    expect(landingCopy('ja').how.join('')).not.toMatch(HANGUL);
    expect(landingCopy('ko').how.join('')).toMatch(HANGUL);
  });

  it('다섯 방과 안내 글이 모두 들어 있다', () => {
    for (const l of ['ko', 'ja'] as const) {
      const c = landingCopy(l);
      expect(c.rooms.map((r) => r.key)).toEqual(['life', 'decades', 'love', 'match', 'year']);
      expect(c.rooms.every((r) => r.title && r.question && r.gain)).toBe(true);
      expect(c.about.sections.length).toBeGreaterThan(0);
    }
  });
});

describe('언어와 링크', () => {
  it('?l= 은 저장한 선택 다음, 접속 국가보다 먼저', () => {
    expect(pickLocale({ saved: 'en', url: 'ko', country: null, browser: '' })).toBe('en');
    expect(pickLocale({ saved: null, url: 'ja', country: 'KR', browser: 'ko' })).toBe('ja');
    expect(pickLocale({ saved: null, url: null, country: 'KR', browser: '' })).toBe('ko');
    expect(pickLocale({ saved: null, url: 'xx', country: null, browser: '' })).toBe('en');
  });

  it('공유 링크에는 영어가 아닐 때만 ?l= 이 붙는다', () => {
    expect(shareUrl('https://x.app', 'candle', 'en')).toBe('https://x.app/?t=candle');
    expect(shareUrl('https://x.app', 'candle', 'ko')).toBe('https://x.app/?t=candle&l=ko');
    expect(shareUrl('https://x.app', 'candle', 'ja')).toBe('https://x.app/?t=candle&l=ja');
  });
});

describe('robots.txt · sitemap.xml', () => {
  it('색인이 닫혀 있으면 크롤러를 막지 않고(noindex 를 읽게) 사이트맵은 비어 있다', () => {
    vi.stubEnv('DANGOL_ALLOW_INDEX', '');
    expect(indexingOpen()).toBe(false);
    expect(robots()).toEqual({ rules: { userAgent: '*', allow: '/' } });
    expect(sitemap()).toEqual([]);
  });

  it('색인이 열리면 개인 화면과 API 는 빼고 사이트맵을 알린다', () => {
    vi.stubEnv('DANGOL_ALLOW_INDEX', '1');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://dangolsaju.app/');
    const r = robots();
    expect(r.sitemap).toBe('https://dangolsaju.app/sitemap.xml');
    expect(JSON.stringify(r.rules)).toContain('/api/');
    expect(JSON.stringify(r.rules)).toContain('/archive');
    const urls = sitemap().map((s) => s.url);
    expect(urls).toContain('https://dangolsaju.app');
    expect(urls).toContain('https://dangolsaju.app/pricing');
    expect(urls).toContain('https://dangolsaju.app/ko');
    expect(urls).toContain('https://dangolsaju.app/ja');
    const ko = sitemap().find((s) => s.url.endsWith('/ko'));
    expect(ko?.alternates?.languages).toMatchObject({ en: 'https://dangolsaju.app', ko: 'https://dangolsaju.app/ko', ja: 'https://dangolsaju.app/ja' });
    expect(urls.some((u) => /\/(api|archive|people|auth)/.test(u))).toBe(false);
  });

  it('주소는 NEXT_PUBLIC_SITE_URL > Vercel 운영 주소 > 로컬', () => {
    expect(siteOrigin({ NEXT_PUBLIC_SITE_URL: ' https://a.app// ', VERCEL_PROJECT_PRODUCTION_URL: 'b.vercel.app' })).toBe('https://a.app');
    expect(siteOrigin({ NEXT_PUBLIC_SITE_URL: '', VERCEL_PROJECT_PRODUCTION_URL: 'b.vercel.app' })).toBe('https://b.vercel.app');
    expect(siteOrigin({})).toBe('http://localhost:3000');
  });
});
