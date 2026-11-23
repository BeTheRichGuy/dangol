import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearHistory, lastLines, loadHistory, saveHistory } from '@/lib/chat/history';
import type { ChatLine } from '@/lib/chat/characters';

function fakeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

const mine: ChatLine[] = [{ role: 'reader', text: '내 질문' }];
const friend: ChatLine[] = [{ role: 'reader', text: '친구 질문' }, { role: 'character', text: '친구 답' }];

describe('chat history scope', () => {
  const g = globalThis as unknown as { window?: unknown };
  beforeEach(() => {
    g.window = { localStorage: fakeStorage() };
  });
  afterEach(() => {
    delete g.window;
  });

  it('사람마다 대화가 따로 저장된다', () => {
    saveHistory('yul', mine);
    saveHistory('yul', friend, 'person-1');
    expect(loadHistory('yul')).toEqual(mine);
    expect(loadHistory('yul', 'person-1')).toEqual(friend);
    expect(loadHistory('yul', 'person-2')).toEqual([]);
  });

  it('캐릭터마다도 따로이고, 지우면 그 칸만 지워진다', () => {
    saveHistory('yul', friend, 'p');
    saveHistory('yeon', mine, 'p');
    clearHistory('yul', 'p');
    expect(loadHistory('yul', 'p')).toEqual([]);
    expect(loadHistory('yeon', 'p')).toEqual(mine);
  });

  it('목록 미리보기는 그 사람의 마지막 말을 가져온다', () => {
    saveHistory('muk', friend, 'p');
    expect(lastLines('p').muk).toEqual(friend[1]);
    expect(lastLines().muk).toBeNull();
  });

  it('scope 를 안 쓰던 옛 저장 키(dangol.chat.<캐릭터>.v1)를 그대로 읽는다', () => {
    (g.window as { localStorage: ReturnType<typeof fakeStorage> }).localStorage.setItem('dangol.chat.yul.v1', JSON.stringify(mine));
    expect(loadHistory('yul')).toEqual(mine);
  });
});
