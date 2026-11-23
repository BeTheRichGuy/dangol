import type { Metadata } from 'next';
import { HomeMain } from '@/components/account/home-main';
import { ENTER } from '@/components/scene/manifest';
import { Stage } from '@/components/stage';

export const metadata: Metadata = {
  title: 'Your shrine',
  robots: { index: false },
};

export default function HomePage() {
  return (
    <Stage backdrop={ENTER.poster} night>
      <HomeMain />
    </Stage>
  );
}
