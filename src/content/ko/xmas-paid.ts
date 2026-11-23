import type { Beat, ChatLine } from '@/components/story/types';
import type { XmasGoal, XmasStage } from '@/lib/xmas/relation';

const A = '/media/xmas/paid2';

export type XmasPlay =
  | { kind: 'hold'; label: string; hint: string; skip: string }
  | { kind: 'lanterns'; hint: string; pull: string; caution: string; still: string }
  | { kind: 'choice'; ask: string; options: readonly { label: string; reply: string }[] }
  | { kind: 'candle'; label: string; hint: string; skip: string }
  | { kind: 'frost'; hint: string; skip: string }
  | {
      kind: 'tie';
      hint: string;
      skip: string;
      done: string;

      frames: { loose: string; mid: string; tied: string };

      points: Record<'' | '-f', { knot: { x: number; y: number }; grab: { x: number; y: number } }>;
    }
  | { kind: 'send'; title: string; to: string; text: string; send: string; replies: readonly ChatLine[] };

export interface XmasChapter {

  title: string;

  line: string;

  open: Beat[];

  tier?: Record<'none' | 'date' | 'full', Beat[]>;

  stage?: Record<XmasStage, Beat[]>;

  stageDefault?: XmasStage;
  play?: XmasPlay;

  playByStage?: Record<XmasStage, XmasPlay>;

  playByPair?: Partial<Record<`${XmasStage}.${XmasGoal}`, XmasPlay>>;

  after?: Beat[];

  goal?: Record<XmasGoal, Beat[]>;

  close?: Beat[];

  closeByStage?: Partial<Record<XmasStage, Beat[]>>;

  afterByStage?: Partial<Record<XmasStage, Beat[]>>;

  late?: boolean;

  card?: 'days' | 'pair';

  face?: string;
}

export const XMAS_DAYS = {
  title: '{from}부터 {to}까지',
  kinds: {
    close: { mark: '○', label: '말 걸기 좋은 날' },
    group: { mark: '○', label: '여럿 모이는 자리에 좋은 날' },
    bloom: { mark: '☆', label: '평소보다 눈에 띄기 쉬운 날' },
    caution: { mark: '△', label: '조금 쉬어 가는 날' },
  },
  weekdays: ['일', '월', '화', '수', '목', '금', '토'],

  date: (m: number, d: number) => `${m}월 ${d}일`,
  month: (y: number, m: number) => `${y}년 ${m}월`,

  special: { '12-24': '이브', '12-25': '크리스마스', '12-31': '마지막 날', '01-01': '새해' } as Record<string, string>,

  count: '하트 표시한 날은 *모두 {n}일*',
  none: '이 기간엔 크게 튀는 날이 없어. 평소대로가 제일 좋아.',
} as const;

export const XMAS_ASK = { day: (d: number) => `${d}일`, or: '이나 ', eve: '오늘', none: '24일 전에\n조용한 날 아무 때나', someday: '그날' } as const;

const lastWalk: Beat[] = [
  {
    kind: 'art',
    src: `${A}/08c-wave.jpg`,
    ratio: 2 / 3,
    fade: 'both',
    gap: 30,
    says: [
      { text: '그 실,\n당분간 풀지 마.', x: 22, y: 50, tail: 'ur' },
      { text: '내년 크리스마스에 또 보자.', x: 64, y: 90, tail: 'ul', big: true },
    ],
  },
  { kind: 'sfx', text: '툭.', side: 'right', gap: 40 },
  { kind: 'art', src: `${A}/08d-alley-alone{me}.jpg`, ratio: 2 / 3, fade: 'both', gap: 10, notes: [{ text: '계단은 감쪽같이 사라지고\n눈만 내렸다.', x: 50, y: 8 }] },
];

const lastSend = (text: string): XmasPlay => ({ kind: 'send', title: '그 사람', to: '그 사람', text, send: '전송', replies: [] });

const ask8 = (text: string): Beat => ({ kind: 'art', src: `${A}/03b-yeon-confident.jpg`, ratio: 1, gap: 12, says: [{ text, x: 50, y: 94, tail: 'ul', big: true }] });

