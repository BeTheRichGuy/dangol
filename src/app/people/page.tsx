import { HomeTabs } from '@/components/account/home-parts';
import type { Metadata } from 'next';
import { PeopleView } from '@/components/account/people-view';
import { ENTER } from '@/components/scene/manifest';
import { Stage } from '@/components/stage';

export const metadata: Metadata = {
  title: 'My people',
  robots: { index: false },
};

export default function PeoplePage() {
  return (
    <Stage backdrop={ENTER.poster} night>
      <PeopleView />
      {}
      <HomeTabs active="me" />
    </Stage>
  );
}
