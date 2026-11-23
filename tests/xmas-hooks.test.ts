import { describe, expect, it } from 'vitest';
import { computeChart } from '../src/lib/saju/engine';
import { tenGod } from '../src/lib/saju/details';
import { Solar } from 'lunar-javascript';
import { pastMonths, rivalDays } from '../src/lib/xmas/hooks';

const chart = computeChart({ date: '1997-09-12', time: '14:30', place: { name: 'Seoul', country: 'KR', lat: 37.56, lng: 126.97, tz: 'Asia/Seoul' }, sex: 'female' });
const NOW = '2026-11-16T03:00:00.000Z';

describe('지난해 맞히기', () => {
  it('올해 지나간 달에서만, 많아야 셋, 달 순서', () => {
    const got = pastMonths(chart, NOW);
    expect(got.length).toBeGreaterThan(0);
    expect(got.length).toBeLessThanOrEqual(3);
    expect(got.every((m) => m.year === 2026 && m.month < 11)).toBe(true);
    expect(got.map((m) => m.month)).toEqual([...got.map((m) => m.month)].sort((a, b) => a - b));
  });
  it('같은 갈래(같은 문장)는 한 번만, 보이는 달은 하나', () => {
    const got = pastMonths(chart, NOW);
    expect(new Set(got.map((m) => m.tone)).size).toBe(got.length);
    expect(got.filter((m) => m.lead)).toHaveLength(1);
  });
  it('같은 입력이면 같은 달', () => {
    expect(pastMonths(chart, NOW)).toEqual(pastMonths(chart, NOW));
  });
  it('1월에는 지난해 열두 달에서 고른다', () => {
    expect(pastMonths(chart, '2027-01-10T00:00:00.000Z').every((m) => m.year === 2026)).toBe(true);
  });
});

describe('연적이 끼어드는 날', () => {
  it('오늘부터 이브까지, 그날 천간이 겁재인 날만', () => {
    const days = rivalDays(chart, NOW);
    expect(days.length).toBeGreaterThan(0);
    for (const d of days) {
      expect(d >= '2026-11-16' && d <= '2026-12-24').toBe(true);
      const [y, m, dd] = d.split('-').map(Number);
      expect(tenGod(chart.dayMaster.stem, Solar.fromYmd(y, m, dd).getLunar().getDayInGanZhi().slice(0, 1) as never)).toBe('劫財');
    }
  });
});

