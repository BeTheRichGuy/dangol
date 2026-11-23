import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCALES } from '@/content/locale';
import { computeChart, type BirthInput } from '@/lib/saju';
import { PRICES } from '@/lib/payments/prices';
import { buildRoomPayload } from '@/lib/rooms/payload';
import { PAID_PANELS } from '@/lib/rooms/paid-panels';
import { ROOM_KEYS, ROOMS } from '@/lib/rooms/themes';
import { dateCards, DATE_CARD_COUNT, firstOpenMonth, kitPick, pickMany, reunionCardPlan, seedOf, songDates, windowCalendar } from '@/lib/reunion/cards';
import { REUNION_ART, REUNION_ART_NAMES, REUNION_ART_READY, REUNION_STAND, reunionArtSrc, reunionPanelName } from '@/lib/reunion/art';
import { cleanConcern, CONCERN_MAX, contactIsCut, encodeIntakeTag, lengthPlan, parseIntake, splitIntakeTag, type ReunionIntake } from '@/lib/reunion/intake';
import { REUNION_GUIDE_NAME, REUNION_PRICE_TEXT, REUNION_PRICES } from '@/lib/reunion/product';
import { reunionSafetyWarnings, safetyHits } from '@/lib/reunion/safety';

const MINA: BirthInput = { date: '1998-03-21', time: '14:30', place: { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' }, sex: 'female' };
const JUN: BirthInput = { date: '1996-11-02', time: null, place: { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' }, sex: 'male' };
const NOW = '2026-11-08T03:00:00.000Z';
const INTAKE: ReunionIntake = { since: 'weeks', length: 'year3', who: 'them', reasons: ['talk', 'trust'], contact: 'ignored', want: 'reunite', concern: '먼저 연락해도 될까요' };

function reunionPayload(intake: ReunionIntake = INTAKE) {
  return buildRoomPayload({ room: 'reunion', locale: 'ko', chart: computeChart(MINA), nowIso: NOW, question: intake.concern, partner: { chart: computeChart(JUN), kind: 'lover' }, reunion: intake });
}

describe('상품 값 한 곳', () => {
  it('값 표기가 금액과 같다', () => {
    expect(REUNION_PRICES.ko).toEqual({ amount: 4900, currency: 'KRW' });
    for (const l of LOCALES) {
      const { amount, currency } = REUNION_PRICES[l];
      const shown = REUNION_PRICE_TEXT[l].replace(/[^0-9.]/g, '');
      expect(currency === 'USD' ? Math.round(Number(shown) * 100) : Number(shown.replace(/\./g, ''))).toBe(amount);
    }
  });

  it('방 하나의 보통 값과 같다(4,900원에 할인 없이. 올리자던 11-07 안과 6,900원 안은 바뀌었다)', () => {
    for (const l of LOCALES) expect(REUNION_PRICES[l]).toEqual(PRICES[l]);
  });

  it('다섯 방 목록·묶음에 재회가 들어가지 않는다', () => {
    expect([...ROOM_KEYS]).toEqual(['life', 'decades', 'love', 'match', 'year']);
    expect(ROOMS.reunion.keeper).toBe('u12');
    expect(ROOMS.reunion.needsPartner).toBe(true);
  });

  it('캐릭터 이름은 세 언어 모두 한 곳에서 온다', () => {
    for (const l of LOCALES) expect(REUNION_GUIDE_NAME[l].name.length).toBeGreaterThan(0);
  });
});

describe('입력 7문항', () => {
  it('올바른 값을 받는다', () => {
    expect(parseIntake(INTAKE)).toEqual(INTAKE);
    expect(parseIntake({ ...INTAKE, reasons: ['unsure'], concern: undefined })).toMatchObject({ reasons: ['unsure'], concern: '' });
  });

  it('틀린 값은 거절한다', () => {
    const bad: unknown[] = [
      null,
      [],
      { ...INTAKE, since: 'years' },
      { ...INTAKE, length: 3 },
      { ...INTAKE, reasons: [] },
      { ...INTAKE, reasons: ['talk', 'trust', 'bored'] },
      { ...INTAKE, reasons: ['unsure', 'talk'] },
      { ...INTAKE, reasons: ['nope'] },
      { ...INTAKE, contact: 'text' },
      { ...INTAKE, want: 'back' },
      { ...INTAKE, concern: 5 },
    ];
    for (const b of bad) expect(parseIntake(b), JSON.stringify(b)).toBeNull();
  });

  it('이유의 중복은 합치고 고민은 다듬어 120자로 자른다', () => {
    expect(parseIntake({ ...INTAKE, reasons: ['talk', 'talk'] })!.reasons).toEqual(['talk']);
    const long = cleanConcern(`  가나다\n\u0007라마  ${'바'.repeat(200)}`);
    expect(long.length).toBe(CONCERN_MAX);
    expect(long).not.toMatch(/[\n\u0007]/);
  });

  it('정리하고 싶다면 분량 배분이 letgo 다', () => {
    expect(lengthPlan({ want: 'letgo' })).toBe('letgo');
    expect(lengthPlan({ want: 'reunite' })).toBe('balanced');
    expect(lengthPlan({ want: 'unsure' })).toBe('balanced');
    expect(contactIsCut({ contact: 'blocked' })).toBe(true);
    expect(contactIsCut({ contact: 'ignored' })).toBe(false);
  });

  it('보관함 꼬리표는 왕복하고, 꼬리표가 없으면 입력이 없다', () => {
    const tagged = encodeIntakeTag(INTAKE);
    expect(tagged.length).toBeLessThanOrEqual(300);
    expect(splitIntakeTag(tagged)).toEqual({ concern: INTAKE.concern, intake: INTAKE });
    expect(splitIntakeTag('그냥 고민')).toEqual({ concern: '그냥 고민', intake: null });
    const empty = { ...INTAKE, concern: '' };
    expect(splitIntakeTag(encodeIntakeTag(empty))).toEqual({ concern: '', intake: empty });
    expect(splitIntakeTag('x\n[reunion:v1 since=days]').intake).toBeNull();
  });
});

describe('그림 배치표', () => {
  it('51장이고 비율은 세 가지뿐이다', () => {
    expect(REUNION_ART_NAMES).toHaveLength(51);
    expect(new Set(Object.values(REUNION_ART).map((a) => a.aspect))).toEqual(new Set(['wide', 'square', 'portrait']));
  });

  it('방 첫 화면 7장 + 12절 × 3칸 + 무료 7장 + 공유 카드가 모두 표에 있다', () => {
    for (let i = 1; i <= 7; i += 1) expect(REUNION_ART[`story-${i}`], `story-${i}`).toBeDefined();
    for (let c = 1; c <= 12; c += 1) for (const s of ['a', 'b', 'c'] as const) expect(REUNION_ART[reunionPanelName(c, s)]).toBeDefined();
    for (const n of ['free-hello', 'free-ask-1', 'free-ask-2', 'free-ritual-1', 'free-ritual-2', 'free-ritual-3', 'free-pitch', 'share-card']) expect(REUNION_ART[n], n).toBeDefined();
  });

  it('장면은 영어 한 문장이고 글자 든 종이를 요구하지 않는다', () => {
    for (const [name, art] of Object.entries(REUNION_ART)) {
      expect(art.scene.length, name).toBeGreaterThan(20);
      expect(art.scene, name).not.toMatch(/[가-힣]/);
      expect(art.scene, name).not.toMatch(/\b(?:scroll with|handwritten|calligraphy|hanja)\b/i);
    }
  });

  it('칸 배정표(PAID_PANELS.reunion)는 12절 × 3칸이고 같은 그림을 두 번 쓰지 않는다', () => {
    const chapters = PAID_PANELS.reunion;
    expect(chapters).toHaveLength(12);
    const files = chapters.flatMap((c) => c.map((p) => p.file));
    expect(files).toHaveLength(36);
    expect(new Set(files).size).toBe(36);
    for (const c of chapters) for (const p of c) expect(REUNION_ART[p.file.replace('reunion-u12/', '')], p.file).toBeDefined();
  });

  it('임시 그림 세 장이 있고, READY 가 아닐 때 그 비율의 임시 그림을 가리킨다', () => {
    for (const stand of Object.values(REUNION_STAND)) expect(existsSync(path.join(__dirname, '..', 'public', 'media', 'reunion-u12', `${stand}.jpg`)), stand).toBe(true);
    if (!REUNION_ART_READY) expect(reunionArtSrc('02-a')).toBe(`/media/reunion-u12/${REUNION_STAND.wide}.jpg`);
  });

  it('evidence lines starting with a greater-than sign are not scanned (readers never see them)', () => {
    expect(safetyHits('> 그 사람 마음은 닫혀 있다 (근거 메모)', 'ko')).toEqual({});
  });
});
