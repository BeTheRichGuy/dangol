import { describe, expect, it } from 'vitest';
import { computeChart } from '@/lib/saju';
import { chartBlock } from '@/lib/rooms/payload';
import type { SavedReading } from '@/lib/account/types';
import { giftPlan, type GiftPlan } from '@/lib/talisman';
import { LEDGER_KEY, POUCH_KEY, addToPouch, giftPlanOfReading, giveGift, parseLedger, parsePouch, sortedIds } from '@/lib/talisman/shelf';

function memory(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}

const SEOUL = { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul', label: 'Seoul, KR' };
function reading(kind: SavedReading['kind'], date = '1994-03-12', concern: string | null = null): Pick<SavedReading, 'kind' | 'people' | 'concern'> & { question?: string } {
  return { kind, concern, people: [{ id: null, name: '하나', relation: 'self', date, time: '10:00', place: SEOUL, sex: null }] };
}

describe('주머니', () => {
  it('도감 순서로 정렬하고 겹치는 것과 모르는 값을 버린다', () => {
    expect(sortedIds(['mind', 'water', 'water', 'health', 7, 'wood'])).toEqual(['wood', 'water', 'mind']);
    expect(parsePouch('["love","fire","fire","nope"]')).toEqual(['fire', 'love']);
    expect(parsePouch('not json')).toEqual([]);
    expect(parsePouch('{"a":1}')).toEqual([]);
    expect(parsePouch(null)).toEqual([]);
  });

  it('더한 것이 합쳐져 남고 새로 더해진 것이 없으면 다시 쓰지 않는다', () => {
    const store = memory();
    expect(addToPouch(store, ['water', 'love'])).toEqual(['water', 'love']);
    expect(JSON.parse(store.data[POUCH_KEY])).toEqual(['water', 'love']);
    expect(addToPouch(store, ['wood'])).toEqual(['wood', 'water', 'love']);
    let writes = 0;
    const counting = { getItem: store.getItem, setItem: () => void (writes += 1) };
    expect(addToPouch(counting, ['wood', 'water'])).toEqual(['wood', 'water', 'love']);
    expect(writes).toBe(0);
  });

  it('저장소가 막혀 있어도 오류 없이 넘어간다', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(addToPouch(broken, ['water'])).toEqual([]);
    const readonly = { getItem: () => null, setItem: () => { throw new Error('full'); } };
    expect(addToPouch(readonly, ['water'])).toEqual([]);
  });
});

const plan = (key: string, ids: Array<[GiftPlan['candidates'][number]['id'], GiftPlan['candidates'][number]['reason']]>): GiftPlan => ({
  key,
  candidates: ids.map(([id, reason]) => ({ id, reason })),
});

