import { HomeTabs } from '@/components/account/home-parts';
import type { Metadata } from 'next';
import { ChatList } from '@/components/chat/chat-list';
import { ENTER } from '@/components/scene/manifest';
import { Stage } from '@/components/stage';

export const metadata: Metadata = {
  title: 'Chat with the shrine',
  description: 'One-on-one chat with Yul, Yeon, Muk, and Mansin.',
  robots: { index: false },
};

export default function ChatPage() {
  return (
    <Stage backdrop={ENTER.poster} night>
      <ChatList />
      {}
      <HomeTabs active="chat" />
    </Stage>
  );
}
