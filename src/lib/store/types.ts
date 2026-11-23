import type { Focus } from '@/lib/reading/types';
import type { TypeKey } from '@/lib/saju/types';

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

export interface WaitlistInput {

  email: string;

  consent: boolean;

  source?: string;
  type?: TypeKey;
  focus?: Focus;
  utm?: Utm;
}

export interface WaitlistEntry {
  email: string;
  regularNo: number;

  createdAt: string;
  consent: true;
  source: string;
  type?: TypeKey;
  focus?: Focus;
  utm?: Utm;
}

export type WaitlistDraft = Omit<WaitlistEntry, 'regularNo'>;

export interface WaitlistResult {
  regularNo: number;

  created: boolean;
}

export interface WaitlistAdapter {

  addOrGet(draft: WaitlistDraft): Promise<WaitlistResult>;
}

export type WaitlistErrorCode =
  | 'invalid_email'
  | 'consent_required'
  | 'storage_unavailable'

  | 'not_open';

export class WaitlistError extends Error {
  readonly code: WaitlistErrorCode;
  constructor(code: WaitlistErrorCode) {
    super(code);
    this.name = 'WaitlistError';
    this.code = code;
  }
}
