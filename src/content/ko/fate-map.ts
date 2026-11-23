import type { FlowDirection, FlowLevel, KeyMonthTone, KeyYear, MonthTone, PartnerTypeKey, StageKey, YearKind } from '@/lib/reading/fate-map';
import type { Element, GodGroup } from '@/lib/saju/types';

const FLOW_THEME: Record<GodGroup, string> = {
  peer: '곁의 사람들과 어깨를 나란히 하며 내 자리를 다지는',
  output: '재능과 목소리를 밖으로 펼쳐 내는',
  wealth: '새로운 기회를 향해 발을 넓히고 성과를 거두는',
  power: '일과 관계에서 자리가 잡히며 책임이 커지는',
  resource: '배우고 도움받으며 속을 채우는',
};

const FLOW_NOW_TAIL: Record<FlowLevel, string> = {
  high: '흐름이 받쳐 주는 쪽이라 한 걸음 더 내디뎌 볼 만해.',
  mid: '크게 출렁이진 않으니 차분히 다져 두면 좋아.',
  low: '서두르기보다 지킬 건 지키면서 천천히 가는 쪽이 맞아.',
};

const MONTH_TONE: Record<KeyMonthTone, string> = {
  clashDay: '집·일터·가까운 사람 사이의 일정과 약속이 어긋나기 쉬워',
  clashMonth: '일터나 모임에서 내 역할과 자리를 두고 흔들리기 쉬워',
  harmonyDay: '가까운 사람과 마음을 맞춰 손잡을 일이 생기기 쉬워',
  harmonyMonth: '일터나 모임에서 좋은 사람과 일이 한곳에 모이기 쉬워',

  clashYear: '그해의 큰 흐름과 어긋나 계획이 한 번 흔들리기 쉬워',
  harmonyYear: '그해의 큰 흐름과 호흡이 맞아 미뤄 둔 일이 풀리기 쉬워',
};

const MONTH_PREP: Record<KeyMonthTone, string> = {
  clashDay: '약속과 일정은 한 번 더 확인하고, 큰 결정은 며칠 묵혀 두기',
  clashMonth: '맡은 역할과 범위를 미리 말로 정리해 두기',
  harmonyDay: '미뤄 둔 말이나 부탁을 이 달 안에 먼저 꺼내 보기',
  harmonyMonth: '모임이나 소개 자리에 한 번 더 얼굴을 내밀기',
  clashYear: '그 달 일정은 여유를 두고 잡고, 바꿀 수 있는 일은 미리 정해 두기',
  harmonyYear: '미뤄 둔 일 가운데 하나를 이 달에 맞춰 시작해 보기',
};

const CRISIS: Record<GodGroup, string> = {
  peer: '사람 사이 몫을 두고 마음이 상하기 쉬운 해',
  output: '말과 재주를 쏟다 지치기 쉬운 해',
  wealth: '돈과 기회가 새어 나가기 쉬운 해',
  power: '일과 책임에 짓눌리기 쉬운 해',
  resource: '기댈 곳을 놓치고 혼자 끙끙대기 쉬운 해',
};
const CHANCE: Record<GodGroup, string> = {
  peer: '곁에 사람이 모이고 힘을 합치기 좋은 해',
  output: '내 재주와 말이 빛을 보기 좋은 해',
  wealth: '돈과 기회가 손에 잡히기 쉬운 해',
  power: '맡은 일로 인정받기 쉬운 해',
  resource: '배움과 든든한 도움을 얻기 쉬운 해',
};
const FLOW: Record<GodGroup, string> = {
  peer: '사람 사이의 몫을 다시 정하게 되는 해',
  output: '내 재주와 말이 밖으로 나가는 해',
  wealth: '돈과 기회가 움직이는 해',
  power: '일과 책임의 무게가 달라지는 해',
  resource: '배우고 쉬며 기댈 곳을 찾는 해',
};

