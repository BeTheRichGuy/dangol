import type { Metadata, Viewport } from 'next';
import { Hahmlet, Instrument_Sans, Lora, Nanum_Brush_Script, Noto_Serif_KR, Shippori_Mincho, Zen_Kaku_Gothic_New } from 'next/font/google';
import { OG_IMAGE } from '@/content/meta-by-locale';
import { UI } from '@/content/ui';
import { AccountProvider } from '@/components/account/account-provider';
import { LocaleProvider } from '@/components/locale-provider';
import { SkipLink } from '@/components/skip-link';
import { UtmCapture } from '@/components/utm-capture';
import { MetaPixel } from '@/components/meta-pixel';
import './globals.css';

import '@/assets/fonts/pretendard/pretendardvariable-dynamic-subset.css';

const display = Lora({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
});

const sans = Instrument_Sans({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-sans',
  display: 'swap',
});

const brush = Nanum_Brush_Script({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-nanum-brush',
  display: 'swap',
});

const hanja = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-noto-kr',
  display: 'swap',
  preload: false,
});

const serifKo = Hahmlet({ subsets: ['latin'], variable: '--font-hahmlet', display: 'swap', preload: false });
const sansJa = Zen_Kaku_Gothic_New({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-sans-ja', display: 'swap', preload: false });
const serifJa = Shippori_Mincho({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-serif-ja', display: 'swap', preload: false });

export const metadata: Metadata = {

  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'http://localhost:3000'),
  ),
  title: { default: UI.meta.title, template: UI.meta.titleTemplate },
  description: UI.meta.description,
  applicationName: UI.brand.name,

  robots: process.env.DANGOL_ALLOW_INDEX === '1' ? undefined : { index: false, follow: false },

  verification: { other: { 'naver-site-verification': '7d68d5e77fa0545161f144dbbf85ab505bb376ea' } },
  openGraph: {
    type: 'website',
    siteName: UI.brand.name,
    title: UI.meta.title,
    description: UI.meta.description,

    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: UI.meta.ogImageAlt }],
  },
  twitter: {
    card: 'summary_large_image',
    title: UI.meta.title,
    description: UI.meta.description,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',

  themeColor: '#FBF6EE',

  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${brush.variable} ${hanja.variable} ${serifKo.variable} ${sansJa.variable} ${serifJa.variable}`}
    >
      <body>
        <SkipLink />
        <UtmCapture />
        {}
        <MetaPixel />
        {}
        <AccountProvider>
          <LocaleProvider>{children}</LocaleProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
