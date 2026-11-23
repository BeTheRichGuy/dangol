import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { UI } from '../src/content/en/ui';
import { UI_JA } from '../src/content/ja/ui';
import { UI_KO } from '../src/content/ko/ui';

describe('입력 전 율의 첫 대사', () => {
  it.each([
    ['en', UI.reading.intro.line, /birthday/i],
    ['ko', UI_KO.reading?.intro?.line ?? '', /생일/],
    ['ja', UI_JA.reading?.intro?.line ?? '', /生まれた日/],
  ] as const)('%s: 생일을 알려 줘야 미래를 볼 수 있다고 먼저 말한다', (_locale, line, birthday) => {
    expect(line).toMatch(birthday);
  });

  it('en: 미래라는 말이 들어 있다', () => {
    expect(UI.reading.intro.line).toMatch(/future/i);
  });
});

function textsUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? textsUnder(path.join(dir, e.name)) : e.name.endsWith('.ts') ? [readFileSync(path.join(dir, e.name), 'utf8')] : [],
  );
}

describe('소금을 따라가기 문구', () => {
  it('한국어 첫 화면 제목·방 띠 무료 카드·무료 칸에도 소금을 따라가는 말이 없다', () => {
    expect(UI_KO.home?.headline).not.toMatch(/소금/);
    for (const text of textsUnder(path.join(__dirname, '../src/content/ko'))) {
      expect(text).not.toMatch(/소금이 따라 신당|소금을 따라 신당|소금이를 따라 무료/);
    }
  });

  it('영어 문구 어디에도 Follow Sogeum 이 없다', () => {
    for (const text of textsUnder(path.join(__dirname, '../src/content/en'))) {
      expect(text).not.toMatch(/Follow Sogeum/i);
    }
  });

  it('일본어 첫 화면 단추·무료 칸·방 띠 카드에 ソグムについて 꼴이 없다', () => {
    expect(UI_JA.landing?.cta).not.toMatch(/ソグム/);
    expect(UI_JA.home?.cta).not.toMatch(/ソグム/);
    for (const text of textsUnder(path.join(__dirname, '../src/content/ja'))) {
      expect(text).not.toMatch(/ソグムについていく|ソグムについて階段|ソグムについて、神堂/);
    }
  });
});
