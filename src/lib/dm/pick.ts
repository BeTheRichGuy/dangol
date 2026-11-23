import type { AreaId } from '../talisman';

export const DEFAULT_TALISMAN: AreaId = 'mind';

const ORDER: readonly AreaId[] = ['love', 'wealth', 'work', 'study', 'bond', 'mind'];

const KEYWORDS: Record<AreaId, readonly string[]> = {
  love: [
    '연애', '사랑', '썸', '짝사랑', '남친', '여친', '남자친구', '여자친구', '결혼', '궁합', '재회', '이별', '소개팅',
    'love', 'crush', 'dating', 'boyfriend', 'girlfriend', 'marriage', 'married', 'romance', 'romantic', 'relationship', 'soulmate', 'ex',
    '恋愛', '好きな人', '片思い', '彼氏', '彼女', '結婚', '復縁', '失恋', '相性',
  ],
  wealth: [
    '돈', '재물', '재테크', '월급', '부자', '저축', '금전', '수입',
    'money', 'wealth', 'rich', 'income', 'salary', 'savings', 'finance', 'financial',
    'お金', '金運', '収入', '貯金', '給料', '財運',
  ],
  work: [
    '직장', '취업', '이직', '퇴사', '커리어', '면접', '회사', '일자리', '사업', '승진',
    'work', 'job', 'career', 'interview', 'resign', 'promotion', 'boss', 'office',
    '仕事', '転職', '就活', '就職', '面接', '退職', '職場', '昇進',
  ],
  study: [
    '공부', '시험', '수능', '학업', '합격', '자격증', '고시', '편입', '대학', '학교', '입시',
    'study', 'studying', 'studies', 'exam', 'test', 'school', 'university', 'college', 'grade', 'student',
    '勉強', '試験', '受験', '合格', '学業', '資格', '大学', '学校',
  ],
  bond: [
    '인간관계', '친구', '가족', '동료', '대인', '엄마', '아빠', '부모',
    'friend', 'family', 'coworker', 'colleague', 'parents', 'mom', 'dad',
    '人間関係', '友達', '友人', '家族', '同僚', '両親',
  ],
  mind: [
    '마음', '불안', '걱정', '위로', '힐링', '번아웃', '스트레스', '지쳐',
    'mind', 'anxious', 'anxiety', 'worry', 'worried', 'stress', 'calm', 'healing', 'burnout', 'tired',
    '不安', '心配', '癒し', 'ストレス', '疲れ',
  ],
};

const LATIN = /^[a-z ]+$/;
const ENDING = '(?:s|es|d|ed|ing)?';

const matcher = (kw: string): RegExp =>
  LATIN.test(kw) ? new RegExp(`\\b${kw}${ENDING}\\b`, 'g') : new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');

function score(text: string): Record<AreaId, number> {
  const t = text.toLowerCase();
  const out = {} as Record<AreaId, number>;
  for (const area of ORDER) out[area] = KEYWORDS[area].reduce((n, kw) => n + (t.match(matcher(kw))?.length ?? 0), 0);
  return out;
}

export function matchTalisman(text: string): AreaId | null {
  const s = score(text);
  let pick: AreaId | null = null;
  for (const area of ORDER) if (s[area] > 0 && (pick === null || s[area] > s[pick])) pick = area;
  return pick;
}

export interface PickInput {
  comment: string;

  caption?: string | null;
}

const XMAS = /크리스마스|christmas|xmas|クリスマス/i;
export function isXmasPost({ comment, caption }: PickInput): boolean {
  return XMAS.test(comment ?? '') || XMAS.test(caption ?? '');
}

export function pickTalisman({ comment, caption }: PickInput): AreaId {
  return matchTalisman(comment ?? '') ?? matchTalisman(caption ?? '') ?? DEFAULT_TALISMAN;
}
