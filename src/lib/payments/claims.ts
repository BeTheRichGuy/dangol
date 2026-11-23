import { serverAuthEnv } from '../account/server';

export const MAX_READINGS_PER_ORDER = 4;

export const REFUNDED_CLAIM = 998;

export async function claimReading(env: Record<string, string | undefined>, order: string, fetcher: typeof fetch = fetch): Promise<number | null> {
  const auth = serverAuthEnv(env);
  if (!auth) return null;
  try {
    const res = await fetcher(`${auth.url.replace(/\/+$/, '')}/rest/v1/rpc/claim_reading`, {
      method: 'POST',
      headers: { apikey: auth.key, Authorization: `Bearer ${auth.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_order: order }),
    });
    if (!res.ok) return null;
    const n: unknown = await res.json();
    return typeof n === 'number' && Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
