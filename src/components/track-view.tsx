'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics/track';
import type { EventName } from '@/lib/analytics/events';

export function TrackView({ name, landing = false }: { name: EventName; landing?: boolean }) {
  useEffect(() => {
    if (landing) track('landing_view');
    track(name);
  }, [name, landing]);
  return null;
}
