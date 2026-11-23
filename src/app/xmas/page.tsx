import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { XMAS_OPEN } from '@/lib/xmas/open';
import { TrackView } from '@/components/track-view';
import { XmasLanding } from '@/components/xmas/xmas-landing';

export const metadata: Metadata = {
  title: '연의 크리스마스 그 사람 사주',
  robots: { index: false },
};

export default function XmasPage() {
  if (!XMAS_OPEN) notFound();
  return (
    <>
      <TrackView name="xmas_view" landing />
      <XmasLanding />
    </>
  );
}
