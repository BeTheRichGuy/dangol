import { describe, expect, it } from 'vitest';
import { buildRoomPayload } from '@/lib/rooms/payload';
import { computeChart, type BirthInput } from '@/lib/saju';
import { confirmDodo } from '../src/components/rooms/dodo-checkout';
import { clearPayReturn, isTransientConfirmFailure, loadPayReturn, savePayReturn, type PayReturn } from '../src/components/rooms/pay-return';
import { confirmToss } from '../src/components/rooms/toss-checkout';

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

const TOSS: PayReturn = { provider: 'toss', ret: { paymentKey: 'tgen_abc123', orderId: 'dg_0123456789abcdef_AAAAAAAAAAAAAAAAAAAAAA', amount: 4900 } };
const DODO: PayReturn = { provider: 'dodo', ret: { paymentId: 'pay_abc123' } };

describe('남겨 둔 결제 값', () => {
  it('넣은 것을 그대로 꺼내고, 지우면 없다', () => {
    const s = memoryStorage();
    savePayReturn(s, 'life', TOSS);
    expect(loadPayReturn(s, 'life')).toEqual(TOSS);
    savePayReturn(s, 'love', DODO);
    expect(loadPayReturn(s, 'love')).toEqual(DODO);
    clearPayReturn(s, 'life');
    expect(loadPayReturn(s, 'life')).toBeNull();
    expect(loadPayReturn(s, 'love')).toEqual(DODO);
  });

  it('방마다 따로이고, 다른 방 값은 읽지 않는다', () => {
    const s = memoryStorage();
    savePayReturn(s, 'life', DODO);
    expect(loadPayReturn(s, 'decades')).toBeNull();
  });

  it('깨졌거나 손으로 고친 값은 없는 것으로 본다(주소에서 읽을 때와 같은 검사)', () => {
    const s = memoryStorage();
    const k = 'dangol.payret.life.v1';
    for (const bad of [
      '{not json',
      'null',
      JSON.stringify({ provider: 'toss' }),
      JSON.stringify({ provider: 'toss', ret: { paymentKey: 'k', orderId: 'o', amount: '4900' } }),
      JSON.stringify({ provider: 'toss', ret: { paymentKey: '', orderId: 'o', amount: 4900 } }),
      JSON.stringify({ provider: 'dodo', ret: { paymentId: 'not-a-payment' } }),
      JSON.stringify({ provider: 'dodo', ret: { paymentId: 'pay_ab' } }),
      JSON.stringify({ provider: 'paddle', ret: { paymentId: 'pay_abc123' } }),
    ]) {
      s.setItem(k, bad);
      expect(loadPayReturn(s, 'life')).toBeNull();
    }
  });

  it('저장소를 못 써도 던지지 않는다', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(() => savePayReturn(broken, 'life', DODO)).not.toThrow();
    expect(() => clearPayReturn(broken, 'life')).not.toThrow();
    expect(loadPayReturn(broken, 'life')).toBeNull();
  });
});

describe('다시 확인할 실패인가', () => {
  it('응답이 없거나(연결 끊김) 서버 오류(5xx), 아직 처리 중(409 pending)이면 예', () => {
    expect(isTransientConfirmFailure(new TypeError('Failed to fetch'))).toBe(true);
    expect(isTransientConfirmFailure(Object.assign(new Error('confirm'), { code: 'http_502', status: 502 }))).toBe(true);
    expect(isTransientConfirmFailure(Object.assign(new Error('confirm'), { code: 'http_503', status: 503 }))).toBe(true);
    expect(isTransientConfirmFailure(Object.assign(new Error('confirm'), { code: 'pending', status: 409 }))).toBe(true);
  });

  it('서버가 틀렸다고 답한 것(402·401·400)은 아니오: 같은 값으로 물어도 같은 답이다', () => {
    expect(isTransientConfirmFailure(Object.assign(new Error('confirm'), { code: 'mismatch', status: 402 }))).toBe(false);
    expect(isTransientConfirmFailure(Object.assign(new Error('confirm'), { code: 'refunded', status: 402 }))).toBe(false);
    expect(isTransientConfirmFailure(Object.assign(new Error('confirm'), { code: 'http_401', status: 401 }))).toBe(false);
    expect(isTransientConfirmFailure(Object.assign(new Error('confirm'), { code: 'http_400', status: 400 }))).toBe(false);

    expect(isTransientConfirmFailure(Object.assign(new Error('confirm'), { code: 'other', status: 409 }))).toBe(false);
  });
});

describe('확인 요청이 던지는 오류에 HTTP 상태가 실린다', () => {
  const input: BirthInput = { date: '1995-03-14', time: '09:30', place: { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' }, sex: 'female' };
  const payload = buildRoomPayload({ room: 'life', locale: 'en', chart: computeChart(input), nowIso: '2026-11-02T00:00:00Z', question: '', partner: null });
  const noSleep = async () => undefined;

  it('Dodo: 서버 오류는 5xx 상태, 거절은 402, 계속 처리 중이면 409 pending', async () => {
    const err = (answers: Response[]) => confirmDodo(payload, { paymentId: 'pay_abc123' }, null, { fetcher: (async () => answers.shift() ?? new Response('{}', { status: 500 })) as typeof fetch, sleep: noSleep }).catch((e: unknown) => e);
    const e502 = await err([new Response('<html>', { status: 502 })]);
    expect(e502).toMatchObject({ code: 'http_502', status: 502 });
    expect(isTransientConfirmFailure(e502)).toBe(true);
    const e402 = await err([Response.json({ error: 'payment_failed', code: 'mismatch' }, { status: 402 })]);
    expect(e402).toMatchObject({ code: 'mismatch', status: 402 });
    expect(isTransientConfirmFailure(e402)).toBe(false);
    const ePending = await err(Array.from({ length: 20 }, () => Response.json({ error: 'pending' }, { status: 409 })));
    expect(ePending).toMatchObject({ code: 'pending', status: 409 });
    expect(isTransientConfirmFailure(ePending)).toBe(true);
  });

  it('Dodo: 연결이 끊기면(fetch 가 던짐) 상태가 없고 다시 확인할 실패다', async () => {
    const e = await confirmDodo(payload, { paymentId: 'pay_abc123' }, null, {
      fetcher: (async () => {
        throw new TypeError('Failed to fetch');
      }) as typeof fetch,
      sleep: noSleep,
    }).catch((x: unknown) => x);
    expect(isTransientConfirmFailure(e)).toBe(true);
  });

  it('토스: 상태가 실린다', async () => {
    const real = globalThis.fetch;
    try {
      globalThis.fetch = (async () => Response.json({ error: 'payment_failed', code: 'ALREADY_PROCESSED_PAYMENT' }, { status: 402 })) as typeof fetch;
      const e = await confirmToss(payload, TOSS.provider === 'toss' ? TOSS.ret : { paymentKey: 'k', orderId: 'o', amount: 4900 }, null).catch((x: unknown) => x);
      expect(e).toMatchObject({ code: 'ALREADY_PROCESSED_PAYMENT', status: 402 });
      expect(isTransientConfirmFailure(e)).toBe(false);
      globalThis.fetch = (async () => new Response('', { status: 503 })) as typeof fetch;
      const e503 = await confirmToss(payload, { paymentKey: 'k', orderId: 'o', amount: 4900 }, null).catch((x: unknown) => x);
      expect(e503).toMatchObject({ status: 503 });
      expect(isTransientConfirmFailure(e503)).toBe(true);
    } finally {
      globalThis.fetch = real;
    }
  });
});
