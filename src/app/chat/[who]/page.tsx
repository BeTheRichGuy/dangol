import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ChatRoom } from '@/components/chat/chat-room';
import { ENTER } from '@/components/scene/manifest';
import { Stage } from '@/components/stage';
import { CHAT_KEYS, isChatKey } from '@/lib/chat/characters';

export function generateStaticParams() {
  return CHAT_KEYS.map((who) => ({ who }));
}

export const metadata: Metadata = {
  title: 'Chat',
  robots: { index: false },
};

export default function ChatRoomPage({ params }: { params: Promise<{ who: string }> }) {
  return (
    <Stage backdrop={ENTER.poster} night>
      <Suspense fallback={null}>
        <Room params={params} />
      </Suspense>
    </Stage>
  );
}

async function Room({ params }: { params: Promise<{ who: string }> }) {
  const { who } = await params;
  if (!isChatKey(who)) notFound();
  return <ChatRoom who={who} />;
}
