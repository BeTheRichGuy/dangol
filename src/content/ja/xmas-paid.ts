import type { Beat } from '@/components/story/types';
import type { XmasAskCopy, XmasDaysCopy, XmasKeepCopy, XmasMeetCopy, XmasPaidCopy, XmasPairCopy, XmasReviewCopy } from '../xmas';
import type { XmasChapter, XmasPlay } from '../ko/xmas-paid';
import type { XmasStage } from '@/lib/xmas/relation';

const A = '/media/xmas/paid2';

export const XMAS_DAYS_JA: XmasDaysCopy = {
  title: '{from}から{to}まで',
  kinds: {
    close: { mark: '○', label: '話しかけやすい日' },
    group: { mark: '◎', label: 'みんなで集まるのにいい日' },
    bloom: { mark: '☆', label: 'いつもより目立ちやすい日' },
    caution: { mark: '△', label: '少しひと休みする日' },
  },
  weekdays: ['日', '月', '火', '水', '木', '金', '土'],
  date: (m: number, d: number) => `${m}月${d}日`,
  month: (y: number, m: number) => `${y}年${m}月`,
  special: { '12-24': 'イブ', '12-25': 'クリスマス', '12-31': '大みそか', '01-01': '元日' },
  count: 'ハートの日は*全部で{n}日*',
  none: 'この期間は大きく目立つ日がないよ。いつもどおりがいちばん。',
};

export const XMAS_ASK_JA: XmasAskCopy = { day: (d: number) => `${d}日`, or: 'か', eve: '今日', none: '24日より前の\n落ち着いた日ならいつでも', someday: 'その日' };

const lastWalk: Beat[] = [
  {
    kind: 'art',
    src: `${A}/08c-wave.jpg`,
    ratio: 2 / 3,
    fade: 'both',
    gap: 30,
    says: [
      { text: 'その糸、\nしばらくほどかないでね。', x: 22, y: 50, tail: 'ur' },
      { text: 'また来年のクリスマスに。', x: 64, y: 90, tail: 'ul', big: true },
    ],
  },
  { kind: 'sfx', text: 'ひゅう……', side: 'right', gap: 40 },
  { kind: 'art', src: `${A}/08d-alley-alone{me}.jpg`, ratio: 2 / 3, fade: 'both', gap: 10, notes: [{ text: '階段はあとかたもなく消えて、\n雪だけが降っていた。', x: 50, y: 8 }] },
];

const lastSend = (text: string): XmasPlay => ({ kind: 'send', title: 'あの人', to: 'あの人', text, send: '送信', replies: [] });

const ask8 = (text: string): Beat => ({ kind: 'art', src: `${A}/03b-yeon-confident.jpg`, ratio: 1, gap: 12, says: [{ text, x: 50, y: 94, tail: 'ul', big: true }] });

const firstLine = (options: readonly { label: string; reply: string }[]): XmasPlay => ({ kind: 'choice', ask: '一行目をひとつ選んでみて。', options });

