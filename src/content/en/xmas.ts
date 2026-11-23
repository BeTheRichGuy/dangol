import type { Beat } from '@/components/story/types';
import type { XmasLandingCopy, XmasRowCopy } from '../xmas';

const A = '/media/xmas';

export const XMAS_ROW_EN: XmasRowCopy = {
  badge: 'Christmas only',
  keeper: 'Yeon',
  title: 'Yeon’s Christmas Love Reading',
  gain: 'Someone on your mind this Christmas? The days to reach out and the words to use.',
  art: '/media/xmas/hero-xmas.jpg',
};

export const XMAS_EN: XmasLandingCopy = {
  hero: {
    image: `${A}/hero-xmas.jpg`,
    video: `${A}/motion/hero-xmas.mp4`,
    over: 'Yeon’s Christmas love reading',
    title: ['Someone on your mind', 'this Christmas?'],
    sub: 'I won’t guess what they’re thinking.\nI’ll find how you can get closer.',
  },
  cta: {
    label: 'Read my thread free',
    dday: '{n} days left',
    viewers: '{n} people have tried the free reading so far',
    closed: 'This year’s Christmas reading has ended',
  },
  hook: [
    {
      kind: 'hook',
      gap: 30,
      lines: [{ text: 'First snow.' }, { text: 'One text:' }, { text: '“it’s snowing.”' }, { text: 'Who comes to mind?', box: true }],
    },
    {
      kind: 'hook',
      gap: 44,
      lines: [{ text: 'You check their profile', small: true }, { text: 'way too often,', small: true }, { text: 'but texting first?' }, { text: '*Can’t do it.*' }],
    },
  ] satisfies Beat[] as Beat[],

  beats: [
    { kind: 'clock', sub: 'A winter night before Christmas', text: '7:10 PM', gap: 40 },
    {
      kind: 'art',
      src: `${A}/01-subway.jpg`,
      ratio: 2 / 3,
      fade: 'both',
      gap: 26,
      notes: [{ text: 'The train home.\nTonight, all I see are cake boxes.', x: 50, y: 80 }],
    },
    {
      kind: 'art',
      src: `${A}/16-earphone.jpg`,
      ratio: 3 / 2,
      slant: 'a',
      gap: 8,
      notes: [{ text: 'The two next to me\nwere sharing one pair of earbuds.', x: 36, y: 4 }],
    },
    { kind: 'text', lines: ['Wonder what they’re listening to.'], size: 'sm', gap: 12 },
    {
      kind: 'chat',
      title: 'college crew (4)',
      gap: 26,
      lines: [
        { who: 'Dana', text: 'what’s everyone doing for christmas?' },
        { who: 'Mia', text: 'date night hehe' },
        { who: 'Jo', text: 'going home to my parents' },
        { text: 'just staying in', me: true },
        { who: 'Mia', text: 'lol home alone again?' },
        { text: 'yep. me and Kevin', me: true },
      ],
    },
    { kind: 'text', lines: ['It’s fine.', 'Really, it’s fine.'], gap: 26 },
    {
      kind: 'art',
      src: `${A}/02-bakery-b.jpg`,
      ratio: 1,
      width: 86,
      side: 'left',
      gap: 34,
      says: [
        { text: 'How many\ncandles?', x: 66, y: 8, tail: 'dl' },
        { text: '…Just one.', x: 74, y: 98, me: true },
      ],
    },
    { kind: 'text', lines: ['One slice of cake.', '*One candle.*'], size: 'lg', gap: 30 },

    {
      kind: 'art',
      src: `${A}/03-alley.jpg`,
      ratio: 2 / 3,
      fade: 'both',
      gap: 50,
      notes: [{ text: 'Five minutes from home.\nIt’s snowing.', x: 50, y: 14 }],
    },
    { kind: 'text', lines: ['I took out my phone.'], size: 'sm', gap: 10 },
    { kind: 'typing', to: 'Them', text: 'it’s snowing', send: 'Send', gap: 10 },
    { kind: 'text', lines: ['Typed it all out.', '*Couldn’t hit send.*'], gap: 22 },

    { kind: 'sfx', text: 'Tug.', side: 'right', gap: 40 },
    {
      kind: 'art',
      src: `${A}/04-finger-c.jpg`,
      ratio: 1,
      slant: 'a',
      gap: 10,
      notes: [{ text: 'The string on the box had come loose.', x: 50, y: 6 }],
    },
    { kind: 'text', lines: ['It was wrapped around my little finger.', 'The other end ran off down the alley.'], size: 'sm', gap: 14 },
    { kind: 'me', text: '…What is this?', gap: 12 },
    { kind: 'text', lines: ['I pulled it.'], gap: 26 },
    { kind: 'text', lines: ['It didn’t give.', 'Something on the other end *was holding it.*'], gap: 20 },
    {
      kind: 'art',
      src: `${A}/05-stairs.jpg`,
      ratio: 2 / 3,
      fade: 'top',
      gap: 30,
      notes: [{ text: 'I only followed the string.\nSince when were there stairs here?', x: 50, y: 86 }],
    },

    { kind: 'text', lines: ['At the top of the stairs was a room,', 'hung with red thread everywhere.'], size: 'sm', gap: 44 },
    { kind: 'clip', src: `${A}/motion/room.mp4`, poster: `${A}/06-room.jpg`, ratio: 16 / 9, loop: true, gap: 10 },
    {
      kind: 'art',
      src: `${A}/07-yeon-turn.jpg`,
      ratio: 2 / 3,
      fade: 'bottom',
      gap: 16,
      says: [
        { text: 'Hold on.', x: 24, y: 10, tail: 'dr', big: true },
        { text: 'You’re the one who’s been\npulling my thread, right?', x: 66, y: 80, tail: 'ul' },
      ],
    },
    { kind: 'me', text: 'What? The string on my box just came loose…', gap: 8 },
    {
      kind: 'art',
      src: `${A}/08-yeon-thread-b.jpg`,
      ratio: 1,
      gap: 30,
      says: [
        { text: 'That’s not string.\nIt’s your thread.', x: 24, y: 2, tail: 'dr', big: true },
        { text: 'You were born\nwith it.', x: 72, y: 100, tail: 'ul' },
      ],
    },
    {
      kind: 'art',
      src: `${A}/09-sogeum.jpg`,
      ratio: 1,
      width: 64,
      side: 'right',
      slant: 'a',
      gap: 40,
      notes: [{ text: 'In a basket, a kitten slept\ntangled up in thread.', x: 30, y: 100 }],
    },
    {
      kind: 'art',
      src: `${A}/10-slack-b.jpg`,
      ratio: 3 / 2,
      gap: 44,
      says: [
        { text: 'The year, month, day and hour you were born.\nIt’s twisted from those four.', x: 36, y: 0, tail: 'none' },
        { text: 'Thought it snapped?\nNope. It just went a little slack.', x: 40, y: 102, tail: 'none', big: true },
      ],
    },

    {
      kind: 'art',
      src: `${A}/11-yeon-glance.jpg`,
      ratio: 3 / 2,
      gap: 56,
      says: [{ text: 'Only one candle, huh?', x: 32, y: 102, tail: 'ur' }],
    },
    { kind: 'me', text: '…Don’t look at that.', gap: 12 },
    { kind: 'say', text: 'And why are you still holding your phone?', gap: 16 },
    { kind: 'me', text: '…Because it’s snowing.', gap: 8 },
    { kind: 'say', text: 'Oh.\nSo there’s someone. You just didn’t send it.', big: true, gap: 14 },
    { kind: 'me', text: 'It’s not like that.', gap: 10 },
    { kind: 'say', text: 'Sure it isn’t.\nYou’ve been turning that screen on and off this whole time.', gap: 8 },
    { kind: 'say', text: 'Who is it?', gap: 8 },
    { kind: 'me', text: '…Just someone I know.', gap: 12 },
    {
      kind: 'art',
      src: `${A}/12-yeon-cu.jpg`,
      ratio: 2 / 3,
      hush: true,
      gap: 40,
      says: [
        { text: 'You almost texted “it’s snowing”\nto just someone you know?', x: 66, y: 60, tail: 'ul' },
        { text: 'Come on.\nYou like them.', x: 48, y: 88, tail: 'none', big: true },
      ],
    },
    { kind: 'sfx', text: 'Gulp.', side: 'left', gap: 14 },
    { kind: 'text', lines: ['I meant to say no.', '*Nothing came out.*'], gap: 18 },
    {
      kind: 'art',
      src: `${A}/18-yeon-soft.jpg`,
      ratio: 2 / 3,
      fade: 'both',
      gap: 34,
      says: [{ text: 'It’s okay.\nYou can say it in here.', x: 50, y: 82, tail: 'ul', big: true }],
    },

    { kind: 'me', text: '…Are they on the other end of it?', gap: 30 },
    {
      kind: 'art',
      src: `${A}/13-window.jpg`,
      ratio: 2 / 3,
      fade: 'top',
      gap: 14,
      says: [
        { text: 'I can’t see their heart.\nOnly your end of the thread.', x: 62, y: 18, tail: 'dl' },
        { text: 'But I can see\nwhere yours is pulling.', x: 66, y: 46, tail: 'none' },
        { text: 'And there’s still time\nbefore Christmas.', x: 64, y: 96, tail: 'none', big: true },
      ],
    },
    { kind: 'me', text: 'When? What do I do?', gap: 22 },
    {
      kind: 'art',
      src: `${A}/14-yeon-hand.jpg`,
      ratio: 2 / 3,
      fade: 'bottom',
      gap: 20,
      says: [{ text: 'For that,\nI need your birthday.', x: 50, y: 9, tail: 'dl', big: true }],
    },
  ] satisfies Beat[] as Beat[],

  check: {
    title: 'If someone’s been\non your mind lately',
    close: 'If even one fits,\ndon’t let this Christmas just slip by.',
    items: [
      'When it snowed, one person came to mind right away',
      'You’ve typed a text to them and deleted it',
      'You’re not sure if you’re friends or something more',
      'You hold back from texting first so you won’t seem like too much',
      'This Christmas, you’d really like to spend it with them',
    ],
  },
};
