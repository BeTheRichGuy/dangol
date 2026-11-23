import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { BundleView } from '@/components/bundle/bundle-view';
import { ENTER } from '@/components/scene/manifest';
import { Stage } from '@/components/stage';
import { BUNDLES_ON } from '@/lib/payments/bundle';

export const metadata: Metadata = { title: 'Five rooms, all at once', description: 'All five readings with one payment.', robots: { index: false } };

export default function BundlePage() {

  if (!BUNDLES_ON) redirect('/home#rooms');
  return (
    <Stage backdrop={ENTER.poster} night>
      <Suspense fallback={null}>
        <BundleView />
      </Suspense>
    </Stage>
  );
}
