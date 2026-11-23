import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleInstagramVerify, handleInstagramWebhook, type InstagramWebhookDeps } from '../src/app/api/webhooks/instagram/handler';
import { dmConfig, dmVerifyToken } from '../src/lib/dm/config';
import { createMemoryDmStore, createUpstashDmStore, DmStoreError, makeDmStore, type DmStore } from '../src/lib/dm/store';
import { verifySignature, parseCommentEvents } from '../src/lib/dm/instagram';

const APP_SECRET = 'app-secret-' + 'a'.repeat(21);
const VERIFY = 'verify-' + 'b'.repeat(16);
const TOKEN_KO = 'IGAA-ko-' + 'c'.repeat(30);
const TOKEN_EN = 'IGAA-en-' + 'd'.repeat(30);
const TOKEN_JA = 'IGAA-ja-' + 'e'.repeat(30);
const ID_KO = '17841400000001';
const ID_EN = '17841400000002';
const ID_JA = '17841400000003';
const NOW = Date.UTC(2026, 10, 6, 3, 0, 0);

const ENV: Record<string, string> = {
  INSTAGRAM_APP_SECRET: APP_SECRET,
  INSTAGRAM_VERIFY_TOKEN: VERIFY,
  INSTAGRAM_DM_KO_ID: ID_KO, INSTAGRAM_DM_KO_TOKEN: TOKEN_KO,
  INSTAGRAM_DM_EN_ID: ID_EN, INSTAGRAM_DM_EN_TOKEN: TOKEN_EN,
  INSTAGRAM_DM_JA_ID: ID_JA, INSTAGRAM_DM_JA_TOKEN: TOKEN_JA,
  NEXT_PUBLIC_SITE_URL: 'https://dangolsaju.app',
};

const sign = (body: string, secret = APP_SECRET) => 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

interface Ev { account?: string; from?: string; media?: string; comment?: string; text?: string; parent?: string; field?: string }
function payload(...evs: Ev[]) {
  return {
    object: 'instagram',
    entry: evs.map((e, i) => ({
      id: e.account ?? ID_KO,
      time: 1_700_000_000 + i,
      changes: [{
        field: e.field ?? 'comments',
        value: {
          from: { id: e.from ?? 'IGSID-111', username: 'some_user_name' },
          media: { id: e.media ?? 'MEDIA-1', media_product_type: 'REELS' },
          id: e.comment ?? `CMT-${i + 1}`,
          text: e.text ?? '시험 공부 때문에 힘들어요',
          ...(e.parent ? { parent_id: e.parent } : {}),
        },
      }],
    })),
  };
}

interface Call { url: string; method: string; headers: Record<string, string>; body: unknown }
function fakeFetch(respond: (call: Call, n: number) => Response | Promise<Response> = () => Response.json({ recipient_id: 'IGSID-111', message_id: 'm_1' })) {
  const calls: Call[] = [];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: Call = {
      url: String(input),
      method: init?.method ?? 'GET',
      headers: Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>)),
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : null,
    };
    calls.push(call);
    return respond(call, calls.length);
  }) as typeof fetch;
  return { fetcher, calls, sends: () => calls.filter((c) => c.method === 'POST') };
}

function post(body: unknown, opts: { secret?: string; signature?: string | null; raw?: string } = {}) {
  const text = opts.raw ?? JSON.stringify(body);
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.signature !== null) headers['x-hub-signature-256'] = opts.signature ?? sign(text, opts.secret);
  return new Request('https://dangolsaju.app/api/webhooks/instagram', { method: 'POST', headers, body: text });
}

function deps(over: Partial<InstagramWebhookDeps> = {}, f = fakeFetch()): InstagramWebhookDeps & { _f: ReturnType<typeof fakeFetch> } {
  return { env: ENV, fetcher: f.fetcher, now: () => NOW, store: createMemoryDmStore(() => NOW), _f: f, ...over } as InstagramWebhookDeps & { _f: ReturnType<typeof fakeFetch> };
}

afterEach(() => vi.restoreAllMocks());

