import { UI } from '@/content/ui';
import { CARD_ART_TOP, type YulArt } from './art';
import { FONT_NAMES } from './fonts';
import { formatRegularNo, isFoundingRegular } from '../../../lib/regular';
import type { CardType } from './params';

export type CardLayout = 'story' | 'og';

export const CARD_SIZE = {
  story: { width: 1080, height: 1920 },
  og: { width: 1200, height: 630 },
} as const;

const SAFE = 250;

const COLOR = {

  night: '#141018',
  nightClear: 'rgba(20, 16, 24, 0)',
  ink: '#1F2A44',
  inkSoft: '#4A5677',

  bubble: '#FFFEFA',

  paper: '#F3E9D9',

  ivory: '#F6EEDF',
  ivorySoft: 'rgba(246, 238, 223, 0.72)',
  seal: '#C8473A',
} as const;

export const CARD_TEXT = UI.card;

export const SEAL_GLYPH = UI.common.yulHanja;

export interface CardViewProps {
  type: CardType | null;
  regularNo: number | null;

  hasHanzi: boolean;
  hasBrush: boolean;

  layout?: CardLayout;

  yul?: string | null;

  yulArt?: YulArt;

  sogeum?: string | null;

  host?: string | null;

  brandArt?: string | null;

  letter?: LetterInfo | null;

  month?: MonthInfo | null;
}

export interface LetterInfo {

  art: string;
  copy: { eyebrow: string; kicker: string; inLove: string; ask: string; disclosure: string; regularNo: string };
  serif: string;
  sans: string;

  bodyWeight: 400 | 500;

  keepAll: boolean;
}

export interface MonthInfo {
  month: number;
  year: number | null;

  label: string;

  tone: string;

  toneSize: number;
  copy: { eyebrow: string; strip: string; ask: string; regularNo: string };
  serif: string;
  sans: string;
  bodyWeight: 400 | 500;
  keepAll: boolean;
}

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

function fitSize(text: string, width: number, max: number, min: number): number {
  return Math.max(min, Math.min(max, Math.floor(width / (text.length * 0.5))));
}

function bubbleSize(text: string, sizes: readonly [number, number, number]): number {
  if (text.length <= 28) return sizes[0];
  return text.length <= 58 ? sizes[1] : sizes[2];
}

function footerLine(host: string | null | undefined): string {
  return `${host ?? CARD_TEXT.brand.toLowerCase()} · ${CARD_TEXT.cta}`;
}

function Tail({ dir, size, border }: { dir: 'down' | 'right'; size: number; border: number }) {
  const down = dir === 'down';
  const w = down ? size : Math.round(size * 0.9);
  const h = down ? Math.round(size * 0.9) : size;
  const outer = down ? `M0 0 L${w / 2} ${h} L${w} 0 Z` : `M0 0 L${w} ${h / 2} L0 ${h} Z`;
  const gap = Math.round(border * 2.6);
  const inner = down
    ? `M${gap} 0 L${w / 2} ${h - gap * 1.6} L${w - gap} 0 Z`
    : `M0 ${gap} L${w - gap * 1.6} ${h / 2} L0 ${h - gap} Z`;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={outer} fill={COLOR.ink} />
      <path d={inner} fill={COLOR.bubble} />
    </svg>
  );
}

function Bubble({
  text,
  width,
  fontSize,
  padX,
  padY,
  border,
  radius,
  tail,
  tailAt,
  tailSize,
}: {
  text: string;
  width: number;
  fontSize: number;
  padX: number;
  padY: number;
  border: number;
  radius: number;
  tail: 'down' | 'right';

  tailAt: number;
  tailSize: number;
}) {
  const body = (
    <div
      style={{
        display: 'flex',
        width,
        padding: `${padY}px ${padX}px`,
        borderRadius: radius,
        border: `${border}px solid ${COLOR.ink}`,
        backgroundColor: COLOR.bubble,
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: FONT_NAMES.title,
        fontWeight: 500,
        fontSize,
        lineHeight: 1.18,
        textWrap: 'balance',
        color: COLOR.ink,
      }}
    >
      {text}
    </div>
  );
  if (tail === 'down') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {body}
        <div style={{ display: 'flex', marginLeft: tailAt, marginTop: -border }}>
          <Tail dir="down" size={tailSize} border={border} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      {body}
      <div style={{ display: 'flex', marginLeft: -border }}>
        <Tail dir="right" size={tailSize} border={border} />
      </div>
    </div>
  );
}

