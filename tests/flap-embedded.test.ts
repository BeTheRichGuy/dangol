import { describe, expect, it } from 'vitest';
import { CHAT_EN } from '../src/content/en/chat';
import { CHAT_JA } from '../src/content/ja/chat';
import { CHAT_KO } from '../src/content/ko/chat';
import { XMAS_CONTENTS } from '../src/content/ko/xmas-paid';

describe('쓰는 동안 소금 날기 안내', () => {
  it('쓰는 무당 이름을 받아 쓴다(연의 방에서 율이라고 하지 않는다)', () => {
    expect(CHAT_KO.play!.embedded!.title!('연')).toBe('연이 쓰는 동안, 소금과 날아요');
    expect(CHAT_KO.play!.embedded!.title!('율')).toBe('율이 쓰는 동안, 소금과 날아요');
    expect(CHAT_KO.play!.embedded!.note!('연')).toContain('연이 풀이를 쓰는 동안');
    expect(CHAT_EN.play.embedded.title('Yeon')).toBe('Fly with Sogeum while Yeon writes');
    expect(CHAT_JA.play!.embedded!.title!('ヨン')).toBe('ヨンが書くあいだ、ソグムと飛ぼう');
  });
  it('크리스마스 판 목차는 11편이다', () => {
    expect(XMAS_CONTENTS).toHaveLength(11);
  });
});
