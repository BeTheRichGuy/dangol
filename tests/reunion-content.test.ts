import { describe, expect, it } from 'vitest';
import { REUNION_EN } from '@/content/en/reunion';
import { REUNION_ROOM_EN } from '@/content/en/reunion-room';
import { OPENERS_EN } from '@/content/en/openers';
import { REUNION_JA } from '@/content/ja/reunion';
import { REUNION_ROOM_JA } from '@/content/ja/reunion-room';
import { OPENERS_JA } from '@/content/ja/openers';
import { REUNION_KO } from '@/content/ko/reunion';
import { REUNION_ROOM_KO } from '@/content/ko/reunion-room';
import { OPENERS_KO } from '@/content/ko/openers';
import { REUNION } from '@/content/reunion';
import { ROOMS_COPY } from '@/content/rooms';
import { CONTACT_IDS, LENGTH_IDS, REASON_IDS, SINCE_IDS, WANT_IDS, WHO_IDS } from '@/lib/reunion/intake';
import { FILLED_KEYS, FLOW_KEYS, FRAYED_KEYS } from '@/lib/reunion/pick';
import { MONTH_KINDS } from '@/lib/reunion/cards';
import { safetyHits } from '@/lib/reunion/safety';
import type { ReunionContent } from '@/lib/reunion/types';
import type { Locale } from '@/content/locale';

const CONTENT: Record<Locale, ReunionContent> = { ko: REUNION_KO, en: REUNION_EN, ja: REUNION_JA };
const ROOM = { ko: REUNION_ROOM_KO, en: REUNION_ROOM_EN, ja: REUNION_ROOM_JA } as const;
const OPENERS = { ko: OPENERS_KO.reunion, en: OPENERS_EN.reunion, ja: OPENERS_JA.reunion } as const;
const LOCALES: Locale[] = ['ko', 'en', 'ja'];

function strings(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(strings);
  if (v && typeof v === 'object') return Object.values(v).flatMap(strings);
  return [];
}

function allText(l: Locale): string[] {
  const c = CONTENT[l];
  const fns = [c.ui.stepOf(3, 7), c.cards.window.cardHead(2), c.cards.window.monthLabel(2026, 11), c.product.summary({ since: 'S', who: 'W', want: 'T' })];
  return [...strings(c), ...fns];
}

const BANNED: Record<Locale, RegExp> = {
  ko: /에너지|우주|매니페스트|사탕|(?<![가-힣])꿀|운명적|영혼의 ?(짝|동반자)|보장합니다/,
  en: /\b(cosmic|cosmos|energy|energies|universe|manifest(?:ing|ation)?|destined|destiny|soulmates?|fated|guarantee[sd]?|candy|honey|FYP)\b/i,
  ja: /エネルギー|宇宙|マニフェスト|飴|蜜|運命の人|ソウルメイト|保証します/,
};
const GENDER: Record<Locale, RegExp> = {
  ko: /여자|남자|여성|남성|그녀|남친|여친|남편|아내|아빠|엄마/,
  en: /\b(he|she|him|her|hers|his|boyfriend|girlfriend|man|woman|men|women|husband|wife|guy|girl|ex-boyfriend|ex-girlfriend)\b/i,
  ja: /彼女|彼氏|彼(?!方)|男性|女性|男の人|女の人|旦那|奥さん/,
};
const EMOJI = /\p{Extended_Pictographic}/u;
const DASH = /[—–]/;

const SLOTS = new Set(['{guide}', '{month}', '{name}', '{concern}']);