function Seal({ size, hasHanzi }: { size: number; hasHanzi: boolean }) {
  if (!hasHanzi) return null;
  const inset = Math.max(6, Math.round(size * 0.07));
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.08),
        backgroundColor: COLOR.seal,
        transform: 'rotate(-6deg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size - inset * 2,
          height: size - inset * 2,
          borderRadius: Math.round(size * 0.04),
          border: `${Math.max(2, Math.round(size / 44))}px solid rgba(251, 246, 238, 0.6)`,
          fontFamily: FONT_NAMES.hanzi,
          fontWeight: 500,
          fontSize: Math.round(size * 0.58),
          lineHeight: 1,
          color: '#FBF6EE',
        }}
      >
        {SEAL_GLYPH}
      </div>
    </div>
  );
}

function SogeumCut({ src, width, height, border }: { src: string; width: number; height: number; border: number }) {
  return (
    <div
      style={{
        display: 'flex',
        width,
        height,
        border: `${border}px solid ${COLOR.ivory}`,
        borderRadius: 6,
        backgroundColor: COLOR.ivory,
        overflow: 'hidden',
        transform: 'rotate(-3deg)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={src} width={width - border * 2} height={height - border * 2} style={{ width: width - border * 2, height: height - border * 2, objectFit: 'cover' }} />
    </div>
  );
}

function BoxText({
  type,
  regularNo,
  hasHanzi,
  hasBrush,
  nameWidth,
  nameMax,
  nameMin,
  hanziSize,
  noSize,
  brand,
}: {
  type: CardType | null;
  regularNo: number | null;
  hasHanzi: boolean;
  hasBrush: boolean;
  nameWidth: number;
  nameMax: number;
  nameMin: number;
  hanziSize: number;
  noSize: number;

  brand: number;
}) {
  if (!type) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontFamily: FONT_NAMES.title,
            fontWeight: 500,
            fontSize: 40 * brand,
            letterSpacing: 14 * brand,
            color: COLOR.ink,
          }}
        >
          {CARD_TEXT.brand}
        </div>
        {hasBrush ? (
          <div style={{ display: 'flex', fontFamily: FONT_NAMES.brush, fontSize: 104 * brand, lineHeight: 1.05, color: COLOR.ink }}>
            {CARD_TEXT.brush}
          </div>
        ) : null}
        <div style={{ display: 'flex', marginTop: 6 * brand, fontFamily: FONT_NAMES.title, fontWeight: 500, fontSize: 34 * brand, lineHeight: 1.2, color: COLOR.inkSoft }}>
          {CARD_TEXT.pitch}
        </div>
      </div>
    );
  }
  const founding = regularNo !== null && isFoundingRegular(regularNo);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          fontFamily: FONT_NAMES.title,
          fontWeight: 500,
          fontSize: fitSize(type.born, nameWidth, nameMax, nameMin),
          lineHeight: 1.02,
          whiteSpace: 'nowrap',
          color: COLOR.ink,
        }}
      >
        {type.born}
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: Math.round(hanziSize * 0.22) }}>
        {hasHanzi ? (
          <div
            style={{
              display: 'flex',
              fontFamily: FONT_NAMES.hanzi,
              fontWeight: 500,
              fontSize: hanziSize,
              lineHeight: 1,
              letterSpacing: Math.round(hanziSize * 0.14),
              color: COLOR.inkSoft,
            }}
          >
            {type.hanzi}
          </div>
        ) : null}
        {regularNo !== null ? (
          <div
            style={{
              display: 'flex',
              marginLeft: hasHanzi ? Math.round(hanziSize * 0.7) : 0,
              fontFamily: FONT_NAMES.body,
              fontWeight: 600,
              fontSize: noSize,
              letterSpacing: 2,
              color: founding ? COLOR.seal : COLOR.ink,
            }}
          >
            {`${CARD_TEXT.regularNo} ${formatRegularNo(regularNo)}`}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const STORY = {
  bubbleTop: SAFE + 12,
  bubbleX: 90,
  bubbleW: 900,
  boxX: 80,
  boxW: 920,
  boxTop: 1240,
  boxH: 300,
} as const;

function LetterCard({ type, regularNo, hasHanzi, host, letter }: { type: CardType; regularNo: number | null; hasHanzi: boolean; host?: string | null; letter: LetterInfo }) {
  const { width, height } = CARD_SIZE.story;
  const { copy, serif, sans, bodyWeight } = letter;
  const wrap = letter.keepAll ? ({ wordBreak: 'keep-all' } as const) : {};
  const paper = '#F6ECDC';
  const red = '#A3341F';
  const brown = '#2B1D16';
  const side = 96;
  const identity = clip(type.identity, 80);
  const love = clip(type.inLove, 120);
  const nameSize = fitSize(type.born, 640, 132, 84);
  return (
    <div style={{ display: 'flex', position: 'relative', width, height, backgroundColor: paper }}>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={letter.art} width={width} height={1120} style={{ position: 'absolute', left: 0, top: 0, width, height: 1120 }} />

      <div style={{ position: 'absolute', left: side, top: SAFE + 20, display: 'flex', gap: 14 }}>
        <div style={{ display: 'flex', padding: '12px 24px', borderRadius: 999, backgroundColor: 'rgba(20, 16, 24, 0.55)', fontFamily: sans, fontWeight: 600, fontSize: 30, color: '#FFF6E6' }}>
          {copy.eyebrow}
        </div>
        {regularNo ? (
          <div style={{ display: 'flex', padding: '12px 22px', borderRadius: 999, backgroundColor: 'rgba(20, 16, 24, 0.55)', fontFamily: FONT_NAMES.body, fontWeight: 600, fontSize: 28, color: '#F6C98B' }}>
            {`${copy.regularNo} ${formatRegularNo(regularNo)}`}
          </div>
        ) : null}
      </div>

      {}
      <div style={{ position: 'absolute', left: side, top: 1070, width: width - side * 2, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontFamily: sans, fontWeight: 600, fontSize: 36, color: red }}>{copy.kicker}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 8 }}>
          <div style={{ display: 'flex', fontFamily: serif, fontWeight: 500, fontSize: nameSize, lineHeight: 1.05, color: brown }}>{type.born}</div>
          {hasHanzi ? (
            <div style={{ display: 'flex', marginLeft: 26, marginBottom: 12, fontFamily: FONT_NAMES.hanzi, fontWeight: 500, fontSize: 60, color: '#8A6A4A' }}>{type.hanzi}</div>
          ) : null}
        </div>
        <div style={{ display: 'flex', marginTop: 22, fontFamily: serif, fontWeight: 500, fontSize: 46, lineHeight: 1.4, color: brown, ...wrap }}>{identity}</div>
        <div style={{ display: 'flex', marginTop: 34, marginBottom: 26, height: 2, backgroundColor: 'rgba(43, 29, 22, 0.18)' }} />
        <div style={{ display: 'flex', fontFamily: sans, fontWeight: 600, fontSize: 30, letterSpacing: 1, color: red }}>{copy.inLove}</div>
        <div style={{ display: 'flex', marginTop: 12, fontFamily: sans, fontWeight: bodyWeight, fontSize: 34, lineHeight: 1.55, color: 'rgba(43, 29, 22, 0.82)', ...wrap }}>{love}</div>
      </div>

      {}
      <div style={{ position: 'absolute', right: side - 20, top: SAFE + 6, display: 'flex' }}>
        <Seal size={116} hasHanzi={hasHanzi} />
      </div>

      <div style={{ position: 'absolute', left: side, right: side, bottom: 110, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontFamily: FONT_NAMES.body, fontWeight: 600, fontSize: 34, color: red }}>{host ?? CARD_TEXT.brand}</div>
          <div style={{ display: 'flex', fontFamily: sans, fontWeight: bodyWeight, fontSize: 32, color: 'rgba(43, 29, 22, 0.62)' }}>{copy.ask}</div>
        </div>
        {copy.disclosure ? <div style={{ display: 'flex', marginTop: 12, fontFamily: sans, fontWeight: bodyWeight, fontSize: 24, color: 'rgba(43, 29, 22, 0.5)' }}>{copy.disclosure}</div> : null}
      </div>
    </div>
  );
}

