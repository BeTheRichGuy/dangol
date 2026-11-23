import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FlowFallback } from '@/components/flow/flow-shell';
import { TypeFlow } from '@/components/flow/type-flow';

export const metadata: Metadata = {
  title: 'Your Korean type in 10 seconds',
  description: 'Tell Yul your birthday and he tells you which Korean type you are. Ten seconds, no email.',
};

export default function TypePage() {
  return (
    <Suspense fallback={<FlowFallback scene="listen" />}>
      <TypeFlow />
    </Suspense>
  );
}
