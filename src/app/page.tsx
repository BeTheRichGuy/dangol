import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { LANG_ALTERNATES, metaFor, metaLocale, OG_IMAGE, typesFor } from '@/content/meta-by-locale';
import { UI } from '@/content/ui';
import type { TypeKey } from '@/lib/saju/types';
import { LinkLanding } from '@/components/flow/link-landing';
import { ENTER } from '@/components/scene/manifest';
import { Stage } from '@/components/stage';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { t, l } = await searchParams;

  const locale = metaLocale(l);
  const meta = metaFor(locale);
  const types = typesFor(locale);

  const alternates = { canonical: '/', languages: LANG_ALTERNATES };
  if (typeof t !== 'string' || !Object.hasOwn(types, t)) {
    if (locale === 'en') return { alternates };

    return {
      title: { absolute: meta.title },
      description: meta.description,
      alternates,
      openGraph: {
        type: 'website',
        siteName: UI.brand.name,
        title: meta.title,
        description: meta.description,
        images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: meta.ogImageAlt }],
      },
      twitter: { card: 'summary_large_image', title: meta.title, description: meta.description, images: [OG_IMAGE] },
    };
  }
  const profile = types[t as TypeKey];
  const image = { url: `/api/card?t=${profile.key}&og=1`, width: 1200, height: 630, alt: meta.typeCardAlt(profile.name) };
  return {
    title: { absolute: meta.typeTitle(profile.born) },
    description: meta.typeDescription(profile.born),
    alternates,
    openGraph: {
      title: meta.typeTitle(profile.born),
      description: meta.typeDescription(profile.born),
      images: [image],
    },
    twitter: { images: [image.url] },
  };
}

async function Connection() {
  await connection();
  return null;
}

export default function Home() {
  return (
    <Stage backdrop={ENTER.poster} night>
      <LinkLanding />
      <Suspense>
        <Connection />
      </Suspense>
    </Stage>
  );
}