describe('설정: 키가 없으면 닫혀 있다', () => {
  it('앱 시크릿·확인 토큰·계정이 모두 있어야 열린다', () => {
    expect(dmConfig(ENV)).not.toBeNull();
    expect(dmConfig({})).toBeNull();
    expect(dmConfig({ ...ENV, INSTAGRAM_APP_SECRET: '' })).toBeNull();
    expect(dmConfig({ ...ENV, INSTAGRAM_VERIFY_TOKEN: undefined })).toBeNull();
    const noAccounts = Object.fromEntries(Object.entries(ENV).filter(([k]) => !k.startsWith('INSTAGRAM_DM_')));
    expect(dmConfig(noAccounts)).toBeNull();
  });

  it('계정은 아이디와 토큰이 둘 다 있는 것만 쓴다. 따옴표·공백은 걷는다', () => {
    const cfg = dmConfig({ ...ENV, INSTAGRAM_DM_EN_TOKEN: '', INSTAGRAM_DM_JA_ID: ` "${ID_JA}" ` });
    expect(cfg?.accounts.map((a) => a.lang)).toEqual(['ko', 'ja']);
    expect(cfg?.accounts.find((a) => a.lang === 'ja')?.id).toBe(ID_JA);
  });

  it('사이트 주소가 https 가 아니면(로컬) 닫는다: 깨진 그림 링크를 사람에게 보내지 않는다', () => {
    expect(dmConfig({ ...ENV, NEXT_PUBLIC_SITE_URL: '' })).toBeNull();
    expect(dmConfig({ ...ENV, NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' })).toBeNull();
  });

  it('카드 모양은 기본이고 INSTAGRAM_DM_FORMAT=text 로 글만 보내게 바꾼다', () => {
    expect(dmConfig(ENV)?.format).toBe('card');
    expect(dmConfig({ ...ENV, INSTAGRAM_DM_FORMAT: 'text' })?.format).toBe('text');
    expect(dmConfig({ ...ENV, INSTAGRAM_DM_FORMAT: 'whatever' })?.format).toBe('card');
  });

  it('Meta 주소는 기본 graph.facebook.com v27.0(새 앱은 통합 로그인만 된다), INSTAGRAM_GRAPH_HOST=instagram 이면 옛 graph.instagram.com', () => {
    expect(dmConfig(ENV)).toMatchObject({ graphBase: 'https://graph.facebook.com', apiVersion: 'v27.0' });
    expect(dmConfig({ ...ENV, INSTAGRAM_GRAPH_HOST: 'instagram' })?.graphBase).toBe('https://graph.instagram.com');
    expect(dmConfig({ ...ENV, INSTAGRAM_GRAPH_VERSION: 'v26.0' })?.apiVersion).toBe('v26.0');
  });

  it('확인 토큰만 따로 읽을 수 있다(콜백 주소 확인은 계정 설정 전에도 해야 한다)', () => {
    expect(dmVerifyToken({ INSTAGRAM_VERIFY_TOKEN: VERIFY })).toBe(VERIFY);
    expect(dmVerifyToken({})).toBeNull();
  });

  it('POST 는 닫혀 있으면 503 not_open, 보내지 않는다', async () => {
    const f = fakeFetch();
    for (const env of [{}, { ...ENV, INSTAGRAM_APP_SECRET: '' }]) {
      const res = await handleInstagramWebhook(post(payload({})), deps({ env }, f));
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: 'not_open' });
    }
    expect(f.calls).toHaveLength(0);
  });

  it('운영(Vercel)인데 Upstash 가 없으면 중복 방지를 못 하니 닫는다. 로컬은 메모리로 열린다', async () => {
    expect(makeDmStore({ VERCEL: '1' })).toBeNull();
    expect(makeDmStore({})).not.toBeNull();
    const f = fakeFetch();
    const res = await handleInstagramWebhook(post(payload({})), { env: { ...ENV, VERCEL: '1' }, fetcher: f.fetcher, now: () => NOW });
    expect(res.status).toBe(503);
    expect(f.calls).toHaveLength(0);
  });
});

describe('GET: 콜백 주소 확인', () => {
  const url = (q: Record<string, string>) => new Request(`https://dangolsaju.app/api/webhooks/instagram?${new URLSearchParams(q)}`);
  it('토큰이 맞으면 challenge 를 그대로 돌려준다', async () => {
    const res = handleInstagramVerify(url({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY, 'hub.challenge': '1158201444' }), { env: ENV });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('1158201444');
  });
  it('토큰이 틀리면 403, 설정이 없으면 503', async () => {
    expect(handleInstagramVerify(url({ 'hub.mode': 'subscribe', 'hub.verify_token': 'nope', 'hub.challenge': '1' }), { env: ENV }).status).toBe(403);
    expect(handleInstagramVerify(url({ 'hub.mode': 'subscribe', 'hub.challenge': '1' }), { env: ENV }).status).toBe(403);
    expect(handleInstagramVerify(url({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY, 'hub.challenge': '1' }), { env: {} }).status).toBe(503);
  });
  it('challenge 는 숫자만 받는다(응답에 아무 글이나 되비치지 않는다)', () => {
    expect(handleInstagramVerify(url({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY, 'hub.challenge': '<script>' }), { env: ENV }).status).toBe(400);
  });
});

describe('서명과 본문 읽기', () => {
  it('앱 시크릿으로 만든 sha256 서명만 통과한다', () => {
    const body = '{"a":1}';
    expect(verifySignature(APP_SECRET, body, sign(body))).toBe(true);
    expect(verifySignature(APP_SECRET, body, sign(body, 'other-secret'))).toBe(false);
    expect(verifySignature(APP_SECRET, body, sign(body).replace(/.$/, (c) => (c === '0' ? '1' : '0')))).toBe(false);
    expect(verifySignature(APP_SECRET, body, null)).toBe(false);
    expect(verifySignature(APP_SECRET, body, 'sha256=')).toBe(false);
    expect(verifySignature(APP_SECRET, body, sign(body).replace('sha256=', ''))).toBe(false);
    expect(verifySignature(APP_SECRET, body + ' ', sign(body))).toBe(false);
  });

  it('서명이 없거나 틀리면 401 이고 아무것도 보내지 않는다', async () => {
    const d = deps();
    expect((await handleInstagramWebhook(post(payload({}), { signature: null }), d)).status).toBe(401);
    expect((await handleInstagramWebhook(post(payload({}), { secret: 'wrong' }), d)).status).toBe(401);
    expect(d._f.calls).toHaveLength(0);
  });

  it('서명은 맞는데 JSON 이 아니면 400, 너무 크면 413', async () => {
    const d = deps();
    expect((await handleInstagramWebhook(post(null, { raw: 'not json' }), d)).status).toBe(400);
    expect((await handleInstagramWebhook(post(null, { raw: ' '.repeat(300 * 1024) }), d)).status).toBe(413);
  });

  it('댓글 알림만 뽑는다: comments 가 아니거나 필수 값이 없으면 건너뛴다', () => {
    const evs = parseCommentEvents(payload({}, { field: 'live_comments' }, { field: 'mentions' }));
    expect(evs).toHaveLength(1);
    expect(evs[0]).toMatchObject({ accountId: ID_KO, commentId: 'CMT-1', fromId: 'IGSID-111', mediaId: 'MEDIA-1', isReply: false });
    expect(parseCommentEvents({ object: 'instagram', entry: [{ id: ID_KO, changes: [{ field: 'comments', value: { id: 'x' } }] }] })).toEqual([]);
    expect(parseCommentEvents(null)).toEqual([]);
    expect(parseCommentEvents({ object: 'page', entry: [] })).toEqual([]);
    expect(parseCommentEvents(payload({ parent: 'CMT-0' }))[0].isReply).toBe(true);
  });

  it('댓글 id 가 value.comment_id 로 와도 읽는다(통합 로그인 문서의 모양)', () => {
    const body = { object: 'instagram', entry: [{ id: ID_KO, changes: [{ field: 'comments', value: { comment_id: 'CMT-9', from: { id: 'U9' }, media: { id: 'M9' }, text: '크리스마스' } }] }] };
    expect(parseCommentEvents(body)).toEqual([{ accountId: ID_KO, commentId: 'CMT-9', fromId: 'U9', mediaId: 'M9', text: '크리스마스', isReply: false }]);
  });
});

describe('댓글 → 개인 답장(DM)', () => {
  it('댓글 한 건에 부적 카드를 개인 답장으로 보낸다: 댓글 id 로 받는 사람을 가리키고, 토큰은 헤더에만 둔다', async () => {
    const d = deps();
    const res = await handleInstagramWebhook(post(payload({ comment: 'CMT-77', text: '시험 공부 때문에 힘들어요' })), d);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, sent: 1 });
    const [c] = d._f.sends();
    expect(c.url).toBe(`https://graph.facebook.com/v27.0/${ID_KO}/messages`);
    expect(c.headers.Authorization).toBe(`Bearer ${TOKEN_KO}`);
    expect(c.url).not.toContain(TOKEN_KO);
    const body = c.body as { recipient: { comment_id: string }; message: { attachment: { payload: { elements: Array<{ title: string; image_url: string }> } } } };
    expect(body.recipient).toEqual({ comment_id: 'CMT-77' });
    const el = body.message.attachment.payload.elements[0];
    expect(el.title).toBe('학업 부적');
    expect(el.image_url).toBe('https://dangolsaju.app/api/talisman?id=study&w=768');
  });

  it('계정의 언어로 쓴다: 영어 계정은 영어 charm, 일본어 계정은 お守り', async () => {
    const d = deps({ env: { ...ENV, INSTAGRAM_DM_FORMAT: 'text' } });
    await handleInstagramWebhook(post(payload({ account: ID_EN, comment: 'C1', text: 'I have an exam next week' }, { account: ID_JA, comment: 'C2', from: 'IGSID-222', text: '恋愛運が知りたい' })), d);
    const [en, ja] = d._f.sends().map((c) => (c.body as { message: { text: string } }).message.text);
    expect(en).toContain('Study charm');
    expect(en).toContain('l=en&utm_source=instagram&utm_medium=dm');
    expect(ja).toContain('恋のお守り');
    expect(ja).toContain('l=ja&utm_source=instagram&utm_medium=dm');
    expect(d._f.sends().map((c) => c.headers.Authorization)).toEqual([`Bearer ${TOKEN_EN}`, `Bearer ${TOKEN_JA}`]);
  });

  it('키워드가 없으면 기본 한 장(마음), 있으면 그 분야 부적', async () => {
    const d = deps();
    await handleInstagramWebhook(post(payload({ comment: 'A', from: 'U1', text: '부적 주세요' }, { comment: 'B', from: 'U2', text: '연애운 궁금해요' })), d);
    const ids = d._f.sends().map((c) => (c.body as { message: { attachment: { payload: { elements: Array<{ image_url: string }> } } } }).message.attachment.payload.elements[0].image_url);
    expect(ids).toEqual(['https://dangolsaju.app/api/talisman?id=mind&w=768', 'https://dangolsaju.app/api/talisman?id=love&w=768']);
  });

  it('댓글에 키워드가 없을 때만 게시물 글을 읽어 고른다(읽지 못하면 기본 한 장)', async () => {
    const f = fakeFetch((c) => (c.method === 'GET' ? Response.json({ caption: '수능 앞둔 사람에게 보내는 학업 사주' }) : Response.json({ message_id: 'm' })));
    const d = deps({}, f);
    await handleInstagramWebhook(post(payload({ comment: 'A', from: 'U1', media: 'M-cap', text: '부적 주세요' }, { comment: 'B', from: 'U2', media: 'M-cap', text: '연애운 궁금해요' })), d);
    const gets = f.calls.filter((c) => c.method === 'GET');
    expect(gets).toHaveLength(1);
    expect(gets[0].url).toBe('https://graph.facebook.com/v27.0/M-cap?fields=caption');
    expect(gets[0].headers.Authorization).toBe(`Bearer ${TOKEN_KO}`);
    const imgs = f.sends().map((c) => JSON.stringify(c.body));
    expect(imgs[0]).toContain('id=study');
    expect(imgs[1]).toContain('id=love');

    const f2 = fakeFetch((c) => (c.method === 'GET' ? new Response('boom', { status: 500 }) : Response.json({ message_id: 'm' })));
    const d2 = deps({}, f2);
    expect((await handleInstagramWebhook(post(payload({ text: '부적 주세요', media: 'M-other' })), d2)).status).toBe(200);
    expect(JSON.stringify(f2.sends()[0].body)).toContain('id=mind');
  });

  it('크리스마스 판 게시물의 댓글은 연애 부적과 크리스마스 무료 확인(/xmas) 링크를 보낸다. 크리스마스 당일부터는 예전대로', async () => {
    const caption = "그 사람, 이번 크리스마스엔 딴 사람 옆에 있을지도 몰라. 댓글에 '크리스마스' 남기면";
    const f = fakeFetch((c) => (c.method === 'GET' ? Response.json({ caption }) : Response.json({ message_id: 'm' })));
    const d = deps({ env: { ...ENV, INSTAGRAM_DM_FORMAT: 'text' } }, f);
    await handleInstagramWebhook(post(payload({ comment: 'A', from: 'U1', media: 'M-x', text: '크리스마스' }, { comment: 'B', from: 'U2', media: 'M-x', text: '저요' })), d);
    const texts = f.sends().map((c) => (c.body as { message: { text: string } }).message.text);
    expect(texts).toHaveLength(2);
    for (const t of texts) {
      expect(t).toContain('id=love');
      expect(t).toContain('https://dangolsaju.app/xmas?l=ko&utm_source=instagram&utm_medium=dm&utm_campaign=xmas&utm_content=love');
    }

    const after = Date.UTC(2026, 11, 24, 15, 0, 0);
    const f2 = fakeFetch((c) => (c.method === 'GET' ? Response.json({ caption }) : Response.json({ message_id: 'm' })));
    const d2 = deps({ env: { ...ENV, INSTAGRAM_DM_FORMAT: 'text' }, now: () => after, store: createMemoryDmStore(() => after) }, f2);
    await handleInstagramWebhook(post(payload({ media: 'M-x', text: '크리스마스' })), d2);
    const late = (f2.sends()[0].body as { message: { text: string } }).message.text;
    expect(late).not.toContain('/xmas');
    expect(late).toContain('utm_campaign=talisman');
  });

  it('건너뛴다: 계정 자신의 댓글, 답글, 모르는 계정, 댓글이 아닌 알림', async () => {
    const d = deps();
    const res = await handleInstagramWebhook(
      post(payload(
        { comment: 'S1', from: ID_KO },
        { comment: 'R1', from: 'U3', parent: 'CMT-0' },
        { comment: 'X1', from: 'U4', account: '99999' },
        { comment: 'L1', from: 'U5', field: 'live_comments' },
      )),
      d,
    );
    expect(res.status).toBe(200);
    expect(d._f.calls).toHaveLength(0);
  });
});

