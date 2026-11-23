import { pickByHash } from '@/lib/reading/hash';
import type { Focus } from '@/lib/reading/types';

export type ReactionKind = 'name' | 'focus' | 'date' | 'time' | 'place' | 'sex';

export const REACTION_KINDS: readonly ReactionKind[] = ['name', 'focus', 'date', 'time', 'place', 'sex'];

export interface ReactionInput {
  name?: string | null;
  focus?: Focus | null;
  date?: string | null;
  time?: string | null;
  place?: { name: string; lat: number } | null;
  solarHour?: string | null;
  sex?: 'female' | 'male' | 'nonbinary' | null;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
type Month = (typeof MONTHS)[number];

type MonthPart = 'early' | 'mid' | 'late';
export type DatePeriod = `${Month}-${MonthPart}`;

export const HOUR_ANIMALS = [
  'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
] as const;
export type HourAnimal = (typeof HOUR_ANIMALS)[number];

const NAME_LIMIT = 24;

type Pool = readonly string[];

function period(month: Month, early: string, mid: string, late: string): [DatePeriod, string[]][] {
  return [
    [`${month}-early`, [early]],
    [`${month}-mid`, [mid]],
    [`${month}-late`, [late]],
  ];
}

const DATE_ENTRIES: [DatePeriod, string[]][] = [
  ...period(
    'jan',
    'Early January. Frost on the stairs and everyone promising to change. You actually kept a few of those promises, quietly. I noticed.',
    'Mid-January, the deepest cold of the year. Oho. You keep a warm little room somewhere inside, and you don’t let just anyone in.',
    'Late January. Snow-quiet, right before the turning point. You like things that warm up slowly: people, plans, tea. I can tell.',
  ),
  ...period(
    'feb',
    'Early February, right around the Start of Spring, where the old calendar changes its year. I’ll be careful with this one.',
    'Mid-February. The ice is loosening on the streams. Mm-hm. You look calmer than you are, and you thaw faster than you admit.',
    'Late February. Mud, mist, the first brave buds. You start quietly and surprise people later. I’d bet that’s your whole history.',
  ),
  ...period(
    'mar',
    'Early March. Awakening-of-Insects weather: everything underground starts to stir. You wake up slowly, then all at once. Am I wrong?',
    'Mid-March. Plum blossoms out, wind still sharp. You tend to bloom before it’s comfortable, don’t you? Mm. Brave.',
    'Late March. Spring has only just reached my mountain. You begin things before you feel ready, don’t you?',
  ),
  ...period(
    'apr',
    'Early April. The cherry blossoms are out, loud and fleeting. You notice beauty before anyone points at it, and you pretend you didn’t.',
    'Mid-April. Petals are drifting down my stairs as we speak. You’re more sentimental than you let people see. I won’t tell.',
    'Late April. Azaleas, soft rain, green everywhere. Things grow around people like you, and you never take the credit.',
  ),
  ...period(
    'may',
    'Early May. Summer is knocking and the green is almost too bright. Oho. You say yes to plans before checking your calendar.',
    'Mid-May. Long light, fresh leaves, windows open. You light up a room, then need a quiet night to recover. Nothing wrong with that.',
    'Late May. The barley fields are turning gold. You’re good at waiting for something to ripen, and you’d never admit you’re waiting.',
  ),
  ...period(
    'jun',
    'Early June. Grain-in-Ear season, when the fields start filling out. Oho. You keep a lot unsaid, don’t you?',
    'Mid-June. Midsummer is close and the days are the longest. Your feelings run bright and you hide none of them well. I’d call that a feature.',
    'Late June. The rainy season rolls in, damp and green. You feel moods in the air before anyone speaks. Don’t pretend you don’t.',
  ),
  ...period(
    'jul',
    'Early July. Heavy rain and heavy heat. People born now have big feelings and an excellent sense of humor about them. Hello, you.',
    'Mid-July. Steam, cicadas, rain on the roof tiles. You’re loyal, loud when happy, and a little sleepy when sad. Close?',
    'Late July. The hottest days. Mm-hm. You’re fun in a crowd, and you quietly need a long cool drink of alone time afterward.',
  ),
  ...period(
    'aug',
    'Early August. The heat is still on, but autumn is quietly arriving on the old calendar. You hold two moods at once and hide it well.',
    'Mid-August. Evenings are cooling and the crickets are loud. You’re sharper than you look and softer than you act. I like the mix.',
    'Late August. The first autumn breeze and the clear sky after the heat breaks. You take a while to open up, then tell everything. I’ll be patient.',
  ),
  ...period(
    'sep',
    'Early September. White dew on the grass at dawn. You’re tidy in public and a little chaotic in private. I won’t look in the drawers.',
    'Mid-September. Harvest-moon season, full of family and rice cakes. You love tradition more than you admit. Oho, there it is.',
    'Late September. Clear, golden days. You have good taste and an even better memory for what someone said last year. Dangerous.',
  ),
  ...period(
    'oct',
    'Early October. Cold dew on the leaves and the first red maples. You’re private about the things that matter most. I’ll be careful.',
    'Mid-October. Ginkgo gold and maple red up on the mountain. You’re deep, a little dramatic, and secretly very romantic. Don’t deny it.',
    'Late October. The first frost is close and the air smells like woodsmoke. You love a cozy plan more than a loud one. So do I.',
  ),
  ...period(
    'nov',
    'Early November, right on the edge of winter by the old calendar. Mm-hm. You’re cool at first and warm all the way through.',
    'Mid-November. Bare branches, clear skies, persimmons drying under the eaves. You’re patient. Suspiciously patient, even.',
    'Late November. The first snow could come any day. You like staying in and talking about everything. I’ll put the tea on.',
  ),
  ...period(
    'dec',
    'Early December. Major Snow on the old calendar, with long nights ahead. You do some of your best thinking after dark, I’d guess.',
    'Mid-December. Deep winter, the stove is on. You’re a little shy to start with and unforgettable after the second hour.',
    'Late December. The longest nights, then the year turns. You’re good at endings, and even better at fresh starts.',
  ),
];

const DATE_PERIODS = {} as Record<DatePeriod, Pool>;
for (const [key, pool] of DATE_ENTRIES) DATE_PERIODS[key] = pool;

const HOUR_LINES: Record<HourAnimal, Pool> = {
  rat: [
    'Around the Rat hour by your clock, the deep middle of the night. A night person, then. I’ll set it by the sun once I know where you were born.',
  ],
  ox: [
    'Around the Ox hour by your clock, past midnight and very still. Few people see this hour. I’ll check it against the sun once I know where you were born.',
  ],
  tiger: [
    'Around the Tiger hour by your clock, just before dawn. Up early or still awake, I wonder? I’ll check it against the sun once I know where you were born.',
  ],
  rabbit: [
    'Around the Rabbit hour by your clock, sunrise and the first birdsong. A soft hour to arrive in. I’ll check it against the sun once I know where you were born.',
  ],
  dragon: [
    'Around the Dragon hour by your clock, when the morning is getting busy. I’ll check it against the sun once I know where you were born.',
  ],
  snake: [
    'Around the Snake hour by your clock, mid-morning light and no rush. I like that. I’ll check it against the sun once I know where you were born.',
  ],
  horse: [
    'Around the Horse hour by your clock, noon with the sun at its highest. No shadow to hide in. I’ll set it by the sun once I know where you were born.',
  ],
  goat: [
    'Goat hour, by your clock. Slow afternoon, tea weather. I’ll double-check it against the sun once I know where you were born.',
  ],
  monkey: [
    'Around the Monkey hour by your clock, afternoon light going gold. A good hour for mischief. I’ll set it by the sun once I know where you were born.',
  ],
  rooster: [
    'Around the Rooster hour by your clock, sunset and the best light of the day. A show-off hour. I’ll check it against the sun once I know where you were born.',
  ],
  dog: [
    'Around the Dog hour by your clock, lanterns lit and the day done. Time to head home. I’ll set it by the sun once I know where you were born.',
  ],
  pig: [
    'Around the Pig hour by your clock, evening settling in. Dinner hour, then. I’ll check it against the sun once I know where you were born.',
  ],
};

export const HOUR_ANIMAL_NAMES: Record<HourAnimal, string> = {
  rat: 'Rat', ox: 'Ox', tiger: 'Tiger', rabbit: 'Rabbit', dragon: 'Dragon', snake: 'Snake',
  horse: 'Horse', goat: 'Goat', monkey: 'Monkey', rooster: 'Rooster', dog: 'Dog', pig: 'Pig',
};

export const REACTIONS = {
  name: {
    named: [
      '{name}. I’ll remember that.',
      '{name}. Sogeum purred in the middle of a nap. High praise.',
      '{name}. Mm. I had a feeling it would sound like that.',
      '{name}. It sounds good on these stairs. Keep it. I’ll use it sparingly.',
    ],
    anonymous: [
      'A mystery. Sogeum likes those.',
      'No name? That’s fine. Sogeum likes a mystery, and I can work with one.',
    ],
  },
  focus: {
    love: [
      'Oho? Love. I knew you’d say that before you reached the top step.',
      'Love, then. Sogeum stirred, rolled over, and went back to sleep. Old news.',
      'Love. Mm-hm. You climbed those stairs like someone with a story, and I’ve already guessed how it starts.',
    ],
    someone: [
      'Mm-hm. Someone specific. I won’t read their mind. I’ll read how you love them, and that’s the half you can use.',
      'Ah, a particular someone. Of course there is. I’ll read your half. That’s where the useful part lives.',
      'Oh? Someone specific. I can’t see inside their heart, only yours. Funny how that’s the one you can do something about.',
    ],
    everything: [
      'Everything? We’ll start with you, then leave room for whatever matters most.',
      'Everything. Ambitious. Good, we have time and tea.',
      'Oh, everything. Brave. I’ll start with you and we’ll work outward. Sogeum will sleep through it.',
    ],
    unset: ['Mm. No hurry. Let’s see where this goes.'],
  },
  date: {
    periods: DATE_PERIODS,
    fallback: ['Noted. The day matters more than the year here, and I have the day.'],
  },
  time: {
    hours: HOUR_LINES,
    unknown: [
      'Honest. I’ll read three pillars instead of four.',
      'That’s okay. Three pillars still tell me plenty. I just won’t guess at the fourth, and I never guess.',
    ],
  },
  place: {
    general: [
      '{city}. I’ll find the sky you were born under from there.',
      '{city}. Sogeum is asleep on the map, right over it. I’ll work around the cat.',
      '{city}. I like knowing where a person starts from. It explains more than you’d think.',
      '{city}, got it. I’ll look up what the sky was doing over there that day.',
    ],
    south: [
      '{city}. Your seasons run the other way from mine, so your birthday wore different weather than I pictured. Fixing the picture.',
      '{city}. July looks rather different there. I’ll keep your local time in mind when I calculate the chart.',
      '{city}. South of my mountain by quite a way. I’ll use the local sun to check your birth time.',
    ],

    sunShift: [
      '{city}. By your city’s own sun, you were born in the {sun} hour. Your clock said {clock}. Good thing I asked. I’ll read it that way.',
      '{city}. The sun there kept its own time. It says {sun} hour where your clock says {clock}. I go by the sun.',
      'Mm, {city}. Your clock said {clock} hour, but the sky over there says {sun} hour. I go by the sky.',
    ],

    sunShiftNoName: ['By the sun where you were born, it was the {sun} hour. Your clock said {clock}. Mm. I’ll read it that way.'],
    noName: ['Got it. I know the sky you came from now.'],
  },
  sex: {
    chosen: [
      'Noted. That tells me which way your ten-year chapters run.',
      'Thank you. That’s the last piece for your ten-year chapters.',
      'Got it. One more door in your chart can open now. I peeked. I’m not telling.',
    ],
    skip: [
      'Then I’ll leave the ten-year chapters closed for now.',
      'That’s fine. The ten-year chapters stay closed for now, and you can open them whenever you like.',
    ],
  },
} as const;

type ReactionText<T> = T extends string ? string : T extends readonly string[] ? readonly string[] : { [K in keyof T]: ReactionText<T[K]> };
export type ReactionCopy = ReactionText<typeof REACTIONS>;

export function datePeriod(date: string | null | undefined): DatePeriod | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '');
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const part = day <= 10 ? 'early' : day <= 20 ? 'mid' : 'late';
  return `${MONTHS[month - 1]}-${part}`;
}

