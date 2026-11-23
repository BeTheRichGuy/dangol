import type { Locale } from '@/content/locale';

const TAIL = 'utm_source=instagram&utm_medium=bio&utm_campaign=launch&utm_content=link_in_bio';

export function igRedirect(l: Locale): Response {
  return new Response(null, {
    status: 307,
    headers: { Location: `/?l=${l}&${TAIL}`, 'Cache-Control': 'no-store' },
  });
}

const REUNION_TAIL = 'utm_source=instagram&utm_medium=bio&utm_campaign=reunion&utm_content=link_in_bio';

export function igReunionRedirect(l: Locale): Response {
  return new Response(null, {
    status: 307,
    headers: { Location: `/reunion?l=${l}&${REUNION_TAIL}`, 'Cache-Control': 'no-store' },
  });
}
