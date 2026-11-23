type Texts = Record<string, string | Record<string, string>>;

export function retext<T>(value: T, map: Texts): T {
  if (Array.isArray(value)) return value.map((v) => retext(v, map)) as unknown as T;
  if (value !== null && typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    const id = typeof rec.id === 'string' ? rec.id : null;
    const hit = id ? map[id] : undefined;
    if (hit !== undefined) {
      return (typeof hit === 'string' ? { ...rec, text: hit } : { ...rec, ...hit }) as T;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rec)) out[k] = retext(v, map);
    return out as T;
  }
  return value;
}