const TIP_CRISIS: Record<GodGroup, string> = {
  peer: '몫을 나누는 일은 미리 말로 정해 두기',
  output: '말과 일을 쏟는 만큼 쉬는 시간을 먼저 잡기',
  wealth: '들고 나는 돈의 길을 한 번 적어 보기',
  power: '맡을 일의 범위를 먼저 줄여 보기',
  resource: '혼자 끙끙대지 말고 기댈 사람을 미리 정해 두기',
};
const TIP_CHANCE: Record<GodGroup, string> = {
  peer: '함께할 사람을 한 명 더 늘려 보기',
  output: '내 재주를 밖에 한 번 내보이기',
  wealth: '들어온 기회는 작게 먼저 시험해 보기',
  power: '맡은 일의 결과를 눈에 보이게 남겨 두기',
  resource: '배울 것과 도움받을 곳을 적극적으로 찾기',
};
const TIP_FLOW: Record<GodGroup, string> = {
  peer: '비교하기보다 내 몫을 먼저 적어 보기',
  output: '새로 벌이기보다 하던 재주를 다듬기',
  wealth: '크게 벌이기보다 지금 흐름을 지키기',
  power: '책임이 늘면 쉬는 날도 같이 늘리기',
  resource: '배운 것을 하나라도 써 보며 쉬어 가기',
};

const VIBE: Record<GodGroup, string> = {
  peer: '나란히 걷는 친구 같은 사람',
  output: '말과 재주가 환한 사람',
  wealth: '현실 감각이 좋고 챙길 줄 아는 사람',
  power: '중심을 잡아 주는 듬직한 사람',
  resource: '마음을 먼저 살펴 주는 다정한 사람',
};
const TEMPER: Record<Element, string> = {
  wood: '곧고 부드럽게 자라는 결',
  fire: '밝고 열기가 있는 결',
  earth: '느긋하고 믿음직한 결',
  metal: '단정하고 맺고 끊음이 분명한 결',
  water: '말수가 적고 속이 깊은 결',
};
const MEET: Record<GodGroup, string> = {
  peer: '함께 배우고 일하는 자리',
  output: '취미나 모임처럼 말이 오가는 자리',
  wealth: '일과 돈이 오가는 현실의 자리',
  power: '일터나 조직 안',
  resource: '가르치고 배우는 자리, 소개로 닿는 자리',
};

const TYPES: Record<PartnerTypeKey, { name: string; who: string; look: string; ease: string; care: string }> = {
  'resource-bright': {
    name: '강아지상',
    who: '먼저 다가와 챙겨 주는 따뜻한 사람',
    look: '둥글고 살짝 처진 눈매에 환한 눈웃음, 부드러운 턱선이 먼저 눈에 들어와요.',
    ease: '말이 서툰 날에도 눈빛으로 먼저 안부를 물어 줘서, 곁에 있으면 긴장이 풀려요.',
    care: '챙기는 일이 습관이라 자기 몫은 뒤로 미루기 쉬워요. 고맙다는 말을 자주 건네 주세요.',
  },
  'resource-quiet': {
    name: '사슴상',
    who: '말없이 곁을 지키며 살피는 사람',
    look: '크고 맑은 눈과 갸름한 얼굴, 순한 눈빛이 인상적이에요.',
    ease: '재촉하지 않고 기다려 줘서, 마음이 정리될 시간을 얻을 수 있어요.',
    care: '속도가 느긋해서 결정을 미루기 쉬워요. 중요한 일은 날짜를 함께 정해 두면 좋아요.',
  },
  'power-bright': {
    name: '또렷상',
    who: '방향을 정하고 이끄는 사람',
    look: '또렷한 쌍꺼풀과 짙은 눈썹, 깊은 눈매와 오똑한 콧대가 한눈에 들어와요.',
    ease: '갈림길에서 길을 잡아 줘서, 내가 흔들릴 때 기댈 수 있어요.',
    care: '맺고 끊음이 분명해 말투가 세게 들릴 수 있어요. 서운한 일은 그날 안에 풀어 두면 좋아요.',
  },
  'power-quiet': {
    name: '두부상',
    who: '뒤에서 받쳐 주는 믿음직한 사람',
    look: '깨끗하고 담백한 이목구비에 곧은 눈썹, 단정한 인상이에요.',
    ease: '큰소리 없이 약속을 지켜서, 오래 만날수록 마음이 놓여요.',
    care: '표현이 적어 마음을 알기 어려울 때가 있어요. 고마운 일은 말로 한 번 더 건네 보세요.',
  },
  'output-bright': {
    name: '고양이상',
    who: '말과 재치로 판을 밝히는 사람',
    look: '살짝 올라간 눈꼬리와 또렷한 눈매, 장난스러운 입꼬리가 닮은 인상이에요.',
    ease: '같이 있으면 대화가 끊기지 않고, 어색한 자리도 가볍게 풀어 줘요.',
    care: '기분이 빨리 오가서 약속이 가벼워 보일 수 있어요. 중요한 약속은 한 번 더 확인해 두세요.',
  },
  'output-quiet': {
    name: '여우상',
    who: '말수는 적지만 감성이 깊은 사람',
    look: '길고 날렵한 눈매와 갸름한 턱선, 서늘하고 지적인 분위기예요.',
    ease: '짧은 말에도 마음을 담아서, 둘만 나눈 이야기가 오래 남아요.',
    care: '마음을 열기까지 시간이 걸려요. 캐묻기보다 곁에서 기다려 주면 천천히 열려요.',
  },
  peer: {
    name: '토끼상',
    who: '눈높이가 같고 편한 사람',
    look: '동그란 눈과 작고 귀여운 코, 환한 미소가 먼저 보여요.',
    ease: '비교하거나 재지 않고 같은 눈높이에서 웃어 줘서, 있는 그대로 있어도 돼요.',
    care: '편한 사이일수록 선을 잊기 쉬워요. 돈과 시간 같은 몫은 처음에 말로 정해 두면 좋아요.',
  },
  wealth: {
    name: '다람쥐상',
    who: '야무지고 챙길 줄 아는 사람',
    look: '반짝이는 큰 눈과 살짝 도톰한 볼, 똘똘한 인상이에요.',
    ease: '생활을 알뜰히 꾸려 가서, 함께 있으면 일상이 단정해져요.',
    care: '계산이 빨라 따지는 사람처럼 보일 수 있어요. 마음을 쓴 일은 말로 알려 주면 오해가 없어요.',
  },
};

