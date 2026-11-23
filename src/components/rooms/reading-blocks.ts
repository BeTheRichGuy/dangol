import { splitSentences } from '../result/webtoon-text';

export type Inline = { text: string; bold: boolean }[];

export type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'lead'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'evidence'; text: string }

  | { kind: 'summary'; items: Inline[] }

  | { kind: 'callout'; text: Inline }
  | { kind: 'list'; items: Inline[] }

  | { kind: 'line'; lines: Inline[] };

export type WebtoonBeat = { text: string }[];

export const WEBTOON_MARK = '[webtoon]';
export const READING_MARK = '[reading]';

export function inline(text: string): Inline {
  const out: Inline = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), bold: false });
    out.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), bold: false });
  return out;
}

const LEAD = /^\*\*[^*]+\*\*$/;

export function splitReading(text: string, streaming: boolean): { beats: WebtoonBeat[]; body: string; webtoonDone: boolean } {
  const src = text.replace(/\r/g, '');
  const head = src.trimStart();
  if (!head.startsWith(WEBTOON_MARK)) {
    if (streaming && WEBTOON_MARK.startsWith(head)) return { beats: [], body: '', webtoonDone: false };
    return { beats: [], body: src, webtoonDone: true };
  }
  const afterMark = head.slice(WEBTOON_MARK.length);
  const at = afterMark.search(/^\[reading\][ \t]*$/m);
  let part = at < 0 ? afterMark : afterMark.slice(0, at);
  const body = at < 0 ? '' : afterMark.slice(at + READING_MARK.length).replace(/^[ \t]*\n/, '');
  if (at < 0 && streaming) {
    const nl = part.lastIndexOf('\n');
    part = nl < 0 ? '' : part.slice(0, nl);
  }
  const beats: WebtoonBeat[] = [];
  let beat: WebtoonBeat = [];
  for (const raw of part.split('\n')) {
    const line = raw.trim().replace(/^[-*•>]\s+/, '');
    if (!line) {
      if (beat.length) beats.push(beat);
      beat = [];
      continue;
    }
    const said = line.replace(/\*\*/g, '').trim();
    if (said) beat.push({ text: said });
  }
  if (beat.length) beats.push(beat);
  return { beats, body, webtoonDone: at >= 0 };
}

export const CHAPTERS_MARK = '[chapters]';

export type ReadingFormat = 'chapters' | 'webtoon' | 'prose';

export function readingFormat(text: string): ReadingFormat {
  const head = text.replace(/\r/g, '').trimStart();
  if (head.startsWith(WEBTOON_MARK)) return 'webtoon';

  if (head.startsWith(CHAPTERS_MARK) || (head.length > 0 && CHAPTERS_MARK.startsWith(head))) return 'chapters';
  return 'prose';
}

export interface ChapterPart {

  title: string;

  beats: string[];

  body: string;

  complete: boolean;
}

const PANEL_LINE = /^(?:[-*•]\s+)?[@＠][0-9０-９]+[:：.．)]?(?:\s*(.+))?$/;

