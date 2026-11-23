import type { ENGINE_COPY } from '../en/engine';
import type { DeepPartial } from '../locale';

export const ENGINE_KO: DeepPartial<typeof ENGINE_COPY> = {
  notCurse: '나쁜 운 아니야. 날씨처럼 지나가는 거야.',

  godLabel: { peer: '비겁', output: '식상', wealth: '재성', power: '관성', resource: '인성' },
  godGloss: {
    peer: '너와 같은 편이라 든든한 기운이지',
    output: '마음속 말을 밖으로 꺼내게 만드는 기운이지',
    wealth: '원하는 걸 얻으려고 움직이게 하는 기운이지',
    power: '너를 조금 더 다그치는 기운이지',
    resource: '배우고 쉬면서 힘을 얻는 기운이지',
  },
  monthStem: '이번 달 하늘 글자 {monthStem}, 네 중심 글자 {dayStem} 쪽에서 보면 {label}이야. {gloss}.',
  sharpPolarity: '음양까지 같아서, 그 기운이 더 세게 느껴져.',
  sharpOutput: '음양이 서로 달라서, 네 말이 뜻보다 날카롭게 들릴 수 있어.',
  monthClash: '이번 달 땅 글자 {monthBranch}, 네 날의 글자 {dayBranch}. 둘이 정면으로 부딪쳐(충).',
  monthWonjin: '이번 달 땅 글자 {monthBranch}, 네 날의 글자 {dayBranch}. 둘이 서로 껄끄러운 사이야(원진).',
  monthHarmony: '이번 달 땅 글자 {monthBranch}, 네 날의 글자 {dayBranch}. 둘이 손을 잡아서(합) 한결 부드러워져.',
  yearClash: '올해 땅 글자 {yearBranch}, 네 날의 글자 {dayBranch}. 둘이 정면으로 부딪쳐(충).',
  nextTerm: '{term}({day}쯤)',
  when: '지금부터 {month} {part}까지, {name}에서 {next} 사이',
  articleTermStarts: [],
  parts: { early: '초', mid: '중순', late: '말' },
  termNames: {
    'Start of Spring': '입춘',
    'Awakening of Insects': '경칩',
    'Clear and Bright': '청명',
    'Start of Summer': '입하',
    'Grain in Ear': '망종',
    'Minor Heat': '소서',
    'Start of Autumn': '입추',
    'White Dew': '백로',
    'Cold Dew': '한로',
    'Start of Winter': '입동',
    'Major Snow': '대설',
    'Minor Cold': '소한',
  },
};