export function hourAnimal(time: string | null | undefined): HourAnimal | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time ?? '');
  if (!m) return null;
  const hour = Number(m[1]);
  return HOUR_ANIMALS[Math.floor(((hour + 1) % 24) / 2)];
}

function clockOf(value: string | null | undefined): string | null {
  const m = /(?:^|[ T])([01]?\d|2[0-3]):([0-5]\d)$/.exec(typeof value === 'string' ? value.trim() : '');
  return m ? `${m[1]}:${m[2]}` : null;
}

export function sunShift(
  time: string | null | undefined,
  solarHour: string | null | undefined,
): { clock: HourAnimal; sun: HourAnimal } | null {
  const clock = hourAnimal(time);
  const sun = hourAnimal(clockOf(solarHour));
  return clock && sun && clock !== sun ? { clock, sun } : null;
}

export function isSouthern(place: { lat: number } | null | undefined): boolean {
  return !!place && Number.isFinite(place.lat) && place.lat < 0;
}

function cityOf(place: { name: string } | null | undefined): string | null {
  if (!place || typeof place.name !== 'string') return null;
  const city = place.name.split(',')[0].replace(/\s+/g, ' ').trim();
  return city ? city : null;
}

function cleanName(name: string | null | undefined): string {
  return typeof name === 'string' ? name.replace(/\s+/g, ' ').trim().slice(0, NAME_LIMIT).trim() : '';
}

