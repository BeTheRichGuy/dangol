'use client';

import { useEffect, useState } from 'react';
import { XMAS_QUIZ } from '@/content/ko/xmas-quiz';
import { track } from '@/lib/analytics/track';
import { quizTypeArt } from '@/lib/xmas/quiz';

const R = XMAS_QUIZ.result;
const W = 1080;
const H = 1920;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const tryLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(tryLine).width <= max) {
      line = tryLine;
      continue;
    }
    if (line) lines.push(line);

    line = '';
    for (const ch of word) {
      if (ctx.measureText(line + ch).width > max && line) {
        lines.push(line);
        line = '';
      }
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function drawCard(art: string, name: string, line: string): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  await document.fonts?.ready;
  const family = getComputedStyle(document.body).fontFamily || 'sans-serif';

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#120c14');
  bg.addColorStop(1, '#1f0b12');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.font = `800 104px ${family}`;
  const nameLines = wrap(ctx, name, 940);
  ctx.font = `500 46px ${family}`;
  const lineLines = wrap(ctx, line, 900);
  const NAME_H = 118;
  const LINE_H = 66;
  const lineTop = H - 190 - lineLines.length * LINE_H;
  const nameTop = lineTop - 36 - nameLines.length * NAME_H;
  const labelY = nameTop - 30;

  try {
    const img = await loadImage(art);
    const scale = Math.max(W / img.width, H / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (W - w) / 2, 0, w, h);
  } catch {

  }
  const fadeTop = Math.max(0, labelY - 420);
  const fade = ctx.createLinearGradient(0, fadeTop, 0, H);
  fade.addColorStop(0, 'rgba(14,9,14,0)');
  fade.addColorStop(Math.min(0.55, (labelY - 60 - fadeTop) / (H - fadeTop)), 'rgba(14,9,14,0.82)');
  fade.addColorStop(1, 'rgba(14,9,14,0.96)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, fadeTop, W, H - fadeTop);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ff5a76';
  ctx.font = `700 42px ${family}`;
  ctx.fillText(R.cardLabel, W / 2, labelY);

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 104px ${family}`;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 24;
  let y = nameTop + NAME_H - 14;
  for (const l of nameLines) {
    ctx.fillText(l, W / 2, y);
    y += NAME_H;
  }
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = `500 46px ${family}`;
  y = lineTop + LINE_H - 14;
  for (const l of lineLines) {
    ctx.fillText(l, W / 2, y);
    y += LINE_H;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `500 36px ${family}`;
  ctx.fillText(R.cardFoot, W / 2, H - 110);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

export function XmasQuizCard({ type }: { type: string }) {
  const t = XMAS_QUIZ.types[type];
  const [card, setCard] = useState<{ url: string; file: File } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    let url = '';
    void drawCard(quizTypeArt(type), t.name, t.line).then((blob) => {
      if (!live || !blob) return;
      url = URL.createObjectURL(blob);
      setCard({ url, file: new File([blob], `dangol-${type}.png`, { type: 'image/png' }) });
    });
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [t.name, t.line, type]);

  function save() {
    if (!card) return;
    track('quiz_share', { act: 'save', t: type });
    const a = document.createElement('a');
    a.href = card.url;
    a.download = card.file.name;
    a.click();
  }

  async function story() {
    if (!card) return;
    track('quiz_share', { act: 'story', t: type });
    try {
      if (navigator.canShare?.({ files: [card.file] })) {
        await navigator.share({ files: [card.file] });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
    }
    save();
  }

  async function link() {
    track('quiz_share', { act: 'link', t: type });

    const url = `${window.location.origin}/xmas/test?t=${type}&utm_source=share&utm_campaign=quiz`;
    try {
      if (navigator.share) {
        await navigator.share({ url, text: XMAS_QUIZ.start.shared.replace('{type}', t.name) });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {

    }
  }

  return (
    <section className="xq-card">
      <div className="xq-card__frame">
        {card ? (

          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.url} alt={R.cardAlt.replace('{type}', t.name)} width={W} height={H} />
        ) : (
          <span className="xq-card__wait" aria-hidden="true" />
        )}
      </div>
      <div className="xq-card__actions">
        <button type="button" onClick={() => void story()} disabled={!card}>
          {R.share.story}
        </button>
        <button type="button" onClick={() => void link()}>
          {copied ? R.share.copied : R.share.link}
        </button>
        <button type="button" className="xq-card__quiet" onClick={save} disabled={!card}>
          {R.share.save}
        </button>
      </div>
    </section>
  );
}
