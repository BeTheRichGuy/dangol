import type { GodGroup } from '@/lib/saju/types';

export type ConcernKey =
  | 'love' | 'crush' | 'ex' | 'partner' | 'marriage'
  | 'work' | 'money' | 'study' | 'people' | 'change' | 'self';

export const CONCERN_ORDER: ConcernKey[] = [
  'love', 'crush', 'ex', 'partner', 'marriage',
  'work', 'money', 'study', 'people', 'change', 'self',
];

export interface ConcernCopy {

  label: string;

  group: 'love' | 'life';

  book: 'love' | 'general';

  reaction: string[];

  title: string;

  lines: Record<GodGroup, { id: string; text: string }[]>;
}

function lines(key: ConcernKey, group: GodGroup, texts: [string, string]): { id: string; text: string }[] {
  return texts.map((text, i) => ({ id: `concern-${key}-${group}-${i + 1}`, text }));
}

export const CONCERNS: Record<ConcernKey, ConcernCopy> = {

  love: {
    label: 'My love life',
    group: 'love',
    book: 'love',
    title: 'About your love life',
    reaction: [
      'Oho? Love, then. I knew it before you reached the top step. Sit. I’ll read it properly.',
      'Love. Mm-hm. Sogeum didn’t even twitch. Old news.',
    ],
    lines: {
      peer: lines('love', 'peer', [
        'Oho? Waiting for love to knock? You stand so still that people have to walk all the way over. Notice who bothers to make the walk before {next}. It’s a decent filter.',
        'Another “you two should meet”? Your friends are matchmaking this month, asked or not. Go to the party before {next}. You can leave at nine. I won’t tell.',
      ]),
      output: lines('love', 'output', [
        'Still saving the good line for later? You’ve rehearsed it until it’s practically a speech. Say it before {next}, rough edges and all. A plain sentence is plenty.',
        'Flirting, or just being funny? You’re at your best when you aren’t trying. Lately you are. Send the goofy photo, or ask one good question. Either one counts.',
      ]),
      wealth: lines('love', 'wealth', [
        'Oho? Counting the glances now? Plenty come your way, and you pretend not to see them. If someone asks you out, take one beat before your instinct answers. Nobody minds a short pause.',
        'Choosing with a checklist again? It’s sensible, and a little bored of itself. Let one person surprise you before {next}. I’ve seen this month do it.',
      ]),
      power: lines('love', 'power', [
        'Still holding out for something serious? You want to be dated like an adult, and you’ve stopped pretending otherwise. Good. Keep the bar right where it is until {next}.',
        'Standards still sky-high? You grade people on the way in, before they’ve said hello. Keep one chair free for someone who arrives slightly rumpled. The bar can stay where it is.',
      ]),
      resource: lines('love', 'resource', [
        'Tired in a way sleep can’t fix? You’ve been holding everyone up, and it shows. Set one thing down before {next}. The rest of the list will keep.',
        'Oho? Staying in again? The sofa is thrilled, honestly. Leave the door unlatched until {next}, in case something nice knocks. Nobody’s judging.',
      ]),
    },
  },

  crush: {
    label: 'Someone I like',
    group: 'love',
    book: 'love',
    title: 'About the one you like',
    reaction: [
      'Oho? Someone you like. Don’t make that face. I’ll read you, not them, and you’re the half that matters.',
      'Mm-hm. A crush. You say it like it just started, but your face says it has been a while.',
    ],
    lines: {
      peer: lines('crush', 'peer', [
        'Still playing the guessing game? You two would do better as teammates, with inside jokes first. Relax, the rest has a way of following.',
        'Hunting for things you have in common? You probably share more than you think, and it’s mostly snacks. Ask about one out loud before {next}. Snacks are a safe start.',
      ]),
      output: lines('crush', 'output', [
        'Oho? Still drafting the perfect opener? It was good three drafts ago. You’ve just stared at it until the words went weird. The short one is fine, I promise. Send it before {next}.',
        'Funniest around them, worst at the real thing? One honest sentence does more than your best joke. Say it before {next}. You can go back to being funny right after.',
      ]),
      wealth: lines('crush', 'wealth', [
        'Oho? Already planning something grand? I can see the confetti from here. A coffee is plenty. It leaves them room to answer.',
        'Another “someday” in your head? A someday sounds like a maybe, and a Thursday sounds like you meant it. Put a real day on it before {next}. A short coffee counts.',
      ]),
      power: lines('crush', 'power', [
        'Standing very straight around them? You want it exactly right, and careful can look like cold. Ask one unplanned question before {next}. It doesn’t have to be polished.',
        'Oho? Changing outfits for a maybe-run-into? The effort is adorable, and slightly alarming. Give one warm compliment before {next}. It outdoes the outfit, I promise.',
      ]),
      resource: lines('crush', 'resource', [
        'Oho? Rehearsing and waiting, and calling it patience? That’s a lot of rehearsal for one sentence. Let them hear one ordinary thing from you before {next}. A bad pun counts.',
        'Hoping they’ll read between the lines? Nobody reads between the lines. Not even me, and I do this for a living. Five plain words will do it: “I’d love to see you.”',
      ]),
    },
  },

  ex: {
    label: 'An ex',
    group: 'love',
    book: 'love',
    title: 'About your ex',
    reaction: [
      'Oho? An ex. They’ve been on your mind longer than you admit, haven’t they? I’ll read you, not them.',
      'Mm. An ex. You still check, don’t you? I’ll tell you what that costs you.',
    ],
    lines: {
      peer: lines('ex', 'peer', [
        'Everyone has a take on this one? Your friends love you, and none of them was in the room. Take the love and leave the verdicts on the step. You’re allowed to nod and change the subject.',
        'Looking completely fine, are we? That’s its own kind of work. One friend who sees the not-fine part beats ten who clap. Find that one before {next}. No rush.',
      ]),
      output: lines('ex', 'output', [
        'Oho? Still polishing the perfect comeback? It’s a very good line, for a conversation that isn’t happening. Spend that wit on someone in the room before {next}. You have plenty more.',
        'Giving the closing speech in the shower again? It improves every time, and the audience never claps. Say the last line to the mirror before {next}. Then let the water run. Nobody needs a sequel.',
      ]),
      wealth: lines('ex', 'wealth', [
        'Oho? Still hoping to see them? Thinking about it has taken up enough of your evening. Give yourself one plan that has nothing to do with them before {next}. There’s room for both sadness and a good night.',
        'Oho? You still sleep in that hoodie? It’s been doing the talking for a while, and it only knows one line. Keep it or box it, that’s your choice. Your month points up the stairs.',
      ]),
      power: lines('ex', 'power', [
        'Oho? Court back in session? You’ve reopened the trial, with “should I have” and “why didn’t I” on the docket. Don’t worry, the court isn’t sitting this month. Nobody needs to rule on anything before {next}.',
        'Waiting for one clean closing conversation? It rarely comes that way. You may notice the ending on a quiet afternoon, when you forget to check. Forgetting to check counts as progress.',
      ]),
      resource: lines('ex', 'resource', [
        'Rewinding the same scenes again? You keep hoping the ending changes. Put the kettle on and let one scene go unwatched before {next}. Comfort loops are allowed.',
        'Missing someone, or wanting them back? Those feelings can overlap without asking you to do anything tonight. Give yourself until {next} to untangle them. There’s no deadline for an answer.',
      ]),
    },
  },

  partner: {
    label: 'My relationship',
    group: 'love',
    book: 'love',
    title: 'About your relationship',
    reaction: [
      'Oho. Your relationship. Good. I can only see your half of it, and you’ll learn plenty about the space in between.',
      'Mm-hm. Two people, one staircase. I can only see your half of it, so that’s the half we’ll work with.',
    ],
    lines: {
      peer: lines('partner', 'peer', [
        'Doing everything as a pair lately? You two are good together, and better with a little room. Keep one evening before {next} for your own friends. Coming home with stories is half the fun.',
        'Planning a serious talk? You two are better as friends first, and this month favors the inside joke. Don’t worry, the serious talk can wait until {next}.',
      ]),
      output: lines('partner', 'output', [
        'When did you two last make something together? You’re at your best as a duo, even when the project is a terrible song. Pick one silly project before {next}. Let it be the whole point.',
        'Swallowing something small again? It sits in your throat and grows. Say it before {next}. One kind sentence is plenty.',
      ]),
      wealth: lines('partner', 'wealth', [
        'Showing love with errands again? The booking, the repaired shelf, the thing handed over before anyone asked. Relax, it’s a lovely language. Add plain words now and then.',
        'Giving a lot, asking for little? It’s generous, and a little lopsided. Let the next favor run the other way before {next}. Nobody keeps a tab.',
      ]),
      power: lines('partner', 'power', [
        'Oho? Rehearsing the argument you haven’t had yet? You’ve won it twice in the shower. Nothing needs a ruling tonight. The real conversation can be shorter than the rehearsed one.',
        'Grading your relationship again? It gets a report card every week and never just gets to be. Skip the report this week. The evenings will speak for themselves.',
      ]),
      resource: lines('partner', 'resource', [
        'Oho? Cancelling plans to stay in together? It’s cozy, and it shrinks the world a little. One dinner out before {next} lets the cozy breathe. Staying in is still allowed.',
        'Oho? Pajamas and a show, again? Tea, a blanket, nobody performing. That counts as intimacy, and I’d protect it.',
      ]),
    },
  },

  marriage: {
    label: 'Marriage',
    group: 'love',
    book: 'love',
    title: 'About marriage',
    reaction: [
      'Oho. Marriage. Big word. I read how you love and what you want from a long life. I never name a day.',
      'Mm-hm. Marriage. Sogeum slept through the big word, so we’re safe. I’ll tell you what the road looks like from where I sit.',
    ],
    lines: {
      peer: lines('marriage', 'peer', [
        'Beside you, or ahead of you? You want someone who walks at your pace, and this month makes that clear. Watch who actually does before {next}. That’s all you need to do for now.',
        'Another wedding, another “your turn next”? Other people’s timelines get loud this month. You can smile and change the subject until {next}. Nobody else gets to set your pace.',
      ]),
      output: lines('marriage', 'output', [
        'Oho? Found the words yet? You circle the subject beautifully and never land. Say them to a friend before {next}. Out loud, it gets easier every time.',
        'Oho? Still joking so nobody can tell you’re serious? The jokes are getting very specific. One sincere sentence about the future before {next} will do. Funny people are allowed to mean things.',
      ]),
      wealth: lines('marriage', 'wealth', [
        'Doing the practical math again? Where, with whom, on what terms. Leave a little room in the plan for the part that isn’t a plan. Practical is lovely.',
        'Real life, or just a spark? You keep asking yourself that, and it’s a good question. No rush. Until {next}, watching beats deciding.',
      ]),
      power: lines('marriage', 'power', [
        'Carrying the whole word at once? “Marriage” weighs a lot, and you’re holding all of it. Put some of it down for now. It won’t tip over.',
        'Whose expectations are these? Other people’s are getting louder than yours. Don’t worry, ask which ones are really yours before {next}. The rest can wait in the hall.',
      ]),
      resource: lines('marriage', 'resource', [
        'A home matters more than a ceremony? This month is good for thinking about what home feels like. It’s enough to notice who makes it feel that way.',
        'Thinking it over slowly, with tea and lists? Long looks out the window, too. This is how you decide, and it works. Nobody is timing you but you.',
      ]),
    },
  },

  work: {
    label: 'Work & career',
    group: 'life',
    book: 'general',
    title: 'About your work',
    reaction: [
      'Oho. Work. Fine. I’ll read how you carry it. Sit.',
      'Mm-hm. Career. Sogeum sleeps on the clock and nobody minds. Let’s see how you do.',
    ],
    lines: {
      peer: lines('work', 'peer', [
        'Letting someone else present your idea again? You’re generous with credit and shy about taking it. Put your name on the next one before {next}. I doubt anyone on your side will mind.',
        'Sizing up the desk next to yours? Someone near you is doing nearly the same job, and you’ve been comparing. This month rewards your own pace, so keep it.',
      ]),
      output: lines('work', 'output', [
        'Oho? Talking yourself out of the pitch? You’ve listed every objection, and none of them came from the room. Bring the pitch to one meeting before {next}. The room can do the objecting.',
        'Showing nobody the draft yet? It’s further along than you think, and only you are still squinting at it. Show one rough version before {next}. Polish can wait.',
      ]),
      wealth: lines('work', 'wealth', [
        'Tempted to grab everything at once? Results are close this month, and so is the urge to reach for all of it. Pick the one opening you’d actually enjoy. Doing one well is plenty.',
        'Two offers, both tempting? Look past the first impression and picture an ordinary working day. Before {next}, write down what you need from it. You can take time to compare.',
      ]),
      power: lines('work', 'power', [
        'Grading yourself harder than your boss does? Expectations are climbing, and you climb with them. Take one slow breath before {next}. You’re doing better than you think.',
        'Oh? More work landing on your desk? Being trusted can feel good and tiring at once. Before {next}, ask which tasks matter most. You can take the compliment without taking on everything.',
      ]),
      resource: lines('work', 'resource', [
        'Guilty about slowing down? This month favors learning over performing. Take the course, find the teacher. Sharpening the blade is still work.',
        'Oho? Answering emails at midnight and calling it dedication? The inbox will still be there at nine. Close the laptop early before {next}. The good ideas will keep.',
      ]),
    },
  },

  money: {
    label: 'Money',
    group: 'life',
    book: 'general',
    title: 'About money',
    reaction: [
      'Oho. Money. Honest choice. I won’t tell you where to put it. I’ll tell you how you hold it.',
      'Mm-hm. Money. Habits are my department, and you have a few I can already see.',
    ],
    lines: {
      peer: lines('money', 'peer', [
        'Peeking at your friends’ wallets again? You compare without meaning to, and their numbers come with stories you’ll never hear. Spend by your own list until {next}. Your list is the only one that counts.',
        'Everyone too polite to split the bill? It gets awkward fast. Say the number out loud, kindly. Everyone else is probably relieved.',
      ]),
      output: lines('money', 'output', [
        'Talking about money more easily lately? With a friend, a partner, even yourself. Good. Name what you actually want to spend on, in one sentence, before {next}. No rush.',
        'Is the treat still a treat? You spend on what lets you express yourself, like the outfit or the good seat. There’s nothing wrong with that. Just call it a treat, so it stays one.',
      ]),
      wealth: lines('money', 'wealth', [
        'Oho? Pricing everything on sight again? It’s a good habit, and this month it’s worth pointing at your own spending. One honest look at the small stuff before {next} is enough.',
        'Paying for convenience again? Every small shortcut is cheap until you add them up. No panic. Pick one to keep and one to drop before {next}.',
      ]),
      power: lines('money', 'power', [
        'Oho? Grading yourself on money again? You’d give yourself a D over one oat latte. Budgets get rewritten all the time. Ask anyone who keeps one.',
        'Every responsibility lined up in your head? They push and shove in there. Write them down before {next}. A list is calmer than a worry.',
      ]),
      resource: lines('money', 'resource', [
        'Steadier with a cushion, even a small one? This month is good for understanding your own habits. Nothing needs chasing. No rush, just watch where the small things go until {next}.',
        'Listening to everyone’s advice again? Someone near you is generous with it this month. Listen, thank them, and then ask what you would do. You get the final vote.',
      ]),
    },
  },

  study: {
    label: 'Study & exams',
    group: 'life',
    book: 'general',
    title: 'About your studies',
    reaction: [
      'Oho. Study and exams. Brave. I can’t tell you a score. I can tell you what kind of studier you are.',
      'Mm-hm. Exams. Everybody claims to be fine about them. Let’s see how you really study.',
    ],
    lines: {
      peer: lines('study', 'peer', [
        'Study buddies working for you? Explain one idea out loud to a classmate before {next}, and see how much clearer it gets. Rambling counts. Saying it is half of knowing it.',
        'Comparing scores and hours again? Everyone around you has a pace, and it isn’t yours. Don’t worry about theirs. You learn best at yours, so keep it until {next}.',
      ]),
      output: lines('study', 'output', [
        'Reading it for the fifth time? You remember what you can explain. Write it out, say it aloud, teach it to a wall. Don’t worry, walls are patient students.',
        'Doodling in the margins again? Your ideas want to become essays, drawings, little experiments. Let one be your break from the textbook before {next}. The margins are on your side.',
      ]),
      wealth: lines('study', 'wealth', [
        'A plan with an actual time? Practical suits you this month, with a schedule and past papers. No rush, but the plan with a time on it is the one that gets done.',
        'Grabbing all the material at once? You want results, and the urge is to reach for everything. Pick the part that pays off most and finish it before {next}. The rest will still be there.',
      ]),
      power: lines('study', 'power', [
        'Oho? Hearing the exam hall in your sleep already? That’s only your brain taking it seriously. Same desk, same hour. Boring works on you, I checked.',
        'Aiming for flawless again? That standard would wear anyone out. An ordinary day rewards steady, and so do the weeks before {next}. Don’t worry, steady is enough.',
      ]),
      resource: lines('study', 'resource', [
        'Guilty about everything you haven’t done? This is a very good stretch for learning, with clear evenings and things that stick. No panic. Don’t spend it on guilt.',
        'Oho? Studying in bed again? Your brain files things while you rest, so the nap isn’t cheating. Take a walk, leave the phone in another room, then read one page. One page is a real page.',
      ]),
    },
  },

  people: {
    label: 'Friends & family',
    group: 'life',
    book: 'general',
    title: 'About friends and family',
    reaction: [
      'Oho. Friends and family. The hardest weather to read, and the kindest. We’ll start with your side of the table.',
      'Mm-hm. Your people. They matter a great deal, and this is not an emergency. We have time.',
    ],
    lines: {
      peer: lines('people', 'peer', [
        'You’re the one everyone texts first? You reply fast and start the plans, and it adds up. Let someone else reach out before {next}. Most people like being the one who starts.',
        'Oho? Friends all off in different directions? One’s buried in work, and one just got a dog and talks about nothing else. Send something dumb. A meme counts.',
      ]),
      output: lines('people', 'output', [
        'Always the funny one at the table? This month someone needs the serious one. Drop the joke for one minute before {next}. You have the voice for it.',
        'That family talk still waiting? It has waited long enough, I think. Start with one sentence and a warm drink before {next}. Nobody needs the long version.',
      ]),
      wealth: lines('people', 'wealth', [
        'Always offering a ride home? You handle the booking, the group chat, the practical bits. Let someone else arrange one evening before {next}. They might enjoy looking after you.',
        'Every door open, so nobody feels left out? That’s generous, and tiring. Choose the two people you’d call first. Giving them the best of your week is allowed.',
      ]),
      power: lines('people', 'power', [
        'Family expectations getting loud? You can love someone and still say, kindly, “I’ll do it this way.” Don’t worry, the two fit in one sentence.',
        'Being the responsible one again? Somebody has to, it seems, and it doesn’t always have to be you. Hand one thing over before {next}. Other people can carry a little.',
      ]),
      resource: lines('people', 'resource', [
        'Home feels like the safest place? Cook, call someone, sit in a familiar room. Being looked after counts, and this month it can be enough.',
        'Oho? Giving a lot, receiving quietly? You’ve been the shelter for so long you forgot you can sit inside one. Let one person take care of you before {next}. Nobody is counting.',
      ]),
    },
  },

  change: {
    label: 'A big change',
    group: 'life',
    book: 'general',
    title: 'About the big change',
    reaction: [
      'Oho. A big change. I can feel the stairs shift under you. Don’t worry, I’ll steady them. Let’s see what’s moving.',
      'Mm-hm. Change. I read what kind of mover you are. Whether to go is your call.',
    ],
    lines: {
      peer: lines('change', 'peer', [
        'Going to do it your own way anyway? Probably, and I’d expect nothing less. Tell one friend the plan out loud before {next}. The first step feels smaller once it’s been said.',
        'Collecting everyone’s advice again? Several of those opinions are really about their own lives. Don’t worry, keep what fits you. The rest was never yours to carry.',
      ]),
      output: lines('change', 'output', [
        'Finding the words for what’s coming? Good, that’s half the work. Write it as a note to someone you trust before {next}. You don’t have to send it yet.',
        'Oho? Rehearsing the big announcement? You’ve polished it past the point of being true. Drop the rehearsal. One sentence about what you’re moving toward is enough.',
      ]),
      wealth: lines('change', 'wealth', [
        'Still calling it “someday”? Concrete things are close this month, like a list, a quote, or a viewing. No rush, but take one real step before {next}. Real steps shrink big words like change.',
        'Several options, and all look good? Picture an ordinary Wednesday in each one. Before {next}, write down the one you’d most like to live. You can think without rushing to decide.',
      ]),
      power: lines('change', 'power', [
        'Choosing right, or choosing at all? The pressure to get it right is louder than the choice itself. A decision made kindly can be adjusted later.',
        'Hoping this change proves something? You’ve given it a lot of weight. It only has to be yours, and nobody grades a beginning.',
      ]),
      resource: lines('change', 'resource', [
        'Does “not yet” sound like failure? It’s a real answer until {next}. Gather what you need, like a mentor’s view and a quiet week. Preparing is allowed.',
        'Oho? Not jumping yet? You want more information and more sleep first. Smart. People who pack properly don’t have to run back for the charger.',
      ]),
    },
  },

  self: {
    label: 'Who I really am',
    group: 'life',
    book: 'general',
    title: 'About the real you',
    reaction: [
      'Oho. Who you really are. The oldest question on these stairs, and I have a head start. I already read your characters.',
      'Mm-hm. The big one. Sogeum is asleep, so it’s just us. Let’s see what the calendar wrote.',
    ],
    lines: {
      peer: lines('self', 'peer', [
        'Let me guess. A different you for every circle of friends? You know yourself best when nobody assigns you a role. Spend an hour alone before {next} and see what you pick. Nobody is watching.',
        'Oho? Always taking your usual seat? It’s easy to become the person everyone expects. Try one unfamiliar plan before {next} and see how it feels. Your old favorites will still be there.',
      ]),
      output: lines('self', 'output', [
        'Learning what you think by saying it? A journal, a song, a long voice note to yourself. Keep going until {next}. You sound more like yourself every time.',
        'Oho? Who’s that talking? Your voice is changing, and you’re hearing it for the first time. Don’t worry, the rough edges are the interesting part.',
      ]),
      wealth: lines('self', 'wealth', [
        'Want it, or just look good in it? You’re starting to see the difference between what suits you and what you want. Write the list down before {next}. The honest one is shorter, and that’s fine.',
        'Oho? Interested in something you can’t explain? Spend a little time with it before {next}. You can try a hobby without turning it into a plan for your whole life.',
      ]),
      power: lines('self', 'power', [
        'Whose “should” is that? The critic in your head is loud, and it speaks in “should.” Notice every “should” today and ask who wrote it. Don’t worry, not all of them are yours.',
        'Wondering what you’re supposed to be? Nobody handed you the script, and you keep looking for it. Try a role on and ask whether it fits before {next}. You can always take it off.',
      ]),
      resource: lines('self', 'resource', [
        'Turning inward lately? This is a quiet, deep stretch, made for long walks and slow baths. You learn who you are in the pauses between plans, so take them.',
        'Getting to know yourself, slowly? It feels like nothing’s happening. That’s normal. You’ll notice the change the way people notice a haircut: a week late, all at once.',
      ]),
    },
  },
};
