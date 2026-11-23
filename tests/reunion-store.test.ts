import { describe, expect, it } from 'vitest';
import { canPickReason, toggleReason } from '@/components/reunion/reason-pick';
import { parseReunion, readReunionRaw, type ReunionInput } from '@/components/reunion/reunion-store';
import type { ReasonId, ReunionIntake } from '@/lib/reunion/intake';

const place = { label: 'Seoul, South Korea', name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' };
const INTAKE: ReunionIntake = { since: 'weeks', length: 'year1', who: 'them', reasons: ['talk', 'trust'], contact: 'ignored', want: 'unsure', concern: '' };
const INPUT: ReunionInput = {
  me: { date: '1998-03-21', time: '14:30', place },
  them: { date: '1996-11-02', time: null, place },
  nickname: '그 사람',
  intake: INTAKE,
};

describe('parseReunion', () => {
  it('저장한 값을 그대로 읽는다', () => {
    expect(parseReunion(JSON.stringify(INPUT))).toEqual(INPUT);
  });

  it('비었거나 깨진 글이면 null', () => {
    expect(parseReunion(null)).toBeNull();
    expect(parseReunion('')).toBeNull();
    expect(parseReunion('{not json')).toBeNull();
    expect(parseReunion('[]')).toBeNull();
  });

  it('입력 선택지가 틀리면 null', () => {
    expect(parseReunion(JSON.stringify({ ...INPUT, intake: { ...INTAKE, since: 'ages' } }))).toBeNull();
    expect(parseReunion(JSON.stringify({ ...INPUT, intake: { ...INTAKE, reasons: ['talk', 'trust', 'bored'] } }))).toBeNull();
    expect(parseReunion(JSON.stringify({ ...INPUT, intake: undefined }))).toBeNull();
  });

  it('사람 칸이 빠졌으면 null', () => {
    expect(parseReunion(JSON.stringify({ ...INPUT, me: undefined }))).toBeNull();
    expect(parseReunion(JSON.stringify({ ...INPUT, them: { date: 1 } }))).toBeNull();
  });

  it('별명은 20자로 자르고, 모르는 최상위 칸은 버린다', () => {
    const got = parseReunion(JSON.stringify({ ...INPUT, nickname: 'x'.repeat(40), extra: 1 }));
    expect(got?.nickname).toHaveLength(20);
    expect(got && 'extra' in got).toBe(false);
  });

  it('별명이 글이 아니면 빈 글', () => {
    expect(parseReunion(JSON.stringify({ ...INPUT, nickname: 3 }))?.nickname).toBe('');
  });

  it('저장소를 읽다 던져도 null', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(readReunionRaw(broken)).toBeNull();
  });
});

describe('이유(4번) 복수 선택', () => {
  const t = (cur: ReasonId[], id: ReasonId) => toggleReason(cur, id);

  it('누르면 고르고 다시 누르면 뺀다', () => {
    expect(t([], 'talk')).toEqual(['talk']);
    expect(t(['talk'], 'talk')).toEqual([]);
  });

  it('최대 2개: 셋째는 들어가지 않는다', () => {
    expect(t(['talk', 'trust'], 'bored')).toEqual(['talk', 'trust']);
    expect(canPickReason(['talk', 'trust'], 'bored')).toBe(false);
    expect(canPickReason(['talk', 'trust'], 'talk')).toBe(true);
    expect(canPickReason(['talk', 'trust'], 'unsure')).toBe(true);
  });

  it('잘 모르겠어요(unsure)는 단독이다', () => {
    expect(t(['talk', 'trust'], 'unsure')).toEqual(['unsure']);
    expect(t(['unsure'], 'talk')).toEqual(['talk']);
    expect(t(['unsure'], 'unsure')).toEqual([]);
  });

  it('어떤 순서로 눌러도 2개 이하이고 unsure 는 혼자다', () => {
    let cur: ReasonId[] = [];
    for (const id of ['talk', 'unsure', 'values', 'distance', 'values', 'trust'] as ReasonId[]) {
      cur = t(cur, id);
      expect(cur.length).toBeLessThanOrEqual(2);
      expect(cur.includes('unsure') && cur.length > 1).toBe(false);
    }
  });
});
