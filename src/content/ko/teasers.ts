import type { GodGroup } from '@/lib/saju/types';
import type { TeaserLibrary, TeaserLock } from '@/lib/reading/teasers';
import { PEOPLE_KO } from './people';

const NAME = PEOPLE_KO.groupName;

function when(nowYear: number, year: number, month: number): string {
  const diff = year - nowYear;
  const word = diff === 0 ? '올해' : diff === 1 ? '내년' : diff === 2 ? '내후년' : `${year}년`;
  if (month <= 3) return `${word} 초(${month}월)`;
  if (month >= 10) return `${word} 말(${month}월)`;
  return `${word} ${month}월`;
}

const DAEYUN_AREA: Record<GodGroup, string> = {
  peer: '함께하는 사람과 몫을 나누는 방식이',
  output: '내 재주와 말을 내놓는 방식이',
  wealth: '돈과 기회를 쥐는 방식이',
  power: '맡는 책임과 평가받는 자리가',
  resource: '배우고 기대는 자리가',
};

const YEAR_AREA: Record<GodGroup, string> = {
  peer: '사람 사이의 몫과 경쟁이',
  output: '내 재주와 말이',
  wealth: '돈과 기회가',
  power: '일과 책임이',
  resource: '배움과 기댈 곳이',
};

const YEAR_RELATION_NAME = { clash: '충(부딪힘)', harmony: '합(맞닿음)' } as const;

const GAP_LEAD: Record<GodGroup, [string, string]> = {
  wealth: ['잠깐만… 겉으로 딱 보이는 자리엔 돈 쪽 글자가 하나도 없네.', '잠깐만… 겉으로 딱 보이는 자리엔 돈 쪽 글자가 딱 하나뿐이야.'],
  power: ['잠깐만… 판을 짜고 일을 이끄는 틀, 시키는 사람 자리가 겉엔 비어 있어.', '잠깐만… 판을 짜고 일을 이끄는 틀, 시키는 사람 자리가 겉엔 딱 하나뿐이야.'],
  output: ['잠깐만… 속에 든 말을 밖으로 시원하게 꺼내 쓰는 자리가 겉엔 비어 있어.', '잠깐만… 속에 든 말을 밖으로 시원하게 꺼내 쓰는 자리가 겉엔 딱 하나뿐이야.'],
  resource: ['잠깐만… 마음 편히 등 기대고 쉴 자리가 겉엔 비어 있네.', '잠깐만… 마음 편히 등 기대고 쉴 자리가 겉엔 딱 하나뿐이야.'],
  peer: ['잠깐만… 아무 조건 없이 내 편이 되어 주는 자리가 겉엔 비어 있어.', '잠깐만… 아무 조건 없이 내 편이 되어 주는 자리가 겉엔 딱 하나뿐이야.'],
};

const GAP_BODY: Record<GodGroup, string> = {
  wealth: '분명 들어오긴 하는데 어느 틈에 다 빠져나가지? 나가는 구멍이 따로 있어서 그래. 이걸 막으려면 {blur}부터 챙겨 둬야 해.',
  power: '누가 판을 깔아 주지 않으면 시작이 어렵고, 시작해도 마무리가 흐려지기 쉬워. 중심을 딱 잡아 주려면 {blur}가 필요해.',
  output: '하고 싶은 말을 삼키고 또 삼키다가 엉뚱한 데서 와르르 쏟아내기 쉬워. 덜 다치고 편하게 털어놓는 법은 {blur}야.',
  resource: '힘든 날에도 혼자 해결하는 데 너무 익숙한 편이야. 편하게 마음 내려놓을 자리는 {blur} 쪽에 있어.',
  peer: '주변에 사람은 있어도 속을 터놓기보다 혼자 버티는 날이 많기 쉬워. 정말 네 편이 되어 줄 사람은 {blur} 쪽에 있어.',
};

export function cutMid(sentence: string): string {
  const limit = Math.floor(sentence.length * 0.55);
  const at = sentence.lastIndexOf(' ', limit);
  return `${sentence.slice(0, at >= 8 ? at : limit).trimEnd()}…`;
}

const lock = (room: TeaserLock['room'], sections: number[], items: string[]): TeaserLock => ({ room, sections, items });

