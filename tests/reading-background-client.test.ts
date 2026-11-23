import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { jobFromRow, readingFromRow, supabaseStore } from '../src/lib/account/supabase-store';
import { previewStore, type KeyValue } from '../src/lib/account/preview-store';
import type { JobState, ReadingDraft } from '../src/lib/account/types';
import { buildRoomPayload } from '../src/lib/rooms/payload';
import { computeChart, type BirthInput } from '../src/lib/saju';
import { clearJobId, JOB_START_MS, JOB_STALE_MS, loadJobId, saveJobId, viewOfJob } from '../src/components/rooms/use-room-reading';

const NOW = Date.UTC(2026, 10, 4, 12);
const iso = (ms: number) => new Date(ms).toISOString();
const job = (over: Partial<JobState> = {}): JobState => ({ id: 'j1', status: 'running', body: null, error: null, createdAt: iso(NOW - 10_000), startedAt: iso(NOW - 9_000), updatedAt: iso(NOW - 5_000), ...over });

describe('보관함 행 → 화면 상태', () => {
  it('행이 없으면 gone, 다 썼으면 done, 글이 비어 있는 done 은 오류', () => {
    expect(viewOfJob(null, NOW)).toEqual({ phase: 'gone' });
    expect(viewOfJob(job({ status: 'done', body: '[chapters]\nhello' }), NOW)).toEqual({ phase: 'done', text: '[chapters]\nhello' });
    expect(viewOfJob(job({ status: 'done', body: '  ' }), NOW)).toEqual({ phase: 'error', error: 'api' });
    expect(viewOfJob(job({ status: 'done', body: null }), NOW)).toEqual({ phase: 'error', error: 'api' });
  });

  it('멈춘 행은 서버가 적은 코드를 화면 오류로(모르는 코드는 api)', () => {
    for (const code of ['refusal', 'busy', 'api', 'incomplete']) expect(viewOfJob(job({ status: 'error', error: code }), NOW)).toEqual({ phase: 'error', error: code });
    expect(viewOfJob(job({ status: 'error', error: 'weird' }), NOW)).toEqual({ phase: 'error', error: 'api' });
    expect(viewOfJob(job({ status: 'error', error: null }), NOW)).toEqual({ phase: 'error', error: 'api' });
  });

  it('쓰는 중: 글이 있으면 차오르는 중, 없으면 기다리는 중', () => {
    expect(viewOfJob(job({ body: 'AAA' }), NOW)).toEqual({ phase: 'streaming', text: 'AAA' });
    expect(viewOfJob(job({ body: null }), NOW)).toEqual({ phase: 'waiting' });
    expect(viewOfJob(job({ body: '' }), NOW)).toEqual({ phase: 'waiting' });
  });

  it('서버가 쓰기를 시작하지 않은 채 1분이 지나면 연결 오류(요청이 닿지 않았다), 그 안에는 기다린다', () => {
    expect(viewOfJob(job({ startedAt: null, createdAt: iso(NOW - JOB_START_MS + 5000), updatedAt: iso(NOW - JOB_START_MS + 5000) }), NOW)).toEqual({ phase: 'waiting' });
    expect(viewOfJob(job({ startedAt: null, createdAt: iso(NOW - JOB_START_MS - 1000), updatedAt: iso(NOW - 1000) }), NOW)).toEqual({ phase: 'error', error: 'network' });
  });

  it('쓰는 중인데 서버가 9분 넘게 아무것도 적지 않으면 멈춘 것(incomplete)', () => {
    expect(viewOfJob(job({ updatedAt: iso(NOW - JOB_STALE_MS + 1000) }), NOW)).toEqual({ phase: 'waiting' });
    expect(viewOfJob(job({ updatedAt: iso(NOW - JOB_STALE_MS - 1000) }), NOW)).toEqual({ phase: 'error', error: 'incomplete' });

    expect(viewOfJob(job({ updatedAt: iso(NOW - 5 * 60 * 1000) }), NOW)).toEqual({ phase: 'waiting' });
  });
});

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => Array.from(m.keys())[i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, v),
  };
}

