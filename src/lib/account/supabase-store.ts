import type { SupabaseClient } from '@supabase/supabase-js';
import { isLocale } from '@/content/locale';
import { isReadingKind } from './archive';
import { cleanDraft, isRelation, personFromRow, rowFromDraft, sortPeople } from './person';
import type { AccountStore, JobState, Person, PersonPlace, PersonSnapshot, ReadingDraft, ReadingStatus, SavedReading } from './types';

const LIST_COLUMNS = 'id,kind,locale,people,question,concern,now_iso,created_at,status,error';
const JOB_COLUMNS = 'id,status,body,error,created_at,run_started_at,updated_at';

function statusOf(v: unknown): ReadingStatus {
  return v === 'running' || v === 'error' ? v : 'done';
}

function snapshotFromJson(v: unknown): PersonSnapshot | null {
  if (!v || typeof v !== 'object') return null;
  const s = v as Record<string, unknown>;
  const clean = cleanDraft({
    name: s.name as string,
    relation: isRelation(s.relation) ? s.relation : 'other',
    date: s.date as string,
    time: (s.time as string | null) ?? null,
    place: s.place as PersonPlace,
    sex: s.sex as PersonSnapshot['sex'],
  });
  if (!clean) return null;
  return { id: typeof s.id === 'string' ? s.id : null, ...clean };
}

export function readingFromRow(row: Record<string, unknown>): SavedReading | null {
  if (typeof row.id !== 'string' || !isReadingKind(row.kind) || !isLocale(row.locale)) return null;
  const people = Array.isArray(row.people) ? row.people.map(snapshotFromJson) : [];
  if (people.length === 0 || people.some((p) => p === null)) return null;
  return {
    id: row.id,
    kind: row.kind,
    locale: row.locale,
    people: people as PersonSnapshot[],
    question: typeof row.question === 'string' ? row.question : '',
    body: typeof row.body === 'string' ? row.body : null,
    concern: typeof row.concern === 'string' ? row.concern : null,
    nowIso: String(row.now_iso ?? ''),
    createdAt: String(row.created_at ?? ''),
    status: statusOf(row.status),
    error: typeof row.error === 'string' ? row.error : null,
  };
}

export function jobFromRow(row: Record<string, unknown>): JobState | null {
  if (typeof row.id !== 'string') return null;
  return {
    id: row.id,
    status: statusOf(row.status),
    body: typeof row.body === 'string' ? row.body : null,
    error: typeof row.error === 'string' ? row.error : null,
    createdAt: String(row.created_at ?? ''),
    startedAt: typeof row.run_started_at === 'string' ? row.run_started_at : null,
    updatedAt: String(row.updated_at ?? row.created_at ?? ''),
  };
}

export function rowFromReading(d: ReadingDraft): Record<string, unknown> {
  return {
    kind: d.kind,
    locale: d.locale,
    people: d.people,
    question: d.question.slice(0, 300),
    concern: d.concern,
    body: d.body,
    now_iso: d.nowIso,
  };
}

export function supabaseStore(sb: SupabaseClient): AccountStore {
  const fail = (what: string) => new Error(`store_${what}`);
  return {
    async listPeople() {
      const { data, error } = await sb.from('people').select('*');
      if (error) throw fail('people');
      return sortPeople((data ?? []).map((r) => personFromRow(r)).filter((p): p is Person => p !== null));
    },
    async savePerson(draft, id) {
      const clean = cleanDraft(draft);
      if (!clean) throw fail('invalid');

      if (clean.relation === 'self') {
        let q = sb.from('people').update({ relation: 'other' }).eq('relation', 'self');
        if (id) q = q.neq('id', id);
        const { error } = await q;
        if (error) throw fail('self');
      }
      const row = rowFromDraft(clean);
      const res = id
        ? await sb.from('people').update(row).eq('id', id).select('*').single()
        : await sb.from('people').insert(row).select('*').single();
      const person = res.data ? personFromRow(res.data) : null;
      if (res.error || !person) throw fail('save');
      return person;
    },
    async deletePerson(id) {
      const { error } = await sb.from('people').delete().eq('id', id);
      if (error) throw fail('delete');
    },
    async listReadings() {
      const { data, error } = await sb.from('readings').select(LIST_COLUMNS).order('created_at', { ascending: false });
      if (error) throw fail('readings');
      return (data ?? []).map((r) => readingFromRow(r as Record<string, unknown>)).filter((r): r is SavedReading => r !== null);
    },
    async getReading(id) {
      const { data, error } = await sb.from('readings').select('*').eq('id', id).maybeSingle();
      if (error) throw fail('reading');
      return data ? readingFromRow(data) : null;
    },
    async saveReading(draft) {
      const { data, error } = await sb.from('readings').insert(rowFromReading(draft)).select('*').single();
      const saved = data ? readingFromRow(data) : null;
      if (error || !saved) throw fail('save_reading');
      return saved;
    },
    async startReading(draft) {

      const row = { ...rowFromReading({ ...draft, body: null }), status: 'running' };
      const { data, error } = await sb.from('readings').insert(row).select('*').single();
      const saved = data ? readingFromRow(data) : null;
      if (error || !saved) throw fail('start_reading');
      return saved;
    },
    async jobStates(ids) {
      if (ids.length === 0) return [];
      const { data, error } = await sb.from('readings').select(JOB_COLUMNS).in('id', ids.slice(0, 20));
      if (error) throw fail('job_states');
      return (data ?? []).map((r) => jobFromRow(r as Record<string, unknown>)).filter((j): j is JobState => j !== null);
    },
    async deleteReading(id) {
      const { error } = await sb.from('readings').delete().eq('id', id);
      if (error) throw fail('delete_reading');
    },
  };
}
