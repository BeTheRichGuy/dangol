import type { TypeKey } from '@/lib/saju/types';
import type { TypeProfile } from '@/lib/reading/types';

export const TYPE_PROFILES: Record<TypeKey, TypeProfile> = {
  pine: {
    key: 'pine',
    name: 'Pine',
    hanzi: '甲木',
    born: 'Pine-born',
    identity: 'You take your time, then stand firmly behind what matters.',
    inLove:
      "You take your time falling in love, then show up faithfully. Asking to be looked after takes a little more practice.",
    yulGreets:
      'Take those last stairs slowly. I’m in no hurry, and Sogeum has already settled in for a nap.',
    accent: '#7FA88E',
  },
  vine: {
    key: 'vine',
    name: 'Vine',
    hanzi: '乙木',
    born: 'Vine-born',
    identity: 'You’re good at finding another way, even in a difficult room.',
    inLove:
      'You read the room, then the person, then quietly reshape yourself to fit. Keep one corner of the trellis just for you.',
    yulGreets:
      'Ah, a vine. You found a way up here without waking Sogeum. That takes a certain touch.',
    accent: '#9BBFA9',
  },
  sun: {
    key: 'sun',
    name: 'Sun',
    hanzi: '丙火',
    born: 'Sun-born',
    identity: "You walk in and the room gets warmer. You didn’t even try.",
    inLove:
      'You love out loud: big, warm, a little dramatic. The one thing that wilts you is being quietly ignored.',
    yulGreets:
      'I saw you from the top step before you saw me. Mind the lanterns. You’re making them look shy.',
    accent: '#E0897A',
  },
  candle: {
    key: 'candle',
    name: 'Candle',
    hanzi: '丁火',
    born: 'Candle-born',
    identity: 'You are a small flame that makes any room feel like home.',
    inLove:
      'You light up one person at a time and remember everything they say. Keep a hand around the flame on drafty days.',
    yulGreets:
      'Oh, a little flame. Come in out of the wind. I kept the good seat by the lantern for you. I knew you’d come.',
    accent: '#E8A99A',
  },
  mountain: {
    key: 'mountain',
    name: 'Mountain',
    hanzi: '戊土',
    born: 'Mountain-born',
    identity: "You’re the steady one everyone leans on without asking.",
    inLove:
      'You show love by showing up. When “I love you” finally comes out, it’s for keeps. Say it a little sooner.',
    yulGreets:
      'Slow and steady. Good. Sogeum sleeps best near solid ground, and look who just arrived.',
    accent: '#D2B07A',
  },
  field: {
    key: 'field',
    name: 'Field',
    hanzi: '己土',
    born: 'Field-born',
    identity: 'You make things grow: people, plans, whole friend groups.',
    inLove:
      'You remember the spare scarf and the favorite snack. Leave a little room for someone to look after you too.',
    yulGreets:
      'Warm hands. You carry everyone’s weather, don’t you? Set it down on the step for tonight. I’ll watch it.',
    accent: '#DCC598',
  },
  blade: {
    key: 'blade',
    name: 'Blade',
    hanzi: '庚金',
    born: 'Blade-born',
    identity: 'You speak plainly, with more kindness behind it than people hear.',
    inLove:
      "You’re straight talk and fierce loyalty, and you hate guessing games. Under the edge, you’re the softest one in the room.",
    yulGreets:
      'Clean steps, clear eyes. No small talk needed. I’ll make some anyway, because I like you.',
    accent: '#C9C3B8',
  },
  jewel: {
    key: 'jewel',
    name: 'Jewel',
    hanzi: '辛金',
    born: 'Jewel-born',
    identity: 'You have excellent taste and you know exactly what you are worth.',
    inLove:
      "You’re picky because you care. You want to be treasured, and that is a perfectly good thing to want.",
    yulGreets:
      "Careful on the last step, it’s polished. Like you. I’ve been looking forward to this one.",
    accent: '#D6D1C8',
  },
  ocean: {
    key: 'ocean',
    name: 'Ocean',
    hanzi: '壬水',
    born: 'Ocean-born',
    identity: "You’re deep, curious, and impossible to keep in a jar.",
    inLove:
      'You love in tides: intense, curious, always a little in motion. Being held feels lovely. Being fenced in does not.',
    yulGreets:
      'A whole ocean on my little staircase. Sogeum is asleep, so the tide is safe. Come in. I’m curious how deep you go.',
    accent: '#7B8FB0',
  },
  rain: {
    key: 'rain',
    name: 'Rain',
    hanzi: '癸水',
    born: 'Rain-born',
    identity: 'You feel everything first and say it softer than it feels.',
    inLove:
      'You pick up on moods before the words arrive. Quietly romantic, quick to melt, slow to say how much. Say a little more.',
    yulGreets:
      'You walk in like the air before a good rain. Sit. Sogeum is asleep on the dry spot, but there’s room for two.',
    accent: '#9AAAC6',
  },
};
