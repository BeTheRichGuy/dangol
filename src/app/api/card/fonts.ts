export interface CardFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600;
  style: 'normal';
}

export const LATIN_TEXT = (() => {
  let text = '';
  for (let code = 0x20; code <= 0x7e; code += 1) text += String.fromCharCode(code);
  for (let code = 0xa0; code <= 0x17f; code += 1) text += String.fromCharCode(code);
  return text + '‘’“”–—…·•';
})();

const FETCH_TIMEOUT_MS = 5000;
const CACHE_LIMIT = 64;

const cache = new Map<string, Promise<ArrayBuffer | null>>();

export function disableKerning(font: ArrayBuffer): ArrayBuffer {
  try {
    const out = font.slice(0);
    const view = new DataView(out);
    const tableCount = view.getUint16(4);
    if (12 + tableCount * 16 > out.byteLength) return font;
    for (let i = 0; i < tableCount; i += 1) {
      const at = 12 + i * 16;
      const tag = String.fromCharCode(view.getUint8(at), view.getUint8(at + 1), view.getUint8(at + 2), view.getUint8(at + 3));
      if (tag === 'GPOS' || tag === 'kern') view.setUint8(at + 3, 0x7a);
    }
    return out;
  } catch {
    return font;
  }
}

async function fetchGoogleFont(family: string, weight: number | null, text: string): Promise<ArrayBuffer | null> {
  const axis = weight === null ? '' : `:wght@${weight}`;
  const cssUrl = `https://fonts.googleapis.com/css2?family=${family}${axis}&text=${encodeURIComponent(text)}`;
  try {
    const css = await (await fetch(cssUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })).text();
    const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
    if (!match) return null;
    const res = await fetch(match[1], { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

function loadGoogleFont(
  family: string,
  weight: number | null,
  text: string,
  options: { kerning?: boolean } = {},
): Promise<ArrayBuffer | null> {
  const key = `${family}|${weight}|${options.kerning === false ? 'nokern' : 'kern'}|${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const pending = fetchGoogleFont(family, weight, text).then((data) => {
    if (data === null) {
      cache.delete(key);
      return null;
    }
    return options.kerning === false ? disableKerning(data) : data;
  });
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, pending);
  return pending;
}

export interface CardFonts {

  list: CardFont[];

  hasHanzi: boolean;
  hasBrush: boolean;

  degraded: boolean;
}

export const FONT_NAMES = {
  title: 'Cormorant Garamond',
  body: 'Inter',
  brush: 'Nanum Brush Script',
  hanzi: 'Noto Serif KR',
} as const;

export const CJK_FONTS = {
  ko: { serif: 'Hahmlet', sans: 'Noto Sans KR' },
  ja: { serif: 'Shippori Mincho', sans: 'Zen Kaku Gothic New' },
} as const;

export async function loadCjkFonts(locale: 'ko' | 'ja', text: string): Promise<{ list: CardFont[]; degraded: boolean }> {
  const names = CJK_FONTS[locale];
  const family = (n: string) => n.replace(/ /g, '+');
  const chars = [...new Set(text)].join('');
  const [serif, sans, sansStrong] = await Promise.all([
    loadGoogleFont(family(names.serif), locale === 'ja' ? 500 : 400, chars),
    loadGoogleFont(family(names.sans), 500, chars),
    loadGoogleFont(family(names.sans), 700, chars),
  ]);
  const list: CardFont[] = [];
  if (serif) list.push({ name: names.serif, data: serif, weight: 500, style: 'normal' });
  if (sans) list.push({ name: names.sans, data: sans, weight: 500, style: 'normal' });
  if (sansStrong) list.push({ name: names.sans, data: sansStrong, weight: 600, style: 'normal' });
  return { list, degraded: serif === null || sans === null || sansStrong === null };
}

export async function loadCardFonts(brushText: string | null, hanziText: string | null): Promise<CardFonts> {
  const noKern = { kerning: false } as const;
  const [title, body, bodyStrong, brush, hanzi] = await Promise.all([
    loadGoogleFont('Cormorant+Garamond', 500, LATIN_TEXT, noKern),
    loadGoogleFont('Inter', 400, LATIN_TEXT, noKern),
    loadGoogleFont('Inter', 600, LATIN_TEXT, noKern),
    brushText ? loadGoogleFont('Nanum+Brush+Script', null, brushText) : Promise.resolve(null),
    hanziText ? loadGoogleFont('Noto+Serif+KR', 500, hanziText) : Promise.resolve(null),
  ]);

  const list: CardFont[] = [];
  if (title) list.push({ name: FONT_NAMES.title, data: title, weight: 500, style: 'normal' });
  if (body) list.push({ name: FONT_NAMES.body, data: body, weight: 400, style: 'normal' });
  if (bodyStrong) list.push({ name: FONT_NAMES.body, data: bodyStrong, weight: 600, style: 'normal' });
  if (brush) list.push({ name: FONT_NAMES.brush, data: brush, weight: 400, style: 'normal' });
  if (hanzi) list.push({ name: FONT_NAMES.hanzi, data: hanzi, weight: 500, style: 'normal' });

  return {
    list,
    hasHanzi: hanzi !== null,
    hasBrush: brush !== null,
    degraded:
      title === null ||
      body === null ||
      bodyStrong === null ||
      (brushText !== null && brush === null) ||
      (hanziText !== null && hanzi === null),
  };
}
