import { describe, expect, it } from 'vitest';
import { ROOMS_COPY as EN } from '@/content/en/rooms';
import { ROOMS_JA } from '@/content/ja/rooms';
import { ROOMS_KO } from '@/content/ko/rooms';
import { overlay } from '@/content/locale';
import { railEdges, railStep } from '../src/components/rooms/rail-scroll';

describe('방 띠 좌우 버튼', () => {
  it('처음에는 다음만, 끝에서는 이전만, 중간에는 둘 다 누를 수 있다', () => {
    expect(railEdges({ left: 0, width: 400, scrollWidth: 1500 })).toEqual({ prev: false, next: true });
    expect(railEdges({ left: 600, width: 400, scrollWidth: 1500 })).toEqual({ prev: true, next: true });
    expect(railEdges({ left: 1100, width: 400, scrollWidth: 1500 })).toEqual({ prev: true, next: false });

    expect(railEdges({ left: 1098.5, width: 400, scrollWidth: 1500 })).toEqual({ prev: true, next: false });
    expect(railEdges({ left: 1, width: 400, scrollWidth: 1500 })).toEqual({ prev: false, next: true });

    expect(railEdges({ left: 0, width: 400, scrollWidth: 400 })).toEqual({ prev: false, next: false });
  });

  it('한 번에 카드 한 장(카드 폭 + 간격)만큼 넘긴다', () => {
    expect(railStep(300, 14)).toBe(314);
  });

  it('세 언어에 버튼 이름이 따로 있다', () => {
    for (const c of [EN, overlay(EN, ROOMS_KO), overlay(EN, ROOMS_JA)]) {
      expect(c.home.prev.length).toBeGreaterThan(0);
      expect(c.home.next.length).toBeGreaterThan(0);
    }
    expect(new Set([EN.home.next, overlay(EN, ROOMS_KO).home.next, overlay(EN, ROOMS_JA).home.next]).size).toBe(3);
  });
});
