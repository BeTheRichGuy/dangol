import type { GodGroup } from '@/lib/saju/types';
import { WEBTOON } from './webtoon';

export const ENGINE_COPY = {

  notCurse: WEBTOON.notCurse,

  godLabel: {
    peer: 'a peer stem',
    output: 'an output stem',
    wealth: 'a wealth stem',
    power: 'a power stem',
    resource: 'a resource stem',
  } satisfies Record<GodGroup, string>,
  godGloss: {
    peer: 'it matches you',
    output: 'it favors expression and making things',
    wealth: 'it draws attention to practical goals',
    power: 'it asks more of you',
    resource: 'it favors learning and support',
  } satisfies Record<GodGroup, string>,

  monthStem: 'This month’s stem {monthStem} is {label} for your day stem {dayStem}: {gloss}.',
  sharpPolarity: 'It shares your yin-yang polarity, which gives this theme more emphasis.',

  sharpOutput: 'Its yin-yang polarity is opposite to yours, so your words may come across more sharply than intended.',

  monthClash: 'This month’s branch {monthBranch} clashes with your day branch {dayBranch}.',

  monthWonjin: 'This month’s branch {monthBranch} and your day branch {dayBranch} form a traditionally tense pairing.',
  monthHarmony: 'This month’s branch {monthBranch} pairs with your day branch {dayBranch}, which softens things.',

  yearClash: 'This year’s branch {yearBranch} clashes with your day branch {dayBranch}.',

  nextTerm: '{term} (around {day})',

  when: 'Now through {part} {month}, from {name} to {next}',

  articleTermStarts: ['Start of ', 'Awakening of '] as readonly string[],

  parts: { early: 'early', mid: 'mid', late: 'late' },

  termNames: {} as Record<string, string>,
};