describe('보고서 한 편이 건네는 부적', () => {
  it('아직 못 받은 후보 중 앞에서 하나만 주머니와 장부에 적는다', () => {
    const store = memory();
    const p = plan('free:a', [['earth', 'missing'], ['water', 'missing'], ['love', 'asked']]);
    expect(giveGift(store, p)).toEqual({ id: 'earth', reason: 'missing' });
    expect(parsePouch(store.data[POUCH_KEY])).toEqual(['earth']);
    expect(parseLedger(store.data[LEDGER_KEY])).toEqual({ 'free:a': { id: 'earth', reason: 'missing' } });
  });

  it('같은 보고서를 다시 열어도(새로고침·보관함) 같은 부적이고 하나가 더 늘지 않는다', () => {
    const store = memory();
    const p = plan('love:a', [['earth', 'missing'], ['water', 'missing']]);
    const first = giveGift(store, p);
    expect(giveGift(store, p)).toEqual(first);
    expect(giveGift(store, p)).toEqual(first);
    expect(parsePouch(store.data[POUCH_KEY])).toEqual(['earth']);
  });

  it('다른 보고서는 이미 받은 부적을 건너뛰고 다음 후보를 준다', () => {
    const store = memory();
    const ids: Array<['earth' | 'water' | 'love', 'missing' | 'asked']> = [['earth', 'missing'], ['water', 'missing'], ['love', 'asked']];
    expect(giveGift(store, plan('free:a', ids))?.id).toBe('earth');
    expect(giveGift(store, plan('love:a', ids))?.id).toBe('water');
    expect(giveGift(store, plan('year:a', ids))?.id).toBe('love');

    expect(giveGift(store, plan('decades:a', ids))).toBeNull();
    expect(Object.keys(parseLedger(store.data[LEDGER_KEY]))).toEqual(['free:a', 'love:a', 'year:a']);
    expect(parsePouch(store.data[POUCH_KEY])).toEqual(['earth', 'water', 'love']);
  });

  it('다른 풀이로 이미 가진 부적은 다시 주지 않는다', () => {
    const store = memory({ [POUCH_KEY]: '["earth"]' });
    expect(giveGift(store, plan('free:b', [['earth', 'missing'], ['mind', 'gap']]))?.id).toBe('mind');
  });

  it('장부는 200편까지만 남기고 오래된 것부터 지운다(받은 부적은 주머니에 그대로)', () => {
    const store = memory();
    const only = (n: number) => plan(`free:${n}`, [['wood', 'missing']]);
    giveGift(store, only(0));
    const ledger = Object.fromEntries(Array.from({ length: 200 }, (_, n) => [`old:${n}`, { id: 'wood', reason: 'missing' }]));
    store.data[LEDGER_KEY] = JSON.stringify(ledger);
    store.data[POUCH_KEY] = '[]';
    giveGift(store, only(1));
    const keys = Object.keys(parseLedger(store.data[LEDGER_KEY]));
    expect(keys).toHaveLength(200);
    expect(keys).toContain('free:1');
    expect(keys).not.toContain('old:0');
  });

  it('장부가 깨져 있거나 저장소가 막혀 있어도 오류 없이 넘어간다', () => {
    expect(parseLedger('not json')).toEqual({});
    expect(parseLedger('[1,2]')).toEqual({});
    expect(parseLedger(JSON.stringify({ a: { id: 'health', reason: 'gap' }, b: { id: 'water', reason: 'nope' }, c: { id: 'water', reason: 'gap' } }))).toEqual({ c: { id: 'water', reason: 'gap' } });
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(giveGift(broken, plan('free:a', [['earth', 'missing']]))).toBeNull();
    const full = { getItem: () => null, setItem: () => { throw new Error('full'); } };
    expect(giveGift(full, plan('free:a', [['earth', 'missing']]))).toBeNull();
  });
});

describe('보관함 풀이에서 같은 보고서 알아보기', () => {
  it('같은 풀이면 같은 열쇠와 후보이고 오행 부적이 하나 이상이다', () => {
    const a = giftPlanOfReading(reading('free', '1994-03-12', 'money'));
    expect(giftPlanOfReading(reading('free', '1994-03-12', 'money'))).toEqual(a);
    expect(a?.candidates.length).toBeGreaterThan(0);
    expect(a?.candidates.map((g) => g.id)).toContain('wealth');
    expect(a?.key.startsWith('free:')).toBe(true);
  });

  it('방 풀이는 방으로 정한다(연 방은 연애 부적, 해와 달 방은 사람 부적)', () => {
    const love = giftPlanOfReading(reading('love'));
    expect(love?.key.startsWith('love:')).toBe(true);
    expect(love?.candidates.map((g) => g.id)).toContain('love');
    expect(giftPlanOfReading(reading('match'))?.candidates.map((g) => g.id)).toContain('bond');
  });

  it('결제 직후 화면이 쓰는 열쇠와 보관함에서 다시 연 열쇠가 같다(같은 사람·방·질문)', () => {
    const r = { ...reading('life', '1994-03-12'), question: '  이직을 해도 될까요 ' };
    const p = r.people[0];
    const block = chartBlock(computeChart({ date: p.date, time: p.time, place: p.place, sex: p.sex }));
    const live = giftPlan({ chart: block, room: 'life', question: '이직을 해도 될까요' });
    expect(giftPlanOfReading(r)).toEqual(live);
  });

  it('사람이 없거나 날짜가 잘못된 풀이는 계획이 없다', () => {
    expect(giftPlanOfReading({ kind: 'free', concern: null, people: [] })).toBeNull();
    expect(giftPlanOfReading(reading('free', 'garbage'))).toBeNull();
  });
});
