import type { ChapterInfo, TraitKind } from '@/lib/reading/traits-types';

function remainingAfterNext(c: ChapterInfo): number {
  return Math.max(0, c.total - c.index - 1 - (c.next ? 1 : 0));
}

export const UPSELL = {
  whatISee: {
    heading: 'What I see',
    intro: 'Here are three things that caught my eye right away.',

    labels: {
      core: 'The heart of you',
      pattern: 'A pattern you repeat',
      love: 'In love',
      tension: 'In love',
      missing: 'What you look for in someone',
    } satisfies Record<TraitKind, string>,
    thatsMe: 'That’s me',
    notQuite: 'Not quite',
    bonusHeading: 'What you look for in someone',
    bonusIntro: 'One more thing, and then I’ll stop showing off.',

    yesNeeded: 2,
    reactions: {

      mostlyYes: [
        'I know. Hold that face; the good news is coming.',
        'Told you. Don’t look so surprised.',
        'Mm-hm. I only say what’s there. Good news is next.',
        'I know. Sogeum slept through it, and you didn’t.',
      ],
      mostlyNo: [
        'Fair enough. That line missed you, and you know yourself better than a chart does.',
        'Fair. A chart gives me a starting point, and you get the final say about what fits.',
        'That’s okay. I won’t try to talk you into a description that doesn’t feel like you.',
      ],
    },
  },

  chapters: {
    eyebrow: 'Your life map',

    intro: 'Saju divides life into ten-year chapters. Here’s where your chart places you now.',

    headline: (c: ChapterInfo): string =>
      c.beforeStart
        ? `Your first chapter hasn’t opened yet. At age ${c.startAge}, it begins: ${c.title}.`
        : `You’re in chapter ${c.index + 1}: ${c.title} (age ${c.startAge} to ${c.endAge}, ${c.startYear} to ${c.endYear})`,

    nextLabel: 'Next chapter',

    next: (c: ChapterInfo): string | null =>
      c.next
        ? c.next.title === c.title
          ? `${c.next.title} again, from age ${c.next.startAge}.`
          : `${c.next.title}, from age ${c.next.startAge}.`
        : null,
    lastChapter: 'This is the last chapter on the map. Take your time with it.',

    restClosed: (c: ChapterInfo): string | null => {
      const n = remainingAfterNext(c);
      if (n === 0) return null;
      return n === 1 ? 'One more chapter stays closed for now.' : `${n} more chapters stay closed for now.`;
    },

    needSex: {
      line: 'I need one more thing to open your life map.',
      why: 'Saju sets the direction of your ten-year chapters by a rule from the old books, and the old books only know two answers. That’s all this is for.',
      group: 'For your ten-year chapters',
      woman: 'Woman',
      man: 'Man',

      nonbinary: 'Non-binary',
    },
  },

  deeper: {
    yul: [
      'That was only the first page. I already read ahead, and I’m not telling you all of it yet.',
      'Want the rest? I’ll explore your chart with you: every ten-year chapter, the years a door opens, and the months to say yes to love and to work.',
      'I’ll dig through all of it, the sweet parts and the salty ones.',
      'One honest thing: it isn’t open yet. Leave your email and I’ll tell you the day it is.',
    ],

    notOpen: 'Not open yet. Leave your email and you’ll get it first, at launch price.',
    noCountdown: 'No timers, no countdowns. The door just isn’t open yet.',
  },
} as const;

export type UpsellCopy = typeof UPSELL;
