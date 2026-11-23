import { describe, expect, it } from 'vitest';
import { handleReviewsPost } from '../src/app/api/reviews/handler';
import { REVIEW_BODY_MAX, REVIEW_LANTERNS, REVIEW_ROOMS, cleanReadingId, cleanReview, cleanReviewBody } from '../src/lib/reviews/review';
import { REVIEW_EN } from '../src/content/en/review';
import { REVIEW_JA } from '../src/content/ja/review';
import { REVIEW_KO } from '../src/content/ko/review';
import { ROOM_KEYS } from '../src/lib/rooms/themes';

const ENV = { NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', LEDGER_SECRET: 's'.repeat(40) };
const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('http://x/api/reviews', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const good = { room: 'reunion', locale: 'ko', rating: 5, body: '좋았어요' };
const verify = async (t: string) => (t === 'good' ? 'user-1' : null);

function fakeSupabase() {
  const calls: { url: string; args: Record<string, unknown> }[] = [];
  const seen = new Set<string>();
  const fetcher = (async (url: string, init: RequestInit) => {
    const args = JSON.parse(String(init.body)) as Record<string, unknown>;
    calls.push({ url, args });
    const uid = args.p_uid as string | null;
    if (uid === null) return Response.json({ saved: true, granted: 0, reason: 'guest' });
    const key = `${uid}|${args.p_reading}`;
    if (seen.has(key)) return Response.json({ saved: false, granted: 0, reason: 'already', balance: 7 });
    seen.add(key);
    return Response.json({ saved: true, granted: args.p_n, balance: 7 + (args.p_n as number) });
  }) as unknown as typeof fetch;
  return { calls, fetcher };
}

describe('후기 다듬기', () => {
  it('후기를 남길 수 있는 곳은 무료 첫 장, 다섯 방, 재회 사주다', () => {
    expect([...REVIEW_ROOMS]).toEqual(['free', ...ROOM_KEYS, 'reunion']);
  });

  it('별점은 1~5 정수만, 방·언어는 목록 안에서만 받는다', () => {
    expect(cleanReview(good)).toEqual({ room: 'reunion', locale: 'ko', rating: 5, body: '좋았어요' });
    for (const rating of [0, 6, 2.5, '5', null, undefined, NaN]) expect(cleanReview({ ...good, rating }), String(rating)).toBeNull();
    expect(cleanReview({ ...good, room: 'admin' })).toBeNull();
    expect(cleanReview({ ...good, locale: 'fr' })).toBeNull();
    expect(cleanReview(null)).toBeNull();
    expect(cleanReview('x')).toBeNull();
  });

  it('한마디는 없어도 되고, 공백을 정리하고 300자까지만 둔다', () => {
    expect(cleanReview({ ...good, body: undefined })?.body).toBe('');
    expect(cleanReviewBody('  좋아요 \n\n  또 올게요\t')).toBe('좋아요 또 올게요');
    expect(cleanReviewBody('가'.repeat(REVIEW_BODY_MAX + 50))).toHaveLength(REVIEW_BODY_MAX);
    expect(cleanReviewBody(123)).toBe('');
  });

  it('보고서 식별자는 영문자·숫자·._:- 만, 64자까지', () => {
    expect(cleanReadingId('9afc46c7-7134-4d88-9090-d3c33b9d2826')).toBe('9afc46c7-7134-4d88-9090-d3c33b9d2826');
    for (const bad of ['', 'a'.repeat(65), 'a b', '한글', "x'; drop", 5, null, undefined]) expect(cleanReadingId(bad), String(bad)).toBeNull();
  });

  it('등불은 2개다', () => {
    expect(REVIEW_LANTERNS).toBe(3);
  });
});

describe('POST /api/reviews', () => {
  it('로그인한 사람이 보고서 id 와 함께 보내면 서버 함수에 계정·보고서·등불 3개가 간다(이름·IP 없음)', async () => {
    const { calls, fetcher } = fakeSupabase();
    const res = await handleReviewsPost(post({ ...good, reading: 'r-1', body: '  좋았어요  ', name: '홍길동' }, { Authorization: 'Bearer good', 'x-vercel-ip-country': 'kr', 'x-forwarded-for': '1.2.3.4' }), { env: ENV, fetcher, verifyUser: verify });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ saved: true, granted: 3, balance: 10, reason: null });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://abc.supabase.co/rest/v1/rpc/review_submit');
    expect(calls[0].args).toEqual({
      p_secret: ENV.LEDGER_SECRET,
      p_uid: 'user-1',
      p_reading: 'r-1',
      p_room: 'reunion',
      p_locale: 'ko',
      p_rating: 5,
      p_body: '좋았어요',
      p_country: 'KR',
      p_n: 3,
    });
  });

  it('크리스마스 판(연의 방 + edition xmas) 본편 끝 후기는 등불 3개, 다른 방도 3개', async () => {
    const { calls, fetcher } = fakeSupabase();
    await handleReviewsPost(post({ ...good, room: 'love', edition: 'xmas', reading: 'x-1' }, { Authorization: 'Bearer good' }), { env: ENV, fetcher, verifyUser: verify });
    await handleReviewsPost(post({ ...good, room: 'life', edition: 'xmas', reading: 'x-2' }, { Authorization: 'Bearer good' }), { env: ENV, fetcher, verifyUser: verify });
    await handleReviewsPost(post({ ...good, room: 'love', edition: 'xmas', reading: 'x-3' }, {}), { env: ENV, fetcher, verifyUser: verify });
    expect(calls.map((c) => c.args.p_n)).toEqual([3, 3, 0]);
  });

  it('같은 보고서에서 두 번째는 저장도 등불도 없다(already)', async () => {
    const { fetcher } = fakeSupabase();
    const send = () => handleReviewsPost(post({ ...good, reading: 'r-1' }, { Authorization: 'Bearer good' }), { env: ENV, fetcher, verifyUser: verify });
    expect(await (await send()).json()).toMatchObject({ saved: true, granted: 3 });
    expect(await (await send()).json()).toEqual({ saved: false, granted: 0, balance: 7, reason: 'already' });

    const other = await handleReviewsPost(post({ ...good, reading: 'r-2' }, { Authorization: 'Bearer good' }), { env: ENV, fetcher, verifyUser: verify });
    expect(await other.json()).toMatchObject({ saved: true, granted: 3 });
  });

  it('손님(토큰 없음), 죽은 토큰, 보고서 id 없음은 후기만 받고 등불은 없다', async () => {
    for (const [headers, reading] of [
      [{}, 'r-1'],
      [{ Authorization: 'Bearer dead' }, 'r-1'],
      [{ Authorization: 'Bearer good' }, undefined],
    ] as const) {
      const { calls, fetcher } = fakeSupabase();
      const res = await handleReviewsPost(post({ ...good, reading }, { ...headers }), { env: ENV, fetcher, verifyUser: verify });
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ saved: true, granted: 0, reason: 'guest' });
      expect(calls[0].args).toMatchObject({ p_uid: null, p_reading: null, p_n: 0 });
    }
  });

  it('값이 맞지 않거나 본문이 깨졌으면 400, 너무 크면 413, 저장소에는 가지 않는다', async () => {
    const { calls, fetcher } = fakeSupabase();
    expect((await handleReviewsPost(post({ ...good, rating: 9 }), { env: ENV, fetcher })).status).toBe(400);
    expect((await handleReviewsPost(post('{not json'), { env: ENV, fetcher })).status).toBe(400);
    expect((await handleReviewsPost(post({ ...good, body: 'a'.repeat(5000) }), { env: ENV, fetcher })).status).toBe(413);
    expect(calls).toHaveLength(0);
  });

  it('Supabase·LEDGER_SECRET 설정이 없으면 503 not_open, 서버 함수가 실패하면 502', async () => {
    const { fetcher } = fakeSupabase();
    const noEnv = await handleReviewsPost(post(good), { env: {}, fetcher });
    expect(noEnv.status).toBe(503);
    expect(await noEnv.json()).toEqual({ error: 'not_open' });
    expect((await handleReviewsPost(post(good), { env: { ...ENV, LEDGER_SECRET: undefined }, fetcher })).status).toBe(503);
    const broken = (async () => new Response(null, { status: 500 })) as unknown as typeof fetch;
    const missing = (async () => new Response(null, { status: 404 })) as unknown as typeof fetch;
    const thrown = (async () => {
      throw new Error('net');
    }) as unknown as typeof fetch;
    expect((await handleReviewsPost(post(good), { env: ENV, fetcher: broken })).status).toBe(502);
    expect((await handleReviewsPost(post(good), { env: ENV, fetcher: missing })).status).toBe(502);
    expect((await handleReviewsPost(post(good), { env: ENV, fetcher: thrown })).status).toBe(502);
  });
});

