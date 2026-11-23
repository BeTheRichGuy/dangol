declare module 'lunar-javascript' {
  export interface LibSolar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getSecond(): number;
    getLunar(): LibLunar;
    toYmdHms(): string;
  }

  export interface LibJieQi {
    getName(): string;
    getSolar(): LibSolar;
  }

  export interface LibDaYun {
    getIndex(): number;

    getStartYear(): number;
    getGanZhi(): string;
  }

  export interface LibYun {
    isForward(): boolean;

    getStartYear(): number;

    getDaYun(n: number): LibDaYun[];
  }

  export interface LibEightChar {
    setSect(sect: 1 | 2): void;
    getDay(): string;
    getDayGan(): string;
    getTime(): string;

    getYun(gender: 0 | 1, sect?: 1 | 2): LibYun;
  }

  export interface LibLunarMonth {
    getDayCount(): number;
  }

  export interface LibLunarYear {

    getLeapMonth(): number;

    getMonth(lunarMonth: number): LibLunarMonth | null;
  }

  export interface LibLunar {

    getMonth(): number;
    getYear(): number;
    getDay(): number;
    getSolar(): LibSolar;
    getYearInGanZhiExact(): string;
    getMonthInGanZhiExact(): string;

    getDayInGanZhi(): string;

    getEightChar(): LibEightChar;
    getPrevJie(wholeDay?: boolean): LibJieQi | null;
    getNextJie(wholeDay?: boolean): LibJieQi | null;
  }

  export const EightChar: {

    fromLunar(lunar: LibLunar): LibEightChar;
  };

  export const Lunar: {

    fromYmd(year: number, month: number, day: number): LibLunar;
  };

  export const LunarYear: {
    fromYear(year: number): LibLunarYear;
  };

  export const Solar: {
    fromYmd(year: number, month: number, day: number): LibSolar;
    fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): LibSolar;
  };
}