const MARKER_START = /^\s*(?:[@＠#[*>\-•]|$)/;

export function splitChapters(text: string, streaming: boolean): ChapterPart[] {
  const head = text.replace(/\r/g, '').trimStart();
  if (!head.startsWith(CHAPTERS_MARK)) return [];
  let src = head.slice(CHAPTERS_MARK.length);
  if (streaming) {
    const nl = src.lastIndexOf('\n');
    const tail = nl < 0 ? src : src.slice(nl + 1);
    if (MARKER_START.test(tail)) src = nl < 0 ? '' : src.slice(0, nl);
  }
  const parts = src.split(/^## /m).slice(1);

  const unquote = (s: string): string => {
    const pairs: readonly [string, string][] = [['"', '"'], ['“', '”'], ['「', '」'], ['『', '』']];
    for (const [open, close] of pairs) {
      if (s.length > 2 && s.startsWith(open) && s.endsWith(close) && !s.slice(1, -1).includes(open) && !s.slice(1, -1).includes(close)) return s.slice(1, -1).trim();
    }
    return s;
  };
  return parts.map((part, i) => {
    const [first, ...rest] = part.split('\n');
    const beats: string[] = [];
    const body: string[] = [];
    for (const line of rest) {
      const m = PANEL_LINE.exec(line.trim());
      if (!m) {
        body.push(line);
        continue;
      }
      const said = unquote((m[1] ?? '').replace(/\*\*/g, '').trim());
      if (said) beats.push(said);
    }
    return { title: first.replace(/\*\*/g, '').trim(), beats, body: body.join('\n').trim(), complete: !streaming || i < parts.length - 1 };
  });
}

type EvidenceLang = 'ko' | 'ja' | 'en';
const OWNER: Record<EvidenceLang, Record<'self' | 'partner', string>> = {
  ko: { self: '내 사주의', partner: '상대 사주의' },
  ja: { self: 'あなたの', partner: '相手の' },
  en: { self: 'your', partner: 'their' },
};
const CROSS_LABEL: Record<string, Record<EvidenceLang, string>> = {
  relation: { ko: '두 사람 글자 사이의 합·충 관계', ja: '二人の文字どうしの合・冲の関係', en: 'how the two charts’ branches relate (harmony or clash)' },
  dayStems: { ko: '두 사람 일간의 관계', ja: '二人の日干の関係', en: 'the relationship between the two day stems' },
  fills: { ko: '서로 채워 주는 오행', ja: 'お互いを補う五行', en: 'the elements each fills in for the other' },
  score: { ko: '궁합 점수', ja: '相性スコア', en: 'compatibility score' },
};
const OWNED_LABEL: Record<string, Record<EvidenceLang, string>> = {
  elements: { ko: '오행 분포', ja: '五行の分布', en: 'element balance' },
  favorable: { ko: '반가운 오행', ja: 'ありがたい五行', en: 'favorable element' },
  godCounts: { ko: '십성 분포', ja: '十星の分布', en: 'ten-gods balance' },
  luck: { ko: '대운', ja: '大運', en: 'ten-year luck' },
  year: { ko: '해의 운', ja: '年の運', en: 'yearly luck' },
  kind: { ko: '고른 사이의 종류', ja: '選んだ関係', en: 'chosen relationship' },
  age: { ko: '나이', ja: '年齢', en: 'age' },
  pillar: { ko: '여덟 글자', ja: '八字', en: 'four pillars' },
  pillars: { ko: '여덟 글자', ja: '八字', en: 'four pillars' },
};
const EVIDENCE_KEY = /\b(self|partner|cross)\.([A-Za-z]+)(?:\.\w+)*/g;

const XMAS_VALUE_KO: Record<string, string> = {
  far: '멀리서 보는 사이',
  friend: '친구·아는 사이',
  daily: '매일 보는 사이',
  talking: '연락하며 알아가는 사이',
  past: '예전엔 가까웠던 사이',
  meet: '둘이 만나기',
  closer: '지금보다 가까워지기',
  confess: '마음 전하기',
  decide: '관계를 정하기',
  often: '자주 연락',
  sometimes: '가끔 연락',
  rarely: '거의 연락 없음',
  none: '그 사람 생일 모름',
  date: '그 사람 생일만 앎',
  full: '그 사람 생일·시간 앎',
  early: '이른 때',
  late: '약속 준비할 때',
  ask: '약속 꺼낼 때',
  eve: '이브',
  close: '연락하기 좋은 날',
  group: '모임에 좋은 날',
  bloom: '눈에 띄는 날',
  caution: '쉬어 가는 날',
  peer: '함께 배우고 일하는 자리',
  output: '취미나 모임 자리',
  wealth: '일하다 마주치는 자리',
  power: '일터나 정해진 모임',
  resource: '배우는 자리·소개',
};
const XMAS_KEY_KO: Record<string, string> = {
  'pulls.days': '날짜',
  'pulls.months': '실이 당겨지는 달',
  'pulls.meet': '실이 잘 걸리는 자리',
  'relation.askDays': '약속 잡기 좋은 날',
  'relation.moves': '이 사이에 맞춘 방향',
  'relation.stage': '그 사람과의 사이',
  'relation.goal': '바라는 것',
  'relation.contact': '요즘 연락',
  'relation.tier': '그 사람 정보',
  'relation.phase': '산 때',
  'relation.today': '오늘',
};
const XMAS_KEY = /\b(?:xmas\.)?(pulls|relation)\.([A-Za-z]+)(?:\.[A-Za-z]+)*(?:\s*(?:=|:)\s*([a-z]+)\b)?/g;
const XMAS_WORD = new RegExp(`\\b(${Object.keys(XMAS_VALUE_KO).join('|')})\\b`, 'g');

const XMAS_MEET_PAIR = /\bmeet\s*[:=]\s*(peer|output|wealth|power|resource)\b/g;

export function humanizeXmasKeys(text: string): string {
  return text
    .replace(XMAS_KEY, (whole, group: string, key: string, value?: string) => {
      const label = XMAS_KEY_KO[`${group}.${key}`];
      if (!label) return whole;
      const v = value ? XMAS_VALUE_KO[value] : undefined;
      return v ? `${label}: ${v}` : label;
    })
    .replace(XMAS_MEET_PAIR, (_, v: string) => `실이 잘 걸리는 자리: ${XMAS_VALUE_KO[v]}`)
    .replace(XMAS_WORD, (w: string) => XMAS_VALUE_KO[w]);
}

export function dropDangsin(text: string): string {
  return text.replace(/당신(?:에게|한테|께서|께|은|는|이|가|의|을|를|과|와|도|만)?\s*/g, '').replace(/(?:다음다음|다음|이번)\s?주\s+(?=\d{1,2}일)/g, '');
}

const XMAS_VALUE_I18N: Record<'en' | 'ja', Record<string, string>> = {
  en: {
    far: 'seeing them from a distance', friend: 'friends', daily: 'seeing each other daily', talking: 'texting and getting to know each other', past: 'used to be close',
    meet: 'seeing them, just you two', closer: 'getting closer', confess: 'telling them how you feel', decide: 'deciding what to do',
    often: 'talk often', sometimes: 'talk now and then', rarely: 'hardly talk', none: 'their birthday unknown', date: 'their birthday only', full: 'their birthday and hour',
    early: 'early', late: 'getting ready to ask', ask: 'time to ask', eve: 'Christmas Eve',
    close: 'good day to start a conversation', group: 'good day for group plans', bloom: 'a day you stand out', caution: 'a day to take it easy',
    peer: 'places you learn or work together', output: 'hobbies and gatherings', wealth: 'running into each other through work', power: 'work or a set group', resource: 'classes and introductions',
  },
  ja: {
    far: '遠くから見ている関係', friend: '友だち・知り合い', daily: '毎日会う関係', talking: '連絡を取りながら仲良くなっている関係', past: '前は仲がよかった関係',
    meet: 'ふたりで会う', closer: 'いまより仲良くなる', confess: '気持ちを伝える', decide: '関係を決める',
    often: 'よく連絡', sometimes: 'たまに連絡', rarely: 'ほとんど連絡なし', none: 'あの人の誕生日は不明', date: 'あの人の誕生日だけわかる', full: 'あの人の誕生日と時間がわかる',
    early: '早い時期', late: '誘う準備の時期', ask: '誘う時期', eve: 'イブ',
    close: '話しかけやすい日', group: 'みんなで集まるのにいい日', bloom: '目立ちやすい日', caution: '少しひと休みする日',
    peer: '一緒に学び働く場', output: '趣味や集まりの場', wealth: '仕事で顔を合わせる場', power: '職場や決まった集まり', resource: '習いごと・紹介の場',
  },
};
const XMAS_KEY_I18N: Record<'en' | 'ja', Record<string, string>> = {
  en: {
    'pulls.days': 'dates', 'pulls.months': 'months your thread pulls', 'pulls.meet': 'where your thread catches', 'relation.askDays': 'best day to ask about plans', 'relation.moves': 'moves for this stage',
    'relation.stage': 'stage you chose', 'relation.goal': 'what you want', 'relation.contact': 'contact lately', 'relation.tier': 'what you know about them', 'relation.phase': 'when you bought', 'relation.today': 'today',
  },
  ja: {
    'pulls.days': '日付', 'pulls.months': '糸が引かれる月', 'pulls.meet': '糸が引っかかりやすい場所', 'relation.askDays': '誘いやすい日', 'relation.moves': 'この関係に合わせた方向',
    'relation.stage': '選んだ関係', 'relation.goal': '叶えたいこと', 'relation.contact': '最近の連絡', 'relation.tier': 'あの人の情報', 'relation.phase': '購入した時期', 'relation.today': '今日',
  },
};
const XMAS_DAY_IN_PARENS = /\((close|group|bloom|caution)\b/g;

function humanizeXmasKeysI18n(text: string, lang: 'en' | 'ja'): string {
  const V = XMAS_VALUE_I18N[lang];
  const sep = lang === 'en' ? ': ' : ': ';
  const out = text
    .replace(XMAS_KEY, (whole, group: string, key: string, value?: string) => {
      const label = XMAS_KEY_I18N[lang][`${group}.${key}`];
      if (!label) return whole;
      const v = value ? V[value] : undefined;
      return v ? `${label}${sep}${v}` : label;
    })
    .replace(XMAS_MEET_PAIR, (_, v: string) => `${XMAS_KEY_I18N[lang]['pulls.meet']}${sep}${V[v]}`)
    .replace(XMAS_DAY_IN_PARENS, (_, k: string) => `(${V[k]}`);
  return lang === 'ja' ? out.replace(XMAS_WORD, (w: string) => V[w] ?? w) : out;
}

export function humanizeEvidence(text: string): string {
  const lang: EvidenceLang = /[가-힣]/.test(text) ? 'ko' : /[぀-ヿ]/.test(text) ? 'ja' : 'en';
  text = lang === 'ko' ? humanizeXmasKeys(text) : humanizeXmasKeysI18n(text, lang);
  return text.replace(EVIDENCE_KEY, (_, who: 'self' | 'partner' | 'cross', key: string) => {
    if (who === 'cross') return CROSS_LABEL[key]?.[lang] ?? { ko: '두 사람의 계산값', ja: '二人の計算値', en: 'the pair’s calculated values' }[lang];
    const label = OWNED_LABEL[key]?.[lang];
    if (!label) return { ko: '사주 계산값', ja: '命式の計算値', en: 'chart values' }[lang];
    return lang === 'en' ? `${OWNER.en[who]} ${label}` : `${OWNER[lang][who]} ${label}`.replace('の ', 'の');
  });
}

export function chunkSentences<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0 || items.length <= size + 1) return [[...items]];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  if (out.length > 1 && out[out.length - 1].length === 1) out[out.length - 2].push(...out.pop()!);
  return out;
}

export function parseReading(text: string, opts: { leadAtStart?: boolean; chunk?: number } = {}): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: Inline[] | null = null;
  let summary: Inline[] | null = null;

  const flushSummary = () => {
    if (summary && summary.length) blocks.push({ kind: 'summary', items: summary });
    summary = null;
  };
  const flushPara = () => {
    if (para.length === 0) return;
    const joined = para.join(' ').trim();
    para = [];
    if (!joined) return;
    const parts = chunkSentences(splitSentences(joined), opts.chunk ?? 0);
    for (const part of parts) blocks.push({ kind: 'line', lines: part.map(inline) });
  };
  const flushList = () => {
    if (list && list.length) blocks.push({ kind: 'list', items: list });
    list = null;
    flushSummary();
  };

  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    if (summary && !/^\+\s+\S/.test(line)) flushSummary();
    if (line.startsWith('### ')) {
      flushPara();
      flushList();
      blocks.push({ kind: 'h3', text: line.slice(4).replace(/\*\*/g, '').trim() });
    } else if (line.startsWith('## ')) {
      flushPara();
      flushList();
      blocks.push({ kind: 'h2', text: line.slice(3).replace(/\*\*/g, '').trim() });
    } else if (line.startsWith('# ')) {

      flushPara();
      flushList();
      blocks.push({ kind: 'h2', text: line.slice(2).replace(/\*\*/g, '').trim() });
    } else if (line.startsWith('>')) {
      flushPara();
      flushList();
      blocks.push({ kind: 'evidence', text: humanizeEvidence(line.replace(/^>\s?/, '')) });
    } else if (/^\+\s+\S/.test(line)) {
      flushPara();
      if (list) flushList();
      summary ??= [];
      summary.push(inline(line.replace(/^\+\s+/, '')));
    } else if (/^!\s+\S/.test(line)) {
      flushPara();
      flushList();
      blocks.push({ kind: 'callout', text: inline(line.replace(/^!\s+/, '').replace(/^\*\*(.+)\*\*$/, '$1')) });
    } else if (/^[-*•]\s+/.test(line)) {
      flushSummary();
      flushPara();
      list ??= [];
      list.push(inline(line.replace(/^[-*•]\s+/, '')));
    } else if (LEAD.test(line) && para.length === 0 && !list && (blocks[blocks.length - 1]?.kind === 'h2' || (opts.leadAtStart && blocks.length === 0))) {

      blocks.push({ kind: 'lead', text: line.slice(2, -2).trim() });
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

export function visibleBlocks(blocks: readonly Block[]): Block[] {
  return blocks.filter((b) => b.kind !== 'evidence');
}

export function fillName(text: string, name: string): string {
  const n = name.trim();
  if (n) return text.replaceAll('{name}', n);
  return text
    .replace(/\{name\}(?:님|さん)?\s*[,、，]\s*(\p{Ll})?/gu, (_m, c: string | undefined) => (c ? c.toUpperCase() : ''))

    .replace(/\{name\}님(?=[의은는이가을를께과와도])/gu, '당신')
    .replace(/\{name\}(?:님|さん)?/gu, '');
}
