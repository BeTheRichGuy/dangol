import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StoryDraft } from '@/components/story/story-draft';

export const metadata: Metadata = {
  title: 'Story draft',
  robots: { index: false },
};

export default function StoryDraftPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <StoryDraft />;
}
