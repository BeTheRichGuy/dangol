import { describe, expect, it } from 'vitest';
import { LOCALES } from '@/content/locale';
import { REUNION_EN } from '@/content/en/reunion';
import { REUNION_JA } from '@/content/ja/reunion';
import { REUNION_KO } from '@/content/ko/reunion';
import { RESULT_ART } from '@/components/reunion/result-art';
import { computeChart, type BirthInput } from '@/lib/saju';
import { crossBlock, type CrossBlock } from '@/lib/rooms/payload';
import { REUNION_ART } from '@/lib/reunion/art';
import { CONTACT_IDS, WANT_IDS } from '@/lib/reunion/intake';
import { FILLED_KEYS, FLOW_KEYS, FRAYED_KEYS, filledKey, frayedKey, pickReunion } from '@/lib/reunion/pick';
import type { Relation } from '@/lib/saju/details';

const COPY = { ko: REUNION_KO, en: REUNION_EN, ja: REUNION_JA };

const stems = (over: Partial<CrossBlock['dayStems']> = {}): CrossBlock['dayStems'] =>
  ({
    self: '甲',
    other: '乙',
    otherToSelf: '정관',
    selfToOther: '겁재',
    flow: 'same',
    combine: false,
    clash: false,
    ...over,
  }) as CrossBlock['dayStems'];

const rel = (kind: Relation['kind'], at: string[]): Relation => ({ kind, chars: '', at, element: null });

describe('어긋난 자리 갈래', () => {
  it('아무 관계도 없으면 calm', () => {
    expect(frayedKey({ dayStems: stems(), relations: [] })).toBe('calm');
  });

  it('일간 충이나 지지 충이 가장 무거우면 clash', () => {
    expect(frayedKey({ dayStems: stems({ clash: true }), relations: [] })).toBe('clash');
    expect(frayedKey({ dayStems: stems(), relations: [rel('沖', ['self.day', 'other.day'])] })).toBe('clash');
  });

  it('형·파·해·원진·귀문은 friction', () => {
    for (const k of ['刑', '自刑', '破', '害', '怨嗔', '鬼門'] as const) {
      expect(frayedKey({ dayStems: stems(), relations: [rel(k, ['self.month', 'other.month'])] })).toBe('friction');
    }
  });

  it('합만 있으면 combine', () => {
    expect(frayedKey({ dayStems: stems({ combine: true }), relations: [] })).toBe('combine');
    expect(frayedKey({ dayStems: stems(), relations: [rel('六合', ['self.day', 'other.day'])] })).toBe('combine');
  });

  it('자리 가중으로 센다: 일지 합(2)이 연지 충(0.75)을 이긴다', () => {
    const relations = [rel('沖', ['self.year', 'other.year']), rel('六合', ['self.day', 'other.day'])];
    expect(frayedKey({ dayStems: stems(), relations })).toBe('combine');
  });

  it('같은 무게면 충 > 긁힘 > 끌림', () => {
    const at = ['self.day', 'other.day'];
    expect(frayedKey({ dayStems: stems(), relations: [rel('沖', at), rel('刑', at), rel('六合', at)] })).toBe('clash');
    expect(frayedKey({ dayStems: stems(), relations: [rel('刑', at), rel('六合', at)] })).toBe('friction');
  });
});

describe('채워 주던 것 갈래', () => {
  it('네 갈래', () => {
    expect(filledKey({ fills: { selfMissingOtherHas: ['fire'], otherMissingSelfHas: ['water'] } })).toBe('both');
    expect(filledKey({ fills: { selfMissingOtherHas: ['fire'], otherMissingSelfHas: [] } })).toBe('theyFilled');
    expect(filledKey({ fills: { selfMissingOtherHas: [], otherMissingSelfHas: ['water'] } })).toBe('iFilled');
    expect(filledKey({ fills: { selfMissingOtherHas: [], otherMissingSelfHas: [] } })).toBe('neither');
  });
});

describe('다섯 갈래 고르기', () => {
  const place = { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' };
  const ME: BirthInput = { date: '1998-03-21', time: '14:30', place, sex: null };
  const THEM: BirthInput = { date: '1996-11-02', time: null, place, sex: null };

  it('같은 입력이면 같은 갈래, 점수는 내놓지 않는다', () => {
    const a = pickReunion(crossBlock(computeChart(ME), computeChart(THEM)), { contact: 'ignored', want: 'reunite' });
    const b = pickReunion(crossBlock(computeChart(ME), computeChart(THEM)), { contact: 'ignored', want: 'reunite' });
    expect(a).toEqual(b);
    expect(Object.keys(a).sort()).toEqual(['contact', 'filled', 'flow', 'frayed', 'want']);
    expect(FLOW_KEYS).toContain(a.flow);
    expect(FRAYED_KEYS).toContain(a.frayed);
    expect(FILLED_KEYS).toContain(a.filled);
    expect(a.contact).toBe('ignored');
    expect(a.want).toBe('reunite');
  });
});

describe('갈래마다 문구가 있다', () => {
  for (const l of LOCALES) {
    it(`${l}: flow·filled·frayed·contact·want 카드와 관계 이름표`, () => {
      const r = COPY[l].result;
      for (const k of FLOW_KEYS) expect(r.flow[k].title && r.flow[k].body).toBeTruthy();
      for (const k of FILLED_KEYS) expect(r.filled[k].title && r.filled[k].body).toBeTruthy();
      for (const k of FRAYED_KEYS) {
        expect(r.frayed[k].title && r.frayed[k].body).toBeTruthy();
        expect(r.labels[k].name && r.labels[k].tagline).toBeTruthy();
      }
      for (const k of CONTACT_IDS) expect(r.contact[k].title && r.contact[k].body).toBeTruthy();
      for (const k of WANT_IDS) expect(r.want[k].title && r.want[k].body).toBeTruthy();
      expect(r.locked).toHaveLength(3);
    });
  }
});

describe('결과 카드 그림', () => {
  it('다섯 장은 서로 다르고 모두 그림 배치표에 있다', () => {
    const names = Object.values(RESULT_ART);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(REUNION_ART[n]).toBeDefined();
  });
});
