import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSaveModel, limitsOf, modelText, type SaveCardModel } from '../src/app/api/reunion-card/model';
import { calendarFrom, parseSaveRequest, saveCardUrl, saveQuery, SONG_LINE_COUNT, type SaveCard } from '../src/app/api/reunion-card/params';
import { GET } from '../src/app/api/reunion-card/route';
import { REUNION_EN } from '../src/content/en/reunion';
import { REUNION_JA } from '../src/content/ja/reunion';
import { REUNION_KO } from '../src/content/ko/reunion';
import type { Locale } from '../src/content/locale';
import { reunionArtSrc } from '../src/lib/reunion/art';
import { windowCalendar } from '../src/lib/reunion/cards';
import type { ReunionContent } from '../src/lib/reunion/types';
import { buildRoomPayload } from '../src/lib/rooms/payload';
import { computeChart, type BirthInput } from '../src/lib/saju';

const COPY: Record<Locale, ReunionContent> = { en: REUNION_EN, ko: REUNION_KO, ja: REUNION_JA };
const LOCALES: Locale[] = ['en', 'ko', 'ja'];
const LIMITS = limitsOf(REUNION_KO);
const parse = (query: string, limits = LIMITS) => parseSaveRequest(new URLSearchParams(query), limits);

const WINDOW = 'k=window&l=ko&f=2026-11&cal=bboooccceeee';
const KIT = 'k=kit&l=ko&p=1&a=2&n=3&ds=0.3.5.7.9';
const SONG = 'k=song&l=ko&s=4&d=2026-12,2027-02';

