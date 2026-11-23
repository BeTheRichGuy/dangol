import type { Beat } from '@/components/story/types';
import type { XmasAskCopy, XmasDaysCopy, XmasKeepCopy, XmasMeetCopy, XmasPaidCopy, XmasPairCopy, XmasReviewCopy } from '../xmas';
import type { XmasChapter, XmasPlay } from '../ko/xmas-paid';
import type { XmasStage } from '@/lib/xmas/relation';

const A = '/media/xmas/paid2';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const XMAS_DAYS_EN: XmasDaysCopy = {
  title: '{from} to {to}',
  kinds: {
    close: { mark: '○', label: 'Good day to reach out, one on one' },
    group: { mark: '◎', label: 'Good day for group plans' },
    bloom: { mark: '☆', label: 'A day you stand out more' },
    caution: { mark: '△', label: 'A day to take it easy' },
  },
  weekdays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  date: (m: number, d: number) => `${MONTHS[m - 1]} ${d}`,
  month: (y: number, m: number) => `${MONTH_NAMES[m - 1]} ${y}`,
  special: { '12-24': 'Eve', '12-25': 'Xmas', '12-31': 'NYE', '01-01': 'New Year' },
  count: 'Days with a heart: *{n} in all*',
  none: 'No day really stands out in this stretch. Keeping it normal is best.',
};

export const XMAS_ASK_EN: XmasAskCopy = { day: (d: number) => `Dec ${d}`, or: ' or ', eve: 'today', none: 'any quiet day\nbefore the 24th', someday: 'that day' };

const lastWalk: Beat[] = [
  {
    kind: 'art',
    src: `${A}/08c-wave.jpg`,
    ratio: 2 / 3,
    fade: 'both',
    gap: 30,
    says: [
      { text: 'Don’t untie that thread\nfor a while.', x: 22, y: 50, tail: 'ur' },
      { text: 'See you next Christmas.', x: 64, y: 90, tail: 'ul', big: true },
    ],
  },
  { kind: 'sfx', text: 'Whoosh.', side: 'right', gap: 40 },
  { kind: 'art', src: `${A}/08d-alley-alone{me}.jpg`, ratio: 2 / 3, fade: 'both', gap: 10, notes: [{ text: 'The stairs were gone without a trace.\nOnly the snow kept falling.', x: 50, y: 8 }] },
];

const lastSend = (text: string): XmasPlay => ({ kind: 'send', title: 'Them', to: 'Them', text, send: 'Send', replies: [] });

const ask8 = (text: string): Beat => ({ kind: 'art', src: `${A}/03b-yeon-confident.jpg`, ratio: 1, gap: 12, says: [{ text, x: 50, y: 94, tail: 'ul', big: true }] });

const firstLine = (options: readonly { label: string; reply: string }[]): XmasPlay => ({ kind: 'choice', ask: 'Pick one for your first line.', options });