const chapters: XmasChapter[] = [
  {
    title: 'あの人がずっと気になる理由',
    line: 'あなたがあの人に惹かれるところ、いま糸が傾いている向き。',
    face: `${A}/y01.jpg`,
    open: [
      { kind: 'art', src: `${A}/01a-knot-hands.jpg`, ratio: 3 / 2, gap: 24, notes: [{ text: '糸をなぞっていた指が止まった。', x: 50, y: 6 }] },
      { kind: 'say', text: 'ちょっと待って。', gap: 8 },
      {
        kind: 'art',
        src: `${A}/01b-knot-lantern.jpg`,
        ratio: 2 / 3,
        fade: 'both',
        gap: 12,
        says: [{ text: 'あなたの糸、\nずいぶん張りつめてるね。', x: 32, y: 10, tail: 'dr', big: true }],
      },
      { kind: 'me', text: '…そんなことまで見えるんですか？', gap: 8 },
      { kind: 'say', text: 'それだけ、\nあの人のことが気になってるんだね。', big: true, gap: 10 },
    ],
    stage: {
      far: [{ kind: 'say', text: 'まだ何回も話してないでしょ？\nなのに目はずっとそっちに行く。', gap: 10 }],
      friend: [{ kind: 'say', text: '友だちだから、よけいに送れないんだ。\nバレそうで。', gap: 10 }],
      daily: [{ kind: 'say', text: '毎日会うのに、話すことがない。\nそれがいちばんもどかしいよね。', gap: 10 }],
      talking: [{ kind: 'say', text: '連絡は取ってる。\nでも、次の一歩は迷うよね。', gap: 10 }],
      past: [{ kind: 'say', text: '前ならさらっと送れたのに。\nいまはその一行が重いんだね。', gap: 10 }],
    },
    close: [{ kind: 'say', text: 'ちょっと外に出よう。\nふたりの今の距離、\n外から見たほうがよく見えるから。', big: true, gap: 30 }],
  },
  {
    title: 'いまのふたりの距離',
    line: 'いまのふたりにとって有利なことと、引っかかること。',
    face: `${A}/y06.jpg`,
    open: [
      {
        kind: 'art',
        src: `${A}/02a-coat-door.jpg`,
        ratio: 2 / 3,
        fade: 'both',
        gap: 24,
        says: [{ text: 'なにしてるの？\n来ないの？', x: 18, y: 23, tail: 'ur', big: true }],
      },
      { kind: 'me', text: 'あれ？ 着替えたんですか？', gap: 10 },
      { kind: 'say', text: '雪なのに、\n薄着で出るわけにいかないでしょ。', gap: 8 },
      { kind: 'art', src: `${A}/02b-stairs-down{me}.jpg`, ratio: 3 / 2, gap: 30, notes: [{ text: '帰りの階段は、\n上ってきたときより長く感じた。', x: 50, y: 88 }] },
      { kind: 'say', text: 'ふたりの今の距離、\nちょっと見てみる？', gap: 10 },
      { kind: 'me', text: '…自分でもよくわからないです。', gap: 8 },
      { kind: 'say', text: 'じゃあ、一緒に見てみようか。', big: true, gap: 8 },
    ],
    close: [{ kind: 'say', text: '距離はわかった。\n次は、あの人の糸の話をしよう。', gap: 30 }],
  },
  {
    title: '糸から見えること',
    line: '二本の糸を並べて見た相性。誕生日を知らなくても、あの人の前のあなたは見える。',
    face: `${A}/y05.jpg`,
    card: 'pair',
    open: [{ kind: 'art', src: `${A}/02c-bridge.jpg`, ratio: 3 / 2, fade: 'bottom', gap: 30, notes: [{ text: '雪の積もった石橋を渡った。', x: 50, y: 8 }] }],
    tier: {
      none: [
        { kind: 'say', text: 'あの人の誕生日は\n知らないんだったよね？', gap: 10 },
        { kind: 'me', text: '…はい、知らないです。', gap: 8 },
        { kind: 'say', text: '大丈夫。\nじゃあ、あの人の糸にはさわらないでおくね。', gap: 10 },
        {
          kind: 'art',
          src: `${A}/03c-one-thread.jpg`,
          ratio: 2 / 3,
          fade: 'both',
          gap: 12,
          says: [{ text: 'そのかわり、あの人の前で\nあなたの糸がどう動くかは全部見える。', x: 60, y: 92, tail: 'ul', big: true }],
        },
      ],
      date: [
        { kind: 'say', text: '教えてくれた\nあの人の誕生日も一緒に見るね。', gap: 10 },
        { kind: 'me', text: '生まれた時間までは知らなくて。', gap: 8 },
        { kind: 'say', text: '大丈夫。\nわかる範囲だけで見てみよう。', gap: 10 },
        {
          kind: 'art',
          src: `${A}/03c-two-threads.jpg`,
          ratio: 2 / 3,
          fade: 'both',
          gap: 12,
          says: [{ text: '二本の糸を\n並べてみよう。', x: 64, y: 92, tail: 'ul', big: true }],
        },
      ],
      full: [
        { kind: 'say', text: 'あの人は生まれた時間まで\nわかってるんだよね？', gap: 10 },
        { kind: 'me', text: 'はい、そこまではわかります。', gap: 8 },
        { kind: 'say', text: 'じゃあ四本ぜんぶ合わせて見られるね。', gap: 10 },
        {
          kind: 'art',
          src: `${A}/03c-two-threads.jpg`,
          ratio: 2 / 3,
          fade: 'both',
          gap: 12,
          says: [{ text: '二本の糸を\n並べてみよう。', x: 64, y: 92, tail: 'ul', big: true }],
        },
      ],
    },
    close: [{ kind: 'say', text: '見えるのはここまで。\n次は日付を見よう。', gap: 30 }],
  },
  {
    title: 'クリスマスまでのカレンダー',
    line: '今日から1月まで、話しかけやすい日とひと休みする日。',
    face: `${A}/y02.jpg`,
    card: 'days',
    open: [
      { kind: 'art', src: `${A}/s02-notebook.jpg`, ratio: 2 / 3, width: 84, side: 'right', shape: 'soft', gap: 24 },
      { kind: 'say', text: 'クリスマスまでに\n覚えておくといい日を教えるね。', gap: 4 },
    ],
    after: [{ kind: 'say', text: 'しるしの日は連絡を考えてみてもいい日、\n三角は焦らず過ごす日。', big: true, gap: 12 }],
    close: [{ kind: 'say', text: '日付は見た。\n次は、どこで、どう近づくか見よう。', gap: 30 }],
  },
  {
    title: 'ふたりで気楽に会える場所',
    line: 'ふたりが自然に重なれる場所と、そこですること。',
    face: `${A}/y09.jpg`,
    open: [
      { kind: 'art', src: `${A}/04a-market{me}.jpg`, ratio: 3 / 2, fade: 'both', gap: 24, notes: [{ text: '通りは人であふれていた。\n指先ごとに、かすかな糸がかすめていく。', x: 50, y: 8 }] },
      { kind: 'say', text: 'ほら。あの人たちも\nそれぞれ糸がつながってる。', gap: 10 },
      { kind: 'art', src: `${A}/s05-glances{me}.jpg`, ratio: 3 / 2, slant: 'b', gap: 16 },
      { kind: 'say', text: 'なんだか視線が気になるでしょ？\nでもあなた、思ってるより目立つよ。', big: true, gap: 8 },
      { kind: 'me', text: '…あの人の目にも、\nそう見えてますかね？', gap: 10 },
      { kind: 'say', text: 'それはあの人に聞かないとね。', gap: 8 },
      { kind: 'say', text: 'そのかわり、あなたが楽になれる場所は\n教えてあげられる。', big: true, gap: 6 },
      { kind: 'art', src: `${A}/06b-window-wipe.jpg`, ratio: 2 / 3, fade: 'bottom', gap: 18, says: [{ text: 'この窓の霜、\nちょっと拭いてみる？', x: 28, y: 8, tail: 'dr' }] },
    ],
    play: { kind: 'frost', hint: '窓の霜をなでて拭いてください', skip: 'すぐ見る' },
    after: [
      { kind: 'say', text: 'ほら。\nあなたにはこういう場所が合うの。', big: true, gap: 16 },
      { kind: 'say', text: 'あの人と顔を合わせるときは、\nこういう場所を思い出して。', gap: 10 },
    ],
    close: [{ kind: 'say', text: 'でもあの人のことを考えると、\nいつもの自分じゃいられないでしょ？', gap: 30 }],
  },
  {
    title: 'あの人の前で出てしまうクセ',
    line: '近づけそうになると先に引いてしまう瞬間と、かわりにすること。',
    face: `${A}/y07.jpg`,
    open: [
      {
        kind: 'art',
        src: `${A}/04b-yeon-point.jpg`,
        ratio: 2 / 3,
        fade: 'both',
        gap: 24,
        says: [
          { text: 'あそこ、もつれた糸が見える？', x: 30, y: 10, tail: 'dr' },
          { text: 'あなたの側でもつれてるの。', x: 64, y: 92, tail: 'ul', big: true },
        ],
      },
      { kind: 'me', text: '…私の側ですか？', gap: 8 },
      { kind: 'say', text: '気持ちがこんがらがると、\n糸もああやってもつれるの。', gap: 10 },
      { kind: 'art', src: `${A}/s07-tug{me}.jpg`, ratio: 3 / 2, fade: 'both', gap: 12 },
      { kind: 'say', text: 'ひとりで期待して、\nまたひとりであきらめて。', big: true, gap: 8 },
    ],
    close: [{ kind: 'say', text: 'そのクセをひとつだけ置いて、\n一行だけ書いてみよう。', big: true, gap: 30 }],
  },
  {
    title: '自分から動いていい？',
    line: '自分から動くかどうか、なにを、どんな口調で。最初のひと言えらび。',
    face: `${A}/y03.jpg`,
    open: [
      {
        kind: 'art',
        src: `${A}/07c-phone-peek{me}.jpg`,
        ratio: 3 / 2,
        gap: 24,
        says: [{ text: '最初のひと言って、\n迷うよね。', x: 74, y: 90, tail: 'ul', big: true }],
      },
      { kind: 'me', text: '…はい。なんて言えばいいか\nわからなくて。', gap: 10 },
      { kind: 'say', text: 'じゃあ一緒に選ぼう。', gap: 8 },
    ],
    playByStage: {
      far: firstLine([
        { label: 'さっきのあれ、どこで見つけたんですか？', reply: 'いいね。もうある話につなげると負担がないよ。' },
        { label: '今週の集まり、来ます？', reply: 'いいね。みんなでいる場から聞くの、いまにぴったり。' },
        { label: '実は前から気になってました。', reply: 'それはまだ早い。もう何回か話してから。' },
      ]),
      friend: firstLine([
        { label: 'ねえ、雪降ってる', reply: 'いつもの口調のまま。友だちにはいちばん自然な一行目。' },
        { label: '今週ふたりでごはん行かない？', reply: 'いいね。そのかわり重くならないように、いつもの感じで。' },
        { label: '私たちって、ちょっと微妙じゃない？', reply: 'それは一行目には大きすぎる。顔を見て話そう。' },
      ]),
      daily: firstLine([
        { label: 'さっきはありがとうございました。助かりました。', reply: 'いいね。今日あったことから始めれば気まずくない。' },
        { label: '明日、お昼一緒にどうですか？', reply: 'いいね。いつもの場所から一歩だけ出るの。' },
        { label: '最近ずっと気になってて。', reply: 'それはそこでは言わないで。明日も顔を合わせるんだから。' },
      ]),
      talking: firstLine([
        { label: 'この前言ってたお店、一緒に行ってみません？', reply: 'いいね。もう話したことを約束に変えるの。' },
        { label: '今週末、空いてます？', reply: 'いいよ。日にちを二つくらい挙げて聞くともっといい。' },
        { label: 'たしかに笑', reply: 'それは返事で、一行目じゃない。質問をひとつ足して。' },
      ]),
      past: firstLine([
        { label: '元気？ 雪見てたら思い出して。', reply: 'いいね。軽くて、返事がなくても大丈夫な一行。' },
        { label: 'あのときはごめんね。', reply: 'それは一行目には重い。返事が来てから。' },
        { label: 'もう一回やり直さない？', reply: '早すぎる。今日は近況まで。' },
      ]),
    },
    after: [{ kind: 'say', text: 'よし。\nもうあんまり悩みすぎないで。', big: true, gap: 16 }],
    close: [{ kind: 'say', text: '最初のひと言は決まった。\n次はその先の話をしよう。', gap: 30 }],
  },
  {
    title: 'クリスマスまでの次の一歩',
    line: '切り出しやすい日、かける言葉、返事があいまいなとき。',
    face: `${A}/y04b.jpg`,
    open: [
      { kind: 'me', text: 'じゃあ、クリスマスまでに\n何をすればいいんだろう。', gap: 24 },
      { kind: 'say', text: 'クリスマス当日にぜんぶ懸けないで。', gap: 8 },
      { kind: 'say', text: 'まだ何も決まってないのに、その日だけに懸けたら、\nふたりとも重くなっちゃう。', gap: 8 },
    ],
    stage: {
      far: [ask8('{ask}ごろ、顔を合わせたら\nまずはあいさつだけでいいよ。')],
      friend: [ask8('切り出すなら{ask}がいい日。\n当日じゃなくて、前もってね。')],
      daily: [ask8('誘いやすい日は{ask}。\nそのとき、外で少し会おうって聞いてみて。')],
      talking: [ask8('誘いやすい日は{ask}。\nそのとき早めに聞いておいて。')],
      past: [ask8('{ask}ごろは約束じゃなくて、\n近況のひと言だけ送ってみて。')],
    },
    stageDefault: 'talking',
    close: [{ kind: 'say', text: 'それと、これだけは覚えておいて。', gap: 30 }],
  },
  {
    title: 'これだけはしないで',
    line: '関係を壊しやすい行動三つと、一歩引くとき。',
    face: `${A}/y10.jpg`,
    open: [
      { kind: 'art', src: `${A}/05a-bench{me}.jpg`, ratio: 3 / 2, gap: 20 },
      { kind: 'say', text: 'その心配、\nずっとひとりで抱えてたんだね。', gap: 8 },
      { kind: 'me', text: '…そんなものも糸に残るんですか？', gap: 10 },
      { kind: 'say', text: '迷ったあとは、全部残るの。', gap: 8 },
      { kind: 'art', src: `${A}/05b-frayed.jpg`, ratio: 3 / 2, gap: 22, notes: [{ text: '糸の端は、どれも\n同じところですり切れていた。', x: 30, y: 90 }] },
      { kind: 'say', text: 'ほら。いつも同じようなところで止まってたでしょ？', big: true, gap: 10 },
      { kind: 'me', text: '…今回もそうなりますかね？', gap: 10 },
      { kind: 'say', text: '同じことをすればね。', gap: 8 },
      { kind: 'say', text: '今度は、ここから\n一歩進んでみよう。', big: true, gap: 6 },
    ],
  },
  {
    title: 'あなたの側の結び目',
    line: 'あの人の心は結べない。あなたが一歩ふみ出すための結び目。',
    face: `${A}/y08.jpg`,
    open: [
      { kind: 'say', text: 'ちょっと手を貸して。', gap: 30 },
      { kind: 'art', src: `${A}/07a-bracelet{me}.jpg`, ratio: 3 / 2, gap: 14, notes: [{ text: 'ヨンが私の手首に糸を巻いた。', x: 50, y: 92 }] },
      { kind: 'me', text: 'これで、あの人と\nつながるんですか？', gap: 10 },
      { kind: 'say', text: 'ううん。\nそんなことを約束できる糸はないよ。', gap: 8 },
      { kind: 'say', text: '人の心まで結ぶ結び目は、\n私にも結べない。', big: true, gap: 8 },
    ],
    play: {
      kind: 'tie',
      hint: 'ゆるんだ糸の端をつまんで、黄色い結び目の場所まで引っぱってください',
      skip: 'スキップ',
      done: '結べた。',
      frames: { loose: `${A}/07t-loose{me}.jpg`, mid: `${A}/07t-mid{me}.jpg`, tied: `${A}/07t-tied{me}.jpg` },
      points: {
        '': { knot: { x: 47, y: 59 }, grab: { x: 78, y: 82 } },
        '-f': { knot: { x: 45, y: 55 }, grab: { x: 74, y: 78 } },
      },
    },
    after: [{ kind: 'say', text: 'これは、あなたの気持ちが\n逃げないように結ぶ結び目。', gap: 14 }],
    goal: {
      meet: [
        { kind: 'art', src: `${A}/07b-yeon-serious.jpg`, ratio: 2 / 3, fade: 'both', gap: 22, says: [{ text: '会いたいなら、', x: 30, y: 10, tail: 'dr', big: true }, { text: '一度だけ\n誘ってみて。', x: 66, y: 92, tail: 'ul', big: true }] },
        { kind: 'me', text: 'でも、返事がなかったら？', gap: 10 },
        { kind: 'say', text: 'そしたらその日はそこまで。', gap: 8 },
        { kind: 'say', text: 'それでも、自分から聞いたことは\nちゃんと残るよ。', big: true, gap: 8 },
      ],
      closer: [
        { kind: 'art', src: `${A}/07b-yeon-serious.jpg`, ratio: 2 / 3, fade: 'both', gap: 22, says: [{ text: '話しかけるか\n迷ったときは、', x: 30, y: 10, tail: 'dr', big: true }, { text: '一度は\n話しかけるほうへ。', x: 66, y: 92, tail: 'ul', big: true }] },
        { kind: 'me', text: '気まずくなったら？', gap: 10 },
        { kind: 'say', text: '気まずいのは一日で終わる。', gap: 8 },
        { kind: 'say', text: 'やらなかったら、ずっと\nそこをぐるぐるしたまま。', big: true, gap: 8 },
      ],
      confess: [
        { kind: 'art', src: `${A}/07b-yeon-serious.jpg`, ratio: 2 / 3, fade: 'both', gap: 22, says: [{ text: '言いたいなら、', x: 30, y: 10, tail: 'dr', big: true }, { text: '一度だけ\n伝えてみて。', x: 66, y: 92, tail: 'ul', big: true }] },
        { kind: 'say', text: 'そのかわり、すぐに返事を求めないで。', gap: 10 },
        { kind: 'me', text: 'ちがうって言われたら？', gap: 10 },
        { kind: 'say', text: 'それが返事だよ。', gap: 8 },
        { kind: 'say', text: 'それでも、あなたが言ったことは\nそのまま残る。', big: true, gap: 8 },
      ],
      decide: [
        { kind: 'art', src: `${A}/07b-yeon-serious.jpg`, ratio: 2 / 3, fade: 'both', gap: 22, says: [{ text: '続けるか、\nここで手放すか。', x: 30, y: 10, tail: 'dr', big: true }, { text: 'どっちでも、\nあなたが決めて。', x: 66, y: 92, tail: 'ul', big: true }] },
        { kind: 'me', text: '決められなかったら？', gap: 10 },
        { kind: 'say', text: 'じゃあ一回だけやってみて決めて。', gap: 8 },
        { kind: 'say', text: 'やってみてちがったら、\nそのとき手放しても遅くない。', big: true, gap: 8 },
      ],
    },
  },
  {
    title: 'クリスマスのあとのあなたへ',
    line: '結果がどうでも、その次。ヨンが残す手紙。',
    face: `${A}/y11.jpg`,
    open: [
      { kind: 'art', src: `${A}/08a-stairs-bottom{me}.jpg`, ratio: 2 / 3, fade: 'both', gap: 30, notes: [{ text: '階段のいちばん下。', x: 50, y: 6 }] },
      { kind: 'me', text: 'じゃあ、あなたは？\nあなたの糸はどこへ行くんですか？', gap: 12 },
      {
        kind: 'art',
        src: `${A}/08b-yeon-pinky.jpg`,
        ratio: 2 / 3,
        gap: 16,
        says: [
          { text: '私の手には\n糸が見えないでしょ？', x: 26, y: 7, tail: 'dr' },
          { text: '人の糸はよく見えても、\n自分のは見えないんだよね。', x: 66, y: 92, tail: 'ul' },
        ],
      },
      { kind: 'me', text: '…さみしくないんですか？', gap: 12 },
      { kind: 'say', text: 'だから、自分の気持ちだけは\n見ないふりしないでね。', big: true, gap: 10 },
    ],
    close: [
      ...lastWalk,
      { kind: 'text', lines: ['スマホを取り出した。', 'さっき送れなかった一行が、そのまま残っていた。'], size: 'sm', gap: 20 },
      { kind: 'text', lines: ['いつもなら、そこで止まっていた。', '*今日は、もう一行足した。*'], size: 'sm', gap: 14 },
    ],
    closeByStage: {
      far: [
        ...lastWalk,
        { kind: 'text', lines: ['スマホを取り出した。', 'さっき打った一行が、そのまま残っていた。'], size: 'sm', gap: 20 },
        { kind: 'text', lines: ['でもまだ、', '*メッセージを送れるほど近い関係じゃなかった。*'], size: 'sm', gap: 14 },
        { kind: 'text', lines: ['スマホをしまった。', 'そのかわり、ひとつだけ決めた。'], size: 'sm', gap: 14 },
      ],
    },
    late: true,

    playByPair: { 'friend.confess': lastSend('雪降ってる。…実は、友だちとしてだけじゃなくて好きなんだ。返事は急がなくて大丈夫') },
    playByStage: {
      far: { kind: 'hold', label: '次に会ったら、自分からあいさつする', hint: '長押しして決めてみてください', skip: 'スキップ' },
      friend: lastSend('雪降ってる。なんか急に思い出して'),
      daily: lastSend('雪降ってる。見た瞬間思い出して'),
      talking: lastSend('雪降ってる。見た瞬間思い出して'),
      past: lastSend('雪降ってる。元気にしてる？'),
    },
    after: [
      { kind: 'text', lines: ['返事はまだ。', '*それでも、送った。*'], gap: 24 },
      { kind: 'text', lines: ['クリスマスまで、まだ日はある。'], size: 'lg', gap: 40 },
    ],
    afterByStage: {
      far: [
        { kind: 'text', lines: ['どうなるかは、まだわからない。', '*それでも、もう避けてばかりはいないと決めた。*'], gap: 24 },
        { kind: 'text', lines: ['クリスマスまで、まだ日はある。'], size: 'lg', gap: 40 },
      ],
    },
  },
];

