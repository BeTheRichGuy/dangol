import { existsSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { AccountProvider } from '../src/components/account/account-provider';
import { balloonsMax } from '../src/components/result/balloons';
import { RoomRailList } from '../src/components/rooms/room-cards';
import { roomCopy } from '../src/components/rooms/room-copy';
import { RoomView } from '../src/components/rooms/room-view';
import { ROOM_STORY, storySrc } from '../src/components/rooms/room-story';
import { ROOM_ART, roomArtSrc } from '../src/components/scene/manifest';
import { overlay, setActiveLocaleForTest } from '../src/content/locale';
import { ROOMS_COPY as EN, type StoryBeat } from '../src/content/en/rooms';
import { ROOMS_JA } from '../src/content/ja/rooms';
import { ROOMS_KO } from '../src/content/ko/rooms';
import { BUNDLE_PRICES } from '../src/lib/payments/bundle';
import { dodoReunionProduct } from '../src/lib/payments/dodo';
import { paymentConfig } from '../src/lib/payments/payments';
import { PRICES } from '../src/lib/payments/prices';
import { REUNION_ART, REUNION_ART_DIR, REUNION_ART_READY, reunionArtSrc } from '../src/lib/reunion/art';
import { REUNION_GUIDE_NAME, REUNION_PRICE_TEXT, REUNION_PRICES } from '../src/lib/reunion/product';
import { CHAPTER_ROOMS, isProductKey, isRoomKey, PRODUCT_KEYS, REUNION_ROOM, ROOM_KEYS, ROOMS, usesChapters } from '../src/lib/rooms/themes';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/room/reunion',
}));

const COPY = { en: EN, ko: overlay(EN, ROOMS_KO), ja: overlay(EN, ROOMS_JA) } as const;

const KNOWN_LONG_BALLOONS = new Set(['No scores. No odds. Only what I can actually read.', 'あの人の今の気持ち。戻るかどうか。点数もつけません。']);

const inPublic = (src: string) => existsSync(path.join(__dirname, '..', 'public', src));

afterAll(() => setActiveLocaleForTest('en'));

describe('방 문구: 열두 절과 일곱 칸', () => {
  it.each(['en', 'ko', 'ja'] as const)('%s: 목차 12개, 칸 7개, 닫힘 한 줄, 말하는 사람은 U12 한 명(speaker null)', (locale) => {
    const copy = COPY[locale].reunion;
    expect(copy.contents).toHaveLength(12);
    expect(copy.story).toHaveLength(7);
    expect(copy.closed).toHaveLength(1);
    for (const beat of copy.story) {
      expect(beat.stage !== null || beat.lines.length > 0).toBe(true);
      for (const line of beat.lines) {
        if (!KNOWN_LONG_BALLOONS.has(line.text)) expect(balloonsMax(line.text), line.text).toHaveLength(1);
      }
    }

    expect(copy.story[2].lines).toHaveLength(0);
    expect(copy.story[2].stage).not.toBeNull();
  });

  it('ko·ja 는 영어와 같은 칸 수·말풍선 수이고 영어 그대로 남은 곳이 없다(무대 지시 칸은 언어마다 따로 썼다)', () => {
    for (const locale of ['ko', 'ja'] as const) {
      const copy = COPY[locale].reunion;
      copy.story.forEach((beat: StoryBeat, i) => {
        expect(beat.lines.length, `${locale}.${i}`).toBe(EN.reunion.story[i].lines.length);

        beat.lines.forEach((line, j) => expect(line.text, `${locale}.${i}.${j}`).not.toBe(EN.reunion.story[i].lines[j]?.text));
      });
      copy.contents.forEach((c, i) => expect(c.title).not.toBe(EN.reunion.contents[i].title));
      expect(copy.title).not.toBe(EN.reunion.title);
    }
  });

  it('키퍼 이름은 상품 값 한 곳(REUNION_GUIDE_NAME)과 같다', () => {
    for (const locale of ['en', 'ko', 'ja'] as const) {
      expect(COPY[locale].keepers.u12.name).toBe(REUNION_GUIDE_NAME[locale].name);
      expect(COPY[locale].keepers.u12.hanja).toBe(REUNION_GUIDE_NAME[locale].hanja);
    }
    expect(ROOMS.reunion.keeper).toBe('u12');
  });

  it('roomCopy 는 재회에서 재회 문구, 다섯 방에서 방 문구를 준다', () => {
    setActiveLocaleForTest('en');
    expect(roomCopy('reunion').title).toBe(EN.reunion.title);
    for (const key of ROOM_KEYS) expect(roomCopy(key).title).toBe(EN.rooms[key].title);
  });
});

