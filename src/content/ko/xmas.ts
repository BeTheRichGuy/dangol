import type { Beat } from '@/components/story/types';

const A = '/media/xmas';

export const XMAS_ROW = {
  badge: '크리스마스 한정',
  keeper: '연',
  title: '연의 크리스마스 연애 사주',
  gain: '마음에 둔 그 사람과 이번 크리스마스, 다가갈 날과 건넬 말을 짚어 드려요.',
  art: '/media/xmas/hero-xmas.jpg',
} as const;

export const XMAS = {
  hero: {
    image: `${A}/hero-xmas.jpg`,

    video: `${A}/motion/hero-xmas.mp4`,
    over: '연의 크리스마스 그 사람 사주',
    title: ['마음에 둔 그 사람과', '이번 크리스마스를 보내고 싶다면'],
    sub: '그 사람 마음을 맞히는 대신,\n네가 다가갈 방법을 찾아 줄게.',
  },

  cta: {
    label: '무료로 내 인연의 실 읽어 보기',

    dday: '크리스마스까지 {n}일',

    viewers: '지금까지 {n}명이 조회했어요',

    closed: '올해 크리스마스 사주는 끝났어요',
  },

  hook: [
    {
      kind: 'hook',
      gap: 30,

      lines: [{ text: '눈 오는 날' }, { text: '"눈 온다" 한마디' }, { text: '보내고 싶은 사람,' }, { text: '딱 떠오르죠?', box: true }],
    },
    {
      kind: 'hook',
      gap: 44,
      lines: [{ text: '그 사람 프로필은', small: true }, { text: '종일 들여다보면서', small: true }, { text: '먼저 말은' }, { text: '*못 거는* 거잖아요' }],
    },
  ] satisfies Beat[] as Beat[],

  beats: [
    { kind: 'clock', sub: '크리스마스를 앞둔 겨울', text: '19:10', gap: 40 },
    {
      kind: 'art',
      src: `${A}/01-subway.jpg`,
      ratio: 2 / 3,
      fade: 'both',
      gap: 26,
      notes: [{ text: '퇴근길 2호선.\n오늘따라 케이크 상자만 보인다.', x: 50, y: 80 }],
    },
    {
      kind: 'art',
      src: `${A}/16-earphone.jpg`,
      ratio: 3 / 2,
      slant: 'a',
      gap: 8,
      notes: [{ text: '옆자리 두 사람은\n이어폰을 나눠 끼고 있었다.', x: 36, y: 4 }],
    },
    { kind: 'text', lines: ['뭘 듣고 있을까.'], size: 'sm', gap: 12 },
    {
      kind: 'chat',
      title: '대학 동기 (4)',
      gap: 26,
      lines: [
        { who: '지수', text: '크리스마스에 다들 뭐 해?' },
        { who: '민서', text: '나 데이트 ㅎㅎ' },
        { who: '하린', text: '난 본가' },
        { text: '나는 그냥 집', me: true },
        { who: '민서', text: 'ㅋㅋㅋ 케빈이랑?' },
        { text: 'ㅇㅇ 케빈이랑', me: true },
      ],
    },
    { kind: 'text', lines: ['괜찮다.', '진짜 괜찮다.'], gap: 26 },
    {
      kind: 'art',
      src: `${A}/02-bakery-b.jpg`,
      ratio: 1,
      width: 86,
      side: 'left',
      gap: 34,
      says: [
        { text: '초는 몇 개\n드릴까요?', x: 66, y: 8, tail: 'dl' },
        { text: '…하나만 주세요.', x: 74, y: 98, me: true },
      ],
    },
    { kind: 'text', lines: ['조각 케이크 하나에,', '*초 하나.*'], size: 'lg', gap: 30 },

    {
      kind: 'art',
      src: `${A}/03-alley.jpg`,
      ratio: 2 / 3,
      fade: 'both',
      gap: 50,
      notes: [{ text: '집까지 오 분.\n눈이 온다.', x: 50, y: 14 }],
    },
    { kind: 'text', lines: ['휴대폰을 꺼냈다.'], size: 'sm', gap: 10 },
    { kind: 'typing', to: '그 사람', text: '눈 온다', send: '전송', gap: 10 },
    { kind: 'text', lines: ['다 쓰고 나서도', '*전송을 못 눌렀다.*'], gap: 22 },

    { kind: 'sfx', text: '툭.', side: 'right', gap: 40 },
    {
      kind: 'art',
      src: `${A}/04-finger-c.jpg`,
      ratio: 1,
      slant: 'a',
      gap: 10,
      notes: [{ text: '상자 끈이 풀려 있었다.', x: 50, y: 6 }],
    },
    { kind: 'text', lines: ['끈이 새끼손가락에 감겨 있다.', '반대쪽은 골목 안으로 이어져 있고.'], size: 'sm', gap: 14 },
    { kind: 'me', text: '…뭐야, 이거.', gap: 12 },
    { kind: 'text', lines: ['당겨 봤다.'], gap: 26 },
    { kind: 'text', lines: ['안 딸려 온다.', '저쪽 어딘가에 *걸려 있다.*'], gap: 20 },
    {
      kind: 'art',
      src: `${A}/05-stairs.jpg`,
      ratio: 2 / 3,
      fade: 'top',
      gap: 30,
      notes: [{ text: '끈만 따라왔는데.\n우리 동네에 이런 계단이 있었나?', x: 50, y: 86 }],
    },

    { kind: 'text', lines: ['계단 끝에 방이 있었다.', '붉은 실이 잔뜩 걸린.'], size: 'sm', gap: 44 },
    { kind: 'clip', src: `${A}/motion/room.mp4`, poster: `${A}/06-room.jpg`, ratio: 16 / 9, loop: true, gap: 10 },
    {
      kind: 'art',
      src: `${A}/07-yeon-turn.jpg`,
      ratio: 2 / 3,
      fade: 'bottom',
      gap: 16,
      says: [
        { text: '잠깐.', x: 24, y: 10, tail: 'dr', big: true },
        { text: '아까부터 실 당긴 거,\n너지?', x: 66, y: 80, tail: 'ul' },
      ],
    },
    { kind: 'me', text: '네? 저는 그냥 끈이 풀려서…', gap: 8 },
    {
      kind: 'art',
      src: `${A}/08-yeon-thread-b.jpg`,
      ratio: 1,
      gap: 30,
      says: [
        { text: '그거 끈 아니야.\n네 실이야.', x: 24, y: 2, tail: 'dr', big: true },
        { text: '태어날 때부터\n달고 나온 거.', x: 72, y: 100, tail: 'ul' },
      ],
    },
    {
      kind: 'art',
      src: `${A}/09-sogeum.jpg`,
      ratio: 1,
      width: 64,
      side: 'right',
      slant: 'a',
      gap: 40,
      notes: [{ text: '바구니 안에서는 고양이가\n실에 감긴 채 자고 있다.', x: 30, y: 100 }],
    },
    {
      kind: 'art',
      src: `${A}/10-slack-b.jpg`,
      ratio: 3 / 2,
      gap: 44,
      says: [
        { text: '태어난 해, 달, 날, 시.\n그 넷으로 꼬는 거야.', x: 36, y: 0, tail: 'none' },
        { text: '끊어진 줄 알았지?\n아니야, 그냥 좀 늘어진 거야.', x: 40, y: 102, tail: 'none', big: true },
      ],
    },

    {
      kind: 'art',
      src: `${A}/11-yeon-glance.jpg`,
      ratio: 3 / 2,
      gap: 56,
      says: [{ text: '초는 하나만 받아 왔네?', x: 32, y: 102, tail: 'ur' }],
    },
    { kind: 'me', text: '…보지 마세요.', gap: 12 },
    { kind: 'say', text: '휴대폰은 왜 계속 들고 있어?', gap: 16 },
    { kind: 'me', text: '…눈이 와서요.', gap: 8 },

    { kind: 'say', text: '아.\n보낼 사람은 있는데, 못 보냈구나.', big: true, gap: 14 },
    { kind: 'me', text: '그런 거 아니에요.', gap: 10 },
    { kind: 'say', text: '아니긴.\n아까부터 화면만 켰다 껐다 하던데.', gap: 8 },
    { kind: 'say', text: '누군데?', gap: 8 },
    { kind: 'me', text: '…그냥 아는 사람이요.', gap: 12 },
    {
      kind: 'art',
      src: `${A}/12-yeon-cu.jpg`,
      ratio: 2 / 3,
      hush: true,
      gap: 40,
      says: [
        { text: "그냥 아는 사람한테\n'눈 온다'를 쓰다 말아?", x: 66, y: 60, tail: 'ul' },
        { text: '근데 너,\n그 사람 좋아하잖아.', x: 48, y: 88, tail: 'none', big: true },
      ],
    },
    { kind: 'sfx', text: '뜨끔', side: 'left', gap: 14 },
    { kind: 'text', lines: ['아니라고 하려고 했는데.', '*말이 안 나왔다.*'], gap: 18 },
    {
      kind: 'art',
      src: `${A}/18-yeon-soft.jpg`,
      ratio: 2 / 3,
      fade: 'both',
      gap: 34,
      says: [{ text: '괜찮아.\n여기선 그런 말 해도 돼.', x: 50, y: 82, tail: 'ul', big: true }],
    },

    { kind: 'me', text: '…반대쪽 끝에 그 사람이 있어요?', gap: 30 },
    {
      kind: 'art',
      src: `${A}/13-window.jpg`,
      ratio: 2 / 3,
      fade: 'top',
      gap: 14,

      says: [
        { text: '저쪽 마음은 나도 몰라.\n내가 볼 수 있는 건 네 쪽 실뿐이야.', x: 62, y: 18, tail: 'dl' },
        { text: '대신 네 실이\n어디로 당기는지는 보여.', x: 66, y: 46, tail: 'none' },
        { text: '크리스마스까지\n아직 시간은 있어.', x: 64, y: 96, tail: 'none', big: true },
      ],
    },
    { kind: 'me', text: '언제, 어떻게 해야 돼요?', gap: 22 },
    {
      kind: 'art',
      src: `${A}/14-yeon-hand.jpg`,
      ratio: 2 / 3,
      fade: 'bottom',
      gap: 20,
      says: [{ text: '그건 네 생일을\n알아야 보이지.', x: 50, y: 9, tail: 'dl', big: true }],
    },
  ] satisfies Beat[] as Beat[],

  check: {
    title: '지금 신경 쓰이는\n사람이 있다면',

    close: '하나라도 맞다면,\n이번 크리스마스는 그냥 넘기지 마요.',
    items: [
      '눈 오는 날, 연락하고 싶은 사람이 바로 떠올랐다',
      '그 사람한테 보낼 메시지를 썼다 지운 적이 있다',
      '친구인지 그 이상인지 애매한 사이가 있다',
      '먼저 연락하면 부담스러울까 봐 망설인다',
      '이번 크리스마스는 그 사람이랑 보내고 싶다',
    ],
  },
} as const;
