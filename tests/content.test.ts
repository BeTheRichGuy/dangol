import { describe, expect, it } from 'vitest';
import type { GodGroup, TypeKey } from '../src/lib/saju/types';
import type { CandyBook, ReadingLibrary, SaltLevel } from '../src/lib/reading/types';
import { TYPE_PROFILES } from '../src/content/en/types';
import { CANDY } from '../src/content/en/candy';
import { SALT } from '../src/content/en/salt';
import { LIBRARY, findCandy } from '../src/content/en/library';
import { LEGAL } from '../src/content/en/legal';
import { LEGAL_KO } from '../src/content/ko/legal';
import { LEGAL_JA } from '../src/content/ja/legal';

const TYPE_KEYS: TypeKey[] = [
  'pine', 'vine', 'sun', 'candle', 'mountain', 'field', 'blade', 'jewel', 'ocean', 'rain',
];
const GROUPS: GodGroup[] = ['peer', 'output', 'wealth', 'power', 'resource'];
const BOOKS: CandyBook[] = ['love', 'general'];
const LEVELS: SaltLevel[] = ['pinch', 'spoonful', 'handful'];

const MAX_CANDY = 160;
const MAX_SITUATION = 140;
const MAX_ACTION = 140;
const MAX_IDENTITY = 80;
const MAX_TYPE_LINE = 140;

const FORBIDDEN_ANYWHERE = [
  'cosmic', 'energy', 'universe', 'manifest', 'fyp', 'destined', 'soulmate', 'share for luck',
];

const FORBIDDEN_TOPICS = ['death', 'cancer', 'pregnan', 'lottery'];

const FORBIDDEN_TOPIC_WORDS = /\b(?:die|dies|died|dying)\b/i;

const FORBIDDEN_FATE = [
  'guarantee', 'definitely', 'for sure', 'inevitabl', 'fated', 'meant to be',
  'twin flame', 'karma', 'horoscope', 'zodiac', 'curse',
];

const GENDERED_PARTNER = /\b(?:he|him|his|she|her|hers|boyfriend|girlfriend|husband|wife|guy|girl|boy|man|men|woman|women)\b/i;
const EMOJI = /\p{Extended_Pictographic}/u;

const ENDS_LIKE_SENTENCE = /[.!?][”’]?$/;

function forbiddenHits(text: string, opts: { topics: boolean }): string[] {
  const lower = text.toLowerCase();
  const hits = FORBIDDEN_ANYWHERE.filter((w) => lower.includes(w));
  if (opts.topics) {
    hits.push(...FORBIDDEN_TOPICS.filter((w) => lower.includes(w)));
    const m = text.match(FORBIDDEN_TOPIC_WORDS);
    if (m) hits.push(m[0]);
  }
  return hits;
}

interface Labeled {
  where: string;
  text: string;
}

const candyLines = BOOKS.flatMap((book) =>
  GROUPS.flatMap((group) =>
    CANDY[book][group].map((line, i) => ({ book, group, index: i + 1, ...line })),
  ),
);
const saltLines = LEVELS.flatMap((level) =>
  GROUPS.flatMap((group) =>
    SALT[level][group].map((line, i) => ({ level, group, index: i + 1, ...line })),
  ),
);

const typeTexts: Labeled[] = TYPE_KEYS.flatMap((key) => {
  const p = TYPE_PROFILES[key];
  return [
    { where: `types.${key}.name`, text: p.name },
    { where: `types.${key}.born`, text: p.born },
    { where: `types.${key}.identity`, text: p.identity },
    { where: `types.${key}.inLove`, text: p.inLove },
    { where: `types.${key}.yulGreets`, text: p.yulGreets },
  ];
});
const candyTexts: Labeled[] = candyLines.map((l) => ({ where: `candy.${l.id}`, text: l.text }));
const saltTexts: Labeled[] = saltLines.flatMap((l) => [
  { where: `salt.${l.id}.situation`, text: l.situation },
  { where: `salt.${l.id}.action`, text: l.action },
]);

