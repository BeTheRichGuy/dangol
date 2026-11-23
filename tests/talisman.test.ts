import { describe, expect, it } from 'vitest';
import { computeChart } from '@/lib/saju';
import { chartBlock } from '@/lib/rooms/payload';
import { CONCERN_KEYS } from '@/lib/reading/concerns';
import { AREA_IDS, ELEMENT_IDS, GLYPH, TALISMAN_IDS, isElementTalisman, giftPlan, isTalismanId, pickGift, talismansFor, type TalismanChart } from '@/lib/talisman';

const ALL_ONE: TalismanChart['elements'] = { wood: 2, fire: 2, earth: 2, metal: 1, water: 1 };
const GODS_FULL: TalismanChart['godCounts'] = { peer: 2, output: 1, wealth: 2, power: 1, resource: 1 };

function chart(elements: Partial<TalismanChart['elements']> = {}, gods: Partial<TalismanChart['godCounts']> = {}): TalismanChart {
  return { elements: { ...ALL_ONE, ...elements }, godCounts: { ...GODS_FULL, ...gods } };
}

describe('부적 목록', () => {
  it('열한 장이고 이름이 겹치지 않으며 모두 한자 한 글자가 있다', () => {
    expect(TALISMAN_IDS).toHaveLength(11);
    expect(new Set(TALISMAN_IDS).size).toBe(11);
    expect(ELEMENT_IDS).toHaveLength(5);
    expect(AREA_IDS).toHaveLength(6);
    for (const id of TALISMAN_IDS) expect([...GLYPH[id]]).toHaveLength(1);
  });

  it('isTalismanId 는 모르는 값을 거른다', () => {
    expect(isTalismanId('water')).toBe(true);
    expect(isTalismanId('love')).toBe(true);
    expect(isTalismanId('health')).toBe(false);
    expect(isTalismanId(null)).toBe(false);
    expect(isElementTalisman('water')).toBe(true);
    expect(isElementTalisman('love')).toBe(false);
  });
});

describe('오행 부적', () => {
  it('사주에 하나도 없는 오행은 모두 준다(물과 흙이 없으면 둘 다)', () => {
    const gifts = talismansFor({ chart: chart({ earth: 0, water: 0, wood: 3, fire: 3, metal: 2 }) });
    expect(gifts.filter((g) => isElementTalisman(g.id))).toEqual([
      { id: 'earth', reason: 'missing' },
      { id: 'water', reason: 'missing' },
    ]);
  });

  it('하나도 없는 오행이 없으면 가장 적은 오행 하나만 준다(같으면 나무·불·흙·쇠·물 순)', () => {
    const gifts = talismansFor({ chart: chart() });
    expect(gifts.filter((g) => isElementTalisman(g.id))).toEqual([{ id: 'metal', reason: 'weakest' }]);
    const one = talismansFor({ chart: chart({ wood: 3, fire: 1, earth: 2, metal: 1, water: 1 }) });
    expect(one.filter((g) => isElementTalisman(g.id))).toEqual([{ id: 'fire', reason: 'weakest' }]);
  });

  it('오행 부적은 언제나 하나 이상이고 분야 부적보다 앞에 온다', () => {
    const gifts = talismansFor({ chart: chart({}, { wealth: 0 }), concern: 'love' });
    expect(isElementTalisman(gifts[0].id)).toBe(true);
    const firstArea = gifts.findIndex((g) => !isElementTalisman(g.id));
    expect(gifts.slice(firstArea).every((g) => !isElementTalisman(g.id))).toBe(true);
  });
});

