import { describe, expect, it, vi } from 'vitest';
import { Solar } from 'lunar-javascript';
import { computeChart, currentSeason } from '@/lib/saju';
import type { BirthInput, Chart } from '@/lib/saju';
import { eightCharOf } from '@/lib/saju/calendar';
import { equationOfTimeMinutes } from '@/lib/saju/solar-time';
import { BRANCHES, STEMS } from '@/lib/saju/tables';

const SEOUL = { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' };
const LOS_ANGELES = {
  name: 'Los Angeles', country: 'US', lat: 34.0522, lng: -118.2437, tz: 'America/Los_Angeles',
};
const NEW_YORK = { name: 'New York', country: 'US', lat: 40.7128, lng: -74.006, tz: 'America/New_York' };
const LONDON = { name: 'London', country: 'GB', lat: 51.5074, lng: -0.1278, tz: 'Europe/London' };
const SYDNEY = { name: 'Sydney', country: 'AU', lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney' };
const TOKYO = { name: 'Tokyo', country: 'JP', lat: 35.6762, lng: 139.6503, tz: 'Asia/Tokyo' };
const NUKUALOFA = { name: 'Nuku’alofa', country: 'TO', lat: -21.139, lng: -175.2, tz: 'Pacific/Tongatapu' };
const KIRITIMATI = { name: 'Kiritimati', country: 'KI', lat: 1.87, lng: -157.4, tz: 'Pacific/Kiritimati' };
const APIA = { name: 'Apia', country: 'WS', lat: -13.83, lng: -171.75, tz: 'Pacific/Apia' };

function birth(
  date: string,
  time: string | null,
  place = SEOUL,
  sex: BirthInput['sex'] = null,
): BirthInput {
  return { date, time, place, sex };
}

function ganzhis(chart: Chart): string[] {
  const { year, month, day, hour } = chart.pillars;
  return [year.ganzhi, month.ganzhi, day.ganzhi, hour ? hour.ganzhi : '-'];
}

function julianDayNumber(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return (
    d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) +
    Math.floor(y2 / 400) - 32045
  );
}
function dayIndexOf(y: number, m: number, d: number): number {
  return (julianDayNumber(y, m, d) + 49) % 60;
}
function ganzhiOfIndex(i: number): string {
  return STEMS[i % 10] + BRANCHES[i % 12];
}

describe('SPEC 8장 엔진 기준', () => {
  it('(1) 2001-02-04 04:10 서울 -> 辛巳 庚寅 戊戌 甲寅, 일간 mountain', () => {
    const chart = computeChart(birth('2001-02-04', '04:10'));
    expect(ganzhis(chart)).toEqual(['辛巳', '庚寅', '戊戌', '甲寅']);
    expect(chart.dayMaster).toEqual({
      stem: '戊', element: 'earth', polarity: 'yang', type: 'mountain',
    });
    expect(chart.pillars.year.romanized).toBe('sin-sa');
    expect(chart.pillars.day.romanized).toBe('mu-sul');
    expect(chart.elements).toEqual({ wood: 3, fire: 1, earth: 2, metal: 2, water: 0 });
    expect(chart.stemGods).toEqual({ year: 'output', month: 'output', hour: 'power' });

    expect(chart.meta.solarLocal).toBe('2001-02-04 03:38');
    expect(chart.meta.offsetMinutes).toBe(-32);
    expect(chart.meta.utc).toBe('2001-02-03T19:10:00.000Z');
  });

  it('(2) 같은 순간을 다른 시간대로 넣어도 연주·월주가 같다', () => {

    const same = [
      birth('2001-02-04', '04:10', SEOUL),
      birth('2001-02-03', '11:10', LOS_ANGELES),
      birth('2001-02-03', '14:10', NEW_YORK),
      birth('2001-02-03', '19:10', LONDON),
    ].map((b) => computeChart(b));
    for (const chart of same) {
      expect(chart.meta.utc).toBe('2001-02-03T19:10:00.000Z');
      expect(chart.pillars.year.ganzhi).toBe('辛巳');
      expect(chart.pillars.month.ganzhi).toBe('庚寅');
    }
  });

  it('(3) 입춘 직전 출생은 전년 연주, 직후는 새해 연주', () => {

    const before = computeChart(birth('2001-02-04', '03:20'));
    expect(before.pillars.year.ganzhi).toBe('庚辰');
    expect(before.pillars.month.ganzhi).toBe('己丑');
    const after = computeChart(birth('2001-02-04', '03:40'));
    expect(after.pillars.year.ganzhi).toBe('辛巳');
    expect(after.pillars.month.ganzhi).toBe('庚寅');

    expect(computeChart(birth('2001-02-03', '10:20', LOS_ANGELES)).pillars.year.ganzhi).toBe('庚辰');

    expect(computeChart(birth('2026-02-04', '04:50')).pillars.year.ganzhi).toBe('乙巳');
    expect(computeChart(birth('2026-02-04', '05:10')).pillars.year.ganzhi).toBe('丙午');
  });

  it('(4) 현지 평균태양시 23:30 출생 -> ziHourAmbiguous', () => {

    const chart = computeChart(birth('1990-05-15', '00:02'));
    expect(chart.meta.solarLocal).toBe('1990-05-14 23:30');
    expect(chart.flags.ziHourAmbiguous).toBe(true);
    expect(chart.flags.altType).not.toBeNull();
    expect(chart.flags.altType).not.toBe(chart.dayMaster.type);

    const other = computeChart(birth('1990-05-15', '00:02'), { ziSect: 1 });
    expect(other.dayMaster.type).toBe(chart.flags.altType);
    expect(other.flags.altType).toBe(chart.dayMaster.type);

    const noon = computeChart(birth('1990-05-15', '12:00'));
    expect(noon.flags.ziHourAmbiguous).toBe(false);
    expect(noon.flags.altType).toBeNull();
  });

  it('(4-b) 보정 후 00:00~00:59는 자시 플래그만 켜지고 학파 간 일간 차이는 없다', () => {

    const chart = computeChart(birth('1990-05-15', '00:02'), { solarTime: 'standard' });
    expect(chart.meta.solarLocal).toBe('1990-05-15 00:02');
    expect(chart.flags.ziHourAmbiguous).toBe(true);
    expect(chart.flags.altType).toBeNull();
  });

  it('(5) 시간 모름 -> hour null, 여섯 글자', () => {
    const chart = computeChart(birth('1990-05-15', null));
    expect(chart.pillars.hour).toBeNull();
    expect(chart.stemGods.hour).toBeNull();
    expect(chart.flags.timeUnknown).toBe(true);
    expect(chart.flags.ziHourAmbiguous).toBe(false);
    const total = Object.values(chart.elements).reduce((a, b) => a + b, 0);
    expect(total).toBe(6);

    const known = computeChart(birth('1990-05-15', '10:00'));
    expect(Object.values(known.elements).reduce((a, b) => a + b, 0)).toBe(8);
    expect(known.pillars.hour).not.toBeNull();

    expect(chart.pillars.day.ganzhi).toBe(known.pillars.day.ganzhi);
  });

  it('(6) 미국 7월 출생은 서머타임(UTC-7) 반영', () => {
    const la = computeChart(birth('1995-07-15', '10:00', LOS_ANGELES));
    expect(la.meta.utc).toBe('1995-07-15T17:00:00.000Z');
    const ny = computeChart(birth('1995-07-15', '10:00', NEW_YORK));
    expect(ny.meta.utc).toBe('1995-07-15T14:00:00.000Z');

    const winter = computeChart(birth('1995-01-15', '10:00', LOS_ANGELES));
    expect(winter.meta.utc).toBe('1995-01-15T18:00:00.000Z');

    expect(la.meta.offsetMinutes).toBe(-53);
    expect(winter.meta.offsetMinutes).toBe(7);
    expect(la.meta.solarLocal).toBe('1995-07-15 09:07');
  });

  it('(6-b) 서머타임이 겹치거나 없는 시각도 보는 때와 상관없이 같은 결과', () => {
    const place = LOS_ANGELES;
    const run = () => [
      computeChart(birth('2023-11-05', '01:30', place)).meta.utc,
      computeChart(birth('2023-03-12', '02:30', place)).meta.utc,
    ];
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const winter = run();
      vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));
      const summer = run();
      expect(summer).toEqual(winter);

      expect(winter).toEqual(['2023-11-05T08:30:00.000Z', '2023-03-12T10:30:00.000Z']);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('알려진 명식', () => {
  it('2000-01-01 12:00 런던 -> 己卯 丙子 戊午 戊午', () => {
    const chart = computeChart(birth('2000-01-01', '12:00', LONDON));
    expect(ganzhis(chart)).toEqual(['己卯', '丙子', '戊午', '戊午']);
  });

  it('1990-05-15 10:00 서울 -> 庚午年 辛巳月', () => {
    const chart = computeChart(birth('1990-05-15', '10:00'));
    expect(chart.pillars.year.ganzhi).toBe('庚午');
    expect(chart.pillars.month.ganzhi).toBe('辛巳');
    expect(chart.pillars.day.ganzhi).toBe(ganzhiOfIndex(dayIndexOf(1990, 5, 15)));
  });

  it('1984-02-02는 癸亥年 乙丑月, 1984-02-05는 甲子年 丙寅月', () => {
    const before = computeChart(birth('1984-02-02', '12:00'));
    expect([before.pillars.year.ganzhi, before.pillars.month.ganzhi]).toEqual(['癸亥', '乙丑']);
    const after = computeChart(birth('1984-02-05', '12:00'));
    expect([after.pillars.year.ganzhi, after.pillars.month.ganzhi]).toEqual(['甲子', '丙寅']);
  });
});

describe('태양시 보정', () => {
  it('서울 1990-05-15 10:00: standard와 mean의 offsetMinutes 차이는 약 32분', () => {
    const standard = computeChart(birth('1990-05-15', '10:00'), { solarTime: 'standard' });
    const mean = computeChart(birth('1990-05-15', '10:00'), { solarTime: 'mean' });
    expect(standard.meta.offsetMinutes).toBe(0);
    expect(mean.meta.offsetMinutes).toBe(-32);
    expect(standard.meta.offsetMinutes - mean.meta.offsetMinutes).toBe(32);
    expect(standard.meta.solarLocal).toBe('1990-05-15 10:00');
    expect(mean.meta.solarLocal).toBe('1990-05-15 09:28');
    expect(standard.meta.solarTime).toBe('standard');
    expect(mean.meta.solarTime).toBe('mean');
  });

  it('apparent는 mean에 균시차를 더한다 (5월 중순 약 +4분)', () => {
    const mean = computeChart(birth('1990-05-15', '10:00'), { solarTime: 'mean' });
    const apparent = computeChart(birth('1990-05-15', '10:00'), { solarTime: 'apparent' });
    const diff = apparent.meta.offsetMinutes - mean.meta.offsetMinutes;
    expect(diff).toBeGreaterThanOrEqual(3);
    expect(diff).toBeLessThanOrEqual(5);
  });

  it('기본값은 mean, ziSect 2', () => {
    const chart = computeChart(birth('1990-05-15', '10:00'));
    expect(chart.meta.solarTime).toBe('mean');
    expect(chart.meta.ziSect).toBe(2);
  });

  it('균시차 근사식이 알려진 값 근처다', () => {
    const at = (iso: string) => equationOfTimeMinutes(new Date(iso).getTime());
    expect(at('2026-11-03T12:00:00Z')).toBeGreaterThan(15);
    expect(at('2026-11-03T12:00:00Z')).toBeLessThan(17.5);
    expect(at('2026-02-11T12:00:00Z')).toBeLessThan(-13);
    expect(at('2026-02-11T12:00:00Z')).toBeGreaterThan(-15.5);
    expect(Math.abs(at('2026-04-15T12:00:00Z'))).toBeLessThan(1.5);
    expect(Math.abs(at('2026-09-01T12:00:00Z'))).toBeLessThan(1.5);
  });
});

describe('남반구', () => {
  it('시드니 1990-12-25 10:00 (서머타임 UTC+11)', () => {
    const chart = computeChart(birth('1990-12-25', '10:00', SYDNEY));
    expect(chart.meta.utc).toBe('1990-12-24T23:00:00.000Z');

    expect(chart.meta.offsetMinutes).toBe(-55);
    expect(chart.meta.solarLocal).toBe('1990-12-25 09:05');
    expect(chart.pillars.year.ganzhi).toBe('庚午');
    expect(chart.pillars.month.ganzhi).toBe('戊子');
    expect(chart.pillars.day.ganzhi).toBe(ganzhiOfIndex(dayIndexOf(1990, 12, 25)));

    expect(chart.pillars.hour?.branch).toBe('巳');
  });
});

describe('일주·시주를 율리우스 일수 공식과 대조', () => {
  const places = { Seoul: SEOUL, 'Los Angeles': LOS_ANGELES, 'New York': NEW_YORK, London: LONDON, Sydney: SYDNEY };
  const cases: Array<[string, string, keyof typeof places]> = [
    ['1975-03-08', '06:45', 'Seoul'],
    ['1982-11-30', '23:40', 'Seoul'],
    ['1988-02-29', '00:15', 'Seoul'],
    ['1991-09-09', '13:05', 'Los Angeles'],
    ['1996-12-31', '23:55', 'New York'],
    ['2003-06-21', '03:30', 'London'],
    ['2010-01-01', '00:30', 'Sydney'],
    ['2024-02-29', '18:20', 'Seoul'],
    ['2026-10-15', '21:59', 'Los Angeles'],
    ['2005-07-04', '22:59', 'New York'],
    ['2005-07-04', '23:00', 'London'],
  ];

  it.each(cases)('%s %s %s', (date, time, placeName) => {
    const chart = computeChart(birth(date, time, places[placeName]));
    const [y, m, d] = chart.meta.solarLocal.slice(0, 10).split('-').map(Number);
    const hour = Number(chart.meta.solarLocal.slice(11, 13));

    const dayIdx = dayIndexOf(y, m, d);
    expect(chart.pillars.day.ganzhi).toBe(ganzhiOfIndex(dayIdx));

    const branchIdx = Math.floor((hour + 1) / 2) % 12;
    const stemSourceIdx = hour === 23 ? (dayIdx + 1) % 60 : dayIdx;
    const stemIdx = ((stemSourceIdx % 10) % 5 * 2 + branchIdx) % 10;
    expect(chart.pillars.hour?.ganzhi).toBe(STEMS[stemIdx] + BRANCHES[branchIdx]);
  });

  it('ziSect 1은 23시부터 다음 날 일주', () => {
    const chart = computeChart(birth('1996-12-31', '23:55', NEW_YORK), { ziSect: 1 });
    const [y, m, d] = chart.meta.solarLocal.slice(0, 10).split('-').map(Number);
    expect(chart.meta.solarLocal.slice(11, 13)).toBe('23');
    expect(chart.pillars.day.ganzhi).toBe(ganzhiOfIndex((dayIndexOf(y, m, d) + 1) % 60));
  });
});

describe('시간 모름과 절기 경계', () => {
  it('입춘 당일 시간 모름 -> nearJieqiBoundary', () => {
    const chart = computeChart(birth('2001-02-04', null));
    expect(chart.flags.nearJieqiBoundary).toBe(true);

    expect(chart.pillars.year.ganzhi).toBe('辛巳');
  });

  it('절기와 먼 날은 false, 시간을 알면 항상 false', () => {
    expect(computeChart(birth('2001-02-10', null)).flags.nearJieqiBoundary).toBe(false);
    expect(computeChart(birth('2001-02-04', '03:40')).flags.nearJieqiBoundary).toBe(false);
  });

  it('로스앤젤레스 날짜 기준으로 판단한다', () => {

    expect(computeChart(birth('2001-02-03', null, LOS_ANGELES)).flags.nearJieqiBoundary).toBe(true);
    expect(computeChart(birth('2001-02-04', null, LOS_ANGELES)).flags.nearJieqiBoundary).toBe(false);
  });
});

describe('대운', () => {
  it('성별을 고르지 않으면 null', () => {
    expect(computeChart(birth('2001-02-04', '04:10')).daYun).toBeNull();
  });

  it('음년 여자는 순행, 8개 목록', () => {
    const chart = computeChart(birth('2001-02-04', '04:10', SEOUL, 'female'));
    expect(chart.daYun?.forward).toBe(true);
    expect(chart.daYun?.startAge).toBe(9);
    expect(chart.daYun?.list).toHaveLength(8);
    expect(chart.daYun?.list.map((c) => c.ganzhi).slice(0, 3)).toEqual(['辛卯', '壬辰', '癸巳']);
    expect(chart.daYun?.list[0]).toEqual({ startAge: 9, startYear: 2010, ganzhi: '辛卯' });
    expect(chart.daYun?.list[1].startAge).toBe(19);
  });

  it('음년 남자는 역행', () => {
    const chart = computeChart(birth('2001-02-04', '04:10', SEOUL, 'male'));
    expect(chart.daYun?.forward).toBe(false);
    expect(chart.daYun?.list[0].ganzhi).toBe('己丑');
    expect(chart.daYun?.list[1].ganzhi).toBe('戊子');
    expect(chart.daYun?.list).toHaveLength(8);
  });
});

describe('순수성과 입력 검증', () => {
  it('같은 입력이면 같은 결과, 입력을 바꾸지 않는다', () => {
    const input = birth('1990-05-15', '10:00', SEOUL, 'female');
    const frozen = JSON.stringify(input);
    Object.freeze(input);
    Object.freeze(input.place);
    const a = computeChart(input);
    const b = computeChart(input);
    expect(a).toEqual(b);
    expect(JSON.stringify(input)).toBe(frozen);
    expect(a.input).not.toBe(input);
    expect(a.input).toEqual(input);
  });

  it('지금 시각에 영향을 받지 않는다', () => {
    const input = birth('1990-05-15', '10:00', SEOUL, 'male');
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2001-01-01T00:00:00Z'));
      const a = computeChart(input);
      const s1 = currentSeason('2026-10-15T00:00:00Z');
      vi.setSystemTime(new Date('2035-07-07T07:07:07Z'));
      expect(computeChart(input)).toEqual(a);
      expect(currentSeason('2026-10-15T00:00:00Z')).toEqual(s1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('잘못된 입력은 RangeError', () => {
    expect(() => computeChart(birth('2001-02-30', '10:00'))).toThrow(RangeError);
    expect(() => computeChart(birth('2001-13-01', '10:00'))).toThrow(RangeError);
    expect(() => computeChart(birth('01-02-03', '10:00'))).toThrow(RangeError);
    expect(() => computeChart(birth('2001-02-04', '25:00'))).toThrow(RangeError);
    expect(() => computeChart(birth('2001-02-04', '10:60'))).toThrow(RangeError);
    expect(() => computeChart(birth('2001-02-04', '10:00', { ...SEOUL, tz: 'Mars/Olympus' }))).toThrow(
      RangeError,
    );
  });
});

describe('currentSeason', () => {
  it('2026-10-15 -> 寒露 구간, 월주 戊戌, 연주 丙午', () => {
    const season = currentSeason('2026-10-15T00:00:00Z');
    expect(season.name).toBe('Cold Dew');
    expect(season.hanzi).toBe('寒露');
    expect(season.monthGanzhi).toBe('戊戌');
    expect(season.yearGanzhi).toBe('丙午');
    expect(season.start.startsWith('2026-10-08')).toBe(true);
    expect(season.end.startsWith('2026-11-07')).toBe(true);
  });

  it('입춘 순간에 연주와 구간이 바뀐다', () => {

    const before = currentSeason('2026-02-03T20:02:07Z');
    expect(before.name).toBe('Minor Cold');
    expect(before.hanzi).toBe('小寒');
    expect(before.yearGanzhi).toBe('乙巳');
    expect(before.monthGanzhi).toBe('己丑');
    const after = currentSeason('2026-02-03T20:02:08Z');
    expect(after.name).toBe('Start of Spring');
    expect(after.hanzi).toBe('立春');
    expect(after.yearGanzhi).toBe('丙午');
    expect(after.monthGanzhi).toBe('庚寅');
  });

  it('열두 절이 입춘부터 영어 이름표대로 이어지고 구간이 끊김 없이 붙는다', () => {
    const expected: Array<[string, string]> = [
      ['立春', 'Start of Spring'],
      ['驚蟄', 'Awakening of Insects'],
      ['清明', 'Clear and Bright'],
      ['立夏', 'Start of Summer'],
      ['芒種', 'Grain in Ear'],
      ['小暑', 'Minor Heat'],
      ['立秋', 'Start of Autumn'],
      ['白露', 'White Dew'],
      ['寒露', 'Cold Dew'],
      ['立冬', 'Start of Winter'],
      ['大雪', 'Major Snow'],
      ['小寒', 'Minor Cold'],
    ];

    const months = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    months.forEach((m, i) => {
      const year = m > 12 ? 2027 : 2026;
      const month = m > 12 ? m - 12 : m;
      const iso = `${year}-${String(month).padStart(2, '0')}-20T00:00:00Z`;
      const season = currentSeason(iso);
      expect([season.hanzi, season.name]).toEqual(expected[i]);
      const now = new Date(iso).getTime();
      expect(new Date(season.start).getTime()).toBeLessThanOrEqual(now);
      expect(new Date(season.end).getTime()).toBeGreaterThan(now);

      expect(currentSeason(season.end).start).toBe(season.end);
    });
  });

  it('잘못된 시각 문자열은 RangeError', () => {
    expect(() => currentSeason('not a date')).toThrow(RangeError);
  });
});

describe('날짜변경선 너머 시간대 (경도 보정이 하루를 넘기지 않는다)', () => {
  it('통가 2000-06-15 12:00: 보정은 -41분이고 일주는 그날 그대로', () => {
    const chart = computeChart(birth('2000-06-15', '12:00', NUKUALOFA));

    expect(chart.meta.offsetMinutes).toBe(-41);
    expect(chart.meta.solarLocal).toBe('2000-06-15 11:19');
    expect(chart.pillars.day.ganzhi).toBe('甲辰');
    expect(chart.pillars.day.ganzhi).toBe(ganzhiOfIndex(dayIndexOf(2000, 6, 15)));
    expect(chart.flags.ziHourAmbiguous).toBe(false);
  });

  it('키리바시와 사모아(2012년 이후)도 달력 날짜를 유지한다', () => {
    const kiritimati = computeChart(birth('2000-06-15', '12:00', KIRITIMATI));
    expect(kiritimati.meta.offsetMinutes).toBe(-30);
    expect(kiritimati.meta.solarLocal).toBe('2000-06-15 11:30');
    const apia = computeChart(birth('2015-06-15', '12:00', APIA));
    expect(apia.meta.offsetMinutes).toBe(-27);
    expect(apia.meta.solarLocal).toBe('2015-06-15 11:33');
    expect(apia.pillars.day.ganzhi).toBe(ganzhiOfIndex(dayIndexOf(2015, 6, 15)));
  });

  it('어느 도시든 offsetMinutes가 -720 이상 720 미만이고 날짜가 입력 그대로다', () => {
    const places = [
      SEOUL, LOS_ANGELES, NEW_YORK, LONDON, SYDNEY, TOKYO, NUKUALOFA, KIRITIMATI, APIA,
      { name: 'Honolulu', country: 'US', lat: 21.31, lng: -157.86, tz: 'Pacific/Honolulu' },
      { name: 'Auckland', country: 'NZ', lat: -36.85, lng: 174.76, tz: 'Pacific/Auckland' },
      { name: 'Chatham', country: 'NZ', lat: -43.95, lng: -176.55, tz: 'Pacific/Chatham' },
      { name: 'Pago Pago', country: 'AS', lat: -14.28, lng: -170.7, tz: 'Pacific/Pago_Pago' },
      { name: 'Kathmandu', country: 'NP', lat: 27.7, lng: 85.32, tz: 'Asia/Kathmandu' },
      { name: 'Urumqi', country: 'CN', lat: 43.8, lng: 87.6, tz: 'Asia/Shanghai' },
    ];
    for (const place of places) {
      for (const date of ['2000-01-15', '2000-06-15', '2015-06-15']) {
        const chart = computeChart(birth(date, '12:00', place));
        expect(chart.meta.offsetMinutes).toBeGreaterThanOrEqual(-720);
        expect(chart.meta.offsetMinutes).toBeLessThan(720);
        expect(chart.meta.solarLocal.slice(0, 10)).toBe(date);
        const apparent = computeChart(birth(date, '12:00', place), { solarTime: 'apparent' });
        expect(Math.abs(apparent.meta.offsetMinutes)).toBeLessThanOrEqual(720);
      }
    }
  });
});

describe('서머타임과 과거 표준시 회귀', () => {
  it('1987-07-15 10:00 서울(한국 서머타임): 평균태양시 08:28', () => {
    const chart = computeChart(birth('1987-07-15', '10:00'));
    expect(chart.meta.utc).toBe('1987-07-15T00:00:00.000Z');
    expect(chart.meta.offsetMinutes).toBe(-92);
    expect(chart.meta.solarLocal).toBe('1987-07-15 08:28');
    expect(ganzhis(chart)).toEqual(['丁卯', '丁未', '乙丑', '庚辰']);
  });

  it('1987-07-15 00:20 서울: 서머타임을 걷으면 전날 22:48이라 일주 甲子, 자시 애매 아님', () => {
    const chart = computeChart(birth('1987-07-15', '00:20'));
    expect(chart.meta.solarLocal).toBe('1987-07-14 22:48');
    expect(chart.pillars.day.ganzhi).toBe('甲子');
    expect(chart.pillars.hour?.ganzhi).toBe('乙亥');
    expect(chart.flags.ziHourAmbiguous).toBe(false);
    expect(chart.flags.altType).toBeNull();
  });

  it("'standard'는 서머타임을 걷지 않는 벽시계 그대로다 (SPEC 3.3 해석을 고정)", () => {
    const standard = computeChart(birth('1987-07-15', '00:20'), { solarTime: 'standard' });
    expect(standard.meta.offsetMinutes).toBe(0);
    expect(standard.meta.solarLocal).toBe('1987-07-15 00:20');
    expect(standard.pillars.day.ganzhi).toBe('乙丑');
    expect(standard.pillars.hour?.ganzhi).toBe('丙子');
    expect(standard.flags.ziHourAmbiguous).toBe(true);

    const mean = computeChart(birth('1987-07-15', '00:20'));
    expect(mean.pillars.day.ganzhi).not.toBe(standard.pillars.day.ganzhi);
  });

  it('1958-07-01 12:00 서울(+9:30 서머타임 시기)', () => {
    const chart = computeChart(birth('1958-07-01', '12:00'));
    expect(chart.meta.utc).toBe('1958-07-01T02:30:00.000Z');
    expect(chart.meta.offsetMinutes).toBe(-62);
  });

  it('서머타임이 풀리며 겹치는 시각은 먼저 오는 쪽으로 해석한다 (서울, 시드니)', () => {

    expect(computeChart(birth('1987-10-11', '02:30')).meta.utc).toBe('1987-10-10T16:30:00.000Z');

    expect(computeChart(birth('2023-04-02', '02:30', SYDNEY)).meta.utc).toBe('2023-04-01T15:30:00.000Z');
  });
});

describe('절기 시각 외부 기준', () => {

  const published: Array<[number, string]> = [
    [2022, '2022-02-04T05:51:00+09:00'],
    [2023, '2023-02-04T11:42:00+09:00'],
    [2024, '2024-02-04T17:27:00+09:00'],
    [2025, '2025-02-03T23:10:00+09:00'],
    [2026, '2026-02-04T05:02:00+09:00'],
  ];

  it.each(published)('%s 입춘이 공표 시각과 2분 안으로 맞는다', (year, iso) => {
    const start = new Date(currentSeason(`${year}-02-10T00:00:00Z`).start).getTime();
    expect(Math.abs(start - new Date(iso).getTime())).toBeLessThanOrEqual(2 * 60_000);
  });

  it('도쿄 2026-10-08: 寒露(15:29 JST) 앞뒤로 월주가 丁酉에서 戊戌로 바뀐다', () => {
    expect(computeChart(birth('2026-10-08', '14:29', TOKYO)).pillars.month.ganzhi).toBe('丁酉');
    expect(computeChart(birth('2026-10-08', '16:30', TOKYO)).pillars.month.ganzhi).toBe('戊戌');
  });
});

describe('대운 시작 나이는 분 단위로 계산한다', () => {
  it('시진 단위 근사가 1년 어긋나던 두 사례', () => {

    const a = computeChart(birth('2006-10-17', '10:04', LONDON, 'female'));
    expect(a.daYun?.startAge).toBe(2);
    expect(a.daYun?.list[0].startAge).toBe(2);
    const b = computeChart(birth('1962-12-13', '02:34', LONDON, 'male'));
    expect(b.daYun?.startAge).toBe(7);

    expect(computeChart(birth('2001-02-04', '04:10', SEOUL, 'female')).daYun?.startAge).toBe(9);
  });

  it('무작위 출생 300건이 절까지의 분 / 4320의 내림과 같고, 방향은 음양·성별 규칙을 따른다', () => {

    let seed = 20261015;
    const rand = (n: number) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed % n;
    };
    const places = [SEOUL, LOS_ANGELES, NEW_YORK, LONDON, SYDNEY, TOKYO];
    for (let i = 0; i < 300; i += 1) {
      const date = new Date(Date.UTC(1950 + rand(70), rand(12), 1 + rand(28))).toISOString().slice(0, 10);
      const time = `${String(rand(24)).padStart(2, '0')}:${String(rand(60)).padStart(2, '0')}`;
      const sex = rand(2) === 0 ? 'female' : 'male';
      const chart = computeChart(birth(date, time, places[rand(places.length)], sex));
      const yun = chart.daYun;
      expect(yun).not.toBeNull();

      const season = currentSeason(chart.meta.utc);
      const birthMs = new Date(chart.meta.utc).getTime();
      const forward = (STEMS.indexOf(chart.pillars.year.stem) % 2 === 0) === (sex === 'male');
      const minutes = forward
        ? (new Date(season.end).getTime() - birthMs) / 60_000
        : (birthMs - new Date(season.start).getTime()) / 60_000;
      expect(yun?.forward).toBe(forward);
      expect(yun?.startAge).toBe(Math.floor(minutes / 4320));
      expect(yun?.list).toHaveLength(8);
      expect(yun?.list[1].startAge).toBe((yun?.startAge ?? 0) + 10);
    }
  });
});

describe('lunar-javascript의 캐시된 EightChar와 자시 학파', () => {
  it('학파마다 따로 만든 eightCharOf는 서로의 sect를 바꾸지 않는다', () => {

    const lunar = Solar.fromYmdHms(2024, 5, 10, 23, 30, 0).getLunar();
    const midnight = eightCharOf(lunar, 2);
    const early = eightCharOf(lunar, 1);
    const midnightDay = midnight.getDay();
    expect(early.getDay()).not.toBe(midnightDay);

    expect(midnight.getDay()).toBe(midnightDay);
    expect(lunar.getEightChar()).not.toBe(midnight);
    expect(lunar.getEightChar()).not.toBe(early);
    expect(lunar.getEightChar().getDay()).toBe(midnightDay);
  });

  it('자시 출생을 어느 학파로 먼저 계산해도 결과가 같다', () => {
    const input = birth('1990-05-15', '00:02');
    const first = computeChart(input, { ziSect: 1 });
    const second = computeChart(input, { ziSect: 2 });
    const firstAgain = computeChart(input, { ziSect: 1 });
    const secondAgain = computeChart(input, { ziSect: 2 });
    expect(firstAgain).toEqual(first);
    expect(secondAgain).toEqual(second);
    expect(first.pillars.day.ganzhi).not.toBe(second.pillars.day.ganzhi);
  });
});
