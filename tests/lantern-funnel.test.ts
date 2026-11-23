import { describe, expect, it } from 'vitest';
import { ACCOUNT_EN } from '../src/content/en/account';
import { CHAT_EN } from '../src/content/en/chat';
import { ROOMS_COPY as ROOMS_EN } from '../src/content/en/rooms';
import { ACCOUNT_JA } from '../src/content/ja/account';
import { CHAT_JA } from '../src/content/ja/chat';
import { ROOMS_JA } from '../src/content/ja/rooms';
import { ACCOUNT_KO } from '../src/content/ko/account';
import { CHAT_KO } from '../src/content/ko/chat';
import { ROOMS_KO } from '../src/content/ko/rooms';
import { cleanEvent, EVENT_NAMES } from '../src/lib/analytics/events';
import { MAX_TOKENS_PER_PLAY } from '../src/lib/chat/tokens';

const LANGS = [
  { name: 'ko', chat: CHAT_KO, account: ACCOUNT_KO, rooms: ROOMS_KO, sogeum: '소금', three: /3개/, oneOnOne: /1대1/ },
  { name: 'en', chat: CHAT_EN, account: ACCOUNT_EN, rooms: ROOMS_EN, sogeum: 'Sogeum', three: /3 lanterns/, oneOnOne: /one-on-one/ },
  { name: 'ja', chat: CHAT_JA, account: ACCOUNT_JA, rooms: ROOMS_JA, sogeum: 'ソグム', three: /3個/, oneOnOne: /1対1/ },
] as const;

describe('등불이 다 꺼졌을 때의 첫 풀이 안내', () => {
  it('결제한 풀이 하나에서 받는 등불의 위쪽 한도는 3개다(문구가 이 값과 맞아야 한다)', () => {
    expect(MAX_TOKENS_PER_PLAY).toBe(3);
  });

  for (const l of LANGS) {
    it(`${l.name}: 첫 풀이 안내는 소금과 하는 미니게임으로 등불 최대 3개를 말하고, 한 줄 출석 안내가 있다`, () => {
      const P = l.chat.room.pitch;
      expect(P.firstBody).toContain(l.sogeum);
      expect(P.firstBody).toMatch(l.three);
      expect(P.moreBody).toContain(l.sogeum);
      expect(P.moreBody).toMatch(l.three);
      for (const s of [P.firstTitle, P.firstCta, P.moreTitle, P.moreCta, P.tomorrow]) expect(s.trim().length).toBeGreaterThan(0);
      expect(P.tomorrow).toMatch(/1/);
    });

    it(`${l.name}: 결제 창의 미니게임 안내도 소금과 최대 3개를 말한다`, () => {
      const C = l.rooms.checkout;
      for (const s of [C?.gameNote ?? '', C?.gameNoteGuest ?? '']) {
        expect(s).toContain(l.sogeum);
        expect(s).toMatch(l.three);
      }
    });

    it(`${l.name}: 메인 로그인 시트는 1대1 대화가 무료라고 말하고 '다음에' 단추 문구가 있다`, () => {
      const N = l.account.login.nudge;
      expect(N.heading).toMatch(l.oneOnOne);
      expect(N.lead.trim().length).toBeGreaterThan(0);
      expect(N.tag.trim().length).toBeGreaterThan(0);
      expect(N.later.trim().length).toBeGreaterThan(0);
    });

    it(`${l.name}: 금지 어휘가 없다`, () => {
      const text = JSON.stringify([l.chat.room.pitch.firstBody, l.chat.room.pitch.moreBody, l.account.login.nudge]);
      expect(text).not.toMatch(/cosmic|energy|universe|manifest|FYP|share for luck/i);
    });
  }
});

describe('통계 이름', () => {
  it('login_nudge, lantern_pitch 는 브라우저가 보낼 수 있고 act 칸이 남는다', () => {
    expect(EVENT_NAMES).toContain('login_nudge');
    expect(EVENT_NAMES).toContain('lantern_pitch');
    const row = cleanEvent({ name: 'lantern_pitch', sid: 'a'.repeat(16), props: { act: 'click', first: 1, room: 'life' } });
    expect(row?.name).toBe('lantern_pitch');
    expect(row?.props.act).toBe('click');
  });
});
