import { hmacB64url } from '../payments/payments';

const text = (until: number) => `xmas-offer|${until}`;

export async function signXmasOffer(until: number, secret: string): Promise<string> {
  return `${until}.${(await hmacB64url(secret, text(until))).slice(0, 22)}`;
}

export async function readXmasOffer(token: unknown, secret: string, nowMs: number): Promise<{ until: number } | null> {
  if (typeof token !== 'string') return null;
  const m = /^(\d{1,16})\.([A-Za-z0-9_-]{22})$/.exec(token);
  if (!m) return null;
  const until = Number(m[1]);
  if (!Number.isSafeInteger(until) || until <= nowMs) return null;
  if ((await hmacB64url(secret, text(until))).slice(0, 22) !== m[2]) return null;
  return { until };
}
