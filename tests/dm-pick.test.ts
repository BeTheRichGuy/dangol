import { describe, expect, it } from 'vitest';
import { DEFAULT_TALISMAN, pickTalisman } from '../src/lib/dm/pick';
import { AREA_IDS } from '../src/lib/talisman';

describe('pickTalisman: 댓글 키워드 → 부적', () => {
  it.each([
    ['공부 때문에 너무 힘들어요', 'study'],
    ['수능 앞두고 있어요', 'study'],
    ['썸 타는 사람 있는데 궁합 궁금해요', 'love'],
    ['이직할까 고민이에요', 'work'],
    ['친구 관계가 어려워요', 'bond'],
    ['요즘 불안해요', 'mind'],
    ['월급이 안 모여요 돈 얘기', 'wealth'],
    ['I have an exam next week', 'study'],
    ['any advice for my crush?', 'love'],
    ['thinking about changing my job', 'work'],
    ['so stressed lately', 'mind'],
    ['試験が不安です', 'study'],
    ['片思いの恋愛運が知りたい', 'love'],
    ['転職しようか迷ってます', 'work'],
    ['人間関係がしんどい', 'bond'],
    ['お金が貯まらない', 'wealth'],
  ] as const)('%s → %s', (comment, expected) => {
    expect(pickTalisman({ comment })).toBe(expected);
  });

  it('키워드가 하나도 없으면 사주를 모르니 오행이 아닌 기본 한 장(마음)이다', () => {
    for (const comment of ['', '   ', '부적 주세요', 'yes please', 'お願いします', '🙏🙏', '...']) {
      expect(pickTalisman({ comment })).toBe(DEFAULT_TALISMAN);
    }
    expect(DEFAULT_TALISMAN).toBe('mind');
    expect((AREA_IDS as readonly string[]).includes(DEFAULT_TALISMAN)).toBe(true);
  });

  it('키워드가 가장 많은 분야가 이긴다', () => {
    expect(pickTalisman({ comment: '시험 공부 중인데 연애는 어려워요' })).toBe('study');
  });

  it('같은 수면 연애 > 재물 > 일 > 학업 > 사람 > 마음 순서로 고른다', () => {
    expect(pickTalisman({ comment: '연애 그리고 돈' })).toBe('love');
    expect(pickTalisman({ comment: '돈 그리고 취업' })).toBe('wealth');
    expect(pickTalisman({ comment: '취업 그리고 공부' })).toBe('work');
  });

  it('댓글에 키워드가 없으면 게시물 글(캡션)에서 고른다. 댓글 키워드가 먼저다', () => {
    expect(pickTalisman({ comment: '부적 주세요', caption: '시험 기간에 보는 학업 사주 #수능' })).toBe('study');
    expect(pickTalisman({ comment: '연애운 궁금해요', caption: '시험 기간에 보는 학업 사주' })).toBe('love');
    expect(pickTalisman({ comment: '부적 주세요', caption: null })).toBe(DEFAULT_TALISMAN);
  });

  it('영어 낱말은 낱말 단위로만 맞춘다(glove 는 love 가 아니다)', () => {
    expect(pickTalisman({ comment: 'nice glove' })).toBe(DEFAULT_TALISMAN);
    expect(pickTalisman({ comment: 'I love this' })).toBe('love');
  });

  it('열한 장 중 오행 부적은 고르지 않는다(사주를 모른다)', () => {
    const corpus = ['공부', '연애', '돈', '취업', '친구', '불안', 'study', 'love', 'money', 'job', 'friends', 'stress', '木火土金水', '', 'zzz'];
    for (const comment of corpus) expect((AREA_IDS as readonly string[]).includes(pickTalisman({ comment }))).toBe(true);
  });

  it('같은 입력이면 같은 부적이다', () => {
    const a = pickTalisman({ comment: '시험 불안해요', caption: '공부' });
    for (let i = 0; i < 5; i++) expect(pickTalisman({ comment: '시험 불안해요', caption: '공부' })).toBe(a);
  });
});
