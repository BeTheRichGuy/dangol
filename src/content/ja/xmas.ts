import type { Beat } from '@/components/story/types';
import type { XmasLandingCopy, XmasRowCopy } from '../xmas';

const A = '/media/xmas';

export const XMAS_ROW_JA: XmasRowCopy = {
  badge: 'クリスマス限定',
  keeper: 'ヨン',
  title: 'ヨンのクリスマス恋愛占い',
  gain: '気になるあの人と過ごすクリスマスへ。近づく日と、かける言葉を読みます。',
  art: '/media/xmas/hero-xmas.jpg',
};

export const XMAS_JA: XmasLandingCopy = {
  hero: {
    image: `${A}/hero-xmas.jpg`,
    video: `${A}/motion/hero-xmas.mp4`,
    over: 'ヨンのクリスマス恋愛占い',
    title: ['気になるあの人と', '今年のクリスマスを'],
    sub: 'あの人の気持ちを当てるかわりに、\nあなたから近づく方法を見つけるよ。',
  },
  cta: {
    label: '無料で赤い糸を読む',
    dday: 'クリスマスまであと{n}日',
    viewers: 'これまでに{n}人が無料占いをチェックしました',
    closed: '今年のクリスマス占いは終了しました',
  },
  hook: [
    {
      kind: 'hook',
      gap: 30,
      lines: [{ text: '雪の日に' }, { text: '「雪降ってる」って' }, { text: '送りたい人、' }, { text: 'いますよね？', box: true }],
    },
    {
      kind: 'hook',
      gap: 44,
      lines: [{ text: 'あの人のプロフィールは', small: true }, { text: '何度も見ちゃうのに', small: true }, { text: '自分からは' }, { text: '*送れない*んですよね' }],
    },
  ] satisfies Beat[] as Beat[],

  beats: [
    { kind: 'clock', sub: 'クリスマス前の冬', text: '19:10', gap: 40 },
    {
      kind: 'art',
      src: `${A}/01-subway.jpg`,
      ratio: 2 / 3,
      fade: 'both',
      gap: 26,
      notes: [{ text: '帰りの電車。\n今日はやけにケーキの箱ばかり目に入る。', x: 50, y: 80 }],
    },
    {
      kind: 'art',
      src: `${A}/16-earphone.jpg`,
      ratio: 3 / 2,
      slant: 'a',
      gap: 8,
      notes: [{ text: '隣の二人は\nイヤホンを片方ずつ分けていた。', x: 36, y: 4 }],
    },
    { kind: 'text', lines: ['何を聴いてるんだろう。'], size: 'sm', gap: 12 },
    {
      kind: 'chat',
      title: '大学の同期 (4)',
      gap: 26,
      lines: [
        { who: 'さき', text: 'クリスマスみんな何すんの？' },
        { who: 'みお', text: 'デート〜' },
        { who: 'ゆい', text: '実家帰る' },
        { text: '家でのんびり', me: true },
        { who: 'みお', text: 'ケンタッキーと？笑' },
        { text: 'うん、ケンタッキーと', me: true },
      ],
    },
    { kind: 'text', lines: ['平気。', 'ほんとに平気。'], gap: 26 },
    {
      kind: 'art',
      src: `${A}/02-bakery-b.jpg`,
      ratio: 1,
      width: 86,
      side: 'left',
      gap: 34,
      says: [
        { text: 'ろうそくは\n何本お付けしますか？', x: 66, y: 8, tail: 'dl' },
        { text: '…一本で。', x: 74, y: 98, me: true },
      ],
    },
    { kind: 'text', lines: ['ショートケーキひとつに、', '*ろうそく一本。*'], size: 'lg', gap: 30 },

    {
      kind: 'art',
      src: `${A}/03-alley.jpg`,
      ratio: 2 / 3,
      fade: 'both',
      gap: 50,
      notes: [{ text: '家まであと五分。\n雪が降ってきた。', x: 50, y: 14 }],
    },
    { kind: 'text', lines: ['スマホを取り出した。'], size: 'sm', gap: 10 },
    { kind: 'typing', to: 'あの人', text: '雪降ってる', send: '送信', gap: 10 },
    { kind: 'text', lines: ['打ち終わっても、', '*送信が押せなかった。*'], gap: 22 },

    { kind: 'sfx', text: 'くいっ', side: 'right', gap: 40 },
    {
      kind: 'art',
      src: `${A}/04-finger-c.jpg`,
      ratio: 1,
      slant: 'a',
      gap: 10,
      notes: [{ text: '箱のひもがほどけていた。', x: 50, y: 6 }],
    },
    { kind: 'text', lines: ['ひもが小指に巻きついている。', '反対側は路地の奥へ続いていて。'], size: 'sm', gap: 14 },
    { kind: 'me', text: '…なにこれ。', gap: 12 },
    { kind: 'text', lines: ['引っぱってみた。'], gap: 26 },
    { kind: 'text', lines: ['びくともしない。', '向こうのどこかに*引っかかってる。*'], gap: 20 },
    {
      kind: 'art',
      src: `${A}/05-stairs.jpg`,
      ratio: 2 / 3,
      fade: 'top',
      gap: 30,
      notes: [{ text: 'ひもをたどってきただけなのに。\nこの辺にこんな階段、あったっけ？', x: 50, y: 86 }],
    },

    { kind: 'text', lines: ['階段の上に部屋があった。', '赤い糸がいっぱいに掛かった部屋。'], size: 'sm', gap: 44 },
    { kind: 'clip', src: `${A}/motion/room.mp4`, poster: `${A}/06-room.jpg`, ratio: 16 / 9, loop: true, gap: 10 },
    {
      kind: 'art',
      src: `${A}/07-yeon-turn.jpg`,
      ratio: 2 / 3,
      fade: 'bottom',
      gap: 16,
      says: [
        { text: 'ちょっと待って。', x: 24, y: 10, tail: 'dr', big: true },
        { text: 'さっきから糸を引っぱってたの、\nあなたでしょ？', x: 66, y: 80, tail: 'ul' },
      ],
    },
    { kind: 'me', text: 'え？ 箱のひもがほどけただけで…', gap: 8 },
    {
      kind: 'art',
      src: `${A}/08-yeon-thread-b.jpg`,
      ratio: 1,
      gap: 30,
      says: [
        { text: 'それ、ひもじゃないよ。\nあなたの糸。', x: 24, y: 2, tail: 'dr', big: true },
        { text: '生まれたときから\nつけてるやつ。', x: 72, y: 100, tail: 'ul' },
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
      notes: [{ text: 'かごの中では子猫が\n糸にからまったまま眠っている。', x: 30, y: 100 }],
    },
    {
      kind: 'art',
      src: `${A}/10-slack-b.jpg`,
      ratio: 3 / 2,
      gap: 44,
      says: [
        { text: '生まれた年、月、日、時間。\nその四つでよった糸なの。', x: 36, y: 0, tail: 'none' },
        { text: '切れたと思ってた？\nちがうよ、ちょっとたるんでるだけ。', x: 40, y: 102, tail: 'none', big: true },
      ],
    },

    {
      kind: 'art',
      src: `${A}/11-yeon-glance.jpg`,
      ratio: 3 / 2,
      gap: 56,
      says: [{ text: 'ろうそく、一本だけもらってきたんだ？', x: 32, y: 102, tail: 'ur' }],
    },
    { kind: 'me', text: '…見ないでください。', gap: 12 },
    { kind: 'say', text: 'スマホはなんでずっと握ってるの？', gap: 16 },
    { kind: 'me', text: '…雪が降ってるので。', gap: 8 },
    { kind: 'say', text: 'ああ。\n送りたい人はいるのに、送れなかったんだ。', big: true, gap: 14 },
    { kind: 'me', text: 'そういうんじゃないです。', gap: 10 },
    { kind: 'say', text: 'そう？\nさっきから画面つけたり消したりしてたのに。', gap: 8 },
    { kind: 'say', text: '誰なの？', gap: 8 },
    { kind: 'me', text: '…ただの知り合いです。', gap: 12 },
    {
      kind: 'art',
      src: `${A}/12-yeon-cu.jpg`,
      ratio: 2 / 3,
      hush: true,
      gap: 40,
      says: [
        { text: 'ただの知り合いに\n「雪降ってる」って打ちかける？', x: 66, y: 60, tail: 'ul' },
        { text: 'でもあなた、\nあの人のこと好きでしょ。', x: 48, y: 88, tail: 'none', big: true },
      ],
    },
    { kind: 'sfx', text: 'ドキッ', side: 'left', gap: 14 },
    { kind: 'text', lines: ['ちがうって言おうとしたのに。', '*言葉が出てこなかった。*'], gap: 18 },
    {
      kind: 'art',
      src: `${A}/18-yeon-soft.jpg`,
      ratio: 2 / 3,
      fade: 'both',
      gap: 34,
      says: [{ text: '大丈夫。\nここではそう言っていいんだよ。', x: 50, y: 82, tail: 'ul', big: true }],
    },

    { kind: 'me', text: '…糸の反対側に、あの人がいるんですか？', gap: 30 },
    {
      kind: 'art',
      src: `${A}/13-window.jpg`,
      ratio: 2 / 3,
      fade: 'top',
      gap: 14,
      says: [
        { text: '向こうの気持ちは私にもわからない。\n見えるのは、あなたの側の糸だけ。', x: 62, y: 18, tail: 'dl' },
        { text: 'そのかわり、あなたの糸が\nどっちへ引かれてるかは見える。', x: 66, y: 46, tail: 'none' },
        { text: 'クリスマスまで、\nまだ時間はあるよ。', x: 64, y: 96, tail: 'none', big: true },
      ],
    },
    { kind: 'me', text: 'いつ、どうすればいいんですか？', gap: 22 },
    {
      kind: 'art',
      src: `${A}/14-yeon-hand.jpg`,
      ratio: 2 / 3,
      fade: 'bottom',
      gap: 20,
      says: [{ text: 'それは、あなたの誕生日が\nわからないと見えないな。', x: 50, y: 9, tail: 'dl', big: true }],
    },
  ] satisfies Beat[] as Beat[],

  check: {
    title: 'いま気になる人が\nいるなら',
    close: 'ひとつでも当てはまったら、\n今年のクリスマスは流さないで。',
    items: [
      '雪の日、連絡したい人がすぐ浮かんだ',
      'あの人に送るメッセージを打っては消したことがある',
      '友だちなのか、それ以上なのか微妙な人がいる',
      '自分から連絡したら重いかなと迷ってしまう',
      '今年のクリスマスは、あの人と過ごしたい',
    ],
  },
};