describe('안전장치: 중복·한도·실패', () => {
  it('같은 사람이 같은 게시물에 또 댓글을 달아도, 같은 알림이 다시 와도 한 번만 보낸다', async () => {
    const d = deps();
    await handleInstagramWebhook(post(payload({ comment: 'C1' })), d);
    await handleInstagramWebhook(post(payload({ comment: 'C2' })), d);
    await handleInstagramWebhook(post(payload({ comment: 'C1' })), d);
    expect(d._f.sends()).toHaveLength(1);
  });

  it('다른 게시물이거나 다른 사람이면 보낸다', async () => {
    const d = deps();
    await handleInstagramWebhook(post(payload({ comment: 'C1' }, { comment: 'C2', media: 'MEDIA-2' }, { comment: 'C3', from: 'IGSID-999' })), d);
    expect(d._f.sends()).toHaveLength(3);
  });

  it('계정이 다르면 같은 사람·같은 게시물 번호여도 따로 센다', async () => {
    const d = deps();
    await handleInstagramWebhook(post(payload({ comment: 'C1' }, { comment: 'C2', account: ID_EN })), d);
    expect(d._f.sends()).toHaveLength(2);
  });

  it('저장소에는 계정·게시물·사람 아이디 원문이 남지 않는다(해시 키만)', async () => {
    const seen: string[] = [];
    const inner = createMemoryDmStore(() => NOW);
    const spy: DmStore = {
      claim: (k, t) => (seen.push(k), inner.claim(k, t)),
      release: (k) => (seen.push(k), inner.release(k)),
      bump: (k, t) => (seen.push(k), inner.bump(k, t)),
    };
    await handleInstagramWebhook(post(payload({ comment: 'CMT-secret-1', from: 'IGSID-secret-2', media: 'MEDIA-secret-3', text: '시험' })), deps({ store: spy }));
    expect(seen.length).toBeGreaterThan(0);
    for (const k of seen) for (const raw of ['CMT-secret-1', 'IGSID-secret-2', 'MEDIA-secret-3', ID_KO]) expect(k).not.toContain(raw);
    expect(seen.some((k) => /^dangol:dm:sent:[0-9a-f]{64}$/.test(k))).toBe(true);
  });

  it('계정마다 시간당 한도를 넘으면 보내지 않는다(Meta 한도 750보다 낮게 600). 넘긴 것은 중복 자리를 비워 둔다', async () => {
    let t = NOW;
    const d = deps({ store: createMemoryDmStore(() => t), now: () => t, hourlyCap: 2 });
    const res = await handleInstagramWebhook(post(payload({ comment: 'A', from: 'U1' }, { comment: 'B', from: 'U2' }, { comment: 'C', from: 'U3' })), d);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sent: 2, skipped: { rate_capped: 1 } });
    expect(d._f.sends()).toHaveLength(2);

    t += 3_600_000;
    await handleInstagramWebhook(post(payload({ comment: 'C', from: 'U3' })), d);
    expect(d._f.sends()).toHaveLength(3);
  });

  it('다른 계정의 한도는 따로 센다', async () => {
    const d = deps({ hourlyCap: 1 });
    await handleInstagramWebhook(post(payload({ comment: 'A', from: 'U1' }, { comment: 'B', from: 'U2', account: ID_EN })), d);
    expect(d._f.sends()).toHaveLength(2);
  });

  it('카드가 거절되면(400) 같은 내용을 글로 다시 보낸다. 글이 나가면 보낸 것으로 센다', async () => {
    const f = fakeFetch((c, n) => (n === 1 ? Response.json({ error: { code: 100, message: 'Invalid parameter' } }, { status: 400 }) : Response.json({ message_id: 'm' })));
    const d = deps({}, f);
    const res = await handleInstagramWebhook(post(payload({})), d);
    expect(await res.json()).toMatchObject({ sent: 1 });
    const [first, second] = f.sends().map((c) => c.body as { message: Record<string, unknown> });
    expect(first.message).toHaveProperty('attachment');
    expect(second.message).toHaveProperty('text');
    expect(String(second.message.text)).toContain('https://dangolsaju.app/?l=ko&utm_source=instagram&utm_medium=dm&utm_campaign=talisman&utm_content=study');
  });

  it('글까지 거절되면 포기하고 자리를 잡아 둔다(같은 알림이 다시 와도 다시 시도하지 않는다). 200 으로 답한다', async () => {
    const f = fakeFetch(() => Response.json({ error: { code: 100, message: 'x' } }, { status: 400 }));
    const d = deps({}, f);
    const res = await handleInstagramWebhook(post(payload({})), d);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sent: 0, failed: 1 });
    const before = f.sends().length;
    await handleInstagramWebhook(post(payload({})), d);
    expect(f.sends().length).toBe(before);
  });

  it('일시적 실패(5xx, 429, 연결 끊김)는 자리를 비우고 500 으로 답해 Meta 가 다시 보내게 한다. 다시 오면 보낸다', async () => {
    for (const fail of [() => new Response('x', { status: 503 }), () => new Response('x', { status: 429 }), () => { throw new TypeError('network'); }]) {
      let first = true;
      const f = fakeFetch(() => {
        if (first) {
          first = false;
          return fail();
        }
        return Response.json({ message_id: 'm' });
      });
      const d = deps({}, f);
      expect((await handleInstagramWebhook(post(payload({})), d)).status).toBe(500);
      const retry = await handleInstagramWebhook(post(payload({})), d);
      expect(retry.status).toBe(200);
      expect(await retry.json()).toMatchObject({ sent: 1 });
    }
  });

  it('토큰이 만료·거절되면(401, 코드 190) 다시 시도해도 소용없으니 200 으로 답하고, 운영자가 알 수 있게 건수를 남긴다', async () => {
    const f = fakeFetch(() => Response.json({ error: { code: 190, message: 'expired' } }, { status: 401 }));
    const d = deps({}, f);
    const res = await handleInstagramWebhook(post(payload({})), d);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sent: 0, failed: 1, auth_failed: 1 });
  });

  it('저장소가 죽어 있으면 보내지 않고 500 이다(중복 방지를 보장할 수 없다)', async () => {
    const dead: DmStore = {
      claim: async () => { throw new DmStoreError(); },
      release: async () => undefined,
      bump: async () => { throw new DmStoreError(); },
    };
    const d = deps({ store: dead });
    expect((await handleInstagramWebhook(post(payload({})), d)).status).toBe(500);
    expect(d._f.calls).toHaveLength(0);
  });

  it('설정에 없는 계정의 댓글이 오면 설정을 확인하라는 한 줄을 남긴다(아이디는 남기지 않는다)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await handleInstagramWebhook(post(payload({ account: '99999999', from: 'IGSID-777' })), deps());
    const line = warn.mock.calls.flat().join(' ');
    expect(line).toContain('not configured');
    expect(line).not.toContain('99999999');
    expect(line).not.toContain('IGSID-777');
  });

  it('로그와 응답에 이름·댓글 원문·아이디·토큰·시크릿이 없다', async () => {
    const out: string[] = [];
    for (const m of ['log', 'info', 'warn', 'error'] as const) vi.spyOn(console, m).mockImplementation((...a: unknown[]) => void out.push(a.map(String).join(' ')));
    const secrets = ['some_user_name', 'IGSID-111', 'CMT-1', 'MEDIA-1', '시험 공부 때문에 힘들어요', TOKEN_KO, APP_SECRET, ID_KO];
    const bodies: string[] = [];
    const scenarios = [
      fakeFetch(),
      fakeFetch(() => Response.json({ error: { code: 190, message: 'IGSID-111 CMT-1 ' + TOKEN_KO } }, { status: 401 })),
      fakeFetch(() => { throw new Error('network ' + TOKEN_KO + ' IGSID-111'); }),
    ];
    for (const f of scenarios) {
      const res = await handleInstagramWebhook(post(payload({})), deps({}, f));
      bodies.push(await res.text());
    }
    for (const s of secrets) {
      for (const line of [...out, ...bodies]) expect(line).not.toContain(s);
    }
  });
});

