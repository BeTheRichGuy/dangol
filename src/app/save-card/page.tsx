import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { UI as UI_EN } from '@/content/en/ui';
import { UI_JA } from '@/content/ja/ui';
import { UI_KO } from '@/content/ko/ui';
import { overlay } from '@/content/locale';

export const metadata: Metadata = { title: 'DANGOL', robots: { index: false, follow: false } };

const SHARE_BY_LOCALE = { en: UI_EN.result.share, ko: overlay(UI_EN, UI_KO).result.share, ja: overlay(UI_EN, UI_JA).result.share } as const;

const SAFE = /^[a-z0-9]{1,20}$/;

async function SaveCard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string).trim().toLowerCase() : '');
  const locale = one('l') === 'ko' || one('l') === 'ja' ? (one('l') as 'ko' | 'ja') : 'en';
  const t = SHARE_BY_LOCALE[locale];

  const q = new URLSearchParams();
  if (SAFE.test(one('t'))) q.set('t', one('t'));
  if (/^\d{1,7}$/.test(one('no'))) q.set('no', one('no'));
  if (locale !== 'en') q.set('l', locale);
  const src = `/api/card?${q.toString()}`;
  const download = `${src}${q.size ? '&' : ''}dl=1`;

  return (
    <main id="main" className="grid min-h-dvh content-center justify-items-center gap-4 bg-black px-4 py-8 text-center">
      <Image src={src} alt={t.cardAlt('')} width={540} height={960} unoptimized priority className="h-auto w-[min(82vw,340px)] rounded-lg" />
      <p className="m-0 max-w-[28ch] text-[0.9375rem] font-semibold text-white">{t.saveHold}</p>
      <a href={download} download className="dg-btn dg-btn--paper !min-h-12 !px-6">
        {t.save}
      </a>
    </main>
  );
}

export default function SaveCardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<main id="main" className="min-h-dvh bg-black" />}>
      <SaveCard searchParams={searchParams} />
    </Suspense>
  );
}
