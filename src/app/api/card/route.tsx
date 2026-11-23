import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { TYPE_PROFILES as TYPES_EN } from '@/content/en/types';
import { FATE_EN } from '@/content/en/fate-map';
import { UI as UI_EN } from '@/content/en/ui';
import { FATE_JA } from '@/content/ja/fate-map';
import { FATE_KO } from '@/content/ko/fate-map';
import { TYPES_JA } from '@/content/ja/types';
import { UI_JA } from '@/content/ja/ui';
import { TYPES_KO } from '@/content/ko/types';
import { UI_KO } from '@/content/ko/ui';
import { overlay } from '@/content/locale';
import { CARD_ART_FILES, yulArtFor } from './art';
import { CARD_SIZE, CARD_TEXT, CardView, SEAL_GLYPH, type CardLayout, type CardViewProps, type LetterInfo, type MonthInfo } from './card-view';
import { CJK_FONTS, FONT_NAMES, loadCardFonts, loadCjkFonts, type CardFont } from './fonts';
import { monthSentence, monthToneSize } from './month';
import { parseCardLocale, parseCardParams, type CardLocale, type CardMonth } from './params';

const TYPES_BY_LOCALE = { en: TYPES_EN, ko: overlay(TYPES_EN, TYPES_KO), ja: overlay(TYPES_EN, TYPES_JA) } as const;
const CARD_COPY_BY_LOCALE = { en: UI_EN.card, ko: overlay(UI_EN, UI_KO).card, ja: overlay(UI_EN, UI_JA).card } as const;

const FATE_BY_LOCALE = { en: FATE_EN, ko: FATE_KO, ja: FATE_JA } as const;

function monthInfo(locale: CardLocale, m: CardMonth, regularNoLabel: string): MonthInfo {
  const c = CARD_COPY_BY_LOCALE[locale].month;
  const tone = FATE_BY_LOCALE[locale].months.tone[m.seat === 'month' ? 'harmonyMonth' : 'harmonyDay'];
  const ko = locale === 'ko';
  const sentence = monthSentence(locale, tone);
  return {
    month: m.month,
    year: m.year,
    label: locale === 'en' ? UI_EN.months[m.month - 1] : c.unit,
    tone: sentence,
    toneSize: monthToneSize(locale, sentence),
    copy: { eyebrow: c.eyebrow, strip: c.strip, ask: c.ask, regularNo: regularNoLabel },
    serif: locale === 'en' ? FONT_NAMES.title : CJK_FONTS[locale].serif,
    sans: locale === 'en' ? FONT_NAMES.body : CJK_FONTS[locale].sans,
    bodyWeight: locale === 'en' ? 400 : 500,
    keepAll: ko,
  };
}

function letterCopy(locale: CardLocale): LetterInfo['copy'] {
  const c = CARD_COPY_BY_LOCALE[locale];
  return { ...c.story, disclosure: c.disclosure, regularNo: c.regularNo };
}

const CACHE_LONG = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000';
const CACHE_SHORT = 'public, max-age=60';

const JPEG_QUALITY = 84;
const JPEG_QUALITY_SMALL = 80;

const assetCache = new Map<string, Promise<string | null>>();
function loadAsset(name: string): Promise<string | null> {
  let hit = assetCache.get(name);
  if (!hit) {
    hit = readFile(join(process.cwd(), 'src/app/api/card/assets', name))
      .then((data) => `data:image/jpeg;base64,${data.toString('base64')}`)
      .catch(() => null);
    assetCache.set(name, hit);
  }
  return hit;
}

function siteHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname;
    return host && host !== 'localhost' && host !== '127.0.0.1' && host !== '[::1]' ? host : null;
  } catch {
    return null;
  }
}

async function renderPng(view: CardViewProps, fonts: CardFont[], layout: CardLayout): Promise<ArrayBuffer> {
  const image = new ImageResponse(<CardView {...view} layout={layout} />, {
    ...CARD_SIZE[layout],

    fonts: fonts.length > 0 ? fonts : undefined,
  });
  return image.arrayBuffer();
}

interface Encoded {
  body: Uint8Array<ArrayBuffer> | ArrayBuffer;
  contentType: 'image/jpeg' | 'image/png';
}

