import type { ReviewCopy } from '@/lib/reviews/review';

export const REVIEW_EN: ReviewCopy = {
  title: 'Leave a review',
  note: 'Your reviews help us more than you know.',
  star: (n) => (n === 1 ? '1 star' : `${n} stars`),
  placeholder: 'A few words on how it felt (optional). Please leave out names and contact details.',
  counter: (used, max) => `${used}/${max}`,
  submit: 'Send review',
  sending: 'Sending',
  needRating: 'Pick a star rating first.',
  thanks: 'Thank you for your review. It means a lot.',
  failed: 'Your review didn’t go through. Please try again in a moment.',
  reward: 'Leave a review and get 3 lanterns. (Once per report)',
  thanksReward: 'Thank you for your review. We added 3 lanterns for you.',
};
