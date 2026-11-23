import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { CONCERN_ORDER, CONCERNS } from '@/content/en/concerns';
import { EMPTY_ANSWERS, focusOf, getAnswers, resetAnswers, updateAnswers, type Answers } from '@/components/flow/answers';
import { clearGateArrival, markGateArrival, peekGateArrival } from '@/components/flow/gate';
import { concernReaction, READING_TALK } from '@/components/flow/script';
import { checkDate, checkTime, maskDate, maskTime } from '@/components/flow/reading-form';
import {
  parseReadingStep,
  prevReadingStep,
  readingComplete,
  readingFrontier,
  readingStepAllowed,
  READING_STEPS,
} from '@/components/flow/steps';
import { Stage } from '@/components/stage';
import { coverPoint, doorAt, gateOrigin } from '@/components/scene/door';
import {
  CLIPS,
  CLIP_DIR,
  ENTER,
  ENTER_FRAME,
  REACTION_IDS,
  REACTION_MOUTH_OPENS_MS,
  REACTION_RELEASE_MS,
  SCENE_IDS,
} from '@/components/scene/manifest';
import { reactionClip } from '@/components/scene/reaction';
import { canonicalScene, reactionVideo, resolveScene, sceneStill } from '@/components/scene/resolve';
import { UI } from '@/content/en/ui';
import { bookOf } from '@/lib/reading/build';
import { bookForConcern } from '@/lib/reading';

const LA = { name: 'Los Angeles', country: 'US', lat: 34.05, lng: -118.24, tz: 'America/Los_Angeles', label: 'Los Angeles, US' };
const base: Answers = {
  ...EMPTY_ANSWERS,
  name: 'Mia',
  concern: 'ex',
  focus: 'someone',
  date: '1998-03-21',
  time: '14:30',
  timeAnswered: true,
  place: LA,
};
const PUBLIC = join(process.cwd(), 'public');

describe('고민 -> focus 유도', () => {
  it('연애 묶음은 love/someone, 삶 묶음은 everything', () => {
    expect(focusOf('love')).toBe('love');
    expect(focusOf('marriage')).toBe('love');
    expect(focusOf('crush')).toBe('someone');
    expect(focusOf('ex')).toBe('someone');
    expect(focusOf('partner')).toBe('someone');
    for (const k of ['work', 'money', 'study', 'people', 'change', 'self'] as const) expect(focusOf(k)).toBe('everything');
  });

  it('유도한 focus 의 사탕 책은 고민의 책과 늘 같다', () => {
    for (const k of CONCERN_ORDER) {
      expect(bookOf(focusOf(k))).toBe(bookForConcern(k));
      expect(CONCERNS[k].book).toBe(bookForConcern(k));
    }
  });

  describe('저장소', () => {
    afterEach(() => resetAnswers());

    it('고민을 저장하면 focus 가 따라 바뀐다', () => {
      updateAnswers({ concern: 'money' });
      expect(getAnswers().focus).toBe('everything');
      updateAnswers({ concern: 'crush' });
      expect(getAnswers().focus).toBe('someone');
      updateAnswers({ concern: null });
      expect(getAnswers().focus).toBeNull();
    });
  });
});

