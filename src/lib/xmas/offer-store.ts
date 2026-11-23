export const XMAS_OFFER_KEY = 'dangol.xmas.offer';

export function parseXmasOffer(raw: string | null): { token: string; until: number } | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== 'object') return null;
    const o = v as Record<string, unknown>;
    if (typeof o.token !== 'string' || !o.token || o.token.length > 200) return null;
    if (typeof o.until !== 'number' || !Number.isFinite(o.until)) return null;
    return { token: o.token, until: o.until };
  } catch {
    return null;
  }
}

export function loadXmasOffer(): { token: string; until: number } | null {
  try {
    return parseXmasOffer(window.localStorage.getItem(XMAS_OFFER_KEY));
  } catch {
    return null;
  }
}

export function saveXmasOffer(o: { token: string; until: number }): void {
  try {
    window.localStorage.setItem(XMAS_OFFER_KEY, JSON.stringify({ token: o.token, until: o.until }));
  } catch {

  }
}
