import type { ReunionContent } from '@/lib/reunion/types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

export const REUNION_EN: ReunionContent = {
  hook: {
    title: 'Should I reach out tonight?',
    sub: 'Look at where the rhythm slipped between your two charts before you send that message.',
  },
  preview: {
    eyebrow: 'Before you decide, here is everything waiting for you',
    contentsTitle: 'What this reading explores',
    contentsLegend: 'Outlined sections show what you’ve already previewed. Solid badges show what unlocks next.',
    tags: { seen: 'Previewed', new: 'Unlocks' },
    seenFootnote: 'You have already explored a glimpse of three chapters.',
    windowTitle: 'Your reunion timing is already calculated',
    windowLeadBoth: (n, total) => `${n} of the upcoming ${total} months naturally align for both of you.`,
    windowLeadOne: (n, total) => `None of the next ${total} months align simultaneously for both charts, but ${n} favor one of you. Pinpointing when to take a step is the heart of this reading.`,
    windowNone: 'No month aligns cleanly. The reading addresses this with honest clarity and guides your next steps.',
    windowHidden: 'The exact timing unfolds inside the full reading.',
    windowKinds: { both: 'Mutual alignment', one: 'One-sided opening', care: 'Exercise care', even: 'Quiet passage' },
    materialsTitle: 'More than just a written reading',
    materialsLead: 'Along with the twelve chapters, you receive practical guides and keepsake cards ready to use.',
    materials: [
      { key: 'window', name: 'Reunion Timing Calendar', line: 'Twelve months paired with one concrete step to try each month', count: '12 Months · 5 Date Cards' },
      { key: 'kit', name: 'Contact Kit', line: 'Carefully shaped opening lines and words best left unsaid', count: '3 Opening Lines · 5 Phrases to Skip' },
      { key: 'check', name: 'Readiness Checklist & Three Paths', line: 'Check your heart first, then lay reaching out, waiting, and letting go side by side', count: '7 Questions · 3 Paths' },
      { key: 'rules', name: 'Relationship Guidelines', line: 'Ground rules if you reconnect, warning signs to watch for, and a 100-day guide', count: '3 Rules · 3 Warning Signs · 10 Milestones' },
      { key: 'letgo', name: 'The Art of Closure', line: 'A gentle order for tidying up, and a template for the unsent letter', count: '5 Steps · 6-Part Letter' },
      { key: 'save', name: 'Keepsake Cards', line: 'Save your calendar, contact kit, and signature passage as images', count: '3 Cards' },
      { key: 'webtoon', name: 'Illustrated Chapters', line: '{guide} shares each chapter across three atmospheric panels', count: '36 Panels' },
    ],
    firstLineTitle: 'A curated first line prepared for your situation',
    firstLineNote: 'Alternative tones and words to avoid are revealed inside the full reading.',
    lockedSr: 'This part unlocks with the full reading',
    format: 'Thirty-six illustrated panels, twelve written chapters, seven actionable tools, and three save cards arrive together. The reading begins immediately right on this screen.',
  },
  hello: {
    lines: [
      'Welcome. The moon rests quietly on the water tonight.',
      'I am {guide}. I listen to the resonance between two souls through the twelve strings of the gayageum.',
      'Their side of the story will be revealed through the charts in the full reading. For now, let us see where your rhythm first slipped.',
      'Make yourself comfortable. I’ll ask just a few gentle questions.',
    ],
    cta: 'Could we get back together?',
  },
  birth: {
    meAsk: 'First, when were you born?',
    themAsk: 'And when was the other person born?',
    themTimeHint: 'No birth time? That is completely fine. The date alone reveals the essential grain of your connection.',
    nicknameLabel: 'What should I call them? (Optional)',
    nicknamePlaceholder: 'e.g., That person, Ex',
    pickSaved: 'Or choose someone you’ve saved.',
    next: 'Continue',
  },
  intake: {
    since: {
      ask: 'How long has it been since you parted ways?',
      options: [
        { id: 'days', label: 'A few days', reaction: 'The waves have not settled yet. We’ll take this gently, one breath at a time.' },
        { id: 'weeks', label: 'A few weeks', reaction: 'Long enough for daily life to resume, yet the silence still echoes. We’ll look into this space together.' },
        { id: 'months', label: 'A few months', reaction: 'With time behind you, things once blurred are beginning to come into focus.' },
        { id: 'year', label: 'A year or more', reaction: 'If your thoughts still linger here after all this time, the bond ran deeper than ordinary.' },
      ],
    },
    length: {
      ask: 'How long did you share together?',
      options: [
        { id: 'short', label: 'Under 3 months', reaction: 'Brief, but a short melody can still echo deeply in the chest.' },
        { id: 'year1', label: 'Under a year', reaction: 'Moving through the seasons together creates shared habits that take time to untangle.' },
        { id: 'year3', label: '1 to 3 years', reaction: 'A substantial shared rhythm. Familiarity brings great comfort, but can also hide subtle fractures.' },
        { id: 'long', label: 'Over 3 years', reaction: 'Years of interwoven history. A knot tied over years cannot and should not be untied in haste.' },
      ],
    },
    who: {
      ask: 'Who brought up the breakup first?',
      options: [
        { id: 'me', label: 'I did', reaction: 'Being the one to say the words does not mean your heart was untroubled. Let us trace what led you there.' },
        { id: 'them', label: 'They did', reaction: 'Facing an unexpected farewell leaves anyone feeling lost. Let us calmly walk back through that moment.' },
        { id: 'faded', label: 'We quietly drifted apart', reaction: 'When strings loosen without a single dramatic snap, the quiet ache often lingers longest.' },
      ],
    },
    reasons: {
      ask: 'What was the biggest reason? (Choose up to two)',
      limit: 'Choose up to 2',
      done: 'Done',
      options: [
        { id: 'talk', label: 'Communication and silence', reaction: 'The way two voices exchange words shows up with remarkable clarity in the charts.' },
        { id: 'values', label: 'Values and the future', reaction: 'When paths point in different directions, neither person is to blame.' },
        { id: 'distance', label: 'Distance and surroundings', reaction: 'Physical distance shakes shared rhythms regardless of how much devotion is present.' },
        { id: 'trust', label: 'Fractured trust', reaction: 'Trust rarely breaks in a single day. We will handle this with the care it deserves.' },
        { id: 'bored', label: 'Drifting into routine', reaction: 'When comfort turns to quiet monotony, the notes naturally begin to blur. It happens to many.' },
        { id: 'around', label: 'Family and external strain', reaction: 'Outside voices can pull the strings far tighter than either of you intended.' },
        { id: 'unsure', label: 'Still not entirely sure', reaction: 'Uncertainty is a completely honest answer. The charts will help clear away the mist.' },
      ],
    },
    contact: {
      ask: 'Where do things stand between you right now?',
      options: [
        { id: 'blocked', label: 'Blocked or removed', reaction: 'When the door is closed, learning how to wait with patience matters far more than forcing an entrance.' },
        { id: 'ignored', label: 'Left on read or unanswered', reaction: 'Silence is the heaviest reply. Let us focus on what you can tend to on your side while things settle.' },
        { id: 'sometimes', label: 'An occasional light hello', reaction: 'Even a fragile thread of contact is meaningful. It gives us a gentle place to begin.' },
        { id: 'ongoing', label: 'Still in regular touch', reaction: 'When conversation continues, pacing is everything. Every word should be deliberate.' },
      ],
    },
    want: {
      ask: 'What does your heart lean toward right now?',
      options: [
        { id: 'reunite', label: 'I want to try again', reaction: 'Hold that wish close, but let us verify the right conditions before reaching out.' },
        { id: 'letgo', label: 'I want to find closure', reaction: 'Releasing a bond with dignity is a meaningful step forward. I will show you how to close it gently.' },
        { id: 'unsure', label: 'I’m still not sure', reaction: 'You do not have to decide today. We will set all three paths side by side so you can choose in peace.' },
      ],
    },
    concern: {
      ask: 'Lastly, leave one lingering sentence that stays on your mind. A line from your last conversation works too.',
      placeholder: 'e.g., They told me not to reach out again, and the words still echo.',
      optional: 'Optional',
      skip: 'Skip',
      submit: 'Begin with this thought',
      counter: 'Up to 120 characters',
    },
  },
  ritual: [
    'Choose one string among the twelve. It will sound our inquiry tonight.',
    'The first note ripples gently across the still pond.',
    'Stay with the quiet, and listen as the resonance settles into the night air.',
  ],
  result: {
    heading: 'The Resonance Between You',
    labels: {
      clash: { name: 'Strings in Direct Collusion', tagline: 'Sounding the same sharp note at once, prone to sudden friction and sparks.' },
      friction: { name: 'Strings of Subtle Rasp', tagline: 'Small differences in tone that quietly wore down the melody over time.' },
      combine: { name: 'Tightly Bound Strings', tagline: 'Drawn so close together that personal boundaries blurred, leaving unspoken weight.' },
      calm: { name: 'Quiet, Distant Strings', tagline: 'Few loud clashes, yet unspoken thoughts slowly deepened the quiet between you.' },
    },
    flow: {
      same: {
        title: 'Drawn by Familiarity',
        body: 'You moved with similar tempo and instinct. While deeply comforting, when friction arose, neither found it easy to yield first.',
      },
      'self-feeds-other': {
        title: 'The One Who Kept Giving',
        body: 'You naturally poured in patience, care, and compromise. Loving on good days, but exhausting when it felt like you were holding the roof alone.',
      },
      'other-feeds-self': {
        title: 'Held by Their Quiet Presence',
        body: 'Their steady presence offered you shelter. Because that comfort felt so natural, expressing heartfelt gratitude may have slipped your mind.',
      },
      'self-checks-other': {
        title: 'The One Setting the Course',
        body: 'Your presence was decisive and set the direction. Yet in keeping momentum, slowing down to notice their quiet hesitation was an ongoing test.',
      },
      'other-checks-self': {
        title: 'Adjusting to Their Current',
        body: 'Their mood and rhythm set the tone. In your desire to keep peace, your own authentic needs were quietly postponed.',
      },
    },
    filled: {
      theyFilled: {
        title: 'What They Brought to Your Chart',
        body: 'Their chart possessed qualities that yours ran lean on. That natural complement is why being near them felt so calming, and why the silence aches now.',
      },
      iFilled: {
        title: 'What You Supplied for Them',
        body: 'You brought warmth and stability that their chart lacked. If you were constantly the anchor, now is the time to ensure your own well is replenished.',
      },
      both: {
        title: 'Complementing Each Other’s Gaps',
        body: 'Each chart offered what the other was looking for. It explains why the bond felt so magnetic, and why the sudden absence is felt so sharply.',
      },
      neither: {
        title: 'Companions Walking Parallel Ground',
        body: 'Rather than filling deficits, you walked side by side as similar souls. Without intentional novelty, comfort gently drifted toward routine.',
      },
    },
    frayed: {
      clash: {
        title: 'Where Disagreements Met Head-On',
        body: 'Misunderstandings arrived all at once with full intensity. For any future dialogue, halving your pace and listening first must come before anything else.',
      },
      friction: {
        title: 'The Slow Rub of Small Pinches',
        body: 'It was rarely one dramatic explosion. Minor tone shifts, suppressed reactions, and awkward timing gradually frayed the bond until it gave way.',
      },
      combine: {
        title: 'Bound Too Closely to Speak Freely',
        body: 'The pull was intense, but it blurred where one ended and the other began. In that closeness, naming small irritations felt dangerous, letting them fester.',
      },
      calm: {
        title: 'The Quiet Drift of the Unsaid',
        body: 'There were few overt clashes. Yet because peace was chosen over honest conversation, distance quietly grew where intimacy should have lived.',
      },
    },
    contact: {
      blocked: {
        title: 'When the Door Is Closed, Pause',
        body: 'Trying to bypass a block through alternate accounts only invites regret. Rest your hands, protect your dignity, and wait for the window where timing softens.',
      },
      ignored: {
        title: 'Navigating Unanswered Words',
        body: 'When messages hang without a reply, sending another text rarely helps. Withhold fearful assumptions, keep your composure, and let the quiet breathe.',
      },
      sometimes: {
        title: 'Tending the Fragile Thread',
        body: 'When occasional pleasantries still pass between you, a brief, warm note lands best. Avoid loading the exchange with past history; lightness is your ally.',
      },
      ongoing: {
        title: 'Steadying the Tempo While in Touch',
        body: 'Because words are still flowing, deliberate restraint is vital. Resist the urge to dive into heavy emotional demands; keep interactions brief, warm, and grounded.',
      },
    },
    want: {
      reunite: {
        title: 'To the Heart Longing to Reconnect',
        body: 'Wanting to try again is understandable. Yet reaching out succeeds only when you understand what fractured between you, and prepare not to repeat it.',
      },
      letgo: {
        title: 'To the Heart Ready for Closure',
        body: 'Deciding to release someone is an act of deep self-respect. Honoring closure with structure and gentle steps protects your heart from second-guessing.',
      },
      unsure: {
        title: 'To the Heart Caught in Between',
        body: 'You are under no pressure to force a decision today. Laying all three paths out with honesty gives clarity the quiet space it needs to surface.',
      },
    },
    locked: [
      { title: 'The Auspicious Reunion Window', line: 'Months ▒▒ and ▒▒ of this year show the gentlest friction, making conversation far more ▒▒.' },
      { title: 'A Tailored First Line to Send', line: 'Given where things stand, an unweighted note with a ▒▒ tone will land with the least ▒▒.' },
      { title: 'The First Step When Choosing Closure', line: 'The most freeing first step is clearing ▒▒, followed by writing an unsent letter of ▒▒.' },
    ],
    lockedHint: 'Unlocked in the full reading',
    sections: {
      first: 'Initial Resonance',
      frayed: 'Where the Thread Frayed',
      filled: 'What You Exchanged',
      yours: 'Your Compass Today',
      locked: 'Deep Dive Ahead',
    },
    concernCard: {
      title: 'The Thought You Carried',
      echo: 'This question will be addressed directly and tenderly at the very beginning of your full reading.',
    },
    labelEyebrow: 'Your Connection in a Phrase',
    share: 'Share Relationship Blueprint',
    shareCopied: 'Copied to clipboard',
    shareText: 'Our relationship blueprint is "{name}" · Dangol Reunion Reading',
  },
  pitch: {
    lines: [
      'This was merely a gentle touch on the surface.',
      'The full reading retraces your final conversation, pinpoints your upcoming reunion window, and crafts the exact opening line you can send with ease.',
      'Whether you choose to reach back or gracefully step forward, you will walk away with grounded clarity instead of restless doubt.',
    ],
    button: 'Unlock the Full 12-Chapter Reading',
    ticketNote: '12 In-Depth Chapters · Begins immediately after checkout',
    region: 'Reunion Reading Overview',
    note: 'A single checkout unlocks all 12 chapters and three downloadable keepsake cards.',
  },
  safety: {
    title: 'If things feel heavy tonight',
    body: 'If tonight feels overwhelming, please set this reading aside and rest. Drink something warm, or talk to someone you trust about how you feel. You do not have to carry this alone. If you feel in crisis, please reach out directly to local support services or emergency resources near you.',
  },
  ui: {
    back: 'Back',
    stepOf: (n, total) => `${n} of ${total}`,
    editAnswers: 'Edit answers',
    startOver: 'Start over',
  },
  product: {
    includesTitle: 'What you get',
    includes: [
      'A 12-part reading, from your two charts to a final song',
      'A replay of your last conversation, and what keeps repeating on your side',
      'The reunion window: a 12-month calendar with five dated cards',
      'A contact kit: three first lines you could send, plus five things not to send',
      'A meeting plan, in case the conversation continues',
      'A first-100-days guide with rules and warning signs, if you do find your way back',
      'A path of letting go, with a frame for a letter you never send',
      'Three cards to save and share: your window, your kit, your song',
    ],
    gate: {
      title: 'Tell me your story first',
      body: 'To tailor the reading to your shared journey, I will need your birth dates and the context of your parting. It takes just two minutes.',
      cta: 'See if a reunion is possible, free',
      payNote: 'Before you pay, I need both birthdays first. It takes about a minute.',
    },
    movements: ['Tuning', 'The Broken String', 'Rejoining', 'The Afterring'],
    summary: ({ since, who, want }) => `Since the split: ${since} · Who ended it: ${who} · What you want: ${want}`,
  },
  cards: {
    readiness: {
      title: 'Before you send anything',
      intro: 'Seven quick checks. No score. Just notice which ones you can honestly tick.',
      items: [
        'I can name one thing I’d do differently, and say it without beating myself up.',
        'I can send a message and be okay if the reply is slow or short.',
        'I know what I’m asking for: a chat, a meeting, or a real second try.',
        'I’m not writing this while upset, after a drink, or past midnight.',
        'I could hear a plain “no” and still get through my week.',
        'The reasons we split are things I can name, not only feel.',
        'I have something besides this to look forward to this week.',
      ],
      footer: 'If several feel shaky, that’s worth knowing, not a verdict. Steadying yourself first costs nothing.',
    },
    paths: {
      title: 'Three paths',
      intro: 'Reach out, wait, or let go. None is right for everyone. Tap a path to see when it tends to fit.',
      rows: { when: 'When it fits', timing: 'Timing', relief: 'Why you may regret it less' },
      columns: [
        {
          id: 'reach',
          name: 'Reach out',
          when: 'You’ve named what went wrong, you can take a slow or short reply calmly, and you want more than closure.',
          timing: 'Your charts line up most easily around {month}. That makes it an easier time to try, not a sign of how it will go.',
          relief: 'You asked instead of wondering. Even a quiet answer leaves you with facts instead of a loop.',
        },
        {
          id: 'wait',
          name: 'Wait',
          when: 'You’re still raw, the last talk ended hot, or you don’t yet know what you’d say.',
          timing: 'Use the time until {month}, or a few weeks past it, to steady yourself and draft the line.',
          relief: 'You skip a message you might have wished back, and the choice stays yours.',
        },
        {
          id: 'letgo',
          name: 'Let go',
          when: 'The reasons you split are ones you aren’t willing to live with again, or reaching out would mostly be about easing the ache.',
          timing: 'No month is required. Closing can start today, whatever the calendar says.',
          relief: 'You spare yourself a second round of the same ending, and your peace stops depending on an answer.',
        },
      ],
      noMonth: 'Your charts show no especially easy month in the coming year, so timing leans on you rather than the calendar.',
    },
    window: {
      title: 'Your reunion window',
      intro: 'Twelve months, starting now. Some run easier for the two of you, some need care. This is about when things tend to go more smoothly, not about when anyone will reach out.',
      kinds: {
        both: {
          label: 'Easier for both',
          actions: [
            'A good month for a short, warm note.',
            'Suggest a coffee or a walk, not a long talk.',
            'Say one true thing plainly, then leave room.',
          ],
        },
        one: {
          label: 'Easier on one side',
          actions: [
            'Go slow. Keep any message short and low pressure.',
            'Use it to find your own footing before you reach out.',
            'If you do write, let a simple reply be enough.',
          ],
        },
        care: {
          label: 'Handle with care',
          actions: [
            'Hold off on big conversations. Keep things light.',
            'Write the message if you must, then sleep on it before sending.',
            'Spend it on yourself: sleep, friends, routine.',
          ],
        },
        even: {
          label: 'Quiet',
          actions: [
            'Nothing pulls hard either way. Good for steady routines.',
            'A calm month to practice what you’d say.',
            'Use the calm to check how you actually feel.',
          ],
        },
      },
      cardHead: (n) => `Date card ${n}`,
      monthLabel: (year, month) => `${MONTHS[month - 1] ?? ''} ${year}`,
      footer: 'These are easier or harder times to try, not predictions about anyone’s choices. You decide whether any month is right.',
    },
    kit: {
      title: 'Your contact kit',
      intro: 'Pick the tone that sounds like you. Send it only when you could live with silence. All three are short.',
      tones: {
        plain: {
          name: 'A plain hello',
          lines: [
            'Hi. I’ve been thinking of you and hoping you’re doing okay.',
            'Hey, it’s been a while. How have you been?',
            'I came across something that reminded me of you and made me smile. Hope you’re well.',
            'Hi. No pressure at all, I just wanted to say hello.',
            'Hope your week is going gently. I’m around if you ever feel like catching up.',
            'Hey. I’ve thought about how we left things. How are you doing these days?',
            'Hi, it’s me. Just a hello, and you don’t have to answer.',
            'I’d be glad to hear how you’re doing, whenever you feel like sharing.',
          ],
        },
        apology: {
          name: 'An apology',
          lines: [
            'I’ve thought a lot about how I handled our last conversation, and I’m sorry for my part.',
            'I’m sorry for how things ended. I wanted you to hear that from me.',
            'I owe you an apology for the way I spoke that day. No reply needed.',
            'I’ve been thinking about what I said, and I’m sorry it came out that way.',
            'I can see now that I didn’t listen well at times, and I’m sorry.',
            'I wanted to say sorry, plainly. You don’t have to respond.',
            'I’m sorry for how I handled the end. I hope you’re taking good care of yourself.',
            'Looking back, I wish I’d been kinder in that last talk. I’m sorry.',
          ],
        },
        news: {
          name: 'A bit of news',
          lines: [
            'I finally started that thing I kept talking about. Thought you might like to know.',
            'Small update: I learned to cook one proper dish. Hope your week is good.',
            'Some news on my side: I started something new, and it’s going well. How are you?',
            'I walked past our old coffee spot today and it made me smile. Hope you’re well.',
            'I got through a rough stretch lately and I’m doing better. I’d like to hear how you are.',
            'I finally finished that book you recommended. You were right about the ending.',
            'I found that song we both loved. It made me smile, so I thought I’d say hi.',
            'A small update: I’m doing okay these days. I’d love to hear how you are.',
          ],
        },
      },
      branches: [
        {
          name: 'If they reply warmly',
          next: 'Match their length and tone. Answer what they asked, add one light question, and leave it there.',
          stop: 'Pause after two or three exchanges. End the day on something warm and let the rest breathe.',
        },
        {
          name: 'If the reply is short',
          next: 'Answer once, kindly and briefly: “Good to hear from you. Take care.”',
          stop: 'A short reply isn’t an invitation to push. Stop after that one, and let any next step be theirs to take.',
        },
        {
          name: 'If there’s no reply',
          next: 'Send nothing more for now. Spend the time on something else. A gap isn’t a message you need to decode.',
          stop: 'After one message with no answer, stop. A second or third adds pressure without adding information.',
        },
      ],
      dontSendTitle: 'Five things not to send',
      dontSend: [
        'Long paragraphs that retell the whole breakup.',
        'Anything written late at night or after a drink.',
        '“Did you ever love me?” or any question that demands a verdict.',
        'Ultimatums like “answer me by tonight.”',
        'Guilt: “After everything I did for you.”',
        'Screenshots of old chats as proof.',
        'A string of follow-ups after one unanswered message.',
        'Comments about their posts or who they spend time with.',
        'Dramatic goodbyes you might not mean.',
        'Asking mutual friends to pass your words along.',
      ],
      waiting: {
        title: 'Waiting rules',
        rules: [
          'Leave the blocked line alone. No new accounts, no messages through friends.',
          'Pick a date to check in with yourself, such as a month from today, and not before.',
          'Draft anything you want to say in a notes app, and keep it there.',
          'Give your evenings a routine so the waiting isn’t all of your day.',
          'Decide now what would make you stop waiting, so the choice isn’t made at 2 a.m.',
        ],
      },
      timeTitle: 'When to send',
      timeLine: 'A calm weekday, late morning or early evening, usually reads lighter than midnight. You know their routine better than a chart does.',
      copy: 'Copy',
      copied: 'Copied',
    },
    days: {
      title: 'Your first 100 days',
      intro: 'If you do find your way back, these ten steps keep the old pattern from taking over. Each one is a week or two.',
      nodes: [
        { range: 'Week 1', title: 'Keep it small', line: 'See each other, and don’t plan the future. A good week is plain and unhurried.' },
        { range: 'Week 2', title: 'Say what you liked', line: 'Name one thing you enjoyed this week. Saying it out loud builds a new habit.' },
        { range: 'Weeks 3 and 4', title: 'Name the old pattern', line: 'Tell each other, calmly, the loop you both remember. Naming it once beats replaying it.' },
        { range: 'Week 5', title: 'Practice one disagreement', line: 'Pick something small and handle it the new way on purpose, while the stakes are low.' },
        { range: 'Weeks 6 and 7', title: 'Check the rhythm', line: 'Notice how often you talk and how it feels. Adjust before resentment gathers.' },
        { range: 'Week 8', title: 'Raise the hard topic', line: 'Bring up what you both skirted before, at a calm hour and not mid-argument.' },
        { range: 'Weeks 9 and 10', title: 'Protect your own life', line: 'Keep your friends, hobbies, and alone time. A pair with two full lives wears better.' },
        { range: 'Weeks 11 and 12', title: 'Review together', line: 'Ask each other what’s working and what feels like the old days. Keep it to ten minutes.' },
        { range: 'Week 13', title: 'Make one plan', line: 'Plan one thing a few weeks ahead. Small, shared, and easy to keep.' },
        { range: 'Week 14', title: 'Mark the day', line: 'Around day 100, say what you’ve each learned. Decide together what comes next.' },
      ],
    },
    rules: {
      title: 'Your relationship rules',
      intro: 'Short rules, matched to where your charts fray. Pick one and keep it for a month.',
      byFrayed: {
        clash: [
          { title: 'Cool down first', line: 'When voices rise, take twenty minutes apart. Come back to finish the talk, not to win it.' },
          { title: 'One topic at a time', line: 'Head-on pairs stack up grievances. Keep each argument to a single subject.' },
          { title: 'End on something good', line: 'After a hard talk, name one thing that went right so it doesn’t close on the edge.' },
        ],
        friction: [
          { title: 'Mention small things early', line: 'Say it kindly the day it happens. Small things stay small when they’re named quickly.' },
          { title: 'Finish the sentence', line: 'If a half-said thing hangs in the air, ask what the rest was.' },
          { title: 'Check the tone', line: 'When something lands oddly, ask “how did that sound?” before you react.' },
        ],
        combine: [
          { title: 'Say the unflattering thing', line: 'Closeness hides gaps. Share one honest disagreement a week.' },
          { title: 'Keep some plans separate', line: 'Protect time apart so you can see each other clearly.' },
          { title: 'Ask, don’t assume', line: 'In a close pair it’s easy to feel you already know. Ask anyway.' },
        ],
        calm: [
          { title: 'Plan something new each month', line: 'Quiet pairs drift without shared plans. Put one thing on the calendar.' },
          { title: 'Start the talk', line: 'No one is fighting, so no one begins. Take turns opening a conversation.' },
          { title: 'Mark small wins', line: 'Without drama, good moments slip by unnoticed. Say them out loud.' },
        ],
      },
      warningsTitle: 'Signs you may be sliding back',
      warnings: [
        'The same argument returns almost word for word, and neither of you changes the ending.',
        'You start staying quiet to keep the peace.',
        'Plans shrink: fewer dates, fewer talks, more “maybe later.”',
      ],
    },
    letgo: {
      title: 'The path of letting go',
      intro: 'Closing a chapter well is its own skill. Go in this order, at your own speed.',
      steps: [
        { title: 'Say it to yourself', line: 'Write one sentence about what you’re closing and why. It’s for you alone.' },
        { title: 'Quiet the doorways', line: 'Mute, archive, or move what keeps pulling you back: feeds, photos, shared playlists. You don’t have to delete.' },
        { title: 'Return and release', line: 'Box up objects and send back what’s theirs, once and plainly. Then stop discussing logistics.' },
        { title: 'Write the letter you won’t send', line: 'Use the frame below. Say everything. Then keep it, tear it, or let it go, but never send it.' },
        { title: 'Fill the space', line: 'Give the hours this took a new home: a class, a trip, people who make you laugh.' },
      ],
      letter: {
        title: 'The unsent letter',
        prompts: [
          'What I’m most grateful for is…',
          'What I wish I had said is…',
          'What I’m sorry for is…',
          'What I forgive, in you and in myself, is…',
          'What I’m taking with me, and what I’m setting down, is…',
        ],
      },
      signalsTitle: 'It’s okay to answer if they reach out and…',
      signals: [
        'You can answer calmly, without rehearsing for hours.',
        'You’d be fine if the conversation stays short and friendly.',
        'Your reason to answer is kindness, not a need to fix the ending.',
      ],
    },
    save: {
      title: 'Save and share',
      button: 'Save as images',
      saved: 'Saved',
      failed: 'Couldn’t save. Please try again.',
      window: { name: 'Reunion window', caption: 'The months that run easier for us' },
      kit: { name: 'Contact kit', caption: 'First lines, and what not to send' },
      song: { name: 'My song', caption: 'One line, and my key dates', datesLabel: 'Key dates' },
      songLines: {
        reunite: [
          'Reach out when you’re steady, say it plainly, and let the answer be theirs to give.',
          'Go in clear, go in kind, and keep what you send easy to answer.',
          'If you try again, try it slower than before, with the old pattern named.',
        ],
        letgo: [
          'You’re allowed to close this gently, and to call it done.',
          'Let the song end. What you learned stays after the sound fades.',
          'Closing well is a way of looking after yourself. Take it at your pace.',
        ],
        unsure: [
          'You don’t need to decide tonight. Steady first, then see what you want.',
          'Keep both doors unlocked a little longer, and choose when your head is clear.',
          'Wanting to know is a start. Let the answer arrive when you’re rested.',
        ],
      },
      footer: 'No names or birthdays appear on these cards.',
    },
  },
};