const chapters: XmasChapter[] = [
  {
    title: 'Why they keep crossing your mind',
    line: 'What pulls you toward them, and which way your thread is leaning.',
    face: `${A}/y01.jpg`,
    open: [
      { kind: 'art', src: `${A}/01a-knot-hands.jpg`, ratio: 3 / 2, gap: 24, notes: [{ text: 'Her fingers, running along the thread, stopped.', x: 50, y: 6 }] },
      { kind: 'say', text: 'Hold on.', gap: 8 },
      {
        kind: 'art',
        src: `${A}/01b-knot-lantern.jpg`,
        ratio: 2 / 3,
        fade: 'both',
        gap: 12,
        says: [{ text: 'Your side of the thread\nis pulled pretty tight.', x: 32, y: 10, tail: 'dr', big: true }],
      },
      { kind: 'me', text: 'Wait, you can tell?', gap: 8 },
      { kind: 'say', text: 'It means you care\nthat much.', big: true, gap: 10 },
    ],
    stage: {
      far: [{ kind: 'say', text: 'You’ve barely talked, huh?\nBut your eyes keep drifting their way.', gap: 10 }],
      friend: [{ kind: 'say', text: 'Being friends makes it even harder to send.\nYou don’t want it to show.', gap: 10 }],
      daily: [{ kind: 'say', text: 'You see them every day, and still nothing to say.\nThat’s the worst part.', gap: 10 }],
      talking: [{ kind: 'say', text: 'You’re talking,\nbut the next step feels harder.', gap: 10 }],
      past: [{ kind: 'say', text: 'Back then you’d have just sent it.\nNow that one line feels heavy.', gap: 10 }],
    },
    close: [{ kind: 'say', text: 'Come outside.\nIt’s easier to see\nwhere things stand from out there.', big: true, gap: 30 }],
  },
  {
    title: 'Where things stand between you two',
    line: 'What’s working for you two right now, and what’s in the way.',
    face: `${A}/y06.jpg`,
    open: [
      {
        kind: 'art',
        src: `${A}/02a-coat-door.jpg`,
        ratio: 2 / 3,
        fade: 'both',
        gap: 24,
        says: [{ text: 'What are you doing?\nComing?', x: 18, y: 23, tail: 'ur', big: true }],
      },
      { kind: 'me', text: 'Oh, you changed?', gap: 10 },
      { kind: 'say', text: 'It’s snowing.\nYou can’t go out dressed like that.', gap: 8 },
      { kind: 'art', src: `${A}/02b-stairs-down{me}.jpg`, ratio: 3 / 2, gap: 30, notes: [{ text: 'The way down felt\nmuch longer than the climb up.', x: 50, y: 88 }] },
      { kind: 'say', text: 'Want to see\nwhere things stand between you two?', gap: 10 },
      { kind: 'me', text: '…I’m not even sure myself.', gap: 8 },
      { kind: 'say', text: 'Then let me take a look.', big: true, gap: 8 },
    ],
    close: [{ kind: 'say', text: 'So that’s where things stand.\nNow let’s look at their thread.', gap: 30 }],
  },
  {
    title: 'What the threads reveal',
    line: 'Two threads side by side. Even without their birthday, I can see you around them.',
    face: `${A}/y05.jpg`,
    card: 'pair',
    open: [{ kind: 'art', src: `${A}/02c-bridge.jpg`, ratio: 3 / 2, fade: 'bottom', gap: 30, notes: [{ text: 'We crossed a snowy stone bridge.', x: 50, y: 8 }] }],
    tier: {
      none: [
        { kind: 'say', text: 'You said you don’t know\ntheir birthday, right?', gap: 10 },
        { kind: 'me', text: '…Right, I don’t.', gap: 8 },
        { kind: 'say', text: 'That’s fine.\nThen I won’t touch their thread.', gap: 10 },
        {
          kind: 'art',
          src: `${A}/03c-one-thread.jpg`,
          ratio: 2 / 3,
          fade: 'both',
          gap: 12,
          says: [{ text: 'But I can see exactly how\nyour thread acts around them.', x: 60, y: 92, tail: 'ul', big: true }],
        },
      ],
      date: [
        { kind: 'say', text: 'Let’s look at the birthday\nyou gave me, too.', gap: 10 },
        { kind: 'me', text: 'I don’t know what time they were born.', gap: 8 },
        { kind: 'say', text: 'That’s okay.\nWe’ll only use what we know.', gap: 10 },
        {
          kind: 'art',
          src: `${A}/03c-two-threads.jpg`,
          ratio: 2 / 3,
          fade: 'both',
          gap: 12,
          says: [{ text: 'Let’s lay the two threads\nside by side.', x: 64, y: 92, tail: 'ul', big: true }],
        },
      ],
      full: [
        { kind: 'say', text: 'You even know what time\nthey were born, right?', gap: 10 },
        { kind: 'me', text: 'Yes, I know that much.', gap: 8 },
        { kind: 'say', text: 'Then I can match all four strands.', gap: 10 },
        {
          kind: 'art',
          src: `${A}/03c-two-threads.jpg`,
          ratio: 2 / 3,
          fade: 'both',
          gap: 12,
          says: [{ text: 'Let’s lay the two threads\nside by side.', x: 64, y: 92, tail: 'ul', big: true }],
        },
      ],
    },
    close: [{ kind: 'say', text: 'That’s what I can see from here.\nNow let’s look at dates.', gap: 30 }],
  },
  {
    title: 'Your Christmas countdown',
    line: 'From today to January: good days to start a conversation, and days to ease off.',
    face: `${A}/y02.jpg`,
    card: 'days',
    open: [
      { kind: 'art', src: `${A}/s02-notebook.jpg`, ratio: 2 / 3, width: 84, side: 'right', shape: 'soft', gap: 24 },
      { kind: 'say', text: 'Let me mark the days\nworth knowing before Christmas.', gap: 4 },
    ],
    after: [{ kind: 'say', text: 'The marked days are good for reaching out.\nTriangles mean take it easy.', big: true, gap: 12 }],
    close: [{ kind: 'say', text: 'Now you know when.\nLet’s find a place to meet.', gap: 30 }],
  },
  {
    title: 'Where you might feel comfortable meeting',
    line: 'Places you two could overlap without forcing it, and what to do there.',
    face: `${A}/y09.jpg`,
    open: [
      { kind: 'art', src: `${A}/04a-market{me}.jpg`, ratio: 3 / 2, fade: 'both', gap: 24, notes: [{ text: 'The street was packed.\nFaint threads brushed past every fingertip.', x: 50, y: 8 }] },
      { kind: 'say', text: 'See? Every one of them\nhas a thread tied somewhere.', gap: 10 },
      { kind: 'art', src: `${A}/s05-glances{me}.jpg`, ratio: 3 / 2, slant: 'b', gap: 16 },
      { kind: 'say', text: 'Feels like people are looking, right?\nYou stand out more than you think.', big: true, gap: 8 },
      { kind: 'me', text: '…Do I look like that\nto them, too?', gap: 10 },
      { kind: 'say', text: 'You’d have to ask them that.', gap: 8 },
      { kind: 'say', text: 'But I can tell you\nwhere you’re most at ease.', big: true, gap: 6 },
      { kind: 'art', src: `${A}/06b-window-wipe.jpg`, ratio: 2 / 3, fade: 'bottom', gap: 18, says: [{ text: 'Want to clear the frost\noff this window?', x: 28, y: 8, tail: 'dr' }] },
    ],
    play: { kind: 'frost', hint: 'Wipe the frost off the window', skip: 'Just show me' },
    after: [
      { kind: 'say', text: 'See?\nPlaces like this suit you.', big: true, gap: 16 },
      { kind: 'say', text: 'Keep places like this in mind\nfor when you two cross paths.', gap: 10 },
    ],
    close: [{ kind: 'say', text: 'But the minute you think of them,\nyou’re not quite yourself, are you?', gap: 30 }],
  },
  {
    title: 'The habit that holds you back',
    line: 'The moment you back off just as it gets close, and what to do instead.',
    face: `${A}/y07.jpg`,
    open: [
      {
        kind: 'art',
        src: `${A}/04b-yeon-point.jpg`,
        ratio: 2 / 3,
        fade: 'both',
        gap: 24,
        says: [
          { text: 'See that tangled thread?', x: 30, y: 10, tail: 'dr' },
          { text: 'That tangle is on your end.', x: 64, y: 92, tail: 'ul', big: true },
        ],
      },
      { kind: 'me', text: '…My end?', gap: 8 },
      { kind: 'say', text: 'When your heart gets complicated,\nthe thread tangles like that.', gap: 10 },
      { kind: 'art', src: `${A}/s07-tug{me}.jpg`, ratio: 3 / 2, fade: 'both', gap: 12 },
      { kind: 'say', text: 'You get your hopes up alone,\nthen fold alone. Again.', big: true, gap: 8 },
    ],
    close: [{ kind: 'say', text: 'Put that one habit down,\nand let’s write just one line.', big: true, gap: 30 }],
  },
  {
    title: 'Should I make the first move?',
    line: 'Whether to go first, what to say, and how. Pick your first words.',
    face: `${A}/y03.jpg`,
    open: [
      {
        kind: 'art',
        src: `${A}/07c-phone-peek{me}.jpg`,
        ratio: 3 / 2,
        gap: 24,
        says: [{ text: 'The first words are\nalways the hardest, huh?', x: 74, y: 90, tail: 'ul', big: true }],
      },
      { kind: 'me', text: '…Yeah. I don’t know\nwhat to say.', gap: 10 },
      { kind: 'say', text: 'Then let’s come up with one together.', gap: 8 },
    ],
    playByStage: {
      far: firstLine([
        { label: 'Hey, where did you find that thing earlier?', reply: 'Nice. Hanging it on something you both already saw keeps it light.' },
        { label: 'Are you coming to the group thing this week?', reply: 'Good. Asking about a group plan first fits right now.' },
        { label: 'Honestly, you’ve been on my mind for a while.', reply: 'Too soon for that. Talk a few more times first.' },
      ]),
      friend: firstLine([
        { label: 'yo it’s snowing', reply: 'Your usual tone. The most natural first line between friends.' },
        { label: 'wanna grab food this week, just us?', reply: 'Good. Just toss it out casually, like always.' },
        { label: 'isn’t it kinda weird between us?', reply: 'Too big for a first text. Say that face to face.' },
      ]),
      daily: firstLine([
        { label: 'Thanks for earlier. You saved me.', reply: 'Good. Starting from something that happened today won’t feel awkward.' },
        { label: 'Want to grab lunch tomorrow?', reply: 'Good. Just one step outside the usual.' },
        { label: 'I keep thinking about you lately.', reply: 'Not there. You still have to see them tomorrow.' },
      ]),
      talking: firstLine([
        { label: 'Want to check out that place you mentioned?', reply: 'Good. You’re turning something you already talked about into a plan.' },
        { label: 'Are you free this weekend?', reply: 'Okay. Even better if you name two days.' },
        { label: 'lol true', reply: 'That’s a reply, not a first line. Add a question.' },
      ]),
      past: firstLine([
        { label: 'Hey, how’ve you been? The snow made me think of you.', reply: 'Good. Light, and fine if it goes unanswered.' },
        { label: 'I’m sorry about what happened back then.', reply: 'Too heavy for a first line. Wait until they reply.' },
        { label: 'Want to give us another try?', reply: 'Way too fast. Just a hello today.' },
      ]),
    },
    after: [{ kind: 'say', text: 'Good.\nNow don’t overthink it.', big: true, gap: 16 }],
    close: [{ kind: 'say', text: 'First words, done.\nNow, what comes next.', gap: 30 }],
  },
  {
    title: 'Your next step before Christmas',
    line: 'The best day to bring it up, what to say, and what to do with a vague answer.',
    face: `${A}/y04b.jpg`,
    open: [
      { kind: 'me', text: 'So… what should I actually do\nbefore Christmas?', gap: 24 },
      { kind: 'say', text: 'Don’t pin it all on Christmas Day.', gap: 8 },
      { kind: 'say', text: 'Nothing settled yet and it all rides on one day?\nThat’s a lot of pressure for both of you.', gap: 8 },
    ],
    stage: {
      far: [ask8('Around {ask}, if you cross paths,\njust say hi first. That’s plenty.')],
      friend: [ask8('{ask} is a good day to bring it up.\nDo it ahead, not on the day.')],
      daily: [ask8('Best day to ask: {ask}.\nAsk to meet for a bit, outside the usual place.')],
      talking: [ask8('Best day to ask: {ask}.\nAsk ahead, then.')],
      past: [ask8('Around {ask}, skip the plans.\nJust send a quick hello.')],
    },
    stageDefault: 'talking',
    close: [{ kind: 'say', text: 'And remember this one thing.', gap: 30 }],
  },
  {
    title: 'Three things to avoid',
    line: 'Three moves that tend to wreck things, and when to step back.',
    face: `${A}/y10.jpg`,
    open: [
      { kind: 'art', src: `${A}/05a-bench{me}.jpg`, ratio: 3 / 2, gap: 20 },
      { kind: 'say', text: 'You’ve been carrying this worry\non your own, haven’t you?', gap: 8 },
      { kind: 'me', text: '…That stays on the thread too?', gap: 10 },
      { kind: 'say', text: 'Every hesitation leaves a mark.', gap: 8 },
      { kind: 'art', src: `${A}/05b-frayed.jpg`, ratio: 3 / 2, gap: 22, notes: [{ text: 'Every loose end was frayed\nin the same spot.', x: 30, y: 90 }] },
      { kind: 'say', text: 'See? You keep stopping\nright here.', big: true, gap: 10 },
      { kind: 'me', text: '…Will it happen again?', gap: 10 },
      { kind: 'say', text: 'If you do the same thing.', gap: 8 },
      { kind: 'say', text: 'This time,\nlet’s try something different.', big: true, gap: 6 },
    ],
  },
  {
    title: 'Your knot',
    line: 'You can’t tie their heart. This knot is your own step forward.',
    face: `${A}/y08.jpg`,
    open: [
      { kind: 'say', text: 'Give me your hand.', gap: 30 },
      { kind: 'art', src: `${A}/07a-bracelet{me}.jpg`, ratio: 3 / 2, gap: 14, notes: [{ text: 'Yeon wound a thread around my wrist.', x: 50, y: 92 }] },
      { kind: 'me', text: 'Does this connect me\nto them?', gap: 10 },
      { kind: 'say', text: 'No.\nNo thread can promise that.', gap: 8 },
      { kind: 'say', text: 'I can’t tie someone else’s heart\nto yours. Nobody can.', big: true, gap: 8 },
    ],
    play: {
      kind: 'tie',
      hint: 'Grab the loose end and drag it to the yellow knot',
      skip: 'Skip',
      done: 'Tied.',
      frames: { loose: `${A}/07t-loose{me}.jpg`, mid: `${A}/07t-mid{me}.jpg`, tied: `${A}/07t-tied{me}.jpg` },
      points: {
        '': { knot: { x: 47, y: 59 }, grab: { x: 78, y: 82 } },
        '-f': { knot: { x: 45, y: 55 }, grab: { x: 74, y: 78 } },
      },
    },
    after: [{ kind: 'say', text: 'This knot keeps your heart\nfrom running away.', gap: 14 }],
    goal: {
      meet: [
        { kind: 'art', src: `${A}/07b-yeon-serious.jpg`, ratio: 2 / 3, fade: 'both', gap: 22, says: [{ text: 'Want to ask them?', x: 30, y: 10, tail: 'dr', big: true }, { text: 'Ask once.\nClearly and kindly.', x: 66, y: 92, tail: 'ul', big: true }] },
        { kind: 'me', text: 'And if they don’t reply?', gap: 10 },
        { kind: 'say', text: 'Then leave it there for the day.', gap: 8 },
        { kind: 'say', text: 'Still, you asked first.\nThat stays.', big: true, gap: 8 },
      ],
      closer: [
        { kind: 'art', src: `${A}/07b-yeon-serious.jpg`, ratio: 2 / 3, fade: 'both', gap: 22, says: [{ text: 'Torn about saying hi?', x: 30, y: 10, tail: 'dr', big: true }, { text: 'Say it once.\nKeep it light.', x: 66, y: 92, tail: 'ul', big: true }] },
        { kind: 'me', text: 'What if it gets awkward?', gap: 10 },
        { kind: 'say', text: 'Awkward lasts a day.', gap: 8 },
        { kind: 'say', text: 'If you don’t,\nyou’ll keep circling.', big: true, gap: 8 },
      ],
      confess: [
        { kind: 'art', src: `${A}/07b-yeon-serious.jpg`, ratio: 2 / 3, fade: 'both', gap: 22, says: [{ text: 'Want to tell them?', x: 30, y: 10, tail: 'dr', big: true }, { text: 'Say it once.\nClearly and kindly.', x: 66, y: 92, tail: 'ul', big: true }] },
        { kind: 'say', text: 'Just don’t ask for an answer on the spot.', gap: 10 },
        { kind: 'me', text: 'What if they say no?', gap: 10 },
        { kind: 'say', text: 'Then that’s your answer.', gap: 8 },
        { kind: 'say', text: 'Still, what you said\nstays said.', big: true, gap: 8 },
      ],
      decide: [
        { kind: 'art', src: `${A}/07b-yeon-serious.jpg`, ratio: 2 / 3, fade: 'both', gap: 22, says: [{ text: 'Keep going,\nor let it go here.', x: 30, y: 10, tail: 'dr', big: true }, { text: 'Either way,\nit’s your call.', x: 66, y: 92, tail: 'ul', big: true }] },
        { kind: 'me', text: 'What if I can’t decide?', gap: 10 },
        { kind: 'say', text: 'Then try once, and decide after.', gap: 8 },
        { kind: 'say', text: 'If it’s not it,\nletting go then isn’t too late.', big: true, gap: 8 },
      ],
    },
  },
  {
    title: 'A letter to you after Christmas',
    line: 'Whatever happens, what comes next. A letter from Yeon.',
    face: `${A}/y11.jpg`,
    open: [
      { kind: 'art', src: `${A}/08a-stairs-bottom{me}.jpg`, ratio: 2 / 3, fade: 'both', gap: 30, notes: [{ text: 'At the foot of the stairs.', x: 50, y: 6 }] },
      { kind: 'me', text: 'What about you?\nWhere does your thread go?', gap: 12 },
      {
        kind: 'art',
        src: `${A}/08b-yeon-pinky.jpg`,
        ratio: 2 / 3,
        gap: 16,
        says: [
          { text: 'Can’t see a thread\non my hand, can you?', x: 26, y: 7, tail: 'dr' },
          { text: 'I can see everyone else’s.\nJust not my own.', x: 66, y: 92, tail: 'ul' },
        ],
      },
      { kind: 'me', text: '…Doesn’t that get lonely?', gap: 12 },
      { kind: 'say', text: 'That’s why you shouldn’t\npretend you don’t feel it.', big: true, gap: 10 },
    ],
    close: [
      ...lastWalk,
      { kind: 'text', lines: ['I took out my phone.', 'The line I couldn’t send was still there.'], size: 'sm', gap: 20 },
      { kind: 'text', lines: ['Normally I’d have stopped there.', '*Tonight, I added one more line.*'], size: 'sm', gap: 14 },
    ],
    closeByStage: {
      far: [
        ...lastWalk,
        { kind: 'text', lines: ['I took out my phone.', 'The line I’d typed was still there.'], size: 'sm', gap: 20 },
        { kind: 'text', lines: ['But we weren’t close enough,', '*not yet, for a text like that.*'], size: 'sm', gap: 14 },
        { kind: 'text', lines: ['I put my phone away.', 'And decided on one thing instead.'], size: 'sm', gap: 14 },
      ],
    },
    late: true,

    playByPair: { 'friend.confess': lastSend('it’s snowing. and honestly? I like you as more than a friend. no rush to answer') },
    playByStage: {
      far: { kind: 'hold', label: 'Say hi first next time I see them', hint: 'Press and hold to promise yourself', skip: 'Skip' },
      friend: lastSend('it’s snowing. you just popped into my head'),
      daily: lastSend('it’s snowing. thought of you right away'),
      talking: lastSend('it’s snowing. thought of you right away'),
      past: lastSend('it’s snowing. hope you’re doing well'),
    },
    after: [
      { kind: 'text', lines: ['No reply yet.', '*But I sent it.*'], gap: 24 },
      { kind: 'text', lines: ['There are still days left before Christmas.'], size: 'lg', gap: 40 },
    ],
    afterByStage: {
      far: [
        { kind: 'text', lines: ['I still don’t know how it’ll go.', '*But I’m done just avoiding it.*'], gap: 24 },
        { kind: 'text', lines: ['There are still days left before Christmas.'], size: 'lg', gap: 40 },
      ],
    },
  },
];

