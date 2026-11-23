import { asksContact, type XmasContact, type XmasGoal, type XmasRelation, type XmasStage } from './relation';

export const QUIZ_AXES = ['go', 'say', 'sure', 'lead'] as const;
export type QuizAxis = (typeof QUIZ_AXES)[number];

export const AXIS_LETTERS: Record<QuizAxis, readonly [string, string]> = {
  go: ['G', 'W'],
  say: ['T', 'A'],
  sure: ['S', 'F'],
  lead: ['L', 'M'],
};

export type QuizPart = 'now' | QuizAxis | 'xmas';

export interface QuizQuestion {
  id: string;
  part: QuizPart;

  scores?: readonly (1 | 0 | -1)[];

  size?: 2 | 3 | 4;
}

export const QUIZ: readonly QuizQuestion[] = [

  { id: 's1', part: 'now', size: 4 },
  { id: 's2', part: 'now', size: 3 },
  { id: 's3', part: 'now', size: 4 },
  { id: 's4', part: 'now', size: 3 },
  { id: 's5', part: 'now', size: 3 },
  { id: 's6', part: 'now', size: 4 },
  { id: 's7', part: 'now', size: 3 },
  { id: 's8', part: 'now', size: 3 },

  { id: 'g1', part: 'go', scores: [1, -1, -1] },
  { id: 'g2', part: 'go', scores: [1, 0, -1] },
  { id: 'g3', part: 'go', scores: [1, 0, -1] },
  { id: 'g4', part: 'go', scores: [1, -1] },
  { id: 'g5', part: 'go', scores: [1, 0, -1] },
  { id: 'g6', part: 'go', scores: [1, 0, -1] },

  { id: 't1', part: 'say', scores: [1, -1, 1, -1] },
  { id: 't2', part: 'say', scores: [1, -1, -1] },
  { id: 't3', part: 'say', scores: [1, -1, 0] },
  { id: 't4', part: 'say', scores: [1, -1, 0] },
  { id: 't5', part: 'say', scores: [1, -1, 0] },
  { id: 't6', part: 'say', scores: [1, -1] },

  { id: 'c1', part: 'sure', scores: [1, 1, -1] },
  { id: 'c2', part: 'sure', scores: [1, 0, -1] },
  { id: 'c3', part: 'sure', scores: [1, -1, 0] },
  { id: 'c4', part: 'sure', scores: [1, -1] },
  { id: 'c5', part: 'sure', scores: [1, -1, 0] },
  { id: 'c6', part: 'sure', scores: [1, -1] },

  { id: 'l1', part: 'lead', scores: [1, 1, -1] },
  { id: 'l2', part: 'lead', scores: [1, 0, -1] },
  { id: 'l3', part: 'lead', scores: [1, -1, 0] },
  { id: 'l4', part: 'lead', scores: [1, -1, 0] },
  { id: 'l5', part: 'lead', scores: [1, -1] },
  { id: 'l6', part: 'lead', scores: [1, -1, 0] },

  { id: 'x1', part: 'xmas', size: 4 },
  { id: 'x2', part: 'xmas', size: 3 },
  { id: 'x3', part: 'xmas', size: 4 },
  { id: 'x4', part: 'xmas', size: 3 },
  { id: 'x5', part: 'xmas', size: 3 },
  { id: 'x6', part: 'xmas', size: 3 },
  { id: 'x7', part: 'xmas', size: 2 },
  { id: 'x8', part: 'xmas', size: 4 },
];

export const QUIZ_LENGTH = QUIZ.length;
const LETTERS = 'abcd';

export function optionCount(q: QuizQuestion): number {
  return q.scores ? q.scores.length : (q.size ?? 0);
}

export function optionLetter(k: number): string {
  return LETTERS[k];
}

export function parseQuizAnswers(v: unknown): string | null {
  if (typeof v !== 'string' || v.length !== QUIZ_LENGTH) return null;
  for (let i = 0; i < QUIZ_LENGTH; i++) {
    const k = LETTERS.indexOf(v[i]);
    if (k < 0 || k >= optionCount(QUIZ[i])) return null;
  }
  return v;
}

function pick(answers: string, id: string): number {
  return LETTERS.indexOf(answers[QUIZ.findIndex((q) => q.id === id)]);
}

export function quizAxes(answers: string): Record<QuizAxis, number> {
  const out: Record<QuizAxis, number> = { go: 0, say: 0, sure: 0, lead: 0 };
  QUIZ.forEach((q, i) => {
    if (!q.scores || q.part === 'now' || q.part === 'xmas') return;
    out[q.part] += q.scores[LETTERS.indexOf(answers[i])] ?? 0;
  });
  return out;
}

export function quizType(answers: string): string {
  const axes = quizAxes(answers);
  return QUIZ_AXES.map((axis) => {
    let v = axes[axis];
    if (v === 0) {
      const i = QUIZ.findIndex((q) => q.part === axis);
      v = QUIZ[i].scores?.[LETTERS.indexOf(answers[i])] ?? 1;
    }
    return AXIS_LETTERS[axis][v >= 0 ? 0 : 1];
  }).join('');
}

export const QUIZ_TYPES: readonly string[] = AXIS_LETTERS.go.flatMap((a) =>
  AXIS_LETTERS.say.flatMap((b) => AXIS_LETTERS.sure.flatMap((c) => AXIS_LETTERS.lead.map((d) => a + b + c + d))),
);

