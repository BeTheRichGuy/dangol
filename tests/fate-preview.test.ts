import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FlowChart } from '../src/components/result/fate-visuals';
import { fateMapOf } from '../src/lib/reading/fate-map';
import { risingPreview } from '../src/lib/reading/fate-preview';
import { computeChart, type BirthInput } from '../src/lib/saju';

const SEOUL = { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' };
const NOW = '2026-10-30T03:00:00.000Z';
const input = (date: string, time: string | null, sex: BirthInput['sex']): BirthInput => ({ date, time, place: SEOUL, sex });
const CASES: Array<[string, string | null, BirthInput['sex']]> = [
  ['1998-03-21', '09:30', 'female'],
  ['1985-11-02', '22:10', 'male'],
  ['2003-07-15', null, 'female'],
  ['1971-01-30', '05:45', 'male'],
  ['1992-12-31', '23:50', 'female'],
  ['1960-05-05', '12:00', 'male'],
  ['2010-02-04', '00:10', 'female'],
];

describe('risingPreview (블러 미리보기 전용 곡선)', () => {
  for (const [date, time, sex] of CASES) {
    const flow = fateMapOf(computeChart(input(date, time, sex)), NOW).flow;

    it(`${date} ${time ?? '-'}: 끝이 시작보다 높고 전체적으로 오른다`, () => {
      expect(flow).not.toBeNull();
      const p = risingPreview(flow!).points;
      const s = p.map((x) => x.score);
      expect(s[s.length - 1]).toBeGreaterThan(s[0] + 30);

      const seen = Math.max(2, p.filter((x) => (x.startAge + x.endAge + 1) / 2 <= flow!.age).length);
      const v = s.slice(0, seen);
      expect(v[v.length - 1]).toBeGreaterThan(v[0] + 30);
      const half = Math.floor(v.length / 2);
      const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
      if (v.length >= 4) expect(avg(v.slice(half))).toBeGreaterThan(avg(v.slice(0, half)) + 10);
      for (let i = 1; i < s.length; i += 1) expect(s[i - 1] - s[i]).toBeLessThanOrEqual(5);
      for (const v of s) {
        expect(v).toBeGreaterThanOrEqual(8);
        expect(v).toBeLessThanOrEqual(94);
      }
    });

    it(`${date} ${time ?? '-'}: 같은 입력이면 같은 곡선이고 나이·지금 자리는 그대로, 진짜 값은 바뀌지 않는다`, () => {
      const before = JSON.stringify(flow);
      const a = risingPreview(flow!);
      const b = risingPreview(flow!);
      expect(a).toEqual(b);
      expect(JSON.stringify(flow)).toBe(before);
      expect(a.points.map((x) => [x.startAge, x.endAge, x.current])).toEqual(flow!.points.map((x) => [x.startAge, x.endAge, x.current]));
      expect(a.age).toBe(flow!.age);
    });
  }

  it('진짜 곡선이 하향이어도 미리보기는 오른다', () => {
    const flow = fateMapOf(computeChart(input('1998-03-21', '09:30', 'female')), NOW).flow!;
    const falling = { ...flow, points: flow.points.map((p, i, all) => ({ ...p, score: 90 - (i * 70) / (all.length - 1) })) };
    const s = risingPreview(falling).points.map((x) => x.score);
    expect(s[s.length - 1]).toBeGreaterThan(s[0]);
  });
});

describe('FlowChart 잠긴 미리보기는 지금 나이까지만 그린다', () => {
  const flow = fateMapOf(computeChart(input('1998-03-21', '09:30', 'female')), NOW).flow!;
  const dots = (html: string) => [...html.matchAll(/<circle[^>]*cx="([\d.]+)"/g)].map((m) => Number(m[1]));

  const xAt = (age: number) => 14 + (age < 60 ? age / 80 : 0.75 + (Math.min(age, 100) - 60) / 160) * 292;

  it('잠긴 그림은 지금 나이 뒤를 잘라 내고 그 뒤의 점도 그리지 않는다', () => {
    const html = renderToStaticMarkup(createElement(FlowChart, { flow, locked: true }));
    expect(html).toContain('clip-path="url(#c');
    const xs = dots(html);
    expect(xs.length).toBeGreaterThan(0);
    expect(xs.length).toBeLessThan(flow.points.length);
    for (const x of xs) expect(x).toBeLessThanOrEqual(xAt(flow.age) + 0.01);
    const rect = html.match(/<clipPath[^>]*><rect[^>]*width="([\d.]+)"/);
    expect(Number(rect![1])).toBeCloseTo(xAt(flow.age), 0);
  });

  it('결제 뒤 카드(잠기지 않은 그림)는 자르지 않는다', () => {
    const html = renderToStaticMarkup(createElement(FlowChart, { flow, locked: false }));
    expect(html).not.toContain('clip-path');
    expect(dots(html)).toHaveLength(flow.points.length);
  });
});
