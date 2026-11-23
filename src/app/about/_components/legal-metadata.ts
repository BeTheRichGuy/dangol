import type { Metadata } from 'next';
import type { LegalDoc } from '@/content/en/legal';
import { isDraftHeading } from '@/content/legal';

export function legalMetadata(doc: LegalDoc): Metadata {
  const first = doc.sections.find((section) => !isDraftHeading(section.heading)) ?? doc.sections[0];
  const text = first?.body[0] ?? doc.title;
  if (text.length <= 160) return { title: doc.title, description: text };
  const cut = text.slice(0, 159);
  const lastSpace = cut.lastIndexOf(' ');
  return { title: doc.title, description: `${cut.slice(0, lastSpace > 80 ? lastSpace : cut.length).trimEnd()}…` };
}
