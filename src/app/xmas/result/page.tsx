import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { XMAS_OPEN } from '@/lib/xmas/open';
import { TrackView } from '@/components/track-view';
import { XmasResult } from '@/components/xmas/xmas-result';

export const metadata: Metadata = {
  title: '연의 크리스마스 그 사람 사주',
  robots: { index: false },
};

export default function Page() {
  if (!XMAS_OPEN) notFound();
  return (
    <>
      <TrackView name="xmas_result" />
      <XmasResult />
    </>
  );
}