export const XMAS_PAID_JA: XmasPaidCopy = {
  over: 'ヨンのクリスマス恋愛占い',
  title: '{name}の糸',
  toc: '目次',
  speaker: 'ヨン',
  you: 'あなた',
  skipStory: 'お話を飛ばして鑑定だけ見る',
  showStory: 'お話をもう一度見る',
  toMain: 'メイン画面に戻る',
  prologue: [
    { kind: 'clock', sub: 'クリスマス前の冬の夜', text: '21:40', gap: 18 },
    {
      kind: 'art',
      src: `${A}/00-sleeves.jpg`,
      ratio: 2 / 3,
      fade: 'both',
      gap: 10,
      says: [
        { text: 'ふふ、鑑定料は受け取ったよ。', x: 72, y: 7, tail: 'dl', big: true },
        { text: 'さあ、\nあの人の話をして。', x: 66, y: 94, tail: 'ul' },
      ],
    },
    { kind: 'me', text: '…ほんとに秘密ですよ。', gap: 14 },
    { kind: 'say', text: 'ふふ、誰にも言わないよ。', gap: 10 },
  ] satisfies Beat[] as Beat[],
  chapters,
};

export const XMAS_MEET_JA: XmasMeetCopy = {
  peer: '一緒に学んだり\n働いたりする場所',
  output: '好きなことをしに\n人が集まる場所',
  wealth: '仕事の流れで\n自然に顔を合わせる場所',
  power: '会社や\n決まった集まりのような場所',
  resource: '習いに行く場所、\n紹介してもらう場',
};

