import type { Climate, ClimateWish } from '@/lib/reading/country';
import type { LineTone, PairFlow, PairTone } from '@/lib/reading/match-extra';
import type { TogetherKind } from '@/lib/reading/fate-map';
import type { RelationKind } from '@/lib/saju/details';
import type { Element } from '@/lib/saju/types';

export type PillarName = 'year' | 'month' | 'day' | 'hour';

export interface FateExtra {
  type: {
    head: string;
    sub: string;
    me: string;
    you: string;
    flow: Record<PairFlow, { name: string; line: string }>;
    tone: Record<PairTone, string>;
    element: Record<Element, string>;

    link: Record<PairFlow, string>;
  };
  lines: {
    head: string;
    sub: string;
    me: string;
    you: string;
    pillar: Record<PillarName, string>;
    part: { stem: string; branch: string };
    kind: Record<RelationKind, string>;
    tone: Record<LineTone, string>;

    line: Record<LineTone, (mine: string, yours: string) => string>;
    summary: { some: (n: number) => string; none: string };
    more: (n: number) => string;
    hint: string;
  };
  years: {
    head: string;
    sub: string;
    me: string;
    you: string;
    kind: Record<TogetherKind, string>;
    line: Record<TogetherKind, string>;
    summary: { some: (n: number) => string; none: string };
    year: (y: number) => string;
  };
  country: {
    head: { self: string; pair: string };
    sub: { self: string; pair: string };
    rank: (n: number) => string;
    element: Record<Element, string>;
    climate: Record<Climate, string>;
    reason: {
      self: { match: (el: string) => string; feeds: (el: string) => string };
      pair: { bothMatch: (el: string) => string; oneMatch: (el: string) => string; feeds: (el: string) => string };
      climate: {
        self: Record<NonNullable<ClimateWish>, string>;
        pairBoth: Record<NonNullable<ClimateWish>, string>;
        pairOne: Record<NonNullable<ClimateWish>, string>;
      };
      plain: string;
    };
    note: string;
    mapLabel: string;

    vibe: Record<string, string>;
  };
}

