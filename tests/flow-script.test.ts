import { describe, expect, it } from 'vitest';
import { EMPTY_ANSWERS, type Answers, type PlaceChoice } from '@/components/flow/answers';
import { READING_TALK } from '@/components/flow/script';

const LA: PlaceChoice = { name: 'Los Angeles', country: 'US', lat: 34.05, lng: -118.24, tz: 'America/Los_Angeles', label: 'Los Angeles, US' };
const TORONTO: PlaceChoice = { name: 'Toronto', country: 'CA', lat: 43.65, lng: -79.38, tz: 'America/Toronto', label: 'Toronto, CA' };

function placeReaction(a: Partial<Answers>): string | null {
  const step = READING_TALK.find((s) => s.id === 'place');
  return step?.reaction?.({ ...EMPTY_ANSWERS, name: 'Mina', timeAnswered: true, ...a }) ?? null;
}

describe('place 반응은 출생지 태양시를 쓴다', () => {
  it('LA 7월 23:40(서머타임)은 태양시로 Pig 시이고 반응이 Rat 이 아니라고 바로잡는다', () => {
    const text = placeReaction({ date: '1990-07-15', time: '23:40', place: LA });
    expect(text).toMatch(/Pig/);
    expect(text).toMatch(/Rat/);
  });

  it('토론토 19:30 7월(서머타임)도 시진이 바뀌면 바로잡는다', () => {
    const text = placeReaction({ date: '1992-07-15', time: '19:30', place: TORONTO });
    expect(text).toBeTruthy();
    expect(text).toMatch(/hour/i);
  });

  it('시간을 모르면 바로잡지 않고 도시 반응만 나온다', () => {
    const text = placeReaction({ date: '1990-01-15', time: null, place: LA });
    expect(text).toMatch(/Los Angeles/);
    expect(text).not.toMatch(/hour/i);
  });
});
