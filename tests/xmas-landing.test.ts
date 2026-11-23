import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { daysToChristmas } from '@/components/xmas/xmas-landing';
import { XMAS } from '@/content/ko/xmas';

describe('크리스마스까지 남은 날', () => {
  it('그해 12월 25일까지의 날 수를 센다', () => {
    expect(daysToChristmas(new Date(2026, 10, 14, 9, 0))).toBe(41);
    expect(daysToChristmas(new Date(2026, 11, 24, 23, 59))).toBe(1);
    expect(daysToChristmas(new Date(2026, 11, 25, 0, 1))).toBe(0);
  });
  it('크리스마스가 지나면 세지 않는다', () => {
    expect(daysToChristmas(new Date(2026, 11, 26))).toBeNull();
  });
});

describe('크리스마스 랜딩 콘티', () => {
  const beats = [...XMAS.hook, ...XMAS.beats];
  const text = JSON.stringify(XMAS);

  it('그림 파일이 모두 있다', () => {
    const srcs = [XMAS.hero.image, ...beats.flatMap((b) => (b.kind === 'art' ? [b.src] : []))];
    for (const src of srcs) expect(existsSync(path.join(process.cwd(), 'public', src)), src).toBe(true);
  });
  it('같은 그림을 두 번 쓰지 않는다', () => {
    const srcs = beats.flatMap((b) => (b.kind === 'art' ? [b.src] : []));
    expect(new Set(srcs).size).toBe(srcs.length);
  });
  it('연의 말풍선은 두 문장까지다', () => {
    for (const b of beats) {
      if (b.kind !== 'art') continue;
      for (const s of b.says ?? []) expect((s.text.match(/[.?!…]+/g) ?? []).length, s.text).toBeLessThanOrEqual(2);
    }
  });
  it('성별 낱말과 정해진 상대를 약속하는 말이 없다', () => {
    for (const word of ['남자', '여자', '남친', '여친', '그녀', '운명의 상대', '반드시', '100%']) expect(text, word).not.toContain(word);
  });
});

import { birthInputFrom } from '@/components/flow/compute';
import { EMPTY_ANSWERS } from '@/components/flow/answers';
import { moveDayCount } from '@/components/xmas/xmas-result';
import { parseXmasInput } from '@/components/xmas/xmas-store';
import { xmasDays } from '@/lib/xmas/pulls';
import { XMAS_FLOW } from '@/content/ko/xmas-flow';
import { unknownPlace } from '@/lib/places/unknown-place';
import { computeChart } from '@/lib/saju';

describe('크리스마스 무료 결과의 선', () => {
  const input = birthInputFrom({
    ...EMPTY_ANSWERS,
    name: '달이',
    date: '1997-09-12',
    time: '14:30',
    timeAnswered: true,
    place: unknownPlace(540),
    sex: 'female',
    sexAnswered: true,
    sexChoice: 'female',
  });
  const chart = computeChart(input!);
  const now = '2026-11-14T03:00:00.000Z';

  it('먼저 움직이기 좋은 날은 이브까지의 날 수만 돌려준다(날짜는 주지 않는다)', () => {
    const n = moveDayCount(chart, now);
    const days = xmasDays(chart, now).filter((d) => (d.kind === 'close' || d.kind === 'group') && d.date <= '2026-12-24');
    expect(n).toBe(days.length);
    expect(moveDayCount(chart, now)).toBe(n);
  });
  it('잠긴 항목마다 사주 용어와 제목이 있고, 가장 궁금한 답(그 사람·약속·연락)이 잠긴 쪽에 있다', () => {
    const items = XMAS_FLOW.result.locked.items;
    for (const item of items) expect(item.term.length > 0 && item.title.length > 0).toBe(true);
    const titles = items.map((i) => i.title).join(' ');
    for (const word of ['그 사람', '약속', '연락']) expect(titles).toContain(word);
  });
  it('입력의 그 사람 쪽 답은 정해진 값만 받는다', () => {
    expect(parseXmasInput('{"relation":{"stage":"friend","goal":"confess","contact":"often"},"partner":null}')).toEqual({ relation: { stage: 'friend', goal: 'confess', contact: 'often' }, partner: null });
    expect(parseXmasInput('{"relation":{"stage":"talking","goal":"meet","contact":null},"partner":{"date":"1996-03-21","time":null}}')?.partner).toEqual({ date: '1996-03-21', time: null });
    expect(parseXmasInput('{"relation":{"stage":"talking","goal":"meet","contact":null},"partner":{"date":"96.3.21","time":null}}')).toBeNull();
    expect(parseXmasInput('{"relation":{"stage":"long","goal":"meet","contact":null},"partner":null}')).toBeNull();
    expect(parseXmasInput('not json')).toBeNull();
    expect(XMAS_FLOW.start.steps.stage.options.map((o) => o.id)).toEqual(['far', 'friend', 'daily', 'talking', 'past']);
    expect(XMAS_FLOW.start.steps.goal.options.map((o) => o.id)).toEqual(['meet', 'closer', 'confess', 'decide']);
  });
});