describe.each(LOCALES)('재회 문구 %s', (l) => {
  const c = CONTENT[l];

  it('금지 어휘·성별 단어·이모지·긴 줄표가 없다', () => {
    for (const s of allText(l)) {
      expect(s, s).not.toMatch(BANNED[l]);
      expect(s, s).not.toMatch(GENDER[l]);
      expect(s, s).not.toMatch(EMOJI);
      expect(s, s).not.toMatch(DASH);
    }
  });

  it('자리표시는 정해진 것뿐이고, 한 군데도 비어 있는 문장이 없다', () => {
    for (const s of allText(l)) {
      expect(s.trim().length, JSON.stringify(s)).toBeGreaterThan(0);
      for (const m of s.match(/\{[A-Za-z]+\}/g) ?? []) expect(SLOTS.has(m), `${m} in ${s}`).toBe(true);
    }
  });

  it('상대의 지금 마음·돌아올지·새 연인·확률을 단정한 문장이 없다', () => {
    for (const s of allText(l)) expect(safetyHits(s, l), s).toEqual({});
  });

  it('선택지 id 가 입력 계약과 정확히 같다', () => {
    const ids = (q: { options: readonly { id: string }[] }) => q.options.map((o) => o.id);
    expect(ids(c.intake.since)).toEqual([...SINCE_IDS]);
    expect(ids(c.intake.length)).toEqual([...LENGTH_IDS]);
    expect(ids(c.intake.who)).toEqual([...WHO_IDS]);
    expect(ids(c.intake.reasons)).toEqual([...REASON_IDS]);
    expect(ids(c.intake.contact)).toEqual([...CONTACT_IDS]);
    expect(ids(c.intake.want)).toEqual([...WANT_IDS]);
  });

  it('선택지 반응은 서로 다른 말이다', () => {
    const reactions = [c.intake.since, c.intake.length, c.intake.who, c.intake.reasons, c.intake.contact, c.intake.want].flatMap((q) => q.options.map((o) => o.reaction));
    expect(new Set(reactions).size).toBe(reactions.length);
  });

  it('결과 카드는 모든 갈래가 있고 길이가 한도 안이다', () => {
    const limit = l === 'en' ? { title: 48, body: 230 } : { title: 32, body: 150 };
    const cards = [
      ...FLOW_KEYS.map((k) => c.result.flow[k]),
      ...FILLED_KEYS.map((k) => c.result.filled[k]),
      ...FRAYED_KEYS.map((k) => c.result.frayed[k]),
      ...CONTACT_IDS.map((k) => c.result.contact[k]),
      ...WANT_IDS.map((k) => c.result.want[k]),
    ];
    expect(cards).toHaveLength(5 + 4 + 4 + 4 + 3);
    for (const card of cards) {
      expect([...card.title].length, card.title).toBeLessThanOrEqual(limit.title);
      expect([...card.body].length, card.body).toBeLessThanOrEqual(limit.body);
    }
    for (const k of FRAYED_KEYS) expect(c.result.labels[k].name.length).toBeGreaterThan(0);
    expect(c.result.locked).toHaveLength(3);
    expect(c.result.shareText).toContain('{name}');
  });

  it('결정론 카드 문구가 틀에 맞게 다 있다', () => {
    const k = c.cards;
    expect(k.readiness.items).toHaveLength(7);
    expect(k.paths.columns.map((p) => p.id)).toEqual(['reach', 'wait', 'letgo']);
    expect(k.paths.columns.some((p) => p.timing.includes('{month}'))).toBe(true);
    expect(Object.keys(k.window.kinds).sort()).toEqual([...MONTH_KINDS].sort());
    for (const kind of MONTH_KINDS) expect(new Set(k.window.kinds[kind].actions).size).toBe(3);
    for (const t of Object.values(k.kit.tones)) {
      expect(t.lines.length).toBeGreaterThanOrEqual(6);
      expect(new Set(t.lines).size).toBe(t.lines.length);
      for (const line of t.lines) expect([...line].length, line).toBeLessThanOrEqual(l === 'en' ? 120 : 60);
    }
    expect(k.kit.dontSend.length).toBeGreaterThanOrEqual(8);
    expect(k.kit.waiting.rules).toHaveLength(5);
    expect(k.days.nodes).toHaveLength(10);
    for (const f of FRAYED_KEYS) expect(k.rules.byFrayed[f]).toHaveLength(3);
    expect(k.letgo.steps).toHaveLength(5);
    expect(k.letgo.signals).toHaveLength(3);
    for (const w of WANT_IDS) expect(k.save.songLines[w]).toHaveLength(3);
    expect(k.window.monthLabel(2026, 11)).toMatch(/2026/);
  });

  it('상품 소개: 받는 것 목록, 문지기, 악장 이름 넷', () => {
    expect(c.product.includes.length).toBeGreaterThanOrEqual(6);
    expect(c.product.movements).toHaveLength(4);
    expect(c.product.gate.cta.length).toBeGreaterThan(0);
  });

  it('방 문구: 목차 12개, 웹툰 칸 대사 7개, 말하는 사람 표시가 없다', () => {
    const room = ROOM[l];
    expect(room.contents).toHaveLength(12);
    expect(room.story).toHaveLength(7);
    for (const s of strings(room)) {
      expect(s, s).not.toMatch(BANNED[l]);
      expect(s, s).not.toMatch(GENDER[l]);
      expect(s, s).not.toMatch(EMOJI);
      expect(s, s).not.toMatch(DASH);
    }
    const titles = (room.contents ?? []).map((t) => t?.title);
    expect(new Set(titles).size).toBe(12);
  });

  it('풀이 화면의 고정 첫 줄(openers)이 12개 있다', () => {
    const o = OPENERS[l];
    expect(o.lines).toHaveLength(12);
    expect(new Set(o.lines).size).toBe(12);
    expect(o.secondConcern).toContain('{concern}');
  });
});

describe('언어별 묶음', () => {
  it('REUNION 은 읽는 순간의 언어에서 꺼낸다', () => {
    expect(REUNION.hook.title.length).toBeGreaterThan(0);
  });

  it('영어 원본의 방 문구(ROOMS_COPY.reunion)는 목차 12개다', () => {
    expect(ROOMS_COPY.reunion.contents).toHaveLength(12);
    expect(ROOMS_COPY.keepers.u12.name.length).toBeGreaterThan(0);
  });

  it('세 언어의 문장은 서로 다른 글이다(번역해 옮기지 않았다)', () => {
    expect(REUNION_KO.hook.title).not.toBe(REUNION_EN.hook.title);
    expect(REUNION_JA.hook.title).not.toBe(REUNION_EN.hook.title);
  });
});