const firstLine = (options: readonly { label: string; reply: string }[]): XmasPlay => ({ kind: 'choice', ask: '첫 줄로 하나 골라 봐.', options });

export const XMAS_PAID = {
  over: '연의 크리스마스 그 사람 사주',
  title: '{name}의 실',
  toc: '목차',

  speaker: '연',

  you: '너',
  skipStory: '이야기 건너뛰고 풀이만 보기',
  showStory: '이야기 다시 보기',
  toMain: '메인 화면으로 돌아가기',

  prologue: [
    { kind: 'clock', sub: '크리스마스를 앞둔 겨울밤', text: '21:40', gap: 18 },
    {
      kind: 'art',
      src: `${A}/00-sleeves.jpg`,
      ratio: 2 / 3,
      fade: 'both',
      gap: 10,
      says: [
        { text: '복채는 잘 받았어.', x: 72, y: 7, tail: 'dl', big: true },
        { text: '자, 이제\n그 사람 얘기해 봐.', x: 66, y: 94, tail: 'ul' },
      ],
    },
    { kind: 'me', text: '…진짜 비밀이에요.', gap: 14 },
    { kind: 'say', text: '내가 누구한테 얘기하겠어.', gap: 10 },
  ] satisfies Beat[] as Beat[],

  chapters: [
    {
      title: '그 사람이 자꾸 마음에 걸리는 이유',
      line: '네가 그 사람한테 끌리는 결, 지금 실이 기운 쪽.',
      face: `${A}/y01.jpg`,
      open: [
        { kind: 'art', src: `${A}/01a-knot-hands.jpg`, ratio: 3 / 2, gap: 24, notes: [{ text: '실을 훑던 손가락이 멈췄다.', x: 50, y: 6 }] },
        { kind: 'say', text: '잠깐.', gap: 8 },
        {
          kind: 'art',
          src: `${A}/01b-knot-lantern.jpg`,
          ratio: 2 / 3,
          fade: 'both',
          gap: 12,
          says: [{ text: '네 쪽 실이\n유난히 팽팽하네.', x: 32, y: 10, tail: 'dr', big: true }],
        },
        { kind: 'me', text: '…그런 것도 보여요?', gap: 8 },
        { kind: 'say', text: '그만큼 네가\n마음을 쓰고 있다는 거지.', big: true, gap: 10 },
      ],

      stage: {
        far: [{ kind: 'say', text: '말도 몇 번 안 해 봤지?\n근데 눈은 계속 그쪽으로 가고.', gap: 10 }],
        friend: [{ kind: 'say', text: '친구라서 더 못 보내는 거구나.\n티 날까 봐.', gap: 10 }],
        daily: [{ kind: 'say', text: '매일 보는데 할 말은 없고.\n그게 제일 답답하지.', gap: 10 }],
        talking: [{ kind: 'say', text: '연락은 하는데,\n그다음이 어렵구나.', gap: 10 }],
        past: [{ kind: 'say', text: '예전엔 그냥 보냈을 텐데.\n지금은 그 한 줄이 무겁지.', gap: 10 }],
      },
      close: [{ kind: 'say', text: '밖으로 나가자.\n둘 사이가 얼마나 먼지,\n밖에서 보면 더 잘 보이거든.', big: true, gap: 30 }],
    },
    {
      title: '지금 둘 사이의 거리',
      line: '지금 두 사람 사이에서 유리한 것과 걸리는 것.',
      face: `${A}/y06.jpg`,
      open: [
        {
          kind: 'art',
          src: `${A}/02a-coat-door.jpg`,
          ratio: 2 / 3,
          fade: 'both',
          gap: 24,
          says: [{ text: '뭐 해?\n안 따라와?', x: 18, y: 23, tail: 'ur', big: true }],
        },
        { kind: 'me', text: '어? 옷 갈아입으셨어요?', gap: 10 },
        { kind: 'say', text: '눈 오는데\n얇게 입고 나갈 순 없잖아.', gap: 8 },
        { kind: 'art', src: `${A}/02b-stairs-down{me}.jpg`, ratio: 3 / 2, gap: 30, notes: [{ text: '올라올 때보다\n내려가는 계단이 훨씬 길었다.', x: 50, y: 88 }] },
        { kind: 'say', text: '너희 사이가\n지금 어디쯤인지 볼까?', gap: 10 },
        { kind: 'me', text: '…저도 잘 모르겠어요.', gap: 8 },
        { kind: 'say', text: '그럼 내가 한번 볼게.', big: true, gap: 8 },
      ],
      close: [{ kind: 'say', text: '거리는 봤고.\n이제 그 사람 실 얘기 좀 하자.', gap: 30 }],
    },
    {
      title: '그 사람과 나, 맞는 데와 걸리는 데',
      line: '두 실을 나란히 놓고 본 결. 생일을 몰라도 그 사람 앞의 너는 보인다.',
      face: `${A}/y05.jpg`,
      card: 'pair',
      open: [
        { kind: 'art', src: `${A}/02c-bridge.jpg`, ratio: 3 / 2, fade: 'bottom', gap: 30, notes: [{ text: '눈 덮인 돌다리를 건넜다.', x: 50, y: 8 }] },
      ],
      tier: {
        none: [
          { kind: 'say', text: '그 사람 생일은\n모른다고 했지?', gap: 10 },
          { kind: 'me', text: '…네, 몰라요.', gap: 8 },
          { kind: 'say', text: '괜찮아.\n그럼 그 사람 실은 안 건드릴게.', gap: 10 },
          {
            kind: 'art',
            src: `${A}/03c-one-thread.jpg`,
            ratio: 2 / 3,
            fade: 'both',
            gap: 12,
            says: [{ text: '대신 그 사람 앞에서\n네 실이 어떻게 구는지는 다 보여.', x: 60, y: 92, tail: 'ul', big: true }],
          },
        ],
        date: [
          { kind: 'say', text: '네가 알려 준\n그 사람 생일도 같이 볼게.', gap: 10 },
          { kind: 'me', text: '태어난 시간까지는 모르겠어요.', gap: 8 },
          { kind: 'say', text: '괜찮아. 모르는 건 비워 두고,\n보이는 데까지만 맞춰 볼게.', gap: 10 },
          {
            kind: 'art',
            src: `${A}/03c-two-threads.jpg`,
            ratio: 2 / 3,
            fade: 'both',
            gap: 12,
            says: [{ text: '두 실을\n나란히 놓고 보자.', x: 64, y: 92, tail: 'ul', big: true }],
          },
        ],
        full: [
          { kind: 'say', text: '그 사람은 태어난 시간까지\n알려 줬지?', gap: 10 },
          { kind: 'me', text: '네, 그것까지는 알아요.', gap: 8 },
          { kind: 'say', text: '그럼 네 가닥 다 맞춰 볼 수 있겠다.', gap: 10 },
          {
            kind: 'art',
            src: `${A}/03c-two-threads.jpg`,
            ratio: 2 / 3,
            fade: 'both',
            gap: 12,
            says: [{ text: '두 실을\n나란히 놓고 보자.', x: 64, y: 92, tail: 'ul', big: true }],
          },
        ],
      },
      close: [{ kind: 'say', text: '결은 봤고.\n이번엔 날짜를 보자.', gap: 30 }],
    },
    {
      title: '크리스마스까지, 날짜로',
      line: '오늘부터 1월까지, 말 걸기 좋은 날과 쉬어 갈 날.',
      face: `${A}/y02.jpg`,
      card: 'days',
      open: [
        { kind: 'art', src: `${A}/s02-notebook.jpg`, ratio: 2 / 3, width: 84, side: 'right', shape: 'soft', gap: 24 },
        { kind: 'say', text: '크리스마스 전에\n참고할 날들을 짚어 줄게.', gap: 4 },
      ],
      after: [{ kind: 'say', text: '동그라미는 연락하기 괜찮은 날,\n세모는 조금 쉬어 가는 날이야.', big: true, gap: 12 }],
      close: [{ kind: 'say', text: '날짜는 봤고.\n이제 어디서, 어떻게 다가갈지 보자.', gap: 30 }],
    },
    {
      title: '그 사람에게 자연스럽게 다가가는 자리',
      line: '둘이 자연스럽게 겹칠 수 있는 자리와 거기서 할 것.',
      face: `${A}/y09.jpg`,
      open: [
        { kind: 'art', src: `${A}/04a-market{me}.jpg`, ratio: 3 / 2, fade: 'both', gap: 24, notes: [{ text: '거리엔 사람이 넘쳤다.\n손끝마다 희미한 실이 스쳤다.', x: 50, y: 8 }] },
        { kind: 'say', text: '봐. 저 사람들도\n저마다 이어진 실이 있어.', gap: 10 },
        { kind: 'art', src: `${A}/s05-glances{me}.jpg`, ratio: 3 / 2, slant: 'b', gap: 16 },
        { kind: 'say', text: '괜히 시선이 신경 쓰이지?\n근데 너, 생각보다 눈에 띄어.', big: true, gap: 8 },
        { kind: 'me', text: '…그 사람 눈에도\n제가 그렇게 보일까요?', gap: 10 },
        { kind: 'say', text: '그건 그 사람한테 물어봐야지.', gap: 8 },
        { kind: 'say', text: '대신 네가 편해지는 자리는\n알려 줄 수 있어.', big: true, gap: 6 },
        { kind: 'art', src: `${A}/06b-window-wipe.jpg`, ratio: 2 / 3, fade: 'bottom', gap: 18, says: [{ text: '이 창에 낀 성에\n좀 닦아 볼래?', x: 28, y: 8, tail: 'dr' }] },
      ],
      play: { kind: 'frost', hint: '창에 낀 성에를 닦아 보세요', skip: '바로 보기' },
      after: [
        { kind: 'say', text: '봐.\n너한텐 이런 데가 잘 맞아.', big: true, gap: 16 },
        { kind: 'say', text: '그 사람이랑도 이런 데서\n자연스럽게 마주쳐 봐.', gap: 10 },
      ],
      close: [{ kind: 'say', text: '근데 그 사람 생각만 하면,\n평소 같지가 않지?', gap: 30 }],
    },
    {
      title: '그 사람 앞에서 나오는 내 버릇',
      line: '다가갈 만하면 네가 먼저 미루는 순간과 대신 할 것.',
      face: `${A}/y07.jpg`,
      open: [
        {
          kind: 'art',
          src: `${A}/04b-yeon-point.jpg`,
          ratio: 2 / 3,
          fade: 'both',
          gap: 24,
          says: [
            { text: '저기 꼬인 실 보여?', x: 30, y: 10, tail: 'dr' },
            { text: '네 쪽에서 꼬인 거야.', x: 64, y: 92, tail: 'ul', big: true },
          ],
        },
        { kind: 'me', text: '…제 쪽이요?', gap: 8 },
        { kind: 'say', text: '마음이 복잡해지면\n실도 저렇게 꼬이거든.', gap: 10 },
        { kind: 'art', src: `${A}/s07-tug{me}.jpg`, ratio: 3 / 2, fade: 'both', gap: 12 },
        { kind: 'say', text: '괜히 기대했다가,\n또 혼자 마음 접고.', big: true, gap: 8 },
      ],
      close: [{ kind: 'say', text: '그 버릇 하나만 내려놓고,\n딱 한 줄 써 보자.', big: true, gap: 30 }],
    },
    {
      title: '먼저 연락해도 될까',
      line: '보낼지, 무엇을, 어떤 말투로. 첫 줄 고르기.',
      face: `${A}/y03.jpg`,
      open: [
        {
          kind: 'art',
          src: `${A}/07c-phone-peek{me}.jpg`,
          ratio: 3 / 2,
          gap: 24,
          says: [{ text: '첫 문장이\n제일 어렵지?', x: 74, y: 90, tail: 'ul', big: true }],
        },
        { kind: 'me', text: '…네. 뭐라고 해야 할지\n모르겠어요.', gap: 10 },
        { kind: 'say', text: '그럼 같이 골라 보자.', gap: 8 },
      ],

      playByStage: {
        far: firstLine([
          { label: '혹시 아까 그거, 어디서 찾았어요?', reply: '좋아. 이미 있던 얘기에 붙이면 부담이 없어.' },
          { label: '혹시 이번 주 모임 와요?', reply: '좋아. 여럿 있는 자리부터 묻는 거, 지금 딱 맞아.' },
          { label: '사실 예전부터 신경 쓰였어요.', reply: '그건 아직 일러. 말 몇 번 더 섞고 나서.' },
        ]),
        friend: firstLine([
          { label: '야, 눈 온다', reply: '평소 말투 그대로. 친구한테 제일 자연스러운 첫 줄이야.' },
          { label: '이번 주에 둘이 밥 먹을래?', reply: '좋아. 대신 무겁지 않게, 평소처럼 던져.' },
          { label: '우리 사이 좀 애매하지 않아?', reply: '그건 첫 줄로 하기엔 커. 얼굴 보고 하자.' },
        ]),
        daily: firstLine([
          { label: '아까 고마웠어요. 덕분에 살았어요.', reply: '좋아. 오늘 있었던 일에서 시작하면 어색하지 않아.' },
          { label: '내일 점심 같이 먹을래요?', reply: '좋아. 늘 보는 데서 한 걸음만 나가는 거야.' },
          { label: '요즘 자꾸 신경 쓰여요.', reply: '그건 거기선 하지 마. 내일도 얼굴 봐야 하잖아.' },
        ]),
        talking: firstLine([
          { label: '저번에 말한 데, 같이 가 볼래요?', reply: '좋아. 이미 나눈 얘기를 약속으로 바꾸는 거야.' },
          { label: '이번 주말에 시간 있어요?', reply: '괜찮아. 날짜를 두 개쯤 짚어서 물으면 더 좋아.' },
          { label: 'ㅋㅋ 그러게요', reply: '그건 대답이지 첫 줄이 아니야. 질문을 하나 붙여.' },
        ]),
        past: firstLine([
          { label: '잘 지내? 눈 오길래 생각났어.', reply: '좋아. 가볍고, 답 안 해도 괜찮은 한 줄이야.' },
          { label: '그때 일은 내가 미안했어.', reply: '그건 첫 줄엔 무거워. 답이 오고 나서.' },
          { label: '우리 다시 만나 볼래?', reply: '너무 빨라. 오늘은 안부까지만.' },
        ]),
      },
      after: [{ kind: 'say', text: '좋아.\n이제 너무 오래 고민하진 말자.', big: true, gap: 16 }],
      close: [{ kind: 'say', text: '첫 줄은 정했고.\n이제 약속 얘기 해 보자.', gap: 30 }],
    },
    {
      title: '크리스마스 약속, 이렇게 잡아',
      line: '약속 잡기 좋은 날, 건넬 말, 대답이 애매할 때.',
      face: `${A}/y04b.jpg`,
      open: [
        { kind: 'me', text: '그럼 크리스마스에\n만나자고 해 볼까요?', gap: 24 },
        { kind: 'say', text: '바로 크리스마스 당일을?', gap: 8 },
        { kind: 'say', text: '아직 약속도 없는데 그날만 딱 집으면\n부담스러울 수 있지.', gap: 8 },
      ],

      stage: {
        far: [ask8('{ask}쯤엔 둘이 말고,\n여럿 모이는 자리부터 물어봐.')],
        friend: [ask8('약속 잡기 좋은 날은 {ask}.\n그때 미리 물어봐 둬.')],
        daily: [ask8('약속 잡기 좋은 날은 {ask}.\n그때 밖에서 잠깐 보자고 물어봐.')],
        talking: [ask8('약속 잡기 좋은 날은 {ask}.\n그때 미리 물어봐 둬.')],
        past: [ask8('{ask}쯤엔 약속 말고,\n안부 한 줄만 보내 봐.')],
      },
      stageDefault: 'talking',
      close: [{ kind: 'say', text: '그리고 이것만은 꼭 기억해.', gap: 30 }],
    },
    {
      title: '이것만은 하지 마',
      line: '관계를 망치기 쉬운 행동 셋과, 한 발 물러설 때.',
      face: `${A}/y10.jpg`,
      open: [
        { kind: 'art', src: `${A}/05a-bench{me}.jpg`, ratio: 3 / 2, gap: 20 },
        { kind: 'say', text: '이건 네가 혼자\n오래 붙잡고 있던 걱정이야.', gap: 8 },
        { kind: 'me', text: '…그런 것도 실에 남아요?', gap: 10 },
        { kind: 'say', text: '망설인 흔적은 다 남거든.', gap: 8 },
        { kind: 'art', src: `${A}/05b-frayed.jpg`, ratio: 3 / 2, gap: 22, notes: [{ text: '끝이 하나같이\n똑같은 모양으로 해져 있었다.', x: 30, y: 90 }] },
        { kind: 'say', text: '봐. 늘 비슷한 데서 멈췄지?', big: true, gap: 10 },
        { kind: 'me', text: '…이번에도 그럴까요?', gap: 10 },
        { kind: 'say', text: '똑같이 하면.', gap: 8 },
        { kind: 'say', text: '이번엔 같은 데서\n또 멈추지 말자.', big: true, gap: 6 },
      ],
    },
    {
      title: '네 쪽의 매듭',
      line: '그 사람 마음은 못 묶어. 네가 한 발 내딛는 매듭.',
      face: `${A}/y08.jpg`,
      open: [
        { kind: 'say', text: '손 한번 줘 봐.', gap: 30 },
        { kind: 'art', src: `${A}/07a-bracelet{me}.jpg`, ratio: 3 / 2, gap: 14, notes: [{ text: '연이 내 손목에 실을 감았다.', x: 50, y: 92 }] },
        { kind: 'me', text: '이러면 그 사람이랑\n이어지는 거예요?', gap: 10 },
        { kind: 'say', text: '아니.\n그런 걸 보장하는 실은 없어.', gap: 8 },
        { kind: 'say', text: '남의 마음까지 묶는 매듭은\n나도 못 묶어.', big: true, gap: 8 },
      ],
      play: {
        kind: 'tie',
        hint: '늘어진 실 끝을 잡아 노란 매듭 자리로 끌어 보세요',
        skip: '건너뛰기',
        done: '묶었다.',
        frames: { loose: `${A}/07t-loose{me}.jpg`, mid: `${A}/07t-mid{me}.jpg`, tied: `${A}/07t-tied{me}.jpg` },
        points: {
          '': { knot: { x: 47, y: 59 }, grab: { x: 78, y: 82 } },
          '-f': { knot: { x: 45, y: 55 }, grab: { x: 74, y: 78 } },
        },
      },
      after: [{ kind: 'say', text: '이건 네 마음이\n도망가지 않게 묶는 매듭이야.', gap: 14 }],

      goal: {
        meet: [
          { kind: 'art', src: `${A}/07b-yeon-serious.jpg`, ratio: 2 / 3, fade: 'both', gap: 22, says: [{ text: '보자고 할까\n말까 할 때,', x: 30, y: 10, tail: 'dr', big: true }, { text: '한 번은\n말하는 쪽으로.', x: 66, y: 92, tail: 'ul', big: true }] },
          { kind: 'me', text: '그런데 답이 없으면요?', gap: 10 },
          { kind: 'say', text: '그럼 그날은 거기까지만.', gap: 8 },
          { kind: 'say', text: '그래도 먼저 물어본 건\n그대로 남아.', big: true, gap: 8 },
        ],
        closer: [
          { kind: 'art', src: `${A}/07b-yeon-serious.jpg`, ratio: 2 / 3, fade: 'both', gap: 22, says: [{ text: '말 걸까\n말까 할 때,', x: 30, y: 10, tail: 'dr', big: true }, { text: '한 번은\n거는 쪽으로.', x: 66, y: 92, tail: 'ul', big: true }] },
          { kind: 'me', text: '어색해지면요?', gap: 10 },
          { kind: 'say', text: '어색한 건 하루면 가.', gap: 8 },
          { kind: 'say', text: '안 하면 계속\n거기서 맴돌아.', big: true, gap: 8 },
        ],
        confess: [
          { kind: 'art', src: `${A}/07b-yeon-serious.jpg`, ratio: 2 / 3, fade: 'both', gap: 22, says: [{ text: '말할까\n말까 할 때,', x: 30, y: 10, tail: 'dr', big: true }, { text: '한 번은\n말하는 쪽으로.', x: 66, y: 92, tail: 'ul', big: true }] },
          { kind: 'say', text: '대신 대답을 바로 달라고 하진 마.', gap: 10 },
          { kind: 'me', text: '아니라고 하면요?', gap: 10 },
          { kind: 'say', text: '그럼 그게 대답이야.', gap: 8 },
          { kind: 'say', text: '그래도 네가 한 말은\n그대로 남아.', big: true, gap: 8 },
        ],
        decide: [
          { kind: 'art', src: `${A}/07b-yeon-serious.jpg`, ratio: 2 / 3, fade: 'both', gap: 22, says: [{ text: '이어 갈지,\n여기서 놓을지.', x: 30, y: 10, tail: 'dr', big: true }, { text: '어느 쪽이든\n네가 정해.', x: 66, y: 92, tail: 'ul', big: true }] },
          { kind: 'me', text: '못 정하겠으면요?', gap: 10 },
          { kind: 'say', text: '그럼 한 번만 해 보고 정해.', gap: 8 },
          { kind: 'say', text: '해 보고 아니면,\n그때 놓아도 안 늦어.', big: true, gap: 8 },
        ],
      },
    },
    {
      title: '크리스마스 이후의 너에게',
      line: '결과가 어떻든, 그다음. 연이 남기는 편지.',
      face: `${A}/y11.jpg`,
      open: [
        { kind: 'art', src: `${A}/08a-stairs-bottom{me}.jpg`, ratio: 2 / 3, fade: 'both', gap: 30, notes: [{ text: '계단 맨 아래.', x: 50, y: 6 }] },
        { kind: 'me', text: '그럼 그쪽은요?\n그쪽 실은 어디로 가요?', gap: 12 },
        {
          kind: 'art',
          src: `${A}/08b-yeon-pinky.jpg`,
          ratio: 2 / 3,
          gap: 16,
          says: [
            { text: '내 손엔\n실이 안 보이지?', x: 26, y: 7, tail: 'dr' },
            { text: '남의 실은 잘 보여도,\n내 건 안 보이더라.', x: 66, y: 92, tail: 'ul' },
          ],
        },
        { kind: 'me', text: '…그럼 안 외로워요?', gap: 12 },
        { kind: 'say', text: '그러니까 너는\n네 마음 모른 척하지 마.', big: true, gap: 10 },
      ],

      close: [
        ...lastWalk,
        { kind: 'text', lines: ['휴대폰을 꺼냈다.', '아까 못 보낸 한 줄이 그대로 있었다.'], size: 'sm', gap: 20 },
        { kind: 'text', lines: ['평소 같으면 거기서 멈췄을 거다.', '*오늘은 한 줄을 더 붙였다.*'], size: 'sm', gap: 14 },
      ],

      closeByStage: {
        far: [
          ...lastWalk,
          { kind: 'text', lines: ['휴대폰을 꺼냈다.', '아까 쓴 한 줄이 그대로 있었다.'], size: 'sm', gap: 20 },
          { kind: 'text', lines: ['근데 아직은,', '*메시지를 보낼 만큼 가까운 사이가 아니었다.*'], size: 'sm', gap: 14 },
          { kind: 'text', lines: ['휴대폰을 넣었다.', '대신 하나만 정했다.'], size: 'sm', gap: 14 },
        ],
      },
      late: true,

      playByStage: {
        far: { kind: 'hold', label: '다음에 마주치면 먼저 인사하기', hint: '꾹 눌러서 다짐해 보세요', skip: '건너뛰기' },
        friend: lastSend('눈 온다. 갑자기 너 생각나서'),
        daily: lastSend('눈 온다. 보자마자 생각나서'),
        talking: lastSend('눈 온다. 보자마자 생각나서'),
        past: lastSend('눈 온다. 잘 지내지?'),
      },
      after: [
        { kind: 'text', lines: ['답은 아직이다.', '*그래도 보냈다.*'], gap: 24 },
        { kind: 'text', lines: ['크리스마스까지, 아직 날이 있다.'], size: 'lg', gap: 40 },
      ],
      afterByStage: {
        far: [
          { kind: 'text', lines: ['아직 답은 모른다.', '*그래도 이제, 피하지만은 않기로 했다.*'], gap: 24 },
          { kind: 'text', lines: ['크리스마스까지, 아직 날이 있다.'], size: 'lg', gap: 40 },
        ],
      },
    },
  ] satisfies XmasChapter[] as XmasChapter[],
} as const;

