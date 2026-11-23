import { afterEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ABOUT_MEDIA } from '@/content/about';
import { LEGAL, isDraftHeading, legalSectionIds, type LegalKey } from '@/content/legal';
import { LEGAL as EN } from '@/content/en/legal';
import { LEGAL_KO } from '@/content/ko/legal';
import { LEGAL_JA } from '@/content/ja/legal';
import { setActiveLocaleForTest } from '@/content/locale';
import { legalMetadata } from '@/app/about/_components/legal-metadata';
import { LegalDocument } from '@/app/about/_components/legal-document';
import { UI } from '@/content/ui';
import { READING_TALK, TYPE_TALK } from '@/components/flow/script';

afterEach(() => setActiveLocaleForTest('en'));

describe('localized legal documents', () => {
  it.each(['ko', 'ja'] as const)('%s switches every document and portrait description', (locale) => {
    const englishAlt = ABOUT_MEDIA.portraitAlt;
    const cachedDoc = LEGAL.privacy;
    setActiveLocaleForTest(locale);
    const source = locale === 'ko' ? LEGAL_KO : LEGAL_JA;
    for (const key of Object.keys(EN) as LegalKey[]) {
      expect(LEGAL[key].title).toBe(source[key].title);
      expect(LEGAL[key].sections.length).toBe(EN[key].sections.length);
      expect(LEGAL[key].sections[0].body[0]).toBe(source[key].sections[0].body[0]);
      const ids = legalSectionIds(LEGAL[key].sections);
      expect(new Set(ids).size).toBe(ids.length);
    }
    expect(cachedDoc.title).toBe(source.privacy.title);
    expect(ABOUT_MEDIA.portraitAlt).not.toBe(englishAlt);
    for (const key of ['privacy', 'terms', 'refund'] as const) {
      expect(source[key].sections.some((s) => isDraftHeading(s.heading)), key).toBe(false);
    }
  });

  it('uses readable unique anchors for Korean, Japanese, and colliding suffixes', () => {
    const ids = legalSectionIds(['개인정보', '개인정보', '개인정보-2', '鑑定について', '鑑定について', '!'].map((heading) => ({ heading })));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('개인정보');
    expect(ids[3]).toBe('鑑定について');
    expect(ids[5]).toBe('section');
  });

  it('keeps server metadata in English and excludes the draft notice', () => {
    setActiveLocaleForTest('ja');
    const meta = legalMetadata(EN.privacy);
    expect(meta.title).toBe('Privacy Policy');
    expect(meta.description).toContain('sign in');
    expect(meta.description).not.toContain('draft');
  });

  it.each(['en', 'ko', 'ja'] as const)('%s renders the translated title, sections, and footer links', (locale) => {
    setActiveLocaleForTest(locale);
    const html = renderToStaticMarkup(createElement(LegalDocument, { legalKey: 'privacy', path: '/privacy' }));
    expect(html).toContain(LEGAL.privacy.title);
    expect(html).not.toContain('<aside');
    expect(html).toContain(LEGAL.privacy.sections[0].heading);
    expect(html).toContain(UI.common.links.about);
    expect(html).toContain(UI.prose.backHome);
  });

  it.each(['ko', 'ja'] as const)('%s updates questions created before the language was selected', (locale) => {
    const firstQuestion = TYPE_TALK[0].question;
    setActiveLocaleForTest(locale);
    expect(TYPE_TALK[0].question).toBe(UI.type.steps.date.line);
    expect(TYPE_TALK[0].question).not.toBe(firstQuestion);
    expect(TYPE_TALK[1].question).toBe(UI.type.steps.midnight.line);
    expect(READING_TALK[0].question).toBe(UI.reading.steps.greeting.line);
    expect(READING_TALK.find((step) => step.id === 'nb')?.question).toBe(UI.reading.steps.sex.nbLine);
  });
});
