export const SINCE_IDS = ['days', 'weeks', 'months', 'year'] as const;

export const LENGTH_IDS = ['short', 'year1', 'year3', 'long'] as const;

export const WHO_IDS = ['me', 'them', 'faded'] as const;

export const REASON_IDS = ['talk', 'values', 'distance', 'trust', 'bored', 'around', 'unsure'] as const;

export const CONTACT_IDS = ['blocked', 'ignored', 'sometimes', 'ongoing'] as const;

export const WANT_IDS = ['reunite', 'letgo', 'unsure'] as const;

export type SinceId = (typeof SINCE_IDS)[number];
export type LengthId = (typeof LENGTH_IDS)[number];
export type WhoId = (typeof WHO_IDS)[number];
export type ReasonId = (typeof REASON_IDS)[number];
export type ContactId = (typeof CONTACT_IDS)[number];
export type WantId = (typeof WANT_IDS)[number];

export const CONCERN_MAX = 120;

export const REASONS_MAX = 2;

export interface ReunionIntake {
  since: SinceId;
  length: LengthId;
  who: WhoId;

  reasons: ReasonId[];
  contact: ContactId;
  want: WantId;

  concern: string;
}

const has = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v);

export const isSinceId = (v: unknown): v is SinceId => has(SINCE_IDS, v);
export const isLengthId = (v: unknown): v is LengthId => has(LENGTH_IDS, v);
export const isWhoId = (v: unknown): v is WhoId => has(WHO_IDS, v);
export const isReasonId = (v: unknown): v is ReasonId => has(REASON_IDS, v);
export const isContactId = (v: unknown): v is ContactId => has(CONTACT_IDS, v);
export const isWantId = (v: unknown): v is WantId => has(WANT_IDS, v);

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

export function cleanConcern(v: string): string {
  return v.replace(CONTROL, '').replace(/\s+/g, ' ').trim().slice(0, CONCERN_MAX);
}

export function parseIntake(v: unknown): ReunionIntake | null {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
  const r = v as Record<string, unknown>;
  if (!isSinceId(r.since) || !isLengthId(r.length) || !isWhoId(r.who) || !isContactId(r.contact) || !isWantId(r.want)) return null;
  if (!Array.isArray(r.reasons) || r.reasons.length < 1 || r.reasons.length > REASONS_MAX || !r.reasons.every(isReasonId)) return null;
  const reasons = [...new Set(r.reasons as ReasonId[])];
  if (reasons.includes('unsure') && reasons.length > 1) return null;
  if (r.concern !== undefined && typeof r.concern !== 'string') return null;
  return { since: r.since, length: r.length, who: r.who, reasons, contact: r.contact, want: r.want, concern: cleanConcern(typeof r.concern === 'string' ? r.concern : '') };
}

export type LengthPlan = 'balanced' | 'letgo';

export function lengthPlan(intake: Pick<ReunionIntake, 'want'>): LengthPlan {
  return intake.want === 'letgo' ? 'letgo' : 'balanced';
}

export const LETGO_SHORT_SECTIONS: readonly number[] = [7, 8, 9, 10];
export const LETGO_LONG_SECTIONS: readonly number[] = [12];

export function contactIsCut(intake: Pick<ReunionIntake, 'contact'>): boolean {
  return intake.contact === 'blocked';
}

const TAG = /\n?\[reunion:v1 ([^\]\n]*)\]\s*$/;

export function encodeIntakeTag(intake: ReunionIntake): string {
  const body = `since=${intake.since} length=${intake.length} who=${intake.who} reasons=${intake.reasons.join('+')} contact=${intake.contact} want=${intake.want}`;
  return `${intake.concern}\n[reunion:v1 ${body}]`;
}

export function splitIntakeTag(question: string): { concern: string; intake: ReunionIntake | null } {
  const m = TAG.exec(question);
  if (!m) return { concern: question, intake: null };
  const concern = question.slice(0, m.index);
  const fields = Object.fromEntries(m[1].split(' ').map((kv) => kv.split('=') as [string, string]));
  const intake = parseIntake({ ...fields, reasons: (fields.reasons ?? '').split('+'), concern });
  return { concern, intake };
}
