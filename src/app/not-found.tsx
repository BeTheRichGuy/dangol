import type { Metadata } from 'next';
import { UI } from '@/content/en/ui';
import { NotFoundContent } from '@/components/not-found-content';

export const metadata: Metadata = { title: UI.notFound.metaTitle };

export default function NotFound() {
  return <NotFoundContent />;
}