describe('단계 규칙: 한 장짜리 입력 화면', () => {
  it('단계는 intro, form, ritual, result 넷이다', () => {
    expect(READING_STEPS).toEqual(['intro', 'form', 'ritual', 'result']);
  });

  it('옛 단계 이름(focus, concern, date, sex, nb 등)은 form 으로, 모르는 이름은 intro 로 읽는다', () => {
    for (const old of ['focus', 'concern', 'name', 'date', 'time', 'place', 'sex', 'nb']) {
      expect(parseReadingStep(old)).toBe('form');
    }
    expect(parseReadingStep('greeting')).toBe('intro');
    expect(parseReadingStep('nonsense')).toBe('intro');
    expect(parseReadingStep(null)).toBe('intro');
  });

  it('답이 모이기 전에는 intro 와 form 만 열린다', () => {
    expect(readingStepAllowed('intro', EMPTY_ANSWERS)).toBe(true);
    expect(readingStepAllowed('form', EMPTY_ANSWERS)).toBe(true);
    expect(readingStepAllowed('ritual', EMPTY_ANSWERS)).toBe(false);
    expect(readingStepAllowed('result', EMPTY_ANSWERS)).toBe(false);
    expect(readingFrontier(EMPTY_ANSWERS)).toBe('form');
  });

  it('생년월일, 시간(모름 포함), 도시, 성별(답하지 않음 포함)이 있으면 결과까지 열린다. 이름과 질문은 선택이다', () => {
    expect(readingComplete(base)).toBe(false);
    const done: Answers = { ...base, sexChoice: 'skip', sex: null, sexAnswered: true, name: '', question: '' };
    expect(readingComplete(done)).toBe(true);
    expect(readingFrontier(done)).toBe('result');
    expect(readingStepAllowed('ritual', done)).toBe(true);
    const noTime: Answers = { ...done, time: null, timeAnswered: true };
    expect(readingComplete(noTime)).toBe(true);
    expect(readingComplete({ ...done, place: null })).toBe(false);
  });

  it('뒤로 가기: form 의 앞은 intro, 나머지의 앞은 form', () => {
    expect(prevReadingStep('form')).toBe('intro');
    expect(prevReadingStep('ritual')).toBe('form');
    expect(prevReadingStep('result')).toBe('form');
  });
});

describe('입력 화면의 칸 맞추기(reading-form.tsx)', () => {
  it('생년월일은 숫자만 받아 YYYY.MM.DD 로 점을 넣는다', () => {
    expect(maskDate('1998')).toBe('1998');
    expect(maskDate('199803')).toBe('1998.03');
    expect(maskDate('19980321')).toBe('1998.03.21');
    expect(maskDate('1998-03-21')).toBe('1998.03.21');
    expect(maskDate('1998032199')).toBe('1998.03.21');
  });

  it('점 앞의 한 자리 월·일은 0 을 채운다(1998.1.23 이 12월 3일이 되지 않게, 2026-10-24)', () => {
    expect(maskDate('1998.1.23')).toBe('1998.01.23');
    expect(maskDate('1998.3.21')).toBe('1998.03.21');
    expect(maskDate('1998-3-5')).toBe('1998.03.5');
    expect(checkDate(maskDate('1998.1.23'))).toEqual({ ok: true, iso: '1998-01-23' });
    expect(checkDate(maskDate('1998.1.2'))).toEqual({ ok: true, iso: '1998-01-02' });

    expect(maskDate('1998.1')).toBe('1998.1');
    expect(maskDate('1998.1.')).toBe('1998.01');
    expect(maskDate('1998.01.')).toBe('1998.01');
    expect(maskDate('1998.012')).toBe('1998.01.2');
    expect(maskDate('1998.12.3')).toBe('1998.12.3');
  });

  it('있는 날짜만 받는다', () => {
    expect(checkDate('1998.03.21')).toEqual({ ok: true, iso: '1998-03-21' });
    expect(checkDate('1998.02.30')).toMatchObject({ ok: false, error: 'invalid' });
    expect(checkDate('')).toMatchObject({ ok: false, error: 'empty' });
    expect(checkDate('1800.01.01')).toMatchObject({ ok: false, error: 'range' });
  });

  it('시간은 24시간 HH:MM', () => {
    expect(maskTime('1320')).toBe('13:20');
    expect(maskTime('7')).toBe('7');
    expect(checkTime('13:20')).toBe('13:20');
    expect(checkTime('24:00')).toBeNull();
    expect(checkTime('9:05')).toBeNull();
  });

  it('콜론 앞의 한 자리 시는 0 을 채우고, am·pm 은 24시간으로 바꾼다', () => {
    expect(maskTime('9:30')).toBe('09:30');
    expect(maskTime('9:')).toBe('09');
    expect(maskTime('1:20pm')).toBe('13:20');
    expect(maskTime('1:20 PM')).toBe('13:20');
    expect(maskTime('12:05am')).toBe('00:05');
    expect(maskTime('12:05pm')).toBe('12:05');
    expect(maskTime('11:40 a.m.')).toBe('11:40');

    expect(maskTime('01:20p')).toBe('13:20');
    expect(maskTime('09:3')).toBe('09:3');
  });
});

