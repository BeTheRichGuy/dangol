import type { ENGINE_COPY } from '../en/engine';
import type { DeepPartial } from '../locale';

export const ENGINE_JA: DeepPartial<typeof ENGINE_COPY> = {
  notCurse: 'こういう時期もある、くらいに覚えておいて。ずっと続く話じゃないから。',
  godLabel: { peer: '比劫', output: '食傷', wealth: '財星', power: '官星', resource: '印星' },
  godGloss: {
    peer: '仲間との関わりや、自分の意思の強さを表すものだよ',
    output: '表現することや、何かを作り出すことに関わるものだよ',
    wealth: '物事を動かす力や、お金との付き合い方に関わるものだよ',
    power: '役割や責任、社会との関わりを表すものだよ',
    resource: '学ぶことや、人から支えてもらうことに関わるものだよ',
  },
  monthStem: '今月の天干は{monthStem}。あなたの日干、{dayStem}から見ると{label}にあたる。{gloss}。',
  sharpPolarity: '陰陽も同じなので、その傾向が強く出やすいと読むんだ。',
  sharpOutput: '陰陽の組み合わせから、言葉が強く出やすい時期として読んだよ。',
  monthClash: '今月の地支は{monthBranch}、あなたの日支は{dayBranch}。ぶつかり合う「冲」の組み合わせだよ。',
  monthWonjin: '今月の地支は{monthBranch}、あなたの日支は{dayBranch}。すれ違いが生じやすいとされる「怨嗔」の組み合わせだよ。',
  monthHarmony: '今月の地支は{monthBranch}、あなたの日支は{dayBranch}。結び付きやすい「合」の組み合わせだよ。',
  yearClash: '今年の地支は{yearBranch}、あなたの日支は{dayBranch}。ぶつかり合う「冲」の組み合わせだよ。',
  nextTerm: '{term}({day}ごろ)',
  when: '今から{month}{part}まで。{name}から{next}にかけて',
  articleTermStarts: [],
  parts: { early: '上旬', mid: '中旬', late: '下旬' },
  termNames: {
    'Start of Spring': '立春',
    'Awakening of Insects': '啓蟄',
    'Clear and Bright': '清明',
    'Start of Summer': '立夏',
    'Grain in Ear': '芒種',
    'Minor Heat': '小暑',
    'Start of Autumn': '立秋',
    'White Dew': '白露',
    'Cold Dew': '寒露',
    'Start of Winter': '立冬',
    'Major Snow': '大雪',
    'Minor Cold': '小寒',
  },
};
