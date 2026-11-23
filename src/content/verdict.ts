import { localized } from './locale';

export interface VerdictCopy {
  good: string;
  bad: string;

  legend: string;
}

export const VERDICT_KO: VerdictCopy = { good: '좋은 때', bad: '조심할 때', legend: '그림 표시 안내' };
export const VERDICT_EN: VerdictCopy = { good: 'Good time', bad: 'Take care', legend: 'Picture key' };
export const VERDICT_JA: VerdictCopy = { good: '良い時', bad: '気をつける時', legend: '図の見方' };

export const VERDICT = localized({ en: VERDICT_EN, ko: VERDICT_KO, ja: VERDICT_JA });
