import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReunionFlow } from '@/components/reunion/reunion-flow';
import { ENTER } from '@/components/scene/manifest';
import { Stage } from '@/components/stage';

export const metadata: Metadata = {
  title: 'After the goodbye: a free reunion reading',
  description: 'Two birth dates, a few questions. See where the two of you drifted apart and one thing that is yours to try.',

  robots: { index: false },
};

export default function ReunionPage() {
  return (
    <Stage backdrop={ENTER.poster} night>
      <Suspense fallback={null}>
        <ReunionFlow />
      </Suspense>
    </Stage>
  );
}
