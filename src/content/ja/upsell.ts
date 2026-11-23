import type { UpsellCopy } from '../en/upsell';
import type { DeepPartial } from '../locale';
import type { ChapterInfo } from '@/lib/reading/traits-types';

export const UPSELL_JA: DeepPartial<UpsellCopy> = {
  whatISee: {
    heading: '視えたこと',
    intro: 'まず、この三つがパッと目に入ったよ。',
    labels: {
      core: 'あなたの素顔',
      pattern: '気づけばくり返していること',
      love: '恋をすると',
      tension: '恋をすると',
      missing: '惹かれる人',
    },
    thatsMe: 'そう、それ',
    notQuite: 'うーん、ちょっと違う',
    bonusHeading: '惹かれる人',
    bonusIntro: 'あとひとつだけ。これも当たったら、少し得意顔してもいい？',
    reactions: {
      mostlyYes: [
        'ほらね、全部視えてるって言ったでしょ。いい知らせはもうすぐ。',
        'そんなに驚いた顔しなくても。',
        'あるものを言っただけだよ。次はいい知らせ。',
        'ソグムは寝てて聞いてなかったけど、あなたは全部聞いてたでしょ？',
      ],
      mostlyNo: [
        'そっか、外れちゃったか。たった三言で人のすべてを語り尽くせるわけないよね。',
        '今回はしっくりこなかったね。自分自身のことは、やっぱりあなたが一番よくわかってる。',
        'うん、違ったね。素直に教えてくれてありがとう、無理に合わせなくていいよ。',
      ],
    },
  },
  chapters: {
    eyebrow: 'あなたの人生の地図',
    intro: '人の一生は、十年ごとに季節が移り変わる。四柱推命では、これを大運と呼ぶ。今、歩いているのはこの章。',
    headline: (c: ChapterInfo) =>
      c.beforeStart
        ? `最初の章は、まだ始まってない。${c.startAge}歳で「${c.title}」が始まる。`
        : `いまは${c.index + 1}番目の章、「${c.title}」(${c.startAge}〜${c.endAge}歳、${c.startYear}〜${c.endYear}年)`,
    nextLabel: '次の章',
    next: (c: ChapterInfo) =>
      c.next
        ? c.next.title === c.title
          ? `${c.next.startAge}歳から、ふたたび「${c.next.title}」。`
          : `${c.next.startAge}歳から、「${c.next.title}」。`
        : null,
    lastChapter: 'この地図の最後の章だよ。ゆっくり、思いきり味わって。',
    restClosed: (c: ChapterInfo) => {
      const n = Math.max(0, c.total - c.index - 1 - (c.next ? 1 : 0));
      return n === 0 ? null : `残りの${n}章は、まだ閉じておくね。`;
    },
    needSex: {
      line: '人生の地図をひらくには、あとひとつだけ教えて。',
      why: '十年ごとの運の流れを出すために使うんだ。昔からの二通りの決まりがあってね。',
      group: '運の流れの向き',
      woman: '女性',
      man: '男性',
      nonbinary: 'ノンバイナリー',
    },
  },
  deeper: {
    yul: [
      '今日は、今歩いている章まで。奥の間では、これまでの章も、この先の章も読んでいくよ。',
      '続きも見てみる？ 恋や仕事のことも、年ごと、月ごとの流れを見ながら話そう。',
      'いい知らせも、気をつけることも、ひとつも抜かさないよ。',
      '正直に言うと、まだ扉はひらいてないんだ。メールを残してくれたら、ひらく日を知らせるね。',
    ],
    notOpen: 'まだひらいていません。メールを残すと、発売価格でいちばんにお知らせします。',
    noCountdown: 'タイマーもカウントダウンもないよ。扉がまだひらいてないだけ。',
  },
};
