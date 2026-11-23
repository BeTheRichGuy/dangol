import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArchiveView } from '@/components/account/archive-view';

export const metadata: Metadata = {
  title: 'My readings',
  robots: { index: false },
};

export default function ArchivePage() {
  return (
    <Suspense fallback={null}>
      <ArchiveView />
    </Suspense>
  );
}
