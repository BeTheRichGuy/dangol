import type { DmCopy } from '../en/dm';

export const DM_JA: DmCopy = {
  hello: (name, line) => `コメントありがとうございます。ユルがお守りを一枚選びました。\n\n${name}：${line}`,
  pitch: 'DANGOLでは、ほかのお守りもたくさん受け取れます。生年月日を入れると、これから先のことも前もって見ておけます。',
  privacy: '生年月日は、このチャットではなくサイトにだけ入力してくださいね。',
  cardSubtitle: 'ほかのお守りと、生年月日で見る先の流れも。',
  button: 'お守りをもっと見る',
  xmas: {
    pitch: 'あの人と過ごす今年のクリスマス。いつ連絡するといいか、まずは無料でチェックしてみてくださいね。',
    cardSubtitle: 'あの人との今年のクリスマス、連絡のタイミングを無料でチェック。',
    button: '連絡にいい日を見る',
  },
};