const STARS: readonly (readonly [number, number, number, number])[] = [
  [210, 560, 5, 0.4], [860, 610, 6, 0.5], [120, 760, 7, 0.45], [960, 830, 5, 0.55],
  [175, 1010, 6, 0.5], [900, 1060, 7, 0.4], [95, 1190, 5, 0.35], [985, 1230, 6, 0.45], [330, 400, 4, 0.5], [740, 470, 5, 0.45],
];
const GOLD = '#F6C98B';

const LANTERN_INK = '#3B1F0E';

function Lantern({ width, height }: { width: number; height: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 520 600">
      <defs>
        <radialGradient id="body" cx="50%" cy="46%" r="64%">
          <stop offset="0%" stopColor="#FFEBB8" />
          <stop offset="52%" stopColor="#F7BD66" />
          <stop offset="100%" stopColor="#D9782E" />
        </radialGradient>
      </defs>
      <rect x="190" y="6" width="140" height="30" rx="8" fill="#3A2A20" />
      <rect x="150" y="32" width="220" height="26" rx="9" fill="#5A3A27" />
      <path d="M118 74 C16 168 16 424 118 520 L402 520 C504 424 504 168 402 74 Z" fill="url(#body)" stroke="#8A4A1E" strokeWidth="4" />
      <path d="M260 66 C176 190 176 404 260 528" fill="none" stroke="#B86A2A" strokeWidth="3" opacity="0.5" />
      <path d="M260 66 C344 190 344 404 260 528" fill="none" stroke="#B86A2A" strokeWidth="3" opacity="0.5" />
      <path d="M260 66 C108 190 108 404 260 528" fill="none" stroke="#B86A2A" strokeWidth="3" opacity="0.38" />
      <path d="M260 66 C412 190 412 404 260 528" fill="none" stroke="#B86A2A" strokeWidth="3" opacity="0.38" />
      <rect x="150" y="516" width="220" height="26" rx="9" fill="#5A3A27" />
      <rect x="190" y="538" width="140" height="30" rx="8" fill="#3A2A20" />
      <line x1="260" y1="566" x2="260" y2="592" stroke="#C8473A" strokeWidth="5" strokeLinecap="round" />
      <circle cx="260" cy="594" r="6" fill="#C8473A" />
    </svg>
  );
}