const legalDocs = Object.entries(LEGAL) as [keyof typeof LEGAL, (typeof LEGAL)[keyof typeof LEGAL]][];
function legalTexts(only?: (name: string) => boolean): Labeled[] {
  return legalDocs
    .filter(([name]) => (only ? only(name) : true))
    .flatMap(([name, doc]) => [
      { where: `legal.${name}.title`, text: doc.title },
      ...doc.sections.flatMap((s, i) => [
        { where: `legal.${name}.${i}.heading`, text: s.heading },
        ...s.body.map((t, j) => ({ where: `legal.${name}.${i}.body.${j}`, text: t })),
      ]),
    ]);
}

describe('type profiles', () => {
  it('has exactly the ten types', () => {
    expect(Object.keys(TYPE_PROFILES).sort()).toEqual([...TYPE_KEYS].sort());
  });

  it('matches the day-master table (stem + element) for each type', () => {
    const hanzi: Record<TypeKey, string> = {
      pine: '甲木', vine: '乙木', sun: '丙火', candle: '丁火', mountain: '戊土',
      field: '己土', blade: '庚金', jewel: '辛金', ocean: '壬水', rain: '癸水',
    };
    for (const key of TYPE_KEYS) {
      expect(TYPE_PROFILES[key].hanzi, key).toBe(hanzi[key]);
    }
  });

  it('fills every field in a consistent shape', () => {
    for (const key of TYPE_KEYS) {
      const p = TYPE_PROFILES[key];
      expect(p.key).toBe(key);
      expect(p.name).toBe(key[0].toUpperCase() + key.slice(1));
      expect(p.born).toBe(`${p.name}-born`);
      expect(p.hanzi).toMatch(/^[甲乙丙丁戊己庚辛壬癸][木火土金水]$/);
      expect(p.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      for (const field of ['identity', 'inLove', 'yulGreets'] as const) {
        expect(p[field].trim(), `${key}.${field}`).toBe(p[field]);
        expect(p[field].length, `${key}.${field}`).toBeGreaterThan(20);
        expect(p[field], `${key}.${field}`).toMatch(ENDS_LIKE_SENTENCE);
      }
    }
  });

  it('keeps lines short enough for the cards', () => {
    for (const key of TYPE_KEYS) {
      const p = TYPE_PROFILES[key];
      expect(p.identity.length, `${key}.identity`).toBeLessThanOrEqual(MAX_IDENTITY);
      expect(p.inLove.length, `${key}.inLove`).toBeLessThanOrEqual(MAX_TYPE_LINE);
      expect(p.yulGreets.length, `${key}.yulGreets`).toBeLessThanOrEqual(MAX_TYPE_LINE);
    }
  });

  it('gives every type its own words', () => {
    for (const field of ['name', 'hanzi', 'identity', 'inLove', 'yulGreets'] as const) {
      const values = TYPE_KEYS.map((k) => TYPE_PROFILES[k][field]);
      expect(new Set(values).size, field).toBe(values.length);
    }
  });
});

describe('candy', () => {
  it('has at least 4 lines for every book and group', () => {
    for (const book of BOOKS) {
      for (const group of GROUPS) {
        expect(CANDY[book][group].length, `${book}/${group}`).toBeGreaterThanOrEqual(4);
      }
    }
    expect(candyLines.length).toBeGreaterThanOrEqual(40);
  });

  it('keeps every line at or under 160 characters', () => {
    for (const l of candyLines) {
      expect(l.text.length, l.id).toBeLessThanOrEqual(MAX_CANDY);
      expect(l.text.length, l.id).toBeGreaterThan(30);
    }
  });

  it('has no stray whitespace and ends like a sentence', () => {
    for (const l of candyLines) {
      expect(l.text.trim(), l.id).toBe(l.text);
      expect(l.text, l.id).not.toMatch(/\s{2,}/);
      expect(l.text, l.id).toMatch(ENDS_LIKE_SENTENCE);
    }
  });

  it('has no repeated sentence', () => {
    const texts = candyLines.map((l) => l.text.toLowerCase());
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('never assumes the partner\'s gender and never promises', () => {
    for (const l of candyLines) {
      expect(l.text, l.id).not.toMatch(GENDERED_PARTNER);
      const lower = l.text.toLowerCase();
      expect(FORBIDDEN_FATE.filter((w) => lower.includes(w)), l.id).toEqual([]);
    }
  });
});

describe('salt', () => {
  it('has at least 2 entries for every level and group', () => {
    for (const level of LEVELS) {
      for (const group of GROUPS) {
        expect(SALT[level][group].length, `${level}/${group}`).toBeGreaterThanOrEqual(2);
      }
    }
    expect(saltLines.length).toBeGreaterThanOrEqual(30);
  });

  it('keeps situation and action at or under 140 characters each', () => {
    for (const l of saltLines) {
      expect(l.situation.length, `${l.id}.situation`).toBeLessThanOrEqual(MAX_SITUATION);
      expect(l.situation.length, `${l.id}.situation`).toBeGreaterThan(20);
      expect(l.action.length, `${l.id}.action`).toBeLessThanOrEqual(MAX_ACTION);
      expect(l.action.length, `${l.id}.action`).toBeGreaterThan(20);
    }
  });

  it('has no stray whitespace and ends like a sentence', () => {
    for (const l of saltLines) {
      for (const [part, text] of [['situation', l.situation], ['action', l.action]] as const) {
        expect(text.trim(), `${l.id}.${part}`).toBe(text);
        expect(text, `${l.id}.${part}`).not.toMatch(/\s{2,}/);
        expect(text, `${l.id}.${part}`).toMatch(ENDS_LIKE_SENTENCE);
      }
    }
  });

  it('has no repeated situation or action', () => {
    const situations = saltLines.map((l) => l.situation.toLowerCase());
    const actions = saltLines.map((l) => l.action.toLowerCase());
    expect(new Set(situations).size).toBe(situations.length);
    expect(new Set(actions).size).toBe(actions.length);
  });

  it('only carries situation and action (when and notCurse come from the engine)', () => {
    for (const level of LEVELS) {
      for (const group of GROUPS) {
        for (const entry of SALT[level][group]) {
          expect(Object.keys(entry).sort()).toEqual(['action', 'id', 'situation']);
        }
      }
    }
  });

  it('never assumes the partner\'s gender and never promises', () => {
    for (const l of saltLines) {
      for (const [part, text] of [['situation', l.situation], ['action', l.action]] as const) {
        expect(text, `${l.id}.${part}`).not.toMatch(GENDERED_PARTNER);
        const lower = text.toLowerCase();
        expect(FORBIDDEN_FATE.filter((w) => lower.includes(w)), `${l.id}.${part}`).toEqual([]);
      }
    }
  });
});

describe('ids', () => {
  it('are unique across candy and salt', () => {
    const ids = [...candyLines.map((l) => l.id), ...saltLines.map((l) => l.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('follow the documented pattern, so share links stay stable', () => {
    for (const l of candyLines) expect(l.id).toBe(`${l.book}-${l.group}-${l.index}`);
    for (const l of saltLines) expect(l.id).toBe(`${l.level}-${l.group}-${l.index}`);
    for (const l of [...candyLines, ...saltLines]) expect(l.id).toMatch(/^[a-z]+-[a-z]+-\d+$/);
  });
});

describe('library', () => {
  it('bundles candy and salt as a ReadingLibrary', () => {
    const lib: ReadingLibrary = LIBRARY;
    expect(lib.candy).toBe(CANDY);
    expect(lib.salt).toBe(SALT);
  });

  it('finds a candy line by id, and returns undefined for an unknown id', () => {
    for (const l of candyLines) expect(findCandy(l.id)).toEqual({ id: l.id, text: l.text });
    expect(findCandy('nope-nope-1')).toBeUndefined();
    expect(findCandy('pinch-peer-1')).toBeUndefined();
  });
});

describe('forbidden words and symbols', () => {
  it('keeps every library sentence free of forbidden vocabulary and topics', () => {
    const all = [...typeTexts, ...candyTexts, ...saltTexts];
    for (const { where, text } of all) {
      expect(forbiddenHits(text, { topics: true }), where).toEqual([]);
    }
  });

  it('keeps the legal pages free of the vocabulary list (topic words are allowed on /wont-read)', () => {
    for (const { where, text } of legalTexts()) {
      const onWontRead = where.startsWith('legal.wontRead.');
      expect(forbiddenHits(text, { topics: !onWontRead }), where).toEqual([]);
    }
  });

  it('uses typographic quotes and apostrophes, like src/content/en/ui.ts', () => {
    const all = [...typeTexts, ...candyTexts, ...saltTexts, ...legalTexts()];
    for (const { where, text } of all) {
      expect(text, where).not.toMatch(/['"]/);
    }
  });

  it('uses no emoji anywhere', () => {
    const all = [...typeTexts, ...candyTexts, ...saltTexts, ...legalTexts()];
    for (const { where, text } of all) {
      expect(text, where).not.toMatch(EMOJI);
    }
  });

  it('says the topic words on /wont-read, because that page exists to name them', () => {
    const text = legalTexts((n) => n === 'wontRead').map((t) => t.text).join(' ').toLowerCase();
    for (const word of ['death', 'illness', 'pregnan', 'lottery']) {
      expect(text, word).toContain(word);
    }
  });
});

describe('legal and static pages', () => {
  it('has the five documents in the agreed shape', () => {
    expect(Object.keys(LEGAL).sort()).toEqual(['about', 'pricing', 'privacy', 'refund', 'terms', 'wontRead']);
    for (const [name, doc] of legalDocs) {
      expect(doc.title.trim().length, name).toBeGreaterThan(0);
      expect(doc.updated.trim().length, name).toBeGreaterThan(0);
      expect(doc.sections.length, name).toBeGreaterThanOrEqual(3);
      for (const s of doc.sections) {
        expect(s.heading.trim().length, `${name}: heading`).toBeGreaterThan(0);
        expect(s.body.length, `${name}: ${s.heading}`).toBeGreaterThan(0);
        for (const para of s.body) {
          expect(para.trim().length, `${name}: ${s.heading}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('has unique section headings inside each document', () => {
    for (const [name, doc] of legalDocs) {
      const headings = doc.sections.map((s) => s.heading);
      expect(new Set(headings).size, name).toBe(headings.length);
    }
  });

  it('pricing lists all five rooms with their own price in every language, plus the other currencies', () => {
    const cases = [
      ['en', LEGAL, '$6.29', ['The many sides of you', '4,900원', '890円', 'Toss Payments']],
      ['ko', LEGAL_KO, '4,900원', ['$6.29', '890円', '토스페이먼츠', '부가세 포함']],
      ['ja', LEGAL_JA, '890円', ['$6.29', '4,900원']],
    ] as const;
    for (const [locale, docs, price, extra] of cases) {
      const sections = docs.pricing.sections;
      const text = sections.map((s) => `${s.heading}\n${s.body.join('\n')}`).join('\n');
      expect(sections.filter((s) => s.body.some((b) => b.includes(price))).length, `${locale} rooms with price`).toBeGreaterThanOrEqual(5);
      for (const t of extra) expect(text, `${locale}: ${t}`).toContain(t);
      expect(text, locale).not.toMatch(/\[[^\]]+\]/);
    }
  });

  it('privacy, terms and refund are final in every language: no draft notice, no blank slots, no Paddle', () => {
    for (const [locale, docs] of [['en', LEGAL], ['ko', LEGAL_KO], ['ja', LEGAL_JA]] as const) {
      for (const key of ['privacy', 'terms', 'refund'] as const) {
        const text = docs[key].sections.map((s) => `${s.heading}\n${s.body.join('\n')}`).join('\n');
        expect(text, `${locale}.${key}`).not.toMatch(/\[[^\]]+\]/);
        expect(text, `${locale}.${key}`).not.toContain('before launch');
        expect(text, `${locale}.${key}`).not.toMatch(/draft|초안|草案/i);
        expect(text, `${locale}.${key}`).not.toContain('Paddle');
      }
    }
  });

  it('about explains the calculation and the tagline', () => {
    const text = legalTexts((n) => n === 'about').map((t) => t.text).join('\n');
    expect(text).toContain('The calendar does the math. Yul does the talking.');
    for (const phrase of [
      'local mean solar time', 'Start of Spring', 'solar terms', 'midnight', 'How Yul reads it',
      'fictional', 'Just weather',
    ]) {
      expect(text, phrase).toContain(phrase);
    }
  });

  it('wont-read ends on its signature line', () => {
    const sections = LEGAL.wontRead.sections;
    expect(sections[sections.length - 1].body).toContain('Ask me something you can carry.');
    expect(LEGAL.wontRead.title).toBe('Things I won’t read');
  });

  it('privacy says birth details stay in the browser and names what it collects', () => {
    const text = legalTexts((n) => n === 'privacy').map((t) => t.text).join('\n').toLowerCase();
    for (const phrase of [
      'birth date', 'browser', 'do not send', 'email', '18', 'utm', 'session storage', 'type',
    ]) {
      expect(text, phrase).toContain(phrase);
    }
  });

  it('terms says entertainment, fictional characters, generative AI notice, 18+, no payment yet, and not professional advice', () => {
    const text = legalTexts((n) => n === 'terms').map((t) => t.text).join('\n').toLowerCase();
    for (const phrase of [
      'entertainment', 'amusement only', 'not a prediction', 'generative ai', '18 or older', 'no payment',
      'not professional advice', 'fictional',
    ]) {
      expect(text, phrase).toContain(phrase);
    }
  });

  it('terms puts entertainment first: the self-reflection angle is only a bonus, never the purpose', () => {
    const what = LEGAL.terms.sections.find((s) => s.heading === 'What DANGOL is');
    expect(what, 'What DANGOL is').toBeDefined();
    const text = what!.body.join(' ');
    expect(text).toMatch(/^DANGOL is offered for entertainment and amusement only\./);
    expect(text).toContain('not a prediction of your future');
    expect(text.toLowerCase()).not.toContain('self-reflection');

    expect(text.indexOf('amusement only')).toBeLessThan(text.indexOf('bonus'));

    const about = legalTexts((n) => n === 'about').map((t) => t.text).join('\n');
    expect(about).not.toMatch(/for reflection and fun/i);
    expect(about).toContain('for entertainment and fun');
  });

  it('terms names the operator and Korean law, closing the site, and as-is wording', () => {
    const headings = LEGAL.terms.sections.map((s) => s.heading);
    expect(headings).toContain('If we change or close the site');
    const who = LEGAL.terms.sections.find((s) => s.heading === 'Who we are, and which law applies');
    expect(who, 'Who we are').toBeDefined();
    const whoText = who!.body.join(' ');
    for (const fact of ['DokkaebiWorks', '629-04-03844', 'admin@dokkaebiworks.com', 'Republic of Korea']) {
      expect(whoText, fact).toContain(fact);
    }
    const close = LEGAL.terms.sections.find((s) => s.heading === 'If we change or close the site');
    expect(close!.body.join(' ')).toContain('we will delete the emails on it');
    const none = LEGAL.terms.sections.find((s) => s.heading === 'No guarantees');
    expect(none!.body.join(' ')).toContain('“as is” and “as available.”');
  });

  it('privacy does not claim to collect less than it does', () => {
    const short = LEGAL.privacy.sections.find((s) => s.heading === 'The short version');
    expect(short, 'The short version').toBeDefined();
    const shortText = short!.body.join(' ');
    expect(shortText).not.toMatch(/the only thing we collect/i);
    expect(shortText).toContain('listed below');
    const collect = LEGAL.privacy.sections.find((s) => s.heading === 'What we collect');
    const collectText = collect!.body.join(' ').toLowerCase();
    for (const item of ['email', 'utm', 'regular number', 'type', 'signed up from']) {
      expect(collectText, item).toContain(item);
    }
  });

  it('privacy tells the truth about share images: server request, type line, optional regular number', () => {
    const browser = LEGAL.privacy.sections.find((s) => s.heading === 'What stays in your browser');
    expect(browser, 'What stays in your browser').toBeDefined();
    const text = browser!.body.join(' ');
    expect(text).toContain('/?t=candle');
    expect(text).toContain('your type, a line about it');
    expect(text).toContain('your regular number if you add it');
    expect(text).toContain('your browser asks our server');
    expect(text).toContain('Never your birth details or your name.');

    expect(text).not.toContain('your candy line');
  });

  it('privacy has the sections a reader needs: logs, storage place, retention, changes, contact', () => {
    const byHeading = new Map(LEGAL.privacy.sections.map((s) => [s.heading, s.body.join(' ')]));
    for (const heading of [
      'Technical logs', 'Where your data is stored', 'How long we keep it', 'Changes to this policy', 'Contact',
    ]) {
      expect(byHeading.has(heading), heading).toBe(true);
    }
    expect(byHeading.get('Technical logs')).toMatch(/IP address/);

    expect(byHeading.get('Why we use it')).toMatch(/do not sell[\s\S]*Meta/);
    expect(byHeading.get('Cookies and trackers')).toMatch(/only in a tab you opened by tapping one of our Instagram or Facebook ads/);
    expect(byHeading.get('Cookies and trackers')).toMatch(/never send your name, birth details/);
    expect(byHeading.get('How long we keep it')).toMatch(/unsubscribe or ask us to delete it/);
    expect(byHeading.get('Where your data is stored')).toContain('Seoul');
    expect(byHeading.get('Changes to this policy')).toContain('tell you by email before it takes effect');
    const contact = byHeading.get('Contact')!;
    for (const fact of ['DokkaebiWorks', 'admin@dokkaebiworks.com', 'privacy officer']) expect(contact, fact).toContain(fact);
    expect(contact).toContain('within 10 days');
  });

  it('privacy names every processor, the transfers outside Korea, and the paid AI tier', () => {
    const byHeading = new Map(LEGAL.privacy.sections.map((s) => [s.heading, s.body.join(' ')]));
    const who = byHeading.get('Who else sees it')!;

    for (const name of ['Vercel', 'Supabase', 'Google', 'Toss Payments', 'NHN KCP', 'Kakao Pay', 'Viva Republica', 'PortOne', 'Dodo Payments']) expect(who, name).toContain(name);
    for (const [locale, docs, toss] of [['en', LEGAL, 'Toss Payments'], ['ko', LEGAL_KO, '토스페이먼츠'], ['ja', LEGAL_JA, 'Toss Payments']] as const) {
      const text = [docs.privacy, docs.terms].flatMap((d) => d.sections.flatMap((s) => s.body)).join(' ');
      expect(text, locale).toContain(toss);
    }
    const abroad = byHeading.get('Transfers outside Korea')!;
    for (const name of ['Vercel', 'Google', 'United States']) expect(abroad, name).toContain(name);
    expect(byHeading.get('Payments')).toMatch(/five years/);
    const all = LEGAL.privacy.sections.map((s) => s.body.join(' ')).join(' ');
    expect(all).not.toMatch(/free tier/i);
    expect(all).toMatch(/paid tier/i);
  });

  it('privacy explains the anonymous usage statistics in every language', () => {
    const en = LEGAL.privacy.sections.find((s) => s.heading === 'Anonymous usage statistics')!.body.join(' ');
    for (const t of ['random code', 'tab closes', 'birth date', 'IP address', 'Supabase', '2 years', 'tokens']) expect(en, t).toContain(t);
    expect(LEGAL_KO.privacy.sections.some((s) => s.heading === '익명 이용 통계')).toBe(true);
    expect(LEGAL_JA.privacy.sections.some((s) => s.heading === '匿名の利用統計')).toBe(true);
  });

  it('refund policy limits withdrawal only after writing starts, and redoes or refunds errors', () => {
    const text = LEGAL.refund.sections.map((s) => s.body.join(' ')).join('\n');
    for (const phrase of ['Article 17', 'digital content', 'not points', 'write it again', 'full amount', '3 business days', 'admin@dokkaebiworks.com']) {
      expect(text, phrase).toContain(phrase);
    }
  });

  it('about names the good news and the bad news plainly, and frames bad news as weather', () => {
    const text = legalTexts((n) => n === 'about').map((t) => t.text).join('\n');
    expect(text).toContain('The good news is one good thing, said kindly.');
    expect(text).toContain('never a verdict and never a curse');
    expect(text).not.toMatch(/candy|pinch of salt|spoonful|handful/i);
  });
});

describe('wording that reads wrong to native speakers', () => {

  const BANNED_PHRASES = [
    'a climber',
    'you smell like',
    'your own kind',
    'quite plainly',
    'seat at the table',
    'the bus is not the point',
    'equally foggy',
    'give the others a kind pause',
    'instead of the whole one',
    'stand tall about it',
  ];

  it('keeps the flagged phrases out of the type profiles, candy, and salt', () => {
    const all = [...typeTexts, ...candyTexts, ...saltTexts];
    for (const { where, text } of all) {
      const lower = text.toLowerCase();
      expect(BANNED_PHRASES.filter((w) => lower.includes(w)), where).toEqual([]);
    }
  });

  it('describes Sogeum as the sleeping white kitten in a tiny red hat, never the old black-hat cat that steals candy (SPEC 10장, 11.1)', () => {
    const about = legalTexts((n) => n === 'about').map((t) => t.text).join('\n');
    expect(about).toContain('fluffy white kitten in a tiny red hat');
    expect(about).not.toMatch(/black gat|black hat|steals candy/i);
    for (const p of Object.values(TYPE_PROFILES)) {
      expect(p.yulGreets, p.key).not.toMatch(/Sogeum (?:just )?(?:hopped|jumped|ran|climbed|steals|stole|is circling|is pawing)/i);
    }
  });

  it('greets vine and rain without the flagged lines', () => {
    expect(TYPE_PROFILES.vine.yulGreets).toContain('Ah, a vine.');
    expect(TYPE_PROFILES.rain.yulGreets).toMatch(/^You walk in like the air before a good rain\./);
  });

  it('keeps salt actions to a small thing for today and never asks the reader to pick a person', () => {

    expect(SALT.spoonful.wealth[1].action).toBe(
      'Notice which option you think about first when you wake up. Just notice, for today.',
    );
    expect(SALT.pinch.power[0].action).toBe(
      'Skip the big talk today. Ask one gentle question instead: “What are you hoping for?”',
    );
  });

  it('does not state what the other person feels (handful/resource)', () => {
    expect(SALT.handful.resource[2].situation).not.toMatch(/for both of you/);
    expect(SALT.handful.resource[2].situation).toContain('one pair of shoulders');
  });

  it('keeps the rewritten candy lines specific, not Barnum-style', () => {

    expect(CANDY.love.wealth[5].text).toContain('a time, a place, a reason to dress up');
    expect(CANDY.love.wealth[5].text).not.toMatch(/coffee|name a day/);
    expect(CANDY.love.peer[0].text).toContain('comfortable silence');
    expect(CANDY.general.peer[0].id).toBe('general-peer-1');
    expect(CANDY.love.power[2].id).toBe('love-power-3');
  });
});
