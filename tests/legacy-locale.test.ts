import { afterEach, describe, expect, it } from 'vitest';
import { CONCERNS, CONCERN_ORDER } from '@/content/concerns';
import { CONCERNS as EN_CONCERNS } from '@/content/en/concerns';
import { REACTIONS as EN_REACTIONS } from '@/content/en/reactions';
import { CONCERNS_KO } from '@/content/ko/concerns';
import { CONCERNS_JA } from '@/content/ja/concerns';
import { REACTIONS_KO, HOUR_ANIMAL_NAMES_KO } from '@/content/ko/reactions';
import { REACTIONS_JA, HOUR_ANIMAL_NAMES_JA } from '@/content/ja/reactions';
import { REACTIONS, pickReaction } from '@/content/reactions';
import { setActiveLocaleForTest } from '@/content/locale';
import { pickByHash } from '@/lib/reading/hash';
import { EMPTY_ANSWERS } from '@/components/flow/answers';
import { buildResultModel } from '@/components/result/result-data';
import { concernChapterTitle } from '@/components/result/webtoon-text';

afterEach(() => setActiveLocaleForTest('en'));

function strings(value: unknown, path = ''): Record<string, string> {
  if (typeof value === 'string') return { [path]: value };
  if (!value || typeof value !== 'object') return {};
  return Object.assign({}, ...Object.entries(value).map(([key, part]) => strings(part, `${path}.${key}`)));
}

function shape(value: unknown): unknown {
  if (typeof value === 'string') return 'string';
  if (Array.isArray(value)) return value.map(shape);
  if (!value || typeof value !== 'object') return typeof value;
  return Object.fromEntries(Object.entries(value).map(([key, part]) => [key, shape(part)]));
}

function slots(text: string): string[] {
  return [...text.matchAll(/\{\w+\}/g)].map((match) => match[0]).sort();
}

const languages = [
  { locale: 'ko', concerns: CONCERNS_KO, reactions: REACTIONS_KO, animals: HOUR_ANIMAL_NAMES_KO },
  { locale: 'ja', concerns: CONCERNS_JA, reactions: REACTIONS_JA, animals: HOUR_ANIMAL_NAMES_JA },
] as const;

describe.each(languages)('$locale legacy readings and conversations', ({ locale, concerns, reactions, animals }) => {
  it('covers all concerns and reaction pools with matching IDs, candidate counts, and placeholders', () => {
    expect(shape(concerns)).toEqual(shape(EN_CONCERNS));
    expect(shape(reactions)).toEqual(shape(EN_REACTIONS));
    for (const [english, translated] of [[EN_CONCERNS, concerns], [EN_REACTIONS, reactions]]) {
      const source = strings(english);
      const target = strings(translated);
      expect(Object.keys(target).sort()).toEqual(Object.keys(source).sort());
      for (const [key, text] of Object.entries(source)) {
        expect(slots(target[key]), key).toEqual(slots(text));
        if (/\.(?:id|group|book)$/.test(key)) expect(target[key], key).toBe(text);
        else expect(target[key], key).not.toBe(text);
      }
    }
  });

  it('switches cached libraries and chooses the same indexed reaction candidates for every seed', () => {
    const cached = CONCERNS.love;
    setActiveLocaleForTest(locale);
    expect(cached.label).toBe(concerns.love.label);
    expect(REACTIONS.name.named[0]).toBe(reactions.name.named[0]);
    for (let i = 0; i < 20; i++) {
      const seed = `locale-${i}`;
      expect(pickReaction('name', { name: 'Mia' }, seed)).toBe(pickByHash(reactions.name.named, `name|${seed}`).replace('{name}', 'Mia'));
      expect(pickReaction('date', { date: '1995-01-05' }, seed)).toBe(pickByHash(reactions.date.periods['jan-early'], `date|${seed}|jan-early`));
      expect(pickReaction('time', { time: '21:10' }, seed)).toBe(pickByHash(reactions.time.hours.pig, `time|${seed}|pig`));
      expect(pickReaction('focus', { focus: 'love' }, seed)).toBe(pickByHash(reactions.focus.love, `focus|${seed}`));
      expect(pickReaction('sex', { sex: 'female' }, seed)).toBe(pickByHash(reactions.sex.chosen, `sex|${seed}|female`));
      const shifted = pickByHash(reactions.place.sunShift, `place|${seed}|shift|rat|pig`)
        .replace('{city}', 'Seoul').replace('{sun}', animals.pig).replace('{clock}', animals.rat);
      expect(pickReaction('place', { place: { name: 'Seoul, KR', lat: 37.5 }, time: '23:30', solarHour: '22:30' }, seed)).toBe(shifted);
    }
  });

  it('reopens saved concern readings in the selected language without changing their selected IDs', () => {
    const now = '2026-10-15T00:00:00Z';
    const base = {
      ...EMPTY_ANSWERS,
      date: '1995-03-14', time: '09:30', timeAnswered: true,
      place: { name: 'Seoul', label: 'Seoul, KR', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' },
    };
    for (const concern of CONCERN_ORDER) {
      setActiveLocaleForTest('en');
      const english = buildResultModel({ ...base, concern }, now);
      setActiveLocaleForTest(locale);
      const translated = buildResultModel({ ...base, concern }, now);
      expect(english?.concernLine).not.toBeNull();
      expect(translated?.concernLine?.id).toBe(english?.concernLine?.id);
      expect(translated?.concernLine?.text).not.toBe(english?.concernLine?.text);
      expect(translated?.concernLine?.text).not.toMatch(/\{next\}|January|February|November/);
      expect(concernChapterTitle(concern)).toContain(concerns[concern].title);
    }
  });
});