export const XMAS_PAIR_JA: XmasPairCopy = {
  title: 'お楽しみの相性スコア',
  note: 'お楽しみで見るスコアです。ふたりが結ばれる確率ではありません。同じふたりの誕生日なら、いつ見ても同じです。',
};

export const XMAS_REVIEW_JA: XmasReviewCopy = {
  title: 'ヨンへのひと言',
  note: 'どうだったか、星の数とひと言だけ残してね。',
  reward: '残してくれたら灯りを3つあげる。\n灯りでヨンと1対1で話せるよ。(鑑定ごとに1回)',
  rewardGuest: 'ログインして残すと灯りを3つ受け取れます。\n灯りでヨンと1対1で話せます。',
  thanks: '残してくれてありがとう。',
  thanksReward: 'ありがとう。灯りを3つ入れておいたよ。\nあの人のこと、もっと聞きたいことがあれば直接聞いてね。',
  chat: { href: '/chat/yeon', label: 'ヨンと1対1で話す' },
};

export const XMAS_KEEP_JA: XmasKeepCopy = {
  title: '私のクリスマスカード',
  lead: 'スクショのかわりに保存して、その日に見返してね。',
  save: 'カードを保存',
  saved: '保存しました',
  card: {
    over: 'ヨンのクリスマス恋愛占い',
    name: '{name}の糸',
    now: 'いまのふたり',
    ask: {
      far: 'まずあいさつしてみる日',
      friend: '気持ちを切り出す日',
      daily: '外で少し会おうと聞く日',
      talking: 'クリスマスの約束を早めに聞く日',
      past: '近況のひと言を送る日',
    } satisfies Record<XmasStage, string>,
    days: '話しかけやすい日',
    rest: '少しひと休みする日',
    pair: 'ふたりの相性スコア',
    pairNote: 'お楽しみのスコア',
    word: 'ヨンのひと言',
    foot: 'DANGOL・お楽しみの占い',
  },
  words: {
    meet: '会いたいなら、一度だけ誘ってみて。',
    closer: '話しかけるか迷ったら、一度は話しかけるほうへ。',
    confess: '言いたいなら、一度だけ伝えてみて。',
    decide: '続けるか、手放すか。どっちでも、あなたが決めて。',
  },
  file: 'dangol-xmas-card.png',
};
