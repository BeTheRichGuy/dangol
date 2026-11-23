export const REVIEW_ROOMS = ['free', 'life', 'decades', 'love', 'match', 'year', 'reunion'] as const;
export type ReviewRoom = (typeof REVIEW_ROOMS)[number];

export const REVIEW_LOCALES = ['en', 'ko', 'ja'] as const;
export type ReviewLocale = (typeof REVIEW_LOCALES)[number];

export const REVIEW_STARS = 5;

export const REVIEW_LANTERNS = 3;

export const REVIEW_LANTERNS_XMAS = 3;

export function reviewLanterns(room: ReviewRoom, edition: unknown): number {
  return edition === 'xmas' && room === 'love' ? REVIEW_LANTERNS_XMAS : REVIEW_LANTERNS;
}

export const REVIEW_BODY_MAX = 300;

export interface ReviewRow {
  room: ReviewRoom;
  locale: ReviewLocale;
  rating: 1 | 2 | 3 | 4 | 5;

  body: string;
}

export function cleanReviewBody(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, REVIEW_BODY_MAX);
}

export function cleanReadingId(raw: unknown): string | null {
  return typeof raw === 'string' && /^[A-Za-z0-9._:-]{1,64}$/.test(raw) ? raw : null;
}

export function cleanReview(raw: unknown): ReviewRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  const room = REVIEW_ROOMS.find((r) => r === v.room);
  const locale = REVIEW_LOCALES.find((l) => l === v.locale);
  const rating = v.rating;
  if (!room || !locale) return null;
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > REVIEW_STARS) return null;
  return { room, locale, rating: rating as ReviewRow['rating'], body: cleanReviewBody(v.body) };
}

export interface ReviewCopy {
  title: string;

  note: string;

  star: (n: number) => string;
  placeholder: string;
  counter: (used: number, max: number) => string;
  submit: string;
  sending: string;
  needRating: string;
  thanks: string;
  failed: string;

  reward: string;

  thanksReward: string;

  rewardGuest?: string;

  chat?: { href: string; label: string };
}
