import { describe, expect, it } from 'vitest';
import { callName } from '@/lib/xmas/call-name';

describe('callName: 연이 부르는 이름', () => {
  it('한글 세 글자는 성을 빼고 부른다', () => {
    expect(callName('김민지')).toBe('민지');
    expect(callName(' 김민지 ')).toBe('민지');
  });
  it('두 글자·네 글자·한글이 아닌 이름은 그대로', () => {
    expect(callName('민지')).toBe('민지');
    expect(callName('남궁민수')).toBe('남궁민수');
    expect(callName('Emma')).toBe('Emma');
    expect(callName('さくら')).toBe('さくら');
    expect(callName('')).toBe('');
  });
});
