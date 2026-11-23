import type { Keeper, PairKind, RoomKey } from '@/lib/rooms/themes';
import { REUNION_GUIDE_NAME } from '@/lib/reunion/product';
import { REUNION_ROOM_EN } from './reunion-room';

export interface RoomLine {
  text: string;
}

export interface StoryBeat {
  stage: string | null;
  lines: readonly RoomLine[];
}

export interface RoomCopy {
  title: string;

  question: string;

  gain: string;

  quote: string;

  line: string;

  contents: readonly { readonly title: string; readonly line: string }[];

  story: readonly StoryBeat[];

  closed: readonly RoomLine[];
}

export const ROOMS_COPY = {
  price: '$6.29',
  atLaunch: 'at launch',

  launchBadge: 'Launch price',

  launchLine: 'Less than a latte.',

  allRooms: (price: string) => `All five rooms are ${price} at launch.`,

  first: {
    price: '$1.99',
    tag: 'First reading only!',

    wasSr: 'Regular price:',

    note: (off: number) => `First reading only: $1.99 (${off}% off).`,
  },

  percentOff: (off: number) => `${off}% off`,

  quote: (text: string) => `“${text}”`,

  keepers: {
    yul: { name: 'Yul', hanja: '律' },
    mansin: { name: 'Mansin', hanja: '萬神' },
    yeon: { name: 'Yeon', hanja: '緣' },
    muk: { name: 'Muk', hanja: '墨' },

    u12: { name: REUNION_GUIDE_NAME.en.name, hanja: REUNION_GUIDE_NAME.en.hanja },
  } satisfies Record<Keeper, { name: string; hanja: string }>,

  home: {
    heroLink: 'Or go straight to a room',
    eyebrow: 'The inner rooms',
    heading: 'Which room would you like to visit tonight?',
    sub: 'Five themed rooms, from love and 10-year chapters to your 2027 forecast. Each includes an interactive webtoon and an in-depth reading.',
    railLabel: 'Rooms',

    prev: 'Previous room',
    next: 'Next room',
    counter: (i: number, n: number) => `${i} / ${n}`,
    enter: 'Enter',

    newRelease: 'Just released · NEW!',
    howHeading: 'How your reading works',
    how: [
      'Share your birth details. Your browser quietly maps out your saju chart.',
      'Choose a room and bring what is on your mind. Sign in anytime to keep your readings safe.',
      'Yul reads the balance of your five elements and the flow of your 10-year luck cycles, then writes the reading around your question. Names and birth dates are never shared.',
    ],

    free: {
      question: 'Not sure where to begin? Start without paying a thing.',
      gain: 'Just share when you were born. Yul looks at your nature, one quiet gift, and one thing to keep in mind. No account needed.',
      label: 'Free reading',
      title: 'Step into the shrine',
      quote: 'Come on in. Your first reading is on me.',
      badge: 'Free',
      cta: 'Start',
    },

    freeHead: 'Start free',
    paidHead: 'Deeper readings (paid)',
    reunion: {
      label: 'Yeoun · Reunion',
      title: 'A reunion reading for an ex',
      gain: 'Free: the one place you two drifted apart, and one thing to try first. The full reading goes on to timing, what to say, and how they may feel.',
      badge: 'Free',
      cta: 'Start',
    },
  },

  rooms: {
    life: {
      title: 'The many sides of you',
      question: 'What does my chart really have to say about who I am?',
      gain: 'Your whole self in one place: how you’re built, your work, finances, love, and the ties that steady you.',
      quote: 'I went through your whole chart. Sit back, make yourself comfortable. There is a lot to tell.',
      line: 'From your innate temperament to wealth, love, and career: your comprehensive life reading.',
      contents: [
        { title: 'In a word', line: 'Your chart laid out as one clear picture.' },
        { title: 'Your five elements', line: 'What runs deep in you, what sits quiet, and the everyday patterns they create.' },
        { title: 'Your day pillar and its influences', line: 'The core of who you are, and how the influences around you shape it.' },
        { title: 'A truth worth hearing', line: 'The blind spot you keep bumping into, told plainly and gently.' },
        { title: 'What makes you, you', line: 'The quiet strength unique to your chart, given the room it deserves.' },
        { title: 'Work that fits', line: 'The kind of work your traits are built for, and a sensible step forward.' },
        { title: 'Money', line: 'How money comes in, where it tends to slip, and how to hold onto it.' },
        { title: 'Love', line: 'The habits you fall into in love, and the kind of partner you truly mesh with.' },
        { title: 'Family ties', line: 'The closeness, weight, and boundaries within the ties you call family.' },
        { title: 'People to keep close', line: 'The people who ground you, and the connections to handle with care.' },
        { title: 'Where you feel most at ease', line: 'Spaces, surroundings, and directions that bring you ease.' },
        { title: 'Last words', line: 'A parting note from Yul, paired with a small keepsake for good fortune.' },
      ],
      story: [
        {
          stage: 'Behind the low table there is a door you have not seen before. Yul is already holding it open.',
          lines: [
            { text: 'This way. Watch the step.' },
          ],
        },
        {
          stage: null,
          lines: [
            { text: 'Oho. You came back for the rest?' },
            { text: 'Good. I saved the long version for you.' },
          ],
        },
        {
          stage: 'There is a second cup on the table. It is still warm.',
          lines: [
            { text: 'Have some tea first. Then we go piece by piece.' },
          ],
        },
        {
          stage: null,
          lines: [
            { text: 'Last time was just a taste. Tonight I read all of it.' },
          ],
        },
        {
          stage: 'Sogeum has already taken the warmest spot on the table. As always.',
          lines: [],
        },
        {
          stage: null,
          lines: [
            { text: 'I will tell you the hard parts too. Knowing early helps you step around them.' },
          ],
        },
        {
          stage: null,
          lines: [
            { text: 'Twelve parts in all. We take them slow and skip nothing.' },
          ],
        },
      ],
      closed: [{ text: 'This room isn’t open yet. Leave your email, and you’ll hear first.' }],
    },
    decades: {
      title: 'Your life map',
      question: 'Where am I standing right now, and where is my path heading?',
      gain: 'The ten-year chapter you walk right now, when the next door opens, and what turns.',
      quote: 'A lantern for every ten years. We light them in order.',
      line: 'Every ten-year chapter of your life, and the season you’re walking through right now.',
      contents: [
        { title: 'All your chapters at a glance', line: 'The ages, the years, and what each season carries.' },
        { title: 'The chapters behind you', line: 'What those years demanded, and what you held onto.' },
        { title: 'The chapter you’re in', line: 'How it touches your daily pace, your ties to others, and your work.' },
        { title: 'Year by year', line: 'Each year laid out, one step at a time.' },
        { title: 'The next door', line: 'When the chapter shifts, and how to step across.' },
        { title: 'The long road after', line: 'A quiet look ahead at the roads still waiting.' },
        { title: 'Mansin’s last word', line: 'One piece of good news, one piece of bad news.' },
      ],
      story: [
        {
          stage: null,
          lines: [
            { text: 'Hm. Sit down, regular.' },
            { text: 'Yul reads fast. I read in order, one chapter at a time.' },
          ],
        },
        {
          stage: 'Mansin scatters a pinch of rice across the tray. It is a habit older than the stairs.',
          lines: [
            { text: 'Each lantern is ten years. Eight of them, start to finish.' },
          ],
        },
        {
          stage: 'Sogeum is asleep on Mansin’s lap. Nobody moves for a while.',
          lines: [],
        },
        {
          stage: null,
          lines: [
            { text: 'The lanterns behind you have gone quiet. Only yours is bright now.' },
            { text: 'We start there. The next door comes after.' },
          ],
        },
      ],
      closed: [{ text: 'Hm. This room opens later. Leave your email. I don’t forget a regular.' }],
    },
    love: {
      title: 'Who’s coming up the stairs',
      question: 'What does my birth chart say about how I love and who pulls me in?',
      gain: 'Why familiar relationship patterns keep finding you, and which months ahead bring an opening.',
      quote: 'Hold on. Let me find your end of the thread.',
      line: 'Your patterns in love, the people who pull you in, and the upcoming years of romance.',
      contents: [
        { title: 'Your thread', line: 'The way you lean into closeness, and where you tend to pull back.' },
        { title: 'Who pulls you, and who is good for you', line: 'Not always the same person.' },
        { title: 'The knot you keep tying', line: 'The loop you keep falling into, and how to untangle it.' },
        { title: 'Where your thread is now', line: 'Where your heart stands right now in this season of your life.' },
        { title: 'The years love opens', line: 'A look at the next seven years, mapped out year by year.' },
        { title: 'The next twelve months', line: 'Months to lean in, and months to step back and take a breath.' },
        { title: 'Your question', line: 'Your personal question, answered straight.' },
        { title: 'Yeon’s last word', line: 'One piece of good news, one piece of bad news.' },
      ],
      story: [
        {
          stage: 'At the top of the stairs is a room strung with red thread. The spinning wheel is still turning.',
          lines: [],
        },
        {
          stage: null,
          lines: [
            { text: 'Hold on. Yul sent you up here?' },
            { text: 'Good. Let’s find your thread.' },
          ],
        },
        {
          stage: 'Sogeum is asleep in the yarn basket. Red thread is wrapped all around.',
          lines: [],
        },
        {
          stage: null,
          lines: [
            { text: 'Everyone has one red thread. Slack means it is time to rest.' },
            { text: 'A knot means it is time to decide. A tangle means you have been pulling alone.' },
          ],
        },
        {
          stage: null,
          lines: [
            { text: 'Up at 2 a.m. waiting for a reply with your phone in your hand?' },
            { text: 'I’m teasing. Half teasing.' },
          ],
        },
        {
          stage: null,
          lines: [
            { text: 'Your thread runs out that window and all the way down the stairs.' },
            { text: 'I can’t see who is at the other end. I can see the years it pulls tight.' },
          ],
        },
        {
          stage: null,
          lines: [
            { text: 'One rule in here. I only read your end of the thread.' },
            { text: 'What goes on in someone else’s head is not mine to read.' },
          ],
        },
        {
          stage: null,
          lines: [
            { text: 'Okay. Shall we follow your thread and see where it goes?' },
          ],
        },
      ],
      closed: [{ text: 'Hold on, the threads aren’t strung yet. Leave your email and I’ll call you up.' }],
    },
    match: {
      title: "Muk’s Compatibility",
      question: 'Why do the two of us keep clashing in the same place, and why do we still pull?',
      gain: 'Where the two of you stick, where you slip, your compatibility score, and who comes back first after a fight.',
      quote: "There’s a reason you stick, and a reason you slip.",
      line: "Two charts side by side. Muk reads the distance between you and someone you’re seeing or into.",
      contents: [
        { title: 'The first distance', line: 'Who the two of you are, and the distance that opens up when you stand side by side.' },
        { title: 'Who leans first', line: 'What you are to each other, and which of you steps in first.' },
        { title: 'The temperature together', line: 'How day and night differ for you, and the speed and distance at which you get close.' },
        { title: 'Why you pull', line: 'What each of you hands the other, and why that pulls.' },
        { title: 'When you stick, when you slip', line: 'The moments you fit without trying, and the small gaps where you bump.' },
        { title: 'Who comes back first', line: 'Who tends to return after a fight, and the words that bring you closer again.' },
        { title: 'The same season, the same month', line: 'The stretch you are passing through now, and the months that suit you both.' },
        { title: 'Muk’s last word', line: 'One piece of good news, one piece of bad news, and one small thing to try.' },
      ],
      story: [
        {
          stage: 'A porch in the rain under the eaves. A bodyguard in an ink-black robe stands watching the rain from under a black gat.',
          lines: [],
        },
        {
          stage: null,
          lines: [
            { text: '...You came. Who are you here to ask about?' },
            { text: "I can’t see what’s in their head. I only see the two of you side by side." },
          ],
        },
        {
          stage: null,
          lines: [
            { text: 'One of you steps in first. The other follows a beat later.' },
            { text: 'That order sets the shape of the two of you.' },
          ],
        },
        {
          stage: null,
          lines: [{ text: 'Close is fine. Distance is fine too.' }],
        },
        {
          stage: null,
          lines: [{ text: "Distance isn’t bad. Some pairs just need room to breathe." }],
        },
        {
          stage: 'Sogeum is asleep at the end of the porch. Muk pretends not to notice, and glances over anyway.',
          lines: [],
        },
        {
          stage: null,
          lines: [
            { text: "I’ll give you a compatibility score this time." },
            { text: "One number won’t hold it all. I’ll show where you stick and where you slip." },
          ],
        },
        {
          stage: null,
          lines: [
            { text: 'A partner or a crush, either is fine.' },
            { text: 'I only need their birthday. A nickname works for a name.' },
          ],
        },
      ],
      closed: [
        { text: '...The door is not open yet.' },
        { text: "Leave your email. I’ll call you the day it opens." },
      ],
    },
    year: {
      title: 'Your 2027',
      question: 'What kind of wind will 2027 bring my way?',
      gain: 'All of 2027, month by month: when to step out and when to rest, laid out like a calendar.',
      quote: 'Twelve months. Thirteen, counting January.',
      line: 'The Red Goat year, walked through month by month.',
      contents: [
        { title: 'Where 2027 lands in your chart', line: 'The overall flow of your year and where it takes you.' },
        { title: 'The whole year', line: 'Its pace, and what it asks of you.' },
        { title: 'Four threads', line: 'Work, spending, relationships, and your peace of mind.' },
        { title: 'Thirteen months', line: 'From January 2027 through January 2028, month by month.' },
        { title: 'When to reach, when to rest', line: 'The months worth circling on your calendar.' },
        { title: 'Mansin’s last word', line: 'One piece of good news, one piece of bad news.' },
      ],
      story: [
        {
          stage: 'A mountain garden above the clouds. Clear morning light filters between red pillars.',
          lines: [
            { text: 'Welcome in, regular. You did well climbing all this way.' },
            { text: 'Sit comfortably. We will walk 2027 together, one month at a time.' },
          ],
        },
        {
          stage: null,
          lines: [
            { text: 'Each stepping stone is one month. Twelve from January 2027, plus one more for the next January.' },
            { text: 'When the path opens up wide and clear, do not hesitate. Step forward with confidence.' },
          ],
        },
        {
          stage: null,
          lines: [
            { text: 'Some months the path narrows. Nothing to fear, simply slow your pace and catch your breath.' },
            { text: 'Those drifting clouds never rush. Neither will your year.' },
          ],
        },
      ],
      closed: [{ text: 'Hm. The 2027 room is still getting ready. Leave your email, regular.' }],
    },
  } satisfies Record<RoomKey, RoomCopy>,

  page: {
    back: 'All rooms',

    storyLabel: (keeper: string) => `${keeper}’s room`,
    contentsHeading: 'What we look into',

    sealed: 'Sealed until the room opens.',
    subjectHeading: 'The person at the center',
    you: 'You',
    change: 'Change',
    born: (date: string) => `Born ${date}`,
    timeUnknown: 'time unknown',
    needSelf: 'Tell me when you were born first.',
    addSelf: 'Add my birth details',
    partnerHeading: 'And the person beside you',
    addPartner: 'Add the other person',
    pairKinds: {
      lover: 'Partner',
      crush: 'Someone I like',
      friend: 'Friend',
      coworker: 'Coworker',
      family: 'Family',
      other: 'Someone else',
    } satisfies Record<PairKind, string>,
    needLuck: {
      line: 'Mansin needs one last detail before laying out your chapters.',
      why: 'Traditional saju turns its long chapters forward or backward by an old rule with only two paths. That is all this is for.',
      woman: 'Woman',
      man: 'Man',
      yang: 'Yang reading',
      yin: 'Yin reading',
      nbHint: 'Not sure? Either is fine. It only changes which way the chapters turn.',
    },
    priceNote: (price: string) => `${price} a room, launch price.`,
    readNow: 'Read it now',
    previewNote: 'Preview: nothing is charged.',
    reserve: (price: string) => `Reserve at ${price}`,
    noCharge: 'Nothing is charged now.',

    payAndRead: () => 'Pay and read',
    testPayNote: 'Test checkout. You won’t be charged.',

    skipPayNote: 'Local test: checkout is skipped and the full reading starts right away.',

    rereadLocal: 'Read it again',
    rereadLocalNote: 'Local test only: writes a fresh reading with the current guide. Nothing is charged.',
    paddleNote: 'Checkout by Paddle. Taxes may apply where you live.',

    tossNote: 'Payment is handled securely by Toss Payments.',

    dodoNote: 'Payment is handled securely by Dodo Payments. Any tax that applies where you live shows at checkout.',

    guestNote: 'You can pay and read without signing in. Sign in to keep your people and readings in My readings.',
    guestSignIn: 'Sign in',
    sendNote: 'Only your calculated chart and any question are sent to write this reading. Your name and birth details aren’t included.',
    writing: (name: string) => `${name} is reading`,

    openingPay: 'Opening checkout…',
    done: 'That’s the whole reading.',

    docHeading: 'In-Depth Saju Reading',

    summaryLabel: 'At a glance',
    docNote: 'Your chart explored section by section, expanding on the story from the webtoon above.',

    readSample: 'Read the sample',
    sampleNote: 'A sample reading for a made-up chart. Only shown on this computer.',
    otherRooms: 'Other rooms',

    readPage: {

      guestKeep: {
        line: 'This reading only lives in this tab for now. Sign in and it stays in your archive, so you can open it again any time.',
        button: 'Sign in to keep it',
      },
      back: 'Back to the room',
      toMain: 'Back to the main page',

      preparing: (name: string) => `${name} is writing your reading`,
      preparingNote: 'Give it a couple of quiet minutes. Your full reading opens right here the moment it is ready.',
      progress: (n: number, total: number) => `${n} of ${total} sections completed`,

      foldOpen: 'Open',
      foldClose: 'Close',
    },
    errors: {
      refusal: 'We couldn’t complete this reading. Try again or rephrase your question.',
      busy: 'The reading service is busy. Try again in a moment.',
      api: 'We couldn’t finish the reading. Try again in a little while.',
      incomplete: 'The reading stopped before the last section, so it wasn’t saved. Try again.',
      network: 'The connection dropped. Check it and try again.',
      notOpen: 'Readings are unavailable in this room right now. Check back later or leave your email for opening news.',
      login: 'Sign in first, then this room will read for you.',
      payment: 'We couldn’t verify payment for this reading. If you’ve already paid, check your payment status before trying checkout again.',
    },
    retry: 'Try again',

    recheck: 'Check my payment again',
    rechecking: 'Checking…',
    recheckNote: 'If you already paid, please don’t pay again. Check once more here. A payment can take a moment to go through.',
  },

  checkout: {
    title: 'Checkout',
    productLabel: 'Item',
    product: 'One saju reading (digital content, not points or credits)',

    periodLabel: 'Service period',
    period: 'Available right after payment (writing takes 2 to 5 minutes)',
    refundNotice:
      'Your reading starts being written as soon as payment is confirmed. Because it is digital content, it can’t be cancelled for a refund once writing has started. If an error on our side stops it, we’ll write it again or refund you in full.',
    agree: 'I understand and agree, including the Terms and Refund Policy.',
    roomLabel: 'Room',
    forLabel: 'Reading for',
    totalLabel: 'Total',
    methodLabel: 'Payment',
    testMethod: 'Test payment. You won’t be charged.',
    tossMethod: 'Card or easy pay, through Toss Payments',
    dodoMethod: 'Card and the other methods shown at checkout, through Dodo Payments',

    trust: {
      toss: 'One-time payment · No subscription · Secure checkout by Toss Payments',
      dodo: 'One-time payment · No subscription · Secure checkout by Dodo Payments',
    },

    inApp: {
      note: 'Paying inside the Instagram or Facebook app can stall when your card or bank app opens. If it gets stuck, tap ⋯ at the top right, open this page in your browser, and start again there. You’ll need to enter your birth details once more.',
      open: 'Open in Chrome',
    },
    pay: (price: string) => `Pay ${price}`,
    paying: 'Confirming payment…',
    after: 'Your reading starts after payment is confirmed and is saved to My readings when complete.',

    afterGuest: 'Your reading starts after payment is confirmed. Without signing in, it stays on this screen only. Sign in first to keep it in My readings.',
    xmasAfter: 'Yeon starts writing right after payment goes through, and it usually takes 2 to 5 minutes.',
    xmasAfterGuest: "Yeon starts writing right after payment goes through, and it usually takes 2 to 5 minutes. If you pay without signing in, you'll read it right here on this screen.",

    gameNote: 'While your reading is being written (2 to 5 minutes), play the mini-game with Sogeum and you can earn up to 3 lanterns for the one-to-one chat.',
    gameNoteGuest: 'Sign in before you pay, and you can earn up to 3 lanterns by playing the mini-game with Sogeum while your reading is being written. Lanterns are for the one-to-one chat.',
    failed: 'We couldn’t confirm your payment. Check its status before trying again.',
    cancel: 'Not now',

    preview: 'Preview the room',

    xmasProduct: 'Yeon’s Christmas Love Reading',
  },

  partnerForm: {
    heading: 'Tell me about the other person',
    name: 'What should we call them?',
    namePlaceholder: 'A name or nickname',
    nameHint: 'Used here to label the reading. Never sent anywhere.',
    date: 'Their birthday',
    time: 'Their birth time',
    city: 'Where they were born',
    gender: 'For their ten-year chapters',
    genderSkip: 'Skip',
    kind: 'You two are',
    submit: 'Read the two of us',
    errors: {
      kind: 'Choose what you are to each other.',
    },
  },

  reunion: REUNION_ROOM_EN,
} as const;

export type RoomsCopy = typeof ROOMS_COPY;