type Slot = 'name' | 'city' | 'sun' | 'clock';

function fill(template: string, values: Partial<Record<Slot, string>>): string {

  return template.replace(/\{(name|city|sun|clock)\}/g, (_, slot: Slot) => values[slot] ?? '');
}

export function pickReaction(
  kind: ReactionKind,
  input: ReactionInput,
  seed: string,
  copy: ReactionCopy = REACTIONS,
  animalNames: Record<HourAnimal, string> = HOUR_ANIMAL_NAMES,
): string {
  const salt = `${kind}|${seed}`;
  switch (kind) {
    case 'name': {
      const name = cleanName(input.name);
      return name
        ? fill(pickByHash(copy.name.named, salt), { name })
        : pickByHash(copy.name.anonymous, salt);
    }
    case 'focus': {
      const pool = input.focus ? copy.focus[input.focus] : undefined;
      return pickByHash(pool ?? copy.focus.unset, salt);
    }
    case 'date': {
      const key = datePeriod(input.date);
      return pickByHash(key ? copy.date.periods[key] : copy.date.fallback, `${salt}|${key ?? 'none'}`);
    }
    case 'time': {
      const animal = hourAnimal(input.time);
      return pickByHash(animal ? copy.time.hours[animal] : copy.time.unknown, `${salt}|${animal ?? 'unknown'}`);
    }
    case 'place': {
      const city = cityOf(input.place);

      const shift = sunShift(input.time, input.solarHour);
      if (shift) {
        const animals = { sun: animalNames[shift.sun], clock: animalNames[shift.clock] };
        const pool = city ? copy.place.sunShift : copy.place.sunShiftNoName;
        return fill(pickByHash(pool, `${salt}|shift|${shift.clock}|${shift.sun}`), { ...animals, city: city ?? '' });
      }
      if (!city) return pickByHash(copy.place.noName, salt);
      const south = isSouthern(input.place);
      const pool = south ? copy.place.south : copy.place.general;
      return fill(pickByHash(pool, `${salt}|${south ? 'south' : 'north'}`), { city });
    }
    case 'sex':
      return pickByHash(input.sex ? copy.sex.chosen : copy.sex.skip, `${salt}|${input.sex ?? 'skip'}`);
  }
}
