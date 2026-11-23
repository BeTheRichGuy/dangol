import type { Element } from '@/lib/saju/types';
import type { Focus, SaltLevel } from '@/lib/reading/types';

export const UI = {
  brand: {
    name: 'DANGOL',
    hangul: '단골',
    tagline: 'Become a regular.',
    homeLabel: 'DANGOL, back to the start',
  },

  meta: {
    title: 'DANGOL: Become a regular.',
    titleTemplate: '%s | DANGOL',
    description:
      'A Korean saju reading told as a webtoon. Meet Yul and Sogeum, explore your birth chart, and choose a deeper reading in the inner rooms.',
    ogImageAlt: 'DANGOL: Become a regular. A Korean saju webtoon, with Sogeum, a white kitten in a tiny red hat, asleep beside the title.',
    typeCardAlt: (name: string) => `DANGOL type card: ${name}.`,
    typeTitle: (born: string) => `${born}: which saju type are you?`,
    typeDescription: (born: string) =>
      `A friend is ${born}. Find your saju type in about ten seconds.`,
  },

  common: {
    skipToContent: 'Skip to content',
    siteNav: 'Site',
    back: 'Back',
    close: 'Close',
    continue: 'Continue',
    disclosure: '',
    links: { about: 'About', pricing: 'Pricing', privacy: 'Privacy', terms: 'Terms', refund: 'Refunds' },
    wontReadLink: 'Things I won’t read',

    business: {
      labels: {
        name: 'Business',
        owner: 'Representative',
        bizNo: 'Business registration no.',
        mailOrderNo: 'Mail-order business no.',
        address: 'Address',
        phone: 'Phone',
        email: 'Email',
        hosting: 'Hosting',
      },
      colon: ': ',
      verify: 'Check this business on the Korea Fair Trade Commission site',
    },
    yul: 'Yul',
    yulHangul: '율',
    yulHanja: '律',
  },

  home: {
    posterAlt:
      'Sogeum, a white kitten in a tiny red hat, climbs lantern-lit stone stairs toward a glowing shrine above the clouds.',
    headline: 'Your birth chart, told as a Korean webtoon.',
    headlineEmphasis: 'Korean webtoon',
    subhead: 'Meet Yul, the shrine’s resident shaman, and discover your birth chart with a free webtoon-style Korean saju reading.',
    cta: 'Start my free reading',

    keepLine: 'Sign in and you can reopen your readings anytime under My readings.',

    topicsLink: 'Browse topic readings',
    reunionLead: 'Can’t stop thinking about an ex?',
    reunionLink: 'Take a free look at the reunion reading',
    typeLink: 'Find my saju type (10 sec)',

    languageLabel: 'Language',

    sharedHint: {
      lead: (born: string) => `A friend is ${born}.`,
      ask: 'Which one are you?',
    },
  },

  landing: {
    cta: 'Start my free reading',

    videoAlt:
      'Sogeum, a white kitten in a tiny red hat, climbs lantern-lit stone stairs toward a glowing shrine above the clouds.',

    opening: 'The shrine door is opening.',
  },

  scenes: {
    greetAlt:
      'Yul, a young shaman with tousled brown hair, white robes and a navy collar, leans on one hand and smiles. Sogeum, a white kitten in a tiny red hat, sleeps on the table close by.',
    gateAlt: 'Yul turns at the glowing shrine gate and beckons you in, lanterns burning on either side.',
    scrollAlt: 'Yul reads with eyes half closed in the lantern light, golden sparks drifting all around.',
    portraitAlt: 'Yul smiles with a playful tilt of the head, lanterns glowing behind.',
    giftAlt: 'Yul holds out an open palm with a faint golden glow, smiling.',
  },

  reading: {
    progress: (step: number, total: number) => `Step ${step} of ${total}`,

    chat: {

      you: 'You',

      skip: 'Skip',
      date: (month: string, day: number, year: number) => `${month} ${day}, ${year}`,
      time: (hour: number, minute: string, period: string) => `${hour}:${minute} ${period}`,
    },

    sceneAlt: {
      greet: 'Yul, a young shaman with tousled brown hair and a white robe, leans on one hand and smiles. Sogeum, a white kitten in a tiny red hat, sleeps on the table.',
      listen: 'Yul at a low table, listening with a calm smile while lanterns glow all around.',
      write: 'Yul at a low table, smiling and waiting for your answer.',
      scroll: 'Yul with eyes half closed in the lantern light, reading, golden sparks drifting all around.',
      candy: 'Yul smiles and holds out an open palm with a faint golden glow.',
      salt: 'Yul smiles and holds out an open palm with a faint golden glow.',
      gift: 'Yul holds out an open palm with a faint golden glow, smiling.',
      deeper: 'Yul turns back at the shrine gate and beckons you further up the stairs.',
    },

    intro: {

      hook: {
        title: 'What story is hiding in your birthday?',
        sub: 'Share your birthday and Yul reads your type, your eight characters and the ten-year chapter you’re in.',
      },
      line: 'You made it. I’m Yul, the shrine shaman. I need your birthday to see your future, so let me ask you a few things first.',
      answer: 'Let’s begin',
    },

    form: {
      heading: 'Your Birth Details',
      name: 'What should I call you?',
      namePlaceholder: 'Your name or a nickname',
      date: 'Date of birth',
      datePlaceholder: 'YYYY.MM.DD',

      lunar: {
        calendar: 'Calendar',
        solar: 'Solar',
        lunar: 'Lunar',
        leap: 'Leap month',
        hint: 'Enter the date from the lunar calendar. I’ll convert it for you.',
        converted: (y: number, m: number, d: number) =>
          `Calculated with the solar date ${new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}.`,
        errors: {
          noLeap: (year: number, month: number, leapMonth: number) =>
            leapMonth > 0
              ? `Lunar year ${year} has no leap month ${month}. Its leap month is ${leapMonth}.`
              : `Lunar year ${year} has no leap month. Untick “Leap month” to continue.`,
          noDay: (year: number, month: number, leap: boolean, maxDay: number) =>
            `${leap ? 'Leap month' : 'Month'} ${month} of lunar year ${year} only has ${maxDay} days.`,
        },
      },
      time: 'Time of birth',
      timePlaceholder: '24-hour, e.g. 13:20',
      timeUnknown: 'I don’t know my birth time',
      city: 'City of birth',
      gender: 'Gender',
      genderHint: 'Traditional saju uses this only to calculate the flow of your ten-year life chapters (dae-un).',
      woman: 'Woman',
      man: 'Man',
      genderSkip: 'Rather not say',
      question: 'What’s on your mind lately?',
      questionOptional: 'Optional',
      questionPlaceholder: 'Love, career, relationships, or anything weighing on your mind lately.',
      questionHint: 'If you write something here, Yul picks it up in the full reading and speaks to it. The free result doesn’t use it.',

      previewLine: 'The free result shows your type, your eight characters and five elements, the ten-year chapter you’re in, the next five years and your life-flow chart, and the outline of someone who will come into your life.',

      guided: {
        birth: ['Let’s start with your name and birthday.', 'Lunar date? No problem, I’ll convert it.'],
        time: ['If you know when and where you were born, I can see you more clearly.', 'Don’t know? Leave it blank.'],
        you: ['Last bit.', 'Anything weighing on your mind lately? Tell me, or skip it.'],
        next: 'Next',
      },
      counter: (n: number, max: number) => `${n}/${max}`,
      privacy: 'Your chart is calculated securely in this browser. Your birth details are never sent to external servers.',
      submit: 'Read my chart',
      errors: {
        date: 'Enter a valid date in YYYY.MM.DD format.',
        dateRange: (min: number, max: number) => `Pick a year between ${min} and ${max}.`,
        time: 'Enter the time as HH:MM (24-hour), or choose I don’t know.',
        city: 'Pick your city from the list.',
        gender: 'Choose one.',
      },
    },
    steps: {
      greeting: {
        line: 'You followed Sogeum all the way up. That cat brought you here and fell asleep on the spot. I’m Yul. I’ve been expecting you.',
        answer: 'Hi, Yul',
      },
      name: {
        line: 'What should I call you? A nickname is fine. I’ll still know it’s you.',
        label: 'Name or nickname',
        hint: 'Optional. It stays in this browser.',
        placeholder: 'Mia',
      },
      focus: {
        line: 'So. What brings you up my stairs? I could guess, but I’d rather hear it.',
        choices: [
          { value: 'love', label: 'Love' },
          { value: 'someone', label: 'Someone specific' },
          { value: 'everything', label: 'Everything' },
        ] satisfies { value: Focus; label: string }[],
        group: 'What brings you here',
      },

      concern: {
        line: 'So. What’s weighing on you tonight? I could guess, but I’d rather hear you say it.',
        loveGroup: 'Love',
        lifeGroup: 'Life',
      },
      date: {
        line: 'When were you born? Day, month, year. Yes, I need the year too.',
        group: 'Date of birth',
        month: 'Month',
        monthPlaceholder: 'Month',
        day: 'Day',
        dayPlaceholder: 'DD',
        year: 'Year',
        yearPlaceholder: 'YYYY',
      },
      time: {
        line: 'Around what time? If you don’t know, just say so. A blank beats a guess.',
        group: 'Time of birth',
        hour: 'Hour',
        hourPlaceholder: 'HH',
        minute: 'Minute',
        minutePlaceholder: 'MM',
        period: 'AM or PM',
        am: 'AM',
        pm: 'PM',
        dontKnow: 'I don’t know',
      },
      place: {
        line: 'Where were you born? Your birthplace helps me adjust the chart to the local sun.',
        label: 'City of birth',
        placeholder: 'Start typing, like Los Angeles',
        hint: 'Pick one from the list.',
        suggestions: 'City suggestions',
        loading: 'Finding your city…',
        none: 'No city by that name. Try the nearest bigger one.',
        results: (n: number) => `${n} cities found`,
      },
      sex: {
        line: 'Last one. Saju sets the direction of your ten-year chapters by a rule from the old books, and the old books only know two answers. Pick what fits, or skip.',
        group: 'For your ten-year chapters',
        woman: 'Woman',
        man: 'Man',
        skip: 'Skip',

        options: {
          female: 'Woman',
          male: 'Man',
          nonbinary: 'Non-binary',
          skip: 'Skip',
        },

        nbLine:
          'Saju is old-fashioned here. Your ten-year chapters run forward or backward by a yin-yang rule. Which reading should I use?',
        nbOptions: {
          yang: 'Yang reading',
          yin: 'Yin reading',
          skip: 'Skip the chapters',
        },
        nbGroup: 'Which reading for your ten-year chapters',

        nbHint: 'Not sure? Either is fine. It only changes which way the chapters turn.',
      },
      ritual: {
        line: 'Hold still. I’m reading your eight characters. No peeking.',
        lineSix: 'Hold still. I’m reading your six characters. The other two can wait.',
        failed: 'Something went sideways with that date or place. Let’s try again.',
        failedAction: 'Go back',
      },
    },
    errors: {
      dateIncomplete: 'Add the month, the day, and the year.',
      dateInvalid: 'Check the day, month, and year. That date isn’t valid.',
      dateRange: (min: number, max: number) => `Pick a year between ${min} and ${max}.`,
      timeInvalid: 'Check the hour (1 to 12) and the minutes (0 to 59).',
      timePeriod: 'Pick AM or PM.',
      cityPick: 'Pick a city from the list.',
    },
  },

  type: {
    steps: {
      date: {
        line: 'Tell me the day you were born. It takes about ten seconds.',
      },
      midnight: {
        line: 'Were you born between 11 pm and 1 am?',
        group: 'Born between 11 pm and 1 am',
        no: 'No',
        yes: 'Yes',
        notSure: 'Not sure',
      },
      time: {
        line: 'Then the exact time matters. Around when were you born?',
      },
      place: {
        line: 'And where? Night babies need the right sky.',
      },
    },
    resultHeading: (born: string) => `You’re ${born}.`,
    nearMidnight: (alts: string) => `If you were born near midnight, you might be ${alts}.`,
    nearMidnightOr: ' or ',
    failed: 'I couldn’t work that one out. Check the date and try again.',
    failedAction: 'Start over',
    fullReading: 'Get your full reading',
    regularNo: 'Get your regular number',
    greetsCaption: 'Yul',
  },

  result: {

    freeBadge: 'Yul reads your chart · Free preview',
    headline: (name: string, born: string) =>
      name.trim() ? `${name.trim()}, you’re ${born}.` : `You’re ${born}.`,
    pillarsLabel: 'Your eight characters',
    pillarsLabelSix: 'Your six characters',
    pillarNames: { year: 'Year', month: 'Month', day: 'Day', hour: 'Hour' },
    hourUnknown: 'unknown',
    showChart: 'Show the chart',
    hideChart: 'Hide the chart',
    chart: {
      caption: 'Four pillars of your birth chart',
      stem: 'Stem',
      branch: 'Branch',
      elementsHeading: 'Five elements',
      elementCount: (name: string, n: number, total: number) => `${name}: ${n} of ${total}`,
      basis: (city: string, minutes: number) => {
        const abs = Math.abs(Math.round(minutes));
        const sign = minutes < 0 ? '−' : '+';
        return `Calculated with local mean solar time for ${city} (${sign}${abs} min).`;
      },
      basisStandard: 'Calculated with the clock time of your time zone.',
      basisNoCity: 'No birth city was given, so the time you entered was used exactly as written.',
      notices: {
        timeUnknown: 'Three pillars. Your birth time is unknown.',
        nearMidnight: (altBorn: string) =>
          `Born near midnight: by another school you’d be ${altBorn}.`,
        jieqi: 'Born on a solar-term boundary day; your year/month pillar may differ.',
      },
    },
    candy: {
      title: 'The good news.',
    },

    question: {
      title: 'About what you asked',
      titleNone: 'This month, for you',
      lead: 'You told me what’s on your mind.',
      promise: 'I’ll answer that properly in the inner rooms. Tonight, here’s the weather around it.',
      none: 'No question this time? Let’s look at the month ahead.',

      quote: (text: string) => `“${text}”`,
    },
    hand: {
      button: 'Hold out your hand',

      hint: 'A little honesty next. The bad news comes with something you can do.',
    },
    salt: {
      title: {
        pinch: 'The bad news, and it’s small.',
        spoonful: 'The bad news, worth a look.',
        handful: 'The bad news, worth real attention.',
      } satisfies Record<SaltLevel, string>,
      levelLabel: (level: SaltLevel) =>
        `How much to watch: ${level === 'pinch' ? 'a little' : level === 'spoonful' ? 'some' : 'a lot'}`,

      try: 'Try:',
      why: 'Why this much caution?',
      hideWhy: 'Hide explanation',
      whyIntro: 'Here’s how the chart led to this:',
    },
    locked: {
      heading: 'Three readings, still sealed.',
      sealLabel: 'Sealed',
      readings: [
        {
          id: 'love',
          title: 'Who’s coming up the stairs',
          kind: 'Love reading',
          price: '$7.99 at launch',
          teaser:
            'Some people find your door every time. I’ll tell you why it opens for them and when your seasons of romance arrive.',
        },
        {
          id: 'compat',
          title: 'Muk’s Compatibility',
          kind: 'Compatibility with someone',
          price: '$7.99 at launch',
          teaser: 'Two charts side by side. Who steps in first, and where do you slip? Muk reads the distance between you.',
        },
        {
          id: 'year',
          title: 'Your 2027',
          kind: 'The Red Goat year, month by month',
          price: '$9.99 at launch',
          teaser: '2027 is a Red Goat year, and it doesn’t treat every month the same. I’ll walk you through all twelve months, season by season.',
        },
      ],
      cta: 'Reserve the launch price',
      notOpen: 'Not open yet. Leave your email and you’ll get it first, at launch price.',
    },
    share: {
      heading: 'Take it with you.',
      cardAlt: (name: string) => `Your DANGOL type card: ${name}.`,
      cardLoading: 'Drawing your card…',
      cardError: 'We couldn’t create your card. Try again.',
      retry: 'Try again',
      save: 'Save image',
      saveHold: 'Press and hold the card, then choose Save image.',
      saveClose: 'Close',
      share: 'Share',
      copied: 'Link copied.',
      copyFailed: 'We couldn’t copy the link. Try Save image instead.',
      shared: 'Shared.',
      privacy: 'The card shows your type, a line about it, and your number if you add one. Never your name or your birthday.',
      shareTitle: 'My DANGOL type',
      shareText: (born: string) => `I’m ${born}. Which saju type are you?`,

      pick: 'Choose a card',
      tabType: 'My type',
      tabMonth: 'My lucky month',
      monthAlt: (month: string) => `Your DANGOL lucky month card: ${month}.`,
      monthShareTitle: 'My lucky month',
      monthShareText: (month: string) => `My lucky month is ${month}. When’s yours?`,
      addNumber: 'Put my regular number on it',
      hasNumber: (n: string) => `Regular No. ${n} is on your card.`,
    },
    footer: {
      startOver: 'Read someone else',
    },
    errors: {
      failedTitle: 'That reading wouldn’t open.',
      failedBody: 'Something is off with that birth date or place. Check it and try again.',
      failedAction: 'Fix my details',
    },
  },

  email: {
    title: 'Become a regular',
    intro: 'Leave your email. You’ll get a regular number now, and first word when the readings open, at launch price.',

    product: {
      title: (name: string) => `Save my seat: ${name}`,
      yul: (price: string) =>
        `It isn’t open yet. I’ll write you once, the day it opens, at ${price}. Nothing is charged now.`,
    },
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    consent: 'I’m 18+ and agree to the',
    consentLink: 'Terms',
    consentJoin: 'and',
    consentLink2: 'Privacy Policy',
    consentEnd: '.',
    submit: 'Become a regular',
    submitting: 'Writing your name in…',
    closeLabel: 'Close',
    errors: {
      empty: 'Add your email first.',
      invalid: 'That email doesn’t look right. Check it?',
      consent: 'Tick the box to continue.',
      server: 'I couldn’t save that just now. Try again in a moment.',
      network: 'No connection. Check your signal and try again.',
    },
    success: {
      title: 'Welcome, regular.',
      body: 'I’ll write when the next door opens. Nothing else.',
      done: 'Done',
    },

    notOpen: {
      yul: 'Reservations aren’t open yet. Your email hasn’t been saved. Come back soon.',
      close: 'Close',
    },
    card: {
      label: 'Regular No.',
      brandline: 'DANGOL · 客',
      stampAlt: 'Date seal',
      founding: 'One of the first thousand.',
      alt: (n: string) => `Regular number card, number ${n}.`,
    },
  },

  card: {
    brand: 'DANGOL',
    brush: '단골',
    tagline: 'Become a regular.',
    pitch: 'Your saju story starts here.',

    eyebrow: 'MY KOREAN SAJU TYPE',
    regularNo: 'Regular No.',

    cta: 'Find your type',

    disclosure: '',

    ogLine: 'A Korean saju reading, told as a webtoon by Yul and a sleepy cat named Sogeum.',

    story: {
      eyebrow: 'My saju, read by Yul',
      kicker: 'Here’s who you are',
      inLove: 'In love',
      ask: 'Which type are you?',
    },

    month: {
      eyebrow: 'My lucky month',
      strip: 'The twelve months',
      ask: 'Which month is yours?',

      unit: '',
    },
  },

  cardSave: {
    button: 'Save as image',
    making: 'Creating image…',
    title: 'Your image is ready',
    download: 'Save',
    share: 'Share',
    close: 'Close',

    hint: 'Can’t save? Press and hold the image to save it.',
    failed: 'Couldn’t create the image. Try taking a screenshot instead.',

    footer: 'dangolsaju.app',
  },

  elements: {
    wood: { name: 'Wood', hanzi: '木' },
    fire: { name: 'Fire', hanzi: '火' },
    earth: { name: 'Earth', hanzi: '土' },
    metal: { name: 'Metal', hanzi: '金' },
    water: { name: 'Water', hanzi: '水' },
  } satisfies Record<Element, { name: string; hanzi: string }>,

  months: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],

  prose: {
    updated: (date: string) => `Updated ${date}`,
    backHome: 'Back to the stairs',
  },

  notFound: {
    metaTitle: 'Not found',
    title: 'No door here.',
    body: 'The stairs don’t go that way. Sogeum is asleep, so I’ll walk you back.',
  },
  errorPage: {
    title: 'The lantern flickered.',
    body: 'Something went wrong while opening this page. Try again in a moment.',
    retry: 'Try again',
  },
} as const;

export type UiCopy = typeof UI;
