import type { GodGroup } from '@/lib/saju/types';
import type { ReadingLibrary, SaltLevel } from '@/lib/reading/types';

type SaltEntry = ReadingLibrary['salt'][SaltLevel][GodGroup][number];

function lines(level: SaltLevel, group: GodGroup, pairs: [string, string][]): SaltEntry[] {
  return pairs.map(([situation, action], i) => ({
    id: `${level}-${group}-${i + 1}`,
    situation,
    action,
  }));
}

export const SALT: ReadingLibrary['salt'] = {
  pinch: {
    peer: lines('pinch', 'peer', [
      [
        'You glance at how everyone else’s life looks online and quietly grade your own.',
        'Mute one account for today. Your story isn’t a group project.',
      ],
      [
        'You’d like it your way, someone close would like it theirs, and you’re both being very polite about it.',
        'Hand them the small decision today and keep the big one for later.',
      ],
      [
        'A friend’s opinion gets a little louder than your own this week. I can hear it from here.',
        'Before you answer the group chat, ask yourself one question: what do I think?',
      ],
    ]),
    output: lines('pinch', 'output', [
      [
        'A joke with a tiny edge slips out and lands differently than you meant it. You saw the face change, didn’t you?',
        'If it did, say, “That came out sharper than I meant.” Done.',
      ],
      [
        'You send the second text before the first one has been answered. The pause felt too loud, didn’t it?',
        'Wait for the first reply today. A pause is part of the conversation too.',
      ],
      [
        'You explain a feeling three different ways when once would have done. You’re auditioning it.',
        'Say it once, plainly, and let the quiet carry the rest.',
      ],
    ]),
    wealth: lines('pinch', 'wealth', [
      [
        'You do a little more than anyone asked, quietly hoping it gets noticed. I notice; not everyone does.',
        'Do the usual amount today and see who notices you anyway.',
      ],
      [
        'Something new and shiny makes the steady option look duller than it is. Shiny is loud, and steady is quiet.',
        'Jot down three things you like about the steady option, then read them with a clear head.',
      ],
      [
        'You try to guess what someone wants before you check what you want. You’re very good at it, and it’s still a detour.',
        'Before answering any invitation today, ask yourself: do I actually want this?',
      ],
    ]),
    power: lines('pinch', 'power', [
      [
        'You want a clear answer about where things stand, and you want it today. The hurry is louder than the question.',
        'Skip the big talk today. Ask one gentle question instead: “What are you hoping for?”',
      ],
      [
        'You smooth yourself out a little before you walk in, so people meet only the polished version. It takes effort to keep that up.',
        'Leave one thing unpolished today, like the comfy sweater or the true story.',
      ],
      [
        'You hold yourself to a standard no one else has actually asked for. Who’s the judge, exactly?',
        'Do one thing just okay today and see whether the world still turns.',
      ],
    ]),
    resource: lines('pinch', 'resource', [
      [
        'You rehearse a conversation so well that the real one starts to feel like a rerun. I know that loop.',
        'Say the first line of it out loud to someone you trust, then stop rehearsing.',
      ],
      [
        'You wait to feel completely ready before replying, and ready keeps stepping a little further away.',
        'Reply with the eighty percent version. Warm and slightly imperfect is fine.',
      ],
      [
        'You curl up in comfort a little longer than you meant to, and the invitation floats by. Sogeum does that too, but Sogeum is a kitten.',
        'Say yes to a ten-minute version of the plan. Leaving when the time is up is part of the deal.',
      ],
    ]),
  },

  spoonful: {
    peer: lines('spoonful', 'peer', [
      [
        'You keep a tally without meaning to: who paid, who called, who thanked whom. You keep a very good ledger.',
        'Do something for someone today without keeping count. Notice how it feels to just give.',
      ],
      [
        'You and someone close both quietly want to be the one who gets it right, and a small thing is turning into a big one.',
        'Be the first to say, “Okay, tell me again,” then listen for one full minute.',
      ],
      [
        'Someone’s easy confidence makes you push your own a notch too hard, and it comes out as pride. I can see the chin go up.',
        'Say one honest, unpolished sentence today, like “I was hoping you’d ask.”',
      ],
    ]),
    output: lines('spoonful', 'output', [
      [
        'You start venting to someone who only asked how your day was, and the evening loses its sweetness. It happens to the best of us.',
        'Ask about their day first, then share the small version of yours.',
      ],
      [
        'You’re quick enough to win the argument, and you can feel it costing you something warmer. Winning is overrated.',
        'Skip the win today. Try “Fair enough” and watch the room soften.',
      ],
      [
        'You say yes to everything in the glow of a good conversation, then wonder later what you promised. I know that glow.',
        'Before agreeing to any plan today, count to three. A slow yes is still a yes.',
      ],
    ]),
    wealth: lines('spoonful', 'wealth', [
      [
        'You’re chasing a yes like it’s the last bus home. It isn’t, and you’re not stranded.',
        'Put your phone in another room for one hour and do something with your hands.',
      ],
      [
        'You leave every option open, and keeping track of them is starting to feel like another job.',
        'Notice which option you think about first when you wake up. Just notice, for today.',
      ],
      [
        'You make everything so easy for others that nobody has noticed they haven’t asked what you want. Easy habit to fall into.',
        'Name what you want for dinner tonight. Specific, out loud, no “anything’s fine.”',
      ],
    ]),
    power: lines('spoonful', 'power', [
      [
        'A big unanswered question is parked over your ordinary evenings, and it turns small talk into exams.',
        'Set the question on a shelf for tonight and let the evening be just an evening.',
      ],
      [
        'You read a pause as a verdict when it might only be a Tuesday. I’ve met that judge, and it’s very dramatic.',
        'Assume the kind explanation for one full day, then check whether it still stings.',
      ],
      [
        'You try to be whoever someone would pick and forget that you get to pick, too. That’s the part you keep leaving at the door.',
        'Make one choice that’s only yours today, even if it’s just the song or the route.',
      ],
    ]),
    resource: lines('spoonful', 'resource', [
      [
        'You hope someone will simply sense what you need, because asking plainly feels like too much. Even a kind person can miss a hint.',
        'Say it in one short line, as casually as you’d mention the weather.',
      ],
      [
        'You go quiet when something stings and call it being low-maintenance. I’d call it hiding.',
        'Tell one person, in one sentence, what stung. A bit of maintenance is part of being loved.',
      ],
      [
        'You analyze a conversation for hours, as if the answer were hidden in the wording. It isn’t; I checked.',
        'Close the chat and make something warm to drink. The wording will be the same in the morning.',
      ],
    ]),
  },

  handful: {
    peer: lines('handful', 'peer', [
      [
        'Pride and independence are both at full volume, so asking for what you need feels like losing. It isn’t a contest.',
        'Ask for one small thing out loud today, like a call, a walk, or a favor.',
      ],
      [
        'You say “I’m fine” with your whole face saying otherwise, and someone is believing the words. I read the face.',
        'Swap one “I’m fine” for one true sentence. “I’m a little hurt” will do.',
      ],
      [
        'Someone close wants the same small thing you do, and you both pretend you don’t mind. Two very polite people, one small prize.',
        'Say out loud that you want it too, lightly, with a smile. The two of you will find a way to share it much faster.',
      ],
    ]),
    output: lines('handful', 'output', [
      [
        'A late-night message is writing itself in your head: very persuasive, very long. I know that author.',
        'Write it in your notes app and sleep on it. In the morning, send only the kind part.',
      ],
      [
        'The sharpest true thing you could say is right on your tongue, and you can taste how good it would feel. Careful.',
        'Say the kind true thing instead. It’s less satisfying for ten seconds and far more useful after that.',
      ],
      [
        'You’re retelling something that hurt before you’ve finished feeling it, and the story keeps getting bigger.',
        'Take a ten-minute walk before you tell anyone. Then decide how much you want to share.',
      ],
    ]),
    wealth: lines('handful', 'wealth', [
      [
        'You’re pouring so much effort into keeping someone’s mood bright that there’s nothing left for yours. I can see the empty cup.',
        'Do one thing today purely because it makes you happy, and don’t announce it.',
      ],
      [
        'The chase feels more thrilling than the prize, and some part of you knows it. I’m not scolding; I only noticed.',
        'Spend one evening without checking anything, and see what you still feel when the thrill goes quiet.',
      ],
      [
        'You keep saying yes to be liked, and the yeses are getting heavy to carry. That’s a lot of yeses.',
        'Say one small, kind no today and watch the sky stay exactly where it is.',
      ],
    ]),
    power: lines('handful', 'power', [
      [
        'The pressure to get it right is so loud it’s squeezing the fun out of something that was good. Let it breathe.',
        'Do one thing with no goal today: walk without a destination.',
      ],
      [
        'You’re ready to read one cold message as the whole story, and it’s a heavy story. One message is one message.',
        'Wait one day before drawing any conclusion from words on a screen.',
      ],
      [
        'You talk yourself out of what you want before you’ve finished saying it. That’s a tiring conversation to have alone.',
        'Let your heart speak first today, in one sentence to a friend. The judge can go second.',
      ],
    ]),
    resource: lines('handful', 'resource', [
      [
        'You’re pulling the blanket over your head, and half of you hopes someone will come find you there. That half is honest.',
        'Send one small signal today: a photo of the sky, a single line. Let someone find you.',
      ],
      [
        'The fog is thick, every option looks the same shade of gray, and so you pick none of them. Fog lifts.',
        'Choose only the next ten minutes. Wash a cup, step outside, text one person.',
      ],
      [
        'You lean on one person for every feeling, and that’s a lot of weight for one pair of shoulders.',
        'Try writing one feeling down before asking someone to help you untangle it.',
      ],
    ]),
  },
};