describe('분야 부적', () => {
  it('고른 고민이 곧 분야다: 연애 묶음 다섯은 연애, 일·돈·공부·사람, 변화와 나는 마음', () => {
    const areaOf = (concern: string) => talismansFor({ chart: chart(), concern }).filter((g) => g.reason === 'asked').map((g) => g.id);
    for (const c of ['love', 'crush', 'ex', 'partner', 'marriage']) expect(areaOf(c)).toEqual(['love']);
    expect(areaOf('work')).toEqual(['work']);
    expect(areaOf('money')).toEqual(['wealth']);
    expect(areaOf('study')).toEqual(['study']);
    expect(areaOf('people')).toEqual(['bond']);
    expect(areaOf('change')).toEqual(['mind']);
    expect(areaOf('self')).toEqual(['mind']);
  });

  it('고민 열한 가지 모두 분야가 있고 모르는 값은 물어본 분야로 치지 않는다', () => {
    for (const c of CONCERN_KEYS) expect(talismansFor({ chart: chart(), concern: c }).some((g) => g.reason === 'asked')).toBe(true);
    expect(talismansFor({ chart: chart(), concern: 'health' }).some((g) => g.reason === 'asked')).toBe(false);
    expect(talismansFor({ chart: chart(), concern: null }).some((g) => g.reason === 'asked')).toBe(false);
  });

  it('연 방은 연애, 해와 달 방은 사람 사이를 물어본 것으로 본다. 다른 방은 사주의 빈자리만 본다', () => {
    expect(talismansFor({ chart: chart(), room: 'love' }).filter((g) => g.reason === 'asked')).toEqual([{ id: 'love', reason: 'asked' }]);
    expect(talismansFor({ chart: chart(), room: 'match' }).filter((g) => g.reason === 'asked')).toEqual([{ id: 'bond', reason: 'asked' }]);
    for (const room of ['life', 'decades', 'year'] as const) {
      expect(talismansFor({ chart: chart(), room }).some((g) => g.reason === 'asked')).toBe(false);
    }
  });

  it('그 갈래의 글자가 하나도 없으면 그 분야 부적을 준다(재성→재물, 관성→일, 인성→학업, 비겁→사람, 식상→마음)', () => {
    const gapOf = (god: keyof TalismanChart['godCounts']) =>
      talismansFor({ chart: chart({}, { [god]: 0 }) }).filter((g) => g.reason === 'gap').map((g) => g.id);
    expect(gapOf('wealth')).toEqual(['wealth']);
    expect(gapOf('power')).toEqual(['work']);
    expect(gapOf('resource')).toEqual(['study']);
    expect(gapOf('peer')).toEqual(['bond']);
    expect(gapOf('output')).toEqual(['mind']);
  });

  it('갈래가 다 있고 물어본 것도 없으면 분야 부적은 없다', () => {
    expect(talismansFor({ chart: chart() }).filter((g) => !isElementTalisman(g.id))).toEqual([]);
  });

  it('물어본 분야가 빈자리와 겹치면 한 번만, 물어본 쪽으로 주고 물어본 분야가 앞에 온다', () => {
    const gifts = talismansFor({ chart: chart({}, { wealth: 0, resource: 0 }), concern: 'money' }).filter((g) => !isElementTalisman(g.id));
    expect(gifts).toEqual([
      { id: 'wealth', reason: 'asked' },
      { id: 'study', reason: 'gap' },
    ]);
  });

  it('건강 부적은 없다(질병은 읽지 않는다)', () => {
    expect(TALISMAN_IDS.some((id) => /health|body|illness/.test(id))).toBe(false);
  });
});

describe('실제 사주', () => {
  const SEOUL = { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' };

  it('같은 사주면 같은 부적이고, 사주마다 오행 부적이 하나 이상, 아무리 많아도 열한 장을 넘지 않는다', () => {
    let totalElements = 0;
    for (let y = 1960; y < 2005; y += 1) {
      const block = chartBlock(computeChart({ date: `${y}-0${(y % 9) + 1}-1${y % 9}`, time: y % 2 ? '10:00' : null, place: SEOUL, sex: null }));
      const a = talismansFor({ chart: block, concern: 'money' });
      expect(talismansFor({ chart: block, concern: 'money' })).toEqual(a);
      const elements = a.filter((g) => isElementTalisman(g.id));
      expect(elements.length).toBeGreaterThanOrEqual(1);
      expect(elements.length).toBe(block.missing.length || 1);
      expect(new Set(a.map((g) => g.id)).size).toBe(a.length);
      expect(a.length).toBeLessThanOrEqual(11);
      totalElements += elements.length;
    }
    expect(totalElements).toBeGreaterThan(45);
  });
});

describe('보고서 한 편에 부적 하나', () => {
  it('후보는 talismansFor 순서 그대로고, 열쇠는 방·네 기둥·고민(질문)이 같으면 같다', () => {
    const c = { ...chart({ earth: 0 }), pillars: [{ stem: '갑' }, { stem: '을' }] };
    const a = giftPlan({ chart: c, concern: 'money' });
    expect(a.candidates).toEqual(talismansFor({ chart: c, concern: 'money' }));
    expect(giftPlan({ chart: c, concern: 'money' }).key).toBe(a.key);
    expect(giftPlan({ chart: c, concern: 'love' }).key).not.toBe(a.key);
    expect(giftPlan({ chart: c, room: 'love' }).key).not.toBe(a.key);
    expect(giftPlan({ chart: { ...c, pillars: [{ stem: '병' }] }, concern: 'money' }).key).not.toBe(a.key);

    const q = (question: string) => giftPlan({ chart: c, room: 'life', question }).key;
    expect(q('이직할까요')).not.toBe(q('연애는요'));
    expect(q('  이직할까요 ')).toBe(q('이직할까요'));
    expect(q('가'.repeat(300) + '나')).toBe(q('가'.repeat(300)));
  });

  it('후보 가운데 아직 못 받은 것을 앞에서 하나만 건넨다', () => {
    const { candidates } = giftPlan({ chart: chart({ earth: 0, water: 0 }), concern: 'money' });
    expect(candidates.map((g) => g.id)).toEqual(['earth', 'water', 'wealth']);
    expect(pickGift(candidates, [])).toEqual({ id: 'earth', reason: 'missing' });
    expect(pickGift(candidates, ['earth'])).toEqual({ id: 'water', reason: 'missing' });
    expect(pickGift(candidates, ['earth', 'water'])).toEqual({ id: 'wealth', reason: 'asked' });
  });

  it('후보를 다 받았으면 아무것도 건네지 않는다', () => {
    const { candidates } = giftPlan({ chart: chart({ earth: 0 }) });
    expect(pickGift(candidates, ['earth'])).toBeNull();
    expect(pickGift([], [])).toBeNull();
  });
});