export const XMAS_MEET: Record<'peer' | 'output' | 'wealth' | 'power' | 'resource', string> = {
  peer: '같이 배우고\n같이 일하는 곳',
  output: '좋아하는 걸 하러\n모이는 곳',
  wealth: '일하다가\n자연스럽게 마주치는 곳',
  power: '회사나\n정해진 모임 같은 곳',
  resource: '배우러 가는 곳,\n소개받는 자리',
};

export const XMAS_CONTENTS = XMAS_PAID.chapters.map((c) => ({ title: c.title, line: c.line }));

export const XMAS_PAIR = {
  title: '재미로 보는 두 사람 궁합 점수',

  note: '재미로 보는 점수예요. 둘이 이어질 확률이 아니에요. 같은 두 생일이면 언제 봐도 같아요.',
} as const;

export const XMAS_REVIEW = {
  title: '연한테 남기는 한마디',
  note: '어땠는지 별점이랑 한 줄만 남겨 줘.',
  reward: '남겨 주면 등불 3개를 넣어 줄게.\n등불로 연이랑 1대1로 이야기할 수 있어. (풀이마다 한 번)',
  rewardGuest: '로그인하고 남기면 등불 3개를 받아요.\n등불로 연이랑 1대1로 이야기할 수 있어요.',
  thanks: '남겨 줘서 고마워.',
  thanksReward: '고마워. 등불 3개 넣어 뒀어.\n그 사람 얘기, 더 궁금한 거 있으면 직접 물어봐.',
  chat: { href: '/chat/yeon', label: '연이랑 1대1로 이야기하기' },
} as const;

