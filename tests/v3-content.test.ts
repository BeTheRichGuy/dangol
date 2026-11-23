import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CANDY } from '../src/content/en/candy';
import { SALT } from '../src/content/en/salt';
import { TYPE_PROFILES } from '../src/content/en/types';
import { TRAITS } from '../src/content/en/traits';
import { REACTIONS } from '../src/content/en/reactions';
import { UPSELL } from '../src/content/en/upsell';
import { ROOMS_COPY } from '../src/content/en/rooms';
import { RESULT_UI } from '../src/content/en/result-ui';
import { UI } from '../src/content/en/ui';
import { CONCERNS, CONCERN_ORDER, type ConcernKey } from '../src/content/en/concerns';
import { WEBTOON } from '../src/content/en/webtoon';
import { LIBRARY } from '../src/content/en/library';
import { LEGAL } from '../src/content/en/legal';
import { ABOUT_MEDIA } from '../src/content/en/about';
import { ENGINE_COPY } from '../src/content/en/engine';
import { NOT_CURSE, monthClashReason, monthStemReason, nextTermPhrase, whenPhrase, yearClashReason } from '../src/lib/reading/phrases';
import { balloonsOf, concernBalloons, elementTalk, introLine, pillarsLine, seedOf, sogeumBreakLine } from '../src/components/result/webtoon-text';
import { buildReading, pickConcernLine } from '../src/lib/reading';
import { buildTraits, currentChapter } from '../src/lib/reading/traits';
import type { ChapterInfo } from '../src/lib/reading/traits-types';
import { computeChart } from '../src/lib/saju';
import type { Chart, Element, GodGroup } from '../src/lib/saju/types';

const GROUPS: GodGroup[] = ['peer', 'output', 'wealth', 'power', 'resource'];
const ELEMENTS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
const CONCERN_KEYS: ConcernKey[] = [
  'love', 'crush', 'ex', 'partner', 'marriage', 'work', 'money', 'study', 'people', 'change', 'self',
];

const MAX_CONCERN_LINE = 220;
const MAX_SHORT = 200;

const FORBIDDEN_ANYWHERE = ['cosmic', 'energy', 'universe', 'manifest', 'fyp', 'destined', 'soulmate', 'share for luck'];
const FORBIDDEN_TOPICS = ['death', 'cancer', 'pregnan', 'lottery'];
const FORBIDDEN_TOPIC_WORDS = /\b(?:die|dies|died|dying)\b/i;
const FORBIDDEN_FATE = [
  'guarantee', 'definitely', 'for sure', 'inevitabl', 'fated', 'meant to be', 'twin flame', 'karma', 'horoscope', 'zodiac', 'curse',
];

const FORBIDDEN_PREDICTION =
  /\b(?:you(?:’ll| will) (?:marry|divorce|break up|lose|get back|meet your)|will (?:marry|leave you|end)|break ?up with|leave them|dump|toxic|poison|worthless|diagnos\w*|illness|disease|sick(?:ness)?|doctor|therap\w*|medicat\w*|lawsuit|lawyer|invest\w*|stocks?|crypto\w*|bitcoin|gambl\w*|bankrupt\w*|go broke|lose money|pay off your debt)\b/i;
const GENDERED_PARTNER =
  /\b(?:he|him|his|she|her|hers|boyfriend|girlfriend|husband|wife|guy|girl|boy|man|men|woman|women)\b/i;
const EMOJI = /\p{Extended_Pictographic}/u;
const ENDS_LIKE_SENTENCE = /[.!?][”’]?$/;
const MONTH_NAMES = /\b(?:January|February|March|April|June|July|August|September|October|November|December)\b/;

const OLD_VISUALS = /\b(?:black (?:hat|gat)|unroll\w*|scrolls?|parchment|on his shoulder|rides? on)\b/i;

const SOGEUM_AWAKE = /Sogeum (?:just )?(?:hopped|jumped|ran|climbed|is circling|is pawing|twitched|saved|steals|stole|pounced|chased)/i;

function forbiddenHits(text: string, opts: { allowCurse?: boolean } = {}): string[] {
  const lower = text.toLowerCase();
  const fate = opts.allowCurse ? FORBIDDEN_FATE.filter((w) => w !== 'curse') : FORBIDDEN_FATE;
  const hits = [
    ...FORBIDDEN_ANYWHERE.filter((w) => lower.includes(w)),
    ...FORBIDDEN_TOPICS.filter((w) => lower.includes(w)),
    ...fate.filter((w) => lower.includes(w)),
  ];
  const m = text.match(FORBIDDEN_TOPIC_WORDS);
  if (m) hits.push(m[0]);
  const p = text.match(FORBIDDEN_PREDICTION);
  if (p) hits.push(p[0]);
  return hits;
}

function sentencesOf(text: string): string[] {
  return text.split(/(?<=[.!?…][”’)]?)\s+(?=[A-Z“‘(])/).map((s) => s.trim()).filter(Boolean);
}

interface Labeled {
  where: string;
  text: string;
}

