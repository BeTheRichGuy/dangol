import type { Element, GodGroup, TypeKey } from '@/lib/saju/types';
import type { TraitChapterText, TraitLibrary, TraitLine, TraitStrength } from '@/lib/reading/traits-types';

function lines(prefix: string, texts: string[]): TraitLine[] {
  return texts.map((text, i) => ({ id: `${prefix}-${i + 1}`, text }));
}

function core(type: TypeKey, strength: TraitStrength, texts: string[]): TraitLine[] {
  return lines(`core-${type}-${strength}`, texts);
}

function pattern(group: GodGroup, texts: string[]): TraitLine[] {
  return lines(`pattern-${group}`, texts);
}

function love(group: GodGroup, texts: string[]): TraitLine[] {
  return lines(`love-${group}`, texts);
}

function missing(element: Element, texts: string[]): TraitLine[] {
  return lines(`missing-${element}`, texts);
}

const CHAPTERS_10: Record<GodGroup, { same: TraitChapterText; other: TraitChapterText }> = {

  peer: {
    same: {
      title: 'The Chapter of Allies',
      line: 'Friends, equals, and your own two feet. Love here looks like partnership, with someone who walks beside you and keeps your pace.',
    },
    other: {
      title: 'The Chapter of Rivals and Mirrors',
      line: 'People a lot like you turn up as friends, rivals, and crushes. You learn what you want to borrow from them, and what you’d rather leave.',
    },
  },

  output: {
    same: {
      title: 'The Chapter of Making',
      line: 'Your voice, your hands, your ideas. You make things and people notice, and you’re easier to fall for when you’re in the middle of making something.',
    },
    other: {
      title: 'The Chapter of Speaking Up',
      line: 'Words you held back start to come out, honest and sometimes sharp. In love, the sweet thing finally gets easier to say first.',
    },
  },

  wealth: {
    same: {
      title: 'The Chapter of Adventure',
      line: 'Bigger moves, new places, risks you couldn’t take before. In love you’re drawn to people who make a trip sound like a plan.',
    },
    other: {
      title: 'The Chapter of Harvest',
      line: 'What you’ve been growing starts to come in: real plans, real results. In love, you start asking whether this is more than a spark.',
    },
  },

  power: {
    same: {
      title: 'The Chapter of Tests',
      line: 'Life asks more of you here, and so do the people you date. Higher standards, a few honest questions, and you come out steadier.',
    },
    other: {
      title: 'The Chapter of Promises',
      line: 'Commitments take shape, in work and in love. Wanting something real gets easier to say out loud here, and easier to hear.',
    },
  },

  resource: {
    same: {
      title: 'The Chapter of Strange Teachers',
      line: 'Unusual mentors, odd detours, ideas that won’t fit a plan. In love, you’re drawn to someone who shows you a way of seeing you hadn’t tried.',
    },
    other: {
      title: 'The Chapter of Shelter',
      line: 'A sheltered stretch of teachers, rest, and learning. Good years to slow down, and to let a partner take care of you without keeping score.',
    },
  },
};

