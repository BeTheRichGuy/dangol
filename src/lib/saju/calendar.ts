import { FixedOffsetZone, DateTime } from 'luxon';
import { EightChar, Solar } from 'lunar-javascript';
import type { LibEightChar, LibJieQi, LibLunar, LibSolar } from 'lunar-javascript';

export const CST = FixedOffsetZone.instance(480);

export function lunarAtCst(utcMs: number): LibLunar {
  const d = DateTime.fromMillis(utcMs, { zone: CST });
  return Solar.fromYmdHms(d.year, d.month, d.day, d.hour, d.minute, d.second).getLunar();
}

export function solarFromWall(wall: DateTime): LibSolar {
  return Solar.fromYmdHms(wall.year, wall.month, wall.day, wall.hour, wall.minute, 0);
}

export function jieInstantMs(jie: LibJieQi): number {
  const s = jie.getSolar();
  return DateTime.fromObject(
    {
      year: s.getYear(),
      month: s.getMonth(),
      day: s.getDay(),
      hour: s.getHour(),
      minute: s.getMinute(),
      second: s.getSecond(),
    },
    { zone: CST },
  ).toMillis();
}

export function eightCharOf(lunar: LibLunar, sect: 1 | 2): LibEightChar {
  const eightChar = EightChar.fromLunar(lunar);
  eightChar.setSect(sect);
  return eightChar;
}
