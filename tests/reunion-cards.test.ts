import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, describe, expect, it } from 'vitest';
import { REUNION } from '../src/content/reunion';
import { LOCALES, setActiveLocaleForTest, type Locale } from '../src/content/locale';
import { MovementDivider, ReunionCardsAfter, ReunionSummary, SaveCards, pathTiming, reunionCardDataNow } from '../src/components/reunion/cards/reunion-cards';
import {
  canSaveCards,
  cardFolded,
  movementAt,
  MOVEMENT_STARTS,
  REUNION_CARD_PLACE,
  reunionCardData,
  reunionCardsAfter,
  saveCardsOf,
  songFlatIndex,
  splitNote,
  startOpenChapters,
  type ReunionCardData,
} from '../src/components/reunion/cards/plan';
import { parseSaveRequest, saveQuery } from '../src/app/api/reunion-card/params';
import { limitsOf } from '../src/app/api/reunion-card/model';
import { REUNION_KO } from '../src/content/ko/reunion';
import { dateCards, firstOpenMonth, songDates, windowCalendar } from '../src/lib/reunion/cards';
import { FRAYED_KEYS } from '../src/lib/reunion/pick';
import { WANT_IDS, type ReunionIntake } from '../src/lib/reunion/intake';
import { buildRoomPayload } from '../src/lib/rooms/payload';
import { computeChart, type BirthInput } from '../src/lib/saju';

afterAll(() => setActiveLocaleForTest('en'));

const PLACE = { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' };
const MINA: BirthInput = { date: '1998-03-21', time: '14:30', place: PLACE, sex: 'female' };
const JUN: BirthInput = { date: '1996-11-02', time: null, place: PLACE, sex: 'male' };
const NOW = '2026-11-08T03:00:00.000Z';
const INTAKE: ReunionIntake = { since: 'weeks', length: 'year3', who: 'them', reasons: ['talk', 'trust'], contact: 'ignored', want: 'reunite', concern: '먼저 연락해도 될까요' };

function payloadOf(intake: ReunionIntake = INTAKE, other: BirthInput = JUN) {
  return buildRoomPayload({ room: 'reunion', locale: 'ko', chart: computeChart(MINA), nowIso: NOW, question: intake.concern, partner: { chart: computeChart(other), kind: 'lover' }, reunion: intake });
}

function dataOf(intake: ReunionIntake = INTAKE, locale: Locale = 'ko'): ReunionCardData {
  setActiveLocaleForTest(locale);
  const data = reunionCardDataNow(payloadOf(intake));
  if (!data) throw new Error('no card data');
  return data;
}

const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

const FORBIDDEN_EN = /\b(cosmic|energy|universe|manifest|destined|soulmate|fated|guarantee)/i;

describe('카드 놓는 자리', () => {
  it('절마다 놓는 카드: 7 점검표·세 길, 8 재회 창, 9 연락 키트, 11 첫 100일·규칙, 12 놓는 길', () => {
    expect(reunionCardsAfter(7)).toEqual(['readiness', 'paths']);
    expect(reunionCardsAfter(8)).toEqual(['window']);
    expect(reunionCardsAfter(9)).toEqual(['kit']);
    expect(reunionCardsAfter(11)).toEqual(['days', 'rules']);
    expect(reunionCardsAfter(12)).toEqual(['letgo']);
    for (const n of [1, 2, 3, 4, 5, 6, 10]) expect(reunionCardsAfter(n), `${n}절`).toEqual([]);
  });

  it('표에 있는 카드는 모두 어느 절엔가 놓이고, 12절을 넘지 않는다', () => {
    const placed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].flatMap((n) => reunionCardsAfter(n));
    expect(placed.sort()).toEqual(Object.keys(REUNION_CARD_PLACE).sort());
    for (const at of Object.values(REUNION_CARD_PLACE)) expect(at).toBeGreaterThanOrEqual(1);
    for (const at of Object.values(REUNION_CARD_PLACE)) expect(at).toBeLessThanOrEqual(12);
  });

  it('악장 구분선은 1·3·7·11절 앞에서 시작한다', () => {
    expect([...MOVEMENT_STARTS]).toEqual([1, 3, 7, 11]);
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => movementAt(n))).toEqual([0, null, 1, null, null, null, 2, null, null, null, 3, null]);
  });

  it("'놓고 싶다'면 7~10절 카드는 접고 12절 카드는 펼치며 12절을 처음부터 열어 둔다", () => {
    const letgo = { want: 'letgo' } as const;
    const keep = { want: 'reunite' } as const;
    for (const k of ['readiness', 'paths', 'window', 'kit'] as const) {
      expect(cardFolded(k, letgo), k).toBe(true);
      expect(cardFolded(k, keep), k).toBe(false);
    }
    for (const k of ['days', 'rules', 'letgo'] as const) expect(cardFolded(k, letgo), k).toBe(false);
    expect(startOpenChapters(letgo)).toEqual([12]);
    expect(startOpenChapters(keep)).toEqual([]);
  });

  it('문장 끝의 괄호 설명은 화면에서만 보이고 말만 따로 뗀다', () => {
    expect(splitNote('왜 연락 안 해? 나 무시하는 거야? (답을 압박하는 말이에요)')).toEqual({ quote: '왜 연락 안 해? 나 무시하는 거야?', note: '답을 압박하는 말이에요' });
    expect(splitNote('오랜만이야. 요즘 어떻게 지내?')).toEqual({ quote: '오랜만이야. 요즘 어떻게 지내?', note: '' });
    expect(splitNote('(전부 괄호)').quote).toBe('(전부 괄호)');
  });
});