describe('후기 칸 문구(세 언어)', () => {
  const ALL = { ko: REVIEW_KO, en: REVIEW_EN, ja: REVIEW_JA };
  const texts = (c: typeof REVIEW_KO) => [c.title, c.note, c.star(1), c.star(5), c.placeholder, c.counter(3, 300), c.submit, c.sending, c.needRating, c.thanks, c.failed, c.reward, c.thanksReward];

  it('모든 칸이 비어 있지 않고, 별 이름과 글자 수 표기가 숫자를 담는다', () => {
    for (const [l, c] of Object.entries(ALL)) {
      for (const t of texts(c)) expect(t.trim().length, l).toBeGreaterThan(0);
      expect(c.star(3), l).toContain('3');
      expect(c.counter(12, 300), l).toContain('12');
    }
  });

  it('등불 안내는 개수 3을 담고, 보고서마다 한 번이라고 말한다', () => {
    for (const [l, c] of Object.entries(ALL)) {
      expect(c.reward, l).toContain('3');
      expect(c.thanksReward, l).toContain('3');
    }
    expect(REVIEW_KO.reward).toContain('한 번');
  });

  it('금지 어휘·소금/꿀/사탕 비유·이모지가 없다', () => {
    const banned = /cosmic|energy|universe|manifest|FYP|소금|꿀|사탕|candy|honey|salt/i;
    for (const [l, c] of Object.entries(ALL)) {
      for (const t of texts(c)) {
        expect(t, `${l}: ${t}`).not.toMatch(banned);
        expect(t, `${l}: ${t}`).not.toMatch(/\p{Extended_Pictographic}/u);
      }
    }
  });

  it('한국어 제목은 후기 남기기, 안내는 "여러분의 후기가 큰 도움이 돼요"다', () => {
    expect(REVIEW_KO.title).toBe('후기 남기기');
    expect(REVIEW_KO.note).toBe('여러분의 후기가 큰 도움이 돼요.');
  });
});
