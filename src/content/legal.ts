import { LEGAL as EN } from './en/legal';
import { LEGAL_KO } from './ko/legal';
import { LEGAL_JA } from './ja/legal';
import { localized } from './locale';

export const LEGAL = localized({ en: EN, ko: LEGAL_KO, ja: LEGAL_JA });
export type LegalKey = keyof typeof EN;
export type { LegalDoc, LegalSection } from './en/legal';

export function isDraftHeading(heading: string): boolean {
  return ['Draft notice', '초안 안내', '公開前の草案'].includes(heading);
}

export function legalSectionIds(sections: readonly { heading: string }[]): string[] {
  const used = new Set<string>();
  return sections.map(({ heading }) => {
    const base = heading.toLowerCase().replace(/['’]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'section';
    let id = base;
    let count = 1;
    while (used.has(id)) id = `${base}-${++count}`;
    used.add(id);
    return id;
  });
}