describe('쿼리 해석', () => {
  it('세 종류 카드를 읽는다', () => {
    expect(parse(WINDOW)?.card).toEqual({ kind: 'window', locale: 'ko', from: { year: 2026, month: 11 }, kinds: ['both', 'both', 'one', 'one', 'one', 'care', 'care', 'care', 'even', 'even', 'even', 'even'] });
    expect(parse(KIT)?.card).toEqual({ kind: 'kit', locale: 'ko', mode: 'kit', plain: 1, apology: 2, news: 3, dontSend: [0, 3, 5, 7, 9] });
    expect(parse('k=kit&l=ja&m=w')?.card).toEqual({ kind: 'kit', locale: 'ja', mode: 'waiting' });
    expect(parse(SONG)?.card).toEqual({ kind: 'song', locale: 'ko', line: 4, dates: [{ year: 2026, month: 12 }, { year: 2027, month: 2 }] });
    expect(parse('k=song&l=en&s=0')?.card).toEqual({ kind: 'song', locale: 'en', line: 0, dates: [] });
  });

  it('미리보기 폭과 내려받기 표시를 읽는다', () => {
    expect(parse(`${SONG}&w=360&dl=1`)).toMatchObject({ width: 360, download: true });
    expect(parse(SONG)).toMatchObject({ width: null, download: false });
  });

  it('잘못된 값은 거절한다', () => {
    const bad = [
      '',
      'l=ko',
      'k=window',
      'k=other&l=ko',
      'k=song&l=fr&s=0',
      'k=song&s=0',
      `${SONG}&w=500`,
      'k=song&l=ko&s=9',
      'k=song&l=ko&s=-1',
      'k=song&l=ko&s=x',
      'k=song&l=ko&s=0&d=2026-13',
      'k=song&l=ko&s=0&d=1999-01',
      'k=song&l=ko&s=0&d=2026-11,2026-12,2027-01,2027-02',
      'k=song&l=ko&s=0&d=2026-1',
      'k=window&l=ko&f=2026-11&cal=bboooccceee',
      'k=window&l=ko&f=2026-11&cal=bboooccceeeex',
      'k=window&l=ko&f=2026-11&cal=bbooocccxxxx',
      'k=window&l=ko&cal=bboooccceeee',
      'k=window&l=ko&f=20261&cal=bboooccceeee',
      'k=kit&l=ko&p=8&a=2&n=3&ds=0.3.5.7.9',
      'k=kit&l=ko&p=1&a=7&n=3&ds=0.3.5.7.9',
      'k=kit&l=ko&p=1&a=2&n=8&ds=0.3.5.7.9',
      'k=kit&l=ko&p=1&a=2&n=3&ds=0.3.5.7',
      'k=kit&l=ko&p=1&a=2&n=3&ds=0.3.5.7.10',
      'k=kit&l=ko&p=1&a=2&n=3&ds=0.3.5.7.7',
      'k=kit&l=ko&a=2&n=3&ds=0.3.5.7.9',
    ];
    for (const q of bad) expect(parse(q), q).toBeNull();
    expect(SONG_LINE_COUNT).toBe(9);
  });

  it('문장 번호의 한계는 그 언어의 문구 수다', () => {
    const tight = { plain: 2, apology: 2, news: 2, dontSend: 6 };
    expect(parse('k=kit&l=ko&p=1&a=1&n=1&ds=0.1.2.3.4', tight)).not.toBeNull();
    expect(parse('k=kit&l=ko&p=2&a=1&n=1&ds=0.1.2.3.4', tight)).toBeNull();
    expect(parse('k=kit&l=ko&p=1&a=1&n=1&ds=0.1.2.3.6', tight)).toBeNull();
    for (const l of LOCALES) {
      const lim = limitsOf(COPY[l]);
      expect(lim.dontSend).toBeGreaterThanOrEqual(5);
      expect(parse(`k=kit&l=${l}&p=${lim.plain - 1}&a=${lim.apology - 1}&n=${lim.news - 1}&ds=${[0, 1, 2, 3, lim.dontSend - 1].join('.')}`, lim), l).not.toBeNull();
      expect(parse(`k=kit&l=${l}&p=${lim.plain}&a=0&n=0&ds=0.1.2.3.4`, lim), l).toBeNull();
    }
  });

  it('개인정보 칸은 읽지 않고 카드에도 싣지 않는다', () => {
    const extra = 'name=Mina&nickname=Jun&birth=1998-03-21&date=1998-03-21&time=14:30&concern=%EC%97%B0%EB%9D%BD&q=hello&want=reunite&since=weeks&who=me&reasons=talk&contact=ignored&email=a%40b.c';
    for (const base of [WINDOW, KIT, SONG, 'k=kit&l=ko&m=w']) {
      const plain = parse(base);
      const loaded = parse(`${base}&${extra}`);
      expect(loaded).toEqual(plain);
      expect(loaded).not.toBeNull();
      expect(JSON.stringify(loaded)).not.toMatch(/Mina|Jun|1998|14:30|reunite|weeks|ignored|talk/);
      expect(saveQuery(loaded!.card)).not.toMatch(/Mina|Jun|1998|14:30|name|birth|concern|want|since|contact/);
    }
  });

  it('만든 쿼리는 다시 읽으면 같은 카드다', () => {
    const cards: SaveCard[] = [parse(WINDOW)!.card, parse(KIT)!.card, parse('k=kit&l=en&m=w')!.card, parse(SONG)!.card];
    for (const card of cards) {
      expect(parse(saveQuery(card))?.card).toEqual(card);
      expect(parse(saveQuery(card, { width: 540, download: true }))).toMatchObject({ card, width: 540, download: true });
      expect(saveCardUrl(card)).toMatch(/^\/api\/reunion-card\?k=/);
    }
  });
});