const input: BirthInput = { date: '1995-03-14', time: '09:30', place: { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' }, sex: 'female' };
const payload = (room: 'life' | 'love' = 'life', question = '') => buildRoomPayload({ room, locale: 'ko', chart: computeChart(input), nowIso: '2026-11-04T00:00:00Z', question, partner: null });

describe('돌아오면 이어 보는 행 번호', () => {
  it('풀이마다 번호를 두고, 같은 풀이(날짜가 달라도)에서 읽히고, 다른 방·질문과 섞이지 않는다', () => {
    const s = memoryStorage();
    saveJobId(s, 'life', payload('life'), 'row-1', NOW);
    expect(loadJobId(s, 'life', payload('life'), NOW + 1000)).toBe('row-1');
    const nextDay = buildRoomPayload({ room: 'life', locale: 'ko', chart: computeChart(input), nowIso: '2026-11-05T00:00:00Z', question: '', partner: null });
    expect(loadJobId(s, 'life', nextDay, NOW)).toBe('row-1');
    expect(loadJobId(s, 'love', payload('love'), NOW)).toBeNull();
    expect(loadJobId(s, 'life', payload('life', '다른 질문'), NOW)).toBeNull();
  });

  it('한 시간이 지나면 잊고, 지울 수 있고, 망가진 값은 없는 것으로 본다', () => {
    const s = memoryStorage();
    saveJobId(s, 'life', payload(), 'row-1', NOW);
    expect(loadJobId(s, 'life', payload(), NOW + 61 * 60 * 1000)).toBeNull();
    clearJobId(s, 'life', payload());
    expect(loadJobId(s, 'life', payload(), NOW)).toBeNull();
    s.setItem(`dangol.job.life.x`, 'not json');
    expect(loadJobId(s, 'life', payload(), NOW)).toBeNull();
  });
});

describe('행 읽기', () => {
  const base = {
    id: 'r1',
    kind: 'life',
    locale: 'ko',
    people: [{ id: null, name: '하늘', relation: 'self', date: '1997-09-12', time: '21:40', place: { name: 'Seoul', country: 'KR', lat: 37.5, lng: 127, tz: 'Asia/Seoul', label: 'Seoul, KR' }, sex: 'female' }],
    question: '',
    concern: null,
    now_iso: '2026-11-04T00:00:00Z',
    created_at: '2026-11-04T00:00:00Z',
  };

  it('옛 행(status 칸이 없다)은 다 쓴 풀이다. running·error 는 그대로', () => {
    expect(readingFromRow(base)?.status).toBe('done');
    expect(readingFromRow({ ...base, status: 'running', body: null })).toMatchObject({ status: 'running', body: null, error: null });
    expect(readingFromRow({ ...base, status: 'error', error: 'busy' })).toMatchObject({ status: 'error', error: 'busy' });
    expect(readingFromRow({ ...base, status: 'weird' })?.status).toBe('done');
  });

  it('jobFromRow: 쓰는 모습만 뽑는다', () => {
    expect(jobFromRow({ id: 'r1', status: 'running', body: 'AA', error: null, created_at: 'c', run_started_at: 's', updated_at: 'u' })).toEqual({ id: 'r1', status: 'running', body: 'AA', error: null, createdAt: 'c', startedAt: 's', updatedAt: 'u' });
    expect(jobFromRow({ id: 'r1', status: 'done', created_at: 'c' })).toMatchObject({ startedAt: null, updatedAt: 'c', body: null });
    expect(jobFromRow({ status: 'done' })).toBeNull();
  });
});

describe('행을 만들고 읽는 저장소', () => {
  const draft: ReadingDraft = {
    kind: 'life',
    locale: 'ko',
    people: [{ id: 'p1', name: '하늘', relation: 'self', date: '1997-09-12', time: '21:40', place: { name: 'Seoul', country: 'KR', lat: 37.5, lng: 127, tz: 'Asia/Seoul', label: 'Seoul, KR' }, sex: 'female' }],
    question: '',
    concern: null,
    nowIso: '2026-11-04T00:00:00Z',
    body: '이 글은 버려진다',
  };

  function fakeClient() {
    const calls: { table: string; op: string; arg: unknown }[] = [];
    const sb = {
      from(table: string) {
        return {
          insert(row: Record<string, unknown>) {
            calls.push({ table, op: 'insert', arg: row });
            return {
              select: () => ({ single: async () => ({ data: { id: 'new-id', owner: 'u', created_at: '2026-11-04T00:00:00Z', ...row }, error: null }) }),
            };
          },
          select(cols: string) {
            return {
              in: async (col: string, ids: string[]) => {
                calls.push({ table, op: 'select.in', arg: { cols, col, ids } });
                return { data: ids.map((id) => ({ id, status: 'running', body: 'AA', error: null, created_at: 'c', run_started_at: 's', updated_at: 'u' })), error: null };
              },
            };
          },
        };
      },
    } as unknown as SupabaseClient;
    return { sb, calls };
  }

  it('startReading: 쓰는 중(running)으로, 글 없이 만든다. 사람 정보는 이 행에 브라우저가 직접 넣는다', async () => {
    const { sb, calls } = fakeClient();
    const saved = await supabaseStore(sb).startReading(draft);
    expect(saved).toMatchObject({ id: 'new-id', status: 'running', body: null });
    const row = calls[0].arg as Record<string, unknown>;
    expect(calls[0]).toMatchObject({ table: 'readings', op: 'insert' });
    expect(row).toMatchObject({ kind: 'life', locale: 'ko', status: 'running', body: null });
    expect(row.people).toEqual(draft.people);
  });

  it('jobStates: 번호로 한꺼번에 읽는다(스무 개까지), 빈 목록은 부르지 않는다', async () => {
    const { sb, calls } = fakeClient();
    const store = supabaseStore(sb);
    expect(await store.jobStates([])).toEqual([]);
    expect(calls).toHaveLength(0);
    const ids = Array.from({ length: 30 }, (_, i) => `id-${i}`);
    const got = await store.jobStates(ids);
    expect(got).toHaveLength(20);
    expect(got[0]).toMatchObject({ status: 'running', body: 'AA', startedAt: 's' });
    expect((calls[0].arg as { ids: string[] }).ids).toHaveLength(20);
  });

  it('이 컴퓨터의 미리보기에는 백그라운드가 없다(스트리밍으로 받는다)', async () => {
    const data = new Map<string, string>();
    const kv: KeyValue = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
    const store = previewStore(kv, { now: () => '2026-11-04T00:00:00Z', newId: () => 'id1' });
    await expect(store.startReading(draft)).rejects.toThrow('background_unsupported');
    expect(await store.jobStates(['id1'])).toEqual([]);
    expect(await store.saveReading(draft)).toMatchObject({ status: 'done', error: null });
  });
});
