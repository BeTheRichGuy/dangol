'use client';

import { useEffect, useRef, useState } from 'react';
import { XMAS_FLOW, XMAS_KEEP, XMAS_PAID } from '@/content/xmas';
import type { XmasDay } from '@/lib/xmas/pulls';
import type { XmasRelation } from '@/lib/xmas/relation';
import { XMAS_SEASON } from '@/lib/xmas/season';
import { XMAS_QUIZ } from '@/content/ko/xmas-quiz';

const K = XMAS_KEEP;
const W = 1080;
const H = 1350;

export interface KeepValues {
  askDays: readonly string[];
  days: readonly XmasDay[];
  pair: number | null;
  relation: XmasRelation | null;
}

const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

function wrap(g: CanvasRenderingContext2D, text: string, width: number): string[] {
  if (g.measureText(text).width <= width) return [text];
  const cut = text.lastIndexOf(' ', Math.ceil(text.length / 2) + 4);
  if (cut > 0) return [text.slice(0, cut), text.slice(cut + 1)];

  const comma = text.indexOf('、', Math.floor(text.length / 3));
  const at = comma > 0 && comma < text.length - 2 ? comma + 1 : Math.ceil(text.length / 2);
  return [text.slice(0, at), text.slice(at)];
}

function draw(c: HTMLCanvasElement, name: string, v: KeepValues, quizType?: string) {
  const g = c.getContext('2d');
  if (!g) return;
  const font = (w: number, size: number) => `${w} ${size}px "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif`;

  g.fillStyle = '#0b0b0d';
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, 460, 40, W / 2, 460, 620);
  glow.addColorStop(0, 'rgba(255,61,90,0.35)');
  glow.addColorStop(1, 'rgba(255,61,90,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  g.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 70; i += 1) {
    g.beginPath();
    g.arc(((i * 137) % 1000) + 40, ((i * 229) % 1250) + 40, 1.5 + (i % 3), 0, Math.PI * 2);
    g.fill();
  }
  g.textAlign = 'center';
  const label = (text: string, y: number) => {
    g.fillStyle = 'rgba(245,242,238,0.55)';
    g.font = font(700, 28);
    g.fillText(text, W / 2, y);
  };
  g.fillStyle = '#ff3d5a';
  g.font = font(800, 34);
  g.fillText(K.card.over, W / 2, 110);
  g.fillStyle = '#f5f2ee';
  g.font = font(900, 68);
  g.fillText(K.card.name.replace('{name}', name || XMAS_PAID.you), W / 2, 190);

  let y = 270;
  if (quizType) {
    g.fillStyle = '#ffd6dc';
    g.font = font(800, 32);
    g.fillText(XMAS_QUIZ.paid.keep.replace('{type}', quizType), W / 2, 244);
    y += 40;
  }

  if (v.relation) {
    label(K.card.now, y);
    g.fillStyle = '#ffd6dc';
    g.font = font(800, 36);
    XMAS_FLOW.result.insight.line[v.relation.stage].split('\n').forEach((line, i) => g.fillText(line, W / 2, y + 56 + i * 48));
    y += 170;
  }

  label(v.relation ? K.card.ask[v.relation.stage] : K.card.ask.talking, y);
  g.fillStyle = '#ffffff';
  g.font = font(900, 104);
  g.fillText(v.askDays.length ? v.askDays.map(md).join(' · ') : '-', W / 2, y + 116);
  y += 190;

  const before = v.days.filter((d) => d.date <= XMAS_SEASON.eve);
  const good = before.filter((d) => d.kind === 'close' || d.kind === 'group').slice(0, 3);
  const rest = before.find((d) => d.kind === 'caution');
  label(K.card.days, y);
  g.fillStyle = '#ffd6dc';
  g.font = font(800, 46);
  g.fillText(good.length ? good.map((d) => md(d.date)).join('   ·   ') : '-', W / 2, y + 62);
  y += 120;
  if (rest) {
    label(K.card.rest, y);
    g.fillStyle = 'rgba(245,242,238,0.85)';
    g.font = font(800, 40);
    g.fillText(md(rest.date), W / 2, y + 56);
    y += 110;
  }

  if (v.pair !== null) {
    label(`${K.card.pair} · ${K.card.pairNote}`, y);
    g.fillStyle = '#ffffff';
    g.font = font(900, 56);
    g.fillText(String(v.pair), W / 2, y + 64);
    y += 120;
  }

  if (v.relation) {
    label(K.card.word, y);
    g.fillStyle = '#f5f2ee';
    g.font = font(800, 40);
    wrap(g, K.words[v.relation.goal], 900).forEach((line, i) => g.fillText(line, W / 2, y + 60 + i * 54));
  }
  g.fillStyle = 'rgba(245,242,238,0.4)';
  g.font = font(700, 24);
  g.fillText(K.card.foot, W / 2, 1300);
}

export function XmasKeepsake({ name, values, quizType }: { name: string; values: KeepValues;  quizType?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (canvas.current) draw(canvas.current, name, values, quizType);
  }, [name, values, quizType]);
  function save() {
    canvas.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = K.file;
      a.click();
      URL.revokeObjectURL(url);
      setSaved(true);
    }, 'image/png');
  }
  return (
    <section className="xq-keep" aria-label={K.title}>
      <h3>{K.title}</h3>
      <p>{K.lead}</p>
      <canvas ref={canvas} width={W} height={H} />
      <button type="button" onClick={save}>
        {saved ? K.saved : K.save}
      </button>
    </section>
  );
}
