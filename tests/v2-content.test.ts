import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { computeChart } from '../src/lib/saju';
import { solarHourOf } from '../src/lib/reading/solar-hour';
import { SALT } from '../src/content/en/salt';
import { TYPE_PROFILES } from '../src/content/en/types';
import type { Element, GodGroup, TypeKey } from '../src/lib/saju/types';
import type { ChapterInfo, TraitLine, TraitStrength } from '../src/lib/reading/traits-types';
import { TRAITS } from '../src/content/en/traits';
import {
  HOUR_ANIMALS,
  REACTIONS,
  REACTION_KINDS,
  datePeriod,
  hourAnimal,
  isSouthern,
  pickReaction,
  sunShift,
} from '../src/content/en/reactions';
import type { ReactionKind } from '../src/content/en/reactions';
import { UPSELL } from '../src/content/en/upsell';
import { ROOMS_COPY } from '../src/content/en/rooms';

const TYPE_KEYS: TypeKey[] = [
  'pine', 'vine', 'sun', 'candle', 'mountain', 'field', 'blade', 'jewel', 'ocean', 'rain',
];
const STRENGTHS: TraitStrength[] = ['strong', 'balanced', 'gentle'];
const GROUPS: GodGroup[] = ['peer', 'output', 'wealth', 'power', 'resource'];
const ELEMENTS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

const MAX_SENTENCE = 160;

const FORBIDDEN_ANYWHERE = [
  'cosmic', 'energy', 'universe', 'manifest', 'fyp', 'destined', 'soulmate', 'share for luck',
];
const FORBIDDEN_TOPICS = ['death', 'cancer', 'pregnan', 'lottery'];
const FORBIDDEN_TOPIC_WORDS = /\b(?:die|dies|died|dying)\b/i;
const FORBIDDEN_FATE = [
  'guarantee', 'definitely', 'for sure', 'inevitabl', 'fated', 'meant to be',
  'twin flame', 'karma', 'horoscope', 'zodiac', 'curse',
];

const FORBIDDEN_PRESSURE = [
  'too late', 'last chance', 'hurry', 'limited', 'expires', 'running out', 'miss out', 'only today',
  'act now', 'warning', 'danger', 'beware', 'doomed', 'bad luck', 'unlucky', 'before it’s gone',
  'don’t wait', 'regret', 'urgent', 'countdown timer',
];
const GENDERED_PARTNER =
  /\b(?:he|him|his|she|her|hers|boyfriend|girlfriend|husband|wife|guy|girl|boy|man|men|woman|women)\b/i;
const EMOJI = /\p{Extended_Pictographic}/u;
const ENDS_LIKE_SENTENCE = /[.!?][”’]?$/;

const BANNED_PHRASES = [
  'a climber', 'you smell like', 'your own kind', 'quite plainly', 'seat at the table',
  'the bus is not the point', 'equally foggy', 'give the others a kind pause',
  'instead of the whole one', 'stand tall about it',
];

function forbiddenHits(text: string): string[] {
  const lower = text.toLowerCase();
  const hits = [
    ...FORBIDDEN_ANYWHERE.filter((w) => lower.includes(w)),
    ...FORBIDDEN_TOPICS.filter((w) => lower.includes(w)),
    ...FORBIDDEN_FATE.filter((w) => lower.includes(w)),
    ...BANNED_PHRASES.filter((w) => lower.includes(w)),
  ];
  const m = text.match(FORBIDDEN_TOPIC_WORDS);
  if (m) hits.push(m[0]);
  return hits;
}

interface Labeled {
  where: string;
  text: string;
}

function traitLines(): (TraitLine & { where: string; prefix: string })[] {
  const out: (TraitLine & { where: string; prefix: string })[] = [];
  for (const type of TYPE_KEYS) {
    for (const strength of STRENGTHS) {
      TRAITS.core[type][strength].forEach((l, i) =>
        out.push({ ...l, where: `core.${type}.${strength}.${i}`, prefix: `core-${type}-${strength}` }));
    }
  }
  for (const g of GROUPS) {
    TRAITS.pattern[g].forEach((l, i) => out.push({ ...l, where: `pattern.${g}.${i}`, prefix: `pattern-${g}` }));
    TRAITS.love[g].forEach((l, i) => out.push({ ...l, where: `love.${g}.${i}`, prefix: `love-${g}` }));
  }
  TRAITS.tension.forEach((l, i) => out.push({ ...l, where: `tension.${i}`, prefix: 'tension' }));
  for (const e of ELEMENTS) {
    TRAITS.missing[e].forEach((l, i) => out.push({ ...l, where: `missing.${e}.${i}`, prefix: `missing-${e}` }));
  }
  return out;
}

const TRAIT_LINES = traitLines();
const CHAPTER_TEXTS: Labeled[] = GROUPS.flatMap((g) => [
  { where: `chapters.${g}.title`, text: TRAITS.chapters[g].title },
  { where: `chapters.${g}.line`, text: TRAITS.chapters[g].line },
  ...(['same', 'other'] as const).flatMap((k) => [
    { where: `chapters10.${g}.${k}.title`, text: TRAITS.chapters10![g][k].title },
    { where: `chapters10.${g}.${k}.line`, text: TRAITS.chapters10![g][k].line },
  ]),
]);

function reactionTemplates(): Labeled[] {
  const out: Labeled[] = [];
  const add = (where: string, pool: readonly string[]) => pool.forEach((text, i) => out.push({ where: `${where}.${i}`, text }));
  add('name.named', REACTIONS.name.named);
  add('name.anonymous', REACTIONS.name.anonymous);
  for (const f of ['love', 'someone', 'everything', 'unset'] as const) add(`focus.${f}`, REACTIONS.focus[f]);
  for (const [key, pool] of Object.entries(REACTIONS.date.periods)) add(`date.${key}`, pool);
  add('date.fallback', REACTIONS.date.fallback);
  for (const animal of HOUR_ANIMALS) add(`time.${animal}`, REACTIONS.time.hours[animal]);
  add('time.unknown', REACTIONS.time.unknown);
  add('place.general', REACTIONS.place.general);
  add('place.south', REACTIONS.place.south);
  add('place.sunShift', REACTIONS.place.sunShift);
  add('place.sunShiftNoName', REACTIONS.place.sunShiftNoName);
  add('place.noName', REACTIONS.place.noName);
  add('sex.chosen', REACTIONS.sex.chosen);
  add('sex.skip', REACTIONS.sex.skip);
  return out;
}

const REACTION_TEMPLATES = reactionTemplates();

