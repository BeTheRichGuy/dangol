export const LOCALES = ['en', 'ko', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', ko: '한국어', ja: '日本語' };

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
}

const KEY = 'dangol.locale.v1';

let active: Locale = DEFAULT_LOCALE;
const listeners = new Set<() => void>();

export function activeLocale(): Locale {
  return active;
}

export function subscribeLocale(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function emit() {
  for (const fn of listeners) fn();
}

export const COUNTRY_COOKIE = 'dangol.country';

const COUNTRY_LOCALE: Record<string, Locale> = { KR: 'ko', JP: 'ja' };

export function pickLocale(input: { saved: string | null; url?: string | null; country: string | null; browser: string }): Locale {
  if (isLocale(input.saved)) return input.saved;

  if (isLocale(input.url)) return input.url;
  const byCountry = COUNTRY_LOCALE[(input.country ?? '').toUpperCase()];
  if (byCountry) return byCountry;
  const nav = input.browser.toLowerCase();
  if (nav.startsWith('ko')) return 'ko';
  if (nav.startsWith('ja')) return 'ja';
  return DEFAULT_LOCALE;
}

function readCountryCookie(): string | null {
  const pair = document.cookie.split(';').map((p) => p.trim()).find((p) => p.startsWith(`${COUNTRY_COOKIE}=`));
  return pair ? pair.slice(COUNTRY_COOKIE.length + 1) : null;
}

export function storedLocale(): Locale {
  const read = <T,>(fn: () => T, fallback: T): T => {
    try {
      return fn();
    } catch {
      return fallback;
    }
  };
  return pickLocale({
    saved: read(() => window.localStorage.getItem(KEY), null),
    url: read(() => new URLSearchParams(window.location.search).get('l'), null),
    country: read(readCountryCookie, null),
    browser: read(() => navigator.language || '', ''),
  });
}

export function activateStoredLocale() {
  const next = storedLocale();
  if (next !== active) {
    active = next;
    emit();
  }
}

export function chooseLocale(next: Locale) {
  try {
    window.localStorage.setItem(KEY, next);
  } catch {

  }
  if (next !== active) {
    active = next;
    emit();
  }
}

export function setActiveLocaleForTest(next: Locale) {
  active = next;
}

type Path = readonly PropertyKey[];

function at(root: unknown, path: Path): unknown {
  let v = root;
  for (const k of path) {
    if (v === null || v === undefined) return undefined;
    v = (v as Record<PropertyKey, unknown>)[k];
  }
  return v;
}

export function localized<T extends object>(by: { en: T } & Record<Locale, NoInfer<T>>): T {
  const cache = new Map<string, object>();

  const current = (path: Path): unknown => {
    const v = at(by[active], path);
    return v === undefined ? at(by.en, path) : v;
  };

  const make = (path: Path): object => {
    const key = path.map(String).join('\u0000');
    const hit = cache.get(key);
    if (hit) return hit;
    const target = at(by.en, path) as object;
    const proxy = new Proxy(target, {
      get(_t, p) {
        const here = current(path) as Record<PropertyKey, unknown> | undefined;
        if (here === undefined || here === null) return undefined;
        const v = Reflect.get(here, p);
        if (v !== null && typeof v === 'object') return make([...path, p]);
        return v;
      },
      has(_t, p) {
        const here = current(path);
        return here !== null && typeof here === 'object' ? Reflect.has(here, p) : false;
      },
      ownKeys(t) {
        const here = current(path);
        const keys = here !== null && typeof here === 'object' ? Reflect.ownKeys(here) : [];

        for (const k of Reflect.ownKeys(t)) {
          const d = Reflect.getOwnPropertyDescriptor(t, k);
          if (d && !d.configurable && !keys.includes(k)) keys.push(k);
        }
        return keys;
      },
      getOwnPropertyDescriptor(t, p) {
        const here = current(path);
        const d = here !== null && typeof here === 'object' ? Reflect.getOwnPropertyDescriptor(here, p) : undefined;
        if (!d) return Reflect.getOwnPropertyDescriptor(t, p);
        const td = Reflect.getOwnPropertyDescriptor(t, p);
        if (!td || td.configurable) d.configurable = true;
        if ('value' in d && d.value !== null && typeof d.value === 'object') d.value = make([...path, p]);
        return d;
      },
    });
    cache.set(key, proxy);
    return proxy;
  };

  return make([]) as T;
}

export type DeepPartial<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends (...args: infer A) => infer R
      ? (...args: A) => R extends string ? string : R
      : T extends readonly (infer U)[]
        ? readonly DeepPartial<U>[]
        : T extends object
          ? { [K in keyof T]?: DeepPartial<T[K]> }
          : T;

export function overlay<T>(base: T, part: NoInfer<DeepPartial<T>> | undefined): T {
  if (part === undefined) return base;
  if (Array.isArray(base)) {
    const parts = part as unknown as readonly unknown[];
    return base.map((b, i) => overlay(b, parts[i] as DeepPartial<typeof b>)) as unknown as T;
  }
  if (base !== null && typeof base === 'object' && typeof part === 'object' && part !== null) {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [k, v] of Object.entries(part as Record<string, unknown>)) {
      out[k] = overlay((base as Record<string, unknown>)[k], v as never);
    }
    return out as T;
  }
  return part as T;
}

export function dateLocale(): string {
  if (active === 'ko') return 'ko-KR';
  if (active === 'ja') return 'ja-JP';
  const lang = typeof navigator !== 'undefined' ? navigator.language : '';
  return /^en(-|$)/i.test(lang) ? lang : 'en-US';
}
