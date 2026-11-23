import { describe, expect, it } from 'vitest';
import { addClaim, guestSnapshot, hasClaims, putBack, takeClaims, type GuestClaim } from '../src/lib/account/guest-claim';

function memoryStore(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, v),
  };
}

const input = { date: '1997-09-12', time: '14:30', place: { name: 'Seoul', country: 'KR', lat: 37.56, lng: 126.97, tz: 'Asia/Seoul' }, sex: 'female' as const };
const claim = (key: string, body = '본문'): GuestClaim => ({
  key,
  draft: { kind: 'love', locale: 'ko', people: [guestSnapshot('달이', input, 'self')], question: '', body, concern: null, nowIso: '2026-11-16T00:00:00.000Z' },
});

describe('비회원 풀이 옮기기', () => {
  it('쌓고, 같은 풀이는 하나로, 꺼내면 비운다', () => {
    const s = memoryStore();
    addClaim(s, claim('love:r1', 'a'));
    addClaim(s, claim('love:r1', 'b'));
    addClaim(s, claim('life:r2'));
    expect(hasClaims(s)).toBe(true);
    const got = takeClaims(s);
    expect(got.map((c) => c.key)).toEqual(['love:r1', 'life:r2']);
    expect(got[0].draft.body).toBe('b');
    expect(hasClaims(s)).toBe(false);
  });
  it('옮기다 실패한 것은 되돌려 다음 로그인 때 다시', () => {
    const s = memoryStore();
    putBack(s, [claim('love:r1')]);
    expect(takeClaims(s).map((c) => c.key)).toEqual(['love:r1']);
  });
  it('비회원 입력을 보관함의 사람 모습으로(저장된 사람이 아니라 id 없음)', () => {
    expect(guestSnapshot('달이', input, 'self')).toEqual({ id: null, name: '달이', relation: 'self', date: '1997-09-12', time: '14:30', place: { name: 'Seoul', country: 'KR', lat: 37.56, lng: 126.97, tz: 'Asia/Seoul', label: 'Seoul' }, sex: 'female' });
  });
  it('망가진 저장값은 무시한다', () => {
    const s = memoryStore();
    s.setItem('dangol.claim.v1', '{broken');
    expect(takeClaims(s)).toEqual([]);
  });
});