describe('웹툰 칸 7장(ROOM_STORY.reunion)', () => {
  const panels = ROOM_STORY.reunion;

  it('칸 수가 문구의 칸 수와 같고, story-1 … story-7 이 REUNION_ART 에 있는 장이다', () => {
    expect(panels).toHaveLength(EN.reunion.story.length);
    panels.forEach((p, i) => {
      expect(p.file).toBe(`story-${i + 1}`);
      expect(REUNION_ART[p.file], p.file).toBeDefined();
      expect(storySrc(p)).toBe(reunionArtSrc(p.file));
      expect(storySrc(p).startsWith(REUNION_ART_DIR)).toBe(true);
    });
  });

  it('칸 비율은 그림 배치표대로다(3:2 → wide, 1:1 → square, 2:3 → 기본 칸) 그리고 소금 칸은 좁다', () => {
    panels.forEach((p) => {
      const art = REUNION_ART[p.file];
      if (art.aspect === 'wide') expect(p.aspect).toBe('wide');
      if (art.aspect === 'square') expect(p.aspect).toBe('square');
      if (art.aspect === 'portrait') expect(p.aspect).toBeUndefined();
    });
    expect(REUNION_ART['story-3'].aspect).toBe('square');
    expect(panels[2].align).toBe('narrow');
    expect(panels.filter((p) => p.aspect === 'tall')).toHaveLength(0);
  });

  it('그림 파일이 public 에 있다(READY 전에는 같은 비율의 임시 그림, READY 뒤에는 최종 그림)', () => {
    for (const p of panels) {
      expect(inPublic(storySrc(p)), storySrc(p)).toBe(true);
      expect(storySrc(p).includes('/stand-')).toBe(!REUNION_ART_READY);
    }
  });

  it('한 방 화면에 같은 그림이 두 번 서지 않는다(임시 그림 기간에는 비율별로 같은 파일을 나눠 쓰므로 최종 그림일 때만 본다)', () => {
    if (!REUNION_ART_READY) return;
    const page = [roomArtSrc('reunion'), ...panels.map(storySrc)].filter((s): s is string => s !== null);
    expect(page.filter((s, i) => page.indexOf(s) !== i)).toEqual([]);
  });

  it('입 위치는 그림이 들어온 뒤에 잰다: 지금은 비어 있어 말풍선 꼬리가 없다', () => {
    for (const p of panels) expect(p.mouth).toBeUndefined();
  });

  it('다른 방의 칸 그림은 그대로 webtoon 폴더다', () => {
    for (const key of ROOM_KEYS) for (const p of ROOM_STORY[key]) expect(storySrc(p)).toBe(`/media/webtoon/${p.file}.jpg`);
  });
});

describe('방 표지 그림', () => {
  it('READY 전에는 임시 portrait 그림, READY 뒤에는 reunion-cover.jpg 다', () => {
    expect(ROOM_ART.reunion.file).toBe(`${REUNION_ART_DIR}/reunion-cover.jpg`);
    expect(ROOM_ART.reunion.ready).toBe(REUNION_ART_READY);
    expect(roomArtSrc('reunion')).toBe(REUNION_ART_READY ? `${REUNION_ART_DIR}/reunion-cover.jpg` : `${REUNION_ART_DIR}/stand-portrait.jpg`);
    expect(inPublic(roomArtSrc('reunion') as string)).toBe(true);
  });

  it('다섯 방의 표지는 그대로다(재회가 끼어 서로 겹치지 않는다)', () => {
    const srcs = ROOM_KEYS.map((k) => roomArtSrc(k));
    expect(new Set(srcs).size).toBe(5);
    expect(srcs).not.toContain(roomArtSrc('reunion'));
  });
});

describe('다른 방 배열에는 재회가 없다', () => {
  it('ROOM_KEYS 는 다섯 개, 재회는 PRODUCT_KEYS·CHAPTER_ROOMS 에만 있다', () => {
    expect([...ROOM_KEYS]).toEqual(['life', 'decades', 'love', 'match', 'year']);
    expect(isRoomKey(REUNION_ROOM)).toBe(false);
    expect(isProductKey(REUNION_ROOM)).toBe(true);
    expect([...PRODUCT_KEYS]).toEqual([...ROOM_KEYS, 'reunion']);
    expect([...CHAPTER_ROOMS]).toContain('reunion');
    expect(usesChapters('reunion')).toBe(true);
    expect(Object.keys(EN.rooms)).not.toContain('reunion');
  });

  it('방 띠는 재회 카드(NEW!)를 유료 방 맨 앞에 두고, 재회 방 자신의 화면에서는 뺀다', () => {
    setActiveLocaleForTest('en');
    const html = renderToStaticMarkup(createElement(RoomRailList, { label: 'Rooms' }));
    expect(html).toContain('href="/room/reunion"');
    expect(html).toContain(EN.home.newRelease);
    expect(html.indexOf('/room/reunion')).toBeLessThan(html.indexOf('/room/life'));
    for (const key of ROOM_KEYS) expect(html).toContain(`/room/${key}`);

    expect(html).not.toContain('$6.29');
    expect(html).toContain('1 / 6');
    const own = renderToStaticMarkup(createElement(RoomRailList, { label: 'Rooms', withReunion: false }));
    expect(own).not.toContain('/room/reunion');
    expect(own).toContain('1 / 5');
  });

  it('5개 방 묶음 값은 다섯 방만 센다(재회 값이 끼지 않는다)', () => {
    for (const l of ['ko', 'ja', 'en'] as const) {
      expect(BUNDLE_PRICES[l].amount).toBeLessThan(PRICES[l].amount * 5);
    }
  });
});

