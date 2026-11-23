import type { Metadata } from 'next';
import { LEGAL } from '@/content/en/legal';
import { LegalDocument } from '@/app/about/_components/legal-document';

import { legalMetadata } from '@/app/about/_components/legal-metadata';

export const metadata: Metadata = legalMetadata(LEGAL.terms);

export default function TermsPage() {
  return <LegalDocument legalKey="terms" path="/terms" />;
}
