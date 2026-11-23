import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FlowFallback } from '@/components/flow/flow-shell';
import { GateArrival } from '@/components/flow/gate-arrival';
import { ReadingFlow } from '@/components/flow/reading-flow';

export const metadata: Metadata = {
  title: 'Your reading',

  robots: { index: false },
};

export default function ReadingPage() {
  return (
    <>
      <Suspense fallback={<FlowFallback scene="listen" />}>
        <ReadingFlow />
      </Suspense>
      <GateArrival />
    </>
  );
}
