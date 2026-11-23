import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BOTTOM_ENTER,
  DEFAULT_DENSITY,
  GATE_MS,
  GATE_REDUCED_MS,
  GLYPH_REDUCED,
  GLYPH_TIMING,
  INK_BLOTS,
  LAND_TIMING,
  MAX_PARTICLES,
  REVEAL,
  TOP_EXIT,
  advance,
  createBudget,
  createParticles,
  edgeFade,
  gateDoneMs,
  gateOriginVars,
  glyphLayout,
  glyphTimeline,
  hashSeed,
  inkBlot,
  inkBlotCssBlock,
  inkBlotDataUri,
  inkBlotSvg,
  inkRingDataUri,
  inkRingSvg,
  landStartMs,
  landTimeline,
  landTransform,
  lanternArrive,
  mulberry32,
  particleAlpha,
  particleCount,
  particleSway,
  revealBlurMs,
  splitWords,
  wordDelays,
} from '@/components/mystic/logic';

const CSS = readFileSync(path.join(process.cwd(), 'src/components/mystic/mystic.css'), 'utf8');

const CSS_RULES = CSS.replace(/\/\*[\s\S]*?\*\//g, '');

const REDUCED_BLOCK = CSS_RULES.slice(CSS_RULES.indexOf('@media (prefers-reduced-motion: reduce)'));

describe('난수와 시드', () => {
  it('같은 시드면 같은 수열, 다른 시드면 다른 수열', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const c = mulberry32(43);
    const sa = Array.from({ length: 8 }, () => a());
    const sb = Array.from({ length: 8 }, () => b());
    const sc = Array.from({ length: 8 }, () => c());
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
    for (const v of sa) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('hashSeed 는 같은 문자열에 같은 값, 다른 문자열에 다른 값', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'));
    expect(hashSeed('')).toBeGreaterThanOrEqual(0);
  });
});

describe('금빛 먼지: 입자 수', () => {
  it('상한은 40개', () => {
    expect(MAX_PARTICLES).toBe(40);
    expect(particleCount(1)).toBe(40);
    expect(particleCount(99)).toBe(40);
    expect(createParticles(500, 1)).toHaveLength(40);
  });

  it('밀도 0~1 을 수로 바꾸고, 범위 밖·잘못된 값은 맞춘다', () => {
    expect(particleCount(0)).toBe(0);
    expect(particleCount(0.5)).toBe(20);
    expect(particleCount(-3)).toBe(0);
    expect(particleCount(undefined)).toBe(Math.round(DEFAULT_DENSITY * 40));
    expect(particleCount(Number.NaN)).toBe(Math.round(DEFAULT_DENSITY * 40));
    expect(particleCount(Infinity)).toBe(Math.round(DEFAULT_DENSITY * 40));
  });

  it('여러 곳에 깔아도 예산을 같이 나눠 쓴다', () => {
    const b = createBudget(40);
    expect(b.take(28)).toBe(28);
    expect(b.take(28)).toBe(12);
    expect(b.take(5)).toBe(0);
    expect(b.left).toBe(0);
    b.give(12);
    expect(b.left).toBe(12);
    expect(b.take(30)).toBe(12);
    b.give(1000);
    expect(b.left).toBe(40);
    expect(b.take(-5)).toBe(0);
  });
});

describe('금빛 먼지: 입자의 움직임', () => {
  const ps = createParticles(40, 7);

  it('같은 시드면 같은 입자, 시드가 다르면 다른 입자', () => {
    expect(createParticles(10, 7)).toEqual(createParticles(10, 7));
    expect(createParticles(10, 7)).not.toEqual(createParticles(10, 8));
  });

  it('처음에는 화면 전체에 고르게 흩어져 있다', () => {
    const ys = ps.map((p) => p.y);
    expect(Math.min(...ys)).toBeLessThan(0.25);
    expect(Math.max(...ys)).toBeGreaterThan(0.75);
    for (const p of ps) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
    }
  });

  it('천천히 떠오른다: 초당 올라가는 높이가 작고, 800px 상자에서 초당 10~24px', () => {
    for (const p of ps) {
      expect(p.rise).toBeGreaterThanOrEqual(0.012);
      expect(p.rise).toBeLessThanOrEqual(0.03);
      expect(p.rise * 800).toBeGreaterThanOrEqual(9.5);
      expect(p.rise * 800).toBeLessThanOrEqual(24.1);
    }
  });

  it('advance: 위로 올라가고, 넘으면 아래에서 새로 나온다', () => {
    const rng = mulberry32(1);
    const p = { ...ps[0], y: 0.5, rise: 0.02 };
    const next = advance(p, 1, rng);
    expect(next.y).toBeCloseTo(0.48, 6);
    expect(next.x).toBe(p.x);

    const top = { ...ps[0], y: TOP_EXIT + 0.001, rise: 0.03 };
    const reborn = advance(top, 1, rng);
    expect(reborn.y).toBe(BOTTOM_ENTER);
  });

  it('긴 시간을 돌려도 입자는 항상 상자 근처에 있다', () => {
    const rng = mulberry32(3);
    let cur = createParticles(40, 3);
    for (let i = 0; i < 6000; i++) {
      cur = cur.map((p) => advance(p, 1 / 60, rng));
      for (const p of cur) {
        expect(p.y).toBeGreaterThanOrEqual(TOP_EXIT);
        expect(p.y).toBeLessThanOrEqual(BOTTOM_ENTER);
      }
    }

  }, 20_000);

  it('edgeFade: 가운데는 1, 위아래 끝은 0', () => {
    expect(edgeFade(0.5)).toBe(1);
    expect(edgeFade(BOTTOM_ENTER)).toBe(0);
    expect(edgeFade(TOP_EXIT)).toBe(0);
    expect(edgeFade(0.95)).toBeGreaterThan(0);
    expect(edgeFade(0.95)).toBeLessThan(1);
    expect(edgeFade(0.05)).toBeGreaterThan(0);
    expect(edgeFade(0.05)).toBeLessThan(1);
  });

  it('투명도는 0~1, 최대치(peak)를 넘지 않고, 숨 쉬듯 변한다(번쩍임 없음)', () => {
    for (const p of ps) {
      let lo = Infinity;
      let hi = -Infinity;
      for (let t = 0; t < 60; t += 0.25) {
        const a = particleAlpha({ ...p, y: 0.5 }, t);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(1);
        expect(a).toBeLessThanOrEqual(p.peak + 1e-9);
        lo = Math.min(lo, a);
        hi = Math.max(hi, a);
      }

      expect(lo).toBeGreaterThan(hi * 0.5);

      expect((Math.PI * 2) / p.twinkleW).toBeGreaterThanOrEqual(3 - 1e-9);
      expect((Math.PI * 2) / p.twinkleW).toBeLessThanOrEqual(8 + 1e-9);
    }
  });

  it('좌우 흔들림은 입자의 폭을 넘지 않는다', () => {
    for (const p of ps) {
      for (let t = 0; t < 100; t += 1.7) {
        expect(Math.abs(particleSway(p, t))).toBeLessThanOrEqual(p.sway + 1e-9);
      }
    }
  });
});