const named = (name: string) => (name.trim() ? name.trim() : null);

export const FATE_KO = {
  stageLabel: { early: '초년기', youth: '청년기', middle: '중년기', late: '말년기' } as Record<StageKey, string>,
  stageAges: { early: '0~19살', youth: '20~39살', middle: '40~59살', late: '60살부터' } as Record<StageKey, string>,
  levelWord: { high: '반가운 때', mid: '고르게 흐르는 때', low: '힘을 아끼는 때' } as Record<FlowLevel, string>,
  kindTag: { crisis: '고비', chance: '기회', shift: '전환', flow: '변화' } as Record<YearKind, string>,

  talk: {
    years: {
      lead: (name: string) => (named(name) ? `${named(name)}, 먼저 앞으로 5년부터 짚어 볼게.` : '먼저 앞으로 5년부터 짚어 볼게.'),

      label: (year: number, thisYear: number) => (year === thisYear ? '올해' : year === thisYear + 1 ? '내년' : `${year}년`),

      says: (label: string, title: string) => `${label}${label === '올해' ? '는' : '은'} ${title.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()}야.`,

      month: (label: string, month: number, tone: KeyMonthTone) => `${label} ${month}월 무렵엔 ${MONTH_TONE[tone]}.`,

      more: (n: number) => `올해와 내년에도 이 밖에 일이 더 있고 ${n}개 해가 더 남았는데, 그건 안쪽 방에서 알려 줄게.`,

      fix: '고비로 보이는 해는 어떻게 넘기면 되는지, 해결법까지 안쪽 풀이에서 꼭 알려 줄게.',
    },
    flow: {
      lead: '이번엔 네 시기별 흐름을 볼게.',
      now(group: GodGroup, level: FlowLevel): string {
        return `지금은 ${FLOW_THEME[group]} 때야. ${FLOW_NOW_TAIL[level]}`;
      },

      next: '다음 장이 언제 열리고 뭐가 달라지는지도 따로 짚어 뒀어.',
      more: '가장 반가운 때와 힘을 아껴야 할 때가 언제인지는 안쪽 방에서 펼쳐 줄게.',
    },
    partner: {
      lead: '마지막으로, 네 곁에 닿을 사람이야.',
      vibe: (g: GodGroup) => `곁에 있을 때는 ${VIBE[g]}일 것 같아.`,
      more: '어디서 닿게 되는지, 그 사람을 놓치지 않으려면 어떻게 해야 하는지는 내가 알려줄게.',
    },
  },

  yearTitle(y: KeyYear): string {
    if (y.clash === 'day') return '가까운 자리(집·일터·가장 가까운 사람)가 덜컹거리기 쉬운 해';
    if (y.clash === 'month') return '일터와 사회 자리가 흔들리기 쉬운 해';
    if (y.kind === 'crisis') return CRISIS[y.group];
    if (y.kind === 'shift') return '10년의 큰 흐름이 바뀌는 문턱의 해';
    if (y.kind === 'chance') return y.harmony ? '좋은 사람과 일거리가 한곳으로 모이기 쉬운 해' : CHANCE[y.group];
    return FLOW[y.group];
  },

  yearTip(y: KeyYear): string {
    if (y.clash === 'day') return '집·일터·가까운 사이의 약속은 한 번 더 확인해 두기';
    if (y.clash === 'month') return '일터의 역할과 인간관계를 미리 정리해 두기';
    if (y.kind === 'crisis') return TIP_CRISIS[y.group];
    if (y.kind === 'shift') return '장이 바뀌는 달 전후로는 큰 결정을 미루지도 서두르지도 않기';
    if (y.kind === 'chance') return y.harmony ? '손을 내미는 사람과 일은 가볍게 먼저 만나 보기' : TIP_CHANCE[y.group];
    return TIP_FLOW[y.group];
  },

  months: {
    at: (month: number) => `${month}월 무렵`,
    tag: { caution: '조심할 달', good: '좋은 달' },
    tone: MONTH_TONE,

    prep: MONTH_PREP,

    both: '내 사주와 그해의 흐름이 같은 쪽을 가리켜서 더 또렷한 달이에요.',
  },
  yearLabel: (year: number, thisYear: number) => (year === thisYear ? `${year}년 · 올해` : year === thisYear + 1 ? `${year}년 · 내년` : `${year}년`),

  partner: {
    keys: { vibe: '곁에 있을 때', temper: '기질', meet: '닿기 쉬운 자리' },
    vibe: (g: GodGroup) => VIBE[g],
    temper: (e: Element) => TEMPER[e],
    meet: (g: GodGroup) => MEET[g],

    types: TYPES,

    faces: { label: '그림 모습 고르기', f: '여자 얼굴', m: '남자 얼굴' },

    typeKeys: { ease: '편한 이유', care: '놓치지 않으려면' },

    alt: (name: string) => `${name} 인상의 예시 그림`,
  },

  drawers: {
    lead: '문 앞에서 서랍 셋만 살짝 열어 뒀어. 안은 흐릿하게만 보여 줄게.',
    hiddenSr: '가려진 말',
    years: {
      head: (name: string) => (named(name) ? `${named(name)}님에게 찾아올 고비와 기회` : '내게 찾아올 고비와 기회'),
      sub: '앞으로 5년, 올해와 내년은 하나씩만 먼저 보여 줄게.',
      more: (n: number) => `올해·내년의 나머지 일과 가려진 ${n}개 해의 이야기는 안쪽 방에서 읽어 줘.`,

      fix: '이 고비를 넘기는 해결법은 안쪽 풀이에서 꼭 알려 줄게.',
    },
    flow: {
      head: (name: string) => (named(name) ? `${named(name)}님의 시기별 흐름` : '내 시기별 흐름'),
      sub: '초년기부터 말년기까지, 어느 때가 반갑고 어느 때가 힘이 드는지 한눈에.',
      locked: '지금은 모양만 살짝 보여 줄게.',
      here: '지금 여기',
      more: '높낮이와 시기마다 챙길 것은 안쪽 방에서 펼쳐 줄게.',
    },
    partner: {
      head: (name: string) => (named(name) ? `${named(name)}님 곁에 닿을 인연의 윤곽` : '내 곁에 닿을 인연의 윤곽'),
      sub: '얼굴은 아직 흐릿해. 기질부터 하나씩 보여 줄게.',
      more: '나머지 윤곽과 그 사람과 편안해지는 법은 안쪽 방에서 이어 줄게.',
    },
  },

  sticky: {
    region: '이어 읽기 바로가기',
    label: '율의 종합 풀이 이어 읽기',
    note: '12절 · 결제 후 바로 시작',
  },

  paid: {
    eyebrow: '풀이 전에 먼저 펼쳐 드려요',
    intro: '무료 결과에서 흐릿하게 가려 두었던 세 가지예요. 이제 모두 열렸어요. 아래 풀이가 이 값을 같은 근거로 풀어 줘요.',
    years: {
      head: '앞으로 5년, 찾아올 고비와 기회',
      sub: '해마다 한 줄, 그해에 눈에 띄는 달과 미리 해 둘 일, 그해를 넘기는 작은 행동 하나예요. 무료에서 가려 두었던 달까지 모두 열었어요.',
      tipLabel: '해 볼 일',

      fixLabel: '넘기는 법',

      prepLabel: '미리',

      noMonths: '이 해에는 눈에 띄게 부딪히거나 어울리는 달이 없어요. 큰 파도 없이 한 해가 흐르는 쪽이에요.',

      focusLabel: '가장 눈에 띄는 달',
      chipsLabel: '이 해에 눈에 띄는 달',

      yearOnlyLabel: '이 해의 흐름과 맞물린 달',
      recurHead: '해마다 돌아오는 달',
      recurNote: '내 사주와 맞물려 눈에 띄는 달은 달 이름으로 정해져서, 해가 바뀌어도 같은 달에 돌아와요. 그해의 흐름과 맞물려 새로 눈에 띄는 달은 해마다 달라서 위의 해마다 줄에 따로 적었어요.',
    },
    flow: {
      head: '인생의 흐름, 시기별로',
      sub: '10년의 장마다 어느 때가 반갑고 어느 때가 힘이 드는지 그려 봤어요.',
      here: '지금 여기',
      best: (a: number, b: number, y1: number, y2: number) => `가장 반가운 장은 ${a}~${b}살(${y1}~${y2}년)이에요.`,
      hardest: (a: number, b: number, y1: number, y2: number) => `힘을 아껴 두면 좋은 장은 ${a}~${b}살(${y1}~${y2}년)이에요.`,
      even: '장마다 높낮이가 크지 않은 편이라, 한 시기에 몰리기보다 고르게 흘러요.',

      next: {
        head: '다음 장의 문턱',
        opens: (year: number, month: number | null, first: boolean) => `${first ? '첫 번째 장이' : '다음 장이'} ${month ? `${year}년 ${month}월 무렵` : `${year}년 무렵`}에 열려요.`,
        dir: {
          up: '지금보다 흐름이 한 칸 올라서는 쪽이에요.',
          down: '지금보다 흐름이 한 칸 내려앉는 쪽이에요.',
          same: '지금과 비슷한 속도로 이어지는 쪽이에요.',
        } as Record<FlowDirection, string>,
        prepLabel: '미리 해 둘 것',
        prep: {
          up: '미뤄 둔 일 가운데 하나를 꺼낼 채비를 해 두기',
          down: '새로 벌이는 일은 줄이고 지킬 것부터 적어 두기',
          same: '하던 일의 기초를 한 겹 더 다져 두기',
        } as Record<FlowDirection, string>,

        firstPrep: '첫 장이 열리기 전까지 배우고 쌓아 둘 것을 하나 정해 두기',
      },

      stageHead: '시기마다 챙길 것',
      stageFocus: {
        early: '배우고 기대며 기반을 쌓는 시기',
        youth: '일과 사람 사이에서 내 자리를 정하는 시기',
        middle: '맡은 것을 지키고 넓혀 가는 시기',
        late: '쌓아 온 것을 나누고 속도를 고르는 시기',
      } as Record<StageKey, string>,
      pace: {
        high: '흐름이 받쳐 주니 미뤄 둔 일 하나를 꺼내 보기',
        mid: '큰 출렁임이 없으니 차분히 다져 두기',
        low: '새로 벌이기보다 지킬 것부터 챙기기',
      } as Record<FlowLevel, string>,
    },
    partner: {
      head: '곁에 닿을 인연의 윤곽',
      sub: '태어난 날의 지지와 태어난 달의 자리에서 읽은 기질이에요. 연인뿐 아니라 오래 곁에 둘 사람 모두에 해당해요.',

      when: {
        head: '닿기 쉬운 때',
        work: (year: number, month: number) => `${year}년 ${month}월 무렵 · 일터나 모임에서 괜찮은 사람이 눈에 띄기 쉬워요.`,
        close: (year: number, month: number) => `${year}년 ${month}월 무렵 · 가까운 사람과 마음이 맞기 쉬워요.`,
        none: '앞으로 5년 사이에는 눈에 띄게 어울리는 달이 없어요. 위의 자리에서 천천히 사람을 만나요.',
        recur: '같은 달은 해마다 돌아와요.',
      },
    },

    calendar: {
      head: '앞으로 열두 달, 한눈에',
      sub: '이번 달부터 열두 달을 한 장에 놓았어요. 달을 누르면 그달의 한 줄이 나와요. 아래 글이 이 달력 그대로, 달마다 더 자세히 풀어 줘요.',
      tag: { good: '마음 열기', caution: '말 아끼기', even: '잔잔해요' },
      detail: {
        harmonyDay: '가까운 사람과 호흡이 착 맞기 쉬운 달이에요. 속으로 굴리던 말, 이달엔 꺼내도 안 져요.',
        harmonyMonth: '일터나 모임에서 괜찮은 사람이 눈에 띄기 쉬운 달이에요. 집에만 있으면 이 달이 아까워요.',
        clashDay: '가까운 사이에서 약속이 꼬이고 말이 삐걱대기 쉬운 달이에요. 서운한 건 입 밖에 내기 전에 한 번만 삼켜요.',
        clashMonth: '일터나 모임에서 내 자리 때문에 괜히 예민해지기 쉬운 달이에요. 그 예민함을 연애 상대한테 풀면 손해예요.',
        even: '큰 파도 없는 달이에요. 그래서 평소 버릇이 그대로 드러나요. 매듭 하나 풀어 두기 딱 좋은 달.',

        clashYear: '그해의 큰 흐름과 정면으로 어긋나는 달이에요. 짜 둔 약속이 한 번 틀어질 수 있으니 일정에 여유를 두고 가요.',
        harmonyYear: '그해의 큰 흐름과 호흡이 맞는 달이에요. 미뤄 둔 마음 표현이나 만남을 이 달에 맞춰 보면 수월해요.',
      },

      prepLabel: '미리 해 둘 것',
      prep: {
        harmonyDay: '미뤄 둔 말이나 부탁을 이 달 안에 먼저 꺼내 보기',
        harmonyMonth: '모임이나 소개 자리에 한 번 더 나가 보기',
        clashDay: '약속은 한 번 더 확인하고, 서운한 말은 하루 묵혔다가 꺼내기',
        clashMonth: '내 역할과 범위를 말로 정리해 두고, 예민한 마음은 상대 앞에서 풀지 않기',
        even: '평소 버릇 하나를 골라 이 달 동안만 바꿔 보기',
        clashYear: '약속과 일정은 여유 있게 잡고, 바뀔 수 있는 건 미리 정해 두기',
        harmonyYear: '미뤄 둔 말이나 만남 하나를 이 달에 맞춰 잡아 보기',
      },
      label: (year: number, month: number) => `${year}년 ${month}월`,
      short: (month: number) => `${month}월`,
    },

    lantern: {
      head: '밤 강에 켜진 여덟 등불',
      sub: '10년의 장 하나가 등불 하나예요. 지나온 장은 낮게 타고, 지금 장은 가장 밝고, 앞으로 올 장은 반가운 정도에 따라 불빛이 달라요. 등불을 눌러 보세요.',
      tag: { past: '지나온 장', now: '지금 지나는 장' },
      title: (n: number, a: number, b: number) => `${n}번째 장 · ${a}~${b}살`,
      ages: (a: number, b: number) => `${a}~${b}살`,
      years: (y1: number, y2: number) => `${y1}~${y2}년`,

      opens: (year: number, month: number | null, state: 'past' | 'now' | 'next') => {
        const when = month ? `${year}년 ${month}월 무렵` : `${year}년 무렵`;
        return state === 'next' ? `${when}에 열려요.` : `${when}에 열렸어요.`;
      },

      prepLabel: '챙길 것',
      prep: {
        high: '미뤄 둔 일 하나를 꺼내 시작하기',
        mid: '하던 일의 기초를 한 겹 더 다져 두기',
        low: '새로 벌이는 일은 줄이고 지킬 것부터 적어 두기',
      } as Record<FlowLevel, string>,
      line(group: GodGroup, level: FlowLevel, state: 'past' | 'now' | 'next'): string {
        const tail: Record<FlowLevel, string> = {
          high: '흐름이 받쳐 주는 쪽이라, 한 걸음 더 내디뎌 볼 만해요.',
          mid: '크게 출렁이진 않아서, 차분히 다져 두면 좋아요.',
          low: '서두르기보다 지킬 건 지키며 천천히 가는 쪽이 맞아요.',
        };
        if (state === 'past') return `${FLOW_THEME[group]} 때였어요. 지금은 이 등불이 낮게 타고 있어요.`;
        return `${FLOW_THEME[group]} 때${state === 'now' ? '예요' : '가 와요'}. ${tail[level]}`;
      },
    },

    heat: {
      head: '열두 등불의 달 온도',
      sub: '2027년 열두 달을 내 안에서 견준 불빛 세기예요. 고른 달이 가운데 밤하늘에 떠요. 등불이나 아래 달을 눌러 보세요.',
      level: { blaze: '환한 달', warm: '따뜻한 달', calm: '잔잔한 달', cool: '숨 고르는 달' },
      turn: { rise: '불이 붙는 달', fall: '불이 잦아드는 달' },
      line: {
        blaze: '내 열두 달 가운데 흐름이 가장 받쳐 주는 쪽이에요. 미뤄 둔 일을 꺼내 보기 좋은 달이에요.',
        warm: '흐름이 따뜻하게 받쳐 주는 달이에요. 하던 일에 한 걸음 더 얹어 볼 만해요.',
        calm: '크게 출렁이지 않는 달이에요. 평소 하던 대로 차분히 다져 두면 좋아요.',
        cool: '내 열두 달 가운데 숨을 고르는 쪽이에요. 새로 벌이기보다 지킬 건 지키며 가요.',
      },
      turnLine: {
        rise: '앞 달보다 흐름이 한 칸 크게 올라서는 달이에요. 분위기가 바뀌는 길목이에요.',
        fall: '앞 달보다 흐름이 한 칸 크게 내려앉는 달이에요. 힘을 아껴 두는 길목이에요.',
      },
      lichun: '이 달 초에 입춘이 들어요. 사주에서는 여기서부터 진짜 새해가 시작돼요.',

      tone: {
        clashDay: '집·일터·가까운 사람 사이에서 일정과 약속이 어긋나기 쉬운 달이에요.',
        clashMonth: '일터나 모임에서 역할과 자리를 두고 흔들리기 쉬운 달이에요.',
        harmonyDay: '가까운 사람과 마음을 맞춰 손잡을 일이 생기기 쉬운 달이에요.',
        harmonyMonth: '일터나 모임에서 좋은 사람과 일이 한곳에 모이기 쉬운 달이에요.',
        clashYear: '그해의 큰 흐름과 어긋나 계획이 한 번 흔들리기 쉬운 달이에요.',
        harmonyYear: '그해의 큰 흐름과 호흡이 맞아 미뤄 둔 일이 풀리기 쉬운 달이에요.',
      } as Record<KeyMonthTone, string>,
      prepLabel: '미리 해 둘 것',
      prep: {
        blaze: '미뤄 둔 일 하나를 이 달에 꺼내 시작하기',
        warm: '하던 일에 한 걸음 더 얹어 보기',
        calm: '평소 하던 대로 기초를 다져 두기',
        cool: '새로 벌이기보다 지킬 것부터 챙기기',
      } as Record<'blaze' | 'warm' | 'calm' | 'cool', string>,
    },

    band: {
      head: '사랑이 열리는 일곱 해',
      sub: '붉은 실에 걸린 등불 일곱 개가 앞으로 일곱 해예요. 가장 가까운 사람의 자리와 사람 자리에서 읽은 흐름이에요. 등불을 누르면 그해에 살펴볼 일이 나와요.',
      level: { open: '마음이 열리는 해', warm: '사람이 따뜻해지는 해', steady: '고요히 다지는 해', tender: '마음이 여려지는 해' },
      best: '가장 활짝',
      line: {
        open: '가장 가까운 사람의 자리에 합이 드는 해예요. 마음을 말로 꺼내면 닿기 쉬운 흐름이에요.',
        warm: '일터나 모임 같은 사람 자리가 따뜻해지는 해예요. 괜찮은 사람이 눈에 띄기 쉬운 흐름이에요.',
        steady: '큰 파도 없이 고요한 해예요. 지금 있는 관계의 버릇을 하나 손보기 좋아요.',
        tender: '가까운 사이나 사람 자리가 흔들리기 쉬운 해예요. 서운함을 쌓아 두지 말고 가볍게 꺼내요.',
      },

      prepLabel: '미리 해 둘 것',
      prep: {
        open: '마음을 말로 꺼낼 자리를 이 해 안에 하나 만들어 두기',
        warm: '일터나 모임 같은 사람 자리를 한두 곳 더 열어 두기',
        steady: '지금 있는 관계의 버릇 하나를 정해 손보기',
        tender: '서운함을 쌓아 두지 말고 그때그때 가볍게 꺼내 두기',
      } as Record<'open' | 'warm' | 'steady' | 'tender', string>,
      themeLabel: '살펴볼 일',
      theme: {
        peer: '서로 눈높이를 맞추는 일',
        output: '마음을 말로 꺼내는 일',
        wealth: '함께하는 시간과 살림을 가늠하는 일',
        power: '약속과 책임의 무게를 가늠하는 일',
        resource: '기대고 기댈 곳을 살피는 일',
      },
      label: (year: number, age: number) => `${year}년 · ${age}살`,
    },

    match: {
      elements: {
        head: '둘의 오행, 겹침과 보완',
        sub: '금빛은 나, 은빛은 상대예요. 오행마다 두 사람의 글자 수를 견줬어요. 오행을 누르면 그 기운에서 둘이 어떻게 만나는지 나와요.',
        me: '나',
        you: '상대',
        name: { wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물' },
        link: { overlap: '겹침', meFills: '내가 채워 줌', youFills: '상대가 채워 줌', none: '비슷함' },
        line: {
          overlap: '{el} 기운은 두 사람 모두 많아요(나 {me}, 상대 {you}). 결이 같아 잘 통하지만, 함께 한쪽으로 치우치기도 쉬워요.',
          meFills: '{el} 기운은 상대에게 없고 내게 있어요(나 {me}, 상대 {you}). 내가 채워 줄 수 있는 기운이에요.',
          youFills: '{el} 기운은 내게 없고 상대에게 있어요(나 {me}, 상대 {you}). 상대가 채워 줄 수 있는 기운이에요.',
          none: '{el} 기운은 두 사람이 비슷하게 갖고 있어요(나 {me}, 상대 {you}). 크게 겹치거나 모자라지 않아요.',
        },
      },
      together: {
        head: '둘이 같이 맞는 달',
        sub: '지금 달부터 열두 달을 두 사람 각자의 사주로 따져 봤어요. 금빛과 은빛이 함께 켜진 달이 같이 맞는 달이에요.',
        me: '나',
        you: '상대',
        kind: { both: '같이 맞는 달', one: '한 사람만 맞는 달', care: '같이 조심할 달', even: '잔잔한 달' },
        summary: { some: '같이 맞는 달이 {n}달 있어요.', none: '같이 맞는 달이 딱 겹치진 않아요. 한 사람씩 맞는 달에 서로 손을 내밀어 보세요.' },
        line: {
          both: '두 사람 모두 흐름이 맞는 달이에요. 같이 뭔가 해 보기 좋아요.',
          one: '{who} 쪽만 흐름이 맞는 달이에요. 맞는 쪽이 먼저 손을 내밀어 보면 좋아요.',
          care: '두 사람 모두 약속이 어긋나기 쉬운 달이에요. 큰 결정은 서로 한 번 더 묻고 가요.',
          even: '큰 파도 없는 달이에요. 평소처럼 나란히 걸어요.',
        },

        side: (who: string, tone: MonthTone) => {
          const t: Record<MonthTone, string> = {
            clashDay: '집·일터·가까운 사람 사이의 약속이 어긋나기 쉬워요',
            clashMonth: '일터나 모임에서 역할과 자리가 흔들리기 쉬워요',
            harmonyDay: '가까운 사람과 마음이 잘 맞기 쉬워요',
            harmonyMonth: '일터나 모임에서 좋은 사람과 일이 모이기 쉬워요',
          };
          return `${who} 쪽은 ${t[tone]}.`;
        },
        prepLabel: '미리 해 둘 것',
        prep: {
          both: '같이 해 보고 싶던 일 하나를 이 달에 날짜까지 잡아 보기',
          one: '맞는 쪽이 먼저 연락하고, 다른 쪽은 맞춰 주는 마음으로 받아 주기',
          care: '큰 결정과 약속은 서로 한 번 더 확인하고, 서운한 말은 하루 묵혔다가 꺼내기',
          even: '평소 같이 하는 일 하나를 정해 꾸준히 이어 가기',
        } as Record<'both' | 'one' | 'care' | 'even', string>,
      },
    },
  },
};

export type FateCopy = typeof FATE_KO;
