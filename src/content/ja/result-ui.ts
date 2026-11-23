import type { ChapterWhen, ResultUiCopy } from '../en/result-ui';
import type { DeepPartial } from '../locale';
import type { ChapterInfo } from '@/lib/reading/traits-types';

const KANJI = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

const ordinal = (n: number) => `${KANJI[n] ?? n}番目`;

const counted = (n: number) => (n === 10 ? '十' : `${KANJI[n] ?? n}つ`);

const rest = (c: ChapterInfo) => Math.max(0, c.total - c.index - 1 - (c.next ? 1 : 0));
const nextTitle = (c: ChapterInfo) => (!c.next ? null : c.next.title === c.title ? `ふたたび${c.next.title}` : c.next.title);
const LOVE_YEARS = 'でもね、あなたの恋の扉が一番大きく開く年は別にあるんだ。それが何年なのかは、ヨンの部屋で教えてくれるよ。';

export const RESULT_UI_JA: DeepPartial<ResultUiCopy> = {
  whatISee: {
    yourAnswer: 'あなたの答え:',
    progress: (done: number, total: number) => `${total}問中${done}問に回答`,
    yulSays: 'ユル:',
    reactions: {
      mostlyNo: [
        'そっか。たった三行で人のすべてを語り尽くせるわけないよね。正直に教えてくれてありがとう。',
        '外れちゃったか。無理に当たってるふりはしないよ。あなた自身の人生は、あなたが一番よく知ってるからね。',
        'うん、しっくりこなかったね。素直に教えてくれてありがとう、その反応が一番助かるよ。',
      ],
    },
    timeNote: {
      unknown: '生まれた時刻を聞いてないから、三つの柱だけで読んだんだ。少しずれるかもしれないけど、時刻を入れてみる？',
      nearMidnight: '真夜中ごろの生まれなんだね。いちばん読みが分かれやすい時間だから、生まれた時刻が合ってるか確かめてみる？',
      linkUnknown: '生まれた時刻を入れる',
      linkCheck: '生まれた時刻を確かめる',
    },
    bonusTry: 'もうひとつだけ当ててみる。',
    bonusAfter: { yes: 'ほらね、やっぱり。じゃあ、いよいよ「いい知らせ」を渡すね。', no: 'そっか、わかったよ。それでも大丈夫、あなたへの「いい知らせ」はちゃんとあるからね。' },
  },
  chapters: {
    stripLabel: (current: number, total: number) => `人生の章は全部で${total}。いまは${ordinal(current)}の章。`,
    stripLabelBefore: (total: number) => `人生の章は全部で${total}。最初の章は、まだ始まっていない。`,
    stripLabelClosed: '人生の地図、まだ閉じています。',
    stripCaption: 'ひとマスが十年。数字は、その章が始まる年齢。',
    here: 'いまここ',
    failed: '地図を表示できませんでした。もう一度お試しください。',
    headline: (c: ChapterInfo, when: ChapterWhen | null) =>
      c.beforeStart
        ? { lead: '最初の章は、まだ始まってないよ。', detail: `${c.startAge}歳から「${c.title}」が始まる。` }
        : {
            lead: `今は人生の${ordinal(c.index + 1)}の章、「${c.title}」の真っ只中。`,
            detail: when ? `${when.year}年${when.month}、${c.startAge}歳のときに始まって、10年間続くよ。` : `${c.startAge}歳から始まって、10年間続くよ。`,
          },
    next: (c: ChapterInfo, when: ChapterWhen | null) => {
      const title = nextTitle(c);
      if (!title || !c.next) return null;
      return when ? `${when.year + 10}年${when.month}から、「${title}」。` : `${c.next.startAge}歳から、「${title}」。`;
    },
    restClosed: (c: ChapterInfo) => {
      const n = rest(c);
      if (n === 0) return null;
      return `残りの${counted(n)}の章は、まだ閉じておくね。鍵は奥の間のマンシンが握っているよ。`;
    },
  },
  deeper: {
    sectionLabel: 'もっと深いお話',
    lead: 'この扉の奥に、五つの部屋があるんだ。今日はその入り口まで行ってみよう。',
    bridge: (c: ChapterInfo, name: string, _when: ChapterWhen | null, nextChapterTitle?: string | null) => {
      const who = name.trim();
      const next = nextChapterTitle === undefined ? (c.next?.title ?? null) : nextChapterTitle;
      const head = who ? `${who}、` : '';
      return next
        ? `${head}実はもう少し先まで視てたんだけど、次の章は「${next}」だよ。${LOVE_YEARS}`
        : `${head}実は、この先の地図も少し見えてるんだ。${LOVE_YEARS}`;
    },
    bridgeGeneric: `実は、この先の地図も少し見えてるんだ。${LOVE_YEARS}`,
    bridgeNoSex: 'あなたの人生の地図は、まだ閉じたまま。上で答えてくれれば今の章が開くし、その先は奥の間で待っているよ。',
    want: 'もっと知りたくなったら、奥の間へおいで。いつ手を伸ばして、いつ手放すべきか、ぜんぶそこに書いてあるから。',
    menuHeading: '神堂の奥の間で紐解くこと',
    honest: (price: string) => `ひと部屋${price}。気になる部屋から入ってみて。`,
    cta: '奥の間を見に行く',
    writing: 'ユルが執筆中…',
  },
};
