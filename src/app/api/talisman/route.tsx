import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { FONT_NAMES, loadCardFonts, type CardFont } from '@/app/api/card/fonts';
import { ART_SIZE, INK, MEDALLION_AT, MEDALLION_R, parseWidth } from '@/lib/talisman/art';
import { GLYPH, isTalismanId, type TalismanId } from '@/lib/talisman';

const CACHE_LONG = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000';
const CACHE_SHORT = 'public, max-age=60';

const artCache = new Map<TalismanId, Promise<string | null>>();
function loadArt(id: TalismanId): Promise<string | null> {
  let hit = artCache.get(id);
  if (!hit) {
    hit = readFile(join(process.cwd(), 'public/media/talisman', `${id}.jpg`))
      .then((data) => `data:image/jpeg;base64,${data.toString('base64')}`)
      .catch(() => {
        artCache.delete(id);
        return null;
      });
    artCache.set(id, hit);
  }
  return hit;
}

function Talisman({ id, art, glyphReady }: { id: TalismanId; art: string; glyphReady: boolean }) {
  const { width, height } = ART_SIZE;
  const r = MEDALLION_R * width;
  const at = MEDALLION_AT[id];
  return (
    <div style={{ width, height, display: 'flex', position: 'relative', backgroundColor: '#10183a' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={art} width={width} height={height} alt="" style={{ position: 'absolute', left: 0, top: 0, width, height }} />
      {glyphReady ? (
        <div
          style={{
            position: 'absolute',
            left: at.cx * width - r,
            top: at.cy * height - r,
            width: r * 2,
            height: r * 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: INK[id],
            fontFamily: FONT_NAMES.hanzi,
            fontWeight: 500,
            fontSize: Math.round(r * 1.5),
            lineHeight: 1,
          }}
        >
          {GLYPH[id]}
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: height - 74,
          width,
          display: 'flex',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.62)',
          fontFamily: FONT_NAMES.body,
          fontWeight: 600,
          fontSize: 26,
          letterSpacing: 10,
        }}
      >
        DANGOL
      </div>
    </div>
  );
}

async function renderPng(id: TalismanId, art: string, glyphReady: boolean, fonts: CardFont[]): Promise<ArrayBuffer> {
  const image = new ImageResponse(<Talisman id={id} art={art} glyphReady={glyphReady} />, {
    ...ART_SIZE,
    fonts: fonts.length > 0 ? fonts : undefined,
  });
  return image.arrayBuffer();
}

async function encode(png: ArrayBuffer, width: number | null): Promise<{ body: Uint8Array<ArrayBuffer> | ArrayBuffer; contentType: 'image/jpeg' | 'image/png' }> {
  try {
    const { default: sharp } = await import('sharp');
    let image = sharp(Buffer.from(png));
    if (width !== null && width < ART_SIZE.width) image = image.resize({ width });
    const jpeg = await image.jpeg({ quality: width !== null && width <= 192 ? 80 : 86, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
    return { body: new Uint8Array(jpeg), contentType: 'image/jpeg' };
  } catch {
    return { body: png, contentType: 'image/png' };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!isTalismanId(id)) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  const width = parseWidth(searchParams.get('w'));
  const [art, fonts] = await Promise.all([loadArt(id), loadCardFonts(null, GLYPH[id])]);
  if (art === null) return new Response('Talisman unavailable', { status: 404, headers: { 'Cache-Control': 'no-store' } });

  try {
    const png = await renderPng(id, art, fonts.hasHanzi, fonts.list);
    const { body, contentType } = await encode(png, width);
    const headers: Record<string, string> = {
      'Content-Type': contentType,

      'Cache-Control': fonts.degraded || !fonts.hasHanzi ? CACHE_SHORT : CACHE_LONG,
    };
    if (searchParams.get('dl') === '1') headers['Content-Disposition'] = `attachment; filename="dangol-talisman-${id}.${contentType === 'image/png' ? 'png' : 'jpg'}"`;
    return new Response(body, { headers });
  } catch {
    return new Response('Talisman unavailable', { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
