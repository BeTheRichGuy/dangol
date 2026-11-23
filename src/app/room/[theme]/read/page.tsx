import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ROOMS_COPY } from '@/content/en/rooms';
import { CHAPTER_ROOMS, isProductKey, usesChapters } from '@/lib/rooms/themes';
import { PaidReadingView } from '@/components/rooms/paid-reading-view';
import { ENTER } from '@/components/scene/manifest';
import { Stage } from '@/components/stage';

export function generateStaticParams() {
  return CHAPTER_ROOMS.map((theme) => ({ theme }));
}

export async function generateMetadata({ params }: { params: Promise<{ theme: string }> }): Promise<Metadata> {
  const { theme } = await params;
  if (!isProductKey(theme) || !usesChapters(theme)) return {};
  const room = theme === 'reunion' ? ROOMS_COPY.reunion : ROOMS_COPY.rooms[theme];

  return { title: room.title, description: room.line, robots: { index: false } };
}

export default function ReadPage({ params }: { params: Promise<{ theme: string }> }) {
  return (
    <Stage backdrop={ENTER.poster} night>
      <Suspense fallback={null}>
        <Read params={params} />
      </Suspense>
    </Stage>
  );
}

async function Read({ params }: { params: Promise<{ theme: string }> }) {
  const { theme } = await params;
  if (!isProductKey(theme) || !usesChapters(theme)) notFound();
  return <PaidReadingView room={theme} />;
}