export const XMAS_PAID_EN: XmasPaidCopy = {
  over: 'Yeon’s Christmas reading for that one person',
  title: '{name}’s thread',
  toc: 'Contents',
  speaker: 'Yeon',
  you: 'you',
  skipStory: 'Skip the story, just the reading',
  showStory: 'Show the story again',
  toMain: 'Back to the main page',
  prologue: [
    { kind: 'clock', sub: 'A winter night before Christmas', text: '9:40 PM', gap: 18 },
    {
      kind: 'art',
      src: `${A}/00-sleeves.jpg`,
      ratio: 2 / 3,
      fade: 'both',
      gap: 10,
      says: [
        { text: 'Your reading’s all set.', x: 72, y: 7, tail: 'dl', big: true },
        { text: 'All right.\nTell me about them.', x: 66, y: 94, tail: 'ul' },
      ],
    },
    { kind: 'me', text: '…This stays between us.', gap: 14 },
    { kind: 'say', text: 'Who am I going to tell?', gap: 10 },
  ] satisfies Beat[] as Beat[],
  chapters,
};

export const XMAS_MEET_EN: XmasMeetCopy = {
  peer: 'Where you\nlearn or work together',
  output: 'Where people gather\nfor things they love',
  wealth: 'Where you run into\neach other through work',
  power: 'At work, or\nin a set group',
  resource: 'Where you go to learn,\nor get introduced',
};

