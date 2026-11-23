export const XMAS_STAGES = ['far', 'friend', 'daily', 'talking', 'past'] as const;
export type XmasStage = (typeof XMAS_STAGES)[number];

export const XMAS_GOALS = ['meet', 'closer', 'confess', 'decide'] as const;
export type XmasGoal = (typeof XMAS_GOALS)[number];

export const XMAS_CONTACTS = ['often', 'sometimes', 'rarely'] as const;
export type XmasContact = (typeof XMAS_CONTACTS)[number];

export interface XmasRelation {
  stage: XmasStage;
  goal: XmasGoal;

  contact: XmasContact | null;
}

export type XmasTier = 'none' | 'date' | 'full';

export function asksContact(stage: XmasStage): boolean {
  return stage === 'friend' || stage === 'daily' || stage === 'past';
}

const has = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v);

export function parseXmasRelation(v: unknown): XmasRelation | null {
  if (typeof v !== 'object' || v === null) return null;
  const { stage, goal, contact } = v as Record<string, unknown>;
  if (!has(XMAS_STAGES, stage) || !has(XMAS_GOALS, goal)) return null;
  if (contact !== null && !has(XMAS_CONTACTS, contact)) return null;
  if (contact !== null && !asksContact(stage)) return null;
  return { stage, goal, contact };
}

export function xmasTier(partner: { chart: { flags: { timeUnknown: boolean } } } | null): XmasTier {
  if (!partner) return 'none';
  return partner.chart.flags.timeUnknown ? 'date' : 'full';
}

export interface XmasMoves {

  now: string;

  contact: string;

  ask: string;

  avoid: readonly string[];

  goal: string;

  adjust: string | null;

  pace: string | null;
}

const STAGE: Record<XmasStage, Omit<XmasMoves, 'goal' | 'adjust' | 'pace'>> = {
  far: {
    now: 'They barely talk yet. The first step is becoming a familiar face through small real exchanges in shared settings, not a confession.',
    contact: 'A light message that is easy to answer and tied to something they already share (a class, a group chat, a post); no personal questions yet.',
    ask: 'Do not ask for a one-on-one Christmas date. Join or start a group plan that includes them.',
    avoid: ['confessing out of the blue', 'reacting to everything they post', 'asking mutual friends what the other person thinks'],
  },
  friend: {
    now: 'There is trust already; the risk is staying filed as "just a friend" or making the friendship awkward.',
    contact: 'Keep the usual friend tone, and add one message that is only about the two of them.',
    ask: 'Suggest a two-person plan before Christmas, framed casually (a movie, a market, a meal).',
    avoid: ['testing them with jealousy', 'a sudden change of tone', 'dropping hints through other friends'],
  },
  daily: {
    now: 'They see each other often, so small everyday moments matter more than big gestures, and the shared workplace or school needs care.',
    contact: 'Move one conversation from the shared place to a private message, about something from that day.',
    ask: 'First ask for a short time outside the usual place (coffee after work or class); Christmas plans come after that.',
    avoid: ['making it awkward at the shared place', 'doing anything showy in front of colleagues or classmates', 'talking about them to people at that place'],
  },
  talking: {
    now: 'They already talk; the step is turning messages into time together.',
    contact: 'Keep the rhythm, and add one concrete question that can lead to a plan.',
    ask: 'Offer two specific dates to choose from, before the 24th.',
    avoid: ['push-pull games such as delaying replies on purpose', 'the vague "언제 한번"', 'sending many messages after a short reply'],
  },
  past: {
    now: 'There is history and distance; respect why it drifted and the time that passed. Never promise or predict getting back together.',
    contact: 'One light check-in that does not reopen the past and is easy to leave unanswered.',
    ask: 'Only if the reply opens the door, suggest a short, low-pressure meeting; otherwise stop there.',
    avoid: ['bringing up old conflicts first', 'sending again after no reply', 'reading meaning into their posts'],
  },
};

const GOAL: Record<XmasGoal, string> = {
  meet: 'The reader wants to spend time together around Christmas: everything builds toward one concrete invitation.',
  closer: 'The reader wants to be closer than now: more small exchanges and one shared moment, not a big event.',
  confess: 'The reader wants to say how they feel: help find words that do not demand an answer on the spot, at a calm moment, in person or by call if possible.',
  decide: 'The reader wants to decide what to do with this relationship: give criteria from the reader\'s side and one small action whose result helps decide; going on and letting go are both valid.',
};

const ADJUST: Partial<Record<`${XmasStage}.${XmasGoal}`, string>> = {
  'far.meet': 'A one-on-one Christmas meeting is too big a jump from here; aim for being in the same group plan.',
  'far.confess': 'Before saying it, have at least a few real conversations; if the reader still wants to say it before Christmas, keep it short and light and expect no answer.',
  'daily.confess': 'Never at the workplace or school itself; outside, in private.',
  'past.meet': 'Meet only if the reply to the check-in invites it.',
  'past.confess': 'Only after there is two-way contact again; never in the first message.',
};

const PACE: Record<XmasContact, string> = {
  often: 'They talk often now: the reader can be a little more direct.',
  sometimes: 'They talk now and then: one step at a time, no sudden jumps.',
  rarely: 'They rarely talk now: start with a reason to talk, not with feelings.',
};

export function xmasMoves(r: XmasRelation): XmasMoves {
  return { ...STAGE[r.stage], goal: GOAL[r.goal], adjust: ADJUST[`${r.stage}.${r.goal}`] ?? null, pace: r.contact ? PACE[r.contact] : null };
}