describe('각본', () => {
  const step = (id: string) => READING_TALK.find((s) => s.id === id);

  it('단계 순서: greeting, name, concern, date, time, place, sex, nb', () => {
    expect(READING_TALK.map((s) => s.id)).toEqual(['greeting', 'name', 'concern', 'date', 'time', 'place', 'sex', 'nb']);
  });

  it('모든 단계가 같은 장면(listen)이고, 반응이 있는 단계는 talk 클립을 쓴다', () => {
    for (const s of READING_TALK) expect(canonicalScene(s.scene)).toBe('listen');
    for (const id of ['name', 'concern', 'date', 'time', 'place']) expect(step(id)?.clip).toBe('talk');
    expect(step('sex')?.clip ?? null).toBeNull();
  });

  it('고민 반응은 CONCERNS[k].reaction 에서 나오고 같은 입력이면 같은 문장이다', () => {
    for (const k of CONCERN_ORDER) {
      const a = { name: 'Mia', concern: k };
      const text = concernReaction(a);
      expect(text).toBeTruthy();
      expect(text).toBe(concernReaction(a));
      expect(text).not.toMatch(/\{name\}/);
    }
    expect(concernReaction({ name: '', concern: null })).toBeNull();

    for (const k of CONCERN_ORDER) expect(concernReaction({ name: '', concern: k })).not.toMatch(/\{name\}/);
  });

  it('고민 단계의 답 말풍선은 고른 고민의 라벨이다', () => {
    expect(step('concern')?.answer({ ...base, concern: 'work' })).toBe(CONCERNS.work.label);
    expect(step('concern')?.answer({ ...EMPTY_ANSWERS })).toBeNull();
  });

  it('Non-binary: sex 단계는 반응 없이 음양 질문으로 이어지고, 답 문구에는 성별 단어가 없다', () => {
    const nb: Answers = { ...base, sexChoice: 'nonbinary', sex: null, sexAnswered: false };
    expect(step('sex')?.reaction?.(nb)).toBeNull();
    const yang: Answers = { ...nb, nbChoice: 'yang', sex: 'male', sexAnswered: true };
    const yin: Answers = { ...nb, nbChoice: 'yin', sex: 'female', sexAnswered: true };
    const skip: Answers = { ...nb, nbChoice: 'skip', sex: null, sexAnswered: true };
    const nbLabels = [yang, yin, skip].map((a) => step('nb')?.answer(a) ?? '');
    const nbReactions = [yang, yin, skip].map((a) => step('nb')?.reaction?.(a) ?? '');
    const nbQuestion = step('nb')?.question ?? '';
    for (const text of [...nbLabels, ...nbReactions, nbQuestion]) {
      expect(text).not.toMatch(/\b(woman|women|man|men|male|female|boy|girl)\b/i);
    }

    expect(nbReactions[0]).toBeTruthy();
    expect(nbReactions[1]).toBeTruthy();
    expect(nbReactions[2]).toMatch(/closed/i);
    expect(new Set(nbLabels).size).toBe(3);
  });

  it('성별 단계의 답 말풍선은 누른 것을 그대로 적는다(Woman, Man, Non-binary, Skip)', () => {
    const labels = (['female', 'male', 'nonbinary', 'skip'] as const).map(
      (c) => step('sex')?.answer({ ...base, sexChoice: c }) ?? '',
    );
    expect(new Set(labels).size).toBe(4);
    expect(labels[2]).toMatch(/non-binary/i);
  });
});

