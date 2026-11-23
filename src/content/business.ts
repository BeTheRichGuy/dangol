import type { Locale } from './locale';

export interface BusinessFacts {
  name: Record<Locale, string>;
  owner: string;
  bizNo: string;
  mailOrderNo: string | null;
  address: string | null;
  phone: string | null;
  email: string;
  hosting: string;
}

export const BUSINESS: BusinessFacts = {
  name: { ko: '도깨비웍스', en: 'DokkaebiWorks (도깨비웍스)', ja: 'DokkaebiWorks（도깨비웍스）' },
  owner: '고희승',
  bizNo: '629-04-03844',

  mailOrderNo: null,
  address: '경기도 파주시 큰연당길 45-14',
  phone: '010-8996-9157',
  email: 'admin@dokkaebiworks.com',
  hosting: 'Vercel Inc.',
};

export type BusinessField = 'name' | 'owner' | 'bizNo' | 'mailOrderNo' | 'address' | 'phone' | 'email' | 'hosting';

const ORDER: BusinessField[] = ['name', 'owner', 'bizNo', 'mailOrderNo', 'address', 'phone', 'email', 'hosting'];

export function businessRows(locale: Locale, facts: BusinessFacts = BUSINESS): { field: BusinessField; value: string }[] {
  return ORDER.flatMap((field) => {
    const value = field === 'name' ? facts.name[locale] : facts[field];
    return value ? [{ field, value }] : [];
  });
}

export function ftcUrl(bizNo: string = BUSINESS.bizNo): string {
  return `https://www.ftc.go.kr/bizCommPop.do?wrkr_no=${bizNo.replace(/\D/g, '')}`;
}
