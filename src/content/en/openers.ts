export interface RoomOpeners {

  readonly lines: readonly string[];

  readonly second: string;

  readonly secondConcern: string;

  readonly third: string;
}

export const OPENERS_EN = {
  life: {
    lines: [
      'Welcome in. Long climb, huh?',
      'Now, let’s see what you’re built from.',
      'Next, how you tend to handle things.',
      'Time for some honest talk.',
      'Now the good part: your charm.',
      'Let’s see what work suits you.',
      'Money talk next. Can’t skip it.',
      'Shall we talk about love a little?',
      'A little about family, too.',
      'Now, who’s good to keep close.',
      'Let’s find where you rest easy.',
      'One last thing before you go.',
    ],
    second: 'Together we’ll go from your temperament to work, money and love.',
    secondConcern: 'Well, right this way. So lately it’s {concern} on your mind?',
    third: 'First, let’s find out who you are.',
  },
  decades: {
    lines: [
      'Welcome in. Long road to get here.',
      'First, the chapters behind you.',
      'Now, the chapter you’re walking.',
      'Then year by year.',
      'Let’s see where the next door is.',
      'And a glance at the long road after.',
      'One last word.',
    ],
    second: 'Together we’ll walk from the chapters behind you to the ones ahead.',
    secondConcern: 'Right, this way. So lately it’s {concern} weighing on you?',
    third: 'First, the whole road at a glance.',
  },
  love: {
    lines: [
      'Welcome in. Long way up, huh?',
      'Let’s start with who pulls at you.',
      'Now, the tangles that keep happening.',
      'How does your thread look right now?',
      'And the years love opens up.',
      'The next twelve months, quickly.',
      'Let’s get to what’s on your heart.',
      'One last word from me.',
    ],
    second: 'Together we’ll look at who pulls you, and when love opens.',
    secondConcern: 'Right this way. So lately it’s {concern} on your heart?',
    third: 'First, what kind of thread is yours?',
  },
  match: {
    lines: [
      '...You came. Long way up.',
      'Next, who leans in first.',
      'Now, the temperature when you are together.',
      'Let’s see why you pull.',
      'Where you stick, and where you slip.',
      'The part after a fight, too.',
      'Your seasons right now.',
      'One last word from me.',
    ],
    second: 'I’ll show where the two of you stick, and where you slip.',
    secondConcern: 'This way. So lately it’s {concern} on your mind.',
    third: 'First, who the two of you are.',
  },
  year: {
    lines: [
      'Welcome in. Here to hear about the new year.',
      'First, the whole year at a glance.',
      'Then four threads, one by one.',
      'Month by month, quickly.',
      'And when to step out, when to rest.',
      'One last word, then off you go.',
    ],
    second: 'Together we’ll go from the year’s flow to when to step out and rest.',
    secondConcern: 'Right, this way. So lately it’s {concern} on your mind?',
    third: 'First, how 2027 touches your chart.',
  },

  reunion: {
    lines: [
      'Welcome in. Let’s tune the two strings first.',
      'Now, the sound the two of you made.',
      'Now the hard part: where the string snapped.',
      'Let’s play that last conversation back, slowly.',
      'Next, what keeps repeating on your side.',
      'Next, how they tend to move. Habits, not feelings.',
      'Now, when trying again would make sense.',
      'Let’s see which months run easier for you two.',
      'Now, a few lines you could actually send.',
      'If you do meet, let’s plan it gently.',
      'And if you do find your way back, a few rules.',
      'And if you let go, here’s how. Then one last song.',
    ],
    second: 'We’ll go from how it ended to the line you could send.',
    secondConcern: 'Mm. So what’s been keeping you up is {concern}?',
    third: 'First, how your two charts sit together.',
  },
} as const satisfies Record<string, RoomOpeners>;
