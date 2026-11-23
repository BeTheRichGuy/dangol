import type { Element, TypeKey } from '@/lib/saju/types';

export interface WebtoonCopy {
  chapterWho: string;

  chapterConcern: string;
  chapterRoad: string;

  intro: string[];
  introNoName: string[];

  typeCaption: string;
  pillarsLine: string[];
  elementsDominant: Record<Element, string[]>;
  elementsMissing: Record<Element, string[]>;
  elementsBalanced: string[];
  sogeumBreak: string[];

  typeSmoke: Record<TypeKey, string>;

  bridgeStage: string;

  bridgeLine: string;
  handPrompt: string;
  notCurse: string;
}

export const WEBTOON: WebtoonCopy = {
  chapterWho: 'Who you are',
  chapterConcern: '{concern}',
  chapterRoad: 'Your road',

  intro: [
    '{name}. Let me read you.',
    '{name}. Sit still. I’m about to read you.',
    '{name}. Took you long enough. Let me read you.',
  ],
  introNoName: [
    'Let me read you.',
    'Sit still. I’m about to read you.',
    'Took you long enough. Let me read you.',
  ],

  typeCaption: '{born} · {hanzi}',

  pillarsLine: [
    'The calendar gives us these characters. I turn them into a story.',
    'The calendar wrote these the day you were born. I just read them out.',
    'These come from when you were born. Let’s see what the calendar gives us.',
  ],

  elementsDominant: {
    wood: [
      'That’s a lot of Wood. You start the next thing before the last one’s done, and I’d bet there’s a half-finished project in a drawer to prove it.',
      'Wood is strong in this chart. You’re planning the next project while the current one is still spread across the table.',
    ],
    fire: [
      'Fire runs high in you, warm and quick and easy to light. You feel everything in full color and say about half of it.',
      'You light fast and burn bright, and there’s a lot of Fire in you to do it with. It eats through your evenings faster than you plan.',
    ],
    earth: [
      'Earth takes up plenty of room here. You keep things steady, even when you’d quite like someone else to handle the plan.',
      'So much Earth. I suspect you organize the weekend and then wonder why nobody thought to ask what you wanted.',
    ],
    metal: [
      'Metal runs strong in you, clear and exact and hard to fool. You decide fast and soften late.',
      'There’s a lot of Metal in you, which gives you a very good eye for what’s off. It cuts both ways, including at you.',
    ],
    water: [
      'Water floods your characters, and you feel the tide of every room you walk into. You pretend you don’t.',
      'A great deal of Water in you, and a mind that wanders in the best way. You need a shoreline now and then.',
    ],
  },

  elementsMissing: {
    wood: [
      'No Wood among these characters. You may prefer a clear first step to a big speech about fresh starts.',
      'Wood is missing from this chart. Someone who suggests a new café can get you moving before you’ve talked yourself out of it.',
    ],
    fire: [
      'No Fire in these characters. You may take a little longer to warm up, especially in a room full of strangers.',
      'No Fire here on the chart. An easy smile from someone else can make it much easier to offer your own.',
    ],
    earth: [
      'No Earth among these characters. A familiar routine or a favorite chair can help you feel settled.',
      'Earth is missing here. You may appreciate the person who remembers the plan when everyone else is changing it.',
    ],
    metal: [
      'No Metal in these characters. You may need a moment to work out where your yes ends and your no begins.',
      'No Metal here on the chart. If saying no takes you three drafts, someone who says it kindly can be quite impressive.',
    ],
    water: [
      'No Water in these characters. You may find it easier to slow down when someone sits quietly beside you.',
      'Water is missing from this chart. A patient listener may stay on your mind long after a lively conversation.',
    ],
  },

  elementsBalanced: [
    'All five elements are here, and none is shouting. You’ve made my dramatic entrance a little harder.',
    'Nothing overflows and nothing is missing. You can borrow a little from every kind of weather.',
    'All five elements are present. I’ll need more than one glance to make sense of you, and I do like a challenge.',
  ],

  sogeumBreak: [
    'Sogeum is asleep. Heard this one before, apparently.',
    'Sogeum rolls onto the warm side of the table, still asleep.',
    'Sogeum is asleep. A tiny snore of approval.',
    'Sogeum opens one eye, sees it’s only a reading, and goes back to sleep.',
  ],

  typeSmoke: {
    pine: 'In the lantern smoke, I see a pine on a lonely rock.',
    vine: 'In the lantern smoke, I see a vine climbing an old wall.',
    sun: 'In the lantern smoke, I see the sun rising over a shrine roof.',
    candle: 'In the lantern smoke, I see a candle.',
    mountain: 'In the lantern smoke, I see a mountain above the clouds.',
    field: 'In the lantern smoke, I see a golden field and one small figure crossing it.',
    blade: 'In the lantern smoke, I see a blade resting on silk.',
    jewel: 'In the lantern smoke, I see a jewel on a dark tray.',
    ocean: 'In the lantern smoke, I see a moon over open water.',
    rain: 'In the lantern smoke, I see rain falling on a lantern courtyard.',
  },

  bridgeStage: 'Yul lifts the sleeping Sogeum and opens the back door.',
  bridgeLine: 'Come. Let me show you the road.',

  handPrompt: 'That was the good news. Now the bad news. Hold out your hand.',

  notCurse: 'Not a curse. Just weather.',
};
