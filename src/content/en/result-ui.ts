import type { ChapterInfo } from '@/lib/reading/traits-types';

export interface ChapterWhen {

  month: string;
  year: number;
}

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

function remainingAfterNext(c: ChapterInfo): number {
  return Math.max(0, c.total - c.index - 1 - (c.next ? 1 : 0));
}

function nextTitle(c: ChapterInfo): string | null {
  if (!c.next) return null;
  return c.next.title === c.title ? `${c.next.title} again` : c.next.title;
}

export const RESULT_UI = {

  whatISee: {

    yourAnswer: 'Your answer:',

    progress: (done: number, total: number) => `${done} of ${total} answered`,

    yulSays: 'Yul:',
    reactions: {

      mostlyNo: [
        'Fair. Three lines can’t hold a whole person, and those didn’t fit you.',
        'Not quite, then. Thanks for telling me, you know your own life best.',
        'Okay. I missed on those, and I won’t pretend I didn’t.',
      ],
    },

    timeNote: {
      unknown: 'You didn’t give me a birth time, so I read three pillars instead of four, and that can tilt things. Want to add it?',
      nearMidnight: 'You were born close to midnight, and that’s where a reading tilts most easily. Is your birth time right?',
      linkUnknown: 'Add my birth time',
      linkCheck: 'Check my birth time',
    },

    bonusTry: 'Let me try one more.',

    bonusAfter: {
      yes: 'There it is. Now, the good news.',
      no: 'Fair enough. You still get the good news.',
    },
  },

  chapters: {

    stripLabel: (current: number, total: number) =>
      `Your ${total} ten-year chapters. You are in chapter ${current}.`,
    stripLabelBefore: (total: number) => `Your ${total} ten-year chapters. The first one has not opened yet.`,
    stripLabelClosed: 'Your ten-year chapters, still closed.',
    stripCaption: 'Each block is ten years. The number is the age it starts.',

    here: 'You are here',

    failed: 'I couldn’t open it just now. Try again?',

    headline: (c: ChapterInfo, when: ChapterWhen | null): { lead: string; detail: string } =>
      c.beforeStart
        ? { lead: 'Your first chapter hasn’t opened yet.', detail: `At age ${c.startAge}, it begins: ${c.title}.` }
        : {
            lead: `You’re in chapter ${c.index + 1}: ${c.title}.`,
            detail: when
              ? `It opened in ${when.month} ${when.year}, when you were ${c.startAge}, and runs ten years.`
              : `It opened when you were ${c.startAge}, and runs ten years.`,
          },

    next: (c: ChapterInfo, when: ChapterWhen | null): string | null => {
      const title = nextTitle(c);
      if (!title || !c.next) return null;
      return when ? `${title}, from ${when.month} ${when.year + 10}.` : `${title}, from age ${c.next.startAge}.`;
    },

    restClosed: (c: ChapterInfo): string | null => {
      const n = remainingAfterNext(c);
      if (n === 0) return null;
      return n === 1
        ? 'One more is still closed. I’ll open it with you.'
        : `${NUMBER_WORDS[n] ?? String(n)} more are still closed. I’ll open them with you.`;
    },
  },

  deeper: {
    sectionLabel: 'More of your reading',

    lead: 'There’s another room further in. I only showed you this one.',

    bridge: (c: ChapterInfo, name: string, when: ChapterWhen | null, nextChapterTitle?: string | null): string => {
      void when;
      const who = name.trim();
      const lead = who ? `${who}, I` : 'I';

      const inMiddle = (title: string) => title.replace(/^The /, 'the ');
      const next = nextChapterTitle === undefined ? (c.next?.title ?? null) : nextChapterTitle;
      const where = next ? `, and ${inMiddle(next)} is next.` : ' at your map.';
      return `${lead} peeked ahead${where} Further in, Yeon marks the good years for love.`;
    },

    bridgeGeneric: 'I peeked ahead at your map. Further in, Yeon marks the good years for love.',

    bridgeNoSex:
      'Your life map is still closed, and I already peeked. Open it above and I’ll show you the chapter you’re in; the rest is further in.',

    want: 'Want to know more? I’ll go through all of it with you, the big picture of your life and the themes to look out for along the way.',

    menuHeading: 'In the inner rooms',

    honest: (price: string): string => `Each room is ${price}. Step into whichever one calls to you.`,

    cta: 'Explore the rooms',
    writing: 'Yul is writing',
  },
} as const;

export type ResultUiCopy = typeof RESULT_UI;
