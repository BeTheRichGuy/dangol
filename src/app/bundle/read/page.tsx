import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BundleReadView } from '@/components/bundle/bundle-read-view';
import { ENTER } from '@/components/scene/manifest';
import { Stage } from '@/components/stage';

export const metadata: Metadata = { title: 'Your five readings', robots: { index: false } };

export default function BundleReadPage() {
  return (
    <Stage backdrop={ENTER.poster} night>
      <Suspense fallback={null}>
        <BundleReadView />
      </Suspense>
    </Stage>
  );
}
