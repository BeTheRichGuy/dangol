import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { REUNION_EN } from '@/content/en/reunion';
import { REUNION_JA } from '@/content/ja/reunion';
import { REUNION_KO } from '@/content/ko/reunion';
import type { Locale } from '@/content/locale';
import { reunionArtSrc } from '@/lib/reunion/art';
import type { ReunionContent } from '@/lib/reunion/types';
import { CJK_FONTS, FONT_NAMES, loadCardFonts, loadCjkFonts, type CardFont } from '../card/fonts';
import { SAVE_CARD_SIZE, SaveCardView, type SaveCardFonts } from './card-view';
import { buildSaveModel, limitsOf, modelText } from './model';
import { parseSaveRequest } from './params';

const CACHE_LONG = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000';
const CACHE_SHORT = 'public, max-age=60';
const JPEG_QUALITY = 84;
const JPEG_QUALITY_SMALL = 80;

const COPY_BY_LOCALE: Record<Locale, ReunionContent> = { en: REUNION_EN, ko: REUNION_KO, ja: REUNION_JA };

const artCache = new Map<string, Promise<string | null>>();
function loadArt(src: string): Promise<string | null> {
  let hit = artCache.get(src);
  if (!hit) {
    hit = readFile(join(process.cwd(), 'public', src))
      .then((data) => `data:image/jpeg;base64,${data.toString('base64')}`)
      .catch(() => {
        artCache.delete(src);
        return null;
      });
    artCache.set(src, hit);
  }
  return hit;
}

async function renderPng(model: ReturnType<typeof buildSaveModel>, art: string | null, fonts: SaveCardFonts, list: CardFont[]): Promise<ArrayBuffer> {
  const image = new ImageResponse(<SaveCardView model={model} art={art} fonts={fonts} />, {
    ...SAVE_CARD_SIZE,

    fonts: list.length > 0 ? list : undefined,
  });
  return image.arrayBuffer();
}

interface Encoded {
  body: Uint8Array<ArrayBuffer> | ArrayBuffer;
  contentType: 'image/jpeg' | 'image/png';
}

async function encode(png: ArrayBuffer, width: number | null): Promise<Encoded> {
  try {
    const { default: sharp } = await import('sharp');
    let image = sharp(Buffer.from(png));
    const small = width !== null && width < SAVE_CARD_SIZE.width;
    if (small) image = image.resize({ width });
    const jpeg = await image.jpeg({ quality: small ? JPEG_QUALITY_SMALL : JPEG_QUALITY, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
    return { body: new Uint8Array(jpeg), contentType: 'image/jpeg' };
  } catch {
    return { body: png, contentType: 'image/png' };
  }
}

function respond({ body, contentType }: Encoded, cacheControl: string, download: string | null): Response {
  const headers: Record<string, string> = { 'Content-Type': contentType, 'Cache-Control': cacheControl };
  if (download) headers['Content-Disposition'] = `attachment; filename="${download}.${contentType === 'image/png' ? 'png' : 'jpg'}"`;
  return new Response(body, { headers });
}

const bad = () => new Response('Invalid card', { status: 400, headers: { 'Cache-Control': 'public, max-age=60' } });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const l = searchParams.get('l');
  const locale: Locale | null = l === 'en' || l === 'ko' || l === 'ja' ? l : null;
  if (!locale) return bad();
  const copy = COPY_BY_LOCALE[locale];
  const req = parseSaveRequest(searchParams, limitsOf(copy));
  if (!req) return bad();

  const model = buildSaveModel(req.card, copy);
  const [art, latin, cjk] = await Promise.all([
    loadArt(reunionArtSrc('share-card')),

    locale === 'en' ? loadCardFonts(null, null) : Promise.resolve(null),
    locale === 'en' ? Promise.resolve(null) : loadCjkFonts(locale, modelText(model)),
  ]);
  const fonts: SaveCardFonts =
    locale === 'en'
      ? { serif: FONT_NAMES.title, sans: FONT_NAMES.body, sansWeight: 400, keepAll: false }
      : { serif: CJK_FONTS[locale].serif, sans: CJK_FONTS[locale].sans, sansWeight: 500, keepAll: locale === 'ko' };
  const list = [...(latin?.list ?? []), ...(cjk?.list ?? [])];

  const cacheControl = latin?.degraded || art === null || cjk?.degraded ? CACHE_SHORT : CACHE_LONG;
  const filename = req.download ? `dangol-reunion-${req.card.kind}` : null;

  try {
    const png = await renderPng(model, art, fonts, list);
    return respond(await encode(png, req.width), cacheControl, filename);
  } catch (error) {

    console.error('[reunion-card] render failed:', error instanceof Error ? error.message : String(error));
    return new Response('Card unavailable', { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
