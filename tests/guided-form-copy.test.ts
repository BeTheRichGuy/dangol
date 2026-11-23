import { afterEach, describe, expect, it } from 'vitest';
import { LOCALES, setActiveLocaleForTest, type Locale } from '../src/content/locale';
import { UI } from '../src/content/ui';

afterEach(() => setActiveLocaleForTest('en'));

const BANNED = /cosmic|energy|universe|manifest|FYP|エネルギー|宇宙|운명|에너지|우주|소금|꿀|사탕|\bsalt\b|\bhoney\b|\bcandy\b|塩|蜂蜜|はちみつ|飴|キャンディ/i;
const GENDER = /성별|남성|여성|\bman\b|\bwoman\b|\bgender\b|男性|女性|性別/i;
const EMOJI = /\p{Extended_Pictographic}/u;

function guided(locale: Locale) {
  setActiveLocaleForTest(locale);
  const g = UI.reading.form.guided;
  return { birth: [...g.birth], time: [...g.time], you: [...g.you], next: g.next };
}

describe.each(LOCALES)('입력 세 장의 율 말풍선 %s', (locale) => {
  it('세 장 모두 두 줄씩 있고 비어 있지 않다', () => {
    const g = guided(locale);
    for (const part of [g.birth, g.time, g.you]) {
      expect(part).toHaveLength(2);
      for (const line of part) expect(line.trim()).not.toBe('');
    }
    expect(g.next.trim()).not.toBe('');
  });

  it('성별 낱말·금지 어휘·이모지가 없다', () => {
    const g = guided(locale);
    for (const t of [...g.birth, ...g.time, ...g.you, g.next]) {
      expect(t, t).not.toMatch(GENDER);
      expect(t, t).not.toMatch(BANNED);
      expect(EMOJI.test(t), t).toBe(false);
    }
  });

  it('언어에 맞는 글자로 쓰였다(영어는 한글·가나가 없고, 한국어는 영어 문장이 없다)', () => {
    const g = guided(locale);
    const all = [...g.birth, ...g.time, ...g.you, g.next].join(' ');
    if (locale === 'en') expect(all).not.toMatch(/[가-힣ぁ-んァ-ン]/);
    if (locale === 'ko') expect(all).toMatch(/[가-힣]/);
    if (locale === 'ja') expect(all).toMatch(/[ぁ-んァ-ン]/);
    if (locale !== 'en') expect(all).not.toMatch(/[A-Za-z]{4,}/);
  });
});

describe('언어마다 따로 쓴 문구', () => {
  it('세 언어의 장별 첫 줄이 서로 다르다(옮긴 문구가 아니다)', () => {
    const lines = new Set(LOCALES.map((l) => guided(l).birth[0]));
    expect(lines.size).toBe(3);
  });
});
