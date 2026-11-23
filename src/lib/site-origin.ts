export function siteOrigin(env: Record<string, string | undefined> = process.env): string {
  const set = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (set) return set.replace(/\/+$/, '');
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}

export function indexingOpen(env: Record<string, string | undefined> = process.env): boolean {
  return env.DANGOL_ALLOW_INDEX === '1';
}