function walk(value: unknown, path: string, out: Labeled[]): void {
  if (typeof value === 'string') out.push({ where: path, text: value });
  else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}.${i}`, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k, out);
  }
}
function textsOf(value: unknown, root: string): Labeled[] {
  const out: Labeled[] = [];
  walk(value, root, out);
  return out;
}

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

const LIBRARY_HITS: { id: string; text: string }[] = [
  ...Object.values(TRAITS.core).flatMap((byStrength) => Object.values(byStrength).flat()),
  ...Object.values(TRAITS.pattern).flat(),
  ...Object.values(TRAITS.love).flat(),
  ...TRAITS.tension,
  ...Object.values(TRAITS.missing).flat(),
];

describe('concerns: shape (SPEC 11.2, 11.5)', () => {
  it('has the eleven concerns, in the order of the chips', () => {
    expect(CONCERN_ORDER).toEqual(CONCERN_KEYS);
    expect(Object.keys(CONCERNS).sort()).toEqual([...CONCERN_KEYS].sort());
    expect(new Set(CONCERN_ORDER).size).toBe(11);
  });

  it('has no health concern', () => {
    for (const k of CONCERN_KEYS) {
      expect(k).not.toMatch(/health|body|sick|illness|medical/);
      expect(CONCERNS[k].label.toLowerCase()).not.toMatch(/health|body|sick|illness|medical/);
    }
  });

  it('uses the chip labels of SPEC 11.2', () => {
    expect(CONCERN_ORDER.map((k) => CONCERNS[k].label)).toEqual([
      'My love life', 'Someone I like', 'An ex', 'My relationship', 'Marriage',
      'Work & career', 'Money', 'Study & exams', 'Friends & family', 'A big change', 'Who I really am',
    ]);
  });

  it('groups five love concerns (candy book love) and six life concerns (candy book general)', () => {
    for (const k of ['love', 'crush', 'ex', 'partner', 'marriage'] as const) {
      expect(CONCERNS[k].group, k).toBe('love');
      expect(CONCERNS[k].book, k).toBe('love');
    }
    for (const k of ['work', 'money', 'study', 'people', 'change', 'self'] as const) {
      expect(CONCERNS[k].group, k).toBe('life');
      expect(CONCERNS[k].book, k).toBe('general');
    }
  });

  it('gives each concern a title, two reactions, and two lines for each of the five god groups (110 lines)', () => {
    let total = 0;
    for (const k of CONCERN_KEYS) {
      const c = CONCERNS[k];
      expect(c.title.trim().length, k).toBeGreaterThan(8);
      expect(c.title, k).toMatch(/^About /);
      expect(c.reaction, k).toHaveLength(2);
      expect(Object.keys(c.lines).sort(), k).toEqual([...GROUPS].sort());
      for (const g of GROUPS) {
        expect(c.lines[g], `${k}/${g}`).toHaveLength(2);
        total += c.lines[g].length;
      }
    }
    expect(total).toBe(110);
    expect(CONCERNS.crush.title).toBe('About the one you like');
  });

  it('has unique ids in the documented form, numbered from 1, that cannot clash with candy ids', () => {
    const ids: string[] = [];
    for (const k of CONCERN_KEYS) {
      for (const g of GROUPS) {
        CONCERNS[k].lines[g].forEach((l, i) => {
          expect(l.id, `${k}/${g}`).toBe(`concern-${k}-${g}-${i + 1}`);
          expect(Object.keys(l).sort()).toEqual(['id', 'text']);
          ids.push(l.id);
        });
      }
    }
    expect(new Set(ids).size).toBe(ids.length);
    const candyIds = new Set(
      (['love', 'general'] as const).flatMap((b) => GROUPS.flatMap((g) => CANDY[b][g].map((l) => l.id))),
    );
    for (const id of ids) expect(candyIds.has(id), id).toBe(false);
  });
});

describe('concerns: wording rules (SPEC 5장, 10장)', () => {
  const lineTexts: Labeled[] = CONCERN_KEYS.flatMap((k) =>
    GROUPS.flatMap((g) => CONCERNS[k].lines[g].map((l) => ({ where: l.id, text: l.text }))),
  );
  const reactionTexts: Labeled[] = CONCERN_KEYS.flatMap((k) =>
    CONCERNS[k].reaction.map((text, i) => ({ where: `${k}.reaction.${i}`, text })),
  );
  const labelTexts: Labeled[] = CONCERN_KEYS.flatMap((k) => [
    { where: `${k}.label`, text: CONCERNS[k].label },
    { where: `${k}.title`, text: CONCERNS[k].title },
  ]);
  const all = [...lineTexts, ...reactionTexts, ...labelTexts];

  it('keeps every line between 60 and 220 characters, ending like a sentence, with no stray whitespace', () => {
    for (const { where, text } of lineTexts) {
      expect(text.length, where).toBeLessThanOrEqual(MAX_CONCERN_LINE);
      expect(text.length, where).toBeGreaterThanOrEqual(60);
      expect(text.trim(), where).toBe(text);
      expect(text, where).not.toMatch(/\s{2,}/);
      expect(text, where).toMatch(ENDS_LIKE_SENTENCE);
    }
    for (const { where, text } of reactionTexts) {
      expect(text.length, where).toBeLessThanOrEqual(MAX_CONCERN_LINE);
      expect(text.length, where).toBeGreaterThanOrEqual(40);
      expect(text, where).toMatch(ENDS_LIKE_SENTENCE);
    }
  });

  it('has no repeated sentence anywhere in the concern library', () => {
    const texts = [...lineTexts, ...reactionTexts].map((t) => t.text.toLowerCase());
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('has no forbidden vocabulary, topic, fate word or prediction', () => {
    for (const { where, text } of all) expect(forbiddenHits(text), where).toEqual([]);
  });

  it('never assumes anyone’s gender (Sogeum is named, never pronounced)', () => {
    for (const { where, text } of all) expect(text, where).not.toMatch(GENDERED_PARTNER);
  });

  it('uses typographic quotes, no emoji, no old-image wording, and keeps Sogeum asleep', () => {
    for (const { where, text } of all) {
      expect(text, where).not.toMatch(/['"]/);
      expect(text, where).not.toMatch(EMOJI);
      expect(text, where).not.toMatch(OLD_VISUALS);
      expect(text, where).not.toMatch(SOGEUM_AWAKE);
    }
  });

  it('names no month: the season is told as “this stretch” or “this season”', () => {
    for (const { where, text } of lineTexts) expect(text, where).not.toMatch(MONTH_NAMES);
  });

  it('is shaped for a webtoon (V2, V6): three to six sentences, three balloons at most, and never more than two sentences in a balloon', () => {
    for (const { where, text } of lineTexts) {
      const n = sentencesOf(text).length;
      expect(n, where).toBeGreaterThanOrEqual(3);
      expect(n, where).toBeLessThanOrEqual(6);
      const balloons = balloonsOf(text, 3);
      expect(balloons.length, where).toBeLessThanOrEqual(3);
      expect(balloons.join(' '), where).toBe(text);
      for (const b of balloons) expect(sentencesOf(b).length, `${where}: ${b}`).toBeLessThanOrEqual(2);
    }
  });

  it('teases first (V2): the opening balloon ends on a question of eight words or fewer, after at most a short “Oho?” or “Let me guess.”', () => {
    for (const { where, text } of lineTexts) {
      const opening = balloonsOf(text, 3)[0];
      const sentences = sentencesOf(opening);
      expect(sentences.length, `${where}: ${opening}`).toBeLessThanOrEqual(2);
      const question = sentences[sentences.length - 1];
      expect(question, `${where}: ${opening}`).toMatch(/\?[”’)]?$/);
      if (sentences.length === 2) expect(sentences[0].length, `${where}: ${opening}`).toBeLessThanOrEqual(14);
      const words = question.replace(/[“”]/g, '').split(/\s+/).length;
      expect(words, `${where}: ${question}`).toBeLessThanOrEqual(8);
    }
  });

  it('leaves the time to the engine (V2): about half of the lines have one {next} slot, never in the opening balloon', () => {
    const withNext = lineTexts.filter((l) => l.text.includes('{next}'));
    expect(withNext.length / lineTexts.length).toBeGreaterThan(0.4);
    expect(withNext.length / lineTexts.length).toBeLessThan(0.65);
    for (const { where, text } of lineTexts) {
      expect(text.split('{next}').length - 1, where).toBeLessThanOrEqual(1);
      expect(balloonsOf(text, 3)[0], where).not.toContain('{next}');

      expect(text.replace('{next}', ''), where).not.toMatch(/[{}]/);
    }

    for (const k of CONCERN_KEYS) {
      const n = GROUPS.flatMap((g) => CONCERNS[k].lines[g]).filter((l) => l.text.includes('{next}')).length;
      expect(n, k).toBeGreaterThanOrEqual(3);
    }
  });

  it('speaks in Yul’s voice (V2, V9): at most two knowing sounds in a line, and “Oho?” opens no more than 30% of the lines', () => {
    const SOUND = /\b(?:Oho|Mm-hm|Mm)\b/g;
    for (const { where, text } of lineTexts) expect((text.match(SOUND) ?? []).length, where).toBeLessThanOrEqual(2);
    const openers = lineTexts.filter((l) => /^Oho\?/.test(l.text)).length;
    expect(openers / lineTexts.length).toBeGreaterThan(0.1);
    expect(openers / lineTexts.length).toBeLessThanOrEqual(0.3);
    for (const { where, text } of reactionTexts) expect(text, where).toMatch(/\b(?:Oho|Mm-hm|Mm)\b/);
  });

  it('gets the ex scene right (V2): a tease, a jab at the effect on you, and a reaction that reads you, not them', () => {
    const exLines = GROUPS.flatMap((g) => CONCERNS.ex.lines[g]);

    expect(exLines.some((l) => /^Oho\? .*\?/.test(l.text))).toBe(true);
    expect(CONCERNS.ex.reaction[0].toLowerCase()).toContain('you, not them');
    for (const text of CONCERNS.ex.reaction) expect(text).not.toMatch(/opinion of them to myself/);
    expect(CONCERNS.ex.reaction[1]).toMatch(/costs you/);
  });

  it('does not read the mind of someone who is not in the room', () => {

    const MIND_READING =
      /\b(?:they|he|she|someone)(?:’s| is| are)? (?:still )?(?:secretly )?(?:thinking (?:of|about) you|miss(?:es|ing)? you|love[sd]? you|want[s]? you back|wants you back|regret\w*)\b/i;
    for (const { where, text } of all) expect(text, where).not.toMatch(MIND_READING);

    expect(CONCERNS.crush.reaction[0].toLowerCase()).toContain('you, not them');
    expect(CONCERNS.ex.reaction[0].toLowerCase()).toContain('you, not them');

    expect(CONCERNS.partner.reaction[0].toLowerCase()).toContain('your half');
  });

  it('never gives an order to end a relationship, and leaves the choice to the reader', () => {
    for (const { where, text } of lineTexts) {
      expect(text.toLowerCase(), where).not.toMatch(/\b(?:you should (?:leave|end|break|block|delete)|cut (?:them|it) off|walk away from them|end it)\b/);
    }
    expect(CONCERNS.ex.lines.wealth[1].text).toContain('your choice');
  });
});

describe('webtoon copy (SPEC 11.3, module boundary)', () => {
  it('has every key the result screen reads', () => {
    expect(Object.keys(WEBTOON).sort()).toEqual(
      [
        'chapterWho', 'chapterConcern', 'chapterRoad', 'intro', 'introNoName', 'typeCaption', 'pillarsLine',
        'elementsDominant', 'elementsMissing', 'elementsBalanced', 'sogeumBreak', 'typeSmoke', 'bridgeStage', 'bridgeLine', 'handPrompt', 'notCurse',
      ].sort(),
    );
  });

  it('titles the three chapters, with the concern slot left for the concern title', () => {
    expect(WEBTOON.chapterWho).toBe('Who you are');
    expect(WEBTOON.chapterRoad).toBe('Your road');
    expect(WEBTOON.chapterConcern).toContain('{concern}');

    expect(WEBTOON.chapterConcern.replace('{concern}', CONCERNS.crush.title)).toBe('About the one you like');
  });

  it('opens the reading with a name line and a nameless line, three of each', () => {
    expect(WEBTOON.intro.length).toBeGreaterThanOrEqual(3);
    expect(WEBTOON.introNoName.length).toBeGreaterThanOrEqual(3);
    expect(WEBTOON.intro).toContain('{name}. Let me read you.');
    expect(WEBTOON.introNoName).toContain('Let me read you.');
    for (const t of WEBTOON.intro) expect(t, t).toContain('{name}');
    for (const t of WEBTOON.introNoName) expect(t, t).not.toMatch(/[{}]/);
  });

  it('has a lantern-smoke vision for each of the ten types and a bridge between the rooms (SPEC 11.6)', () => {
    const types = Object.keys(TYPE_PROFILES);
    expect(Object.keys(WEBTOON.typeSmoke).sort()).toEqual([...types].sort());
    for (const [key, line] of Object.entries(WEBTOON.typeSmoke)) {
      expect(line, key).toMatch(/^In the lantern smoke, I see /);
      expect(line.length, key).toBeLessThanOrEqual(MAX_SHORT);
      expect(line, key).not.toMatch(/[{}]/);
      expect(line.toLowerCase(), key).not.toMatch(new RegExp(FORBIDDEN_ANYWHERE.join('|')));
      expect(GENDERED_PARTNER.test(line), key).toBe(false);
      expect(EMOJI.test(line), key).toBe(false);
    }
    expect(WEBTOON.typeSmoke.candle).toBe('In the lantern smoke, I see a candle.');

    expect(WEBTOON.bridgeStage).toContain('sleeping Sogeum');
    expect(WEBTOON.bridgeStage).not.toMatch(/\b(?:he|him|his)\b/i);
    expect(WEBTOON.bridgeLine).toBe('Come. Let me show you the road.');
    expect(RESULT_UI.deeper.lead).toContain('room further in');
  });

  it('fills the type caption and says the pillars line without counting the characters', () => {
    expect(WEBTOON.typeCaption).toBe('{born} · {hanzi}');
    expect(WEBTOON.typeCaption.replace('{born}', 'Candle-born').replace('{hanzi}', '丁火')).toBe('Candle-born · 丁火');
    expect(WEBTOON.pillarsLine.length).toBeGreaterThanOrEqual(3);

    for (const t of WEBTOON.pillarsLine) {
      expect(t, t).not.toMatch(/\b(?:six|eight|6|8)\b/i);
      expect(t, t).toMatch(/calendar/i);
    }

    expect(WEBTOON.pillarsLine[0]).toMatch(/calendar.*characters.*story/i);
  });

  it('points out the overflowing and the missing element, two lines for each of the five', () => {
    const names: Record<Element, string> = { wood: 'Wood', fire: 'Fire', earth: 'Earth', metal: 'Metal', water: 'Water' };
    for (const [key, table] of [['dominant', WEBTOON.elementsDominant], ['missing', WEBTOON.elementsMissing]] as const) {
      expect(Object.keys(table).sort(), key).toEqual([...ELEMENTS].sort());
      for (const e of ELEMENTS) {
        expect(table[e].length, `${key}.${e}`).toBeGreaterThanOrEqual(2);

        expect(table[e].some((t) => t.includes(names[e])), `${key}.${e}`).toBe(true);
      }
    }
    expect(WEBTOON.elementsBalanced.length).toBeGreaterThanOrEqual(2);
  });

  it('treats a missing element as a texture, never a defect, and never opens with the “Not a flaw:” excuse', () => {
    const text = ELEMENTS.flatMap((e) => WEBTOON.elementsMissing[e]).join(' ').toLowerCase();
    expect(text).not.toContain('not a flaw');
    expect(text).not.toMatch(/\b(?:flaw\w*|lacking|deficien\w*|defect\w*|weakness|bad)\b/);
  });

  it('keeps Sogeum asleep in the break panel, with a stage direction a few words long', () => {
    expect(WEBTOON.sogeumBreak.length).toBeGreaterThanOrEqual(3);
    expect(WEBTOON.sogeumBreak).toContain('Sogeum is asleep. Heard this one before, apparently.');
    for (const t of WEBTOON.sogeumBreak) {
      expect(t, t).toContain('Sogeum');
      expect(t, t).toMatch(/sleep|asleep|snore/i);
      expect(t.length, t).toBeLessThanOrEqual(90);
      expect(t, t).not.toMatch(SOGEUM_AWAKE);
    }
  });

  it('keeps the bad-news prompt and the weather line', () => {
    expect(WEBTOON.handPrompt).toMatch(/hold out your hand\.$/i);
    expect(WEBTOON.notCurse).toBe('Not a curse. Just weather.');
  });

  const WEBTOON_TEXTS = textsOf(WEBTOON, 'webtoon');

  it('keeps every line short, clean, free of forbidden words, gender words, emoji and old-image wording', () => {
    for (const { where, text } of WEBTOON_TEXTS) {
      expect(text.length, where).toBeLessThanOrEqual(MAX_SHORT);
      expect(text.trim(), where).toBe(text);
      expect(text, where).not.toMatch(/\s{2,}/);
      expect(text, where).not.toMatch(/['"]/);
      expect(text, where).not.toMatch(EMOJI);
      expect(text, where).not.toMatch(OLD_VISUALS);

      expect(forbiddenHits(text, { allowCurse: where === 'webtoon.notCurse' }), where).toEqual([]);

      expect(text, where).not.toMatch(GENDERED_PARTNER);
    }
    for (const { where, text } of WEBTOON_TEXTS) {
      if (where === 'webtoon.chapterConcern' || where === 'webtoon.typeCaption' || where.startsWith('webtoon.chapter')) continue;
      expect(text, where).toMatch(/[.!?]$/);
    }
  });
});

describe('ui: v3 keys (module boundary)', () => {
  it('has the landing button “Start my free reading”, and keeps the old home keys with the same button', () => {
    expect(UI.landing.cta).toBe('Start my free reading');
    expect(UI.home.cta).toBe('Start my free reading');

    expect(UI.home.subhead).toMatch(/Yul/);
    expect(UI.home.subhead).not.toMatch(/the cat/i);
  });

  it('asks the concern question and names the two chip groups', () => {
    const c = UI.reading.steps.concern;
    expect(c.line).toContain('What’s weighing on you tonight?');
    expect(c.loveGroup).toBe('Love');
    expect(c.lifeGroup).toBe('Life');
  });

  it('offers Woman / Man / Non-binary / Skip, and for Non-binary asks the yin-yang question without saying a gender', () => {
    const s = UI.reading.steps.sex;
    expect(s.options).toEqual({ female: 'Woman', male: 'Man', nonbinary: 'Non-binary', skip: 'Skip' });

    expect(s.woman).toBe('Woman');
    expect(s.man).toBe('Man');
    expect(s.skip).toBe('Skip');
    expect(s.nbLine).toBe(
      'Saju is old-fashioned here. Your ten-year chapters run forward or backward by a yin-yang rule. Which reading should I use?',
    );
    expect(s.nbOptions).toEqual({ yang: 'Yang reading', yin: 'Yin reading', skip: 'Skip the chapters' });
    for (const t of [s.nbLine, s.line, s.nbOptions.yang, s.nbOptions.yin, s.nbOptions.skip]) {
      expect(t, t).not.toMatch(GENDERED_PARTNER);
    }
  });

  it('adds a Non-binary chip for the life-map prompt on the result page', () => {
    expect(UPSELL.chapters.needSex.nonbinary).toBe('Non-binary');
    expect(UPSELL.chapters.needSex.woman).toBe('Woman');
    expect(UPSELL.chapters.needSex.man).toBe('Man');
  });

  it('still has the keys the other screens read (nothing was deleted)', () => {
    const steps = UI.reading.steps;
    for (const k of ['greeting', 'name', 'focus', 'date', 'time', 'place', 'sex', 'ritual', 'concern'] as const) {
      expect(steps[k], k).toBeDefined();
    }
    expect(UI.reading.steps.focus.choices).toHaveLength(3);
    expect(UI.reading.sceneAlt.greet.length).toBeGreaterThan(10);
    for (const k of ['greetAlt', 'gateAlt', 'scrollAlt', 'portraitAlt', 'giftAlt'] as const) {
      expect(UI.scenes[k].length, k).toBeGreaterThan(10);
    }
    expect(UI.home.posterAlt.length).toBeGreaterThan(10);
    expect(UI.result.locked.readings).toHaveLength(3);
  });
});

describe('Yul’s voice and the old images (SPEC 10장, 11.1)', () => {

  const SCREEN_TEXTS: Labeled[] = [
    ...textsOf(UI, 'ui'),
    ...textsOf(RESULT_UI, 'resultUi'),
    ...textsOf(UPSELL, 'upsell'),
    ...textsOf(REACTIONS, 'reactions'),
  ];

  it('does not describe the old pictures anywhere on screen (black hat, scroll, kitten on the shoulder)', () => {
    for (const { where, text } of SCREEN_TEXTS) expect(text, where).not.toMatch(OLD_VISUALS);
    for (const p of Object.values(TYPE_PROFILES)) {
      expect(`${p.identity} ${p.inLove} ${p.yulGreets}`, p.key).not.toMatch(OLD_VISUALS);
    }
  });

  it('describes Sogeum as a white kitten in a tiny red hat wherever a picture is described', () => {
    for (const text of [UI.home.posterAlt, UI.landing.videoAlt, UI.meta.ogImageAlt, UI.reading.sceneAlt.greet]) {
      expect(text, text).toMatch(/white kitten/);
      expect(text, text).not.toMatch(/black/i);
    }
    expect(UI.home.posterAlt).toMatch(/red hat/);
  });

  it('uses no forbidden vocabulary, no emoji and no straight quotes in any screen text', () => {
    for (const { where, text } of SCREEN_TEXTS) {
      expect(FORBIDDEN_ANYWHERE.filter((w) => text.toLowerCase().includes(w)), where).toEqual([]);
      expect(text, where).not.toMatch(EMOJI);
      expect(text, where).not.toMatch(/['"]/);
    }
  });

  it('keeps the rendered helper lines clean (chapter headline, bridge, next)', () => {
    const when = { month: 'May', year: 2026 };
    const outputs = [
      RESULT_UI.chapters.headline(SAMPLE_CHAPTER, when).lead,
      RESULT_UI.chapters.headline(SAMPLE_CHAPTER, when).detail,
      RESULT_UI.chapters.headline(SAMPLE_CHAPTER, null).detail,
      RESULT_UI.chapters.next(SAMPLE_CHAPTER, when) ?? '',
      RESULT_UI.chapters.restClosed(SAMPLE_CHAPTER) ?? '',
      RESULT_UI.deeper.bridge(SAMPLE_CHAPTER, 'Mina', when),
      RESULT_UI.deeper.bridge(SAMPLE_CHAPTER, '', null),
      RESULT_UI.deeper.honest('$3.99'),
      UI.reading.progress(3, 8),
      UI.result.headline('Mina', 'Candle-born'),
    ];
    for (const text of outputs) {
      expect(text.length, text).toBeLessThanOrEqual(MAX_CONCERN_LINE);
      expect(FORBIDDEN_ANYWHERE.filter((w) => text.toLowerCase().includes(w)), text).toEqual([]);
      expect(text, text).not.toMatch(/['"]/);
    }

    expect(RESULT_UI.deeper.bridge(SAMPLE_CHAPTER, 'Mina', when)).toMatch(/^Mina, I peeked ahead, and the Chapter of Shelter is next\./);
  });

  it('keeps Yul’s knowing voice in the libraries without the sounds (V9): “I can tell”, “I noticed”, “I’ve watched it happen” stay, “Oho” and “Mm” do not', () => {

    const KNOWING =
      /\b(?:I know|I noticed|I can (?:see|hear|tell)|I(?:’d| would) (?:bet|guess|call|pay|vouch|protect)|I knew|I read|I checked|I suspect|I(?:’ve| have) (?:met|watched|seen)|I(?:’m| am) (?:not judging|in no|taking)|I (?:insist|should know|won’t tell|notice|see)|I(?:’ll| will) (?:vouch|be watching|hold|look away)|didn’t you|don’t you|haven’t you)\b/;
    const candy = (['love', 'general'] as const).flatMap((b) => GROUPS.flatMap((g) => CANDY[b][g].map((l) => l.text)));
    const salt = (['pinch', 'spoonful', 'handful'] as const).flatMap((lv) =>
      GROUPS.flatMap((g) => SALT[lv][g].map((l) => l.situation)),
    );
    const dates = Object.values(REACTIONS.date.periods).flat();
    const share = (xs: string[], re: RegExp) => xs.filter((t) => re.test(t)).length / xs.length;
    for (const [name, xs, min] of [
      ['candy', candy, 0.1],
      ['salt situations', salt, 0.2],
      ['hits', LIBRARY_HITS.map((l) => l.text), 0.04],
    ] as const) {
      expect(share(xs, KNOWING), name).toBeGreaterThan(min);
      expect(share(xs, KNOWING), name).toBeLessThan(0.95);
    }

    expect(share(dates, /\b(?:Oho|Mm-hm|Mm)\b/)).toBeGreaterThan(0.2);
  });

  it('keeps Sogeum a sleeping kitten in every library: no hopping, pawing, stealing or circling', () => {
    const all = [
      ...textsOf(CANDY, 'candy'),
      ...textsOf(SALT, 'salt'),
      ...textsOf(TRAITS, 'traits'),
      ...textsOf(REACTIONS, 'reactions'),
      ...textsOf(UPSELL, 'upsell'),
      ...textsOf(RESULT_UI, 'resultUi'),
      ...textsOf(UI, 'ui'),
    ];
    for (const { where, text } of all) expect(text, where).not.toMatch(SOGEUM_AWAKE);
  });

  it('writes the first-screen subtitle and the greeting as Yul would, with no guaranteed fate', () => {
    const lines = [
      UI.home.subhead,
      UI.reading.steps.greeting.line,
      UI.reading.steps.name.line,
      UI.reading.steps.focus.line,
      UI.reading.steps.concern.line,
      UI.reading.steps.date.line,
      UI.reading.steps.time.line,
      UI.reading.steps.place.line,
      UI.reading.steps.sex.line,
      UI.reading.steps.ritual.line,
      UI.reading.steps.ritual.lineSix,
    ];
    for (const t of lines) expect(forbiddenHits(t), t).toEqual([]);
    expect(UI.reading.steps.greeting.line).toContain('Sogeum');
    expect(UI.reading.steps.greeting.line).toMatch(/I’m Yul/);
    expect(UI.reading.steps.ritual.line).toMatch(/eight characters/);
    expect(UI.reading.steps.ritual.lineSix).toMatch(/six characters/);
  });
});

describe('anchors the screenshot script (tests/shots.mjs) and the other screens read by text', () => {
  it('keeps the button names and reaction openings that tests/shots.mjs looks for', () => {
    expect(UI.reading.steps.greeting.answer).toBe('Hi, Yul');
    expect(UI.result.hand.button).toBe('Hold out your hand');
    expect(RESULT_UI.deeper.cta).toBe('Explore the rooms');
    expect(UPSELL.chapters.needSex.line).toBe('I need one more thing to open your life map.');
    expect(UI.result.showChart).toBe('Show the chart');
    expect(UI.result.share.heading).toBe('Take it with you.');
    expect(UI.email.success.title).toBe('Welcome, regular.');

    for (const t of UPSELL.whatISee.reactions.mostlyYes) expect(t, t).toMatch(/^(?:I know\.|Told you\.|Mm-hm\.)/);
    for (const t of RESULT_UI.whatISee.reactions.mostlyNo) expect(t, t).toMatch(/^(?:Fair\.|Not quite, then\.|Okay\. I missed)/);
  });
});

const SEOUL = { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' };
const NOW = '2026-10-15T00:00:00Z';

function birthdays(count: number, stepDays = 223, startYear = 1962): string[] {
  return Array.from({ length: count }, (_, i) => new Date(Date.UTC(startYear, 0, 3 + i * stepDays)).toISOString().slice(0, 10));
}

function chartOf(date: string, time: string | null = '14:30', sex: 'female' | 'male' | null = 'female'): Chart {
  return computeChart({ date, time, place: SEOUL, sex });
}

const SOUND_GLOBAL = /\b(?:Oho|Mm-hm|Mm)\b/g;
const soundsIn = (text: string) => (text.match(SOUND_GLOBAL) ?? []).length;

const STOP = new Set(
  'a an the and or but if so to of in on at by for with from as is are was were be been am it its this that these those you your yours they them their he she we i me my not no do does did have has had will would can could just than then too very more most still again one all any up out off over into about what who whom which when where how there here also even only own same some such ll re ve d let get got make makes like feel feels'.split(
    ' ',
  ),
);

function contentBigrams(text: string): Set<string> {
  const out = new Set<string>();
  for (const clause of text.toLowerCase().replace(/’/g, "'").split(/[.?!:;,—“”()]+/)) {
    const tokens = (clause.match(/[a-z']+/g) ?? []).map((t) => t.replace(/'s$/, '')).filter((t) => t.length > 2 && !STOP.has(t));
    for (let i = 0; i + 1 < tokens.length; i += 1) out.add(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return out;
}
function sharedBigrams(a: string, b: string): string[] {
  const bb = contentBigrams(b);
  return [...contentBigrams(a)].filter((x) => bb.has(x));
}

const ROMANCE_SCENE =
  /\b(?:dat(?:e|es|ed|ing)|crush\w*|flirt\w*|love life|in love|romanc\w*|romantic\w*|partner\w*|lover|sweetheart|kiss\w*|relationship|someone you like|someone you(?:’re| are) (?:seeing|dating)|what are we|I(?:’d| would) love to see you|your person)\b/i;

describe('V1: salt carries no love scene, because a work or money reader receives it too', () => {
  const saltEntries = (['pinch', 'spoonful', 'handful'] as const).flatMap((lv) =>
    GROUPS.flatMap((g) => SALT[lv][g].map((e) => ({ where: e.id, text: `${e.situation} ${e.action}` }))),
  );

  it('catches the old sentences it was written for', () => {
    for (const old of [
      'You glance at how everyone else’s love life looks and quietly grade your own.',
      'A friend’s opinion of someone you like gets a little louder than your own.',
      'You feel “what are we?” sitting on top of every small moment.',
      'Say it in one short line: “I’d love to see you.”',
      'Your inner judge and your heart are in a tug-of-war over someone, and you’re the rope. Plan the date.',
    ]) {
      expect(old, old).toMatch(ROMANCE_SCENE);
    }
  });

  it('has no date, crush, flirt, relationship or “what are we” in any of the 45 salt entries', () => {
    expect(saltEntries).toHaveLength(45);
    for (const { where, text } of saltEntries) expect(text, where).not.toMatch(ROMANCE_SCENE);
  });

  it('gives every life-bundle reading (work, money, study, friends, change, self) a salt without a love scene', () => {
    for (const date of birthdays(40)) {
      const chart = chartOf(date);
      for (const concern of ['work', 'money', 'study', 'people', 'change', 'self'] as const) {
        const { salt } = buildReading(chart, concern, NOW, LIBRARY);
        expect(`${salt.line.situation} ${salt.line.action}`, `${date} ${concern} ${salt.line.id}`).not.toMatch(ROMANCE_SCENE);
      }
    }
  });
});

describe('V4: a concern, a candy and a salt of the same group do not echo each other', () => {
  const candyOf = (book: 'love' | 'general', g: GodGroup) => CANDY[book][g].map((c) => ({ where: c.id, text: c.text }));
  const saltOf = (g: GodGroup) =>
    (['pinch', 'spoonful', 'handful'] as const).flatMap((lv) => SALT[lv][g].map((e) => ({ where: e.id, text: `${e.situation} ${e.action}` })));

  it('sees a real echo (the old heavy-hat pair)', () => {
    const old = sharedBigrams(
      'The “what are we” question is sitting on every small moment. It’s a heavy hat for a Tuesday.',
      'You feel “what are we?” sitting on top of every small moment. It’s a heavy hat to wear to dinner.',
    );
    expect(old.length).toBeGreaterThanOrEqual(2);
  });

  it('shares fewer than two content 2-grams between a concern line and the candy or salt of the same group', () => {
    for (const k of CONCERN_KEYS) {
      for (const g of GROUPS) {
        for (const line of CONCERNS[k].lines[g]) {
          const text = line.text.replace('{next}', '');
          for (const other of [...candyOf(CONCERNS[k].book, g), ...saltOf(g)]) {
            expect(sharedBigrams(text, other.text).length, `${line.id} ~ ${other.where}`).toBeLessThan(2);
          }
        }
      }
    }
  });

  it('shares fewer than two content 2-grams between the candy and the salt of the same group', () => {
    for (const book of ['love', 'general'] as const) {
      for (const g of GROUPS) {
        for (const c of candyOf(book, g)) {
          for (const e of saltOf(g)) {
            expect(sharedBigrams(c.text, e.text).length, `${c.where} ~ ${e.where}`).toBeLessThan(2);
          }
        }
      }
    }
  });
});

describe('V9: the knowing sounds (Oho, Mm-hm, Mm) live in the concern lines, the reactions and the “What I see” reaction only', () => {
  const GROUPS_ALL = textsOf(
    {
      candy: CANDY,
      salt: SALT,
      traits: TRAITS,
      webtoon: WEBTOON,
      types: TYPE_PROFILES,
      resultUi: { ...RESULT_UI, whatISee: { ...RESULT_UI.whatISee, reactions: undefined } },
      uiResult: UI.result,
      uiHome: UI.home,
      upsell: {
        ...UPSELL,

        whatISee: { ...UPSELL.whatISee, reactions: undefined },
      },
    },
    '',
  );

  it('keeps candy, salt, hits, chapter lines, element talk, type cards and screen copy free of the sounds', () => {
    expect(GROUPS_ALL.length).toBeGreaterThan(500);
    for (const { where, text } of GROUPS_ALL) expect(soundsIn(text), `${where}: ${text}`).toBe(0);
  });

  it('keeps one result (everything but the conversation) to three sounds or fewer: 40 birthdays x 11 concerns', () => {
    const worstReaction = Math.max(
      ...UPSELL.whatISee.reactions.mostlyYes.map(soundsIn),
      ...RESULT_UI.whatISee.reactions.mostlyNo.map(soundsIn),
      ...Object.values(RESULT_UI.whatISee.bonusAfter).map(soundsIn),
    );
    let most = 0;
    let readings = 0;
    for (const date of birthdays(40)) {
      const chart = chartOf(date, date.endsWith('7') ? null : '14:30');
      const traits = buildTraits(chart, TRAITS);
      const seed = seedOf(chart);
      const chapter = currentChapter(chart, NOW, TRAITS);
      for (const concern of CONCERN_KEYS) {
        const reading = buildReading(chart, concern, NOW, LIBRARY);
        const profile = TYPE_PROFILES[reading.type];
        const line = pickConcernLine(chart, concern, NOW, CONCERNS[concern].lines);
        const shown = [
          introLine(seed, 'Mina'),
          WEBTOON.typeSmoke[reading.type],
          profile.identity,
          profile.inLove,
          pillarsLine(seed),
          ...elementTalk(chart, traits.features.missing, seed).map((t) => t.text),
          UPSELL.whatISee.intro,
          ...traits.hits.map((h) => h.text),
          ...(traits.bonus ? [UPSELL.whatISee.bonusIntro, traits.bonus.text] : []),
          sogeumBreakLine(seed),
          CONCERNS[concern].title,
          line.text,
          reading.candy.text,
          WEBTOON.handPrompt,
          UI.result.hand.hint,
          reading.salt.line.when,
          reading.salt.line.situation,
          reading.salt.line.action,
          reading.salt.line.notCurse,
          WEBTOON.bridgeStage,
          WEBTOON.bridgeLine,
          RESULT_UI.deeper.lead,
          RESULT_UI.deeper.want,
          RESULT_UI.deeper.honest(ROOMS_COPY.price),
          ...(chapter
            ? [
                RESULT_UI.chapters.headline(chapter, null).lead,
                RESULT_UI.chapters.headline(chapter, null).detail,
                UPSELL.chapters.intro,
                RESULT_UI.deeper.bridge(chapter, 'Mina', null),
              ]
            : [RESULT_UI.deeper.bridgeGeneric]),
        ];
        const total = shown.reduce((n, t) => n + soundsIn(t), 0) + worstReaction;
        most = Math.max(most, total);
        readings += 1;
        expect(total, `${date} ${concern}`).toBeLessThanOrEqual(3);
      }
    }
    expect(readings).toBe(440);
    expect(most).toBeGreaterThan(0);
  });
});

describe('V3: nothing hands over the good news before it comes', () => {
  it('lets the “What I see” reactions point ahead instead (the good news arrives two panels later)', () => {
    for (const t of [...UPSELL.whatISee.reactions.mostlyYes, ...Object.values(RESULT_UI.whatISee.bonusAfter)]) {
      expect(t, t).not.toMatch(/eat your candy|here’s the good news/i);
    }
    expect(UPSELL.whatISee.reactions.mostlyYes).toEqual([
      'I know. Hold that face; the good news is coming.',
      'Told you. Don’t look so surprised.',
      'Mm-hm. I only say what’s there. Good news is next.',
      'I know. Sogeum slept through it, and you didn’t.',
    ]);
    expect(RESULT_UI.whatISee.bonusAfter.yes).toBe('There it is. Now, the good news.');
    expect(RESULT_UI.whatISee.bonusAfter.no).toBe('Fair enough. You still get the good news.');
  });

  it('names the two halves plainly as good news and bad news in every language', () => {
    expect(UI.result.candy.title).toBe('The good news.');
    for (const t of Object.values(UI.result.salt.title)) expect(t, t).toMatch(/^The bad news/);
    const visible = [UI.result.candy.title, ...Object.values(UI.result.salt.title), UI.result.hand.hint, UI.result.salt.why, WEBTOON.handPrompt];
    for (const t of visible) expect(t, t).not.toMatch(/candy|salt|honey/i);
  });
});

describe('V5: the element talk (D panel) does not repeat the type card (B panel)', () => {
  it('shares fewer than two content 2-grams with the identity and the love line of any type', () => {
    const talks = [...ELEMENTS.flatMap((e) => [...WEBTOON.elementsDominant[e], ...WEBTOON.elementsMissing[e]]), ...WEBTOON.elementsBalanced];
    for (const profile of Object.values(TYPE_PROFILES)) {
      for (const talk of talks) {
        expect(sharedBigrams(talk, `${profile.identity} ${profile.inLove}`).length, `${profile.key}: ${talk}`).toBeLessThan(2);
      }
    }
  });

  it('no longer quotes the old Ocean and Mountain lines', () => {
    expect(WEBTOON.elementsDominant.water.join(' ')).not.toMatch(/Deep, curious, always moving/);
    expect(WEBTOON.elementsDominant.earth.join(' ')).not.toMatch(/the one everyone leans on/);
  });
});

describe('V6: a balloon holds two sentences or fewer', () => {
  const sentenceCount = (t: string) => sentencesOf(t).length;

  it('candy, hits, salt situations, element talk and the pillars line are two sentences at most', () => {
    const candy = (['love', 'general'] as const).flatMap((b) => GROUPS.flatMap((g) => CANDY[b][g].map((l) => ({ where: l.id, text: l.text }))));
    const salt = (['pinch', 'spoonful', 'handful'] as const).flatMap((lv) => GROUPS.flatMap((g) => SALT[lv][g].map((l) => ({ where: l.id, text: l.situation }))));
    const element = [
      ...ELEMENTS.flatMap((e) => [...WEBTOON.elementsDominant[e], ...WEBTOON.elementsMissing[e]]),
      ...WEBTOON.elementsBalanced,
      ...WEBTOON.pillarsLine,
    ].map((text) => ({ where: text, text }));
    for (const { where, text } of [...candy, ...salt, ...element, ...LIBRARY_HITS.map((l) => ({ where: l.id, text: l.text }))]) {
      expect(sentenceCount(text), `${where}: ${text}`).toBeLessThanOrEqual(2);
    }
  });

  it('splits a six-sentence line 2 / 2 / 2, with the question first', () => {
    const text = 'Oho? You still sleep in that hoodie? Mm. It’s been doing the talking for a while. Keep it or box it. Your month points up the stairs.';
    expect(balloonsOf(text, 3)).toEqual([
      'Oho? You still sleep in that hoodie?',
      'Mm. It’s been doing the talking for a while.',
      'Keep it or box it. Your month points up the stairs.',
    ]);

    const short = balloonsOf('Still drafting? It’s good. You reread it. Send it.', 3);
    expect(short[0]).toBe('Still drafting?');
    expect(short).toHaveLength(3);
    expect(short.join(' ')).toBe('Still drafting? It’s good. You reread it. Send it.');

    expect(balloonsOf('Oho. You hold your ground so well that anyone interested has to come to you. Good. Whoever comes means it.', 3)[0]).toBe('Oho.');
  });
});

describe('V7: the bridge to the inner rooms is honest and personal', () => {
  const when = { month: 'May', year: 2026 };

  it('names the next chapter, so the line is not the same for everyone', () => {
    const text = RESULT_UI.deeper.bridge(SAMPLE_CHAPTER, 'Mina', when);
    expect(text).toMatch(/^Mina, I peeked ahead, and the Chapter of Shelter is next\. /);
    expect(text).toContain('Further in, Yeon marks the good years for love');
    expect(text).not.toMatch(/a few years in it|not telling you which/);
    expect(sentencesOf(text)).toHaveLength(2);

    expect(text).not.toContain(SAMPLE_CHAPTER.title);
    expect(text).not.toMatch(/\buntil\b|\b(?:19|20)\d\d\b/);

    expect(RESULT_UI.deeper.bridge(SAMPLE_CHAPTER, 'Mina', when, 'The Chapter of Harvest')).toContain('the Chapter of Harvest is next');
    expect(RESULT_UI.deeper.bridge(SAMPLE_CHAPTER, 'Mina', when, 'The Chapter of Harvest')).not.toContain('Shelter');
  });

  it('has an honest line when there is no next chapter, and before the first chapter opens', () => {
    const last = RESULT_UI.deeper.bridge({ ...SAMPLE_CHAPTER, next: null }, '', null, null);
    expect(last).toMatch(/^I peeked ahead at your map\. Further in, Yeon marks the good years for love\.$/);
    expect(last).not.toContain(' is next');
    const before = RESULT_UI.deeper.bridge({ ...SAMPLE_CHAPTER, index: 0, startAge: 9, beforeStart: true }, 'Mina', null);
    expect(before).toMatch(/^Mina, I peeked ahead, and the Chapter of Shelter is next/);
    expect(RESULT_UI.deeper.bridgeGeneric).toMatch(/^I peeked ahead at your map\./);
  });

  it('does not promise every chapter to a reader who skipped the sex question (only the one they are in opens)', () => {
    expect(RESULT_UI.deeper.bridgeNoSex).not.toMatch(/every chapter|walk you through|slowly/i);
    expect(RESULT_UI.deeper.bridgeNoSex).toContain('the chapter you’re in');
    expect(RESULT_UI.deeper.bridgeNoSex).toContain('the rest is further in');
    expect(sentencesOf(RESULT_UI.deeper.bridgeNoSex).length).toBeLessThanOrEqual(2);
    for (const t of [RESULT_UI.deeper.bridgeNoSex, RESULT_UI.deeper.bridgeGeneric]) expect(forbiddenHits(t), t).toEqual([]);
  });
});

describe('V8, V10, V11, V12: the lines the review singled out', () => {
  it('V8: a missing Water is never “no deep pool” (it reads as shallow)', () => {
    const water = WEBTOON.elementsMissing.water.join(' ');
    expect(water).not.toMatch(/deep pool|shallow|surface/i);
    expect(water).toMatch(/No Water.*characters/i);
    expect(water).toMatch(/slow down|patient listener/i);
  });

  it('V10: no chapter line says that a particular person tends to show up', () => {
    const lines = [...Object.values(TRAITS.chapters10!).flatMap((x) => [x.same.line, x.other.line]), ...Object.values(TRAITS.chapters).map((x) => x.line)];
    for (const t of lines) expect(t, t).not.toMatch(/\b(?:someone|somebody|a person)\b[^.]*\b(?:show(?:s)? up|arrives?|comes? along|turns? up)\b/i);
    expect(TRAITS.chapters10!.power.other.line).toBe(
      'Commitments take shape, in work and in love. Wanting something real gets easier to say out loud here, and easier to hear.',
    );
  });

  it('V11: the narrator box after the chapter bubble does not tease again', () => {
    expect(UPSELL.chapters.intro).toMatch(/Saju.*ten-year chapters.*chart/i);
    expect(soundsIn(UPSELL.chapters.intro)).toBe(0);
    expect(UPSELL.chapters.intro).not.toMatch(/\bI know\b/);
  });

  it('V12: the first greeting is not repeated, the sweet-half line is not said twice, and no hit-rate is claimed', () => {
    expect(UI.reading.steps.greeting.line).toContain('I’ve been expecting you');
    for (const t of [...WEBTOON.intro, ...WEBTOON.introNoName]) expect(t, t).not.toMatch(/expecting you/i);
    expect(WEBTOON.intro).toContain('{name}. Took you long enough. Let me read you.');
    expect(WEBTOON.introNoName).toContain('Took you long enough. Let me read you.');

    expect(WEBTOON.handPrompt).toContain('That was the good news');
    expect(UI.result.hand.hint).not.toMatch(/that was the good news|now the bad news/i);
    expect(UI.result.hand.hint).toMatch(/honesty.*bad news/i);
    for (const t of RESULT_UI.whatISee.reactions.mostlyNo) expect(t, t).not.toMatch(/doesn’t happen often|rarely|seldom/i);
    expect(RESULT_UI.whatISee.reactions.mostlyNo[2]).toBe('Okay. I missed on those, and I won’t pretend I didn’t.');
  });
});

describe('P16: the non-binary hint', () => {
  it('gives the reason to pick instead of skipping, without a gender word', () => {
    const hint = UI.reading.steps.sex.nbHint;
    expect(hint).toBe('Not sure? Either is fine. It only changes which way the chapters turn.');
    expect(hint).not.toMatch(GENDERED_PARTNER);
    expect(forbiddenHits(hint)).toEqual([]);
    expect(hint).not.toMatch(/['"]/);
  });
});

const ROOT = path.resolve(__dirname, '..');

const REASSURING =
  /\b(?:Relax|Don’t worry|No (?:rush|panic|need|hurry)|Nothing needs|I promise|I checked|I(?:’ve| have) (?:seen|noticed)|I won’t tell|I doubt|I’d protect|trust me|fine|enough|plenty|allowed|counts|normal|lovely|decent|safe|easier|(?:doesn’t|don’t|won’t) (?:have to|need to|tip)|(?:will|can) (?:keep|wait|still|do|stay|carry|always)|isn’t going anywhere|your (?:choice|call)|final vote|on your side|gets its turn|better than you think|nobody|never yours|nothing wrong|half the fun|still work|calmer|all the time|whole point|most people|have the voice|further along)\b/i;
const COMMAND_START =
  /^(?:Say|Ask|Tell|Let|Learn|Check|Pick|Try|Trust|Practice|Receive|Slide|Take|Write|Add|Send|Put|Keep|Set|Go|Spend|Skip|Leave|Hand|Drop|Bring|Show|Give|Name|Find|Watch|Notice|Choose|Make|Start|Close|Step|Listen|Gather|Rest|Smile|Follow|Just|Then|Explain)\b/;

describe('V2 (재검토): tease → jab → reassure, and the screen cuts it that way', () => {
  const lineTexts: Labeled[] = CONCERN_KEYS.flatMap((k) =>
    GROUPS.flatMap((g) => CONCERNS[k].lines[g].map((l) => ({ where: l.id, text: l.text }))),
  );

  it('cuts with concernBalloons = balloonsOf(text, 3), and ConcernPanel uses that function, not balloonsMax', () => {
    for (const { where, text } of lineTexts) {
      expect(concernBalloons(text), where).toEqual(balloonsOf(text, 3));
    }
    const src = readFileSync(path.join(ROOT, 'src/components/result/verdict-panels.tsx'), 'utf8');
    const body = src.slice(src.indexOf('export function ConcernPanel'), src.indexOf('export function CandyPanel'));
    expect(body).toContain('concernBalloons(text)');
    expect(body).not.toContain('balloonsMax');
  });

  it('opens on “Oho?” with the teasing question in the first balloon, never “Oho?” alone', () => {
    for (const { where, text } of lineTexts) {
      const first = concernBalloons(text)[0];
      if (/^Oho\?/.test(text)) {
        expect(first, where).not.toBe('Oho?');
        expect(sentencesOf(first), where).toHaveLength(2);
      }
    }
  });

  it('puts a reassurance in the last balloon of seven lines in ten, as content and not as a fixed opener word', () => {
    const lasts = lineTexts.map(({ where, text }) => {
      const balloons = concernBalloons(text);
      return { where, last: balloons[balloons.length - 1] };
    });
    const reassuring = lasts.filter(({ last }) => REASSURING.test(last));
    expect(reassuring.length / lasts.length).toBeGreaterThanOrEqual(0.7);

    const commands = lasts.filter(({ last }) => COMMAND_START.test(sentencesOf(last).pop() ?? ''));
    expect(commands.length / lasts.length).toBeLessThanOrEqual(0.2);

    for (const { where, text } of lineTexts) expect(concernBalloons(text)[0], where).not.toContain('{next}');
  });

  it('does not open the last balloons the same way: one first word in 15% at most, “Relax” ten times at most, “Oho?” in 30% at most', () => {
    const firstWords = lineTexts.map(({ text }) => {
      const balloons = concernBalloons(text);
      return (balloons[balloons.length - 1].match(/^[A-Za-z’]+/)?.[0] ?? '').toLowerCase();
    });
    const counts = new Map<string, number>();
    for (const w of firstWords) counts.set(w, (counts.get(w) ?? 0) + 1);
    const [topWord, top] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    expect(top / lineTexts.length, `“${topWord}” opens ${top} last balloons`).toBeLessThanOrEqual(0.15);

    expect(lineTexts.filter(({ text }) => /\bRelax\b/.test(text)).length).toBeLessThanOrEqual(10);
    for (const { where, text } of lineTexts) expect(text, where).not.toMatch(/\bRelax, [^.?!]*, (?:so|and|then) /);

    const oho = lineTexts.filter(({ text }) => /^Oho\?/.test(text)).length;
    expect(oho / lineTexts.length).toBeLessThanOrEqual(0.3);

    for (const { where, text } of lineTexts) expect(text, where).not.toContain(';');
  });

  it('does not say what a person who is not here means: no “whoever comes ... means it”', () => {
    for (const { where, text } of lineTexts) {
      expect(text, where).not.toMatch(/\b(?:whoever|anyone|someone|they) [^.?!]*\bmeans? it\b/i);
    }
    expect(CONCERNS.love.lines.peer[0].text).toContain('Notice who bothers to make the walk before {next}');
  });

  it('keeps the ex reading focused on the reader with a gentle next step', () => {
    const user = CONCERNS.ex.lines.wealth[0].text;
    expect(user).toMatch(/^Oho\? Still hoping to see them\?/);
    expect(user).toContain('taken up enough of your evening');
    expect(user).toContain('one plan that has nothing to do with them');
    expect(user).toContain('room for both sadness and a good night');
    expect(user).toContain('{next}');
    const balloons = concernBalloons(user);
    expect(balloons).toHaveLength(3);
    expect(balloons[0]).toBe('Oho? Still hoping to see them?');
    expect(balloons[2]).toMatch(/one plan.*room for both sadness/);
  });

  it('keeps the old repeats out: the wealth lines no longer echo a hit or the shiny salt', () => {
    for (const { text } of CONCERNS.money.lines.wealth) expect(text).not.toMatch(/right more often than people enjoy|shiny/i);
    for (const { text } of GROUPS.flatMap((g) => CONCERNS.crush.lines[g])) expect(text).not.toMatch(/It isn’t one\./);
  });
});

const STOP_STEMS = new Set(
  (
    'a an the and or but if so to of in on at by for with from as is are was were be been am it its this that these those you your yours they them their he she we i me my not no do does did have has had will would can could just than then too very more most still again one all any up out off over into about what who whom which when where how there here also even only own same some such let get got make makes like feel feels ' +
    'yourself themselves something someone anyone everyone everything anything nothing people person month time little lot way thing things today tonight week day days before after until while because though maybe really actually good great right real ' +
    'say said says tell told take takes took give gives gave keep keeps kept put puts come comes came look looks looked want wants wanted need needs needed know knows knew think thinks thought see sees saw seem seems ' +
    'don’t doesn’t didn’t isn’t aren’t wasn’t can’t won’t i’m i’ve i’ll you’re you’ve you’ll you’d they’re they’ve it’s that’s there’s here’s let’s ' +
    'next first second last another other others every each both either neither many much few less least enough yet ever never always often sometimes already almost quite rather whether without within between through around across along beside under above below being doing going getting having making taking'
  ).split(/\s+/),
);

function stemsOf(text: string): Set<string> {
  const out = new Set<string>();
  const words = text.toLowerCase().replace(/\{next\}/g, ' ').match(/[a-z’-]+/g) ?? [];
  for (const raw of words) {
    const w = raw.replace(/’s$/, '').replace(/[’-]/g, '');
    if (w.length < 4 || STOP_STEMS.has(raw) || STOP_STEMS.has(w)) continue;
    let stem = w.replace(/(ing|ed|ly|es|s)$/, '');
    if (stem.length < 4) stem = w;
    out.add(stem.slice(0, 6));
  }
  return out;
}
function sharedStems(a: string, b: string): string[] {
  const other = stemsOf(b);
  return [...stemsOf(a)].filter((x) => other.has(x));
}

describe('V4 (재검토): the concern, the candy and the salt of one reading give different advice', () => {
  const candyOf = (book: 'love' | 'general', g: GodGroup) => CANDY[book][g].map((c) => ({ where: c.id, text: c.text }));
  const saltOf = (g: GodGroup) =>
    (['pinch', 'spoonful', 'handful'] as const).flatMap((lv) => SALT[lv][g].map((e) => ({ where: e.id, text: `${e.situation} ${e.action}` })));

  it('shares fewer than three content word-stems between a concern line and any candy or salt of the same group', () => {
    for (const k of CONCERN_KEYS) {
      for (const g of GROUPS) {
        for (const line of CONCERNS[k].lines[g]) {
          for (const other of [...candyOf(CONCERNS[k].book, g), ...saltOf(g)]) {
            expect(sharedStems(line.text, other.text).length, `${line.id} ~ ${other.where}`).toBeLessThan(3);
          }
        }
      }
    }
  });

  it('shares fewer than three content word-stems between the candy and the salt of the same group', () => {
    for (const book of ['love', 'general'] as const) {
      for (const g of GROUPS) {
        for (const c of candyOf(book, g)) {
          for (const e of saltOf(g)) {
            expect(sharedStems(c.text, e.text).length, `${c.where} ~ ${e.where}`).toBeLessThan(3);
          }
        }
      }
    }
  });

  it('keeps the pairs the review found apart (fewer than two stems, and not the old advice)', () => {
    const textOf = (id: string): string => {
      for (const k of CONCERN_KEYS) for (const g of GROUPS) for (const l of CONCERNS[k].lines[g]) if (l.id === id) return l.text;
      for (const book of ['love', 'general'] as const) for (const g of GROUPS) for (const c of CANDY[book][g]) if (c.id === id) return c.text;
      for (const lv of ['pinch', 'spoonful', 'handful'] as const) for (const g of GROUPS) for (const e of SALT[lv][g]) if (e.id === id) return `${e.situation} ${e.action}`;
      throw new Error(`no such id ${id}`);
    };
    const PAIRS: [string, string][] = [
      ['concern-partner-peer-1', 'spoonful-peer-1'],
      ['concern-partner-output-1', 'spoonful-output-2'],
      ['concern-crush-resource-1', 'handful-resource-1'],
      ['concern-ex-output-1', 'handful-output-1'],
      ['concern-ex-output-2', 'handful-output-3'],
      ['concern-ex-output-2', 'pinch-output-3'],
      ['concern-love-resource-1', 'love-resource-1'],
      ['concern-love-output-1', 'love-output-1'],
      ['concern-work-peer-1', 'general-peer-3'],
      ['concern-work-output-1', 'general-output-1'],
      ['concern-work-output-2', 'general-output-2'],
      ['concern-self-output-1', 'general-output-2'],
      ['concern-people-output-2', 'general-output-1'],
      ['concern-people-output-1', 'handful-output-2'],
      ['concern-love-wealth-1', 'love-wealth-7'],
      ['concern-love-wealth-1', 'pinch-wealth-1'],
      ['concern-money-wealth-2', 'pinch-wealth-2'],
      ['concern-crush-power-2', 'spoonful-power-2'],
      ['concern-crush-power-2', 'handful-power-2'],
      ['concern-partner-power-1', 'spoonful-power-1'],
      ['concern-partner-power-2', 'pinch-power-3'],
      ['concern-crush-wealth-1', 'handful-wealth-2'],
      ['concern-crush-peer-2', 'pinch-peer-3'],
    ];
    for (const [a, b] of PAIRS) expect(sharedStems(textOf(a), textOf(b)).length, `${a} ~ ${b}`).toBeLessThan(2);

    expect(textOf('concern-crush-resource-1')).not.toMatch(/send one small/i);
    expect(textOf('concern-love-wealth-1')).not.toMatch(/notice/i);
    expect(textOf('concern-money-wealth-2')).not.toMatch(/shiny/i);
    expect(textOf('concern-crush-power-2')).not.toMatch(/It isn’t one\./);
  });

  it('keeps the shared love candy book safe for an ex: nothing says send, name a day, or whatever you have been saving to say', () => {
    const love = GROUPS.flatMap((g) => CANDY.love[g].map((c) => ({ where: c.id, text: c.text })));
    for (const { where, text } of love) {
      expect(text, where).not.toMatch(/\bSend one\b|name a day|saving to say|small flirt|coffee sometime/i);
    }
    expect(CANDY.love.output[3].text).toBe(
      'A silly photo or a rambling voice note can make someone’s day. Your ordinary, unpolished warmth is part of the appeal.',
    );
    expect(CANDY.love.output[0].text).toBe('Your words land softer and sparkle more than usual this month. Even your typos sound charming; I checked.');
    expect(CANDY.love.wealth[5].text).toBe('Little plans suit you this month, like a time, a place, a reason to dress up. Make one just for the pleasure of it.');
  });
});

describe('재검토: Sogeum has no pronoun, and the “stirs, then sleeps again” joke is not told three times', () => {
  it('the first greeting and every stage direction name Sogeum without he, him or his', () => {
    expect(UI.reading.steps.greeting.line).toBe(
      'You followed Sogeum all the way up. That cat brought you here and fell asleep on the spot. I’m Yul. I’ve been expecting you.',
    );
    for (const t of [UI.reading.steps.greeting.line, ...WEBTOON.sogeumBreak]) expect(t, t).not.toMatch(GENDERED_PARTNER);
  });

  it('tells the “opened an eye, then went back to sleep” joke in one place only (name reaction, concern reactions, break panel)', () => {
    const AGAIN = /(?:opened?|opens) one eye|(?:went|goes|go) (?:right )?back to sleep|\bstirred\b|\bstirs\b/i;
    const names = [...REACTIONS.name.named, ...REACTIONS.name.anonymous];
    const concernReactions = CONCERN_KEYS.flatMap((k) => CONCERNS[k].reaction);
    const families = [names, concernReactions, WEBTOON.sogeumBreak].map((texts) => texts.filter((t) => AGAIN.test(t)).length);
    expect(families[0]).toBe(0);
    expect(families[1]).toBe(0);
    expect(families[2]).toBeLessThanOrEqual(1);
    expect(REACTIONS.name.named[1]).toBe('{name}. Sogeum purred in the middle of a nap. High praise.');
    expect(CONCERNS.love.reaction[1]).toBe('Love. Mm-hm. Sogeum didn’t even twitch. Old news.');
    expect(WEBTOON.sogeumBreak[1]).toBe('Sogeum rolls onto the warm side of the table, still asleep.');
  });
});

describe('재검토: the knowing sounds do not trail the lines, and no balloon runs past two sentences', () => {
  it('the date reactions put “Mm-hm” or “Oho” before the observation, never as a tail', () => {
    for (const text of Object.values(REACTIONS.date.periods).flat()) {
      expect(text, text).not.toMatch(/\b(?:Oho|Mm-hm|Mm)\.$/);
      expect(text, text).not.toMatch(/\?\s+(?:Oho|Mm-hm|Mm)\.$/);
    }
    expect(REACTIONS.date.periods['feb-mid'][0]).toBe(
      'Mid-February. The ice is loosening on the streams. Mm-hm. You look calmer than you are, and you thaw faster than you admit.',
    );
  });

  it('the “One more thing” head has no sound and is one sentence; the “Mm-hm” reaction and the time note are two sentences', () => {
    expect(UPSELL.whatISee.bonusIntro).toBe('One more thing, and then I’ll stop showing off.');
    expect(soundsIn(UPSELL.whatISee.bonusIntro)).toBe(0);

    const withoutLeadingSound = (t: string) => t.replace(/^(?:Oho|Mm-hm|Mm)[.?]\s+/, '');
    for (const t of [...UPSELL.whatISee.reactions.mostlyYes, ...RESULT_UI.whatISee.reactions.mostlyNo, RESULT_UI.whatISee.timeNote.unknown, RESULT_UI.whatISee.timeNote.nearMidnight]) {
      expect(sentencesOf(withoutLeadingSound(t)).length, t).toBeLessThanOrEqual(2);
    }
    expect(RESULT_UI.whatISee.timeNote.unknown).toBe(
      'You didn’t give me a birth time, so I read three pillars instead of four, and that can tilt things. Want to add it?',
    );
  });

  it('the bonus bubble is split in the component: the head is its own balloon, the hit its own (V6)', () => {
    const src = readFileSync(path.join(ROOT, 'src/components/result/what-i-see.tsx'), 'utf8');
    expect(src).not.toMatch(/<p className="italic">\{T\.bonusIntro\}<\/p>\s*<p>\{bonus\.text\}<\/p>/);
    expect(src).not.toMatch(/<p className="italic">\{R\.bonusTry\}<\/p>/);
  });

  it('the Fire talk no longer says what the Sun-born card says', () => {
    expect(WEBTOON.elementsDominant.fire[1]).toBe(
      'You light fast and burn bright, and there’s a lot of Fire in you to do it with. It eats through your evenings faster than you plan.',
    );
    expect(WEBTOON.elementsDominant.fire[1]).not.toContain('before you speak');
  });
});

describe('재검토: Yul’s “Want to know more?” is a balloon, and the pitch stays honest', () => {
  const D = RESULT_UI.deeper;

  it('has Yul ask it in his own voice, in a balloon of two sentences, and promises what the product lines promise', () => {
    expect(D.want).toMatch(/^Want to know more\? I’ll.*big picture of your life.*themes/);
    expect(sentencesOf(D.want)).toHaveLength(2);
    expect(forbiddenHits(D.want)).toEqual([]);

    expect(D.menuHeading).toBe('In the inner rooms');
    expect(soundsIn(D.menuHeading)).toBe(0);
    const included = Object.values(ROOMS_COPY.rooms).map((r) => `${r.title} ${r.line}`).join(' ').toLowerCase();
    expect(included).toContain('every ten-year chapter');
    expect(included).toMatch(/love.*years/);
  });

  it('puts it in the first beat’s balloons, not the paper box (deeper-pitch.tsx)', () => {
    const src = readFileSync(path.join(ROOT, 'src/components/result/deeper-pitch.tsx'), 'utf8');
    expect(src).toContain('[...balloonsMax(bridge), D.want]');
    expect(src).toContain('D.menuHeading');
    expect(src).not.toMatch(/rs-menu__lead">\{D\.want\}/);
  });

  it('states the room price with no reservation or "not charged yet" line, and no timer or pressure (the lines the screen actually reads)', () => {
    const honest = D.honest(ROOMS_COPY.price);
    expect(honest).toBe('Each room is $6.29. Step into whichever one calls to you.');
    expect(honest).not.toMatch(/email|launch|not open|charged/i);
    expect('noCharge' in D).toBe(false);
    const shown = [
      D.lead,
      D.bridge(SAMPLE_CHAPTER, 'Mina', { month: 'May', year: 2026 }),
      D.bridgeGeneric,
      D.bridgeNoSex,
      D.want,
      D.menuHeading,
      honest,
      D.cta,
    ];
    for (const t of shown) {
      expect(t, t).not.toMatch(/hurry|limited time|last chance|only \d+ left|expires|ends (?:today|soon)|countdown|timer|% off|discount/i);
      expect(forbiddenHits(t), t).toEqual([]);
      expect(t, t).not.toMatch(/['"]/);
    }
  });
});

describe('2026-10-17 copy audit: the tells a native reader spots', () => {
  const concernAll: Labeled[] = textsOf(
    Object.fromEntries(CONCERN_KEYS.map((k) => [k, { lines: CONCERNS[k].lines, reaction: CONCERNS[k].reaction, title: CONCERNS[k].title }])),
    'concerns',
  );
  const LIBS: Record<string, Labeled[]> = {
    candy: textsOf(CANDY, 'candy'),
    salt: textsOf(SALT, 'salt'),
    traits: textsOf(TRAITS, 'traits'),
    concerns: concernAll,
    webtoon: textsOf(WEBTOON, 'webtoon'),
    reactions: textsOf(REACTIONS, 'reactions'),
    resultUi: textsOf(RESULT_UI, 'resultUi'),
    upsell: textsOf(UPSELL, 'upsell'),
    ui: textsOf(UI, 'ui'),
    types: textsOf(TYPE_PROFILES, 'types'),
    legal: textsOf(LEGAL, 'legal'),
    about: textsOf(ABOUT_MEDIA, 'about'),
    engine: textsOf(ENGINE_COPY, 'engine'),
  };
  const fourWords = (t: Labeled) => t.text.trim().split(/\s+/).length >= 4;

  const rendered = (): string[] => {
    const when = { month: 'May', year: 2026 };
    return [
      RESULT_UI.chapters.headline(SAMPLE_CHAPTER, when).lead,
      RESULT_UI.chapters.headline(SAMPLE_CHAPTER, when).detail,
      RESULT_UI.chapters.headline(SAMPLE_CHAPTER, null).detail,
      RESULT_UI.chapters.next(SAMPLE_CHAPTER, when) ?? '',
      RESULT_UI.chapters.restClosed(SAMPLE_CHAPTER) ?? '',
      RESULT_UI.deeper.bridge(SAMPLE_CHAPTER, 'Mina', when),
      RESULT_UI.deeper.bridge(SAMPLE_CHAPTER, '', null),
      RESULT_UI.deeper.honest('$3.99'),
      RESULT_UI.chapters.stripLabel(3, 8),
      UPSELL.chapters.headline(SAMPLE_CHAPTER),
      UPSELL.chapters.headline({ ...SAMPLE_CHAPTER, beforeStart: true }),
      UI.reading.progress(3, 8),
      UI.result.headline('Mina', 'Candle-born'),
      UI.result.chart.basis('Seoul', -32),
      UI.result.chart.notices.nearMidnight('Pine-born'),
      whenPhrase('Cold Dew', 'Start of Winter', '2026-11-07T04:00:00.000Z', 'en-US'),
      nextTermPhrase('Start of Winter', '2026-11-07T04:00:00.000Z'),
      monthStemReason('辛', '丁', 'power'),
      monthClashReason('卯', '酉'),
      yearClashReason('午', '子'),
      NOT_CURSE,
    ];
  };

  const codeOf = (file: string): string =>
    readFileSync(path.join(path.resolve(__dirname, '..'), file), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map((line) => line.replace(/(^|\s)\/\/.*$/, '$1'))
      .join('\n');

  it('has no em dash or en dash in any screen text, in the rendered helper lines, or in the content sources', () => {
    for (const [lib, texts] of Object.entries(LIBS)) {
      for (const { where, text } of texts) expect(text, `${lib}: ${where}`).not.toMatch(/[—–]/);
    }
    for (const text of rendered()) expect(text, text).not.toMatch(/[—–]/);
    for (const file of readdirSync(path.join(ROOT, 'src/content/en'))) {
      if (file.endsWith('.ts')) expect(codeOf(`src/content/en/${file}`), file).not.toMatch(/[—–]/);
    }
    expect(codeOf('src/lib/reading/phrases.ts')).not.toMatch(/[—–]/);
  });

  it('keeps the engine fragments in src/content/en (CLAUDE.md), and the salt “when” puts the easy fact first', () => {
    const src = readFileSync(path.join(ROOT, 'src/lib/reading/phrases.ts'), 'utf8');
    expect(src).toMatch(/from '@\/content\/(en\/)?engine'/);
    expect(src).not.toMatch(/This (?:month|year)’s|clashes with|awkward angle|softens things/);
    expect(whenPhrase('Cold Dew', 'Start of Winter', '2026-11-07T04:00:00.000Z', 'en-US')).toBe(
      'Now through early November, from Cold Dew to the Start of Winter',
    );
    expect(whenPhrase('Start of Winter', 'Major Snow', '2026-12-07T04:00:00.000Z', 'en-US')).toBe(
      'Now through early December, from Start of Winter to Major Snow',
    );
    expect(nextTermPhrase('Start of Winter', '2026-11-07T04:00:00.000Z')).toBe('the Start of Winter (around Nov 7)');
    expect(NOT_CURSE).toBe(WEBTOON.notCurse);
    expect(NOT_CURSE).toBe('Not a curse. Just weather.');
  });

  const COLON_LIST = /:\s[^.?!]+,\s[^.?!]+(?:,\s|,?\s(?:and|or)\s)/;

  it('keeps the “colon, then a list of three” sentence to 20% of each library at most', () => {
    const groups: Record<string, Labeled[]> = {
      ...LIBS,

      elementTalk: textsOf([WEBTOON.elementsDominant, WEBTOON.elementsMissing, WEBTOON.elementsBalanced], 'elements'),
      hitsCore: textsOf(TRAITS.core, 'core'),
    };
    for (const [lib, texts] of Object.entries(groups)) {
      const long = texts.filter(fourWords);
      if (long.length < 5) continue;
      const hits = long.filter(({ text }) => COLON_LIST.test(text));
      expect(hits.length / long.length, `${lib}: ${hits.map((h) => h.where).join(', ')}`).toBeLessThanOrEqual(0.2);
    }

    for (const { where, text } of groups.elementTalk) expect(text, where).not.toMatch(COLON_LIST);
  });

  it('keeps the “X, not Y” maxim and “It’s not X, it’s Y” rare in the reading libraries', () => {

    const reading = ['candy', 'salt', 'traits', 'webtoon', 'types'].flatMap((lib) => LIBS[lib]);
    const concernLines = concernAll.filter(({ where }) => where.includes('.lines.'));

    const NOT_Y = /,\s+not\s(?!all\b|only\b|every\b)/;
    const IT_ISNT = /\b(?:isn’t|aren’t|wasn’t|is not|are not)\b[^.?!;]*[;,.]\s+(?:it’s|that’s|it is|that is)\b/i;
    const maxims = [...reading, ...concernLines].filter(({ text }) => NOT_Y.test(text) || IT_ISNT.test(text));
    expect(maxims.map((m) => m.where), 'maxims left').toHaveLength(0);

    expect(WEBTOON.notCurse).toBe('Not a curse. Just weather.');
    expect(IT_ISNT.test(WEBTOON.notCurse)).toBe(false);
  });

  it('keeps “date” in 30% of the first bubbles (core hits) at most, so the love scene varies', () => {
    const core = textsOf(TRAITS.core, 'core').filter(({ where }) => where.endsWith('.text'));
    expect(core).toHaveLength(90);
    const withDate = core.filter(({ text }) => /\bdates?\b|\bdating\b/i.test(text));
    expect(withDate.length / core.length).toBeLessThanOrEqual(0.3);
  });

  it('uses no gender pronoun for Yul in alt texts, the about page, the terms, or anywhere on screen (CLAUDE.md)', () => {
    const PRONOUN = /\b(?:he|him|his|she|her|hers)\b/i;
    for (const lib of ['ui', 'legal', 'about', 'resultUi', 'upsell', 'webtoon', 'reactions', 'concerns']) {
      for (const { where, text } of LIBS[lib]) expect(text, `${lib}: ${where}`).not.toMatch(PRONOUN);
    }
  });

  it('replaces the stock phrases the audit singled out', () => {
    const everything = Object.values(LIBS).flat().map((l) => l.text).join('\n');
    expect(everything).not.toMatch(/own the lanterns|Honest is better than full|Learning yourself the way tea steeps|which doors to take|Different streets, same moon/);
    expect(everything).not.toMatch(/It’s not fickle|That’s not fear\. That’s packing|is a map, not a report card|Pressure is only attention in a heavy coat/);
    expect(UI.reading.steps.time.line).toBe('Around what time? If you don’t know, just say so. A blank beats a guess.');
    expect(CANDY.love.output[2].text).toBe('Your charm is turned all the way up, and you didn’t even touch the dial. Walk in like you own the place.');
    expect(RESULT_UI.deeper.lead).toBe('There’s another room further in. I only showed you this one.');
    expect(REACTIONS.place.general).toContain('{city}, got it. I’ll look up what the sky was doing over there that day.');
    expect(WEBTOON.pillarsLine).toContain('The calendar wrote these the day you were born. I just read them out.');
    expect(WEBTOON.elementsMissing.metal[1]).toBe(
      'No Metal here on the chart. If saying no takes you three drafts, someone who says it kindly can be quite impressive.',
    );
  });
});