export const TEASERS_KO: TeaserLibrary = {
  when,

  daeyun: ({ when: w, cur, next, group, start }) => ({
    lead: `잠깐만… ${w} 무렵에 10년의 큰 흐름이 확 바뀌네?`,
    body: `지금 '${cur}'에서 '${next}'으로 넘어가는 길목에 서 있어. ${DAEYUN_AREA[group]} 통째로 방향을 트는 때라, 이 고비를 그냥 넘기면 한동안 갈피를 못 잡고 헤맬 수 있거든.\n\n이 흐름을 제대로 타려면 {blur}부터 꼭 염두에 둬야 해.`,
    hidden: 2,
    evidence: `근거 · 다음 10년 장이 열리는 달: ${start.y}년 ${start.m}월 (대운)`,
  }),

  year: ({ year, relation, group }) => {
    if (relation === 'clash') {
      return {
        lead: `잠깐… ${year}년은 그냥 흘려보낼 해가 아니야.`,
        body: '그해의 글자가 네 일지, 그러니까 제일 가까운 관계의 자리와 정면으로 부딪히거든. 머무는 집이나 일터, 가장 아끼는 사람 사이가 한 번씩 덜컹거리기 쉬워.\n\n이 고비를 부드럽게 넘기려면 {blur}를 잊지 말아야 해.',
        hidden: 2,
        evidence: `근거 · ${year}년 간지와 내 일지의 관계: ${YEAR_RELATION_NAME.clash}`,
      };
    }
    if (relation === 'harmony') {
      return {
        lead: `잠깐… ${year}년은 네 일지와 다정하게 손을 잡는 해야.`,
        body: '그해의 흐름이 네 일지와 착 맞아떨어져서, 든든한 사람과 좋은 일거리가 한곳으로 모이기 쉬워.\n\n근데 분위기가 좋을 때일수록 {blur}를 깜빡하고 놓치는 일이 많거든.',
        hidden: 2,
        evidence: `근거 · ${year}년 간지와 내 일지의 관계: ${YEAR_RELATION_NAME.harmony}`,
      };
    }
    return {
      lead: `잠깐… ${year}년이 네 사주에 얹히는 모양이 좀 특이해.`,
      body: `그해는 ${YEAR_AREA[group]} 크게 움직이고 변화를 타기 쉬운 때야.\n\n좋은 흐름을 놓치지 않고 내 것으로 만들려면 {blur}에 마음을 기울여 봐.`,
      hidden: 2,
      evidence: `근거 · ${year}년 천간의 십신 갈래: ${NAME[group]}`,
    };
  },

  people: ({ careful, near }) => ({
    lead: '근데 있잖아… 혹시 지금 네 곁에 이런 사람이 머물고 있진 않아?',
    body: `${careful}\n\n그럼 누구를 곁에 둬야 편하냐고? ${cutMid(near)} {blur}`,
    hidden: 2,
  }),

  gap: ({ group, count }) => ({
    lead: GAP_LEAD[group][count === 0 ? 0 : 1],
    body: GAP_BODY[group],
    hidden: 2,
    evidence: `근거 · 겉으로 드러난 글자 중 ${NAME[group]}은 ${count}개 (지장간은 세지 않아)`,
  }),

  lockDaeyun: lock('decades', [5, 4, 2, 3], ['다음 10년 장이 가져올 첫인상과 준비하는 법', '이번 10년의 열 해를 하나씩, 기회가 오는 해', '지나온 장들에서 되풀이된 마음가짐', '지금 서 있는 자리의 10년']),

  lockYear: lock('year', [1, 3, 4, 5], ['2027년이 네 사주에 닿는 자리', '일·돈·사람·마음, 네 갈래로 풀어 본 한 해', '2027년 1월부터 2028년 1월까지 열세 달', '나설 때와 쉴 때, 달력에 미리 칠 동그라미']),

  lockYearOther: lock('decades', [4, 5, 3], ['이번 10년의 열 해를 하나씩, 기회가 오는 해', '다음 10년이 가져올 첫인상과 준비하는 법', '지금 서 있는 자리의 10년']),

  lockPeople: lock('love', [2, 3, 5], ['마음이 가는 사람과 오래 갈 사람의 차이', '가까이하면 지치기 쉬운 사람의 신호', '자꾸 걸리는 매듭과 푸는 법', '연애운이 활짝 열리는 해']),
  lockGap: {

    wealth: lock('life', [7, 2], ['돈이 들어오는 길', '자꾸 새는 길목', '지키는 습관 하나', '비어 있는 자리가 만드는 버릇']),

    power: lock('life', [6, 4], ['내 강점이 가장 잘 쓰이는 일의 모양', '마찰이 생기기 쉬운 환경', '현실적인 다음 걸음 하나', '자꾸 나를 지치게 하는 버릇과 브레이크']),

    output: lock('life', [5, 3], ['이 사주에만 있는 힘 하나', '비슷한 사주와 무엇이 다른지', '내가 일하고 승부를 거는 방식', '스스로에게 조금 너그러워져도 되는 이유']),

    resource: lock('life', [11, 9], ['숨이 트이는 환경', '반가운 방향 하나', '가족 안에서 맡기 쉬운 역할과 거리', '지쳤을 때 다시 기운이 차오르는 곳']),

    peer: lock('life', [4, 10], ['되풀이되기 쉬운 패턴 하나', '그 패턴이 나오는 짜임', '끊는 법 한마디', '곁에 두면 힘이 되는 사람의 모습']),
  },
};

export const TEASER_COPY_KO = {

  lockHeading: '여기서부터는 이어서 풀어 줄게',

  hiddenSr: '이어지는 말은 가려져 있어요',

  openSuffix: '열어 보기',
  open: (roomTitle: string, price: string) => `${roomTitle} 열어 보기 · ${price}`,

  roomOf: (n: number[], roomTitle: string) => `${roomTitle} ${n.map((x) => `${x}절`).join('·')}`,
} as const;
