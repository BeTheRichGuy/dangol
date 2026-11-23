import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CARD_ART_FILES, yulArtFor } from '../src/app/api/card/art';
import { CARD_WIDTHS, parseCardLocale, parseCardParams } from '../src/app/api/card/params';
import { UI as UI_EN } from '../src/content/en/ui';
import { UI_JA } from '../src/content/ja/ui';
import { UI_KO } from '../src/content/ko/ui';
import { TYPE_PROFILES } from '../src/content/en/types';

const ASSETS = join(__dirname, '../src/app/api/card/assets');
const TYPE_KEYS = Object.keys(TYPE_PROFILES);

const MAX_BYTES = 150 * 1024;

function expectJpeg(path: string) {
  expect(existsSync(path), path).toBe(true);
  const data = readFileSync(path);
  expect([data[0], data[1], data[2]], `${path} is not a JPEG`).toEqual([0xff, 0xd8, 0xff]);
  expect(statSync(path).size, `${path} is too large`).toBeLessThanOrEqual(MAX_BYTES);
}

const parse = (query: string) => parseCardParams(new URLSearchParams(query), TYPE_PROFILES);

describe('card pictures', () => {
  it('has the Yul close-ups and the napping Sogeum cut, each under 150KB', () => {
    for (const file of Object.values(CARD_ART_FILES)) expectJpeg(join(ASSETS, file));
  });

  it('keeps no unused pictures in assets/ (old emblem medals and the old sticker are gone)', () => {
    expect(readdirSync(ASSETS).sort()).toEqual(Object.values(CARD_ART_FILES).sort());
  });

  it('gives every type a Yul picture, using both close-ups', () => {
    const used = new Set(TYPE_KEYS.map((key) => yulArtFor(key)));
    expect(TYPE_KEYS).toHaveLength(10);
    expect([...used].sort()).toEqual(['oho', 'reassure']);
    for (const key of TYPE_KEYS) expect(existsSync(join(ASSETS, CARD_ART_FILES[yulArtFor(key)])), key).toBe(true);
    expect(yulArtFor(null)).toBe('reassure');
  });
});

describe('card params', () => {
  it('hands the type to the route with what the speech bubble and the paper box need', () => {
    for (const key of TYPE_KEYS) {
      const { type } = parse(`t=${key}`);
      expect(type?.key).toBe(key);
      expect(type?.identity.length).toBeGreaterThan(0);
      expect(type?.hanzi).toHaveLength(2);
    }
    expect(parse('t=dragon').type).toBeNull();
    expect(parse('t=constructor').type).toBeNull();
  });

  it('ignores the old candy id: the bubble is the type line now', () => {
    expect(parse('t=candle&c=love-power-2')).toEqual({ type: TYPE_PROFILES.candle, regularNo: null, og: false, width: null, month: null });
  });

  it('only allows the listed small widths, so the cache does not scatter', () => {
    expect(CARD_WIDTHS).toContain(544);
    for (const w of CARD_WIDTHS) expect(parse(`t=candle&w=${w}`).width).toBe(w);
    for (const bad of ['0', '-544', '543', '4000', 'abc', '544.5', '']) expect(parse(`t=candle&w=${bad}`).width, bad).toBeNull();
  });

  it('reads the landscape flag and a human regular number', () => {
    expect(parse('t=candle&og=1').og).toBe(true);
    expect(parse('t=candle&og=0').og).toBe(false);
    expect(parse('t=candle&no=317').regularNo).toBe(317);
    expect(parse('t=candle&no=4').regularNo).toBeNull();
    expect(parse('t=candle&no=abc').regularNo).toBeNull();
  });
});

describe('letter card (세로 유형 카드, 2026-10-27)', () => {
  it('reads the card language and falls back to English', () => {
    const lang = (q: string) => parseCardLocale(new URLSearchParams(q));
    expect(lang('l=ko')).toBe('ko');
    expect(lang('l=JA')).toBe('ja');
    expect(lang('l=fr')).toBe('en');
    expect(lang('')).toBe('en');
  });

  it('has its own story copy in each language (written per language, not the English left in place)', () => {
    const en = UI_EN.card.story;
    for (const story of [UI_KO.card?.story, UI_JA.card?.story]) {
      expect(story).toBeDefined();
      for (const key of ['eyebrow', 'kicker', 'inLove', 'ask'] as const) {
        expect(story![key]).toBeTruthy();
        expect(story![key]).not.toBe(en[key]);
      }
    }
  });

  it('gives every type a love line for the card', () => {
    for (const key of TYPE_KEYS) expect(TYPE_PROFILES[key as keyof typeof TYPE_PROFILES].inLove.length).toBeGreaterThan(10);
  });
});