describe('달력 다시 만들기', () => {
  const MINA: BirthInput = { date: '1998-03-21', time: '14:30', place: { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' }, sex: 'female' };
  const JUN: BirthInput = { date: '1996-11-02', time: null, place: { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' }, sex: 'male' };

  it('시작 달과 갈래만으로 화면의 달력과 같은 달·행동을 만든다(해가 바뀌는 달력도)', () => {
    for (const nowIso of ['2026-11-08T03:00:00.000Z', '2026-01-15T03:00:00.000Z', '2026-12-31T03:00:00.000Z']) {
      const payload = buildRoomPayload({
        room: 'reunion',
        locale: 'ko',
        chart: computeChart(MINA),
        nowIso,
        partner: { chart: computeChart(JUN), kind: 'lover' },
        reunion: { since: 'weeks', length: 'year3', who: 'them', reasons: ['talk'], contact: 'ignored', want: 'reunite', concern: '' },
      });
      const cal = windowCalendar(payload);
      expect(calendarFrom({ year: cal[0].year, month: cal[0].month }, cal.map((m) => m.kind)), nowIso).toEqual(cal);
    }
  });
});

describe('카드에 올릴 글', () => {
  for (const locale of LOCALES) {
    it(`${locale}: 세 카드 모두 자리표시·금지 어휘 없이 그 언어 문구로 채운다`, () => {
      const copy = COPY[locale];
      const lim = limitsOf(copy);
      const cards: SaveCard[] = [
        { kind: 'window', locale, from: { year: 2026, month: 11 }, kinds: ['both', 'one', 'care', 'even', 'both', 'one', 'care', 'even', 'both', 'one', 'care', 'even'] },
        { kind: 'kit', locale, mode: 'kit', plain: lim.plain - 1, apology: 0, news: lim.news - 1, dontSend: [0, 1, 2, 3, lim.dontSend - 1] },
        { kind: 'kit', locale, mode: 'waiting' },
        { kind: 'song', locale, line: 8, dates: [{ year: 2026, month: 12 }] },
        { kind: 'song', locale, line: 0, dates: [] },
      ];
      for (const card of cards) {
        const model = buildSaveModel(card, copy);
        const text = modelText(model);
        expect(text, JSON.stringify(card)).not.toMatch(/\{guide\}|\{month\}|undefined|NaN|\[object/);
        if (locale === 'en') expect(text).not.toMatch(/\b(cosmic|energy|universe|manifest|destined|soulmate|fated|guarantee)/i);
        expect(model.footer).toBe(copy.cards.save.footer);
        expect(model.name.length).toBeGreaterThan(0);

        if (model.body.kind === 'kit') for (const d of model.body.dont) expect(d).not.toMatch(/[(（]/);
      }
    });
  }

  it('재회 창 카드는 날짜 카드 다섯 장(맞는 달 먼저)을 달력 순서로 싣는다', () => {
    const card: SaveCard = { kind: 'window', locale: 'ko', from: { year: 2026, month: 11 }, kinds: ['care', 'even', 'both', 'one', 'both', 'one', 'care', 'even', 'both', 'one', 'care', 'even'] };
    const model = buildSaveModel(card, REUNION_KO);
    expect(model.body.kind).toBe('window');
    const rows = model.body.kind === 'window' ? model.body.rows : [];
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.kind)).toEqual(['both', 'one', 'both', 'one', 'both']);
    expect(rows[0].when).toBe('2027년 1월');
    expect(rows[0].label).toBe(REUNION_KO.cards.window.kinds.both.label);
  });

  it('한 곡 카드는 번호에 맞는 한 줄 결론과 키 날짜를 싣는다', () => {
    const model = buildSaveModel({ kind: 'song', locale: 'ko', line: 4, dates: [{ year: 2026, month: 12 }, { year: 2027, month: 2 }] }, REUNION_KO);
    expect(model.body).toEqual({ kind: 'song', line: REUNION_KO.cards.save.songLines.letgo[1], datesLabel: REUNION_KO.cards.save.song.datesLabel, dates: ['2026년 12월', '2027년 2월'] });
    const en = buildSaveModel({ kind: 'song', locale: 'en', line: 8, dates: [] }, REUNION_EN);
    expect(en.body.kind === 'song' && en.body.line).toBe(REUNION_EN.cards.save.songLines.unsure[2]);
  });

  it('연락 키트 카드는 톤 셋의 첫 한 줄과 보내지 말 말 다섯을 싣는다', () => {
    const model: SaveCardModel = buildSaveModel({ kind: 'kit', locale: 'ko', mode: 'kit', plain: 1, apology: 2, news: 3, dontSend: [0, 3, 5, 7, 9] }, REUNION_KO);
    const body = model.body;
    expect(body.kind).toBe('kit');
    if (body.kind !== 'kit') return;
    expect(body.tones.map((t) => t.line)).toEqual([REUNION_KO.cards.kit.tones.plain.lines[1], REUNION_KO.cards.kit.tones.apology.lines[2], REUNION_KO.cards.kit.tones.news.lines[3]]);
    expect(body.dont).toHaveLength(5);
    expect(body.dont[0]).toBe('왜 연락 안 해? 나 무시하는 거야?');
  });
});

describe('라우트', () => {
  it('잘못된 값은 400 으로 거절한다(글꼴을 받지 않고 곧바로)', async () => {
    for (const q of ['', 'k=song&l=ko', 'k=song&l=fr&s=0', 'k=bad&l=ko', 'k=song&l=ko&s=99']) {
      const res = await GET(new Request(`http://localhost/api/reunion-card?${q}`));
      expect(res.status, q).toBe(400);
    }
  });

  it('바탕 그림 파일이 제자리에 있다', () => {
    expect(existsSync(join(__dirname, '../public', reunionArtSrc('share-card')))).toBe(true);
  });
});
