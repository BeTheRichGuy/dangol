import type { MetadataRoute } from 'next';
import { LANG_ALTERNATES } from '@/content/meta-by-locale';
import { indexingOpen, siteOrigin } from '@/lib/site-origin';

const PAGES: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/ko', priority: 0.9 },
  { path: '/ja', priority: 0.9 },
  { path: '/about', priority: 0.7 },
  { path: '/pricing', priority: 0.7 },
  { path: '/wont-read', priority: 0.5 },
  { path: '/privacy', priority: 0.3 },
  { path: '/terms', priority: 0.3 },
  { path: '/refund', priority: 0.3 },
];

const LANGUAGE_PAGES = new Set(['/', '/ko', '/ja']);

export default function sitemap(): MetadataRoute.Sitemap {
  if (!indexingOpen()) return [];
  const origin = siteOrigin();
  const abs = (path: string) => `${origin}${path === '/' ? '' : path}`;
  const languages = Object.fromEntries(Object.entries(LANG_ALTERNATES).map(([lang, path]) => [lang, abs(path)]));
  return PAGES.map(({ path, priority }) => ({
    url: abs(path),
    priority,
    ...(LANGUAGE_PAGES.has(path) ? { alternates: { languages } } : {}),
  }));
}
