'use client';

import { useLocale } from '@/components/locale-provider';
import { UI } from '@/content/ui';

export function SkipLink() {
  useLocale();
  return <a href="#main" className="skip-link">{UI.common.skipToContent}</a>;
}