async function encode(png: ArrayBuffer, layout: CardLayout, width: number | null): Promise<Encoded> {
  try {
    const { default: sharp } = await import('sharp');
    let image = sharp(Buffer.from(png));
    const small = width !== null && width < CARD_SIZE[layout].width;
    if (small) image = image.resize({ width });
    const jpeg = await image
      .jpeg({ quality: small ? JPEG_QUALITY_SMALL : JPEG_QUALITY, mozjpeg: true, chromaSubsampling: '4:4:4' })
      .toBuffer();
    return { body: new Uint8Array(jpeg), contentType: 'image/jpeg' };
  } catch {
    return { body: png, contentType: 'image/png' };
  }
}

function respond({ body, contentType }: Encoded, cacheControl: string, download: string | null = null): Response {
  const headers: Record<string, string> = { 'Content-Type': contentType, 'Cache-Control': cacheControl };

  if (download) headers['Content-Disposition'] = `attachment; filename="${download}.${contentType === 'image/png' ? 'png' : 'jpg'}"`;
  return new Response(body, { headers });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = parseCardLocale(searchParams);
  const { type, regularNo, og, width, month } = parseCardParams(searchParams, TYPES_BY_LOCALE[locale]);
  const layout: CardLayout = og ? 'og' : 'story';

  const monthOn = !og && month !== null;
  const monthView = monthOn && month ? monthInfo(locale, month, CARD_COPY_BY_LOCALE[locale].regularNo) : null;
  const letterOn = !og && type !== null && !monthOn;
  const copy = letterCopy(locale);
  const cjk = (letterOn || monthOn) && locale !== 'en' ? locale : null;
  const letterText = cjk && type && letterOn ? [copy.eyebrow, copy.kicker, copy.inLove, copy.ask, copy.disclosure, copy.regularNo, type.born, type.identity, type.inLove, '…0123456789'].join('') : '';
  const monthText = cjk && monthView ? [monthView.copy.eyebrow, monthView.copy.strip, monthView.copy.ask, monthView.copy.regularNo, monthView.label, monthView.tone, type ? type.born : '', '.。0123456789'].join('') : '';
  const cjkText = letterText + monthText;

  const yulArt = yulArtFor(type ? type.key : null);

  const brandOg = og && !type;
  const [fonts, yul, sogeum, brandArt, letterArt, cjkFonts] = await Promise.all([

    loadCardFonts(type || monthOn ? null : CARD_TEXT.brush, `${type ? type.hanzi : ''}${SEAL_GLYPH}${monthOn ? '0123456789' : ''}`),
    loadAsset(CARD_ART_FILES[yulArt]),
    loadAsset(CARD_ART_FILES.sogeum),
    brandOg ? loadAsset(CARD_ART_FILES.brandOg) : Promise.resolve(null),
    letterOn ? loadAsset(CARD_ART_FILES.backdoor) : Promise.resolve(null),
    cjk ? loadCjkFonts(cjk, cjkText) : Promise.resolve(null),
  ]);
  const host = siteHost();
  const letter: LetterInfo | null = letterArt
    ? {
        art: letterArt,
        copy,
        serif: cjk ? CJK_FONTS[cjk].serif : FONT_NAMES.title,
        sans: cjk ? CJK_FONTS[cjk].sans : FONT_NAMES.body,
        bodyWeight: cjk ? 500 : 400,
        keepAll: cjk === 'ko',
      }
    : null;

  const cacheControl =
    fonts.degraded || yul === null || sogeum === null || (brandOg && brandArt === null) || (letterOn && letterArt === null) || cjkFonts?.degraded
      ? CACHE_SHORT
      : CACHE_LONG;

  try {
    const png = await renderPng(
      { type, regularNo, hasHanzi: fonts.hasHanzi, hasBrush: fonts.hasBrush, yul, yulArt, sogeum, host, brandArt, letter, month: monthView },
      [...fonts.list, ...(cjkFonts?.list ?? [])],
      layout,
    );
    return respond(await encode(png, layout, width), cacheControl, searchParams.get('dl') === '1' ? (monthView ? `dangol-month-${monthView.month}` : `dangol-${type ? type.key : 'card'}`) : null);
  } catch (error) {

    console.error('[card] render failed:', error instanceof Error ? error.message : String(error));

    try {
      const png = await renderPng(
        { type: null, regularNo: null, hasHanzi: false, hasBrush: fonts.hasBrush, yul: null, sogeum: null, host },
        fonts.list,
        layout,
      );
      return respond(await encode(png, layout, width), CACHE_SHORT);
    } catch {
      return new Response('Card unavailable', { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
  }
}
