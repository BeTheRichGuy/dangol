import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { XMAS_OPEN } from '@/lib/xmas/open';
import { XmasRead } from '@/components/xmas/xmas-read';

export const metadata: Metadata = {
  title: '연의 크리스마스 그 사람 사주',
  robots: { index: false },
};

export default function Page() {
  if (!XMAS_OPEN || process.env.NODE_ENV === 'production') notFound();
  return <XmasRead />;
}
