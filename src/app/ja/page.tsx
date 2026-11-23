import type { Metadata } from 'next';
import { landingMetadata } from '@/components/seo/landing-metadata';
import { LocaleLanding } from '@/components/seo/locale-landing';

export const metadata: Metadata = landingMetadata('ja');

export default function JapaneseLanding() {
  return <LocaleLanding locale="ja" />;
}
