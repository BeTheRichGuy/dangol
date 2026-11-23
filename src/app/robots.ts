import type { MetadataRoute } from 'next';
import { indexingOpen, siteOrigin } from '@/lib/site-origin';

export default function robots(): MetadataRoute.Robots {
  const open = indexingOpen();
  return {
    rules: open
      ? { userAgent: '*', allow: '/', disallow: ['/api/', '/auth/', '/admin', '/archive', '/people', '/save-card', '/type'] }
      : { userAgent: '*', allow: '/' },
    ...(open ? { sitemap: `${siteOrigin()}/sitemap.xml` } : {}),
  };
}
