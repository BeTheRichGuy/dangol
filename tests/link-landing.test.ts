import { describe, expect, it } from 'vitest';
import { homeTarget, socialReferrer } from '../src/components/flow/link-landing';

describe('/ 에서 /home 으로', () => {
  it('아무 표시가 없는 방문(직접·검색)도 /home 으로 간다', () => {
    expect(homeTarget('')).toBe('/home');
    expect(homeTarget('?utm_medium=')).toBe('/home');
    expect(homeTarget('?utm_source=')).toBe('/home');
  });

  it('언어와 유입 표시(utm_*)를 그대로 싣는다', () => {
    expect(homeTarget('?l=ko&utm_source=instagram&utm_medium=reels&utm_campaign=launch&utm_content=r1')).toBe(
      '/home?l=ko&utm_source=instagram&utm_medium=reels&utm_campaign=launch&utm_content=r1',
    );
    expect(homeTarget('?utm_source=tiktok')).toBe('/home?utm_source=tiktok');
    expect(homeTarget('?l=ja')).toBe('/home?l=ja');

    expect(homeTarget('?l=ja&utm_source=instagram&utm_medium=dm&utm_campaign=talisman&utm_content=love')).toBe(
      '/home?l=ja&utm_source=instagram&utm_medium=dm&utm_campaign=talisman&utm_content=love',
    );
  });

  it('친구가 보낸 유형 링크(?t=)는 아는 유형이면 /home 으로 가져간다', () => {
    expect(homeTarget('?t=candle')).toBe('/home?t=candle');
    expect(homeTarget('?t=candle&utm_source=kakao')).toBe('/home?t=candle&utm_source=kakao');
    expect(homeTarget('?t=nope')).toBe('/home');
  });

  it('알려진 언어만 옮기고, 그 밖의 값(이름·생일 같은 것)은 버린다. 값은 100자까지', () => {
    expect(homeTarget('?l=xx&utm_source=x&name=mina&date=1995-03-14')).toBe('/home?utm_source=x');
    const long = 'a'.repeat(300);
    expect(homeTarget(`?utm_source=${long}`)).toBe(`/home?utm_source=${'a'.repeat(100)}`);
  });
});

describe('인스타그램·틱톡·유튜브·X 에서 온 방문', () => {
  const OWN = 'dangolsaju.app';

  it('이전 사이트가 이 사이트들이면 겉주소·하위 도메인까지 유입 이름이 나온다', () => {
    const cases: [string, string][] = [
      ['https://l.instagram.com/', 'instagram'],
      ['https://www.instagram.com/', 'instagram'],
      ['https://www.tiktok.com/', 'tiktok'],
      ['https://vm.tiktok.com/', 'tiktok'],
      ['https://www.youtube.com/', 'youtube'],
      ['https://m.youtube.com/', 'youtube'],
      ['https://youtu.be/', 'youtube'],
      ['https://x.com/', 'x'],
      ['https://twitter.com/', 'x'],
      ['https://t.co/', 'x'],
    ];
    for (const [ref, name] of cases) expect(socialReferrer(ref, OWN), ref).toBe(name);
  });

  it('비슷한 이름의 다른 사이트, 우리 사이트 안의 이동, 모양이 이상한 값은 아니다', () => {
    expect(socialReferrer('https://evilinstagram.com/', OWN)).toBeNull();
    expect(socialReferrer('https://instagram.com.evil.com/', OWN)).toBeNull();
    expect(socialReferrer('https://nottiktok.com/', OWN)).toBeNull();
    expect(socialReferrer('https://www.google.com/', OWN)).toBeNull();
    expect(socialReferrer(`https://${OWN}/`, OWN)).toBeNull();
    expect(socialReferrer('', OWN)).toBeNull();
    expect(socialReferrer('not a url', OWN)).toBeNull();
  });

  it('utm 이 없어도 이 사이트들에서 온 방문은 유입 이름을 utm_source·utm_medium=referral 로 단다', () => {
    expect(homeTarget('', 'https://l.instagram.com/', OWN)).toBe('/home?utm_source=instagram&utm_medium=referral');
    expect(homeTarget('?l=ko', 'https://www.tiktok.com/', OWN)).toBe('/home?l=ko&utm_source=tiktok&utm_medium=referral');
    expect(homeTarget('?l=ja', 'https://t.co/', OWN)).toBe('/home?l=ja&utm_source=x&utm_medium=referral');
  });

  it('utm_source 가 있으면 그것이 먼저다(이전 사이트로 덮어쓰지 않는다)', () => {
    expect(homeTarget('?utm_source=instagram&utm_medium=bio', 'https://l.instagram.com/', OWN)).toBe('/home?utm_source=instagram&utm_medium=bio');
    expect(homeTarget('?utm_source=kakao', 'https://l.instagram.com/', OWN)).toBe('/home?utm_source=kakao');
  });

  it('홍보 사이트가 아닌 이전 사이트·직접 방문에는 유입 표시를 달지 않는다', () => {
    expect(homeTarget('', 'https://www.google.com/', OWN)).toBe('/home');
    expect(homeTarget('', '', OWN)).toBe('/home');
    expect(homeTarget('?l=ko', '', OWN)).toBe('/home?l=ko');
  });
});