describe('글자 떠오르기: 타임라인', () => {
  it('글자마다 같은 간격으로 하나씩 시작하고, 끝나는 시각은 마지막 글자 뒤 머묾 시간', () => {
    const tl = glyphTimeline(8, false);
    expect(tl.delays).toHaveLength(8);
    expect(tl.delays[0]).toBe(GLYPH_TIMING.leadMs);
    for (let i = 1; i < 8; i++) expect(tl.delays[i] - tl.delays[i - 1]).toBe(GLYPH_TIMING.stepMs);
    expect(tl.doneAt).toBe(tl.delays[7] + GLYPH_TIMING.riseMs + GLYPH_TIMING.holdMs);

    expect(tl.doneAt).toBeLessThan(4000);
  });

  it('동작 줄이기: 모두 한꺼번에 나오고 600ms 뒤 끝', () => {
    const tl = glyphTimeline(8, true);
    expect(tl.delays.every((d) => d === 0)).toBe(true);
    expect(tl.riseMs).toBe(GLYPH_REDUCED.riseMs);
    expect(tl.doneAt).toBe(GLYPH_REDUCED.doneAt);
  });

  it('글자가 없거나 하나여도 깨지지 않는다', () => {
    expect(glyphTimeline(0, false).delays).toEqual([]);
    expect(glyphTimeline(0, false).doneAt).toBeGreaterThan(0);
    expect(glyphTimeline(1, false).delays).toEqual([GLYPH_TIMING.leadMs]);
    expect(glyphTimeline(-3, false).delays).toEqual([]);
  });
});

