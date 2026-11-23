import { describe, expect, it } from 'vitest';
import { keepAwake } from '../src/components/rooms/use-wake-lock';

function fakes(opts: { supported?: boolean; visible?: boolean; reject?: boolean } = {}) {
  const { supported = true, visible = true, reject = false } = opts;
  const log = { requests: 0, releases: 0 };
  const listeners = new Set<() => void>();
  const doc = {
    visibilityState: visible ? 'visible' : 'hidden',
    addEventListener: (_: 'visibilitychange', fn: () => void) => void listeners.add(fn),
    removeEventListener: (_: 'visibilitychange', fn: () => void) => void listeners.delete(fn),
  };
  const nav = supported
    ? {
        wakeLock: {
          request: async () => {
            log.requests += 1;
            if (reject) throw new DOMException('denied', 'NotAllowedError');
            return { release: async () => void (log.releases += 1) };
          },
        },
      }
    : {};
  const setVisible = (v: boolean) => {
    doc.visibilityState = v ? 'visible' : 'hidden';
    for (const fn of [...listeners]) fn();
  };
  return { nav, doc, log, listeners, setVisible };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('keepAwake', () => {
  it('켜면 화면 잠금을 하나 걸고, 놓으면 풀고 듣던 것도 끊는다', async () => {
    const f = fakes();
    const stop = keepAwake(f.nav, f.doc);
    await tick();
    expect(f.log.requests).toBe(1);
    expect(f.listeners.size).toBe(1);
    stop();
    await tick();
    expect(f.log.releases).toBe(1);
    expect(f.listeners.size).toBe(0);
  });

  it('지원하지 않거나 거절당해도 아무 일 없이 끝난다', async () => {
    const none = fakes({ supported: false });
    const stopA = keepAwake(none.nav, none.doc);
    await tick();
    expect(none.log.requests).toBe(0);
    expect(() => stopA()).not.toThrow();

    const denied = fakes({ reject: true });
    const stopB = keepAwake(denied.nav, denied.doc);
    await tick();
    expect(denied.log.requests).toBe(1);
    expect(() => stopB()).not.toThrow();
    await tick();
    expect(denied.log.releases).toBe(0);
  });

  it('다른 앱에 갔다 돌아오면(브라우저가 잠금을 풀었다) 다시 건다', async () => {
    const f = fakes();
    const stop = keepAwake(f.nav, f.doc);
    await tick();
    f.setVisible(false);
    await tick();
    expect(f.log.requests).toBe(1);
    f.setVisible(true);
    await tick();
    expect(f.log.requests).toBe(2);
    stop();
  });

  it('화면이 보이지 않을 때는 걸지 않고, 보이는 중에 이미 걸려 있으면 또 걸지 않는다', async () => {
    const hidden = fakes({ visible: false });
    keepAwake(hidden.nav, hidden.doc);
    await tick();
    expect(hidden.log.requests).toBe(0);

    const f = fakes();
    keepAwake(f.nav, f.doc);
    await tick();
    f.setVisible(true);
    await tick();
    expect(f.log.requests).toBe(1);
  });

  it('요청이 끝나기 전에 놓으면 받은 잠금을 바로 푼다', async () => {
    const f = fakes();
    const stop = keepAwake(f.nav, f.doc);
    stop();
    await tick();
    expect(f.log.requests).toBe(1);
    expect(f.log.releases).toBe(1);
  });
});
