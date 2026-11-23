import type { Metadata } from 'next';
import { landingMetadata } from '@/components/seo/landing-metadata';
import { LocaleLanding } from '@/components/seo/locale-landing';

export const metadata: Metadata = landingMetadata('ko');

export default function KoreanLanding() {
  return <LocaleLanding locale="ko" />;
}
