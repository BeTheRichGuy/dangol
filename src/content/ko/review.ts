import type { ReviewCopy } from '@/lib/reviews/review';

export const REVIEW_KO: ReviewCopy = {
  title: '후기 남기기',
  note: '여러분의 후기가 큰 도움이 돼요.',
  star: (n) => `별 ${n}개`,
  placeholder: '느낀 점을 짧게 남겨 주세요 (선택). 이름이나 연락처는 적지 말아 주세요.',
  counter: (used, max) => `${used}/${max}`,
  submit: '후기 보내기',
  sending: '보내는 중이에요',
  needRating: '별점을 먼저 골라 주세요.',
  thanks: '후기를 남겨 주셔서 고마워요. 큰 힘이 돼요.',
  failed: '지금은 후기를 보내지 못했어요. 잠시 뒤에 다시 눌러 주세요.',
  reward: '후기를 남기면 등불 3개를 드려요. (보고서마다 한 번)',
  thanksReward: '후기 고마워요. 등불 3개를 드렸어요.',
};
