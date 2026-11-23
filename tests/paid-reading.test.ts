import { describe, expect, it } from 'vitest';
import { ROOMS_COPY as EN } from '@/content/en/rooms';
import { ROOMS_JA } from '@/content/ja/rooms';
import { ROOMS_KO } from '@/content/ko/rooms';
import { overlay } from '@/content/locale';
import { buildRoomPayload } from '@/lib/rooms/payload';
import { computeChart, type BirthInput } from '@/lib/saju';
import { loadPending, readPagePlan, readStage, savePending, writtenChapters, type PendingReading } from '../src/components/rooms/pending';

const MINA: BirthInput = { date: '1998-03-21', time: '14:30', place: { name: 'Los Angeles', country: 'US', lat: 34.05, lng: -118.24, tz: 'America/Los_Angeles' }, sex: 'female' };

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

const pending: PendingReading = {
  payload: buildRoomPayload({ room: 'life', locale: 'ko', chart: computeChart(MINA), nowIso: '2026-10-24T00:00:00.000Z', question: '', partner: null }),
  receipt: 'r.sig',
  readerName: 'Mina',
  draft: null,
};

describe('넘겨주기(pending)', () => {
  it('넣은 것을 그대로 꺼낸다', () => {
    const s = memoryStorage();
    savePending(s, 'life', pending);
    expect(loadPending(s, 'life')).toEqual(pending);
  });

  it('다른 방이나 깨진 값은 없는 것으로 본다', () => {
    const s = memoryStorage();
    savePending(s, 'life', pending);
    expect(loadPending(s, 'love')).toBeNull();
    s.setItem('dangol.pending.love.v1', '{not json');
    expect(loadPending(s, 'love')).toBeNull();
    s.setItem('dangol.pending.love.v1', JSON.stringify({ payload: null, receipt: 3 }));
    expect(loadPending(s, 'love')).toBeNull();

    s.setItem('dangol.pending.love.v1', JSON.stringify(pending));
    expect(loadPending(s, 'love')).toBeNull();
  });
});

describe('풀이 화면이 할 일(readPagePlan)', () => {
  it('견본이면 견본, 넘겨받은 것이 없으면 방으로, 저장된 풀이가 있으면 그것, 아니면 받기 시작', () => {
    expect(readPagePlan({ sample: true, pending: null, saved: null })).toBe('sample');
    expect(readPagePlan({ sample: false, pending: null, saved: null })).toBe('back');
    expect(readPagePlan({ sample: false, pending, saved: '[chapters]\n## A' })).toBe('show-saved');
    expect(readPagePlan({ sample: false, pending, saved: null })).toBe('start');
    expect(readPagePlan({ sample: false, pending: { ...pending, receipt: null }, saved: null })).toBe('start');
  });
});

describe('풀이 화면 문구', () => {
  it('세 언어에 방으로 돌아가는 말이 따로 있다', () => {
    const backs = [EN, overlay(EN, ROOMS_KO), overlay(EN, ROOMS_JA)].map((c) => c.page.readPage.back);
    expect(new Set(backs).size).toBe(3);
    for (const b of backs) expect(b.length).toBeGreaterThan(0);
  });
});

describe('다 쓴 뒤에 열기(readStage)', () => {
  it('기다리거나 흘러오는 동안은 준비 화면, 다 받으면 풀이, 오류는 오류', () => {
    expect(readStage('idle')).toBe('preparing');
    expect(readStage('waiting')).toBe('preparing');
    expect(readStage('streaming')).toBe('preparing');
    expect(readStage('done')).toBe('reading');
    expect(readStage('error')).toBe('error');
  });

  it('준비 화면은 다 쓴 절 수를 센다(쓰는 중인 마지막 절은 세지 않는다)', () => {
    expect(writtenChapters('')).toBe(0);
    expect(writtenChapters('[chapters]\n## A\n@1 a\n**L**\nBody')).toBe(0);
    expect(writtenChapters('[chapters]\n## A\n@1 a\n**L**\nBody\n> ev\n## B\n@1 b')).toBe(1);
  });

  it('준비 화면 문구가 세 언어에 따로 있다', () => {
    const copies = [EN, overlay(EN, ROOMS_KO), overlay(EN, ROOMS_JA)].map((c) => c.page.readPage);
    expect(new Set(copies.map((c) => c.preparing('Yul'))).size).toBe(3);
    expect(new Set(copies.map((c) => c.progress(3, 12))).size).toBe(3);
    for (const c of copies) expect(c.preparingNote.length).toBeGreaterThan(0);
    for (const c of copies) expect(c.progress(3, 12)).toMatch(/3/);
  });
});
