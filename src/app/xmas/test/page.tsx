import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { XMAS_OPEN } from '@/lib/xmas/open';
import { TrackView } from '@/components/track-view';
import { XmasQuiz } from '@/components/xmas/xmas-quiz';
import { XMAS_QUIZ } from '@/content/ko/xmas-quiz';

export const metadata: Metadata = {
  title: XMAS_QUIZ.meta.title,
  description: XMAS_QUIZ.meta.description,
  robots: { index: false },
};

export default function XmasTestPage() {
  if (!XMAS_OPEN) notFound();
  return (
    <>
      <TrackView name="quiz_view" landing />
      <XmasQuiz />
    </>
  );
}
