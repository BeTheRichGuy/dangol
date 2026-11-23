import { describe, expect, it } from 'vitest';
import { computeChart } from '@/lib/saju';
import { deviceStandardOffsetMinutes, isUnknownPlace, unknownPlace } from '@/lib/places/unknown-place';

describe('도시를 적지 않은 출생지', () => {
  it('기기 표준시를 한 시간 단위 고정 시간대로 바꾼다(Etc/GMT 는 부호가 거꾸로다)', () => {
    expect(unknownPlace(540)).toMatchObject({ tz: 'Etc/GMT-9', lng: 135, name: '', label: '' });
    expect(unknownPlace(-300)).toMatchObject({ tz: 'Etc/GMT+5', lng: -75 });
    expect(unknownPlace(0)).toMatchObject({ tz: 'Etc/GMT', lng: 0 });

    expect(unknownPlace(330).tz).toBe('Etc/GMT-6');
    expect(unknownPlace(900).tz).toBe('Etc/GMT-14');
    expect(unknownPlace(-900).tz).toBe('Etc/GMT+12');
  });

  it('isUnknownPlace 는 이름이 빈 자리만 가려낸다', () => {
    expect(isUnknownPlace(unknownPlace(540))).toBe(true);
    expect(isUnknownPlace({ name: 'Seoul' })).toBe(false);
    expect(isUnknownPlace(null)).toBe(false);
  });

  it('엔진이 이 자리로 계산하면 태양시 보정이 0분이라 적은 시각이 그대로 쓰인다', () => {
    for (const offset of [540, 0, -300, -480, 60, 330]) {
      const chart = computeChart({ date: '1998-03-21', time: '08:30', place: unknownPlace(offset), sex: null });
      expect(chart.meta.offsetMinutes).toBe(0);
      expect(chart.meta.solarLocal).toBe('1998-03-21 08:30');
    }
  });

  it('시간도 비우면 세 기둥이고 날짜는 그대로다', () => {
    const chart = computeChart({ date: '1998-03-21', time: null, place: unknownPlace(540), sex: null });
    expect(chart.flags.timeUnknown).toBe(true);
    expect(chart.pillars.hour).toBeNull();
    expect(chart.meta.solarLocal.slice(0, 10)).toBe('1998-03-21');
  });

  it('서울로 계산한 일주와 같은 날이면 같다(정오 기준)', () => {
    const seoul = computeChart({
      date: '1998-03-21',
      time: null,
      place: { name: 'Seoul', country: 'KR', lat: 37.5, lng: 126.98, tz: 'Asia/Seoul' },
      sex: null,
    });
    const blank = computeChart({ date: '1998-03-21', time: null, place: unknownPlace(540), sex: null });
    expect(blank.pillars.day.ganzhi).toBe(seoul.pillars.day.ganzhi);
  });

  it('기기 표준시는 정수 분이고 서머타임이 있는 해에도 겨울 값을 준다', () => {
    const v = deviceStandardOffsetMinutes(new Date('2026-07-01T00:00:00Z'));
    expect(Number.isInteger(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(-720);
    expect(v).toBeLessThanOrEqual(840);
  });
});
