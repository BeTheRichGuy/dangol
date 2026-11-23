import type { DmCopy } from '../en/dm';

export const DM_KO: DmCopy = {
  hello: (name, line) => `댓글 남겨 줘서 고마워요. 율이 부적 한 장을 골랐어요.\n\n${name}: ${line}`,
  pitch: '사이트에 오면 부적을 더 많이 받을 수 있어요. 생년월일을 넣으면 앞날도 미리 살펴보고 대비할 수 있어요.',
  privacy: '생년월일은 이 대화가 아니라 사이트에만 넣어 주세요.',
  cardSubtitle: '부적을 더 받고, 내 생년월일로 앞날도 미리 대비해요.',
  button: '부적 더 받기',
  xmas: {
    pitch: '그 사람과 이번 크리스마스, 언제 연락하면 좋을지 무료로 먼저 볼 수 있어요.',
    cardSubtitle: '그 사람과 이번 크리스마스, 연락할 타이밍을 무료로 먼저 봐요.',
    button: '무료로 날짜 보기',
  },
};