export const XMAS_PAIR_EN: XmasPairCopy = {
  title: 'Just-for-fun compatibility score',
  note: 'A score for fun. It’s not the chance you two end up together. Same two birthdays, same score every time.',
};

export const XMAS_REVIEW_EN: XmasReviewCopy = {
  title: 'A word for Yeon',
  note: 'Leave a rating and one line.',
  reward: 'Leave one and I’ll add 3 lanterns.\nUse lanterns to talk with Yeon one on one. (Once per reading)',
  rewardGuest: 'Sign in and leave one to get 3 lanterns.\nUse lanterns to talk with Yeon one on one.',
  thanks: 'Thanks for leaving that.',
  thanksReward: 'Thanks. I added 3 lanterns.\nIf you want to know more about them, just ask me.',
  chat: { href: '/chat/yeon', label: 'Talk with Yeon one on one' },
};

export const XMAS_KEEP_EN: XmasKeepCopy = {
  title: 'My Christmas card',
  lead: 'Save it instead of screenshotting, and pull it out on the day.',
  save: 'Save card',
  saved: 'Saved',
  card: {
    over: 'Yeon’s Christmas reading',
    name: '{name}’s thread',
    now: 'Where we are',
    ask: {
      far: 'Day to try a first hello',
      friend: 'Day to bring it up',
      daily: 'Day to ask to meet outside',
      talking: 'Day to ask about Christmas plans',
      past: 'Day to send a quick hello',
    } satisfies Record<XmasStage, string>,
    days: 'Good days to start a conversation',
    rest: 'Day to take it easy',
    pair: 'Compatibility score',
    pairNote: 'for fun',
    word: 'Yeon says',
    foot: 'DANGOL · a saju reading for fun',
  },
  words: {
    meet: 'Want to ask them? Ask once. Clearly and kindly.',
    closer: 'Torn about saying hi? Say it once. Keep it light.',
    confess: 'Want to tell them? Say it once. Clearly and kindly.',
    decide: 'Keep going or let go. Either way, it’s your call.',
  },
  file: 'dangol-xmas-card.png',
};