describe('크리스마스 무료 결과의 연의 문장과 타이머', () => {
  it('그 사람 눈에 비친 나: 사주마다 열쇠가 정해지고 같은 사주면 같은 한 줄이다', async () => {
    const { seenKey } = await import('@/lib/xmas/hooks');
    const { XMAS_HOOKS_KO } = await import('@/content/ko/xmas-hooks');
    const input = birthInputFrom({ ...EMPTY_ANSWERS, name: '달이', date: '1997-09-12', time: '14:30', timeAnswered: true, place: unknownPlace(540), sex: 'female', sexAnswered: true, sexChoice: 'female' });
    const chart = computeChart(input!);
    expect(XMAS_HOOKS_KO.seen.line[seenKey(chart)]).toBeTruthy();
    expect(seenKey(chart)).toBe(seenKey(chart));
  });
  it('남은 시간은 시:분:초로 적고 0 아래로 내려가지 않는다(4시간 기한)', async () => {
    const { formatLeft } = await import('@/components/xmas/xmas-result');
    expect(formatLeft(4 * 3_600_000)).toBe('04:00:00');
    expect(formatLeft(3 * 3_600_000 + 59 * 60_000 + 12_340)).toBe('03:59:12');
    expect(formatLeft(999)).toBe('00:00:00');
    expect(formatLeft(-5)).toBe('00:00:00');
  });
  it('서리 닦기: 손끝이 지나간 칸만 세고, 크게 두 번 문지르면 걷히는 선을 넘는다', async () => {
    const { touchedCells, wipedRatio, WIPE_DONE } = await import('@/components/xmas/xmas-play');
    const [w, h, r] = [328, 280, 36];
    expect(touchedCells(-200, -200, r, w, h)).toEqual([]);
    const cells = new Array<boolean>(12 * 7).fill(false);
    const stroke = (y: number) => {
      for (let x = 20; x <= w - 20; x += r / 2) for (const i of touchedCells(x, y, r, w, h)) cells[i] = true;
    };
    stroke(80);
    expect(wipedRatio(cells)).toBeLessThan(WIPE_DONE);
    stroke(190);
    expect(wipedRatio(cells)).toBeGreaterThanOrEqual(WIPE_DONE);
  });
  it('손으로 해 보는 것마다 건너뛰는 버튼 문구가 있다', () => {
    const { pull, frost } = XMAS_FLOW.result.play;
    for (const s of [pull.label, pull.hint, pull.skip, frost.hint, frost.skip]) expect(s.length).toBeGreaterThan(0);
  });
  it('화면에 1화·2화 같은 회차 표시가 없다', () => {
    expect(JSON.stringify(XMAS)).not.toMatch(/\d화/);
    expect(JSON.stringify(XMAS_FLOW)).not.toMatch(/\d화|\{n\}편/);
  });
});