export const XMAS_KEEP = {
  title: '내 크리스마스 카드',
  lead: '캡처 대신 저장해 두고, 그날 꺼내 봐.',
  save: '카드 저장하기',
  saved: '저장했어요',
  card: {
    over: '연의 크리스마스 그 사람 사주',
    name: '{name}의 실',

    now: '지금 우리 사이',

    ask: {
      far: '여럿 모이는 자리, 물어볼 날',
      friend: '크리스마스 약속, 미리 물어볼 날',
      daily: '밖에서 잠깐 보자고 물어볼 날',
      talking: '크리스마스 약속, 미리 물어볼 날',
      past: '안부 한 줄 보낼 날',
    } satisfies Record<XmasStage, string>,
    days: '말 걸기 좋은 날',
    rest: '조금 쉬어 갈 날',
    pair: '두 사람 궁합 점수',
    pairNote: '재미로 보는 점수',
    word: '연의 한마디',
    foot: 'DANGOL · 재미로 보는 사주',
  },

  words: {
    meet: '보자고 할까 말까 할 때, 한 번은 말하는 쪽으로.',
    closer: '말 걸까 말까 할 때, 한 번은 거는 쪽으로.',
    confess: '말할까 말까 할 때, 한 번은 말하는 쪽으로.',
    decide: '이어 갈지, 놓을지. 어느 쪽이든 네가 정해.',
  } satisfies Record<XmasGoal, string>,
  file: 'dangol-xmas-card.png',
} as const;
