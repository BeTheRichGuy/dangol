import { describe, expect, it } from 'vitest';
import { GET as ko } from '../src/app/ig/route';
import { GET as en } from '../src/app/ig/en/route';
import { GET as ja } from '../src/app/ig/ja/route';
import { GET as reunionKo } from '../src/app/ig/reunion/route';
import { GET as reunionEn } from '../src/app/ig/reunion/en/route';
import { GET as reunionJa } from '../src/app/ig/reunion/ja/route';

function landing(res: Response): URL {
  return new URL(res.headers.get('location') ?? '', 'https://dangolsaju.app');
}

describe('인스타 프로필 짧은 주소', () => {
  it.each([
    ['ko', '/ig', ko],
    ['en', '/ig/en', en],
    ['ja', '/ig/ja', ja],
  ] as const)('%s (%s): 임시 이동(307)으로 그 언어의 인스타 프로필 링크에 보낸다', (l, _path, get) => {
    const res = get();
    expect(res.status).toBe(307);
    const url = landing(res);
    expect(url.pathname).toBe('/');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      l,
      utm_source: 'instagram',
      utm_medium: 'bio',
      utm_campaign: 'launch',
      utm_content: 'link_in_bio',
    });
  });

  it('주소가 바뀌어도 바로 반영되도록 캐시하지 않는다', () => {
    for (const get of [ko, en, ja]) expect(get().headers.get('cache-control')).toBe('no-store');
  });
});

describe('재회 짧은 주소(/ig/reunion)', () => {
  it.each([
    ['ko', '/ig/reunion', reunionKo],
    ['en', '/ig/reunion/en', reunionEn],
    ['ja', '/ig/reunion/ja', reunionJa],
  ] as const)('%s (%s): 해와 달 무료 사주(/reunion)로 임시 이동하고 캠페인은 reunion 이다', (l, _path, get) => {
    const res = get();
    expect(res.status).toBe(307);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const url = landing(res);
    expect(url.pathname).toBe('/reunion');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      l,
      utm_source: 'instagram',
      utm_medium: 'bio',
      utm_campaign: 'reunion',
      utm_content: 'link_in_bio',
    });
  });
});
