import type { Metadata } from 'next';
import { LEGAL } from '@/content/en/legal';
import { LegalDocument } from './_components/legal-document';

import { legalMetadata } from '@/app/about/_components/legal-metadata';

export const metadata: Metadata = legalMetadata(LEGAL.about);

export default function AboutPage() {
  return <LegalDocument legalKey="about" path="/about" portrait />;
}
