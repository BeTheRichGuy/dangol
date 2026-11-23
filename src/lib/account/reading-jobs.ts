import type { AuthEnv } from './config';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface JobPatch {

  body?: string | null;
  status?: 'done' | 'error';

  error?: string;
}

export interface ReadingJobStore {

  begin(jobId: string, token: string, expect: { room: string; locale: string }): Promise<boolean>;

  patch(jobId: string, token: string, patch: JobPatch): Promise<boolean>;
}

export type Schedule = (task: () => Promise<void>) => void;

export function readingJobStore(env: AuthEnv, fetcher: typeof fetch = fetch): ReadingJobStore {
  const base = `${env.url.replace(/\/+$/, '')}/rest/v1/readings`;
  const headers = (token: string, prefer: string) => ({
    apikey: env.key,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: prefer,
  });
  return {
    async begin(jobId, token, expect) {
      if (!UUID_RE.test(jobId)) return false;
      try {
        const q = new URLSearchParams({
          id: `eq.${jobId}`,
          status: 'eq.running',
          run_started_at: 'is.null',
          kind: `eq.${expect.room}`,
          locale: `eq.${expect.locale}`,
          select: 'id',
        });
        const res = await fetcher(`${base}?${q.toString()}`, {
          method: 'PATCH',
          headers: headers(token, 'return=representation'),
          body: JSON.stringify({ run_started_at: new Date().toISOString() }),
        });
        if (!res.ok) return false;
        const rows: unknown = await res.json().catch(() => null);
        return Array.isArray(rows) && rows.length === 1;
      } catch {
        return false;
      }
    },
    async patch(jobId, token, patch) {
      if (!UUID_RE.test(jobId)) return false;
      try {
        const row: Record<string, unknown> = {};
        if (patch.body !== undefined) row.body = patch.body;
        if (patch.status) row.status = patch.status;
        if (patch.error) row.error = patch.error.slice(0, 32);
        const res = await fetcher(`${base}?id=eq.${jobId}`, { method: 'PATCH', headers: headers(token, 'return=minimal'), body: JSON.stringify(row) });
        return res.ok;
      } catch {
        return false;
      }
    },
  };
}