describe('장면 매니페스트: 옛 그림이 없다', () => {
  const FORBIDDEN = /yul-portrait|yul-gate|yul-gift|sogeum\.jpg|yul-greet|yul-scroll|intro-poster|\/intro\.mp4/;

  it('모든 장면이 소금을 원본대로 다시 그린 정지 그림(yul-listen-v2)으로 풀린다(영상은 껐다, 2026-10-31)', () => {
    for (const id of SCENE_IDS) {
      const m = resolveScene(id);
      expect(m.videos).toEqual([]);
      expect(m.stills.map((s) => s.src)).toEqual([`${CLIP_DIR}/yul-listen-v2.jpg`, `${CLIP_DIR}/yul-master-v2.jpg`]);
      expect(canonicalScene(id)).toBe('listen');
    }
    expect(sceneStill('listen')).toBe(`${CLIP_DIR}/yul-listen-v2.jpg`);
  });

  it('후보 파일이 실제로 있고 옛 파일 이름이 없다', () => {
    const files = new Set<string>([ENTER.poster]);
    for (const id of SCENE_IDS) {
      const m = resolveScene(id);
      m.videos.forEach((v) => files.add(v));
      m.stills.forEach((s) => files.add(s.src));
    }
    for (const id of REACTION_IDS) {

      const src = reactionVideo(id);
      if (src) files.add(src);
    }
    for (const f of files) {
      expect(f).not.toMatch(FORBIDDEN);
      expect(existsSync(join(PUBLIC, f)), `${f} 이(가) public 에 없다`).toBe(true);
    }
  });

  it('CLIPS 에서 켠 칸의 파일이 있다', () => {
    for (const [id, c] of Object.entries(CLIPS)) {
      if (c.mp4) expect(existsSync(join(PUBLIC, CLIP_DIR, `${c.file}.mp4`)), `${id}.mp4`).toBe(true);
      if (c.jpg) expect(existsSync(join(PUBLIC, CLIP_DIR, `${c.file}.jpg`)), `${id}.jpg`).toBe(true);
    }
  });

  it('반응 클립 talk 은 꺼져 있다(옛 영상 속 소금이 원본과 달라서, 2026-10-31). 영상을 새로 만들어 켜면 yul-talk.mp4 를 가리킨다', () => {
    expect(reactionVideo('talk')).toBeNull();
    expect(ENTER).not.toHaveProperty('video');
  });
});

function jpegSize(file: string): { width: number; height: number } {
  const b = readFileSync(file);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) {
      i += 1;
      continue;
    }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error('SOF 마커를 못 찾았다');
}

describe('첫 화면 문의 위치(scene/door.ts)', () => {
  it('ENTER_FRAME 의 크기는 enter-v2.jpg(옛 영상의 첫 프레임과 같은 크기)와 같다', () => {
    const { width, height } = jpegSize(join(PUBLIC, ENTER.poster));
    expect(width).toBe(ENTER_FRAME.width);
    expect(height).toBe(ENTER_FRAME.height);
  });

  it('문 높이는 영상 시간에 따라 조금 내려가고(0초 → 끝), 범위 밖 시각은 처음·끝 값이다', () => {
    const first = doorAt(0).y;
    const last = doorAt(5.04).y;
    expect(first).toBeCloseTo(0.389, 3);
    expect(last).toBeCloseTo(0.434, 3);
    expect(doorAt(-3).y).toBe(first);
    expect(doorAt(99).y).toBe(last);
    expect(doorAt(Number.NaN).y).toBe(first);
    let prev = first;
    for (let t = 0; t <= 5.04; t += 0.25) {
      const y = doorAt(t).y;
      expect(y).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = y;
    }

    expect(doorAt(0).x).toBeGreaterThan(0.45);
    expect(doorAt(0).x).toBeLessThan(0.55);
  });

  it('cover 계산: 칸의 비율이 프레임과 같으면 프레임 비율이 그대로 칸 비율이다', () => {
    const box = { left: 0, top: 0, width: 358, height: 642 };
    const p = coverPoint(box, { width: 716, height: 1284 }, { x: 0.5, y: 0.7 }, { x: 0.25, y: 0.5 });
    expect(p.x).toBeCloseTo(89.5, 1);
    expect(p.y).toBeCloseTo(321, 0);
  });

  it('390x540 칸(390x844 폰의 첫 화면): 위아래가 잘려도 문은 칸 안, 화면 위쪽 23% 안팎에 놓인다', () => {
    const box = { left: 0, top: 0, width: 390, height: 540 };
    const first = gateOrigin(box, 0);
    const last = gateOrigin(box, 5.04);

    expect(first.x).toBe('199.7px');
    expect(parseFloat(first.y)).toBeCloseTo(160.5, 0);

    expect(parseFloat(first.h)).toBeCloseTo(0.08 * 1284 * (390 / 716), 0);
    expect(parseFloat(first.h)).toBeLessThan(844 * 0.1);
    expect(parseFloat(last.y)).toBeGreaterThan(parseFloat(first.y));
    const ratio = parseFloat(last.y) / 844;
    expect(ratio).toBeGreaterThan(0.18);
    expect(ratio).toBeLessThan(0.26);
  });

  it('칸의 화면 위치(left, top)가 더해진다: 데스크톱 가운데 열', () => {
    const inColumn = gateOrigin({ left: 480, top: 0, width: 480, height: 620 }, 0);
    const alone = gateOrigin({ left: 0, top: 0, width: 480, height: 620 }, 0);
    expect(parseFloat(inColumn.x) - parseFloat(alone.x)).toBeCloseTo(480, 1);
    expect(inColumn.y).toBe(alone.y);
    expect(inColumn.x).toMatch(/^\d+(\.\d)?px$/);
  });

  it('칸이 프레임보다 납작하면(폭 맞춤이 아니라 높이 맞춤) 가로로 잘린다', () => {

    const o = gateOrigin({ left: 0, top: 0, width: 800, height: 300 }, 0);
    expect(parseFloat(o.x)).toBeGreaterThan(380);
    expect(parseFloat(o.x)).toBeLessThan(420);
  });

  it('문이 화면 위로 스크롤돼 있으면 빛은 화면 맨 위(0)에서 시작한다', () => {
    const scrolled = gateOrigin({ left: 0, top: -400, width: 390, height: 520 }, 0);
    expect(parseFloat(scrolled.y)).toBe(0);
    const inView = gateOrigin({ left: 0, top: 0, width: 390, height: 520 }, 0);
    expect(parseFloat(inView.y)).toBeGreaterThan(0);
  });
});

