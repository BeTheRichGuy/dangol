import type { TalismanId, TalismanReason } from '@/lib/talisman';

export interface TalismanCopy {

  gift: {

    eyebrow: (keeper: string) => string;
    title: (count: number) => string;
    lead: string;
    reason: Record<TalismanReason, string>;
    look: string;

    tap: string;
  };

  shelf: {
    title: string;
    lead: string;
    count: (have: number, total: number) => string;
    empty: string;
    locked: string;
  };

  sheet: { close: string; save: string; note: string };
  items: Record<TalismanId, { name: string; line: string }>;
}

export const TALISMAN_EN: TalismanCopy = {
  gift: {
    eyebrow: (keeper) => `A little gift from ${keeper}`,
    title: (n) => (n === 1 ? 'A charm for you' : `${n} charms for you`),
    lead: 'This isn’t a spell. Reading your chart, one empty spot stood out, so here’s a small charm to keep close. Save it as an image for your phone background or photo album.',
    reason: {
      missing: 'Missing from your chart',
      weakest: 'The element you have least of',
      asked: 'For what you asked about',
      gap: 'An empty spot in your chart',
    },
    look: 'Look closer',
    tap: 'Tap the charm to see it larger and save it.',
  },
  shelf: {
    title: 'My charms',
    lead: 'Every charm you’ve received. Tap one to see it up close and save it.',
    count: (have, total) => `${have} of ${total}`,
    empty: 'No charms yet. Each reading you finish brings you one new charm.',
    locked: 'Not received yet',
  },
  sheet: {
    close: 'Close',
    save: 'Save as image',
    note: 'Keep it as your phone background or in your photo album.',
  },
  items: {
    wood: { name: 'Wood charm', line: 'For fresh starts and slow, steady growth.' },
    fire: { name: 'Fire charm', line: 'For warmth, courage and a bright first step.' },
    earth: { name: 'Earth charm', line: 'For steadiness, patience and solid footing.' },
    metal: { name: 'Metal charm', line: 'For clean decisions and a polished finish.' },
    water: { name: 'Water charm', line: 'For calm flow and thinking things through.' },
    love: { name: 'Love charm', line: 'For a connection that feels warm and easy.' },
    wealth: { name: 'Wealth charm', line: 'For keeping what comes in and building it slowly.' },
    work: { name: 'Work charm', line: 'For steady progress on what you’ve taken on.' },
    study: { name: 'Study charm', line: 'For learning that piles up one page at a time.' },
    bond: { name: 'People charm', line: 'For friends, family and coworkers growing closer.' },
    mind: { name: 'Heart charm', line: 'For a lighter heart and a quiet place to rest.' },
  },
};