function MonthCard({ type, regularNo, hasHanzi, host, sogeum, month }: { type: CardType | null; regularNo: number | null; hasHanzi: boolean; host?: string | null; sogeum?: string | null; month: MonthInfo }) {
  const { width, height } = CARD_SIZE.story;
  const { copy, serif, sans, bodyWeight, keepAll } = month;
  const wrap = keepAll ? ({ wordBreak: 'keep-all' } as const) : {};
  const numFont = hasHanzi ? FONT_NAMES.hanzi : FONT_NAMES.body;
  const side = 96;
  const lanternW = 520;
  const lanternH = 600;
  const lanternTop = 470;
  const numeral = String(month.month);
  const numSize = numeral.length > 1 ? 292 : 330;
  const fill = { position: 'absolute', display: 'flex' } as const;
  return (
    <div style={{ display: 'flex', position: 'relative', width, height, backgroundColor: COLOR.night }}>
      {}
      <div style={{ ...fill, left: 0, top: 0, width, height, backgroundImage: 'radial-gradient(circle at 50% 38%, rgba(246, 201, 139, 0.36) 0%, rgba(246, 201, 139, 0.13) 34%, rgba(20, 16, 24, 0) 66%)' }} />
      {STARS.map(([x, y, s, o]) => (
        <div key={`${x}-${y}`} style={{ ...fill, left: x, top: y, width: s, height: s, borderRadius: s, backgroundColor: COLOR.ivory, opacity: o }} />
      ))}

      {}
      <div style={{ ...fill, left: side, top: SAFE + 20, gap: 14 }}>
        <div style={{ display: 'flex', padding: '12px 24px', borderRadius: 999, backgroundColor: 'rgba(246, 238, 223, 0.12)', border: '2px solid rgba(246, 201, 139, 0.45)', fontFamily: sans, fontWeight: 600, fontSize: 30, color: '#FFF6E6' }}>
          {copy.eyebrow}
        </div>
        {month.year ? (
          <div style={{ display: 'flex', padding: '12px 22px', borderRadius: 999, backgroundColor: 'rgba(20, 16, 24, 0.55)', fontFamily: FONT_NAMES.body, fontWeight: 600, fontSize: 28, color: GOLD }}>
            {month.year}
          </div>
        ) : null}
        {regularNo ? (
          <div style={{ display: 'flex', padding: '12px 22px', borderRadius: 999, backgroundColor: 'rgba(20, 16, 24, 0.55)', fontFamily: FONT_NAMES.body, fontWeight: 600, fontSize: 28, color: GOLD }}>
            {`${copy.regularNo} ${formatRegularNo(regularNo)}`}
          </div>
        ) : null}
      </div>
      <div style={{ ...fill, right: side - 20, top: SAFE + 6 }}>
        <Seal size={116} hasHanzi={hasHanzi} />
      </div>

      {}
      <div style={{ ...fill, left: width / 2 - 2, top: 350, width: 4, height: lanternTop - 350 + 8, backgroundColor: 'rgba(246, 238, 223, 0.5)' }} />
      <div style={{ ...fill, left: (width - lanternW) / 2, top: lanternTop }}>
        <Lantern width={lanternW} height={lanternH} />
      </div>
      {}
      <div style={{ ...fill, left: 0, top: lanternTop + 112, width, justifyContent: 'center', fontFamily: numFont, fontWeight: 500, fontSize: numSize, lineHeight: 1, color: LANTERN_INK }}>{numeral}</div>
      <div style={{ ...fill, left: 0, top: lanternTop + 440, width, justifyContent: 'center', fontFamily: serif, fontWeight: 500, fontSize: 58, lineHeight: 1, letterSpacing: 2, color: LANTERN_INK }}>{month.label}</div>

      {}
      {sogeum ? (
        <div style={{ ...fill, left: 700, top: 960 }}>
          <SogeumCut src={sogeum} width={236} height={186} border={6} />
        </div>
      ) : null}

      {}
      <div style={{ ...fill, left: side, top: 1176, width: width - side * 2, flexDirection: 'column', alignItems: 'center', textAlign: 'center', fontFamily: serif, fontWeight: 500, fontSize: month.toneSize, lineHeight: 1.42, color: COLOR.ivory, ...wrap }}>
        {month.tone.split('\n').map((line) => (
          <div key={line} style={{ display: 'flex', justifyContent: 'center', textWrap: 'balance' }}>
            {line}
          </div>
        ))}
      </div>

      {}
      {type ? (
        <div style={{ ...fill, left: 0, top: 1344, width, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 34px', borderRadius: 999, border: '2px solid rgba(246, 201, 139, 0.55)', backgroundColor: 'rgba(20, 16, 24, 0.5)' }}>
            <div style={{ display: 'flex', fontFamily: serif, fontWeight: 500, fontSize: 40, color: COLOR.ivory }}>{type.born}</div>
            {hasHanzi ? <div style={{ display: 'flex', marginLeft: 18, fontFamily: FONT_NAMES.hanzi, fontWeight: 500, fontSize: 38, color: GOLD }}>{type.hanzi}</div> : null}
          </div>
        </div>
      ) : null}

      {}
      <div style={{ ...fill, left: side, top: 1462, width: width - side * 2, flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', fontFamily: sans, fontWeight: 600, fontSize: 24, letterSpacing: 6, color: COLOR.ivorySoft }}>{copy.strip}</div>
        <div style={{ display: 'flex', width: width - side * 2, justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 18 }}>
          {Array.from({ length: 12 }, (_, i) => {
            const m = i + 1;
            const lit = m === month.month;
            const size = lit ? 70 : 44;
            return (
              <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 64 }}>
                <div style={{ display: 'flex', height: 70, alignItems: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      width: size,
                      height: size,
                      borderRadius: size,
                      backgroundColor: lit ? GOLD : 'rgba(246, 238, 223, 0)',
                      border: lit ? '4px solid #FFE9BF' : '3px solid rgba(246, 238, 223, 0.4)',

                      ...(lit ? { boxShadow: '0 0 38px rgba(246, 201, 139, 0.9)' } : {}),
                    }}
                  />
                </div>
                <div style={{ display: 'flex', marginTop: 6, fontFamily: FONT_NAMES.body, fontWeight: 600, fontSize: lit ? 32 : 24, color: lit ? GOLD : COLOR.ivorySoft }}>{m}</div>
              </div>
            );
          })}
        </div>
      </div>

      {}
      <div style={{ ...fill, left: side, right: side, bottom: 110, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', fontFamily: FONT_NAMES.body, fontWeight: 600, fontSize: 34, color: GOLD }}>{host ?? CARD_TEXT.brand}</div>
        <div style={{ display: 'flex', fontFamily: sans, fontWeight: bodyWeight, fontSize: 32, color: COLOR.ivorySoft }}>{copy.ask}</div>
      </div>
    </div>
  );
}

function StoryCard({ type, regularNo, hasHanzi, hasBrush, yul, yulArt = 'reassure', sogeum, host, letter, month }: CardViewProps) {
  if (month) return <MonthCard type={type} regularNo={regularNo} hasHanzi={hasHanzi} host={host} sogeum={sogeum} month={month} />;
  if (type && letter) return <LetterCard type={type} regularNo={regularNo} hasHanzi={hasHanzi} host={host} letter={letter} />;
  const { width, height } = CARD_SIZE.story;
  const bubbleText = type ? clip(type.identity, 90) : CARD_TEXT.tagline;
  const picTop = CARD_ART_TOP[yulArt];
  const picH = STORY.boxTop + 40 - picTop;
  const fill = { position: 'absolute', display: 'flex' } as const;
  const sogeumW = 300;
  const sogeumH = 236;
  const sealSize = 148;
  return (
    <div style={{ display: 'flex', position: 'relative', width, height, backgroundColor: COLOR.night }}>
      {}
      {yul ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={yul} width={width} height={picH} style={{ position: 'absolute', left: 0, top: picTop, width, height: picH, objectFit: 'cover', objectPosition: '50% 0%' }} />
          <div style={{ ...fill, left: 0, top: picTop, width, height: 110, backgroundImage: `linear-gradient(180deg, ${COLOR.night} 0%, ${COLOR.nightClear} 100%)` }} />
          <div style={{ ...fill, left: 0, top: STORY.boxTop - 150, width, height: 190, backgroundImage: `linear-gradient(180deg, ${COLOR.nightClear} 0%, ${COLOR.night} 100%)` }} />
        </>
      ) : null}

      {}
      {sogeum ? (
        <div style={{ ...fill, left: STORY.boxX - 18, top: STORY.boxTop + 26 - sogeumH }}>
          <SogeumCut src={sogeum} width={sogeumW} height={sogeumH} border={6} />
        </div>
      ) : null}

      {}
      <div
        style={{
          ...fill,
          left: STORY.boxX,
          top: STORY.boxTop,
          width: STORY.boxW,
          height: STORY.boxH,
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 60px',
          backgroundColor: COLOR.paper,
          border: `4px solid ${COLOR.ink}`,
          borderRadius: 10,
        }}
      >
        <BoxText
          type={type}
          regularNo={regularNo}
          hasHanzi={hasHanzi}
          hasBrush={hasBrush}
          nameWidth={640}
          nameMax={128}
          nameMin={86}
          hanziSize={64}
          noSize={34}
          brand={1.2}
        />
      </div>
      {}
      <div style={{ ...fill, left: STORY.boxX + STORY.boxW - sealSize - 40, top: STORY.boxTop - 52 }}>
        <Seal size={sealSize} hasHanzi={hasHanzi} />
      </div>

      {}
      <div style={{ ...fill, left: STORY.bubbleX, top: STORY.bubbleTop }}>
        <Bubble
          text={bubbleText}
          width={STORY.bubbleW}
          fontSize={bubbleSize(bubbleText, [76, 60, 54])}
          padX={52}
          padY={40}
          border={5}
          radius={56}
          tail="down"
          tailAt={430}
          tailSize={86}
        />
      </div>

      {}
      <div
        style={{
          ...fill,
          left: 0,
          bottom: SAFE,
          width,
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', fontFamily: FONT_NAMES.body, fontWeight: 600, fontSize: 36, letterSpacing: 1, color: COLOR.ivory }}>
          {footerLine(host)}
        </div>
        {CARD_TEXT.disclosure ? (
          <div style={{ display: 'flex', marginTop: 12, fontFamily: FONT_NAMES.body, fontWeight: 400, fontSize: 27, letterSpacing: 1, color: COLOR.ivorySoft }}>
            {CARD_TEXT.disclosure}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BrandOgCard({ hasBrush, host, brandArt }: { hasBrush: boolean; host?: string | null; brandArt: string }) {
  const { width, height } = CARD_SIZE.og;
  const red = '#A3341F';
  const brown = '#2B1D16';
  return (
    <div style={{ display: 'flex', position: 'relative', width, height, backgroundColor: '#FFF6E6' }}>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={brandArt} width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, width, height }} />
      <div style={{ position: 'absolute', left: 650, top: 0, width: 500, height, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {hasBrush ? (
          <div style={{ display: 'flex', fontFamily: FONT_NAMES.brush, fontSize: 124, lineHeight: 0.95, color: red }}>{CARD_TEXT.brush}</div>
        ) : (
          <div style={{ display: 'flex', fontFamily: FONT_NAMES.body, fontWeight: 600, fontSize: 30, letterSpacing: 8, color: red }}>{CARD_TEXT.brand}</div>
        )}
        <div style={{ display: 'flex', marginTop: 18, fontFamily: FONT_NAMES.title, fontWeight: 500, fontSize: 66, lineHeight: 1.05, color: brown }}>
          {CARD_TEXT.tagline}
        </div>
        <div style={{ display: 'flex', marginTop: 18, fontFamily: FONT_NAMES.body, fontWeight: 400, fontSize: 25, lineHeight: 1.4, color: 'rgba(43, 29, 22, 0.72)' }}>
          {CARD_TEXT.ogLine}
        </div>
        <div style={{ display: 'flex', marginTop: 32 }}>
          <div style={{ display: 'flex', padding: '10px 22px', borderRadius: 999, border: `2px solid rgba(163, 52, 31, 0.5)`, fontFamily: FONT_NAMES.body, fontWeight: 600, fontSize: 24, letterSpacing: 1, color: red }}>
            {host ?? CARD_TEXT.brand}
          </div>
        </div>
      </div>
    </div>
  );
}

function OgCard({ type, regularNo, hasHanzi, hasBrush, yul, sogeum, host, brandArt }: CardViewProps) {
  if (!type && brandArt) return <BrandOgCard hasBrush={hasBrush} host={host} brandArt={brandArt} />;
  const { width, height } = CARD_SIZE.og;
  const bubbleText = type ? clip(type.identity, 90) : CARD_TEXT.tagline;
  const fill = { position: 'absolute', display: 'flex' } as const;
  const picLeft = 540;
  const boxX = 48;
  const boxW = 544;
  const boxTop = 322;
  const boxH = 206;
  const sealSize = 96;
  return (
    <div style={{ display: 'flex', position: 'relative', width, height, backgroundColor: COLOR.night }}>
      {yul ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={yul} width={width - picLeft} height={height} style={{ position: 'absolute', left: picLeft, top: 0, width: width - picLeft, height, objectFit: 'cover', objectPosition: '50% 0%' }} />
          <div style={{ ...fill, left: picLeft, top: 0, width: 260, height, backgroundImage: `linear-gradient(90deg, ${COLOR.night} 0%, ${COLOR.nightClear} 100%)` }} />
        </>
      ) : null}

      {sogeum ? (
        <div style={{ ...fill, left: width - 48 - 190, top: height - 40 - 150 }}>
          <SogeumCut src={sogeum} width={190} height={150} border={5} />
        </div>
      ) : null}

      <div style={{ ...fill, left: 48, top: 36 }}>
        <Bubble
          text={bubbleText}
          width={520}
          fontSize={bubbleSize(bubbleText, [58, 42, 38])}
          padX={30}
          padY={22}
          border={4}
          radius={36}
          tail="right"
          tailAt={0}
          tailSize={64}
        />
      </div>

      <div
        style={{
          ...fill,
          left: boxX,
          top: boxTop,
          width: boxW,
          height: boxH,
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 34px',
          backgroundColor: COLOR.paper,
          border: `4px solid ${COLOR.ink}`,
          borderRadius: 8,
        }}
      >
        <BoxText
          type={type}
          regularNo={regularNo}
          hasHanzi={hasHanzi}
          hasBrush={hasBrush}
          nameWidth={470}
          nameMax={96}
          nameMin={68}
          hanziSize={42}
          noSize={26}
          brand={0.7}
        />
      </div>
      <div style={{ ...fill, left: boxX + boxW - sealSize - 8, top: boxTop - 46 }}>
        <Seal size={sealSize} hasHanzi={hasHanzi} />
      </div>

      <div style={{ ...fill, left: 48, bottom: 28, flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontFamily: FONT_NAMES.body, fontWeight: 600, fontSize: 28, letterSpacing: 1, color: COLOR.ivory }}>
          {footerLine(host)}
        </div>
        {CARD_TEXT.disclosure ? (
          <div style={{ display: 'flex', marginTop: 6, fontFamily: FONT_NAMES.body, fontWeight: 400, fontSize: 20, letterSpacing: 1, color: COLOR.ivorySoft }}>
            {CARD_TEXT.disclosure}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CardView(props: CardViewProps) {
  return props.layout === 'og' ? <OgCard {...props} /> : <StoryCard {...props} />;
}
