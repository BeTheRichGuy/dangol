import type { ReviewCopy } from '@/lib/reviews/review';

export const REVIEW_JA: ReviewCopy = {
  title: 'レビューを書く',
  note: 'みなさまのレビューが大きな励みになります。',
  star: (n) => `星${n}つ`,
  placeholder: '感じたことをひとこと(任意)。お名前や連絡先は書かないでください。',
  counter: (used, max) => `${used}/${max}`,
  submit: 'レビューを送る',
  sending: '送信中です',
  needRating: 'まず星の数を選んでください。',
  thanks: 'レビューをありがとうございます。とても励みになります。',
  failed: 'いまはレビューを送れませんでした。少し待ってからもう一度お試しください。',
  reward: 'レビューを書くと、灯りを3つお贈りします。(鑑定ごとに1回)',
  thanksReward: 'レビューをありがとうございます。灯りを3つお贈りしました。',
};
