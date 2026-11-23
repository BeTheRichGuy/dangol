import { describe, expect, it } from 'vitest';
import { XMAS_CONTACTS, XMAS_GOALS, XMAS_STAGES, asksContact, parseXmasRelation, xmasMoves, xmasTier } from '@/lib/xmas/relation';
import { XMAS_SEASON, daysToClose, kstDate, xmasAskDays, xmasOnSale, xmasPhase } from '@/lib/xmas/season';
import type { XmasDay } from '@/lib/xmas/pulls';

describe('관계 행동표', () => {
  it('단계 5 × 목표 4 = 20칸이 모두 찬다', () => {
    for (const stage of XMAS_STAGES)
      for (const goal of XMAS_GOALS) {
        const m = xmasMoves({ stage, goal, contact: null });
        expect(m.now && m.contact && m.ask && m.goal).toBeTruthy();
        expect(m.avoid.length).toBeGreaterThanOrEqual(3);
      }
  });

  it('멀리서 좋아하는 사이에는 둘만의 크리스마스 약속을 권하지 않는다', () => {
    const m = xmasMoves({ stage: 'far', goal: 'meet', contact: null });
    expect(m.ask).toMatch(/Do not ask for a one-on-one/);
    expect(m.adjust).toMatch(/group plan/);
  });

  it('멀어진 사이는 재회를 약속하지 않고, 답이 없으면 다시 보내지 말라고 한다', () => {
    const m = xmasMoves({ stage: 'past', goal: 'meet', contact: 'rarely' });
    expect(m.now).toMatch(/Never promise or predict getting back together/);
    expect(m.avoid.join(' ')).toMatch(/sending again after no reply/);
    expect(m.pace).toMatch(/rarely/);
  });

  it('조종·떠보기를 권하는 칸이 없다(하지 말 것에만 있다)', () => {
    for (const stage of XMAS_STAGES)
      for (const goal of XMAS_GOALS) {
        const m = xmasMoves({ stage, goal, contact: null });
        for (const line of [m.now, m.contact, m.ask, m.goal, m.adjust ?? '']) expect(line).not.toMatch(/jealous|make them wait|test them/i);
      }
  });

  it('연락은 친구·자주 마주침·멀어짐일 때만 묻고, 그 밖에 값이 오면 거절한다', () => {
    expect(XMAS_STAGES.filter(asksContact)).toEqual(['friend', 'daily', 'past']);
    expect(parseXmasRelation({ stage: 'friend', goal: 'confess', contact: 'often' })).toEqual({ stage: 'friend', goal: 'confess', contact: 'often' });
    expect(parseXmasRelation({ stage: 'friend', goal: 'confess', contact: null })).not.toBeNull();
    expect(parseXmasRelation({ stage: 'talking', goal: 'meet', contact: 'often' })).toBeNull();
    expect(parseXmasRelation({ stage: 'crush', goal: 'meet', contact: null })).toBeNull();
    expect(parseXmasRelation({ stage: 'far', goal: 'marry', contact: null })).toBeNull();
    expect(parseXmasRelation({ stage: 'far', goal: 'meet' })).toBeNull();
    expect(XMAS_CONTACTS).toHaveLength(3);
  });

  it('상대 정보 경로: 없음·생일만·시간까지', () => {
    expect(xmasTier(null)).toBe('none');
    expect(xmasTier({ chart: { flags: { timeUnknown: true } } })).toBe('date');
    expect(xmasTier({ chart: { flags: { timeUnknown: false } } })).toBe('full');
  });
});

describe('시즌', () => {
  it('시기 경계', () => {
    expect(xmasPhase('2026-11-15')).toBe('early');
    expect(xmasPhase('2026-12-02')).toBe('early');
    expect(xmasPhase('2026-12-03')).toBe('late');
    expect(xmasPhase('2026-12-09')).toBe('late');
    expect(xmasPhase('2026-12-10')).toBe('ask');
    expect(xmasPhase('2026-12-23')).toBe('ask');
    expect(xmasPhase('2026-12-24')).toBe('eve');
    expect(xmasPhase('2026-12-25')).toBeNull();
  });

  it('판매는 한국 시간 12월 25일 0시에 닫힌다', () => {
    expect(xmasOnSale(Date.parse('2026-12-24T14:59:00Z'))).toBe(true);
    expect(xmasOnSale(Date.parse('2026-12-24T15:00:00Z'))).toBe(false);
    expect(kstDate(Date.parse('2026-12-24T15:00:00Z'))).toBe('2026-12-25');
  });

  it('닫는 날까지 남은 날은 한국 날짜로 세고 닫힌 뒤에는 0', () => {
    expect(daysToClose(Date.parse('2026-11-15T03:00:00Z'))).toBe(40);
    expect(daysToClose(Date.parse('2026-12-24T14:59:00Z'))).toBe(1);
    expect(daysToClose(Date.parse('2026-12-24T15:00:00Z'))).toBe(0);
    expect(daysToClose(Date.parse('2027-01-02T00:00:00Z'))).toBe(0);
  });

  const day = (date: string, kind: XmasDay['kind']): XmasDay => ({ date, kind, ganzhi: '甲子' });

  it('꺼낼 날: 기간 안의 좋은 날을 먼저, 말 아낄 날은 빼고, 날짜 순으로 둘', () => {
    const days = [day('2026-12-10', 'caution'), day('2026-12-12', 'group'), day('2026-12-13', 'bloom'), day('2026-12-20', 'close')];
    expect(xmasAskDays(days, '2026-12-01')).toEqual(['2026-12-12', '2026-12-13']);
  });

  it('좋은 날이 없으면 평범한 날, 지난 날은 고르지 않는다', () => {
    expect(xmasAskDays([day('2026-12-11', 'caution')], '2026-12-01')).toEqual(['2026-12-10', '2026-12-12']);
    expect(xmasAskDays([day('2026-12-10', 'close')], '2026-12-12')).toEqual(['2026-12-12', '2026-12-13']);
  });

  it('미리 물을 기간이 지나 샀으면 23일까지 남은 날에서', () => {
    expect(xmasAskDays([day('2026-12-21', 'close')], '2026-12-20')).toEqual(['2026-12-20', '2026-12-21']);
    expect(xmasAskDays([], '2026-12-23')).toEqual(['2026-12-23']);
  });

  it('이브에는 그날, 닫힌 뒤에는 없음', () => {
    expect(xmasAskDays([], XMAS_SEASON.eve)).toEqual(['2026-12-24']);
    expect(xmasAskDays([], '2026-12-25')).toEqual([]);
  });
});