export const TRAITS: TraitLibrary = {

  core: {
    pine: {
      strong: core('pine', 'strong', [
        'You plan the whole evening, book the table, carry both bags, and wait for the person you’re seeing to offer to take one.',
        'Your no is a closed door and your yes is a standing offer, so nobody you date has to wonder where they stand. That’s rarer than you think.',
        'You say “I’ll handle it” so well that at dinner you’d rather split the bill than let anyone see you need a hand. I see it; they don’t.',
      ]),
      balanced: core('pine', 'balanced', [
        'You can lead or follow in love, depending on who’s across the table. The ones who get to see both sides of you are the ones you keep.',
        'You’re stubborn about exactly two things in love, and you know what they are. On everything else you’ll let them pick the restaurant.',
        'You take forever to say yes to a new love, and once you do, you’re building something. You expect the same patience back and never say so.',
      ]),
      gentle: core('pine', 'gentle', [
        'You look sturdy, so nobody checks in, and the person you’re dating assumes you’re fine. One honest “how are you, really?” and you’d melt.',
        'You’re the tall one who still wants to be walked home after dinner. You’ll never ask, so they have to guess, and mostly they guess wrong.',
        'You stand tall in public and fall apart gracefully in private, so a new love meets the first version for months before the second.',
      ]),
    },
    vine: {
      strong: core('vine', 'strong', [
        'You’re charming in a way that looks easy and isn’t. At a first dinner you’ve read the person, the room, and the exit before the drinks arrive.',
        'You’re agreeable on the surface, with a short list underneath of what you won’t let slide. Whoever you’re seeing learns which one when you go quiet.',
        'You can wait out almost anything: a slow reply, a bad week, a crush who’s only half in. It’s the most generous thing about how you date, and the most tiring.',
      ]),
      balanced: core('vine', 'balanced', [
        'By date two you know their favorite song, their best friend’s name, and what worries them. People tell you things, which makes you a little dangerous.',
        'You lean toward warmth like a plant on a windowsill. A good date makes you bloom, and a bad one makes you extremely polite.',
        'You keep the group chat alive and the plans moving, and you’ve noticed your crush has never once planned something for you. I noticed too.',
      ]),
      gentle: core('vine', 'gentle', [
        'You say “I don’t mind, you pick” over dinner and quietly hope they pick right. It’s a test, and they never know they’re taking it.',
        'You hold on to whoever feels like shade, so two kind dates in, that person has become the shape of your whole week.',
        'You adapt so smoothly that three dates in, they know your good side and not your favorite order. That’s a lot of effort for a near stranger.',
      ]),
    },
    sun: {
      strong: core('sun', 'strong', [
        'You walk into a room already waving. When a crush doesn’t wave back, you take it personally for a day, maybe two.',
        'You love with the lights on and the volume up. You’d take a loud no from a crush over a polite maybe any day, and everyone can tell.',
        'You’d plan a surprise for someone you’ve been dating three weeks. Big plans, warm intentions, and a small hope they’ll match them.',
      ]),
      balanced: core('sun', 'balanced', [
        'When you really fall for someone, you go a little quiet. That’s how your friends always know before you do.',
        'You shine easily and rest rarely. Your best dates are the ones where you can be lazy and still adored.',
        'You’re generous with praise and oddly shy about receiving it, so a crush’s compliment gets a joke back instead of a thank-you. Predictable, and sweet.',
      ]),
      gentle: core('sun', 'gentle', [
        'You’re bright with a crowd and dimmer alone with your phone, which is when you check whether your crush texted first. Don’t deny it.',
        'You give warmth freely, wait to be thanked, and pretend you weren’t waiting. When a crush forgets to notice, it stings more than you let on.',
        'You smile first so nobody can tell you were worried, including the person you’re falling for. It’s a good trick, and it also hides you.',
      ]),
    },
    candle: {
      strong: core('candle', 'strong', [
        'You give one person your full attention. Five minutes into a first date, you’ve noticed whether you can relax around them.',
        'Your focus is a candle. When you turn it on a crush, they feel it from across the room, and they remember it.',
        'You’ll talk until two in the morning and remember every sentence at breakfast. Depth is how you flirt, and frankly it’s unfair.',
      ]),
      balanced: core('candle', 'balanced', [
        'You keep a small flame for a few people and a polite glow for everyone else, and whoever you’re seeing can feel the moment they cross from one to the other.',
        'You remember odd little things, like the name of a crush’s childhood dog, and bring them up months later. It undoes people; it would undo me.',
        'You’re cozy with a few people and a little formal with everyone else, so anyone you’re seeing who gets invited into your kitchen has been quietly promoted.',
      ]),
      gentle: core('candle', 'gentle', [
        'A cold reply can flatten your whole evening. You’d love someone whose texts feel like a hand cupped around a flame.',
        'One changed punctuation mark in a crush’s text catches your eye. You spend the evening wondering about it and rarely ask.',
        'You bend toward whoever warms you and shrink from drafts, and in dating you can feel which one it is within the first ten minutes.',
      ]),
    },
    mountain: {
      strong: core('mountain', 'strong', [
        'You don’t say “I love you” until you could say it in your sleep. When it comes, it comes with a plan and a spare key.',
        'Your phone is full of other people’s problems, and the person you’re seeing has heard almost none of yours. I know the type.',
        'You’re slow to answer and quick to remember. Once you’ve decided a crush matters, you show up, and you keep showing up.',
      ]),
      balanced: core('mountain', 'balanced', [
        'You answer “how are you” with a status update about everyone else, so the person you date has to ask twice. I would too.',
        'You’re not a big texter, but you’ll drive across town for someone you love. Your gestures are your love letters, and not everyone knows how to read them.',
        'You hold a lot quietly, and the person who asks “but how are you really” a second time over dinner gets the real answer.',
      ]),
      gentle: core('mountain', 'gentle', [
        'You look unmovable, but one offhand comment from a crush lands like a stone in a pond. You think about it for days and say nothing.',
        'You’d love to be looked after for once, but you’re so good at looking after everyone that the person you’re seeing never thinks to try.',
        'You carry the plan, the budget, and the weekend away, and you get quietly grumpy when the person you’re seeing doesn’t notice.',
      ]),
    },
    field: {
      strong: core('field', 'strong', [
        'You notice who needs a lift and who hasn’t ordered yet. On a date, you can spend the whole meal looking after the person across from you.',
        'You show love by remembering the snack, offering a ride, and checking they got home. You notice when someone remembers those things for you.',
        'You read what the person you’re seeing needs before they can, and hand it over before they know they were missing it. It rarely comes back around to you.',
      ]),
      balanced: core('field', 'balanced', [
        'You make anyone you’re seeing feel completely at home and forget to take your own coat off. You’re the host even when you’re the one being taken out.',
        'You’re good at the small things in love, like the right snack, the right pause, the follow-up question. Those turn out to be the big things.',
        'You keep every little thing a crush says and bring it back months later as the perfect gift, and you wonder if anyone keeps yours.',
      ]),
      gentle: core('field', 'gentle', [
        'You soak up other people’s moods like soil takes rain, so after a tense dinner you can’t tell whose bad evening you’re carrying.',
        'You say “it’s fine” fast and mean it slowly, and the person you’re seeing usually only hears the first answer. I hear both.',
        'You tuck your needs under the table so nobody has to deal with them, including the partner who’d be glad to.',
      ]),
    },
    blade: {
      strong: core('blade', 'strong', [
        'You say it in one clean sentence, and it lands harder than you meant, especially on someone you’re dating. Then you wonder why the room went quiet.',
        'You’d rather have a clear no than a foggy maybe. Slow, vague situationships make you itchy, and I can see you shifting in your seat.',
        'You’ve made up your mind about a date before the mains arrive. You just don’t announce the verdict.',
      ]),
      balanced: core('blade', 'balanced', [
        'Your loyalty shows up at the airport at 5 a.m. for someone you love. So does your honesty, on the drive home.',
        'You’re cool and unbothered until someone you love gets treated unfairly, and then you’re suddenly very awake. I’d hate to be on the other end of that.',
        'You’re the one friends call when their love life is a mess, and the one who never calls about your own. I know that phone.',
      ]),
      gentle: core('blade', 'gentle', [
        'You act sharper than you feel. The blunt text is armor, and underneath you’re hoping for a warm reply.',
        'Your guard is up for the first three dates. Whoever stays past that finds the softest person in the room, and you know it.',
        'You say you don’t care about their reply, then check your phone. The first part is armor, and the second part is you.',
      ]),
    },
    jewel: {
      strong: core('jewel', 'strong', [
        'You notice the careless text, the late plan, the forgotten detail from someone you like. You rarely say it, and you remember all of it.',
        'You want to be adored on a good day and understood on a bad one. Few people can do both, and you can tell within a month.',
        'You’d rather skip a mediocre date and have a perfect night in, so a genuinely good date feels like a small event to you. Of course it does.',
      ]),
      balanced: core('jewel', 'balanced', [
        'You plan the outfit and rehearse the first hello. A date that looks effortless usually took you longer to prepare for than anyone knows.',
        'You shine best when you feel safe, so you’re funnier on date three than on date one. The first date gets the rehearsed version.',
        'You’re fussy about small things because you care about the big ones. A late reply tells you more than a long speech.',
      ]),
      gentle: core('jewel', 'gentle', [
        'One careless comment from a crush can dull your whole week, and nobody will know. You wipe it off and smile, which is impressive and also exhausting.',
        'You overthink what to wear and whether to reply, and a draft sits in your phone for an hour before the “Hey” goes out.',
        'You take a long time to trust a new love and a short time to notice when something’s off, and the noticing always arrives first.',
      ]),
    },
    ocean: {
      strong: core('ocean', 'strong', [
        'You need room to roam, and you say so early. Love feels like a harbor when it lets the boat leave, and like a fence when it doesn’t.',
        'You say “let’s see where this goes” and mean it. It’s romantic until someone needs a plan for Saturday, and then your face changes.',
        'You say yes to the spontaneous plan and no to the same Tuesday twice, so a standing date night starts to feel like a tide going out.',
      ]),
      balanced: core('ocean', 'balanced', [
        'On a first date you ask the question under the question, and people tell you things they haven’t told anyone. I’d call that a talent.',
        'You go deep fast in conversation and take your time everywhere else, so someone you’re seeing who can swim at your depth stands out at once.',
        'You change your mind about places and almost never about people, so a partner can trust you even while your travel plans make them dizzy.',
      ]),
      gentle: core('ocean', 'gentle', [
        'You’re deep, but you get carried by the mood of whoever you’re with, so after a long dinner you need an hour alone to sort out whose feelings are whose.',
        'You nod along at dinner and work out what you actually think on the way home, then draft a text you never send.',
        'You get overwhelmed by too many options and too many feelings at once, so “where do you want to eat?” from a crush can feel like a pop quiz.',
      ]),
    },
    rain: {
      strong: core('rain', 'strong', [
        'You look quiet, and you’re secretly the most stubborn one in the room. Someone you’re seeing who pushes past your gentle no learns how final it is.',
        'You have a rich inner life and an excellent poker face. Your crush thinks you’re calm while you compose three possible conversations.',
        'You seem soft until a boundary gets crossed, and then your quiet becomes very clear. Whoever you’re dating learns it once.',
      ]),
      balanced: core('rain', 'balanced', [
        'You sense moods before the words arrive, so a short “fine” from your crush reads as a whole paragraph. I know that language.',
        'You love slowly and quietly. Your idea of romance is someone remembering a thing you said once, in passing.',
        'You love in details: the weather on a first date, the song in the café, the way they said your name. You keep all of it.',
      ]),
      gentle: core('rain', 'gentle', [
        'You fall asleep replaying what you should have said at dinner, and by morning the perfect reply is finished and too late.',
        'You mirror the mood at the table so well at dinner that you lose track of your own, and only find it again on the walk home.',
        'You ache for anyone who looks sad, even a stranger on a train, which is how you end up on a second date mostly because someone seemed lonely.',
      ]),
    },
  },

  pattern: {
    resource: pattern('resource', [
      'You write the text, rewrite it, delete it, and send a shorter one. The thinking is the part nobody sees; I see it.',
      'You’re quietly waiting for someone to just take care of it: the plan, the booking, the next step. You’ve gotten very good at hiding the wait.',
      'You research a haircut, a flight, and a bookshelf like they’re big purchases: reviews, forum threads, one stray rave from March. Then you still hesitate.',
      'You collect advice from five people and then do what feels right anyway. The collecting is how you get brave.',
    ]),
    output: pattern('output', [
      'You say the funny thing before you decide whether to say it. It delights most people and occasionally comes out a little wrong.',
      'Your notes app is full of half-ideas and one-liners. You get restless on days when nothing gets made.',
      'You fill silences on instinct: a fact, a joke, a story about your cousin. A lull in a crowd feels like your job to fix.',
      'You think in jokes and say them out loud before the punchline is ready. Half your best lines happened by accident.',
    ]),
    power: pattern('power', [
      'You grade yourself all day, quietly: was that good enough? Nobody else is holding the clipboard, and you carry it everywhere.',
      'You choose your words carefully and your outfits more carefully. What you fear most is being judged, so you judge yourself first.',
      'You take duty seriously, including duties nobody gave you. You’re usually the first to arrive and the last to leave.',
      'You reread your own messages for tone before sending. You’d rather be careful than be misread.',
    ]),
    wealth: pattern('wealth', [
      'You like plans that do something: the tickets bought, the route mapped, a time on the calendar. Vibes alone make you restless.',
      'You notice what things cost, what people mean, and what’s actually happening. You do the math on everything, and you’re right more often than people enjoy.',
      'You go after what you want, and a difficult task can hold your attention longer than an easy one.',
      'You can tell within minutes whether something is a plan or a daydream, and you rarely give a daydream a second look.',
    ]),
    peer: pattern('peer', [
      'Your inner circle knows you better than any date does. Part of you likes it that way.',
      'You’d rather figure it out alone than ask for help, even when someone is right there with their hand out.',
      'You like being met as a grown-up. If anyone starts managing you, you pull away so smoothly they only notice later.',
      'You’d rather walk than be picked up, and fix your own bike than be offered help. Owing anyone anything makes your shoulders rise.',
    ]),
  },

  love: {
    peer: love('peer', [
      'You want a partner who’s also your best friend, someone who shares the dessert and helps make the decisions. Rescuers and projects need not apply.',
      'In love you walk side by side, and it gets competitive over small things like who found the café first.',
      'You fall for people who feel like you in a different coat: lovely, easy, and a little like looking in a mirror.',
      'You’re at your most flirtatious as a teammate: inside jokes, shared fries, a running bit that only the two of you understand. I know that game.',
    ]),
    output: love('output', [
      'You show love through little made things: a playlist, a note, a nickname. You’re happiest with someone who laughs at them.',
      'You need a partner who lets you be silly and doesn’t need you polished. For you, fun is the foundation.',
      'You give a lot early: the compliments, the plans, the effort, before you’ve seen what they’ll offer back. Generous, and a little reckless.',
      'You fall for someone who makes you laugh and then feels safe enough to be quiet with. The laughing is easy, and the quiet is the real test.',
    ]),
    wealth: love('wealth', [
      'Love, for you, is something you do: the umbrella held your way, the repaired zipper, the coffee ordered right. You trust actions more than promises.',
      'You fall for people who follow through: the reservation made, the fixed shelf, the text that says “home safe.”',
      'You’re warm but practical about it, and by the third date you’re quietly asking whether this is more than a flutter.',
      'You like a person who is clear about what they want from a Saturday. Mystery is fun, but a plan with your name on it is better.',
    ]),
    power: love('power', [
      'You’re drawn to people you can respect: calm, steady, a little serious. A good laugh is a bonus; being taken seriously is the goal.',
      'You feel pressure in love, as if you have to be your best self on every date, and your off days get cancelled before anyone sees them.',
      'You take a relationship seriously from the start, even a casual one. You’d rather name it than float.',
      'You’re attracted to calm competence: the person who stays calm through a tense dinner without making a scene.',
    ]),
    resource: love('resource', [
      'You want a partner who feels like a lamp left on in the hall: no performance, no pressure, just someone glad you’re home.',
      'You’re drawn to people who are kind, wise, or a little older in spirit. You want to learn from the person you love.',
      'You fall for the way someone takes care of you, then feel guilty for liking it and start keeping a secret tab of what you owe.',
      'You love slowly, in a long, warm way, and the person who gets that is the one who says “take your time” and means it.',
    ]),
  },

  tension: lines('tension', [
    'You want closeness and you want space, sometimes within the same hour. You mean both, every time.',
    'Part of you keeps asking whether this is right, even when it’s going well, and the question tends to arrive right after a really good date.',
    'Your love life has never been a straight line: big starts, sudden quiet, a plot twist you didn’t order. You’re good at beginnings.',
    'You can run hot and cold in the same week and be sincere both times, and the person you’re seeing is left guessing the forecast.',
    'You plan the second date and then want to cancel it, and both feelings are real. That’s the push and pull in you.',
    'You want a steady person and a surprising one, and your heart keeps a spreadsheet with two columns that rarely agree.',
  ]),

  missing: {
    wood: missing('wood', [
      'You’re drawn to people who are still growing: curious, kind, still trying new things, with something always growing on the balcony.',
      'You tend to fall for the one who starts things: a new hobby, a new city, a new idea, and plenty of kindness. Beginnings suit you.',
      'You’re drawn to kindness that grows on you slowly, the kind that remembers your birthday and asks about your family.',
    ]),
    fire: missing('fire', [
      'You’re drawn to brightness you can spot from across the room: someone who’s loud about being happy and says “I like you” out loud.',
      'You melt for the one who says the affectionate thing out loud. Quiet love is real love, but you need to hear it sometimes, and you know it.',
      'You warm up around people who tease you tenderly. Affection with a little spark in it is your weakness, and I can’t say I blame you.',
    ]),
    earth: missing('earth', [
      'You’re drawn to steady people: the ones who answer on time, remember the plan, and feel like home on a Monday.',
      'What softens you is reliability. Not grand gestures, just a person who does what they said they’d do, again and again.',
      'You’re quietly looking for a home in a person: someone whose presence makes the room feel less temporary.',
    ]),
    metal: missing('metal', [
      'You’re drawn to people who are clear: they know what they want, say it simply, and keep their word.',
      'You notice people who can disagree politely. Someone who knows what they want and treats others kindly tends to hold your attention.',
      'Clear limits are attractive to you. Someone who says “I’m busy Thursday, but how about Friday?” has your full attention.',
    ]),
    water: missing('water', [
      'You’re drawn to calm, deep people: the ones who listen, think before they speak, and don’t panic when you do.',
      'You love a quiet mind: someone who can sit with you on a rainy afternoon and let the quiet be. That’s rarer than it sounds.',
      'You’re drawn to the one who asks the second, deeper question and then actually listens to the answer.',
    ]),
  },

  chapters: {
    peer: CHAPTERS_10.peer.same,
    output: CHAPTERS_10.output.same,
    wealth: CHAPTERS_10.wealth.other,
    power: CHAPTERS_10.power.same,
    resource: CHAPTERS_10.resource.other,
  },
  chapters10: CHAPTERS_10,
};