export const FATE_EXTRA_KO: FateExtra = {
  type: {
    head: '우리 한 쌍의 모양',
    sub: '두 사람 일간(태어난 날의 하늘 글자)이 서로 어떤 사이인지로 가른 유형이에요. 금빛 원이 나, 은빛 원이 상대예요.',
    me: '나',
    you: '상대',
    flow: {
      same: { name: '거울처럼 닮은 쌍', line: '두 사람의 일간이 같은 오행이에요. 결이 닮아서 말하지 않아도 통하는 날이 많고, 같은 데서 같이 지치기도 쉬워요.' },
      'self-feeds-other': { name: '내가 등불을 드는 쌍', line: '내 일간이 상대의 일간을 키워 주는 모양이에요. 내가 먼저 건네고 챙기기 쉬워서, 가끔은 받는 쪽에 서 보면 균형이 잡혀요.' },
      'other-feeds-self': { name: '상대가 우산을 씌우는 쌍', line: '상대의 일간이 내 일간을 키워 주는 모양이에요. 기대기 편한 자리인 만큼, 고맙다는 말을 소리 내어 건네면 오래가요.' },
      'self-checks-other': { name: '내가 방향을 쥐는 쌍', line: '내 일간이 상대의 일간을 누르는 모양이에요. 내 속도로 끌고 가기 쉬워서, 한 걸음은 상대의 걸음에 맞춰 주면 좋아요.' },
      'other-checks-self': { name: '상대가 앞서 걷는 쌍', line: '상대의 일간이 내 일간을 누르는 모양이에요. 상대 속도에 맞추다 보면 지치기 쉬워서, 내 속도를 먼저 말해 두면 좋아요.' },
    },
    tone: {
      combine: '게다가 두 일간이 천간합으로 붙어 있어서, 가까워지면 쉽게 떨어지지 않는 결이에요.',
      clash: '게다가 두 일간이 천간충으로 마주 서 있어서, 부딪힌 만큼 서로를 또렷하게 알아보는 결이에요.',
      plain: '',
    },
    element: { wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물' },
    link: {
      same: '같은 오행',
      'self-feeds-other': '내가 상대를 키움',
      'other-feeds-self': '상대가 나를 키움',
      'self-checks-other': '내가 상대를 누름',
      'other-checks-self': '상대가 나를 누름',
    },
  },
  lines: {
    head: '여덟 글자가 맞닿는 곳',
    sub: '위가 내 사주, 아래가 상대 사주예요. 두 사람의 글자끼리 합·충·형이 걸리는 곳을 선으로 이었어요. 선 아래의 글자 줄을 누르면 그 선이 밝아져요.',
    me: '나',
    you: '상대',
    pillar: { year: '해', month: '달', day: '날', hour: '시' },
    part: { stem: '하늘 글자', branch: '땅 글자' },
    kind: {
      天干合: '천간합', 天干沖: '천간충', 六合: '육합', 三合: '삼합', 半合: '반합', 方合: '방합',
      沖: '충', 刑: '형', 自刑: '자형', 破: '파', 害: '해', 怨嗔: '원진', 鬼門: '귀문',
    },
    tone: { harmony: '어울림', clash: '부딪힘', tangle: '얽힘' },
    line: {
      harmony: (mine, yours) => `나의 ${mine}, 상대의 ${yours}. 서로 끌어당기는 사이예요. 둘이 가까워지는 길목이에요.`,
      clash: (mine, yours) => `나의 ${mine}, 상대의 ${yours}. 마주 서는 사이예요. 부딪히는 만큼 서로가 또렷하게 보이는 자리예요.`,
      tangle: (mine, yours) => `나의 ${mine}, 상대의 ${yours}. 살짝 얽히는 사이예요. 오해가 쌓이기 쉬운 자리라 그때그때 말로 풀어 두면 좋아요.`,
    },
    summary: {
      some: (n) => `두 사람의 글자 사이에 맞닿는 선이 ${n}개 있어요.`,
      none: '두 사람의 글자 사이에 크게 맞닿는 선은 없어요. 이럴 땐 일간의 결과 오행의 겹침이 사이를 정해요.',
    },
    more: (n) => `선 ${n}개는 접어 뒀어요. 합과 충을 먼저 보여 드렸어요.`,
    hint: '선을 이은 글자는 풀이에서 근거로 쓰인 자리예요.',
  },
  years: {
    head: '둘 사이 온도 띠',
    sub: '올해부터 일곱 해를 두 사람 각자의 사주로 따져 봤어요. 금빛과 은빛이 함께 켜진 해가 같이 맞는 해예요.',
    me: '나',
    you: '상대',
    kind: { both: '같이 맞는 해', one: '한 사람만 맞는 해', care: '같이 조심할 해', even: '잔잔한 해' },
    line: {
      both: '두 사람 모두 흐름이 맞는 해예요. 같이 뭔가 시작하기 좋아요.',
      one: '한 사람만 흐름이 맞는 해예요. 맞는 쪽이 먼저 손을 내밀어 보면 좋아요.',
      care: '두 사람 모두 약속이 어긋나기 쉬운 해예요. 큰 결정은 서로 한 번 더 묻고 가요.',
      even: '큰 파도 없는 해예요. 평소처럼 나란히 걸어요.',
    },
    summary: {
      some: (n) => `같이 맞는 해가 ${n}번 있어요.`,
      none: '같이 맞는 해가 딱 겹치진 않아요. 한 사람씩 맞는 해에 서로 손을 내밀어 보세요.',
    },
    year: (y) => `${y}년`,
  },
  country: {
    head: { self: '나에게 어울리는 나라', pair: '같이 살면 좋을 나라' },
    sub: {
      self: '내게 반가운 기운과 태어난 계절의 온도를 견줘서 세 나라를 짚었어요. 가장 큰 금빛 핀이 첫째예요. 핀이나 나라 이름을 눌러 보세요.',
      pair: '두 사람의 사주를 함께 견줘서 세 나라를 짚었어요. 가장 큰 금빛 핀이 첫째예요. 핀이나 나라 이름을 눌러 보세요.',
    },
    rank: (n) => `${n}번째`,
    element: { wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물' },
    climate: { warm: '따뜻한', mild: '포근한', cool: '선선한', cold: '찬' },
    reason: {
      self: {
        match: (el) => `내게 반가운 ${el} 기운이 짙은 곳이에요.`,
        feeds: (el) => `내게 반가운 기운을 낳아 주는 ${el} 기운의 곳이에요.`,
      },
      pair: {
        bothMatch: (el) => `두 사람 모두에게 반가운 ${el} 기운이 짙은 곳이에요.`,
        oneMatch: (el) => `한 사람에게 반가운 ${el} 기운이 짙은 곳이에요.`,
        feeds: (el) => `두 사람의 반가운 기운을 받쳐 주는 ${el} 기운의 곳이에요.`,
      },
      climate: {
        self: { warm: '겨울에 태어나 찬 기운이 많아서, 따뜻한 쪽에서 숨이 트여요.', cool: '여름에 태어나 열이 많아서, 선선한 쪽에서 숨이 트여요.' },
        pairBoth: { warm: '두 사람 모두 찬 계절에 태어나서, 따뜻한 날씨가 잘 맞아요.', cool: '두 사람 모두 더운 계절에 태어나서, 선선한 날씨가 잘 맞아요.' },
        pairOne: { warm: '한 사람이 찬 계절에 태어나서, 따뜻한 날씨가 도움이 돼요.', cool: '한 사람이 더운 계절에 태어나서, 선선한 날씨가 도움이 돼요.' },
      },
      plain: '크게 거스르는 것 없이 마음 편히 걸어 볼 만한 곳이에요.',
    },
    note: '사주로 분위기가 맞는 곳을 짚어 본 것뿐이에요. 이민, 비자, 취업 같은 결정은 따로 알아보고 정하세요.',
    mapLabel: '세계 지도',
    vibe: {
      JP: '온천 김과 단풍 길', NZ: '초록 언덕과 양 떼', CA: '숲과 호수의 아침', CR: '열대 숲과 새소리', IE: '비 갠 초록 들판', CL: '산과 바다 사이 긴 땅',
      TH: '야시장과 따뜻한 밤공기', VN: '커피 향 번지는 골목', PH: '바다 빛 섬들', ID: '열대 숲과 화산 섬', SG: '초록 도시와 늦은 저녁 불빛', MY: '여러 말이 섞인 골목과 열대 비',
      AU: '넓은 하늘과 바닷가', IN: '향신료 냄새와 색색의 천', ES: '느긋한 낮잠과 늦은 저녁', IT: '돌길과 오후의 볕', GR: '하얀 벽과 푸른 바다', PT: '언덕 도시와 바닷바람',
      MX: '색 고운 골목과 볕', BR: '바닷가 리듬과 열대 숲', CH: '눈 덮인 산과 호수', AT: '음악이 흐르는 산골 도시', CZ: '돌다리와 오래된 골목', NP: '히말라야 능선',
      BT: '산사와 고요한 골짜기', MN: '끝없는 초원과 별밤', PE: '안데스 고원과 옛 돌길', CO: '봄 같은 산동네와 커피밭', TR: '바다와 대륙이 만나는 도시', MA: '붉은 벽과 사막 바람',
      GB: '비 오는 골목과 찻집', FR: '카페와 강가의 저녁', DE: '숲 산책과 단정한 거리', NL: '운하와 자전거', BE: '오래된 광장과 운하 도시', PL: '붉은 지붕의 옛 도시',
      US: '큰 도시와 탁 트인 길', AR: '탱고 골목과 넓은 들판', IS: '오로라와 온천', NO: '피오르와 긴 여름 해', SE: '호숫가 숲과 조용한 도시', FI: '숲과 호수와 사우나',
      EE: '중세 골목과 바닷바람', DK: '아늑한 골목과 바다', HR: '푸른 바다와 돌 마을', LK: '차밭과 바다', MV: '산호빛 바다', FJ: '야자수와 맑은 바다',
    },
  },
};