function walk(value: unknown, path: string, out: Labeled[]): void {
  if (typeof value === 'string') out.push({ where: path, text: value });
  else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}.${i}`, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k, out);
  }
}
const UPSELL_TEXTS: Labeled[] = [];
walk(UPSELL, 'upsell', UPSELL_TEXTS);

const UPSELL_SENTENCES: Labeled[] = [
  { where: 'whatISee.intro', text: UPSELL.whatISee.intro },
  { where: 'whatISee.bonusIntro', text: UPSELL.whatISee.bonusIntro },
  ...UPSELL.whatISee.reactions.mostlyYes.map((text, i) => ({ where: `whatISee.mostlyYes.${i}`, text })),
  ...UPSELL.whatISee.reactions.mostlyNo.map((text, i) => ({ where: `whatISee.mostlyNo.${i}`, text })),
  { where: 'chapters.intro', text: UPSELL.chapters.intro },
  { where: 'chapters.lastChapter', text: UPSELL.chapters.lastChapter },
  { where: 'chapters.needSex.line', text: UPSELL.chapters.needSex.line },
  { where: 'chapters.needSex.why', text: UPSELL.chapters.needSex.why },
  ...UPSELL.deeper.yul.map((text, i) => ({ where: `deeper.yul.${i}`, text })),
  { where: 'deeper.notOpen', text: UPSELL.deeper.notOpen },
  { where: 'deeper.noCountdown', text: UPSELL.deeper.noCountdown },
];

const GENDER_WORDS_ALLOWED = new Set(['upsell.chapters.needSex.woman', 'upsell.chapters.needSex.man']);

const SAMPLE_CHAPTER: ChapterInfo = {
  index: 2,
  total: 8,
  startAge: 23,
  endAge: 32,
  startYear: 2024,
  endYear: 2033,
  ganzhi: '辛卯',
  group: 'power',
  title: 'The Chapter of Tests',
  line: 'Life asks more of you here.',
  next: { title: 'The Chapter of Shelter', startAge: 33 },
};

describe('traits: counts (SPEC 9.3)', () => {
  it('has the ten types x three strengths, at least 2 lines each (60+)', () => {
    let total = 0;
    for (const type of TYPE_KEYS) {
      expect(Object.keys(TRAITS.core[type]).sort(), type).toEqual([...STRENGTHS].sort());
      for (const strength of STRENGTHS) {
        const n = TRAITS.core[type][strength].length;
        expect(n, `${type}/${strength}`).toBeGreaterThanOrEqual(2);
        total += n;
      }
    }
    expect(Object.keys(TRAITS.core).sort()).toEqual([...TYPE_KEYS].sort());
    expect(total).toBeGreaterThanOrEqual(60);
  });

  it('has pattern and love for the five god groups, at least 3 lines each', () => {
    expect(Object.keys(TRAITS.pattern).sort()).toEqual([...GROUPS].sort());
    expect(Object.keys(TRAITS.love).sort()).toEqual([...GROUPS].sort());
    for (const g of GROUPS) {
      expect(TRAITS.pattern[g].length, `pattern/${g}`).toBeGreaterThanOrEqual(3);
      expect(TRAITS.love[g].length, `love/${g}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('has at least 5 tension lines and at least 2 missing-element lines per element', () => {
    expect(TRAITS.tension.length).toBeGreaterThanOrEqual(5);
    expect(Object.keys(TRAITS.missing).sort()).toEqual([...ELEMENTS].sort());
    for (const e of ELEMENTS) expect(TRAITS.missing[e].length, `missing/${e}`).toBeGreaterThanOrEqual(2);
  });

  it('has the five chapter titles from SPEC 9.3, each with a one-line description', () => {
    expect(Object.keys(TRAITS.chapters).sort()).toEqual([...GROUPS].sort());
    expect(TRAITS.chapters.peer.title).toBe('The Chapter of Allies');
    expect(TRAITS.chapters.output.title).toBe('The Chapter of Making');
    expect(TRAITS.chapters.wealth.title).toBe('The Chapter of Harvest');
    expect(TRAITS.chapters.power.title).toBe('The Chapter of Tests');
    expect(TRAITS.chapters.resource.title).toBe('The Chapter of Shelter');
    for (const g of GROUPS) {
      expect(TRAITS.chapters[g].line.length, g).toBeGreaterThan(40);
      expect(Object.keys(TRAITS.chapters[g]).sort()).toEqual(['line', 'title']);
    }
  });

  it('has ten chapter titles, split by yin and yang (비견/겁재 ... 편인/정인), all different', () => {
    const c10 = TRAITS.chapters10!;
    expect(Object.keys(c10).sort()).toEqual([...GROUPS].sort());
    const expected: Record<GodGroup, [string, string]> = {
      peer: ['The Chapter of Allies', 'The Chapter of Rivals and Mirrors'],
      output: ['The Chapter of Making', 'The Chapter of Speaking Up'],
      wealth: ['The Chapter of Adventure', 'The Chapter of Harvest'],
      power: ['The Chapter of Tests', 'The Chapter of Promises'],
      resource: ['The Chapter of Strange Teachers', 'The Chapter of Shelter'],
    };
    const titles: string[] = [];
    for (const g of GROUPS) {
      expect(c10[g].same.title, `${g} same`).toBe(expected[g][0]);
      expect(c10[g].other.title, `${g} other`).toBe(expected[g][1]);
      titles.push(c10[g].same.title, c10[g].other.title);
    }
    expect(new Set(titles).size).toBe(10);

    for (const g of GROUPS) {
      expect([c10[g].same, c10[g].other], g).toContainEqual(TRAITS.chapters[g]);
    }
  });

  it('gives every one of the ten chapters a love sentence, in a gender-free voice, so the “Tests” chapter is not only hardship', () => {
    const c10 = TRAITS.chapters10!;
    for (const g of GROUPS) {
      for (const k of ['same', 'other'] as const) {
        const { title, line } = c10[g][k];
        expect(line, title).toMatch(ROMANCE);
        expect(line.length, title).toBeGreaterThan(60);
        expect(line.length, title).toBeLessThanOrEqual(MAX_SENTENCE);
        expect(line, title).toMatch(ENDS_LIKE_SENTENCE);
      }
    }

    expect(c10.power.same.line).toMatch(/people you date/);

    expect(c10.power.other.line).toMatch(/Wanting something real gets easier to say out loud/);
    expect(c10.power.other.line).not.toMatch(/someone who wants something real/);
  });
});