export function quizTypeArt(type: string): string {
  return `/media/xmas/types/${type}.jpg`;
}

export function parseQuizType(v: unknown): string | null {
  return typeof v === 'string' && QUIZ_TYPES.includes(v) ? v : null;
}

const STAGE_BY_S1: readonly XmasStage[] = ['far', 'friend', 'talking', 'past'];
const GOALS: readonly XmasGoal[] = ['meet', 'closer', 'confess', 'decide'];
const CONTACTS: readonly XmasContact[] = ['often', 'sometimes', 'rarely'];

export function quizRelation(answers: string): XmasRelation {
  const s1 = pick(answers, 's1');
  const daily = pick(answers, 's2') === 0 && (s1 === 0 || s1 === 1);
  const stage: XmasStage = daily ? 'daily' : STAGE_BY_S1[s1];
  const contact = asksContact(stage) ? CONTACTS[pick(answers, 's4')] : null;
  return { stage, goal: GOALS[pick(answers, 's3')], contact };
}

const FACTS: Record<string, readonly string[]> = {
  s2: ['They see each other almost every day.', 'They see each other now and then.', 'They barely see each other these days.'],
  s4: ['They text often these days.', 'They text now and then.', 'They barely text these days.'],
  s5: ['Last talked this week.', 'Last talked this month.', 'It has been a while since they last talked.'],
  s6: ['The reader is usually the one who reaches out first.', 'Reaching out is about half and half.', 'That person usually reaches out first.', 'They have no reason to text each other yet.'],
  s7: ['They share many mutual friends.', 'They share a few mutual friends.', 'They have no mutual friends.'],
  s8: ['They have met one on one before.', 'They have only met in groups.', 'They have not had a real conversation yet.'],
  x1: ['Wants: a walk under Christmas lights.', 'Wants: a warm meal together.', 'Wants: a movie or an exhibition.', 'Wants: a get-together with friends.'],

  x2: ['Preferred time of day to meet (not to text): daytime.', 'Preferred time of day to meet (not to text): evening.', 'Preferred time of day to meet (not to text): late night.'],
  x3: ['Preferred channel: KakaoTalk message.', 'Preferred channel: Instagram DM.', 'Preferred channel: phone call.', 'Preferred channel: in person.'],
  x4: ['Wants to spend it just the two of them.', 'Prefers a group setting.', 'Either two of them or a group is fine.'],
  x5: ['Wants to prepare a small gift.', 'Wants to give words, not a gift.', 'Not sure about a gift yet.'],
  x6: ['Prefers Christmas Eve.', 'Prefers Christmas Day.', 'Any day that week is fine.'],
  x7: ['Wants it light and casual.', 'Wants it to feel special.'],
  x8: ['Biggest worry: sending the first message.', 'Biggest worry: bringing up a Christmas plan.', 'Biggest worry: what to say in person.', 'Biggest worry: being turned down.'],
};

const AXIS_FACTS: Record<QuizAxis, readonly [string, string]> = {
  go: ['Approach: moves first.', 'Approach: waits for the other side.'],
  say: ['Shows feelings: with words.', 'Shows feelings: with actions and small care.'],
  sure: ['When unsure: needs clear confirmation.', 'When unsure: lets things flow.'],
  lead: ['Together: takes the lead and plans.', 'Together: goes along with the other person.'],
};

export function quizFactLines(answers: string, shown?: { name: string; line: string }): string[] {
  const axes = quizAxes(answers);
  const type = quizType(answers);
  const lines = [`Love type from the 40-question test: ${type} (G/W approach, T/A expression, S/F certainty, L/M leading).`];
  if (shown) lines.push(`The type name the reader saw on the result screen: "${shown.name}". Its one-liner: "${shown.line}".`);
  QUIZ_AXES.forEach((axis, i) => lines.push(`${AXIS_FACTS[axis][type[i] === AXIS_LETTERS[axis][0] ? 0 : 1]} (score ${axes[axis]} of ±6)`));
  for (const id of Object.keys(FACTS)) lines.push(FACTS[id][pick(answers, id)]);
  return [...lines, ...quizTensions(answers)];
}

export function quizTensions(answers: string): string[] {
  const type = quizType(answers);
  const [go, say, , lead] = type;
  const out: string[] = [];
  const s6 = pick(answers, 's6');
  const x8 = pick(answers, 'x8');
  if (go === 'W' && s6 === 0) out.push('Tension: waits by habit, yet the reader is the one who usually texts first (texts first, but waits for the other person to make the real move).');
  if (go === 'G' && s6 === 2) out.push('Tension: moves first by habit, yet that person is usually the one who texts first.');
  if (lead === 'L' && x8 === 1) out.push('Tension: likes to lead and plan, yet the biggest worry is bringing up a Christmas plan.');
  if (go === 'W' && pick(answers, 's3') === 0) out.push('Tension: waits by habit, yet the goal is to actually meet at Christmas.');
  if (say === 'T' && x8 === 2) out.push('Tension: shows feelings with words, yet worries about what to say in person.');
  if (say === 'A' && pick(answers, 'x5') === 1) out.push('Tension: shows feelings with actions and small care, yet chose words over a gift this time.');
  return out;
}