describe('Upstash 저장소(가짜 fetch)', () => {
  function fakeRedis(results: Array<unknown | 'error'>) {
    const sent: string[][] = [];
    const fetcher = (async (_u: RequestInfo | URL, init?: RequestInit) => {
      sent.push(JSON.parse(String(init?.body)));
      const r = results.shift();
      return r === 'error' ? new Response('{"error":"ERR secret-stuff"}', { status: 400 }) : Response.json({ result: r ?? null });
    }) as typeof fetch;
    return { fetcher, sent };
  }

  it('claim 은 SET NX EX, 이미 있으면 false', async () => {
    const r = fakeRedis(['OK', null]);
    const s = createUpstashDmStore({ url: 'https://x.upstash.io', token: 't', fetch: r.fetcher });
    expect(await s.claim('k', 60)).toBe(true);
    expect(await s.claim('k', 60)).toBe(false);
    expect(r.sent[0]).toEqual(['SET', 'k', '1', 'NX', 'EX', '60']);
  });

  it('bump 은 INCR 하고 처음일 때만 EXPIRE, release 는 DEL', async () => {
    const r = fakeRedis([1, 1, 2, 1]);
    const s = createUpstashDmStore({ url: 'https://x.upstash.io', token: 't', fetch: r.fetcher });
    expect(await s.bump('r', 7200)).toBe(1);
    expect(await s.bump('r', 7200)).toBe(2);
    await s.release('k');
    expect(r.sent.map((c) => c[0])).toEqual(['INCR', 'EXPIRE', 'INCR', 'DEL']);
  });

  it('실패하면 내용 없이 DmStoreError 만 던진다', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const s = createUpstashDmStore({ url: 'https://x.upstash.io', token: 'tok-secret', fetch: fakeRedis(['error']).fetcher });
    await expect(s.claim('k', 1)).rejects.toBeInstanceOf(DmStoreError);
    expect(err.mock.calls.flat().join(' ')).not.toContain('secret');
  });

  it('환경변수(UPSTASH_ 또는 KV_REST_API_)가 있으면 그것을 쓴다', () => {
    expect(makeDmStore({ VERCEL: '1', UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', UPSTASH_REDIS_REST_TOKEN: 't' })).not.toBeNull();
    expect(makeDmStore({ VERCEL: '1', KV_REST_API_URL: 'https://x.upstash.io', KV_REST_API_TOKEN: 't' })).not.toBeNull();
  });
});
