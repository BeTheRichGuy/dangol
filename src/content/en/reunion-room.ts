import type { RoomCopy } from './rooms';

export const REUNION_ROOM_EN: RoomCopy = {
  title: 'Before You Send',
  question: 'Should I text them? And what would I even say?',
  gain: 'A reunion reading you read before you reach out: where it frayed, the months that run easier, and a first line you could actually send.',
  quote: 'Don’t send anything yet. Let’s play it back first.',
  line: 'A reunion reading you read before you reach out.',
  contents: [
    { title: 'Tuning the two strings together', line: 'How the two of you are built, side by side, with a first answer to your question.' },
    { title: 'The sound you made', line: 'What was good between you, and what each of you supplied.' },
    { title: 'Where the string snapped', line: 'The break in three layers: what was said, what kept colliding, and how the charts fit.' },
    { title: 'Replaying the last conversation', line: 'Why that talk went the way it did, read from both charts.' },
    { title: 'What keeps repeating on your side', line: 'Three loops of yours, told plainly, and one thing to do differently.' },
    { title: 'The grain of their chart', line: 'How they have been feeling since the breakup, and where they stand on a reunion.' },
    { title: 'When trying again makes sense', line: 'Conditions, a self-check, and three paths laid side by side.' },
    { title: 'The reunion window', line: 'Twelve months mapped, with five dated cards.' },
    { title: 'The contact kit', line: 'Three first lines, what to do after each kind of reply, and what not to send.' },
    { title: 'The meeting plan', line: 'If the talking continues: the place, the topics, and the goodbye line.' },
    { title: 'If you do find your way back', line: 'Rules, warning signs, and a first-100-days guide.' },
    { title: 'If you let go, and a final song', line: 'A path for closing it well, then one last tune.' },
  ],
  story: [
    {
      stage: 'A lakeside pavilion under a full moon. A gayageum rests on the wooden floor, and a small figure sits beside it.',
      lines: [],
    },
    {
      stage: null,
      lines: [
        { text: 'Come in. Sit wherever the moonlight lands.' },
        { text: 'You didn’t climb all this way for small talk.' },
      ],
    },
    {
      stage: 'Sogeum sleeps curled on a navy cushion beside the gayageum. A long sleeve rests nearby, careful not to wake the kitten.',
      lines: [],
    },
    {
      stage: null,
      lines: [
        { text: 'Listen. Every breakup has a first note.' },
        { text: 'I’ll replay yours: the last conversation, where it frayed, what keeps repeating.' },
      ],
    },
    {
      stage: null,
      lines: [
        { text: 'Then I’ll mark the months that run easier for the two of you.' },
        { text: 'And write a first line you could send, plus a plan for letting go if that’s the road.' },
      ],
    },
    {
      stage: null,
      lines: [
        { text: 'I’ll read how their chart says they may feel, and say it plainly. It’s a reading, not a fact.' },
        { text: 'No promises, no scores, no odds. Only what I can actually read.' },
      ],
    },
    {
      stage: null,
      lines: [
        { text: 'That’s enough to act on. Come, we’ll go slowly.' },
      ],
    },
  ],
  closed: [{ text: 'The pavilion isn’t open yet. Leave your email, and you’ll hear first.' }],
};
