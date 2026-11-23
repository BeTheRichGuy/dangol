import { describe, expect, it } from 'vitest';
import { ACCOUNT_EN as EN } from '../src/content/en/account';
import { ACCOUNT_JA as JA } from '../src/content/ja/account';
import { ACCOUNT_KO as KO } from '../src/content/ko/account';
import { dockStep } from '../src/components/rooms/dock';

describe('고정 버튼이 말하는 다음 할 일(dockStep)', () => {
  const base = { signedIn: true, hasSubject: true, needPartner: false, chosen: 1 };

  it('로그인 → 사람 → (궁합) 두 사람 → 사이 → 읽기 순서', () => {
    expect(dockStep({ ...base, signedIn: false })).toBe('signIn');
    expect(dockStep({ ...base, hasSubject: false })).toBe('pick');
    expect(dockStep({ ...base, needPartner: true, chosen: 1 })).toBe('pickTwo');
    expect(dockStep({ ...base, needPartner: true, chosen: 2 })).toBe('pickKind');
    expect(dockStep(base)).toBe('read');
  });

  it('사이 고르기 문구가 세 언어에 따로 있다', () => {
    expect(EN.picker.dockPickKind).toBeTruthy();
    expect(KO.picker.dockPickKind).toBeTruthy();
    expect(JA.picker.dockPickKind).toBeTruthy();
    expect(new Set([EN.picker.dockPickKind, KO.picker.dockPickKind, JA.picker.dockPickKind]).size).toBe(3);
  });
});