describe('재회 값', () => {
  it('화면 표기는 REUNION_PRICES 의 금액과 같다', () => {
    for (const l of ['ko', 'ja', 'en'] as const) {
      const { amount, currency } = REUNION_PRICES[l];
      const shown = Number(REUNION_PRICE_TEXT[l].replace(/[^0-9.]/g, ''));
      expect(currency === 'USD' ? Math.round(shown * 100) : shown).toBe(amount);
    }
  });

  it('별도 상품이지만 값은 방 하나의 보통 값과 같고 할인(첫 구매 값)이 없다', () => {
    for (const l of ['ko', 'ja', 'en'] as const) expect(REUNION_PRICES[l].amount).toBe(PRICES[l].amount);
    expect(REUNION_PRICES.ko.amount).toBe(4900);
  });
});

describe('상품 화면 서버 렌더', () => {
  it.each(['ko', 'en', 'ja'] as const)('%s: 표지, 칸, 열두 절(네 악장), 받는 것', (locale) => {
    setActiveLocaleForTest(locale);
    const html = renderToStaticMarkup(createElement(AccountProvider, null, createElement(RoomView, { room: 'reunion' })));
    const copy = COPY[locale].reunion;
    expect(html).toContain(`data-room="reunion"`);
    expect(html).toContain(REUNION_GUIDE_NAME[locale].name);
    expect(html).toContain(copy.title.replace(/&/g, '&amp;'));
    expect((html.match(/rm-contents__num/g) ?? []).length).toBe(12);
    expect((html.match(/class="rm-movement"/g) ?? []).length).toBe(4);
    expect(html).toContain('rm-includes');

    expect((html.match(/class="wt-panel /g) ?? []).length).toBe(7);

    expect(html).not.toContain('room-others');
    expect(html).not.toContain('room-subject');
    expect(html).not.toContain('/room/life');

    expect(html).not.toContain('rm-gate');
  });
});

describe('재회 Dodo 상품(영어·일본어)', () => {
  const base = { GEMINI_API_KEY: 'k', NODE_ENV: 'development', DANGOL_PAYMENTS: 'toss', PAYMENT_SECRET: 's'.repeat(32), TOSS_SECRET_KEY: 'test_sk_abc', NEXT_PUBLIC_TOSS_CLIENT_KEY: 'test_ck_abc', DODO_PAYMENTS_API_KEY: 'dodo-key', DODO_PAYMENTS_ENV: 'test', DODO_PRODUCT_ID_USD: 'pdt_usd0001', DODO_PRODUCT_ID_JPY: 'pdt_jpy0001' };

  it('환경변수의 재회 상품 번호를 언어별로 읽는다(pdt_ 로 시작하는 것만)', () => {
    const cfg = paymentConfig({ ...base, DODO_PRODUCT_ID_USD_REUNION: 'pdt_usdreun01', DODO_PRODUCT_ID_JPY_REUNION: ' pdt_jpyreun01 ' });
    const dodo = cfg.mode === 'toss' ? cfg.dodo : null;
    expect(dodo).not.toBeNull();
    expect(dodoReunionProduct(dodo!, 'en')).toBe('pdt_usdreun01');
    expect(dodoReunionProduct(dodo!, 'ja')).toBe('pdt_jpyreun01');
    expect(dodoReunionProduct(dodo!, 'ko')).toBeNull();
    const bad = paymentConfig({ ...base, DODO_PRODUCT_ID_USD_REUNION: 'oops' });
    expect(bad.mode === 'toss' && bad.dodo && dodoReunionProduct(bad.dodo, 'en')).toBeNull();
  });

  it('재회 상품 번호가 없으면 재회만 닫히고 방 하나 결제는 그대로다', () => {
    const cfg = paymentConfig(base);
    const dodo = cfg.mode === 'toss' ? cfg.dodo : null;
    expect(dodoReunionProduct(dodo!, 'en')).toBeNull();
    expect(dodo!.products.USD).toBe('pdt_usd0001');
  });
});