describe('카드 값 고르기', () => {
  it('재회 묶음이 아니거나 입력·상대가 없으면 만들지 않는다(오래된 풀이는 글만)', () => {
    const p = payloadOf();
    const sizes = { plain: 8, apology: 7, news: 8, dontSend: 10 };
    expect(reunionCardData({ ...p, room: 'match' }, sizes)).toBeNull();
    expect(reunionCardData({ ...p, reunion: undefined }, sizes)).toBeNull();
    expect(reunionCardData({ ...p, partner: null }, sizes)).toBeNull();
    expect(reunionCardData(p, sizes)).not.toBeNull();
  });

  it('달력은 지금 달부터 열두 달이고, 날짜 카드·첫 맞는 달·키 날짜가 lib/reunion/cards 와 같다', () => {
    const data = dataOf();
    const cal = windowCalendar(payloadOf());
    expect(data.calendar).toEqual(cal);
    expect(data.calendar).toHaveLength(12);
    expect(data.calendar[0]).toMatchObject({ year: 2026, month: 11 });
    expect(data.dates).toEqual(dateCards(cal));
    expect(data.dates.length).toBeLessThanOrEqual(5);
    expect(data.open).toEqual(firstOpenMonth(cal));
    expect(data.songDates).toEqual(songDates(cal));
    expect(data.songDates.length).toBeLessThanOrEqual(3);
    for (const m of data.songDates) expect(['both', 'one']).toContain(m.kind);
  });

  it('연락이 막힌 입력(blocked)만 연락 키트 대신 기다림의 규칙', () => {
    expect(dataOf({ ...INTAKE, contact: 'blocked' }).kit.mode).toBe('waiting');
    for (const contact of ['ignored', 'sometimes', 'ongoing'] as const) expect(dataOf({ ...INTAKE, contact }).kit.mode, contact).toBe('kit');
  });

  it('같은 입력이면 같은 카드, 문장 번호는 문구 수 안에 있다', () => {
    const a = dataOf();
    const b = dataOf();
    expect(a).toEqual(b);
    const K = REUNION_KO.cards.kit;
    expect(a.kit.plain).toBeLessThan(K.tones.plain.lines.length);
    expect(a.kit.apology).toBeLessThan(K.tones.apology.lines.length);
    expect(a.kit.news).toBeLessThan(K.tones.news.lines.length);
    expect(new Set(a.kit.dontSend).size).toBe(5);
    for (const i of a.kit.dontSend) expect(i).toBeLessThan(K.dontSend.length);
    expect(a.songLine).toBeGreaterThanOrEqual(0);
    expect(a.songLine).toBeLessThan(3);
    expect(FRAYED_KEYS).toContain(a.frayed);
  });

  it('입력이 다르면 연락 키트의 문장이 달라질 수 있다(입력으로 고른다)', () => {
    const picks = new Set<string>();
    for (const since of ['days', 'weeks', 'months', 'year'] as const)
      for (const who of ['me', 'them', 'faded'] as const) {
        const d = dataOf({ ...INTAKE, since, who });
        picks.add(`${d.kit.plain}.${d.kit.apology}.${d.kit.news}.${d.kit.dontSend.join(',')}`);
      }
    expect(picks.size).toBeGreaterThan(1);
  });

  it('저장 카드 값: 열두 달 갈래·문장 번호·키 날짜뿐이고 쿼리에 입력 선택지·고민이 없다', () => {
    const data = dataOf();
    expect(canSaveCards(data)).toBe(true);
    const cards = saveCardsOf(data, 'ko');
    expect(cards.window).toMatchObject({ kind: 'window', from: { year: 2026, month: 11 } });
    expect(cards.window.kind === 'window' && cards.window.kinds).toHaveLength(12);
    expect(cards.song).toMatchObject({ kind: 'song', line: songFlatIndex('reunite', data.songLine) });
    const limits = limitsOf(REUNION_KO);
    for (const card of Object.values(cards)) {
      const q = saveQuery(card);
      expect(parseSaveRequest(new URLSearchParams(q), limits)?.card, q).toEqual(card);
      expect(decodeURIComponent(q)).not.toContain(INTAKE.concern);
      for (const word of ['reunite', 'letgo', 'weeks', 'year3', 'ignored', 'talk', 'trust', 'concern', 'name', 'birth']) expect(q, word).not.toContain(word);
    }
  });

  it('한 곡 카드 번호는 원하는 것 셋 × 후보 셋을 0~8 로 펴고, 같은 번호는 그 문장으로 돌아온다', () => {
    expect(WANT_IDS.flatMap((w) => [0, 1, 2].map((i) => songFlatIndex(w, i)))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('카드 컴포넌트가 세 언어 문구를 읽는다', () => {
  for (const locale of LOCALES) {
    it(`${locale}: 절 끝 카드를 그리고 자리표시·금지 어휘·빈 값이 남지 않는다`, () => {
      const data = dataOf(INTAKE, locale);
      const all = [7, 8, 9, 11, 12].map((n) => renderToStaticMarkup(createElement(ReunionCardsAfter, { n, data }))).join('\n');
      const save = renderToStaticMarkup(createElement(SaveCards, { data }));
      const extras = [0, 1, 2, 3].map((index) => renderToStaticMarkup(createElement(MovementDivider, { index }))).join('') + renderToStaticMarkup(createElement(ReunionSummary, { intake: data.intake }));
      const out = `${all}\n${save}\n${extras}`;
      expect(out).not.toMatch(/\{guide\}|\{month\}|\{name\}|undefined|NaN|\[object/);
      if (locale === 'en') expect(out).not.toMatch(FORBIDDEN_EN);
      const C = REUNION.cards;

      for (const title of [C.readiness.title, C.paths.title, C.window.title, C.kit.title, C.days.title, C.rules.title, C.letgo.title, C.save.title]) expect(out, title).toContain(title);

      expect(all.match(/type="checkbox"/g)).toHaveLength(7);

      expect(all.match(/data-path="/g)).toHaveLength(3);

      expect(all.match(/class="ru-month"/g)).toHaveLength(12);
      expect(all.match(/class="ru-date"/g)?.length ?? 0).toBeLessThanOrEqual(5);

      expect(all.match(/class="ru-copy"/g)).toHaveLength(3);
      expect(all.match(/ru-dont/g)).toHaveLength(1);
      expect(all.match(/<li><span>/g)).toHaveLength(5);

      expect(all.match(/class="ru-day"/g)).toHaveLength(C.days.nodes.length);
      expect(all.match(/class="ru-rulecard"/g)).toHaveLength(3);

      expect(save.match(/download=""/g)).toHaveLength(3);
      expect(save).toContain(C.save.footer);

      for (const href of save.matchAll(/href="([^"]+)"/g)) expect(href[1]).toMatch(/^\/api\/reunion-card\?/);
    });
  }

  it('세 갈래 길은 버튼 셋으로 시작하고, 길을 누르기 전에는 어느 길의 내용도 보이지 않는다', () => {
    const data = dataOf();
    const out = renderToStaticMarkup(createElement(ReunionCardsAfter, { n: 7, data }));
    const P = REUNION.cards.paths;
    for (const col of P.columns) {
      expect(out).toContain(`data-path="${col.id}"`);
      expect(out).toContain(esc(col.name));
      expect(out).not.toContain(esc(col.when));
    }
    expect(out.match(/class="ru-pathtab"/g)).toHaveLength(3);
    expect(out).not.toContain('class="ru-path"');
    expect(out).toContain('aria-pressed="false"');
  });

  it('세 길 문구의 {month} 자리에 재회 창의 첫 맞는 달이 들어가고, 달이 없으면 안내 문장이 대신한다', () => {
    const data = dataOf();
    expect(data.open).not.toBeNull();
    const month = REUNION.cards.window.monthLabel(data.open!.year, data.open!.month);
    const P = REUNION.cards.paths;
    const withTemplate = P.columns.filter((c) => c.timing.includes('{month}'));
    expect(withTemplate.length).toBeGreaterThan(0);
    for (const col of P.columns) {
      const filled = pathTiming(col.timing, month, P.noMonth);
      expect(filled).not.toContain('{month}');
      const empty = pathTiming(col.timing, null, P.noMonth);
      expect(empty).not.toContain('{month}');
      if (col.timing.includes('{month}')) {
        expect(filled).toContain(month);
        expect(empty).toBe(P.noMonth);
      } else {
        expect(filled).toBe(col.timing);
      }
    }
  });

  it('재회 창 달력은 달의 갈래마다 색 띠와 글자 이름표, 행동 한 가지를 가진다', () => {
    const data = dataOf();
    const out = renderToStaticMarkup(createElement(ReunionCardsAfter, { n: 8, data }));
    const W = REUNION.cards.window;
    for (const m of data.calendar) {
      expect(out).toContain(`data-kind="${m.kind}"`);
      expect(out).toContain(W.kinds[m.kind].label);
      expect(out).toContain(esc(W.kinds[m.kind].actions[m.action]));
    }
  });

  it('보내지 말 말의 괄호 설명은 작은 글씨로 따로 나오고, 복사하는 말에는 들어가지 않는다', () => {
    const data = dataOf();
    const out = renderToStaticMarkup(createElement(ReunionCardsAfter, { n: 9, data }));
    expect(out).toContain('<small>');
    expect(out).not.toMatch(/（|\(.*(말이에요|이에요)\)/);
  });

  it("'놓고 싶다'를 고르면 7·8·9절 카드는 접히고 12절 카드는 펼쳐 있다", () => {
    const letgo = dataOf({ ...INTAKE, want: 'letgo' });
    for (const n of [7, 8, 9]) expect(renderToStaticMarkup(createElement(ReunionCardsAfter, { n, data: letgo })), `${n}절`).toContain('<details');
    const open12 = renderToStaticMarkup(createElement(ReunionCardsAfter, { n: 12, data: letgo }));
    expect(open12).not.toContain('<details');
    expect(open12).toContain(REUNION.cards.letgo.title);

    expect(renderToStaticMarkup(createElement(ReunionCardsAfter, { n: 11, data: letgo }))).not.toContain('<details');

    const keep = dataOf();
    for (const n of [7, 8, 9, 11, 12]) expect(renderToStaticMarkup(createElement(ReunionCardsAfter, { n, data: keep })), `${n}절`).not.toContain('<details');
  });

  it('연락이 막힌 입력은 9절에 기다림의 규칙을 보이고 첫 한 줄 복사 단추가 없다', () => {
    const blocked = dataOf({ ...INTAKE, contact: 'blocked' });
    const out = renderToStaticMarkup(createElement(ReunionCardsAfter, { n: 9, data: blocked }));
    const K = REUNION.cards.kit;
    expect(out).toContain(K.waiting.title);
    for (const rule of K.waiting.rules) expect(out).toContain(esc(rule));
    expect(out).not.toContain('class="ru-copy"');
    expect(out).not.toContain(K.dontSendTitle);
  });

  it('관계 규칙 카드는 어긋난 자리 갈래의 규칙 셋을 보인다', () => {
    const data = dataOf();
    const out = renderToStaticMarkup(createElement(ReunionCardsAfter, { n: 11, data }));
    for (const rule of REUNION.cards.rules.byFrayed[data.frayed]) {
      expect(out).toContain(esc(rule.title));
    }
    for (const w of REUNION.cards.rules.warnings) expect(out).toContain(esc(w));
  });

  it('상황 요약 한 줄은 입력 선택지의 이름이고 고민 원문은 없다', () => {
    const out = renderToStaticMarkup(createElement(ReunionSummary, { intake: INTAKE }));
    const I = REUNION.intake;
    expect(out).toContain(I.since.options.find((o) => o.id === INTAKE.since)!.label);
    expect(out).toContain(I.who.options.find((o) => o.id === INTAKE.who)!.label);
    expect(out).toContain(I.want.options.find((o) => o.id === INTAKE.want)!.label);
    expect(out).not.toContain(INTAKE.concern);
  });

  it('카드가 없는 절은 아무것도 그리지 않는다', () => {
    const data = dataOf();
    for (const n of [1, 2, 3, 4, 5, 6, 10]) expect(renderToStaticMarkup(createElement(ReunionCardsAfter, { n, data })), `${n}절`).toBe('');
  });
});