describe('문빛 도착 베일(globals.css)', () => {
  const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
  const mystic = readFileSync(join(process.cwd(), 'src/components/mystic/mystic.css'), 'utf8');
  const rule = (sel: string): string => {

    const at = css.lastIndexOf(`\n${sel} {`);
    expect(at, `${sel} 규칙이 있다`).toBeGreaterThan(-1);
    return css.slice(at + 1, css.indexOf('}\n', at));
  };

  const stops = (r: string): string => {
    const m = /radial-gradient\(\s*(?:circle[^,]*,)\s*([\s\S]*?)\)\s*(?:,|;)/.exec(r);
    expect(m, 'radial-gradient 가 있다').toBeTruthy();
    return (m?.[1] ?? '').replace(/\s+/g, '');
  };

  it('도착 베일은 --gate-veil 토큰, 700ms cubic-bezier(.4,0,.2,1) 로 걷힌다', () => {
    const veil = rule('.dg-arrive::before');
    expect(veil).toMatch(/var\(--gate-veil\)/);
    expect(veil).toMatch(/700ms\s+cubic-bezier\(0\.4,\s*0,\s*0\.2,\s*1\)/);
  });

  it('GateBloom 의 마지막 막(.mx-gate-wash)과 도착 베일은 같은 색이다', () => {
    const token = /--gate-veil:\s*([^;]+);/.exec(css)?.[1].trim();
    expect(token).toBeTruthy();
    const wash = /\.mx-gate-wash\s*{[^}]*?background:\s*([^;]+);/.exec(mystic)?.[1].trim();
    expect(wash, 'mystic.css 의 .mx-gate-wash 배경').toBeTruthy();

    expect([token, 'var(--gate-veil)']).toContain(wash);
  });

  it('도착 베일의 밝은 구는 GateBloom 의 금빛 구(.mx-gate-glow)가 다 커진 모습과 같다(색 정지점, 반지름)', () => {
    const glow = /\.mx-gate-glow\s*{[^}]*?background:\s*(radial-gradient\([\s\S]*?\));/.exec(mystic)?.[1];
    expect(glow, 'mystic.css 의 .mx-gate-glow 배경').toBeTruthy();
    const veil = rule('.dg-arrive::before');
    expect(stops(`${glow};`)).toBe(stops(veil));

    const endScale = Number(/@keyframes mx-gate-glow\s*{[\s\S]*?to\s*{[^}]*?scale\(([\d.]+)\)/.exec(mystic)?.[1]);
    expect(endScale).toBeGreaterThan(1);
    expect(veil).toContain(`circle ${(endScale * 50).toFixed(0)}vmax at var(--gate-x) var(--gate-y)`);
  });

  it('가운데 밝은 빛이 막보다 오래 남는다(::after, 문 자리)', () => {
    const light = rule('.dg-arrive::after');
    expect(light).toMatch(/radial-gradient/);
    expect(light).toMatch(/var\(--gate-x\)/);
    const ms = (r: string) => Number(/(\d+)ms/.exec(r)?.[1]);
    expect(ms(light)).toBeGreaterThan(ms(rule('.dg-arrive::before')));
  });

  it('도착하는 장면은 1.04배에서 1배로 가라앉는다', () => {
    expect(css).toMatch(/@keyframes scene-arrive\s*{\s*from\s*{\s*transform:\s*scale\(1\.04\)/);
  });
});

describe('도착 표시(flow/gate.ts)', () => {
  afterEach(() => clearGateArrival());

  it('표시하기 전과 지운 뒤에는 null', () => {
    expect(peekGateArrival()).toBeNull();
    markGateArrival({ x: '199.7px', y: '160.5px' });
    expect(peekGateArrival()).not.toBeNull();
    clearGateArrival();
    expect(peekGateArrival()).toBeNull();
  });

  it('문빛이 시작한 자리를 그대로 넘긴다. 같은 객체라 구독이 불필요하게 다시 그리지 않는다', () => {
    markGateArrival({ x: '199.7px', y: '160.5px' });
    expect(peekGateArrival()).toEqual({ x: '199.7px', y: '160.5px' });
    expect(peekGateArrival()).toBe(peekGateArrival());
  });

  it('자리가 없거나 길이가 아닌 값이면 화면 가운데', () => {
    markGateArrival();
    expect(peekGateArrival()).toEqual({ x: '50%', y: '50%' });
    markGateArrival({ x: 'url(javascript:alert(1))', y: '10px' });
    expect(peekGateArrival()).toEqual({ x: '50%', y: '50%' });
    markGateArrival({ x: '40%', y: '12.5px' });
    expect(peekGateArrival()).toEqual({ x: '40%', y: '12.5px' });
  });
});

describe('반응 클립 타이밍(scene/reaction.ts)', () => {
  const base = { hasReaction: true, skipped: false, beat: 0, stage: 'gap' as const, dotsMs: 640 };

  it('반응 앞의 짧은 쉼에는 켜지지 않고, 쓰는 중 점이 뜨면 켜진다', () => {
    expect(reactionClip(base).on).toBe(false);
    expect(reactionClip({ ...base, stage: 'dots' }).on).toBe(true);
    expect(reactionClip({ ...base, stage: 'typing' }).on).toBe(true);
  });

  it('반응이 없거나 건너뛰었으면 켜지지 않는다', () => {
    expect(reactionClip({ ...base, stage: 'dots', hasReaction: false }).on).toBe(false);
    expect(reactionClip({ ...base, stage: 'dots', skipped: true }).on).toBe(false);
  });

  it('질문으로 넘어간 뒤에도(쉼, 점, 타자, 끝) 켜진 채로 둔다', () => {
    for (const stage of ['gap', 'dots', 'typing', 'done'] as const) {
      expect(reactionClip({ ...base, beat: 1, stage }).on).toBe(true);
    }
  });

  it('타자가 끝나면(질문 쪽으로 넘어가면) 걷는다. 타자 중에는 걷지 않는다', () => {
    expect(reactionClip({ ...base, stage: 'dots' }).release).toBe(false);
    expect(reactionClip({ ...base, stage: 'typing' }).release).toBe(false);
    expect(reactionClip({ ...base, beat: 1, stage: 'gap' }).release).toBe(true);
    expect(reactionClip({ ...base, stage: 'done' }).release).toBe(true);

    expect(reactionClip({ ...base, hasReaction: false, stage: 'done' }).release).toBe(false);
  });

  it('입이 열리는 0.65초가 글자 직전에 오도록: 점이 짧으면 바로, 길면 그 차이만큼 늦게 튼다', () => {
    expect(REACTION_MOUTH_OPENS_MS).toBe(650);
    expect(reactionClip({ ...base, stage: 'dots', dotsMs: 500 }).delayMs).toBe(0);
    expect(reactionClip({ ...base, stage: 'dots', dotsMs: 650 }).delayMs).toBe(0);
    expect(reactionClip({ ...base, stage: 'dots', dotsMs: 820 }).delayMs).toBe(170);
    expect(reactionClip({ ...base, stage: 'dots', dotsMs: 900 }).delayMs).toBe(250);

    expect(reactionClip({ ...base, stage: 'typing', dotsMs: 0 }).delayMs).toBe(0);
  });

  it('타자가 끝난 뒤 400ms 에 걷는다', () => {
    expect(REACTION_RELEASE_MS).toBe(400);
  });
});

describe('Stage: 꽃잎·번짐은 켠 화면에만', () => {
  const html = (props: { ambience?: boolean; night?: boolean }) =>
    renderToStaticMarkup(
      createElement(Stage, { backdrop: '/x.jpg', ...props } as ComponentProps<typeof Stage>, createElement('main', null, 'x')),
    );

  it('기본은 꽃잎도 분홍 번짐도 없다(대화·의식·결과·/type·404·오류)', () => {
    const out = html({});
    expect(out).not.toMatch(/petal|dg-bloom|dg-petals/);
  });

  it('ambience 를 켜면 둘 다 깔린다(첫 화면은 영상 칸 안에서 <Ambience /> 를 직접 쓴다)', () => {
    const out = html({ ambience: true });
    expect(out).toMatch(/dg-bloom/);
    expect(out).toMatch(/petal/);
  });

  it('night 는 양옆 배경을 밤으로', () => {
    expect(html({ night: true })).toMatch(/dg-world--night/);
    expect(html({})).not.toMatch(/dg-world--night/);
  });
});

describe('대화 화면 CSS: 밤 베일, 고민 이름표', () => {
  const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
  const rule = (sel: string): string => {

    const at = css.lastIndexOf(`\n${sel} {`);
    expect(at, `${sel} 규칙이 있다`).toBeGreaterThan(-1);
    return css.slice(at + 1, css.indexOf('}', at));
  };

  it('위쪽 스크림은 먹빛(--night-rgb) 그라데이션이고 한지색이 아니다', () => {
    const night = rule('.dg-top-scrim--night');
    expect(night).toMatch(/--night-rgb/);
    expect(night).not.toMatch(/--paper-rgb/);
  });

  it('아래 베일도 먹빛이고 높이는 절반 아래다', () => {
    const veil = rule('.dg-night-veil');
    expect(veil).toMatch(/--night-rgb/);
    expect(veil).not.toMatch(/--paper-rgb/);
    expect(Number(/height:\s*(\d+)%/.exec(veil)?.[1])).toBeLessThanOrEqual(45);
  });

  it('고민 이름표는 테두리도 배경도 없고 작은 대문자와 금빛 선이다', () => {
    const label = rule('.dg-concerns__label');
    expect(label).not.toMatch(/\bborder\b|border-radius|background/);
    expect(label).toMatch(/text-transform:\s*uppercase/);
    expect(rule('.dg-concerns__label::after')).toMatch(/height:\s*1px/);
  });

  it('각 묶음은 두 열 격자다', () => {
    const chips = rule('.dg-concerns__chips');
    expect(chips).toMatch(/display:\s*grid/);
    expect(chips).toMatch(/repeat\(2,/);
  });
});

describe('논바이너리 안내 한 줄(문구 담당과의 약속)', () => {
  it('UI.reading.steps.sex.nbHint 는 성별 단어 없이 어느 쪽이든 괜찮다고 말한다', () => {
    const hint = UI.reading.steps.sex.nbHint;
    expect(hint).toBe('Not sure? Either is fine. It only changes which way the chapters turn.');
    expect(hint).not.toMatch(/\b(woman|women|man|men|male|female|boy|girl)\b/i);
  });
});
