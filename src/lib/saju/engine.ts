import { DateTime } from 'luxon';
import { eightCharOf, jieInstantMs, lunarAtCst, solarFromWall } from './calendar';
import { solarOffsetMinutes } from './solar-time';
import { godGroup, pillarFromGanzhi, typeOfStem } from './tables';
import { isRealDate, isValidZone, offsetAt, resolveWallClock } from './zone';
import type {
  BirthInput,
  Chart,
  ChartOptions,
  Element,
  GodGroup,
  Pillar,
} from './types';
import type { LibLunar } from 'lunar-javascript';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function computeChart(input: BirthInput, opts: ChartOptions = {}): Chart {
  const solarTime = opts.solarTime ?? 'mean';
  const ziSect = opts.ziSect ?? 2;
  const timeUnknown = input.time === null;

  if (!DATE_RE.test(input.date) || (!timeUnknown && !TIME_RE.test(input.time as string))) {
    throw new RangeError('computeChart: date must be YYYY-MM-DD and time HH:mm (24h) or null');
  }
  const [year, month, day] = input.date.split('-').map(Number);
  const [hour, minute] = (input.time ?? '12:00').split(':').map(Number);
  if (!isRealDate(year, month, day)) {
    throw new RangeError('computeChart: date does not exist in the calendar');
  }
  if (!isValidZone(input.place.tz)) {
    throw new RangeError('computeChart: unknown time zone');
  }

  const tz = input.place.tz;
  const utcMs = resolveWallClock(tz, { year, month, day, hour, minute });
  const wallOffset = offsetAt(tz, utcMs);

  const wall = DateTime.fromMillis(utcMs + wallOffset * 60_000, { zone: 'utc' });

  const lunarCst = lunarAtCst(utcMs);
  const yearPillar = pillarFromGanzhi(lunarCst.getYearInGanZhiExact());
  const monthPillar = pillarFromGanzhi(lunarCst.getMonthInGanZhiExact());

  const offsetMinutes = solarOffsetMinutes(solarTime, input.place.lng, wallOffset, utcMs);
  const solarLocal = wall.plus({ minutes: offsetMinutes });
  const solarLunar = solarFromWall(solarLocal).getLunar();
  const eightChar = eightCharOf(solarLunar, ziSect);
  const dayPillar = pillarFromGanzhi(eightChar.getDay());
  const hourPillar = timeUnknown ? null : pillarFromGanzhi(eightChar.getTime());

  const ziHourAmbiguous = !timeUnknown && (solarLocal.hour === 23 || solarLocal.hour === 0);
  let altType: Chart['flags']['altType'] = null;
  if (ziHourAmbiguous) {
    const altStem = pillarFromGanzhi(eightCharOf(solarLunar, ziSect === 1 ? 2 : 1).getDay()).stem;
    if (altStem !== dayPillar.stem) altType = typeOfStem(altStem);
  }

  let nearJieqiBoundary = false;
  if (timeUnknown) {
    const dayStart = resolveWallClock(tz, { year, month, day, hour: 0, minute: 0 });
    const next = new Date(Date.UTC(year, month - 1, day + 1));
    const dayEnd = resolveWallClock(tz, {
      year: next.getUTCFullYear(),
      month: next.getUTCMonth() + 1,
      day: next.getUTCDate(),
      hour: 0,
      minute: 0,
    });
    nearJieqiBoundary = hasJieBetween(lunarCst, dayStart, dayEnd);
  }

  const dm = dayPillar;
  const dayMaster = {
    stem: dm.stem,
    element: dm.stemElement,
    polarity: dm.stemPolarity,
    type: typeOfStem(dm.stem),
  };

  const elements: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const counted: Pillar[] = hourPillar
    ? [yearPillar, monthPillar, dayPillar, hourPillar]
    : [yearPillar, monthPillar, dayPillar];
  for (const p of counted) {
    elements[p.stemElement] += 1;
    elements[p.branchElement] += 1;
  }

  const godOf = (p: Pillar): GodGroup => godGroup(dayMaster.element, p.stemElement);
  const stemGods = {
    year: godOf(yearPillar),
    month: godOf(monthPillar),
    hour: hourPillar ? godOf(hourPillar) : null,
  };

  let daYun: Chart['daYun'] = null;
  if (input.sex) {

    const yun = eightCharOf(lunarCst, 2).getYun(input.sex === 'male' ? 1 : 0, 2);
    const startAge = yun.getStartYear();
    daYun = {
      forward: yun.isForward(),
      startAge,

      list: yun
        .getDaYun(9)
        .slice(1)
        .map((cycle, i) => ({
          startAge: startAge + i * 10,
          startYear: cycle.getStartYear(),
          ganzhi: cycle.getGanZhi(),
        })),
    };
  }

  return {
    input: { ...input, place: { ...input.place } },
    pillars: { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar },
    dayMaster,
    elements,
    stemGods,
    daYun,
    flags: { timeUnknown, ziHourAmbiguous, altType, nearJieqiBoundary },
    meta: {
      utc: new Date(utcMs).toISOString(),
      solarLocal: solarLocal.toFormat('yyyy-MM-dd HH:mm'),
      solarTime,
      offsetMinutes,
      ziSect,
    },
  };
}

function hasJieBetween(lunar: LibLunar, startMs: number, endMs: number): boolean {
  for (const jie of [lunar.getPrevJie(), lunar.getNextJie()]) {
    if (!jie) continue;
    const t = jieInstantMs(jie);
    if (t >= startMs && t < endMs) return true;
  }
  return false;
}

