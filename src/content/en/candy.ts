import type { GodGroup } from '@/lib/saju/types';
import type { CandyBook, CandyLine, ReadingLibrary } from '@/lib/reading/types';

function lines(book: CandyBook, group: GodGroup, texts: string[]): CandyLine[] {
  return texts.map((text, i) => ({ id: `${book}-${group}-${i + 1}`, text }));
}

export const CANDY: ReadingLibrary['candy'] = {
  love: {
    peer: lines('love', 'peer', [
      'This month, easy company counts as romance. Notice who you can sit beside in comfortable silence; that’s a very good sign.',
      'You’re steady on your own two feet, and it looks good on you. Confidence travels faster than any text message.',
      'Your circle is warm and close right now. Friendship is a lovely doorway, and I’ve watched some of the best love walk in through it.',
      'You’re good company without rehearsing for it. Even the story you tell badly is better in your own voice.',
      'Notice who laughs at the same moment you do. That kind of matching is rarer than butterflies, and I’d pay attention to it.',
      'Your yes and your no are both clear right now. Clear is what makes someone feel safe near you; I can tell.',
    ]),
    output: lines('love', 'output', [
      'Your words land softer and sparkle more than usual this month. Even your typos sound charming; I checked.',
      'You’re funny and warm at the same time this month, which is a dangerous and lovely combination. Try not to look so pleased about it.',
      'Your charm is turned all the way up, and you didn’t even touch the dial. Walk in like you own the place.',
      'A silly photo or a rambling voice note can make someone’s day. Your ordinary, unpolished warmth is part of the appeal.',
      'Tell the truth gently and it will sound like poetry. Try it on someone you like.',
      'You’re chatty and curious, and conversation is where sparks start. Ask the second question; that’s the one that does it.',
    ]),
    wealth: lines('love', 'wealth', [
      'People are noticeably drawn to you this month. Let yourself enjoy being looked at kindly.',
      'Your taste is sharp and your timing is sweet. Plan something small and lovely, like a corner table, a late walk, or a bakery that is still open.',
      'A small invitation can be worth accepting this month. The quiet plan may be the one you’re glad you made time for.',
      'You know what you like and you’re not shy about it. That’s the most attractive thing a person can wear, and you’re wearing it well.',
      'Small real-life gestures, like a held door or a remembered coffee order, count double right now. Notice them, and give a few yourself.',
      'Little plans suit you this month, like a time, a place, a reason to dress up. Make one just for the pleasure of it.',
      'The forecast for your love life is golden light, a soft breeze, and a good chance of being noticed. I checked twice.',
    ]),
    power: lines('love', 'power', [
      'You know what you are looking for, and it shows. Knowing what you want is attractive, and people can feel it from the doorway.',
      'Steady beats flashy this month. Someone who shows up on time, every time, is worth more than a good first line.',
      'This month, love is paying attention. Pull up a chair; that seat was always yours.',
      'This is a good season to say what you actually want and see who leans in. The ones worth keeping do.',
      'Your standards are shining. You deserve consistency, kindness, and a text back, all three.',
      'Something that began casually could deepen if you let it be seen in daylight. Daylight suits you.',
    ]),
    resource: lines('love', 'resource', [
      'Soft things find you this month: a warm message, a kind favor, a hand with the heavy bag. Let yourself receive them.',
      'You can let someone make the tea this time. It feels rather nice once you stop trying to get up and help.',
      'Someone remembers the small thing you mentioned once. Notice who; that’s what care looks like.',
      'Quiet evenings are a love language this season. Sogeum approves, mostly by snoring.',
      'Home feels like a person, or a person feels like home. Either way, you can exhale.',
      'There’s room for a slower kind of affection this month. A quiet evening together can be plenty.',
    ]),
  },
  general: {
    peer: lines('general', 'peer', [
      'You’re surrounded by your people this month: the ones who get your jokes without a footnote. I can see them from here.',
      'Your confidence is back at full height, so stand up straight and let it be obvious. It suits you.',
      'A friend is a tailwind right now. Hand them one thing you’ve been carrying alone; two pairs of hands make it lighter.',
      'You don’t have to compete with anyone this season. The path in front of you is just wide enough, no elbowing needed.',
      'Your people are in your corner. Let that settle in.',
    ]),
    output: lines('general', 'output', [
      'Ideas come easily this month. Tell someone the one you’ve been rehearsing alone; I suspect it’s better with a listener.',
      'You’re good at making things this month, whether it’s a plan, a meal, a mood, or a joke. Make something small and put it in the world.',
      'Your voice is clear this month. People may be more receptive than you expect, so give that idea a fair hearing in your own voice.',
      'A creative itch is a good itch. Scratch it, even badly; especially badly.',
      'You turn ordinary hours into stories right now. Jot a few down; they’ll make you smile later.',
    ]),
    wealth: lines('general', 'wealth', [
      'Things you’ve been planting are coming within reach. Gather them gently, no rush, no shoving.',
      'Your judgment is sharp this month. You’ll spot the good option in a pile of okay ones, probably before I finish my tea.',
      'Small pleasures are close at hand, like good food, a long walk, or sunlight on a table. Take them without guilt.',
      'Doors open when you walk up with a plan and a smile. Bring both; I’ll be watching from the stairs.',
      'You know what you want, and you can get there one pleasant step at a time. The staircase is shorter than it looks.',
    ]),
    power: lines('general', 'power', [
      'You’re coming across as dependable, and it suits you. Quiet competence is turning heads, and you haven’t noticed, which is part of the charm.',
      'A little structure turns out to be freeing. Make the plan, and the rest of the week gets lighter.',
      'People listen when you set a boundary kindly. You’ve earned that voice, and I’d use it more often.',
      'Something you’ve been working on is ready to be taken seriously, and so are you. I’m taking you seriously, if that helps.',
      'A good routine you set now will hold like a handrail on the stairs. Lean on it, and let go whenever you like.',
    ]),
    resource: lines('general', 'resource', [
      'A friend’s advice or a well-timed book may help something click this month. You don’t have to work it all out alone.',
      'This is a month for learning, and it’s a delight. Follow what interests you without justifying it, the way I never justify mine.',
      'You can rest and still be getting somewhere; rest counts as part of the plan. I’ve watched a good nap fix a whole season.',
      'People look out for you more than you notice. Look around: there’s a hand on the railing right next to yours.',
      'Your mind is clear and quiet, like a courtyard after rain, and good ideas are easy to hear there. Stay a while.',
    ]),
  },
};
