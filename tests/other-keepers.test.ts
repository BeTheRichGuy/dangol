import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, describe, expect, it } from 'vitest';
import { ContinuePitch } from '../src/components/result/continue-pitch';
import { OtherKeepers } from '../src/components/result/other-keepers';
import { OTHER_KEEPERS_KO as T } from '../src/content/ko/room-pitch';
import { setActiveLocaleForTest } from '../src/content/locale';

setActiveLocaleForTest('ko');
afterAll(() => setActiveLocaleForTest('en'));

const FORBIDDEN = /cosmic|energy|universe|manifest|FYP|에너지|우주|사탕|꿀|소금|남자|여자|남성|여성/;
const EMOJI = /\p{Extended_Pictographic}/u;
const textOf = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const BUNDLE_BANNER = /<section[^>]*class="bb-banner"[\s\S]*?<\/section>/g;

describe('OtherKeepers', () => {
  const full = renderToStaticMarkup(createElement(OtherKeepers));
  const html = full.replace(BUNDLE_BANNER, '');
  const text = textOf(html);

  it('묶음 상품을 내려 5개 방 묶음 배너가 없다', () => {
    expect(full.match(BUNDLE_BANNER)).toBeNull();
    expect(full).not.toContain('href="/bundle"');
  });

  it('만신·연·여운을 얼굴 셋으로 소개하고, 소개 문구는 짧다', () => {
    for (const name of ['만신', '연', '여운']) expect(text).toContain(name);
    expect(html.match(/rs-others__face/g)).toHaveLength(3);
    expect(html).toContain('/media/chat/mansin.jpg');
    expect(html).toContain('/media/chat/yeon.jpg');
    expect(html).toContain('/media/chat/reunion.jpg');
    expect(html).not.toContain('/media/chat/muk.jpg');
    expect(text).toContain('다른 캐릭터가 봐주는 사주도 있어!');
    expect(text.length).toBeLessThan(140);
  });

  it('버튼은 하나이고 메인의 방 목록으로 간다', () => {
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toContain('href="/home#rooms"');
    expect(text).toContain(T.cta);
  });

  it('가려진 말·잠금 상자·가격 없이, 금지 어휘와 이모지가 없다', () => {
    expect(html).not.toContain('▒');
    expect(html).not.toContain('rs-blur');
    expect(text).not.toMatch(/원|₩|\d,\d{3}/);
    expect(text).not.toMatch(FORBIDDEN);
    expect(EMOJI.test(text)).toBe(false);
  });
});

describe('ContinuePitch 끝', () => {
  const html = renderToStaticMarkup(createElement(ContinuePitch, { type: 'candle' as never }));

  it('옛 이어받기 카드(만신→연→해와 달→만신 차례 소개)가 없고 소개는 한 덩어리다', () => {
    expect(html).not.toContain('▒');
    expect(html).not.toContain('율 얘기는 들었지');
    expect(html).not.toContain('잠깐, 시기 얘기는');
    expect(html.match(/다른 캐릭터가 봐주는 사주도 있어!/g)).toHaveLength(1);
    expect(html.match(/rs-others__face/g)).toHaveLength(3);
  });

  it('메인으로 가는 버튼은 하나(소개 안)뿐이다', () => {
    expect(html.match(/href="\/home"/g)).toBeNull();
    expect(html.match(/href="\/home#rooms"/g)).toHaveLength(1);

    expect(html).toContain('href="/room/life"');
  });
});
