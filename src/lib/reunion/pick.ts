import type { CrossBlock } from '@/lib/rooms/payload';
import type { ContactId, WantId } from './intake';

export type FlowKey = CrossBlock['dayStems']['flow'];
export type FrayedKey = 'clash' | 'friction' | 'combine' | 'calm';
export type FilledKey = 'theyFilled' | 'iFilled' | 'both' | 'neither';

export const FLOW_KEYS: readonly FlowKey[] = ['same', 'self-feeds-other', 'other-feeds-self', 'self-checks-other', 'other-checks-self'];
export const FRAYED_KEYS: readonly FrayedKey[] = ['clash', 'friction', 'combine', 'calm'];
export const FILLED_KEYS: readonly FilledKey[] = ['theyFilled', 'iFilled', 'both', 'neither'];

const CLASH = new Set<string>(['沖']);
const FRICTION = new Set<string>(['刑', '自刑', '破', '害', '怨嗔', '鬼門']);
const COMBINE = new Set<string>(['天干合', '六合', '三合', '半合', '方合']);

const POSITION: Record<string, number> = { day: 2, month: 1.5, hour: 1, year: 0.75 };

function weightOf(at: string[]): number {
  return Math.max(...at.map((a) => POSITION[a.split('.')[1] ?? ''] ?? 1));
}

export function frayedKey(cross: Pick<CrossBlock, 'dayStems' | 'relations'>): FrayedKey {
  let clash = cross.dayStems.clash ? 2 : 0;
  let friction = 0;
  let combine = cross.dayStems.combine ? 2 : 0;
  for (const r of cross.relations) {
    const w = weightOf(r.at);
    if (CLASH.has(r.kind)) clash += w;
    else if (FRICTION.has(r.kind)) friction += w;
    else if (COMBINE.has(r.kind)) combine += w;
  }
  const top = Math.max(clash, friction, combine);
  if (top === 0) return 'calm';
  if (clash === top) return 'clash';
  if (friction === top) return 'friction';
  return 'combine';
}

export function filledKey(cross: Pick<CrossBlock, 'fills'>): FilledKey {
  const they = cross.fills.selfMissingOtherHas.length > 0;
  const me = cross.fills.otherMissingSelfHas.length > 0;
  if (they && me) return 'both';
  if (they) return 'theyFilled';
  if (me) return 'iFilled';
  return 'neither';
}

export interface ReunionPick {
  flow: FlowKey;
  frayed: FrayedKey;
  filled: FilledKey;
  contact: ContactId;
  want: WantId;
}

export function pickReunion(cross: CrossBlock, answers: { contact: ContactId; want: WantId }): ReunionPick {
  return { flow: cross.dayStems.flow, frayed: frayedKey(cross), filled: filledKey(cross), contact: answers.contact, want: answers.want };
}