describe('traits: ids and wording rules', () => {
  it('gives every line a unique id in the documented form, numbered from 1 in order', () => {
    const ids = TRAIT_LINES.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    const counters = new Map<string, number>();
    for (const l of TRAIT_LINES) {
      const n = (counters.get(l.prefix) ?? 0) + 1;
      counters.set(l.prefix, n);
      expect(l.id, l.where).toBe(`${l.prefix}-${n}`);
      expect(l.id, l.where).toMatch(/^[a-z]+(?:-[a-z]+)*-\d+$/);
    }
  });

  it('keeps every line at or under 160 characters, and not a stub', () => {
    for (const l of TRAIT_LINES) {
      expect(l.text.length, l.id).toBeLessThanOrEqual(MAX_SENTENCE);
      expect(l.text.length, l.id).toBeGreaterThanOrEqual(40);
    }
    for (const { where, text } of CHAPTER_TEXTS) {
      expect(text.length, where).toBeLessThanOrEqual(MAX_SENTENCE);
    }
  });

  it('has no stray whitespace and ends like a sentence', () => {
    for (const l of TRAIT_LINES) {
      expect(l.text.trim(), l.id).toBe(l.text);
      expect(l.text, l.id).not.toMatch(/\s{2,}/);
      expect(l.text, l.id).toMatch(ENDS_LIKE_SENTENCE);
    }
    for (const g of GROUPS) {
      expect(TRAITS.chapters[g].line, g).toMatch(ENDS_LIKE_SENTENCE);
      expect(TRAITS.chapters[g].title.trim(), g).toBe(TRAITS.chapters[g].title);
    }
  });

  it('has no repeated line anywhere in the library', () => {
    const texts = TRAIT_LINES.map((l) => l.text.toLowerCase());
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('speaks to the reader in the second person', () => {
    for (const l of TRAIT_LINES) expect(l.text, l.id).toMatch(/\byou/i);
  });

  it('has no forbidden vocabulary, topic, fate word or flagged phrase', () => {
    for (const { where, text } of [...TRAIT_LINES.map((l) => ({ where: l.id, text: l.text })), ...CHAPTER_TEXTS]) {
      expect(forbiddenHits(text), where).toEqual([]);
    }
  });

  it('never assumes anyone’s gender', () => {
    for (const { where, text } of [...TRAIT_LINES.map((l) => ({ where: l.id, text: l.text })), ...CHAPTER_TEXTS]) {
      expect(text, where).not.toMatch(GENDERED_PARTNER);
    }
  });

  it('uses typographic quotes and no emoji', () => {
    for (const { where, text } of [...TRAIT_LINES.map((l) => ({ where: l.id, text: l.text })), ...CHAPTER_TEXTS]) {
      expect(text, where).not.toMatch(/['"]/);
      expect(text, where).not.toMatch(EMOJI);
    }
  });

  it('does not frighten: no prophecy words in the tension lines', () => {
    for (const l of TRAITS.tension) {
      expect(l.text.toLowerCase(), l.id).not.toMatch(/break ?up|leave you|will end|fail|doomed|alone forever/);
    }
  });
});

const IMPERATIVE_START =
  /^(?:Say|Ask|Tell|Let|Learn|Check|Pick|Try|Trust|Practice|Receive|Slide|Take|Write|Add)\b/;

function sentencesOf(text: string): string[] {
  return text.split(/(?<=[.!?][”’]?)\s+/).filter(Boolean);
}

const ROMANCE =
  /\b(?:dates?|dating|crush(?:es)?|flirt\w*|love[sd]?|loving|texts?|texted|texter|partner|relationship|situationships?|romance|romantic|seeing|dinner|adored|fall(?:ing)? for|repl(?:y|ies)|in love)\b/i;

const GENERIC_WORDS = [
  'about', 'after', 'again', 'almost', 'always', 'another', 'around', 'because', 'before', 'being', 'between', 'could', 'every', 'first', 'where',
  'which', 'while', 'would', 'their', 'there', 'these', 'those', 'think', 'still', 'thing', 'things', 'someone', 'people', 'person', 'other', 'really',
  'something', 'without', 'rarely', 'usually', 'yourself', 'whole', 'maybe', 'never', 'often', 'quite', 'right', 'since', 'until', 'whoever', 'whose',
  'quietly', 'quiet', 'whether', 'remember', 'feel', 'rather', 'notice', 'start', 'drawn', 'make', 'making', 'look', 'answer', 'arrive', 'clear', 'learn',
  'keep', 'within', 'actually', 'order', 'minute', 'steady', 'follow', 'seriously', 'include', 'later', 'trust', 'taken', 'take', 'wait', 'wrong', 'close',
  'check', 'smoothly', 'slowly', 'across', 'offer', 'decide', 'land', 'seem', 'feeling', 'question', 'nobody', 'anyone', 'everyone', 'everything', 'already',
  'enough', 'though', 'through', 'toward', 'second', 'third', 'little', 'plan', 'small', 'going', 'anything', 'nothing', 'alone', 'partner', 'better',
  'sometimes', 'honest', 'together', 'like', 'liked', 'likes', 'doesn', 'month',
];
function stem(word: string): string {
  let t = word.toLowerCase();
  if (t.length > 5 && t.endsWith('ing')) t = t.slice(0, -3);
  else if (t.length > 4 && t.endsWith('ed')) t = t.slice(0, -2);
  else if (t.length > 4 && t.endsWith('es')) t = t.slice(0, -2);
  else if (t.length > 4 && t.endsWith('s')) t = t.slice(0, -1);
  if (t.endsWith('e')) t = t.slice(0, -1);
  return t;
}
const GENERIC_STEMS = new Set(GENERIC_WORDS.map(stem));

function motifs(text: string): Set<string> {
  const out = new Set<string>();
  for (const w of text.match(/[A-Za-z]+/g) ?? []) {
    if (w.length < 5) continue;
    const t = stem(w);
    if (!GENERIC_STEMS.has(t)) out.add(t);
  }
  return out;
}
function sharedMotifs(a: string, b: string): string[] {
  const mb = motifs(b);
  return [...motifs(a)].filter((w) => mb.has(w));
}

describe('traits: observations, not advice (2026-10-15 review)', () => {
  it('never ends a hit on advice: no sentence starts with an imperative verb', () => {
    for (const l of TRAIT_LINES) {
      const all = sentencesOf(l.text);
      const last = all[all.length - 1];
      expect(last, l.id).not.toMatch(IMPERATIVE_START);

      for (const sentence of all) expect(sentence, l.id).not.toMatch(IMPERATIVE_START);
    }

    expect(sentencesOf('You plan the day. Say it out loud tonight.').pop()).toMatch(IMPERATIVE_START);
    expect(sentencesOf('You plan the day. “Say” it.').pop()).not.toMatch(IMPERATIVE_START);
  });

  it('puts a love scene in every first bubble (core): a date, a text, a crush, someone you are seeing', () => {
    for (const type of TYPE_KEYS) {
      for (const strength of STRENGTHS) {
        for (const l of TRAITS.core[type][strength]) expect(l.text, l.id).toMatch(ROMANCE);
      }
    }
  });

  it('does not end on a wish for the future or a pep talk', () => {
    const rightPerson = TRAIT_LINES.filter((l) => /\bthe right (?:person|people|one)\b/i.test(l.text));
    expect(rightPerson.length).toBeLessThanOrEqual(2);
    for (const l of TRAIT_LINES) {
      expect(l.text, l.id).not.toMatch(/\b(?:allowed|will find you|is coming up the stairs|worth waiting)\b/i);

      expect(l.text, l.id).not.toMatch(/\byou(?:’ve| have) probably\b/i);
    }
  });

  it('keeps “allowed” out of the hits, the type cards and the salt, so one reading never says it twice', () => {
    for (const profile of Object.values(TYPE_PROFILES)) {
      expect(`${profile.identity} ${profile.inLove} ${profile.yulGreets}`, profile.key).not.toMatch(/\ballowed\b/i);
    }
    for (const byGroup of Object.values(SALT)) {
      for (const lines of Object.values(byGroup)) {
        for (const l of lines) expect(`${l.situation} ${l.action}`, l.id).not.toMatch(/\ballowed\b/i);
      }
    }
  });

  it('keeps Yul’s sleeping kitten asleep: Sogeum never hops, paws, circles or twitches in the type cards', () => {
    for (const profile of Object.values(TYPE_PROFILES)) {
      expect(profile.yulGreets, profile.key).not.toMatch(/Sogeum (?:just )?(?:hopped|jumped|is circling|is pawing|twitched|saved)/i);
    }
  });

  it('keeps the “pattern” pool and the “love” pool of one god group on different stories', () => {

    for (const g of GROUPS) {
      for (const p of TRAITS.pattern[g]) {
        for (const l of TRAITS.love[g]) {
          expect(sharedMotifs(p.text, l.text), `${p.id} | ${l.id}`).toEqual([]);
        }
      }
    }
  });
});

describe('reactions: structure (SPEC 9.1)', () => {
  it('has the agreed pools', () => {
    expect(REACTIONS.name.named.length).toBeGreaterThanOrEqual(3);
    expect(REACTIONS.name.anonymous.length).toBeGreaterThanOrEqual(2);
    for (const f of ['love', 'someone', 'everything'] as const) {
      expect(REACTIONS.focus[f].length, f).toBeGreaterThanOrEqual(2);
      expect(REACTIONS.focus[f].length, f).toBeLessThanOrEqual(3);
    }
    expect(REACTIONS.time.unknown.length).toBeGreaterThanOrEqual(2);
    expect(REACTIONS.place.general.length).toBeGreaterThanOrEqual(3);
    expect(REACTIONS.place.south.length).toBeGreaterThanOrEqual(3);
    expect(REACTIONS.sex.chosen.length).toBeGreaterThanOrEqual(2);
    expect(REACTIONS.sex.skip.length).toBeGreaterThanOrEqual(2);
  });

  it('covers every month in three parts (36 date lines) and every hour animal', () => {
    const keys = Object.keys(REACTIONS.date.periods);
    expect(keys).toHaveLength(36);
    for (const key of keys) {
      expect(key).toMatch(/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)-(?:early|mid|late)$/);
      expect(REACTIONS.date.periods[key as keyof typeof REACTIONS.date.periods].length, key).toBeGreaterThanOrEqual(1);
    }
    expect(HOUR_ANIMALS).toHaveLength(12);
    for (const a of HOUR_ANIMALS) expect(REACTIONS.time.hours[a].length, a).toBeGreaterThanOrEqual(1);
  });

  it('keeps the lines SPEC 9.1 spells out', () => {
    expect(REACTIONS.name.named).toContain('{name}. I’ll remember that.');
    expect(REACTIONS.name.anonymous).toContain('A mystery. Sogeum likes those.');

    expect(REACTIONS.date.periods['mar-late']).toContain(
      'Late March. Spring has only just reached my mountain. You begin things before you feel ready, don’t you?',
    );

    for (const text of REACTIONS.date.periods['nov-early']) expect(text).not.toMatch(/this week|right now|today/i);
    expect(REACTIONS.time.unknown).toContain('Honest. I’ll read three pillars instead of four.');
    expect(REACTIONS.sex.skip).toContain('Then I’ll leave the ten-year chapters closed for now.');
  });

  it('marks {name} and {city} only where they belong', () => {
    for (const { where, text } of REACTION_TEMPLATES) {
      const hasName = text.includes('{name}');
      const hasCity = text.includes('{city}');
      const shifted = where.startsWith('place.sunShift');
      expect(hasName, where).toBe(where.startsWith('name.named'));
      expect(hasCity, where).toBe(
        where.startsWith('place.general') || where.startsWith('place.south') || where.startsWith('place.sunShift.'),
      );

      expect(text.includes('{sun}'), where).toBe(shifted);
      expect(text.includes('{clock}'), where).toBe(shifted);
      expect(text.replace(/\{name\}|\{city\}|\{sun\}|\{clock\}/g, ''), where).not.toMatch(/[{}]/);
    }
  });

  it('has 36 distinct date lines and distinct hour lines', () => {
    const dateTexts = Object.values(REACTIONS.date.periods).flat();
    expect(new Set(dateTexts).size).toBe(dateTexts.length);
    const all = REACTION_TEMPLATES.map((t) => t.text.toLowerCase());
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('reactions: wording rules', () => {
  it('keeps every line at or under 160 characters, ending like a sentence, with no stray whitespace', () => {
    for (const { where, text } of REACTION_TEMPLATES) {
      expect(text.length, where).toBeLessThanOrEqual(MAX_SENTENCE);
      expect(text.length, where).toBeGreaterThanOrEqual(20);
      expect(text.trim(), where).toBe(text);
      expect(text, where).not.toMatch(/\s{2,}/);
      expect(text, where).toMatch(ENDS_LIKE_SENTENCE);
    }
  });

  it('has no forbidden vocabulary, topic, fate word or flagged phrase', () => {
    for (const { where, text } of REACTION_TEMPLATES) expect(forbiddenHits(text), where).toEqual([]);
  });

  it('never assumes anyone’s gender (Sogeum is named, not pronounced)', () => {
    for (const { where, text } of REACTION_TEMPLATES) expect(text, where).not.toMatch(GENDERED_PARTNER);
  });

  it('uses typographic quotes (except the {name}/{city} slots) and no emoji', () => {
    for (const { where, text } of REACTION_TEMPLATES) {
      expect(text, where).not.toMatch(/['"]/);
      expect(text, where).not.toMatch(EMOJI);
    }
  });

  it('names no zodiac, never says the calculation changes for the south, and never reads a mind', () => {
    for (const { where, text } of REACTION_TEMPLATES) {
      const lower = text.toLowerCase();
      expect(lower, where).not.toContain('zodiac');
      expect(lower, where).not.toMatch(/\b(?:recalculat|different (?:chart|calculation)|change the calculation|flip your chart)/);
    }
    for (const text of REACTIONS.focus.someone) {
      expect(text.toLowerCase(), text).toMatch(/won’t read|can’t see|not them|your half/);
    }
  });
});

describe('pickReaction rules', () => {
  it('maps a date to its month and third', () => {
    expect(datePeriod('2026-01-01')).toBe('jan-early');
    expect(datePeriod('2026-03-10')).toBe('mar-early');
    expect(datePeriod('2026-03-11')).toBe('mar-mid');
    expect(datePeriod('2026-03-20')).toBe('mar-mid');
    expect(datePeriod('2026-03-21')).toBe('mar-late');
    expect(datePeriod('2026-03-25')).toBe('mar-late');
    expect(datePeriod('1999-12-31')).toBe('dec-late');
    for (const bad of [null, undefined, '', 'abc', '2026-13-01', '2026-00-10', '2026-05-00', '2026-5-3']) {
      expect(datePeriod(bad), String(bad)).toBeNull();
    }
  });

  it('picks the line of the right month for every day of a leap year', () => {
    const start = Date.UTC(2024, 0, 1);
    for (let i = 0; i < 366; i += 1) {
      const date = new Date(start + i * 86400000).toISOString().slice(0, 10);
      const key = datePeriod(date)!;
      const line = pickReaction('date', { date }, 'seed');
      expect(REACTIONS.date.periods[key], date).toContain(line);
    }
    expect(pickReaction('date', { date: '2026-03-25' }, 'x')).toBe(
      'Late March. Spring has only just reached my mountain. You begin things before you feel ready, don’t you?',
    );
  });

  it('falls back politely for a missing or broken date', () => {
    for (const date of [null, undefined, 'soon', '2026-99-99']) {
      expect(REACTIONS.date.fallback).toContain(pickReaction('date', { date }, 's'));
    }
  });

  it('maps a clock time to one of the twelve double-hours (23-1 Rat, 1-3 Ox, ...)', () => {
    const cases: [string, string][] = [
      ['23:00', 'rat'], ['23:59', 'rat'], ['00:00', 'rat'], ['00:59', 'rat'],
      ['01:00', 'ox'], ['02:59', 'ox'], ['03:00', 'tiger'], ['04:59', 'tiger'],
      ['05:00', 'rabbit'], ['07:00', 'dragon'], ['09:00', 'snake'], ['10:59', 'snake'],
      ['11:00', 'horse'], ['12:59', 'horse'], ['13:00', 'goat'], ['15:00', 'monkey'],
      ['17:00', 'rooster'], ['19:00', 'dog'], ['21:00', 'pig'], ['22:59', 'pig'],
    ];
    for (const [time, animal] of cases) expect(hourAnimal(time), time).toBe(animal);
    for (const bad of [null, undefined, '', '24:00', '12:60', 'noon', '12']) {
      expect(hourAnimal(bad), String(bad)).toBeNull();
    }
  });

  it('gives every hour of the day a line that names its animal, two hours per animal', () => {
    const counts = new Map<string, number>();
    for (let h = 0; h < 24; h += 1) {
      const time = `${String(h).padStart(2, '0')}:30`;
      const animal = hourAnimal(time)!;
      counts.set(animal, (counts.get(animal) ?? 0) + 1);
      const line = pickReaction('time', { time }, 'seed');
      expect(line.toLowerCase(), time).toContain(animal);

      expect(line, time).toMatch(/^(?:Around the )?[A-Z][a-z]+ hour,? by your clock[,.]/);
      expect(line, time).toMatch(/(?:by|against) the sun once I know where you were born\.$/);
    }
    for (const a of HOUR_ANIMALS) expect(counts.get(a), a).toBe(2);
  });

  it('says the honest line when the birth time is unknown', () => {
    for (const time of [null, undefined, 'nope']) {
      expect(REACTIONS.time.unknown).toContain(pickReaction('time', { time }, 's'));
    }
    expect(pickReaction('time', { time: null }, 'a')).toMatch(/three pillars/);
  });

  it('puts the city in the line and uses the south pool for latitude below zero', () => {
    const seoul = { name: 'Seoul', lat: 37.57 };
    const sydney = { name: 'Sydney', lat: -33.87 };
    const equator = { name: 'Quito', lat: 0 };
    for (let i = 0; i < 40; i += 1) {
      const north = pickReaction('place', { place: seoul }, `s${i}`);
      expect(north).toContain('Seoul');
      expect(REACTIONS.place.general.map((t) => t.replace('{city}', 'Seoul'))).toContain(north);
      const south = pickReaction('place', { place: sydney }, `s${i}`);
      expect(south).toContain('Sydney');
      expect(REACTIONS.place.south.map((t) => t.replace('{city}', 'Sydney'))).toContain(south);
      expect(REACTIONS.place.general.map((t) => t.replace('{city}', 'Quito'))).toContain(
        pickReaction('place', { place: equator }, `s${i}`),
      );
    }
    expect(isSouthern(sydney)).toBe(true);
    expect(isSouthern(seoul)).toBe(false);
    expect(isSouthern(equator)).toBe(false);
    expect(isSouthern(null)).toBe(false);
    expect(isSouthern({ lat: Number.NaN })).toBe(false);
  });

  it('uses only the city part of a "City, CC" label and survives odd names', () => {
    expect(pickReaction('place', { place: { name: 'Los Angeles, US', lat: 34 } }, 'k')).not.toContain(', US');
    expect(pickReaction('place', { place: { name: 'Los Angeles, US', lat: 34 } }, 'k')).toContain('Los Angeles');
    const tricky = pickReaction('place', { place: { name: 'A$&B', lat: 10 } }, 'k');
    expect(tricky).toContain('A$&B');
    expect(REACTIONS.place.noName).toContain(pickReaction('place', { place: null }, 'k'));
    expect(REACTIONS.place.noName).toContain(pickReaction('place', { place: { name: '  ,', lat: 1 } }, 'k'));
    expect(REACTIONS.place.noName).toContain(pickReaction('place', {}, 'k'));
  });

  it('calls the person by name, trims it, and falls back to "A mystery."', () => {
    const line = pickReaction('name', { name: '  Mia   Rose ' }, 'k');
    expect(line).toContain('Mia Rose');
    expect(line).not.toContain('{name}');
    expect(pickReaction('name', { name: '$&' }, 'k')).toContain('$&');
    expect(pickReaction('name', { name: '{city}' }, 'k')).toContain('{city}');
    const long = pickReaction('name', { name: 'x'.repeat(60) }, 'k');
    expect(long).toContain('x'.repeat(24));
    expect(long).not.toContain('x'.repeat(25));
    for (const name of ['', '   ', null, undefined]) {
      expect(REACTIONS.name.anonymous).toContain(pickReaction('name', { name }, 'k'));
    }
  });

  it('answers each focus from its own pool', () => {
    for (const f of ['love', 'someone', 'everything'] as const) {
      expect(REACTIONS.focus[f]).toContain(pickReaction('focus', { focus: f }, 'k'));
    }
    expect(REACTIONS.focus.unset).toContain(pickReaction('focus', { focus: null }, 'k'));
  });

  it('confirms a chosen sex briefly and leaves the chapters closed on skip', () => {
    for (const sex of ['female', 'male'] as const) {
      expect(REACTIONS.sex.chosen).toContain(pickReaction('sex', { sex }, 'k'));
    }
    for (const sex of [null, undefined]) {
      expect(REACTIONS.sex.skip).toContain(pickReaction('sex', { sex }, 'k'));
    }

    for (const text of REACTIONS.sex.skip) expect(text).toMatch(/ten-year chapters/);
  });

  it('is deterministic: the same (kind, input, seed) always gives the same line', () => {
    const input = {
      name: 'Mia',
      focus: 'love' as const,
      date: '1994-07-19',
      time: '14:20',
      place: { name: 'Busan, KR', lat: 35.1 },
      sex: 'female' as const,
    };
    for (const kind of REACTION_KINDS) {
      const first = pickReaction(kind, input, 'abc|1994-07-19');
      for (let i = 0; i < 25; i += 1) expect(pickReaction(kind, { ...input }, 'abc|1994-07-19'), kind).toBe(first);
    }
  });

  it('varies with the seed where a pool has more than one line', () => {
    const cases: [ReactionKind, Parameters<typeof pickReaction>[1]][] = [
      ['name', { name: 'Mia' }],
      ['focus', { focus: 'love' }],
      ['focus', { focus: 'someone' }],
      ['place', { place: { name: 'Seoul', lat: 37 } }],
      ['place', { place: { name: 'Sydney', lat: -33 } }],
      ['sex', { sex: 'male' }],
      ['time', { time: null }],
    ];
    for (const [kind, input] of cases) {
      const seen = new Set<string>();
      for (let i = 0; i < 300; i += 1) seen.add(pickReaction(kind, input, `seed-${i}`));
      expect(seen.size, `${kind} ${JSON.stringify(input)}`).toBeGreaterThan(1);
    }
  });

  it('never throws, whatever the input', () => {
    for (const kind of REACTION_KINDS) {
      for (const seed of ['', 'x', '한글', 'a'.repeat(500)]) {
        expect(typeof pickReaction(kind, {}, seed), kind).toBe('string');
        expect(pickReaction(kind, {}, seed).length, kind).toBeGreaterThan(0);
      }
    }
  });

  it('keeps filled-in lines within 160 characters and free of forbidden words', () => {
    const name = 'N'.repeat(24);
    const city = 'Llanfairpwllgwyngyll-on-Sea';
    for (let i = 0; i < 60; i += 1) {
      const outputs = [
        pickReaction('name', { name }, `s${i}`),
        pickReaction('place', { place: { name: city, lat: 51 } }, `s${i}`),
        pickReaction('place', { place: { name: city, lat: -41 } }, `s${i}`),
      ];
      for (const text of outputs) {
        expect(text.length, text).toBeLessThanOrEqual(MAX_SENTENCE);
        expect(forbiddenHits(text), text).toEqual([]);
      }
    }
  });

  it('is pure: the module reads no clock, random source or storage', () => {
    const path = fileURLToPath(new URL('../src/content/en/reactions.ts', import.meta.url));
    const code = readFileSync(path, 'utf8')
      .split('\n')
      .filter((line) => !/^\s*\/\//.test(line))
      .join('\n');
    for (const banned of ['Math.random', 'Date.now', 'new Date', 'localStorage', 'sessionStorage', 'window.', 'document.']) {
      expect(code, banned).not.toContain(banned);
    }
  });
});

describe('reactions: the hour animal is set by the birthplace sun (2026-10-15 review)', () => {
  const LA = { name: 'Los Angeles', country: 'US', lat: 34.05, lng: -118.24, tz: 'America/Los_Angeles' };
  const TORONTO = { name: 'Toronto', country: 'CA', lat: 43.65, lng: -79.38, tz: 'America/Toronto' };
  const CHICAGO = { name: 'Chicago', country: 'US', lat: 41.88, lng: -87.63, tz: 'America/Chicago' };
  const SEOUL_PLACE = { name: 'Seoul', country: 'KR', lat: 37.57, lng: 126.98, tz: 'Asia/Seoul' };
  const SYDNEY = { name: 'Sydney', country: 'AU', lat: -33.87, lng: 151.21, tz: 'Australia/Sydney' };
  const MUMBAI = { name: 'Mumbai', country: 'IN', lat: 19.08, lng: 72.88, tz: 'Asia/Kolkata' };
  const LONDON = { name: 'London', country: 'GB', lat: 51.51, lng: -0.13, tz: 'Europe/London' };
  const PLACES = [LA, TORONTO, CHICAGO, SEOUL_PLACE, SYDNEY, MUMBAI, LONDON];
  const NAMES = { rat: 'Rat', ox: 'Ox', tiger: 'Tiger', rabbit: 'Rabbit', dragon: 'Dragon', snake: 'Snake', horse: 'Horse', goat: 'Goat', monkey: 'Monkey', rooster: 'Rooster', dog: 'Dog', pig: 'Pig' } as const;
  const BRANCH_ORDER = '子丑寅卯辰巳午未申酉戌亥';

  const chartAnimal = (chart: ReturnType<typeof computeChart>) => HOUR_ANIMALS[BRANCH_ORDER.indexOf(chart.pillars.hour!.branch)];
  const claimedClock = (line: string) => /^(?:Around the )?([A-Z][a-z]+) hour,? by your clock/.exec(line)?.[1];

  it('sunShift compares the clock animal with the sun animal and takes “HH:mm” or a full local timestamp', () => {
    expect(sunShift('23:40', '22:47')).toEqual({ clock: 'rat', sun: 'pig' });
    expect(sunShift('23:40', '1995-07-15 22:47')).toEqual({ clock: 'rat', sun: 'pig' });
    expect(sunShift('10:00', '10:21')).toBeNull();
    expect(sunShift('10:59', '11:01')).toEqual({ clock: 'snake', sun: 'horse' });
    for (const bad of [null, undefined, '', 'noon']) {
      expect(sunShift('10:00', bad), String(bad)).toBeNull();
      expect(sunShift(bad, '10:00'), String(bad)).toBeNull();
    }
  });

  it('the time reaction never claims the animal for sure, and the place reaction fixes it when the sun disagrees', () => {
    const input = { time: '23:40', date: '1990-07-15', place: { name: 'Los Angeles, US', lat: 34.05 } };
    const time = pickReaction('time', input, 's');
    expect(time).toMatch(/^Around the Rat hour by your clock/);
    expect(time).toMatch(/I’ll (?:set|check) it (?:by|against) the sun/);
    const shifted = pickReaction('place', { ...input, solarHour: '22:47' }, 's');
    expect(shifted).toContain('Los Angeles');
    expect(shifted).not.toContain(', US');
    expect(shifted).toContain('Pig hour');
    expect(shifted).toContain('Rat');
    expect(REACTIONS.place.sunShift.map((t) => t.replace(/\{city\}/g, 'Los Angeles').replace('{sun}', 'Pig').replace('{clock}', 'Rat'))).toContain(shifted);

    const same = pickReaction('place', { ...input, time: '10:00', solarHour: '09:20' }, 's');
    expect(same).not.toMatch(/\bhour\b/);
    expect(same).toContain('Los Angeles');

    expect(pickReaction('place', input, 's')).not.toMatch(/\bhour\b/);
    expect(pickReaction('place', { ...input, time: null, solarHour: '22:47' }, 's')).not.toMatch(/\bhour\b/);
  });

  it('still corrects the animal when the city name is empty', () => {
    const line = pickReaction('place', { time: '23:40', solarHour: '22:47', place: null }, 's');
    expect(REACTIONS.place.sunShiftNoName.map((t) => t.replace('{sun}', 'Pig').replace('{clock}', 'Rat'))).toContain(line);
  });

  it('is deterministic and only reads its inputs', () => {
    const input = { time: '19:30', date: '1992-06-01', place: { name: 'Toronto, CA', lat: 43.65 }, solarHour: '18:13' };
    const first = pickReaction('place', input, 'seed-1');
    for (let i = 0; i < 20; i += 1) expect(pickReaction('place', { ...input }, 'seed-1')).toBe(first);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i += 1) seen.add(pickReaction('place', input, `seed-${i}`));
    expect(seen.size).toBe(REACTIONS.place.sunShift.length);
  });

  it('the review’s own cases: 23:40 Los Angeles summer, 19:30 Toronto, 11:11 Chicago all land on the chart’s hour branch', () => {
    const cases: [string, string, (typeof PLACES)[number], string, string][] = [

      ['1990-07-15', '23:40', LA, 'Rat', 'Pig'],
      ['1992-06-01', '19:30', TORONTO, 'Dog', 'Rooster'],
      ['1988-08-08', '11:11', CHICAGO, 'Horse', 'Snake'],
    ];
    for (const [date, time, place, clock, sun] of cases) {
      const chart = computeChart({ date, time, place, sex: null });
      expect(NAMES[chartAnimal(chart)], `${date} ${time} ${place.name}`).toBe(sun);
      const solarHour = solarHourOf({ date, time, place });
      expect(solarHour).toBe(chart.meta.solarLocal.slice(-5));
      expect(claimedClock(pickReaction('time', { time }, 's'))).toBe(clock);
      const line = pickReaction('place', { time, place, solarHour }, 's');
      expect(line, `${date} ${time} ${place.name}`).toContain(`${sun} hour`);
      expect(line).toContain(clock);
    }
  });

  it('for every (date, time, place) in a wide sample, what Yul last says about the hour is the chart’s hour animal', () => {
    let shifted = 0;
    let same = 0;
    let n = 0;
    for (const place of PLACES) {
      for (let day = 0; day < 36; day += 1) {

        const date = new Date(Date.UTC(1991, 0, 1) + day * 10 * 86_400_000).toISOString().slice(0, 10);
        for (let k = 0; k < 8; k += 1) {
          const minutes = (k * 181 + day * 53 + place.lng * 3) % 1440;
          const m = Math.abs(Math.round(minutes));
          const time = `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
          const chart = computeChart({ date, time, place, sex: null });
          const animal = NAMES[chartAnimal(chart)];
          const solarHour = solarHourOf({ date, time, place });
          expect(solarHour, `${date} ${time} ${place.name}`).toBe(chart.meta.solarLocal.slice(-5));
          const clock = claimedClock(pickReaction('time', { time }, 's'));
          const line = pickReaction('place', { time, place, solarHour }, 's');
          if (clock === animal) {

            expect(line, `${date} ${time} ${place.name}`).not.toMatch(/\bhour\b/);
            same += 1;
          } else {
            expect(line, `${date} ${time} ${place.name}`).toContain(`${animal} hour`);
            expect(line).toContain(clock!);
            shifted += 1;
          }
          n += 1;
        }
      }
    }
    expect(n).toBe(PLACES.length * 36 * 8);

    expect(shifted / n).toBeGreaterThan(0.15);
    expect(same / n).toBeGreaterThan(0.4);
  });

  it('solarHourOf returns the birthplace solar clock, and null when it cannot say', () => {
    expect(solarHourOf({ date: '1990-07-15', time: '23:40', place: LA })).toBe('22:47');
    expect(solarHourOf({ date: '1990-07-15', time: null, place: LA })).toBeNull();
    expect(solarHourOf({ date: null, time: '10:00', place: LA })).toBeNull();
    expect(solarHourOf({ date: '1990-07-15', time: '10:00', place: null })).toBeNull();
    expect(solarHourOf({ date: '1990-02-30', time: '10:00', place: LA })).toBeNull();
    expect(solarHourOf({ date: '1990-07-15', time: '10:00', place: { ...LA, tz: 'Not/AZone' } })).toBeNull();

    expect(solarHourOf({ date: '1990-07-15', time: '23:40', place: LA }, { solarTime: 'standard' })).toBe('23:40');
  });
});

describe('upsell copy (SPEC 9.2, 9.4)', () => {
  it('opens with “What I see” and the two answer buttons', () => {
    expect(UPSELL.whatISee.heading).toBe('What I see');
    expect(UPSELL.whatISee.thatsMe).toBe('That’s me');
    expect(UPSELL.whatISee.notQuite).toBe('Not quite');
    expect(UPSELL.whatISee.bonusHeading).toBe('What you look for in someone');
    expect(UPSELL.whatISee.yesNeeded).toBe(2);
  });

  it('introduces the three hits plainly (2026-10-29: no guessing game, no answer chips)', () => {
    expect(UPSELL.whatISee.intro).toBe('Here are three things that caught my eye right away.');
  });

  it('reacts after the three answers with good news coming or a respectful acknowledgment', () => {

    expect(UPSELL.whatISee.reactions.mostlyYes).toContain('I know. Hold that face; the good news is coming.');
    for (const t of UPSELL.whatISee.reactions.mostlyYes) {
      expect(t, t).not.toMatch(/eat your candy/i);
      expect(t, t).toMatch(/^(?:I know\.|Told you\.|Mm-hm\.)/);
    }
    expect(UPSELL.whatISee.reactions.mostlyNo).toContain(
      'Fair enough. That line missed you, and you know yourself better than a chart does.',
    );
    expect(UPSELL.whatISee.reactions.mostlyYes.length).toBeGreaterThanOrEqual(2);
    expect(UPSELL.whatISee.reactions.mostlyNo.length).toBeGreaterThanOrEqual(2);
  });

  it('has a label for every hit kind', () => {
    for (const kind of ['core', 'pattern', 'love', 'tension', 'missing'] as const) {
      expect(UPSELL.whatISee.labels[kind].trim().length, kind).toBeGreaterThan(0);
    }
  });

  it('keeps Yul’s pitch to what SPEC 9.2 names: the life, ten-year chapters, the doors, the months to say yes, digging through all of it', () => {
    const pitch = UPSELL.deeper.yul.join(' ');
    expect(pitch).toContain('first page');
    expect(pitch).toContain('explore your chart');
    expect(pitch).toContain('ten-year chapter');
    expect(pitch).toMatch(/years a door opens/);
    expect(pitch).toMatch(/months to say yes to love and to work/);
    expect(pitch).toContain('dig through all of it');
  });

  it('says honestly that it is not open yet, and that nothing is a timer', () => {
    expect(UPSELL.deeper.yul.join(' ')).toMatch(/isn’t open yet/);
    expect(UPSELL.deeper.notOpen).toMatch(/^Not open yet\./);
    expect(UPSELL.deeper.notOpen).toContain('launch price');
    expect(UPSELL.deeper.noCountdown.toLowerCase()).toContain('no timers');
  });

  it('sells five rooms at $6.29 each: the life map, love timing and 2027 are rooms of their own', () => {
    expect(ROOMS_COPY.price).toBe('$6.29');
    const titles = Object.values(ROOMS_COPY.rooms).map((r) => r.title.toLowerCase()).join(' | ');
    expect(titles).toContain('life map');
    expect(titles).toContain('2027');
    expect(titles).toContain('muk’s compatibility');
    expect(ROOMS_COPY.rooms.love.line.toLowerCase()).toMatch(/love.*years/);
  });

  it('puts no pressure on the reader: no timers, scarcity, fear or regret', () => {
    const all = [...UPSELL_TEXTS.map((t) => t.text), ...Object.values(ROOMS_COPY.rooms).flatMap((r) => r.contents.map((x) => x.line))];
    for (const text of all) {
      const lower = text.toLowerCase();
      expect(FORBIDDEN_PRESSURE.filter((w) => lower.includes(w)), text).toEqual([]);
    }
  });

  it('keeps every sentence at or under 160 characters, ending like a sentence', () => {
    for (const { where, text } of UPSELL_SENTENCES) {
      expect(text.length, where).toBeLessThanOrEqual(MAX_SENTENCE);
      expect(text.trim(), where).toBe(text);
      expect(text, where).not.toMatch(/\s{2,}/);
      expect(text, where).toMatch(ENDS_LIKE_SENTENCE);
    }
    for (const { where, text } of UPSELL_TEXTS) {
      expect(text.length, where).toBeLessThanOrEqual(MAX_SENTENCE);
      expect(text.trim(), where).toBe(text);
    }
  });

  it('has no forbidden vocabulary, topic, fate word, flagged phrase or emoji', () => {
    for (const { where, text } of UPSELL_TEXTS) {
      expect(forbiddenHits(text), where).toEqual([]);
      expect(text, where).not.toMatch(EMOJI);
      expect(text, where).not.toMatch(/['"]/);
    }
  });

  it('never assumes the reader’s or anyone’s gender, except on the Woman / Man buttons that set the chapter direction', () => {
    for (const { where, text } of UPSELL_TEXTS) {
      if (GENDER_WORDS_ALLOWED.has(where)) continue;
      expect(text, where).not.toMatch(GENDERED_PARTNER);
    }
    expect(UPSELL.chapters.needSex.woman).toBe('Woman');
    expect(UPSELL.chapters.needSex.man).toBe('Man');
  });

  it('asks for the one missing thing the way SPEC 9.2 does', () => {
    expect(UPSELL.chapters.needSex.line).toBe('I need one more thing to open your life map.');
  });
});

describe('upsell chapter preview', () => {
  it('shows the current chapter as “You’re in chapter {n}: {title} (age a to b, y to z)” with n = index + 1', () => {
    expect(UPSELL.chapters.headline(SAMPLE_CHAPTER)).toBe(
      'You’re in chapter 3: The Chapter of Tests (age 23 to 32, 2024 to 2033)',
    );
    expect(UPSELL.chapters.headline({ ...SAMPLE_CHAPTER, index: 0, startAge: 8, endAge: 17, startYear: 2009, endYear: 2018 })).toContain(
      'chapter 1:',
    );
  });

  it('speaks differently before the first chapter has begun', () => {
    const text = UPSELL.chapters.headline({ ...SAMPLE_CHAPTER, index: 0, startAge: 9, beforeStart: true });
    expect(text).toContain('hasn’t opened yet');
    expect(text).toContain('age 9');
    expect(text).not.toContain('You’re in chapter');
  });

  it('gives the next chapter as a title only, and nothing after the last chapter', () => {
    expect(UPSELL.chapters.next(SAMPLE_CHAPTER)).toBe('The Chapter of Shelter, from age 33.');
    expect(UPSELL.chapters.next({ ...SAMPLE_CHAPTER, index: 7, next: null })).toBeNull();
  });

  it('says "again" when the next chapter has the same title as the current one', () => {

    const same = { ...SAMPLE_CHAPTER, next: { title: SAMPLE_CHAPTER.title, startAge: 33 } };
    expect(UPSELL.chapters.next(same)).toBe(`${SAMPLE_CHAPTER.title} again, from age 33.`);
  });

  it('counts the chapters that stay closed, without the current and next ones', () => {
    expect(UPSELL.chapters.restClosed(SAMPLE_CHAPTER)).toBe('4 more chapters stay closed for now.');
    expect(UPSELL.chapters.restClosed({ ...SAMPLE_CHAPTER, index: 5 })).toBe('One more chapter stays closed for now.');
    expect(UPSELL.chapters.restClosed({ ...SAMPLE_CHAPTER, index: 6 })).toBeNull();
    expect(UPSELL.chapters.restClosed({ ...SAMPLE_CHAPTER, index: 7, next: null })).toBeNull();
  });

  it('keeps the rendered lines clean', () => {
    const outputs = [
      UPSELL.chapters.headline(SAMPLE_CHAPTER),
      UPSELL.chapters.next(SAMPLE_CHAPTER) ?? '',
      UPSELL.chapters.restClosed(SAMPLE_CHAPTER) ?? '',
    ];
    for (const g of GROUPS) {
      outputs.push(UPSELL.chapters.headline({ ...SAMPLE_CHAPTER, title: TRAITS.chapters[g].title }));
    }
    for (const text of outputs) {
      expect(text.length, text).toBeLessThanOrEqual(MAX_SENTENCE);
      expect(forbiddenHits(text), text).toEqual([]);
      expect(text, text).not.toMatch(/['"]/);
    }
  });
});

describe('with the engine (buildTraits, currentChapter)', () => {

  const NOW = '2026-10-15T00:00:00Z';
  const SEOUL = { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' };
  const KNOWN_IDS = new Set(TRAIT_LINES.map((l) => l.id));

  it('builds three library hits and a bonus for many charts, and the same chart gives the same hits', async () => {
    const { buildTraits } = await import('../src/lib/reading/traits');
    const seen = { core: new Set<string>(), pattern: new Set<GodGroup>(), love: new Set<string>(), tension: 0, bonus: 0 };
    for (let i = 0; i < 400; i += 1) {
      const date = new Date(Date.UTC(1975, 0, 1) + i * 29 * 86400000 + (i % 7) * 86400000).toISOString().slice(0, 10);
      const time = i % 5 === 0 ? null : `${String((i * 7) % 24).padStart(2, '0')}:${i % 2 ? '10' : '40'}`;
      const chart = computeChart({ date, time, place: SEOUL, sex: i % 3 === 0 ? 'female' : i % 3 === 1 ? 'male' : null });
      const a = buildTraits(chart, TRAITS);
      expect(buildTraits(chart, TRAITS), date).toEqual(a);
      expect(a.hits).toHaveLength(3);
      expect(a.hits.map((h) => h.kind)).toEqual(['core', 'pattern', a.features.tension ? 'tension' : 'love']);
      for (const hit of a.hits) {
        expect(KNOWN_IDS.has(hit.id), `${date} ${hit.id}`).toBe(true);
        expect(hit.text.length).toBeLessThanOrEqual(MAX_SENTENCE);
      }
      if (a.features.missing) {
        expect(a.bonus?.kind, date).toBe('missing');
        expect(KNOWN_IDS.has(a.bonus!.id)).toBe(true);
        seen.bonus += 1;
      } else {
        expect(a.bonus).toBeNull();
      }
      seen.core.add(a.hits[0].id);
      seen.pattern.add(a.features.dominant);
      if (a.features.tension) seen.tension += 1;
    }
    expect(seen.core.size).toBeGreaterThan(20);
    expect(seen.pattern.size).toBe(5);
    expect(seen.tension).toBeGreaterThan(0);
    expect(seen.bonus).toBeGreaterThan(0);
  });

  it('real readings rarely echo themselves: the hits and the bonus almost never share a distinctive word', async () => {
    const { buildTraits } = await import('../src/lib/reading/traits');
    let readings = 0;
    let echoed = 0;
    let sameGroup = 0;
    const examples: string[] = [];
    let i = 0;
    for (let ms = Date.UTC(1960, 0, 1); ms < Date.UTC(2008, 0, 1); ms += 5 * 86_400_000 + 3_600_000) {
      const date = new Date(ms).toISOString().slice(0, 10);
      for (const time of [null, `${String((i * 7) % 24).padStart(2, '0')}:${i % 2 ? '10' : '40'}`]) {
        const chart = computeChart({ date, time, place: SEOUL, sex: null });
        const t = buildTraits(chart, TRAITS);
        const texts = [...t.hits, ...(t.bonus ? [t.bonus] : [])];
        let hit = false;
        for (let a = 0; a < texts.length; a += 1) {
          for (let b = a + 1; b < texts.length; b += 1) {
            const shared = sharedMotifs(texts[a].text, texts[b].text);
            if (shared.length) {
              hit = true;
              if (examples.length < 5) examples.push(`${texts[a].id} | ${texts[b].id}: ${shared.join(', ')}`);
            }
          }
        }
        const poolOf = (id: string) => /^(?:pattern|love)-([a-z]+)-/.exec(id)?.[1];
        if (t.hits[2].kind === 'love' && poolOf(t.hits[1].id) === poolOf(t.hits[2].id)) sameGroup += 1;
        readings += 1;
        if (hit) echoed += 1;
        i += 1;
      }
    }
    expect(readings).toBeGreaterThan(6000);

    expect(echoed / readings, examples.join('\n')).toBeLessThan(0.04);
    expect(sameGroup / readings).toBeLessThan(0.05);
  });

  it('turns a daYun into a chapter whose title comes from the library, and renders the preview line', async () => {
    const { currentChapter } = await import('../src/lib/reading/traits');
    const chart = computeChart({ date: '1996-04-12', time: '09:30', place: SEOUL, sex: 'female' });
    const chapter = currentChapter(chart, NOW, TRAITS)!;
    expect(chapter).not.toBeNull();

    const titles = GROUPS.flatMap((g) => [TRAITS.chapters10![g].same.title, TRAITS.chapters10![g].other.title]);
    expect(titles).toContain(chapter.title);
    expect(typeof chapter.samePolarity).toBe('boolean');
    expect(TRAITS.chapters10![chapter.group][chapter.samePolarity ? 'same' : 'other']).toEqual({
      title: chapter.title,
      line: chapter.line,
    });
    const headline = UPSELL.chapters.headline(chapter);
    expect(headline).toContain(chapter.title);
    expect(headline).toContain(`chapter ${chapter.index + 1}:`);
    expect(headline).toContain(`${chapter.startYear} to ${chapter.endYear}`);
    if (chapter.next) expect(titles).toContain(chapter.next.title);

    const noSex = computeChart({ date: '1996-04-12', time: '09:30', place: SEOUL, sex: null });
    expect(currentChapter(noSex, NOW, TRAITS)).toBeNull();
  });
});
