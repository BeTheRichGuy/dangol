import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ROOMS_COPY } from '@/content/en/rooms';
import { PRODUCT_KEYS, isProductKey } from '@/lib/rooms/themes';
import { RoomView } from '@/components/rooms/room-view';
import { ENTER } from '@/components/scene/manifest';
import { Stage } from '@/components/stage';

export function generateStaticParams() {
  return PRODUCT_KEYS.map((theme) => ({ theme }));
}

export async function generateMetadata({ params }: { params: Promise<{ theme: string }> }): Promise<Metadata> {
  const { theme } = await params;
  if (!isProductKey(theme)) return {};
  const room = theme === 'reunion' ? ROOMS_COPY.reunion : ROOMS_COPY.rooms[theme];
  return { title: room.title, description: room.line };
}

export default function RoomPage({ params }: { params: Promise<{ theme: string }> }) {
  return (
    <Stage backdrop={ENTER.poster} night>
      <Suspense fallback={null}>
        <Room params={params} />
      </Suspense>
    </Stage>
  );
}

async function Room({ params }: { params: Promise<{ theme: string }> }) {
  const { theme } = await params;
  if (!isProductKey(theme)) notFound();
  return <RoomView room={theme} />;
}
