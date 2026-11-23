import { describe, expect, it } from 'vitest';
import { interruptedState, type ReadingState } from '../src/components/rooms/use-room-reading';

describe('끊긴 풀이(interruptedState)', () => {
  it('기다리거나 흘러오던 풀이는 연결이 끊긴 오류가 된다', () => {
    expect(interruptedState({ phase: 'waiting' })).toEqual({ phase: 'error', error: 'network' });
    expect(interruptedState({ phase: 'streaming', text: '## 하나' })).toEqual({ phase: 'error', error: 'network' });
  });

  it('다 받았거나 시작 전이거나 이미 오류면 그대로 둔다', () => {
    const keep: ReadingState[] = [{ phase: 'idle' }, { phase: 'done', text: '끝' }, { phase: 'error', error: 'busy' }];
    for (const s of keep) expect(interruptedState(s)).toBe(s);
  });
});
