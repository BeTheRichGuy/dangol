export type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
export type Branch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';
export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type Polarity = 'yang' | 'yin';

export type TypeKey =
  | 'pine' | 'vine' | 'sun' | 'candle' | 'mountain'
  | 'field' | 'blade' | 'jewel' | 'ocean' | 'rain';

export type GodGroup = 'peer' | 'output' | 'wealth' | 'power' | 'resource';

export interface Pillar {
  stem: Stem;
  branch: Branch;
  stemElement: Element;
  branchElement: Element;
  stemPolarity: Polarity;

  ganzhi: string;

  romanized: string;
}

export interface BirthInput {

  date: string;

  time: string | null;
  place: {
    name: string;

    country: string;
    lat: number;
    lng: number;

    tz: string;
  };

  sex: 'female' | 'male' | null;
}

export type SolarTimeMode = 'standard' | 'mean' | 'apparent';

export interface ChartOptions {

  solarTime?: SolarTimeMode;

  ziSect?: 1 | 2;
}

export interface DaYun {
  startAge: number;
  startYear: number;
  ganzhi: string;
}

export interface Chart {
  input: BirthInput;
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;

    hour: Pillar | null;
  };
  dayMaster: {
    stem: Stem;
    element: Element;
    polarity: Polarity;
    type: TypeKey;
  };

  elements: Record<Element, number>;

  stemGods: { year: GodGroup; month: GodGroup; hour: GodGroup | null };
  daYun: { forward: boolean; startAge: number; list: DaYun[] } | null;
  flags: {
    timeUnknown: boolean;

    ziHourAmbiguous: boolean;

    altType: TypeKey | null;

    nearJieqiBoundary: boolean;
  };
  meta: {

    utc: string;

    solarLocal: string;
    solarTime: SolarTimeMode;

    offsetMinutes: number;
    ziSect: 1 | 2;
  };
}

export interface SeasonWindow {

  name: string;

  hanzi: string;

  start: string;
  end: string;

  monthGanzhi: string;

  yearGanzhi: string;
}
