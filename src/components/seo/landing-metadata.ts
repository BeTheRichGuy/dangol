import type { Metadata } from 'next';
import { LANG_ALTERNATES, metaFor, OG_IMAGE } from '@/content/meta-by-locale';
import type { Locale } from '@/content/locale';

const OG_LOCALE = { ko: 'ko_KR', ja: 'ja_JP' } as const;

export function landingMetadata(locale: Exclude<Locale, 'en'>): Metadata {
  const meta = metaFor(locale);
  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: { canonical: LANG_ALTERNATES[locale], languages: LANG_ALTERNATES },
    openGraph: {
      type: 'website',
      siteName: 'DANGOL',
      locale: OG_LOCALE[locale],
      url: LANG_ALTERNATES[locale],
      title: meta.title,
      description: meta.description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: meta.ogImageAlt }],
    },
    twitter: { card: 'summary_large_image', title: meta.title, description: meta.description, images: [OG_IMAGE] },
  };
}