describe('글자 떠오르기: 배치', () => {
  it('auto: 4~8의 짝수는 기둥(두 글자씩), 아니면 한 줄', () => {
    expect(glyphLayout(8)).toEqual({ kind: 'pillars', columns: 4 });
    expect(glyphLayout(6)).toEqual({ kind: 'pillars', columns: 3 });
    expect(glyphLayout(4)).toEqual({ kind: 'pillars', columns: 2 });
    expect(glyphLayout(5).kind).toBe('row');
    expect(glyphLayout(2).kind).toBe('row');
    expect(glyphLayout(10).kind).toBe('row');
    expect(glyphLayout(0).kind).toBe('row');
  });

  it('row 는 늘 한 줄, pillars 는 짝수일 때만 기둥', () => {
    expect(glyphLayout(8, 'row').kind).toBe('row');
    expect(glyphLayout(8, 'pillars')).toEqual({ kind: 'pillars', columns: 4 });
    expect(glyphLayout(2, 'pillars')).toEqual({ kind: 'pillars', columns: 1 });
    expect(glyphLayout(7, 'pillars').kind).toBe('row');
  });
});

describe('문장 흐림 -> 선명', () => {
  it('공백을 보존하며 나눈다(다시 붙이면 원문)', () => {
    for (const text of ['Hello there, Mina.', '  leading and  double  spaces ', 'one', '', 'line\nbreak and\ttab']) {
      expect(splitWords(text).map((t) => t.text).join('')).toBe(text);
    }
  });

  it('단어 번호는 0부터 차례로, 공백은 -1', () => {
    const tokens = splitWords('Oho? You still want to see that one?');
    const words = tokens.filter((t) => t.word);
    expect(words.map((t) => t.index)).toEqual(words.map((_, i) => i));
    expect(words).toHaveLength(8);
    expect(tokens.filter((t) => !t.word).every((t) => t.index === -1)).toBe(true);
    expect(splitWords('')).toEqual([]);
  });

  it('단어 지연: 40ms 간격에서 시작하고 기본 지연을 더한다', () => {
    expect(wordDelays(4, 0)).toEqual([0, 40, 80, 120]);
    expect(wordDelays(3, 200)).toEqual([200, 240, 280]);
    expect(wordDelays(0, 100)).toEqual([]);
    expect(wordDelays(1, 50)).toEqual([50]);
  });

  it('긴 문장도 전체 퍼짐은 상한 안, 지연은 오름차순', () => {
    const d = wordDelays(120, 100);
    expect(d[0]).toBe(100);
    expect(d[d.length - 1] - d[0]).toBeLessThanOrEqual(REVEAL.maxSpreadMs);
    for (let i = 1; i < d.length; i++) expect(d[i]).toBeGreaterThanOrEqual(d[i - 1]);

    expect(d[d.length - 1] + REVEAL.wordMs).toBeLessThan(2000);
  });

  it('음수 지연은 0 으로', () => {
    expect(wordDelays(2, -500)).toEqual([0, 40]);
  });
});

describe('문빛 번짐', () => {
  it('0.6초, 동작 줄이기에서는 짧은 페이드', () => {
    expect(GATE_MS).toBe(600);
    expect(gateDoneMs(false)).toBe(GATE_MS);
    expect(gateDoneMs(true)).toBe(GATE_REDUCED_MS);
    expect(GATE_REDUCED_MS).toBeLessThan(GATE_MS);
  });
});

describe('문장 흐림: blur 는 문단 하나에 한 번', () => {
  it('문단 blur 길이는 단어가 퍼지는 시간에 맞추되 상한 안', () => {
    expect(revealBlurMs(0)).toBe(REVEAL.blurMinMs);
    expect(revealBlurMs(1)).toBeGreaterThanOrEqual(REVEAL.blurMinMs);
    let prev = 0;
    for (const n of [1, 5, 12, 20, 60, 400]) {
      const ms = revealBlurMs(n);
      expect(ms).toBeGreaterThanOrEqual(prev);
      expect(ms).toBeLessThanOrEqual(REVEAL.blurMaxMs);
      prev = ms;
    }
    expect(revealBlurMs(Number.NaN)).toBe(REVEAL.blurMinMs);
  });

  it('CSS: 단어 애니메이션에는 filter 가 없고(opacity·translateY 만), blur 는 .mx-reveal 하나에만', () => {
    const word = /@keyframes mx-word-in\s*\{([\s\S]*?)\n\}/.exec(CSS_RULES)?.[1] ?? '';
    expect(word).toContain('opacity');
    expect(word).toContain('translateY');
    expect(word).not.toContain('filter');
    const blur = /@keyframes mx-reveal-blur\s*\{([\s\S]*?)\n\}/.exec(CSS_RULES)?.[1] ?? '';
    expect(blur).toMatch(/filter:\s*blur\(/);

    expect(CSS_RULES).toMatch(/\.mx-reveal\[data-seen="true"\]\s*\{[^}]*mx-reveal-blur/);
    expect(CSS_RULES).not.toMatch(/\.mx-reveal-w[^{]*\{[^}]*blur/);
  });

  it('CSS: 동작 줄이기에서는 문단·단어 애니메이션이 없고 단어는 처음부터 보인다', () => {
    expect(REDUCED_BLOCK).toMatch(/\.mx-reveal\[data-seen="true"\] > \.mx-reveal-w\s*\{\s*animation:\s*none/);
    expect(REDUCED_BLOCK).toMatch(/\.mx-reveal\[data-seen="false"\] > \.mx-reveal-w\s*\{\s*opacity:\s*1/);
  });
});

describe('먹 번짐: 먹 얼룩 마스크', () => {
  const SPEC = INK_BLOTS[0];

  it('시드가 같으면 같은 얼룩, 시드가 다르면 다른 얼룩', () => {
    expect(inkBlot(SPEC)).toEqual(inkBlot(SPEC));
    expect(inkBlot({ ...SPEC, seed: SPEC.seed + 1 }).d).not.toBe(inkBlot(SPEC).d);
    const ds = INK_BLOTS.map((b) => inkBlot(b).d);
    expect(new Set(ds).size).toBe(INK_BLOTS.length);
  });

  it('윤곽은 닫힌 매끈한 곡선(M, Q, Z)이고 숫자만 든다', () => {
    for (const spec of INK_BLOTS) {
      const { d } = inkBlot(spec);
      expect(d).toMatch(/^M[-\d.,]+(Q[-\d.,]+ [-\d.,]+)+Z$/);
      expect(d).not.toMatch(/NaN|undefined|Infinity/);
    }
  });

  it('둥근 원이 아니다: 가장 안쪽과 가장 바깥 반경이 뚜렷이 다르다', () => {
    for (const spec of INK_BLOTS) {
      const b = inkBlot(spec);
      expect(b.minR).toBeCloseTo(spec.rMin, 6);
      expect(b.maxR).toBeCloseTo(spec.rMax, 6);

      expect((b.maxR - b.minR) / b.minR).toBeGreaterThan(0.4);
    }
  });

  it('얼룩과 방울은 100x100 상자 안에 있고, 방울은 얼룩 바깥에 있다', () => {
    for (const spec of INK_BLOTS) {
      const b = inkBlot(spec);
      expect(b.maxR).toBeLessThan(48);
      expect(b.droplets).toHaveLength(spec.droplets);
      for (const c of b.droplets) {
        expect(c.cx - c.r).toBeGreaterThanOrEqual(0);
        expect(c.cx + c.r).toBeLessThanOrEqual(100);
        expect(c.cy - c.r).toBeGreaterThanOrEqual(0);
        expect(c.cy + c.r).toBeLessThanOrEqual(100);
        expect(Math.hypot(c.cx - 50, c.cy - 50) - c.r).toBeGreaterThan(spec.rMax);
      }
    }
  });

  it('SVG: 필터를 쓰지 않는 정지한 그림(iOS Safari 에서도 같은 모양, 크기를 키울 때 필터를 다시 계산하지 않는다)', () => {
    for (const spec of INK_BLOTS) {
      const svg = inkBlotSvg(spec);
      expect(svg).toContain("viewBox='0 0 100 100'");
      expect(svg).toContain("width='100'");
      expect(svg).not.toMatch(/<filter|feTurbulence|feDisplacementMap|feGaussianBlur|<script|<image/);
    }
  });

  it('data URI 는 CSS url("...") 안에 그대로 넣을 수 있다', () => {
    for (const spec of INK_BLOTS) {
      for (const uri of [inkBlotDataUri(spec), inkRingDataUri(spec)]) {
        expect(uri.startsWith('data:image/svg+xml,')).toBe(true);
        expect(uri).not.toMatch(/[<>#"\n]/);
      }
    }
  });

  it('앞머리의 띠(고리 얼룩)는 같은 윤곽의 획뿐이다: 안을 채우지 않아 칸 전체를 물들이지 않고, 필터도 없다', () => {
    for (const spec of INK_BLOTS) {
      const ring = inkRingSvg(spec);
      expect(ring).toContain(inkBlot(spec).d);
      expect(ring).not.toMatch(/<filter|feTurbulence|feGaussianBlur|<script|<image/);

      const uses = ring.match(/<use [^>]*>/g) ?? [];
      expect(uses.length).toBeGreaterThanOrEqual(4);
      for (const u of uses) expect(u).toContain("fill='none'");
    }
  });

  it('mystic.css 의 --mx-blot-1..3, --mx-ring-1..3 이 logic.ts 의 INK_BLOTS 와 같다(얼룩을 바꾸면 이 줄을 고친다)', () => {
    const block = /\/\* mx-blots:begin \*\/\n([\s\S]*?)\n\s*\/\* mx-blots:end \*\//.exec(CSS)?.[1];
    expect(block, 'mx-blots 구간이 없다').toBeDefined();
    expect(block).toBe(inkBlotCssBlock());
  });

  it('CSS: 둥근 조명 원(radial-gradient 마스크)이 아니라 얼룩 마스크이고, 마스크를 못 쓰는 브라우저는 페이드로 물러난다', () => {
    const ink = CSS_RULES.slice(CSS_RULES.indexOf('.mx-ink-body,'), CSS_RULES.indexOf('.mx-reveal {'));
    expect(ink).not.toMatch(/radial-gradient/);
    expect(ink).toMatch(/@supports \(\(mask-image: url\("x\.svg"\)\) or \(-webkit-mask-image: url\("x\.svg"\)\)\)/);

    const outside = ink.slice(0, ink.indexOf('@supports'));
    expect(outside).toMatch(/\.mx-ink\[data-state="run"\] > \.mx-ink-body\s*\{\s*animation:\s*mx-fade/);
    expect(outside).not.toMatch(/mask-image:\s*var/);

    const reveal = /@keyframes mx-ink-reveal\s*\{([\s\S]*?)\n\}/.exec(ink)?.[1] ?? '';
    expect(reveal).toContain('-webkit-mask-size');
    expect(reveal).toMatch(/\bmask-size/);
  });

  it('CSS: 띠(.mx-ink-stain)는 고리 얼룩 마스크로 윤곽만 따라가고, 가로로 넓은 칸은 높이 기준 키프레임을 쓴다', () => {
    const stain = /\.mx-ink-stain\s*\{\s*display:\s*block;([^}]*)\}/.exec(CSS_RULES)?.[1] ?? '';
    expect(stain).toMatch(/mask-image:\s*var\(--mx-ring-1\), var\(--mx-ring-2\), var\(--mx-ring-3\)/);
    const wide = /@keyframes mx-ink-reveal-h\s*\{([\s\S]*?)\n\}/.exec(CSS_RULES)?.[1] ?? '';
    expect(wide).toMatch(/mask-size:\s*auto [\d.]+%/);
    expect(CSS_RULES).toMatch(/\.mx-ink\[data-fit="wide"\]\[data-state="run"\] > \.mx-ink-body\s*\{\s*animation-name:\s*mx-ink-reveal-h/);

    const endSizes = (name: string): number[] => {
      const body = new RegExp(`@keyframes ${name}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(CSS_RULES)?.[1] ?? '';
      const to = /to\s*\{([\s\S]*?)\}/.exec(body)?.[1] ?? '';
      const size = /(?<![-\w])mask-size:\s*([^;]+);/.exec(to)?.[1] ?? '';
      return size.split(',').map((v) => parseFloat(v));
    };
    const reveal = endSizes('mx-ink-reveal');
    const wash = endSizes('mx-ink-stain');
    expect(reveal).toHaveLength(3);
    expect(wash).toHaveLength(3);
    reveal.forEach((r, i) => expect(wash[i]).toBeGreaterThanOrEqual(r));
  });

  it('InkBloom 은 높이 기준 키프레임(mx-ink-reveal-h)의 끝도 알아듣고 닫는다(끝을 못 알아듣으면 마스크가 남는다)', () => {
    const src = readFileSync(path.join(process.cwd(), 'src/components/mystic/ink-bloom.tsx'), 'utf8');
    expect(src).toMatch(/animationName\.startsWith\('mx-ink-reveal'\)/);
    for (const m of CSS_RULES.matchAll(/@keyframes (mx-ink-reveal[\w-]*)/g)) expect(m[1].startsWith('mx-ink-reveal')).toBe(true);
  });

  it('CSS: 동작 줄이기에서는 마스크·번짐 막 없이 곧바로 보인다', () => {
    expect(REDUCED_BLOCK).toMatch(/\.mx-ink\[data-state="run"\] > \.mx-ink-body\s*\{[^}]*animation:\s*none/);
    expect(REDUCED_BLOCK).toMatch(/\.mx-ink-stain\s*\{\s*display:\s*none/);
  });
});

describe('글자 내려앉기(FLIP)', () => {
  it('글자마다 출발 지연이 있고, 같은 기둥의 두 글자는 같이 출발하며 기둥마다 늦어진다', () => {
    const tl = landTimeline(8, 2);
    expect(tl.delays).toHaveLength(8);
    expect(tl.delays).toEqual([0, 0, 90, 90, 180, 180, 270, 270]);
    expect(tl.flightMs).toBe(LAND_TIMING.flightMs);
    expect(tl.totalMs).toBe(270 + LAND_TIMING.flightMs);
  });

  it('한 줄 배치(group 1)는 글자마다 하나씩, 시주가 없는 여섯 글자는 세 기둥', () => {
    expect(landTimeline(3, 1).delays).toEqual([0, 90, 180]);
    expect(landTimeline(6, 2).delays).toEqual([0, 0, 90, 90, 180, 180]);
  });

  it('글자가 없거나 잘못된 값이어도 깨지지 않는다', () => {
    expect(landTimeline(0).delays).toEqual([]);
    expect(landTimeline(0).totalMs).toBe(LAND_TIMING.flightMs);
    expect(landTimeline(-2).delays).toEqual([]);
    expect(landTimeline(4, 0).delays).toEqual([0, 90, 180, 270]);
  });

  it('비행은 600ms 안팎(SPEC: 600ms translate+scale 뒤 교차 페이드), 페이드는 비행 안에서 끝난다', () => {
    expect(LAND_TIMING.flightMs).toBeGreaterThanOrEqual(560);
    expect(LAND_TIMING.flightMs).toBeLessThanOrEqual(680);
    expect(LAND_TIMING.fadeMs).toBeLessThan(LAND_TIMING.flightMs);
  });

  it('내려앉기는 마지막 글자가 자리 잡은 뒤에 시작한다', () => {
    const tl = glyphTimeline(8, false);
    const lastRisen = tl.delays[7] + tl.riseMs;
    expect(landStartMs(8)).toBe(lastRisen + LAND_TIMING.holdMs);
    expect(landStartMs(8)).toBeLessThan(tl.doneAt + 1);

    expect(landStartMs(8) + landTimeline(8).totalMs).toBeLessThan(5000);
  });

  it('등롱은 글자가 도착하기 전에 나타나기 시작해서 도착할 때 켜져 있다', () => {
    const a = lanternArrive();
    expect(a.delayMs).toBe(LAND_TIMING.flightMs - LAND_TIMING.lanternLeadMs);
    expect(a.delayMs).toBeGreaterThanOrEqual(0);
    expect(a.delayMs).toBeLessThan(LAND_TIMING.flightMs);

    expect(a.stepMs).toBe(LAND_TIMING.staggerMs);
  });

  it('landTransform: 중심 차이와 글자 크기 비로 FLIP 값을 만든다', () => {
    const t = landTransform({ cx: 100, cy: 200, size: 48 }, { cx: 130, cy: 150, size: 34 });
    expect(t).not.toBeNull();
    expect(t?.dx).toBe(30);
    expect(t?.dy).toBe(-50);
    expect(t?.scale).toBeCloseTo(34 / 48, 6);
  });

  it('landTransform: 배율은 0.2~3 으로 붙잡고, 측정이 틀어지면 null(제자리에서 흐려진다)', () => {
    expect(landTransform({ cx: 0, cy: 0, size: 100 }, { cx: 0, cy: 0, size: 1 })?.scale).toBe(0.2);
    expect(landTransform({ cx: 0, cy: 0, size: 10 }, { cx: 0, cy: 0, size: 900 })?.scale).toBe(3);
    expect(landTransform({ cx: 0, cy: 0, size: 0 }, { cx: 1, cy: 1, size: 20 })).toBeNull();
    expect(landTransform({ cx: Number.NaN, cy: 0, size: 20 }, { cx: 1, cy: 1, size: 20 })).toBeNull();
    expect(landTransform({ cx: 0, cy: 0, size: 20 }, { cx: 1, cy: 1, size: Number.NaN })).toBeNull();
  });

  it('CSS: 내려앉는 동안 먹빛 베일이 걷히고 다 앉으면 글자판이 숨는다', () => {
    expect(CSS_RULES).toMatch(/\.mx-glyphs\[data-phase="land"\]::before[\s\S]*?opacity:\s*0/);
    expect(CSS_RULES).toMatch(/\.mx-glyphs\[data-phase="landed"\]\s*\{\s*visibility:\s*hidden/);
  });

  it('CSS: 기다리는 칸(data-mx-hold)은 말풍선 줄을 숨기고 틀과 문장을 멈추며, 동작 줄이기에서는 풀린다', () => {
    expect(CSS_RULES).toMatch(/\.wt-panel\[data-mx-hold="true"\] \.wt-panel__lines\s*\{\s*opacity:\s*0/);
    expect(CSS_RULES).toMatch(/data-mx-hold="true"\] \.mx-reveal,[\s\S]*?animation-play-state:\s*paused/);
    expect(REDUCED_BLOCK).toMatch(/\.wt-panel\[data-mx-hold\] \.wt-panel__lines\s*\{\s*opacity:\s*1/);
    expect(REDUCED_BLOCK).toMatch(/animation-play-state:\s*running/);
  });
});

describe('문빛 번짐: 시작 자리(origin)', () => {
  it('없으면 화면 가운데', () => {
    expect(gateOriginVars()).toEqual({ '--gate-x': '50%', '--gate-y': '50%' });
    expect(gateOriginVars(undefined)).toEqual({ '--gate-x': '50%', '--gate-y': '50%' });
  });

  it('px·퍼센트·계산식 길이를 그대로 받는다', () => {
    expect(gateOriginVars({ x: '195.4px', y: '23%' })).toEqual({ '--gate-x': '195.4px', '--gate-y': '23%' });
    expect(gateOriginVars({ x: 'calc(50% + 4px)', y: 'clamp(10px, 23dvh, 300px)' })).toEqual({
      '--gate-x': 'calc(50% + 4px)',
      '--gate-y': 'clamp(10px, 23dvh, 300px)',
    });
  });

  it('문 높이(h)는 있을 때만 변수가 된다', () => {
    expect(gateOriginVars({ x: '50%', y: '23%', h: '64px' })['--gate-door-h']).toBe('64px');
    expect(gateOriginVars({ x: '50%', y: '23%' })['--gate-door-h']).toBeUndefined();
    expect(gateOriginVars({ x: '50%', y: '23%', h: '' })['--gate-door-h']).toBeUndefined();
  });

  it('길이가 아닌 값(스타일 주입, 빈 값, 너무 긴 값)은 기본값으로 막는다', () => {
    const bad = gateOriginVars({ x: 'red; background: url(x)', y: '', h: 'url(javascript:alert(1)){}' });
    expect(bad['--gate-x']).toBe('50%');
    expect(bad['--gate-y']).toBe('50%');
    expect(bad['--gate-door-h']).toBeUndefined();
    expect(gateOriginVars({ x: `${'9'.repeat(200)}px`, y: '10px' })['--gate-x']).toBe('50%');
  });

  it('CSS: 문빛 구와 문틈이 origin 변수에서 시작하고, 문틈은 문 높이만큼만 그린다(화면 전체 높이가 아니다)', () => {
    expect(CSS_RULES).toMatch(/\.mx-gate-glow\s*\{[^}]*left:\s*var\(--gate-x\)[^}]*top:\s*var\(--gate-y\)/);
    const slit = /\.mx-gate-slit\s*\{([^}]*)\}/.exec(CSS_RULES)?.[1] ?? '';
    expect(slit).toMatch(/left:\s*var\(--gate-x\)/);
    expect(slit).toMatch(/top:\s*calc\(var\(--gate-y\) - var\(--gate-door-h\) \/ 2\)/);
    expect(slit).toMatch(/height:\s*var\(--gate-door-h\)/);
    expect(slit).not.toMatch(/bottom:/);

    const frames = /@keyframes mx-gate-slit\s*\{([\s\S]*?)\n\}/.exec(CSS_RULES)?.[1] ?? '';
    for (const m of frames.matchAll(/scaleY\(([\d.]+)\)/g)) expect(Number(m[1])).toBeLessThanOrEqual(1);
  });

  it('CSS: 동작 줄이기에서 문빛은 구·문틈 없이 짧은 페이드만 남는다', () => {
    expect(REDUCED_BLOCK).toMatch(/\.mx-gate-slit,\s*\.mx-gate-glow\s*\{\s*display:\s*none/);
    expect(REDUCED_BLOCK).toMatch(/\.mx-gate-wash\s*\{\s*animation:\s*mx-gate-wash 200ms/);
  });
});
